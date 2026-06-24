import axios from "axios";
import { apiClient } from "../../shared/api/client.js";
import { clearPendingJob, loadPendingJob, savePendingJob } from "./pendingJob.js";

// 백엔드 캐릭터 생성은 3단계 비동기 파이프라인이다.
//   1. (선택) source-images presigned PUT 발급 → S3 직접 업로드
//   2. generation-jobs 큐 등록 → 202 + job_id
//   3. generation-jobs/<id> 폴링 → SUCCEEDED 후 characters/ 로 등록
// 이 모듈은 그 네 번의 호출을 한 함수로 감싸 프론트가 동기처럼 쓰게 한다.

export type GeneratedCharacter = {
  characterId: string;
  name: string;
  genImgUrl: string;
  persona: string;
};

export type GenerateCharacterParams = {
  name: string;
  persona: string;
  personalityKeywords: string[];
  sourceImageFile?: File | null;
};

type PresignResponse = {
  source_img_id: string;
  object_key: string;
  upload: { url: string; headers: Record<string, string> };
  expires_at: string;
};

type JobCreateResponse = {
  job_id: string;
  status: string;
  estimated_seconds: number;
};

type JobStatus = "QUEUED" | "IN_PROGRESS" | "SUCCEEDED" | "FAILED" | "CONSUMED";

type JobStatusResponse = {
  job_id: string;
  status: JobStatus;
  result: { gen_img_url: string; persona: string } | null;
  created_at: string;
  updated_at: string;
};

type RegisterResponse = {
  character_id: string;
  name: string;
  gen_img_url: string;
  persona: string;
  created_at: string;
};

export type CharacterListItem = {
  characterId: string;
  name: string;
  genImgUrl: string;
  activeQuestCount: number;
};

type CharacterListResponse = {
  items: Array<{
    character_id: string;
    name: string;
    gen_img_url: string;
    active_quest_count: number;
  }>;
  page: { limit: number; next_cursor: string | null; has_next: boolean };
};

const ALLOWED_CONTENT_TYPES = new Set(["image/jpeg", "image/png"]);
const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 6 * 60 * 1000;

// 백엔드가 내려주는 error 코드를 사용자 친화적 한국어 메시지로 변환한다.
const ERROR_MESSAGES: Record<string, string> = {
  CHARACTER_LIMIT_EXCEEDED: "마을에 들어올 수 있는 친구는 최대 10명이에요.",
  // 정확한 안내는 dailyLimitMessage() 가 남은 시간을 계산해 동적으로 만든다(아래 fallback).
  DAILY_GENERATION_LIMIT_EXCEEDED: "오늘은 친구를 더 만들 수 없어요. 잠시 후 다시 시도해 주세요.",
  SOURCE_IMAGE_NOT_FOUND: "올린 사진을 찾을 수 없어요. 다시 시도해 주세요.",
  SOURCE_IMAGE_UPLOAD_EXPIRED: "사진 업로드 시간이 지났어요. 다시 올려 주세요.",
  STORAGE_NOT_CONFIGURED: "이미지 저장소가 아직 준비되지 않았어요.",
  JOB_NOT_FOUND: "생성 작업을 찾을 수 없어요. 다시 시도해 주세요.",
  JOB_NOT_SUCCEEDED: "친구 생성이 아직 끝나지 않았어요.",
  JOB_ALREADY_CONSUMED: "이미 마을에 들어온 친구예요.",
};

const FALLBACK_MESSAGE = "새 친구를 마을에 데려오지 못했어요. 잠시 후 다시 시도해 주세요.";

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// 일일 생성 한도는 서버 기준 로컬 자정(0시)에 리셋된다. 리셋까지 남은 분을 계산한다.
function minutesUntilDailyReset(): number {
  const now = new Date();
  const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
  return Math.max(1, Math.ceil((nextMidnight.getTime() - now.getTime()) / 60_000));
}

// "OO분 후" / "O시간 O분 후" 형태의 재시도 안내. 한도 초과 시 '내일' 대신 남은 시간을 보여준다.
export function retryAfterText(): string {
  const total = minutesUntilDailyReset();
  if (total < 60) return `${total}분 후에`;
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  return minutes === 0 ? `${hours}시간 후에` : `${hours}시간 ${minutes}분 후에`;
}

