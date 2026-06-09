import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";
import {
  confirmEmailVerification,
  requestEmailVerification,
  signup as signupRequest,
  toUserMessage,
} from "./auth/api.js";
import { LoginModal } from "./auth/LoginModal.js";
import { MyPageWrapper } from "./auth/MyPageWrapper.js";
import { type AuthState, useAuthStore } from "./auth/store.js";
import { CharacterModal } from "./character/createCharacter.js";
import { type TodoCommitResult, TodoCreation } from "./components/createTodo/todoCreation.js";
import { PlannerChat } from "./components/plannerChat/plannerChat.js";

const GODOT_EXPORT_PATH = import.meta.env.VITE_GODOT_EXPORT_PATH ?? "/godot/index.html";
const API_BASE = import.meta.env.VITE_API_BASE ?? "";
const TODAY_LABEL = "2026.05.26 TUE";
const MAX_DAILY_APPLES = 20;
const DEMO_USER_ID = "00000000-0000-0000-0000-000000000001";

type FeatureId = "character" | "todo" | "planner";
type TodoStatus = "candidate" | "saved" | "done";

type Feature = {
  id: FeatureId;
  title: string;
  npcLine: string;
  meta: string;
};

type Resident = {
  id: string;
  name: string;
  personality: string;
  speechStyle: string;
  avatarUrl?: string;
};

type TodoItem = {
  id: string;
  title: string;
  dueDate: string;
  tags: string[];
  status: TodoStatus;
};

type Quest = {
  id: string;
  ownerId: string;
  ownerName: string;
  todoId: string;
  todoTitle: string;
  questText: string;
  done: boolean;
};

type SignupStep = "form" | "code" | "verified";

const FEATURES: Record<FeatureId, Feature> = {
  character: {
    id: "character",
    title: "새 주민 들이기",
    npcLine: "마을에 어울릴 새 친구를 같이 만들어볼까?",
    meta: "캐릭터 최대 10명 · 이미지 재생성 일 3회",
  },
  todo: {
    id: "todo",
    title: "오늘의 TODO 만들기",
    npcLine: "할 일을 적어주면 마을 친구들에게 퀘스트로 나눠줄게.",
    meta: "싱글턴 200자 · 멀티턴 600자 · 퀘스트 분배 일 5회",
  },
  planner: {
    id: "planner",
    title: "플래너 챗봇이랑 계획 짜기",
    npcLine: "목표가 흐릿하면 내가 질문하면서 일정으로 정리해줄게.",
    meta: "한국어 플랜 · 태그 추천 · 확인 후 저장",
  },
};

const INITIAL_RESIDENTS: Resident[] = [
  {
    id: "resident-tofu",
    name: "두부",
    personality: "차분한 기록 담당",
    speechStyle: "짧고 다정한 조언체",
    avatarUrl: "/assets/mongle_chief.png",
  },
  {
    id: "resident-kong",
    name: "콩이",
    personality: "활기찬 실행 담당",
    speechStyle: "밝게 응원하는 말투",
    avatarUrl: "/assets/mongle_chief.png",
  },
  {
    id: "resident-bambi",
    name: "밤비",
    personality: "느긋한 회고 담당",
    speechStyle: "부드럽게 묻는 말투",
    avatarUrl: "/assets/mongle_chief.png",
  },
];

const INITIAL_TODOS: TodoItem[] = [
  {
    id: "todo-1",
    title: "기획서 10분 정리",
    dueDate: "2026-05-26",
    tags: ["업무"],
    status: "saved",
  },
  {
    id: "todo-2",
    title: "운동 15분",
    dueDate: "2026-05-26",
    tags: ["건강"],
    status: "saved",
  },
];

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function buildQuest(todo: TodoItem, resident: Resident): Quest {
  return {
    id: createId("quest"),
    ownerId: resident.id,
    ownerName: resident.name,
    todoId: todo.id,
    todoTitle: todo.title,
    questText: `${resident.name}의 ${resident.personality.replace(" 담당", "")} 미션`,
    done: false,
  };
}

function buildApiUrl(path: string) {
  return `${API_BASE}${path}`;
}

