import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LoginModal } from "../features/auth/LoginModal.js";
import { ResetPasswordModal } from "../features/auth/ResetPasswordModal.js";
import { SignupModal } from "../features/auth/SignupModal.js";
import { type AuthState, useAuthStore } from "../features/auth/store.js";
import { CalendarBulletinBoard } from "../features/calendar/CalendarBulletinBoard.js";
import { CalendarModal } from "../features/calendar/CalendarModal.js";
import { CharacterModal } from "../features/character/createCharacter.js";
import { FeedModal } from "../features/feed/FeedModal.js";
import { MyPageWrapper } from "../features/my-page/MyPageWrapper.js";
import { PlannerChat } from "../features/planner-chat/plannerChat.js";
import { PomodoroHud } from "../features/pomodoro/PomodoroHud.js";
import { type TodoCommitResult, TodoCreation } from "../features/todo/todoCreation.js";
import { PhaserVillage } from "../features/village/PhaserVillage.js";
import { apiClient } from "../shared/api/client.js";
import { FEATURES, type FeatureId } from "./featureRegistry.js";

const API_BASE = import.meta.env.VITE_API_BASE ?? "";
const TODAY_LABEL = "2026.05.26 TUE";
const MAX_DAILY_APPLES = 20;

type TodoStatus = "candidate" | "saved" | "done";

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