function dailyLimitMessage(): string {
  return `오늘은 친구를 더 만들 수 없어요. ${retryAfterText()} 다시 시도해 주세요.`;
}

function toFriendlyMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const code = error.response?.data?.error;
    if (code === "DAILY_GENERATION_LIMIT_EXCEEDED") {
      return dailyLimitMessage();
    }
    if (typeof code === "string" && ERROR_MESSAGES[code]) {
      return ERROR_MESSAGES[code];
    }
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return FALLBACK_MESSAGE;
}

// 1단계: 소스 이미지를 S3에 올리고 source_img_id 를 반환한다.
async function uploadSourceImage(file: File): Promise<string> {
  if (!ALLOWED_CONTENT_TYPES.has(file.type)) {
    throw new Error("프로필 사진은 JPG 또는 PNG만 올릴 수 있어요.");
  }

  const { data } = await apiClient.post<PresignResponse>("/characters/source-images/", {
    file_name: file.name,
    content_type: file.type,
    content_length: file.size,
  });

  const putResponse = await fetch(data.upload.url, {
    method: "PUT",
    headers: data.upload.headers,
    body: file,
  });
  if (!putResponse.ok) {
    throw new Error("프로필 사진을 업로드하지 못했어요. 다시 시도해 주세요.");
  }

  return data.source_img_id;
}

type JobOutcome = "SUCCEEDED" | "FAILED" | "CONSUMED" | "TIMEOUT";

// 3단계: 잡이 종료 상태에 도달할 때까지 폴링한다.
// 던지지 않고 결과를 반환해, 호출부가 "재개 가능 여부(TIMEOUT)"를 구분할 수 있게 한다.
type PollResult = {
  outcome: JobOutcome;
  result: { gen_img_url: string; persona: string } | null;
};

async function pollJob(jobId: string): Promise<PollResult> {
  const deadline = Date.now() + POLL_TIMEOUT_MS;

  while (Date.now() < deadline) {
    const { data } = await apiClient.get<JobStatusResponse>(
      `/characters/generation-jobs/${jobId}/`,
    );

    if (data.status === "SUCCEEDED") {
      return { outcome: "SUCCEEDED", result: data.result };
    }
    if (data.status === "FAILED") {
      return { outcome: "FAILED", result: null };
    }
    if (data.status === "CONSUMED") {
      // 이미 캐릭터로 등록된 잡 — 더 할 일 없음.
      return { outcome: "CONSUMED", result: null };
    }

    await delay(POLL_INTERVAL_MS);
  }

  return { outcome: "TIMEOUT", result: null };
}

// 4단계: SUCCEEDED 잡을 캐릭터로 등록(입주)하고, 영속화된 진행 상태를 비운다.
export async function registerCharacter(
  jobId: string,
  name: string,
  persona: string,
): Promise<GeneratedCharacter> {
  const { data: character } = await apiClient.post<RegisterResponse>("/characters/", {
    gen_job_id: jobId,
    name,
    persona,
  });
  clearPendingJob();
  return {
    characterId: character.character_id,
    name: character.name,
    genImgUrl: character.gen_img_url,
    persona: character.persona,
  };
}

// "입주하기" 전까지 보여줄 미리보기. 등록 전이라 characterId 가 아니라 jobId 를 들고 있다.
export type CharacterPreview = {
  jobId: string;
  name: string;
  genImgUrl: string;
  persona: string;
};

/**
 * 캐릭터 생성(이미지/페르소나)까지만 수행하고 **등록은 하지 않는다**.
 * 등록(입주)은 사용자가 미리보기를 확인하고 "입주하기"를 누를 때 registerCharacter 로 한다.
 * 그래서 재생성을 반복해도 마을에 고아 캐릭터가 등록되지 않는다.
 * 실패 시 항상 사용자 친화적 메시지를 담은 Error 를 던진다.
 */