async function postApiJson<T>(path: string, payload: unknown): Promise<T> {
  const response = await fetch(buildApiUrl(path), {
    method: "POST",
    headers: { "content-type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const record = body as { error?: string | { message?: string } };
    throw new Error(
      typeof record.error === "string"
        ? record.error
        : record.error?.message || "API 요청에 실패했어요.",
    );
  }

  if (body && typeof body === "object" && "status" in body && "result" in body) {
    return (body as { result: T }).result;
  }
  return body as T;
}
function App() {
  const [activeFeature, setActiveFeature] = useState<FeatureId | null>(null);
  const [dialogueOpen, setDialogueOpen] = useState(false);
  const [residents, setResidents] = useState<Resident[]>(INITIAL_RESIDENTS);
  const [todos, setTodos] = useState<TodoItem[]>(INITIAL_TODOS);
  const [quests, setQuests] = useState<Quest[]>(() =>
    INITIAL_TODOS.map((todo, index) =>
      buildQuest(todo, INITIAL_RESIDENTS[index % INITIAL_RESIDENTS.length]),
    ),
  );
  const [apples, setApples] = useState(12);
  const [cycles, setCycles] = useState(2);
  const [isFocusing, setIsFocusing] = useState(false);
  const [characterName, setCharacterName] = useState("몽글러");
  const [characterPersona, setCharacterPersona] = useState(
    "계획을 세우고 작은 실천을 응원하는 마을 주민",
  );
  const [characterKeywords, setCharacterKeywords] = useState("차분함, 응원, 계획형");
  const [selectedKeywordCategories, setSelectedKeywordCategories] = useState<string[]>([
    "차분한",
    "명랑한",
  ]);
  const [sourceImageName, setSourceImageName] = useState("");
  const [sourceImagePreview, setSourceImagePreview] = useState("");
  const [_generatedCharacterPreview, setGeneratedCharacterPreview] = useState("");
  const [notice, setNotice] = useState("오늘의 사과 보상은 20개까지 받을 수 있어요.");
  const [isBusy, setIsBusy] = useState(false);
  const [villageVersion, setVillageVersion] = useState(0);
  const [signupOpen, setSignupOpen] = useState(false);
  const [signupStep, setSignupStep] = useState<SignupStep>("form");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupCode, setSignupCode] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupPasswordConfirm, setSignupPasswordConfirm] = useState("");
  const [signupUserName, setSignupUserName] = useState("");
  const [signupJob, setSignupJob] = useState("");
  const [signupBirth, setSignupBirth] = useState("");
  const [signupServiceTermsAgreed, setSignupServiceTermsAgreed] = useState(false);
  const [signupPrivacyAgreed, setSignupPrivacyAgreed] = useState(false);
  const [signupAiConsent, setSignupAiConsent] = useState(false);
  const [signupMessage, setSignupMessage] = useState("");
  const [showMyPage, setShowMyPage] = useState(false);
  const authStatus = useAuthStore((state: AuthState) => state.status);
  const authUser = useAuthStore((state: AuthState) => state.user);
  const logoutSession = useAuthStore((state: AuthState) => state.logout);
  const [loginOpen, setLoginOpen] = useState(false);
  const [verificationToken, setVerificationToken] = useState("");

  useEffect(() => {
    void useAuthStore.getState().restoreSession();
  }, []);

  const active = useMemo(() => (activeFeature ? FEATURES[activeFeature] : null), [activeFeature]);
  const savedTodos = todos.filter((todo) => todo.status !== "candidate");
  const doneQuestCount = quests.filter((quest) => quest.done).length;
  const residentNames = residents.map((resident) => resident.name).join("|");
  const residentAvatars = JSON.stringify(residents.map((resident) => resident.avatarUrl || ""));
  const godotSrc = `${GODOT_EXPORT_PATH}?residents=${residents.length}&names=${encodeURIComponent(residentNames)}&avatars=${encodeURIComponent(residentAvatars)}&v=${villageVersion}`;

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) {
        return;
      }

      if (
        event.data?.type === "MONGLE_CHIEF_CLICKED" ||
        event.data?.type === "MONGLE_CHIEF_HOUSE_CLICKED"
      ) {
        setDialogueOpen(true);
      }

      if (event.data?.type === "MONGLE_FEATURE_SELECTED") {
        const feature = event.data.payload?.feature as FeatureId;
        if (feature in FEATURES) {
          setActiveFeature(feature);
        }
      }
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  function openFeature(feature: FeatureId) {
    setDialogueOpen(true);
    setActiveFeature(feature);
  }

  function toggleKeywordCategory(keyword: string) {
    setSelectedKeywordCategories((current) => {
      if (current.includes(keyword)) {
        return current.filter((item) => item !== keyword);
      }
      if (current.length >= 3) {
        setNotice("성격 카테고리는 최대 3개까지 선택할 수 있어요.");
        return current;
      }
      return [...current, keyword];
    });
  }

  function handleCommittedTodos(result: TodoCommitResult) {
    setTodos((current) => [...result.todos, ...current]);
    if (result.questPreviews.length === 0) {
      return;
    }

    const fallbackResident = residents[quests.length % residents.length] ?? INITIAL_RESIDENTS[0];
    const nextQuests = result.questPreviews.map((preview) => {
      const linkedResident =
        residents.find((resident) => resident.id === preview.characterId) ?? fallbackResident;
      return {
        id: preview.questId,
        ownerId: linkedResident.id,
        ownerName: linkedResident.name,
        todoId: preview.todoId,
        todoTitle: preview.todoTitle,
        questText: preview.content,
        done: false,
      };
    });
    setQuests((current) => [...nextQuests, ...current]);
  }

  async function createCharacter() {
    const name = characterName.trim();
    const persona = characterPersona.trim();
    if (!name || !persona) {
      setNotice("주민 이름과 페르소나를 모두 적어주세요.");
      return;
    }
    setIsBusy(true);
    try {
      const keywords = selectedKeywordCategories.slice(0, 3);
      const result = await postApiJson<{
        character_id: string;
        name: string;
        personality: string;
        speech_style: string;
        image_url?: string;
      }>("/api/v1/character", {
        user_id: "demo-user",
        name,
        persona,
        source_image_url: sourceImagePreview || null,
        personality_keywords: keywords,
      });
      if (!result.image_url) {
        throw new Error("AI 이미지 URL이 비어 있어 캐릭터를 생성하지 못했어요.");
      }
      const resident: Resident = {
        id: result.character_id,
        name: result.name,
        personality: result.personality,
        speechStyle: result.speech_style,
        avatarUrl: result.image_url.startsWith("http")
          ? result.image_url
          : buildApiUrl(result.image_url),
      };
      setResidents((current) => [...current, resident].slice(0, 10));
      setGeneratedCharacterPreview(resident.avatarUrl || "");
      setNotice(`${resident.name} 주민이 몽글마을에 들어왔어요.`);
      setVillageVersion((current) => current + 1);
      setActiveFeature(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "원인 미상";
      setNotice(`캐릭터 생성 실패: ${message}`);
    } finally {
      setIsBusy(false);
    }
  }

  function handleSourceImageUpload(file: File | undefined) {
    if (!file) {
      return;
    }
    if (!file.type.startsWith("image/")) {
      setNotice("이미지 파일만 업로드할 수 있어요.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setSourceImageName(file.name);
      setSourceImagePreview(String(reader.result || ""));
      setGeneratedCharacterPreview("");
      setNotice("애착인형 사진을 불러왔어요. 이 이미지를 기반으로 주민을 만들게요.");
    };
    reader.readAsDataURL(file);
  }

  function toggleQuest(questId: string) {
    const quest = quests.find((item) => item.id === questId);
    if (!quest) {
      return;
    }

    setQuests((current) =>
      current.map((item) => (item.id === questId ? { ...item, done: !item.done } : item)),
    );
    setTodos((current) =>
      current.map((todo) =>
        todo.id === quest.todoId ? { ...todo, status: quest.done ? "saved" : "done" } : todo,
      ),
    );

    if (!quest.done) {
      setApples((current) => Math.min(MAX_DAILY_APPLES, current + 1));
      setNotice(`${quest.ownerName}의 퀘스트 완료! 사과 1개를 받았어요.`);
    } else {
      setApples((current) => Math.max(0, current - 1));
      setNotice("퀘스트 완료를 취소했어요.");
    }
  }

  function toggleFocus() {
    setIsFocusing((current) => !current);
    setNotice(isFocusing ? "집중 타이머를 잠시 멈췄어요." : "25분 집중을 시작했어요.");
  }

  function resetFocus() {
    setIsFocusing(false);
    setCycles(0);
    setNotice("오늘의 집중 사이클을 초기화했어요.");
  }

  function ensureSignupRequiredFields() {
    if (
      !signupEmail.trim() ||
      !signupPassword ||
      !signupPasswordConfirm ||
      !signupUserName.trim()
    ) {
      setSignupMessage("이메일, 비밀번호, 비밀번호 확인, 닉네임을 모두 입력해 주세요.");
      return false;
    }
    if (!signupServiceTermsAgreed || !signupPrivacyAgreed) {
      setSignupMessage("필수 이용약관과 개인정보 수집·이용에 동의해야 가입할 수 있어요.");
      return false;
    }
    if (signupPassword !== signupPasswordConfirm) {
      setSignupMessage("비밀번호 확인이 일치하지 않아요.");
      return false;
    }
    return true;
  }

  async function requestSignupEmailVerification() {
    if (!signupEmail.trim()) {
      setSignupMessage("이메일을 먼저 입력해 주세요.");
      return;
    }

    setIsBusy(true);
    setSignupMessage("");
    try {
      await requestEmailVerification(signupEmail.trim());
      setSignupStep("code");
      setSignupMessage("인증 코드를 발송했어요. Django 콘솔 로그에서 코드를 확인해 주세요.");
    } catch (error) {
      setSignupMessage(toUserMessage(error));
    } finally {
      setIsBusy(false);
    }
  }

  async function confirmSignupEmailVerification() {
    if (!signupCode.trim()) {
      setSignupMessage("인증 코드를 입력해 주세요.");
      return;
    }

    setIsBusy(true);
    setSignupMessage("");
    try {
      const result = await confirmEmailVerification(
        signupEmail.trim(),
        signupCode.trim().toUpperCase(),
      );
      setVerificationToken(result.verification_token);
      setSignupStep("verified");
      setSignupMessage("이메일 인증이 완료됐어요. 입력값 확인 후 가입을 완료해 주세요.");
    } catch (error) {
      setSignupMessage(toUserMessage(error));
    } finally {
      setIsBusy(false);
    }
  }

  async function submitSignup() {
    if (!ensureSignupRequiredFields()) {
      return;
    }
    if (signupStep !== "verified") {
      setSignupMessage("이메일 인증을 먼저 완료해 주세요.");
      return;
    }

    setIsBusy(true);
    setSignupMessage("");
    try {
      const user = await signupRequest({
        email: signupEmail.trim(),
        password: signupPassword,
        user_name: signupUserName.trim(),
        job: signupJob.trim(),
        birth: signupBirth || "",
        is_aiconsent: signupAiConsent,
        verification_token: verificationToken,
      });
      setSignupOpen(false);
      setNotice(`${user.user_name}님 가입 완료! 시작 토큰 ${user.token_balance}개가 지급됐어요.`);
      setLoginOpen(true);
    } catch (error) {
      setSignupMessage(toUserMessage(error));
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <main className="appShell">
      <iframe
        className="godotLayer"
        title="몽글마을 Godot 배경 레이어"
        src={godotSrc}
        allow="fullscreen; gamepad; autoplay"
      />
      <div className="shadeLayer" aria-hidden="true" />

      <header className="townNav">
        <nav aria-label="몽글마을 메뉴">
          <button type="button" onClick={() => setNotice("이장님 메뉴에서 기능을 선택해보세요.")}>
            TOWN INFO
          </button>
          <button type="button" onClick={() => openFeature("character")}>
            RESIDENTS
          </button>
          <button type="button" onClick={() => setDialogueOpen((current) => !current)}>
            SETTINGS
          </button>
        </nav>
        <h1>몽글마을</h1>
        <div className="navUserArea">
          {authStatus === "authenticated" && authUser ? (
            <>
              <button type="button" className="loginButton" onClick={() => setShowMyPage(true)}>
                {authUser.userName}님 · 마이페이지
              </button>
              <button type="button" className="loginButton" onClick={() => void logoutSession()}>
                로그아웃
              </button>
            </>
          ) : authStatus === "anonymous" ? (
            <button type="button" className="loginButton" onClick={() => setLoginOpen(true)}>
              로그인 / 회원가입
            </button>
          ) : null}
        </div>
      </header>

      <div className="leftRail">
        <section className="focusPanel" aria-label="집중 시간">
          <div className="sunBadge">☀</div>
          <strong>{isFocusing ? "24:59" : "25:00"}</strong>
          <span>{isFocusing ? "FOCUSING" : "FOCUS TIME"}</span>
          <div className="focusActions">
            <button type="button" onClick={toggleFocus}>
              {isFocusing ? "PAUSE" : "START"}
            </button>
            <button type="button" onClick={resetFocus}>
              RESET
            </button>
          </div>
          <small>{cycles} / 4 cycles</small>
        </section>

        <aside className="residentPanel" aria-label="마을 주민">
          <b>RESIDENTS {residents.length}/10</b>
          <div>
            {residents.slice(0, 8).map((resident) => (
              <span key={resident.id}>
                {resident.avatarUrl ? <img src={resident.avatarUrl} alt="" /> : null}
                {resident.name}
              </span>
            ))}
          </div>
        </aside>

        <aside className="noticeBubble">
          <b>알림</b>
          <span>{notice}</span>
        </aside>

        <div className="appleCounter" role="img" aria-label="사과 보상">
          <span>🍎</span>
          <b>{apples}</b>
        </div>
      </div>

      <aside className="questPanel" aria-label="오늘의 퀘스트">
        <div className="panelHeader">
          <span>QUEST TODO</span>
          <b>{TODAY_LABEL}</b>
        </div>
        <ul>
          {quests.slice(0, 8).map((quest) => (
            <li key={quest.id} className={quest.done ? "isDone" : ""}>
              <button
                type="button"
                className="checkButton"
                aria-label={`${quest.todoTitle} 완료 전환`}
                onClick={() => toggleQuest(quest.id)}
              >
                {quest.done ? "✓" : "□"}
              </button>
              <div>
                <b>{quest.ownerName}</b>
                <p>{quest.todoTitle}</p>
                <small>{quest.questText}</small>
              </div>
            </li>
          ))}
        </ul>
        <button type="button" onClick={() => openFeature("todo")}>
          퀘스트 추가
        </button>
      </aside>

      {dialogueOpen ? (
        <section className="dialogueBox" aria-label="마을 이장님 대화">
          <img className="chiefPortrait" src="/assets/mongle_chief.png" alt="몽글마을 이장님" />
          <div className="dialogueText">
            <span>몽글이장님</span>
            <p>안녕! 오늘은 어떤 걸 먼저 정리해볼까?</p>
            <small>
              완료 {doneQuestCount}개 · TODO {savedTodos.length}개 · 주민 {residents.length}명
            </small>
          </div>
          <div className="dialogueOptions">
            {Object.values(FEATURES).map((feature) => (
              <button type="button" key={feature.id} onClick={() => openFeature(feature.id)}>
                <b>{feature.title}</b>
                <span>{feature.npcLine}</span>
              </button>
            ))}
          </div>
        </section>
      ) : (
        <button type="button" className="talkButton" onClick={() => setDialogueOpen(true)}>
          이장님과 대화
        </button>
      )}

      {active ? (
        <div className="modalBackdrop" role="presentation">
          <section
            className={`featureModal${activeFeature === "character" ? " characterModal" : ""}${activeFeature === "planner" ? " plannerModalShell" : ""}${activeFeature === "todo" ? " todoModalShell" : ""}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="feature-title"
          >
            {activeFeature === "planner" || activeFeature === "todo" ? (
              <button
                type="button"
                className={`closeButton ${activeFeature === "planner" ? "plannerCloseButton" : "todoCloseButton"}`}
                onClick={() => setActiveFeature(null)}
                aria-label="닫기"
              >
                ×
              </button>
            ) : null}
            {activeFeature !== "character" &&
            activeFeature !== "planner" &&
            activeFeature !== "todo" ? (
              <>
                <button
                  type="button"
                  className="closeButton"
                  onClick={() => setActiveFeature(null)}
                  aria-label="닫기"
                >
                  ×
                </button>
                <p className="modalKicker">MONGLE VILLAGE</p>
                <h2 id="feature-title">{active.title}</h2>
                <p className="modalLine">{active.npcLine}</p>
                <span className="featureMeta">{active.meta}</span>
              </>
            ) : null}

            {activeFeature === "character" ? (
              <CharacterModal
                residents={residents}
                sourceImagePreview={sourceImagePreview}
                sourceImageName={sourceImageName}
                characterName={characterName}
                characterPersona={characterPersona}
                characterKeywords={characterKeywords}
                selectedKeywordCategories={selectedKeywordCategories}
                isBusy={isBusy}
                onImageUpload={handleSourceImageUpload}
                onNameChange={setCharacterName}
                onPersonaChange={setCharacterPersona}
                onKeywordsChange={setCharacterKeywords}
                onToggleKeyword={toggleKeywordCategory}
                onSubmit={createCharacter}
                onClose={() => setActiveFeature(null)}
              />
            ) : null}

            {activeFeature === "todo" ? (
              <TodoCreation
                apiBase={API_BASE}
                userId={DEMO_USER_ID}
                savedTodos={savedTodos}
                onNotice={setNotice}
                onTodosSaved={handleCommittedTodos}
              />
            ) : null}

            {activeFeature === "planner" ? (
              <PlannerChat
                apiBase={API_BASE}
                userId={DEMO_USER_ID}
                onNotice={setNotice}
                onTodosSaved={handleCommittedTodos}
              />
            ) : null}
          </section>
        </div>
      ) : null}

      {signupOpen ? (
        <div className="modalBackdrop" role="presentation">
          <section
            className="featureModal signupModal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="signup-title"
          >
            <button
              type="button"
              className="closeButton"
              onClick={() => setSignupOpen(false)}
              aria-label="닫기"
            >
              x
            </button>
            <p className="modalKicker">MONGLE ACCOUNT</p>
            <h2 id="signup-title">회원가입</h2>
            <p className="modalLine">
              이메일 인증 후 모든 입력값을 확인해 몽글마을 계정을 만들어요.
            </p>

            <div className="signupSheet">
              <label>
                이메일
                <span className="inlineAction">
                  <input
                    type="email"
                    value={signupEmail}
                    onChange={(event) => {
                      setSignupEmail(event.target.value);
                      setSignupStep("form");
                    }}
                    placeholder="user@example.com"
                  />
                  <button type="button" onClick={requestSignupEmailVerification} disabled={isBusy}>
                    코드 발송
                  </button>
                </span>
              </label>
              <label>
                인증 코드
                <span className="inlineAction">
                  <input
                    value={signupCode}
                    maxLength={6}
                    onChange={(event) => setSignupCode(event.target.value.toUpperCase())}
                    placeholder="ABCDEF"
                  />
                  <button
                    type="button"
                    onClick={confirmSignupEmailVerification}
                    disabled={isBusy || signupStep === "form"}
                  >
                    인증 확인
                  </button>
                </span>
              </label>
              <div className="signupGrid">
                <label>
                  비밀번호
                  <input
                    type="password"
                    value={signupPassword}
                    onChange={(event) => setSignupPassword(event.target.value)}
                    placeholder="8~16자, 2종 이상 조합"
                  />
                </label>
                <label>
                  비밀번호 확인
                  <input
                    type="password"
                    value={signupPasswordConfirm}
                    onChange={(event) => setSignupPasswordConfirm(event.target.value)}
                  />
                </label>
              </div>
              <label>
                닉네임
                <input
                  value={signupUserName}
                  maxLength={8}
                  onChange={(event) => setSignupUserName(event.target.value)}
                  placeholder="한글/영문/숫자 2~8자"
                />
              </label>
              <div className="signupGrid">
                <label>
                  직업
                  <input
                    value={signupJob}
                    onChange={(event) => setSignupJob(event.target.value)}
                    placeholder="선택"
                  />
                </label>
                <label>
                  생년월일
                  <input
                    type="date"
                    value={signupBirth}
                    onChange={(event) => setSignupBirth(event.target.value)}
                  />
                </label>
              </div>

              <div className="termsBox">
                <label>
                  <input
                    type="checkbox"
                    checked={signupServiceTermsAgreed}
                    onChange={(event) => setSignupServiceTermsAgreed(event.target.checked)}
                  />
                  이용약관에 동의합니다. (필수)
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={signupPrivacyAgreed}
                    onChange={(event) => setSignupPrivacyAgreed(event.target.checked)}
                  />
                  개인정보 수집·이용에 동의합니다. (필수)
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={signupAiConsent}
                    onChange={(event) => setSignupAiConsent(event.target.checked)}
                  />
                  AI 학습 및 통계 활용에 동의합니다. (선택)
                </label>
              </div>

              {signupMessage ? <p className="signupMessage">{signupMessage}</p> : null}

              <button
                type="button"
                className="primaryButton"
                onClick={submitSignup}
                disabled={isBusy}
              >
                {isBusy ? "처리 중..." : "확인"}
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {showMyPage ? (
        <MyPageWrapper
          residents={residents}
          onClose={() => setShowMyPage(false)}
          onNotice={setNotice}
        />
      ) : null}

      <LoginModal
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        onSwitchToSignup={() => {
          setLoginOpen(false);
          setSignupOpen(true);
        }}
      />
    </main>
  );
}

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element not found");
createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
