import { useCallback, useEffect, useRef, useState } from "react";
import { exchangeKakaoCode, toUserMessage } from "../features/auth/api.js";
import { KakaoOnboardingModal } from "../features/auth/KakaoOnboardingModal.js";
import { consumeKakaoCallback } from "../features/auth/kakaoCallback.js";
import { type AuthState, useAuthStore } from "../features/auth/store.js";
import {
  type CharacterListItem,
  fetchCharacters,
  generateCharacter,
  resumePendingCharacter,
} from "../features/character/api.js";
import { hasPendingJob } from "../features/character/pendingJob.js";
import { fetchNotifications, markNotificationRead } from "../features/notification/api.js";
import { NotificationPanel } from "../features/notification/NotificationPanel.js";
import { NotificationToastLayer } from "../features/notification/NotificationToast.js";
import { useNotificationStore } from "../features/notification/store.js";
import type { NotificationToastItem } from "../features/notification/types.js";
import { PomodoroHud } from "../features/pomodoro/PomodoroHud.js";
import { HudTodoList } from "../features/todo/HudTodoList.js";
import { completeTodo as completeTodoRequest, formatTodayIso } from "../features/todo/todoApi.js";
import type { TodoCommitResult, TodoItem } from "../features/todo/todoCreation.js";
import { PhaserVillage } from "../features/village/PhaserVillage.js";
import { apiClient } from "../shared/api/client.js";
import { FEATURES, type FeatureId } from "./featureRegistry.js";
import { applyAppleDelta } from "./model/appleBalance.js";
import type { Resident, TodoTagColor } from "./model/appTypes.js";
import { AppHeader } from "./ui/AppHeader.js";
import { AppModalLayer } from "./ui/AppModalLayer.js";
import { FeatureModalHost } from "./ui/FeatureModalHost.js";
import { NoticeToast } from "./ui/NoticeToast.js";
import { VillageDialogue } from "./ui/VillageDialogue.js";

const API_BASE = import.meta.env.VITE_API_BASE ?? "";
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type ApiTodo = {
  todo_id: string;
  content: string;
  status: "IN_PROGRESS" | "COMPLETED" | "FAILED";
  todo_date: string;
  tag_content?: string;
  tag_contents?: string[];
  tags?: (string | { content?: string | null })[];
  quest?: {
    content: string;
    character_name?: string | null;
  } | null;
};

const MAX_TODO_TAGS = 3;
const MAX_TODO_TAG_LENGTH = 10;

function buildApiUrl(path: string) {
  return `${API_BASE}${path}`;
}

// 백엔드 gen_img_url(절대 URL이거나 상대 경로)을 화면용 아바타 URL로 변환한다.
function resolveAvatarUrl(genImgUrl: string | undefined): string | undefined {
  if (!genImgUrl) {
    return undefined;
  }
  return genImgUrl.startsWith("http") ? genImgUrl : buildApiUrl(genImgUrl);
}

function normalizeTodoTags(tags: string[]) {
  const normalized = tags.map((tag) => tag.trim().slice(0, MAX_TODO_TAG_LENGTH)).filter(Boolean);
  return Array.from(new Set(normalized)).slice(0, MAX_TODO_TAGS);
}

function getApiTodoTags(todo: ApiTodo) {
  const tagValues = [
    ...(todo.tags ?? []).map((tag) => (typeof tag === "string" ? tag : (tag.content ?? ""))),
    ...(todo.tag_contents ?? []),
    todo.tag_content ?? "",
  ];
  return normalizeTodoTags(tagValues);
}

function toResidentPreviews(items: CharacterListItem[]): Resident[] {
  return items.slice(0, 10).map((item) => ({
    id: item.characterId,
    name: item.name,
    personality: "",
    speechStyle: "",
    avatarUrl: resolveAvatarUrl(item.genImgUrl),
  }));
}

function hasUserCreatedCharacter(items: CharacterListItem[]) {
  return items.length > 0;
}

function hasUserCreatedResident(residents: Resident[]) {
  return residents.length > 0;
}

function areResidentsEqual(a: Resident[], b: Resident[]) {
  if (a.length !== b.length) {
    return false;
  }
  return a.every(
    (resident, index) =>
      resident.id === b[index]?.id &&
      resident.name === b[index]?.name &&
      resident.avatarUrl === b[index]?.avatarUrl,
  );
}