export async function generateCharacterPreview(
  params: GenerateCharacterParams,
): Promise<CharacterPreview> {
  const { name, persona, personalityKeywords, sourceImageFile } = params;

  try {
    const sourceImgId = sourceImageFile ? await uploadSourceImage(sourceImageFile) : null;

    const { data: job } = await apiClient.post<JobCreateResponse>("/characters/generation-jobs/", {
      name,
      persona,
      personality_keywords: personalityKeywords,
      source_img_id: sourceImgId,
    });

    // 잡이 큐에 들어간 직후 영속화한다. 이 시점부터는 새로고침해도 재개 가능.
    savePendingJob({ jobId: job.job_id, name, persona });

    const { outcome, result } = await pollJob(job.job_id);
    if (outcome === "FAILED") {
      clearPendingJob();
      throw new Error("친구 그림을 그리는 데 실패했어요. 잠시 후 다시 시도해 주세요.");
    }
    if (outcome === "TIMEOUT") {
      // 진행 상태는 남겨둔다 — 다음 진입 시 재개할 수 있도록.
      throw new Error(
        "친구를 그리는 데 시간이 너무 오래 걸려요. 잠시 후 다시 들어와 확인해 주세요.",
      );
    }

    // 미리보기가 준비됐으니, 새로고침 재개(resume)로 자동 등록되지 않도록 진행 상태를 비운다.
    // 실제 등록은 "입주하기"에서만 한다.
    clearPendingJob();
    return {
      jobId: job.job_id,
      name,
      genImgUrl: result?.gen_img_url ?? "",
      persona: result?.persona ?? persona,
    };
  } catch (error) {
    throw new Error(toFriendlyMessage(error));
  }
}

/**
 * 새로고침/이탈로 중단됐던 생성 잡을 이어서 마무리한다.
 * - 진행 중 잡이 없으면 null.
 * - 이미 등록(CONSUMED)됐으면 진행 상태만 비우고 null(목록 새로고침이 보여줌).
 * - SUCCEEDED 면 등록해 캐릭터를 반환.
 * - FAILED/등록 거부 등 회복 불가면 진행 상태를 비우고 친화적 메시지로 throw.
 * - TIMEOUT(아직 생성 중)이면 진행 상태를 남겨두고 throw(다음에 또 재개).
 */
export async function resumePendingCharacter(): Promise<GeneratedCharacter | null> {
  const pending = loadPendingJob();
  if (!pending) {
    return null;
  }

  let outcome: JobOutcome;
  try {
    outcome = (await pollJob(pending.jobId)).outcome;
  } catch (error) {
    // 잡 조회 자체가 404(NOT_FOUND) 등으로 실패하면 더 살릴 수 없음.
    clearPendingJob();
    throw new Error(toFriendlyMessage(error));
  }

  if (outcome === "CONSUMED") {
    clearPendingJob();
    return null;
  }
  if (outcome === "FAILED") {
    clearPendingJob();
    throw new Error("이전에 만들던 친구를 완성하지 못했어요. 다시 시도해 주세요.");
  }
  if (outcome === "TIMEOUT") {
    // 아직 생성 중 — 진행 상태 유지, 다음 진입 때 재개.
    throw new Error("이전에 만들던 친구를 아직 그리는 중이에요. 잠시 후 다시 확인해 주세요.");
  }

  try {
    return await registerCharacter(pending.jobId, pending.name, pending.persona);
  } catch (error) {
    // 한도 초과/이미 소비/잡 없음 등 — 무한 재시도를 막기 위해 진행 상태를 비운다.
    clearPendingJob();
    throw new Error(toFriendlyMessage(error));
  }
}

export type GenerationQuota = { used: number; limit: number };

/** 오늘의 캐릭터 생성 횟수(used)와 일일 한도(limit)를 조회한다. */
export async function fetchGenerationQuota(): Promise<GenerationQuota> {
  const { data } = await apiClient.get<GenerationQuota>("/characters/generation-jobs/quota/");
  return data;
}

/** 현재 사용자의 활성 캐릭터 목록을 DB에서 불러온다. */
export async function fetchCharacters(): Promise<CharacterListItem[]> {
  const { data } = await apiClient.get<CharacterListResponse>("/characters/");
  return data.items.map((item) => ({
    characterId: item.character_id,
    name: item.name,
    genImgUrl: item.gen_img_url,
    activeQuestCount: item.active_quest_count,
  }));
}

/** 캐릭터를 soft delete(is_active=false)한다. 마지막 캐릭터면 409를 던진다. */
export async function deleteCharacter(characterId: string): Promise<void> {
  await apiClient.delete(`/characters/${characterId}/`);
}
