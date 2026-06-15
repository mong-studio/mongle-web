import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LoginModal } from "../features/auth/LoginModal.js";
import { type AuthState, useAuthStore } from "../features/auth/store.js";
import { PomodoroHud } from "../features/pomodoro/PomodoroHud.js";
import { HudTodoList } from "../features/todo/HudTodoList.js";
import type { TodoCommitResult, TodoItem } from "../features/todo/todoCreation.js";
import { PhaserVillage } from "../features/village/PhaserVillage.js";
import { apiClient } from "../shared/api/client.js";
import { FEATURES, type FeatureId } from "./featureRegistry.js";
import type { Resident, TodoTagColor } from "./model/appTypes.js";
import { AppHeader } from "./ui/AppHeader.js";
import { AppModalLayer } from "./ui/AppModalLayer.js";
import { FeatureModalHost } from "./ui/FeatureModalHost.js";
import { HudButtonGroup } from "./ui/HudButtonGroup/HudButtonGroup.js";
import { NoticeToast } from "./ui/NoticeToast.js";
import { ResidentPanel } from "./ui/ResidentPanel.js";
import { VillageDialogue } from "./ui/VillageDialogue.js";

const API_BASE = import.meta.env.VITE_API_BASE ?? "";
const MAX_DAILY_APPLES = 20;

const INITIAL_TODOS: TodoItem[] = [
  {
    id: "todo-1",
    title: "아침 스트레칭",
    dueDate: "2026-05-26",
    tags: ["건강"],
    status: "saved",
  },
  {
    id: "todo-2",
    title: "마을 배달 도와주기",
    dueDate: "2026-05-26",
    tags: ["작업"],
    status: "done",
  },
  {
    id: "todo-3",
    title: "채집 10개 하기",
    dueDate: "2026-05-26",
    tags: ["작업"],
    status: "saved",
  },
  {
    id: "todo-4",
    title: "책 20분 읽기",
    dueDate: "2026-05-26",
    tags: ["성장"],
    status: "saved",
  },
  {
    id: "todo-5",
    title: "일기 쓰기",
    dueDate: "2026-05-26",
    tags: ["성장"],
    status: "saved",
  },
];

function buildApiUrl(path: string) {
  return `${API_BASE}${path}`;
}

