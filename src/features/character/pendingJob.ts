// 진행 중인 캐릭터 생성 Job 을 브라우저에 영속화한다.
// 새로고침/탭 종료로 폴링이 끊겨도, 다음 진입 시 job_id 로 폴링을 재개해
// SUCCEEDED 된 Job 을 캐릭터로 등록(회수)할 수 있게 한다.
// localStorage 를 쓰는 이유: 같은 탭 새로고침뿐 아니라 탭을 닫았다 다시 열어도 복구.

const STORAGE_KEY = "mongle:pendingCharacterJob";

export type PendingCharacterJob = {
  jobId: string;
  name: string;
  persona: string;
};

export function savePendingJob(job: PendingCharacterJob): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(job));
  } catch {
    // 저장 실패(quota/프라이빗 모드)는 치명적이지 않다 — 재개만 불가해질 뿐.
  }
}

export function loadPendingJob(): PendingCharacterJob | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) {
      return null;
    }
    const value = parsed as Record<string, unknown>;
    if (
      typeof value.jobId === "string" &&
      typeof value.name === "string" &&
      typeof value.persona === "string"
    ) {
      return { jobId: value.jobId, name: value.name, persona: value.persona };
    }
    return null;
  } catch {
    return null;
  }
}

export function clearPendingJob(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // 무시 — 다음 로드시 loadPendingJob 가 검증으로 걸러낸다.
  }
}

export function hasPendingJob(): boolean {
  return loadPendingJob() !== null;
}