export function App() {
  const [activeFeature, setActiveFeature] = useState<FeatureId | null>(null);
  const [dialogueOpen, setDialogueOpen] = useState(false);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [todoTagColors, setTodoTagColors] = useState<Record<string, string>>({});
  const [apples, setApples] = useState(0);
  const [characterName, setCharacterName] = useState("");
  const [characterPersona, setCharacterPersona] = useState("");
  const [selectedKeywordCategories, setSelectedKeywordCategories] = useState<string[]>([]);
  const [sourceImageName, setSourceImageName] = useState("");
  const [sourceImagePreview, setSourceImagePreview] = useState("");
  const [sourceImageFile, setSourceImageFile] = useState<File | null>(null);
  const [notice, setNotice] = useState("오늘의 사과 보상은 10개까지 받을 수 있어요.");
  const [noticeVisible, setNoticeVisible] = useState(true);
  const noticeTimerRef = useRef<number | null>(null);
  const notificationSyncRequestRef = useRef(0);
  const [isBusy, setIsBusy] = useState(false);
  const [villageVersion, setVillageVersion] = useState(0);
  const [signupOpen, setSignupOpen] = useState(false);
  const [resetPwOpen, setResetPwOpen] = useState(false);
  const [showMyPage, setShowMyPage] = useState(false);
  const authStatus = useAuthStore((state: AuthState) => state.status);
  const authUser = useAuthStore((state: AuthState) => state.user);
  const authUserId = authUser?.userId;
  const logoutSession = useAuthStore((state: AuthState) => state.logout);
  const [loginOpen, setLoginOpen] = useState(false);
  const [kakaoSignupToken, setKakaoSignupToken] = useState<string | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [feedOpen, setFeedOpen] = useState(false);
  const [characterSetupOpen, setCharacterSetupOpen] = useState(false);
  const [reflectionOpen, setReflectionOpen] = useState(false);
  const [reflectionDate, setReflectionDate] = useState<string>();
  const [lastCreatedResident, setLastCreatedResident] = useState<Resident | null>(null);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const pushToast = useNotificationStore((s) => s.pushToast);
  const notifHistory = useNotificationStore((s) => s.history);
  const replaceServerNotifications = useNotificationStore((s) => s.replaceServerNotifications);
  const markNotificationReadLocally = useNotificationStore((s) => s.markRead);
  const markAllNotificationsReadLocally = useNotificationStore((s) => s.clearHistory);
  const resetNotifications = useNotificationStore((s) => s.reset);

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
    const code = consumeKakaoCallback();
    if (!code) {
      return;
    }
    void (async () => {
      try {
        const result = await exchangeKakaoCode(code);
        if (result.status === "authenticated") {
          useAuthStore.getState().setSocialSession(result);
        } else {
          setKakaoSignupToken(result.signup_token);
        }
      } catch (error) {
        showNotice(toUserMessage(error));
      }
    })();
  }, [showNotice]);

  useEffect(() => {
    if (notice) {
      return;
    }
    setNoticeVisible(false);
  }, [notice]);

  useEffect(() => {
    if (authStatus !== "authenticated") {
      setApples(0);
      return;
    }
    apiClient
      .get<{ token_balance: number }>("/auth/me/")
      .then((res) => {
        setApples(res.data.token_balance);
      })
      .catch(() => {});
  }, [authStatus]);

  const syncNotifications = useCallback(
    async (announceReflectionDate?: string) => {
      if (authStatus !== "authenticated") {
        return;
      }
      const requestId = notificationSyncRequestRef.current + 1;
      notificationSyncRequestRef.current = requestId;
      try {
        const notifications = await fetchNotifications();
        if (requestId !== notificationSyncRequestRef.current) {
          return;
        }
        replaceServerNotifications(notifications, announceReflectionDate);
      } catch {
        // 다음 주기나 패널 재오픈 때 다시 동기화한다.
      }
    },
    [authStatus, replaceServerNotifications],
  );

  useEffect(() => {
    if (authStatus !== "authenticated") {
      resetNotifications();
      return;
    }

    void syncNotifications();
    const interval = window.setInterval(() => void syncNotifications(), 60_000);
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void syncNotifications();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [authStatus, resetNotifications, syncNotifications]);

  useEffect(() => {
    if (notificationOpen) {
      void syncNotifications();
    }
  }, [notificationOpen, syncNotifications]);

  useEffect(() => {
    if (authStatus !== "authenticated" || !authUserId) {
      setTodos([]);
      return;
    }

    let cancelled = false;
    const today = formatTodayIso();
    const loadTodos = async () => {
      try {
        const res = await apiClient.get<ApiTodo[]>("/todos/", {
          params: { todo_date: today },
        });
        if (cancelled) {
          return;
        }
        setTodos(
          res.data
            .filter((todo) => todo.todo_date === today)
            .map((todo) => ({
              id: todo.todo_id,
              title: todo.content,
              dueDate: todo.todo_date,
              tags: getApiTodoTags(todo),
              status: todo.status === "COMPLETED" ? "done" : "saved",
              assignedQuest: todo.quest
                ? {
                    characterName: todo.quest.character_name ?? null,
                    content: todo.quest.content,
                  }
                : null,
            })),
        );
      } catch {
        if (!cancelled) {
          setTodos([]);
        }
      }
    };
    void loadTodos();

    return () => {
      cancelled = true;
    };
  }, [authStatus, authUserId]);

  const savedTodos = todos.filter((todo) => todo.status !== "candidate");
  const doneTodoCount = savedTodos.filter((todo) => todo.status === "done").length;

  const resetCharacterDraft = useCallback(() => {
    setCharacterName("");
    setCharacterPersona("");
    setSelectedKeywordCategories([]);
    setSourceImagePreview("");
    setSourceImageName("");
    setSourceImageFile(null);
    setLastCreatedResident(null);
  }, []);

  const closeActiveFeature = useCallback(() => {
    // 주민 생성 중에는 모달을 닫지 못하도록 막는다(백그라운드 Job 진행 중).
    if (isBusy) {
      showNotice("주민을 만드는 중이에요. 끝날 때까지 조금만 기다려 주세요.");
      return;
    }
    if (activeFeature === "character") {
      resetCharacterDraft();
    }
    setActiveFeature(null);
  }, [activeFeature, isBusy, resetCharacterDraft, showNotice]);

  const closeCharacterSetup = useCallback(() => {
    if (isBusy) {
      showNotice("주민을 만드는 중이에요. 끝날 때까지 조금만 기다려 주세요.");
      return;
    }
    resetCharacterDraft();
    setCharacterSetupOpen(false);
  }, [isBusy, resetCharacterDraft, showNotice]);

  const guardFeatureAccess = useCallback(
    async (onAllowed: () => void) => {
      if (authStatus !== "authenticated") {
        showNotice("로그인이 필요해요.");
        setLoginOpen(true);
        return false;
      }

      try {
        const items = await fetchCharacters();
        const hasCharacter = hasUserCreatedCharacter(items);
        const nextResidents = toResidentPreviews(items);
        setResidents((current) =>
          areResidentsEqual(current, nextResidents) ? current : nextResidents,
        );
        useAuthStore.setState((state) => ({
          user:
            state.user && state.user.hasCharacter !== hasCharacter
              ? { ...state.user, hasCharacter }
              : state.user,
        }));

        if (!hasCharacter) {
          showNotice("먼저 마을에 함께할 주민을 만들어 주세요.");
          return false;
        }

        onAllowed();
        return true;
      } catch {
        showNotice("주민 정보를 확인하지 못했어요. 잠시 후 다시 시도해 주세요.");
        return false;
      }
    },
    [authStatus, showNotice],
  );

  const openVillageDialogue = useCallback(() => {
    if (overlayOpenRef.current) {
      return;
    }
    if (authStatus !== "authenticated") {
      showNotice("로그인이 필요해요.");
      setLoginOpen(true);
      return;
    }
    setDialogueOpen(true);
  }, [authStatus, showNotice]);

  const openVillageBoard = useCallback(() => {
    if (!overlayOpenRef.current) {
      void guardFeatureAccess(() => setCalendarOpen(true));
    }
  }, [guardFeatureAccess]);

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
      const res = await apiClient.get<TodoTagColor[]>("/tags/");
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

  const fetchResidents = useCallback(async () => {
    if (authStatus !== "authenticated") {
      setResidents([]);
      return;
    }

    try {
      const items = await fetchCharacters();
      const nextResidents = toResidentPreviews(items);
      setResidents((current) =>
        areResidentsEqual(current, nextResidents) ? current : nextResidents,
      );
    } catch {
      setResidents([]);
    }
  }, [authStatus]);

  useEffect(() => {
    void fetchResidents();
  }, [fetchResidents]);

  // 로그인 직후 캐릭터가 하나도 없으면 캐릭터 생성 모달을 자동으로 띄운다.
  const autoCharacterPromptRef = useRef(false);
  useEffect(() => {
    if (authStatus !== "authenticated") {
      autoCharacterPromptRef.current = false;
      return;
    }
    const otherOverlayOpen =
      loginOpen ||
      signupOpen ||
      resetPwOpen ||
      showMyPage ||
      characterSetupOpen ||
      calendarOpen ||
      feedOpen ||
      activeFeature !== null;
    if (autoCharacterPromptRef.current || otherOverlayOpen) {
      return;
    }
    autoCharacterPromptRef.current = true;
    void (async () => {
      try {
        const items = await fetchCharacters();
        if (!hasUserCreatedCharacter(items)) {
          setActiveFeature("character");
        }
      } catch {
        autoCharacterPromptRef.current = false;
      }
    })();
  }, [
    authStatus,
    loginOpen,
    signupOpen,
    resetPwOpen,
    showMyPage,
    characterSetupOpen,
    calendarOpen,
    feedOpen,
    activeFeature,
  ]);

  const openFeature = useCallback(
    async (feature: FeatureId) => {
      if (feature === "character") {
        if (authStatus !== "authenticated") {
          showNotice("로그인이 필요해요.");
          setLoginOpen(true);
          return;
        }
        setDialogueOpen(true);
        setActiveFeature(feature);
        return;
      }

      await guardFeatureAccess(() => {
        setDialogueOpen(true);
        setActiveFeature(feature);
      });
    },
    [authStatus, guardFeatureAccess, showNotice],
  );

  const openTodoFromHud = useCallback(() => {
    void guardFeatureAccess(() => {
      setDialogueOpen(false);
      setActiveFeature("todo");
    });
  }, [guardFeatureAccess]);

  // 새로고침/이탈로 중단됐던 생성 잡을 로그인 후 한 번 이어서 마무리한다.
  const resumedRef = useRef(false);
  useEffect(() => {
    if (authStatus !== "authenticated") {
      resumedRef.current = false;
      return;
    }
    if (resumedRef.current) {
      return;
    }
    resumedRef.current = true;
    if (!hasPendingJob()) {
      return;
    }

    let cancelled = false;
    setIsBusy(true);
    showNotice("이전에 만들던 주민을 마무리하는 중이에요…");
    void (async () => {
      try {
        const result = await resumePendingCharacter();
        if (cancelled || !result) {
          return;
        }
        const resident: Resident = {
          id: result.characterId,
          name: result.name,
          personality: "",
          speechStyle: "",
          avatarUrl: resolveAvatarUrl(result.genImgUrl),
        };
        setResidents((current) => [...current, resident].slice(0, 10));
        showNotice(`${resident.name} 주민이 몽글마을에 들어왔어요.`);
        setVillageVersion((current) => current + 1);
        useAuthStore.setState((state) => ({
          user: state.user ? { ...state.user, hasCharacter: true } : null,
        }));
      } catch (error) {
        if (!cancelled) {
          showNotice(error instanceof Error ? error.message : "이전 작업을 마무리하지 못했어요.");
        }
      } finally {
        if (!cancelled) {
          setIsBusy(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authStatus, showNotice]);

  // 생성 중 새로고침/탭 종료 시 브라우저 기본 경고를 띄운다.
  useEffect(() => {
    if (!isBusy) {
      return;
    }
    function handleBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isBusy]);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) {
        return;
      }

      if (
        event.data?.type === "MONGLE_CHIEF_CLICKED" ||
        event.data?.type === "MONGLE_CHIEF_HOUSE_CLICKED"
      ) {
        openVillageDialogue();
      }

      if (event.data?.type === "MONGLE_FEATURE_SELECTED") {
        const feature = event.data.payload?.feature as FeatureId;
        if (feature in FEATURES) {
          void openFeature(feature);
        }
      }
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [openVillageDialogue, openFeature]);

  function toggleKeywordCategory(keyword: string) {
    setSelectedKeywordCategories((current) => {
      if (current.includes(keyword)) {
        return current.filter((item) => item !== keyword);
      }
      if (current.length >= 3) {
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
    const keywords = selectedKeywordCategories.slice(0, 3);
    setIsBusy(true);
    showNotice("새 친구를 그리는 중이에요. 잠시만 기다려 주세요.");
    try {
      const result = await generateCharacter({
        name,
        persona,
        personalityKeywords: keywords,
        sourceImageFile,
      });
      const resident: Resident = {
        id: result.characterId,
        name: result.name,
        personality: result.persona,
        speechStyle: "",
        avatarUrl: resolveAvatarUrl(result.genImgUrl),
      };
      setResidents((current) => [...current, resident].slice(0, 10));
      pushToast({
        type: "resident",
        title: "새 주민이 몽글마을에 입주했어요!",
        body: `${resident.name}가 이장님 집으로 왔어요.`,
        avatarUrl: resident.avatarUrl,
      });
      setVillageVersion((current) => current + 1);
      resetCharacterDraft();
      setLastCreatedResident(resident);
      useAuthStore.setState((state) => ({
        user: state.user ? { ...state.user, hasCharacter: true } : null,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "원인 미상";
      showNotice(message);
    } finally {
      setIsBusy(false);
    }
  }

  function handleSourceImageUpload(file: File | undefined) {
    if (!file) {
      setSourceImageName("");
      setSourceImagePreview("");
      setSourceImageFile(null);
      return;
    }
    if (file.type !== "image/jpeg" && file.type !== "image/png") {
      showNotice("프로필 사진은 JPG 또는 PNG만 올릴 수 있어요.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setSourceImageName(file.name);
      setSourceImagePreview(String(reader.result || ""));
      setSourceImageFile(file);
      showNotice("애착인형 사진을 불러왔어요. 이 이미지를 기반으로 주민을 만들게요.");
    };
    reader.readAsDataURL(file);
  }

  async function completeHudTodo(todoId: string) {
    const targetTodo = todos.find((todo) => todo.id === todoId);
    if (!targetTodo || targetTodo.status === "candidate" || targetTodo.status === "done") {
      return;
    }

    if (!UUID_PATTERN.test(todoId)) {
      setTodos((current) =>
        current.map((todo) => (todo.id === todoId ? { ...todo, status: "done" } : todo)),
      );
      setApples((current) => applyAppleDelta(current, 1));
      showNotice(`${targetTodo.title} 완료! 사과 1개를 받았어요.`);
      return;
    }

    try {
      const completed = await completeTodoRequest(todoId);
      setTodos((current) =>
        current.map((todo) => (todo.id === todoId ? { ...todo, status: "done" } : todo)),
      );
      setApples(completed.token_balance);
      showNotice(
        completed.reward > 0
          ? `${targetTodo.title} 완료! 사과 ${completed.reward}개를 받았어요.`
          : `${targetTodo.title} 완료! 오늘의 사과 보상 한도에 도달했어요.`,
      );
      await syncNotifications(targetTodo.dueDate);
    } catch (error) {
      const message = error instanceof Error ? error.message : "원인 미상";
      showNotice(`TODO 완료 처리에 실패했어요. ${message}`);
    }
  }

  function rewardReflectionApples(amount: number) {
    setApples((current) => applyAppleDelta(current, amount));
  }

  async function handleNotificationItemClick(item: NotificationToastItem) {
    if (!item.isRead) {
      markNotificationReadLocally(item.id);
      if (item.serverId !== undefined) {
        try {
          await markNotificationRead(item.serverId);
        } catch {
          void syncNotifications();
        }
      }
    }

    if (item.type === "reflection" && item.reflectionDate) {
      setNotificationOpen(false);
      setReflectionDate(item.reflectionDate);
      setReflectionOpen(true);
    }
  }

  async function handleMarkAllNotificationsRead() {
    const unreadServerIds = notifHistory.flatMap((item) =>
      !item.isRead && item.serverId !== undefined ? [item.serverId] : [],
    );
    markAllNotificationsReadLocally();
    const results = await Promise.allSettled(unreadServerIds.map(markNotificationRead));
    if (results.some((result) => result.status === "rejected")) {
      void syncNotifications();
    }
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
        onOpenDiary={() =>
          void guardFeatureAccess(() => {
            setReflectionDate(formatTodayIso());
            setReflectionOpen(true);
          })
        }
        onOpenNotifications={() =>
          void guardFeatureAccess(() => setNotificationOpen((prev) => !prev))
        }
        onOpenPhone={() => void guardFeatureAccess(() => setFeedOpen(true))}
        onLogin={() => setLoginOpen(true)}
        onLogout={() => void logoutSession()}
        onOpenSettings={openSettings}
        onSignup={() => setSignupOpen(true)}
        unreadNotificationCount={
          notifHistory.length > 0 && !notificationOpen ? notifHistory.length : undefined
        }
      />

      <NoticeToast message={notice} visible={noticeVisible} />

      <HudTodoList
        todos={todos}
        tagColors={todoTagColors}
        onCompleteTodo={completeHudTodo}
        onAddTodo={openTodoFromHud}
      />

      <VillageDialogue
        doneTodoCount={doneTodoCount}
        open={dialogueOpen}
        residents={residents}
        savedTodos={savedTodos}
        onClose={() => setDialogueOpen(false)}
        onOpen={openVillageDialogue}
        onOpenFeature={openFeature}
      />

      <FeatureModalHost
        activeFeature={activeFeature}
        characterName={characterName}
        characterPersona={characterPersona}
        isBusy={isBusy}
        residents={residents}
        savedTodos={savedTodos}
        selectedKeywordCategories={selectedKeywordCategories}
        sourceImageName={sourceImageName}
        sourceImagePreview={sourceImagePreview}
        onClose={closeActiveFeature}
        lastCreatedResident={lastCreatedResident}
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
        reflectionDate={reflectionDate}
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
        lastCreatedResident={lastCreatedResident}
        onCharacterSubmit={createCharacter}
        onFeedClose={() => setFeedOpen(false)}
        onLoginClose={() => setLoginOpen(false)}
        onLoginOpen={() => {
          setCalendarOpen(false);
          setLoginOpen(true);
        }}
        onLogout={() => void logoutSession()}
        onMoveOut={(characterId) => {
          setResidents((current) => current.filter((r) => r.id !== characterId));
        }}
        onMyPageClose={() => setShowMyPage(false)}
        onNotice={showNotice}
        onReflectionClose={() => {
          setReflectionOpen(false);
          setReflectionDate(undefined);
        }}
        onResetPwClose={() => {
          setResetPwOpen(false);
        }}
        onResetPwComplete={(notice) => {
          setResetPwOpen(false);
          showNotice(notice);
        }}
        onResetPwOpen={() => {
          setLoginOpen(false);
          setResetPwOpen(true);
        }}
        onRewardApples={rewardReflectionApples}
        onSignupClose={() => {
          setSignupOpen(false);
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

      <NotificationPanel
        open={notificationOpen}
        onClose={() => setNotificationOpen(false)}
        onItemClick={(item) => void handleNotificationItemClick(item)}
        onMarkAllRead={() => void handleMarkAllNotificationsRead()}
      />

      <KakaoOnboardingModal
        open={kakaoSignupToken !== null}
        signupToken={kakaoSignupToken ?? ""}
        onClose={() => setKakaoSignupToken(null)}
        onComplete={() => {
          setKakaoSignupToken(null);
          showNotice("환영해요! 몽글마을에 오신 걸 축하해요.");
        }}
      />

      <NotificationToastLayer />

      <PomodoroHud
        canResumeSavedRun={authStatus === "authenticated" && hasUserCreatedResident(residents)}
        isLoggedOut={authStatus === "anonymous"}
        onBeforeStart={() => guardFeatureAccess(() => undefined)}
      />
    </main>
  );
}