function buildApiUrl(path: string) {
  return `${API_BASE}${path}`;
}
export function App() {
  const [activeFeature, setActiveFeature] = useState<FeatureId | null>(null);
  const [dialogueOpen, setDialogueOpen] = useState(false);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [apples, setApples] = useState(12);
  const [characterName, setCharacterName] = useState("");
  const [characterPersona, setCharacterPersona] = useState("");
  const [selectedKeywordCategories, setSelectedKeywordCategories] = useState<string[]>([]);
  const [sourceImageName, setSourceImageName] = useState("");
  const [sourceImagePreview, setSourceImagePreview] = useState("");
  const [notice, setNotice] = useState("오늘의 사과 보상은 20개까지 받을 수 있어요.");
  const [isBusy, setIsBusy] = useState(false);
  const [villageVersion, setVillageVersion] = useState(0);
  const [signupOpen, setSignupOpen] = useState(false);
  const [resetPwOpen, setResetPwOpen] = useState(false);
  const [showMyPage, setShowMyPage] = useState(false);
  const authStatus = useAuthStore((state: AuthState) => state.status);
  const authUser = useAuthStore((state: AuthState) => state.user);
  const logoutSession = useAuthStore((state: AuthState) => state.logout);
  const [loginOpen, setLoginOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [feedOpen, setFeedOpen] = useState(false);
  const [characterSetupOpen, setCharacterSetupOpen] = useState(false);

  const overlayOpenRef = useRef(false);
  useEffect(() => {
    overlayOpenRef.current =
      loginOpen ||
      signupOpen ||
      resetPwOpen ||
      showMyPage ||
      characterSetupOpen ||
      calendarOpen ||
      feedOpen;
  }, [loginOpen, signupOpen, resetPwOpen, showMyPage, characterSetupOpen, calendarOpen, feedOpen]);

  useEffect(() => {
    void useAuthStore.getState().restoreSession();
  }, []);

  useEffect(() => {
    if (authStatus === "authenticated" && authUser?.hasCharacter === false) {
      setCharacterSetupOpen(true);
    }
  }, [authStatus, authUser]);

  const active = useMemo(() => (activeFeature ? FEATURES[activeFeature] : null), [activeFeature]);
  const savedTodos = todos.filter((todo) => todo.status !== "candidate");
  const doneQuestCount = quests.filter((quest) => quest.done).length;
  const openVillageDialogue = useCallback(() => {
    setDialogueOpen(true);
  }, []);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) {
        return;
      }

      if (overlayOpenRef.current) return;

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

    const fallbackResident = residents[quests.length % residents.length] ?? residents[0];
    if (!fallbackResident) return;
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

      const { data: result } = await apiClient.post<{
        character_id: string;
        name: string;
        personality: string;
        speech_style: string;
        image_url?: string;
      }>("/characters/generate/", {
        name,
        persona,
        source_image_url: sourceImagePreview || null,
        personality_keywords: keywords,
      });
      if (!result.image_url) {
        throw new Error("친구 그림을 그리는 데 실패했어요. 잠시 후 다시 시도해 주세요.");
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
      setNotice(`${resident.name} 주민이 몽글마을에 들어왔어요.`);
      setVillageVersion((current) => current + 1);
      setCharacterName("");
      setCharacterPersona("");
      setSelectedKeywordCategories([]);
      setSourceImagePreview("");
      setSourceImageName("");
      useAuthStore.setState((state) => ({
        user: state.user ? { ...state.user, hasCharacter: true } : null,
      }));
      setCharacterSetupOpen(false);
      setActiveFeature(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "원인 미상";
      setNotice(`새 친구를 마을에 데려오지 못했어요. ${message}`);
    } finally {
      setIsBusy(false);
    }
  }

  function handleSourceImageUpload(file: File | undefined) {
    if (!file) {
      setSourceImageName("");
      setSourceImagePreview("");
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

  return (
    <main className="appShell">
      <PhaserVillage
        residents={residents}
        reloadKey={villageVersion}
        onOpenDialogue={openVillageDialogue}
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
          <button
            type="button"
            className="feedIconButton"
            aria-label="몽글마을 피드 열기"
            onClick={() => setFeedOpen(true)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <rect
                x="6"
                y="2.5"
                width="12"
                height="19"
                rx="2.5"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path d="M10 5.5h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M10.5 18.5h3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
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

      <CalendarBulletinBoard todos={todos} onOpen={() => setCalendarOpen(true)} />

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
            {activeFeature === "planner" ? (
              <button
                type="button"
                className="closeButton plannerCloseButton"
                onClick={() => setActiveFeature(null)}
                aria-label="닫기"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                </svg>
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
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                  </svg>
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
                selectedKeywordCategories={selectedKeywordCategories}
                isBusy={isBusy}
                onImageUpload={handleSourceImageUpload}
                onNameChange={setCharacterName}
                onPersonaChange={setCharacterPersona}
                onToggleKeyword={toggleKeywordCategory}
                onSubmit={createCharacter}
                onClose={() => setActiveFeature(null)}
              />
            ) : null}

            {activeFeature === "todo" ? (
              <TodoCreation
                apiBase={API_BASE}
                savedTodos={savedTodos}
                onNotice={setNotice}
                onTodosSaved={handleCommittedTodos}
                onClose={() => setActiveFeature(null)}
              />
            ) : null}

            {activeFeature === "planner" ? (
              <PlannerChat
                apiBase={API_BASE}
                onNotice={setNotice}
                onTodosSaved={handleCommittedTodos}
              />
            ) : null}
          </section>
        </div>
      ) : null}

      <SignupModal
        open={signupOpen}
        onClose={() => {
          setSignupOpen(false);
          setLoginOpen(true);
        }}
        onComplete={(notice) => {
          setSignupOpen(false);
          setNotice(notice);
          setLoginOpen(true);
        }}
      />

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
        onResetPw={() => {
          setLoginOpen(false);
          setResetPwOpen(true);
        }}
      />

      <ResetPasswordModal
        open={resetPwOpen}
        onClose={() => {
          setResetPwOpen(false);
          setLoginOpen(true);
        }}
        onComplete={(notice) => {
          setResetPwOpen(false);
          setNotice(notice);
          setLoginOpen(true);
        }}
      />

      {characterSetupOpen ? (
        <div className="modalBackdrop" role="presentation">
          <section className="featureModal characterModal" role="dialog" aria-modal="true">
            <CharacterModal
              residents={residents}
              sourceImagePreview={sourceImagePreview}
              sourceImageName={sourceImageName}
              characterName={characterName}
              characterPersona={characterPersona}
              selectedKeywordCategories={selectedKeywordCategories}
              isBusy={isBusy}
              onImageUpload={handleSourceImageUpload}
              onNameChange={setCharacterName}
              onPersonaChange={setCharacterPersona}
              onToggleKeyword={toggleKeywordCategory}
              onSubmit={createCharacter}
              onClose={() => {}}
            />
          </section>
        </div>
      ) : null}

      <CalendarModal
        isOpen={calendarOpen}
        onClose={() => setCalendarOpen(false)}
        isAuthenticated={authStatus === "authenticated"}
        onOpenLogin={() => {
          setCalendarOpen(false);
          setLoginOpen(true);
        }}
      />

      <PomodoroHud />

      {feedOpen ? (
        // biome-ignore lint/a11y/noStaticElementInteractions: backdrop click-to-dismiss is intentional UX
        <div
          className="modalBackdrop"
          role="presentation"
          onClick={(event) => {
            if (event.target === event.currentTarget) setFeedOpen(false);
          }}
        >
          <FeedModal onClose={() => setFeedOpen(false)} />
        </div>
      ) : null}
    </main>
  );
}