export function App() {
  const [activeFeature, setActiveFeature] = useState<FeatureId | null>(null);
  const [dialogueOpen, setDialogueOpen] = useState(false);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [todos, setTodos] = useState<TodoItem[]>(INITIAL_TODOS);
  const [todoTagColors, setTodoTagColors] = useState<Record<string, string>>({});
  const [apples, setApples] = useState(12);
  const [characterName, setCharacterName] = useState("");
  const [characterPersona, setCharacterPersona] = useState("");
  const [selectedKeywordCategories, setSelectedKeywordCategories] = useState<string[]>([]);
  const [sourceImageName, setSourceImageName] = useState("");
  const [sourceImagePreview, setSourceImagePreview] = useState("");
  const [notice, setNotice] = useState("오늘의 사과 보상은 20개까지 받을 수 있어요.");
  const [noticeVisible, setNoticeVisible] = useState(true);
  const noticeTimerRef = useRef<number | null>(null);
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
  const [reflectionOpen, setReflectionOpen] = useState(false);

  const overlayOpenRef = useRef(false);
  overlayOpenRef.current =
    loginOpen ||
    signupOpen ||
    resetPwOpen ||
    showMyPage ||
    characterSetupOpen ||
    calendarOpen ||
    feedOpen ||
    activeFeature !== null;

  useEffect(() => {
    void useAuthStore.getState().restoreSession();
  }, []);

  const clearNoticeTimer = useCallback(() => {
    if (noticeTimerRef.current) {
      window.clearTimeout(noticeTimerRef.current);
      noticeTimerRef.current = null;
    }
  }, []);

  const hideNoticeSoon = useCallback(() => {
    clearNoticeTimer();
    noticeTimerRef.current = window.setTimeout(() => {
      setNoticeVisible(false);
      noticeTimerRef.current = null;
    }, 2800);
  }, [clearNoticeTimer]);

  const showNotice = useCallback(
    (message: string) => {
      setNotice(message);
      setNoticeVisible(Boolean(message));
      if (!message) {
        clearNoticeTimer();
        return;
      }
      hideNoticeSoon();
    },
    [clearNoticeTimer, hideNoticeSoon],
  );

  useEffect(() => {
    hideNoticeSoon();
    return clearNoticeTimer;
  }, [clearNoticeTimer, hideNoticeSoon]);

  useEffect(() => {
    if (notice) {
      return;
    }
    setNoticeVisible(false);
  }, [notice]);

  useEffect(() => {
    if (authStatus === "authenticated" && authUser?.hasCharacter === false) {
      setCharacterSetupOpen(true);
    }
  }, [authStatus, authUser]);

  const savedTodos = todos.filter((todo) => todo.status !== "candidate");
  const doneTodoCount = savedTodos.filter((todo) => todo.status === "done").length;

  const resetCharacterDraft = useCallback(() => {
    setCharacterName("");
    setCharacterPersona("");
    setSelectedKeywordCategories([]);
    setSourceImagePreview("");
    setSourceImageName("");
  }, []);

  const closeActiveFeature = useCallback(() => {
    if (activeFeature === "character") {
      resetCharacterDraft();
    }
    setActiveFeature(null);
  }, [activeFeature, resetCharacterDraft]);

  const closeCharacterSetup = useCallback(() => {
    resetCharacterDraft();
    setCharacterSetupOpen(false);
  }, [resetCharacterDraft]);

  const openVillageDialogue = useCallback(() => {
    if (!overlayOpenRef.current) setDialogueOpen(true);
  }, []);

  const openVillageBoard = useCallback(() => {
    if (!overlayOpenRef.current) setCalendarOpen(true);
  }, []);

  const openSettings = useCallback(() => {
    if (authStatus === "authenticated") {
      setShowMyPage(true);
      return;
    }

    showNotice("마이페이지를 보려면 로그인이 필요해요.");
    setLoginOpen(true);
  }, [authStatus, showNotice]);

  const fetchTodoTagColors = useCallback(async () => {
    if (authStatus !== "authenticated") {
      setTodoTagColors({});
      return;
    }

    try {
      const res = await apiClient.get<TodoTagColor[]>("/todos/tags/");
      setTodoTagColors(
        Object.fromEntries(
          res.data.filter((tag) => tag.content && tag.color).map((tag) => [tag.content, tag.color]),
        ),
      );
    } catch {
      setTodoTagColors({});
    }
  }, [authStatus]);

  useEffect(() => {
    void fetchTodoTagColors();
  }, [fetchTodoTagColors]);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) {
        return;
      }

      if (
        event.data?.type === "MONGLE_CHIEF_CLICKED" ||
        event.data?.type === "MONGLE_CHIEF_HOUSE_CLICKED"
      ) {
        if (!overlayOpenRef.current) setDialogueOpen(true);
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
        showNotice("성격 카테고리는 최대 3개까지 선택할 수 있어요.");
        return current;
      }
      return [...current, keyword];
    });
  }

  function handleCommittedTodos(result: TodoCommitResult) {
    setTodos((current) => [...result.todos, ...current]);
    void fetchTodoTagColors();
  }

  async function createCharacter() {
    const name = characterName.trim();
    const persona = characterPersona.trim();
    if (!name || !persona) {
      showNotice("주민 이름과 페르소나를 모두 적어주세요.");
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
      showNotice(`${resident.name} 주민이 몽글마을에 들어왔어요.`);
      setVillageVersion((current) => current + 1);
      setSourceImagePreview("");
      setSourceImageName("");
      useAuthStore.setState((state) => ({
        user: state.user ? { ...state.user, hasCharacter: true } : null,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "원인 미상";
      showNotice(`새 친구를 마을에 데려오지 못했어요. ${message}`);
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
      showNotice("이미지 파일만 업로드할 수 있어요.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setSourceImageName(file.name);
      setSourceImagePreview(String(reader.result || ""));
      showNotice("애착인형 사진을 불러왔어요. 이 이미지를 기반으로 주민을 만들게요.");
    };
    reader.readAsDataURL(file);
  }

  function completeHudTodo(todoId: string) {
    const targetTodo = todos.find((todo) => todo.id === todoId);
    if (!targetTodo || targetTodo.status === "candidate" || targetTodo.status === "done") {
      return;
    }

    setTodos((current) =>
      current.map((todo) => (todo.id === todoId ? { ...todo, status: "done" } : todo)),
    );
    setApples((current) => Math.min(MAX_DAILY_APPLES, current + 1));
    showNotice(`${targetTodo.title} 완료! 사과 1개를 받았어요.`);
  }

  function rewardReflectionApples(amount: number) {
    setApples((current) => Math.max(0, Math.min(MAX_DAILY_APPLES, current + amount)));
  }

  return (
    <main className="appShell">
      <PhaserVillage
        residents={residents}
        reloadKey={villageVersion}
        onOpenBoard={openVillageBoard}
        onOpenDialogue={openVillageDialogue}
      />
      <div className="shadeLayer" aria-hidden="true" />

      <AppHeader
        apples={apples}
        authStatus={authStatus}
        authUser={authUser}
        onLogin={() => setLoginOpen(true)}
        onLogout={() => void logoutSession()}
        onOpenSettings={openSettings}
        onSignup={() => setSignupOpen(true)}
      />

      <NoticeToast message={notice} visible={noticeVisible} />

      <ResidentPanel residents={residents} onAddResident={() => openFeature("character")} />

      <HudTodoList
        todos={todos}
        tagColors={todoTagColors}
        onCompleteTodo={completeHudTodo}
        onAddTodo={() => openFeature("todo")}
      />

      <HudButtonGroup
        onOpenDiary={() => setReflectionOpen(true)}
        onOpenNotifications={() => showNotice("아직 확인할 새 알림이 없어요.")}
        onOpenPhone={() => setFeedOpen(true)}
      />

      <VillageDialogue
        doneTodoCount={doneTodoCount}
        open={dialogueOpen}
        residents={residents}
        savedTodos={savedTodos}
        onClose={() => setDialogueOpen(false)}
        onOpen={() => setDialogueOpen(true)}
        onOpenFeature={openFeature}
      />

      <FeatureModalHost
        activeFeature={activeFeature}
        apiBase={API_BASE}
        characterName={characterName}
        characterPersona={characterPersona}
        isBusy={isBusy}
        residents={residents}
        savedTodos={savedTodos}
        selectedKeywordCategories={selectedKeywordCategories}
        sourceImageName={sourceImageName}
        sourceImagePreview={sourceImagePreview}
        onClose={closeActiveFeature}
        onCreateCharacter={createCharacter}
        onImageUpload={handleSourceImageUpload}
        onNameChange={setCharacterName}
        onNotice={showNotice}
        onPersonaChange={setCharacterPersona}
        onTodosSaved={handleCommittedTodos}
        onToggleKeyword={toggleKeywordCategory}
      />

      <AppModalLayer
        apples={apples}
        authStatus={authStatus}
        authUser={authUser}
        calendarOpen={calendarOpen}
        characterName={characterName}
        characterPersona={characterPersona}
        characterSetupOpen={characterSetupOpen}
        feedOpen={feedOpen}
        isBusy={isBusy}
        loginOpen={loginOpen}
        reflectionOpen={reflectionOpen}
        resetPwOpen={resetPwOpen}
        residents={residents}
        selectedKeywordCategories={selectedKeywordCategories}
        showMyPage={showMyPage}
        signupOpen={signupOpen}
        sourceImageName={sourceImageName}
        sourceImagePreview={sourceImagePreview}
        todos={todos}
        onCalendarClose={() => setCalendarOpen(false)}
        onCharacterImageUpload={handleSourceImageUpload}
        onCharacterNameChange={setCharacterName}
        onCharacterPersonaChange={setCharacterPersona}
        onCharacterSetupClose={closeCharacterSetup}
        onCharacterSubmit={createCharacter}
        onFeedClose={() => setFeedOpen(false)}
        onLoginClose={() => setLoginOpen(false)}
        onLoginOpen={() => {
          setCalendarOpen(false);
          setLoginOpen(true);
        }}
        onLogout={() => void logoutSession()}
        onMyPageClose={() => setShowMyPage(false)}
        onNotice={showNotice}
        onReflectionClose={() => setReflectionOpen(false)}
        onResetPwClose={() => {
          setResetPwOpen(false);
          setLoginOpen(true);
        }}
        onResetPwComplete={(notice) => {
          setResetPwOpen(false);
          showNotice(notice);
          setLoginOpen(true);
        }}
        onResetPwOpen={() => {
          setLoginOpen(false);
          setResetPwOpen(true);
        }}
        onRewardApples={rewardReflectionApples}
        onSignupClose={() => {
          setSignupOpen(false);
          setLoginOpen(true);
        }}
        onSignupComplete={(notice) => {
          setSignupOpen(false);
          showNotice(notice);
          setLoginOpen(true);
        }}
        onSwitchLoginToSignup={() => {
          setLoginOpen(false);
          setSignupOpen(true);
        }}
        onToggleKeyword={toggleKeywordCategory}
      />

      <PomodoroHud />
    </main>
  );
}
