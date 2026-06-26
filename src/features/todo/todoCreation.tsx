import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useTags } from "../../shared/tags/useTags.js";
import { readableInk } from "../../shared/ui/Tag/Tag.js";
import { TagPicker } from "../../shared/ui/tags/TagPicker.js";
import "./todoCreation.css";
import { confirmTodos, createTodo, formatTodayIso, generateTodos } from "./todoApi.js";

export type TodoItem = {
  id: string;
  title: string;
  dueDate: string;
  tags: string[];
  tagColors?: Record<string, string>;
  status: "candidate" | "saved" | "done" | "failed";
  assignedQuest?: {
    characterName: string | null;
    content: string;
    isTemporary?: boolean;
  } | null;
};

export type TodoCommitResult = {
  calendarEventCount?: number;
  questPreviews?: {
    characterId: string | null;
    characterName?: string | null;
    content: string;
    questId: string;
    todoId: string;
    todoTitle: string;
  }[];
  todos: TodoItem[];
};

// 캐릭터 퀘스트는 당일 TODO에 한해 하루 5개까지만 LLM으로 부여(백엔드 _assign_quests_to_todos가 강제).
const QUEST_DAILY_LIMIT = 5;
const BOARD_NATURAL_WIDTH = 1240;
const BOARD_NATURAL_HEIGHT = 1080;
const MAYOR_PROMPT_MAX_LENGTH = 200;

// 행마다 색깔 핀을 번갈아(디자인 시안의 압정 모티프).
const PIN_CYCLE = ["red_pin", "blue_pin", "green_pin", "todo_pin_icon"];
const pinSrc = (index: number) => `/assets/todo/${PIN_CYCLE[index % PIN_CYCLE.length]}.png`;

// 제목 키워드로 카테고리 아이콘 매칭(디자인 시안의 ORGANIZE_RULES와 동일). 없으면 null.
const ICON_RULES: { kw: string[]; icon: string }[] = [
  { kw: ["헬스", "운동", "조깅", "러닝"], icon: "dumbbell_icon" },
  { kw: ["빨래", "세탁"], icon: "washing_machine_icon" },
  { kw: ["청소"], icon: "vacuum_icon" },
];
const iconSrc = (title: string): string | null => {
  const rule = ICON_RULES.find((r) => r.kw.some((k) => title.includes(k)));
  return rule ? `/assets/todo/${rule.icon}.png` : null;
};

// 플래너 챗봇(PlannerCloseIcon)과 동일한 X 아이콘.
function BoardCloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
    </svg>
  );
}

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function isImeComposing(event: React.KeyboardEvent<HTMLInputElement>) {
  return event.nativeEvent.isComposing || event.key === "Process" || event.keyCode === 229;
}

// 항목당 태그 1개(백엔드 Todo.tag FK가 단일). 캘린더와 동일한 유저 태그를 공유한다.
// quest=true 인 항목만 캐릭터 퀘스트(LLM)를 요청하고, 나머지는 즉시 단일 저장한다.
type LocalTodo = { id: string; name: string; tagId: number | null; quest: boolean };
type ResidentPreview = {
  id: string;
  name: string;
  personality?: string;
  persona?: string;
  avatarUrl?: string;
};
// 저장 결과 화면(2단계)에 보여줄 항목: 확정된 TODO + (있으면) 애착인형 퀘스트.
type CommittedQuest = {
  id: string;
  title: string;
  tagId: number | null;
  characterName: string | null;
  characterAvatarUrl: string | null;
  questText: string | null;
};

type TodoCreationProps = {
  residents: ResidentPreview[];
  savedTodos: TodoItem[];
  onNotice: (message: string) => void;
  onTodosSaved: (result: TodoCommitResult) => void;
  onClose?: () => void;
};

export function TodoCreation({
  residents,
  savedTodos,
  onNotice,
  onTodosSaved,
  onClose,
}: TodoCreationProps) {
  const [sentence, setSentence] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const [manualText, setManualText] = useState("");
  const [selectedTagId, setSelectedTagId] = useState<number | null>(null);
  const [todos, setTodos] = useState<LocalTodo[]>([]);
  const [hasTodoBelow, setHasTodoBelow] = useState(false);
  const todoListRef = useRef<HTMLDivElement>(null);

  // page 0: 게시판(작성/정리), page 1: 저장 결과(확정 TODO + 캐릭터 퀘스트)
  const [page, setPage] = useState<0 | 1>(0);
  const [committed, setCommitted] = useState<CommittedQuest[]>([]);
  const [isBusy, setIsBusy] = useState(false);
  const [toast, setToast] = useState("");

  const toastTimer = useRef<ReturnType<typeof setTimeout>>();

  // 디자인(.dc.html)과 동일한 고정 크기 패널을 화면에 맞게 transform:scale로 축소.
  // 콘텐츠 개수와 무관하게 동일한 배율을 유지하고, 넘치는 콘텐츠는 각 영역에서 스크롤한다.
  const modalRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useLayoutEffect(() => {
    const PAD = 48;
    // 시안은 1240px이지만 다른 모달(캐릭터 ~700px, 캘린더 등)과 어우러지도록
    // 최대 배율을 낮춰 글씨·버튼·여백을 한 번에 차분하게 줄인다(디자인 비율은 그대로 유지).
    const MAX_SCALE = 0.8;
    const fitToViewport = () => {
      const next = Math.min(
        MAX_SCALE,
        (window.innerWidth - PAD) / BOARD_NATURAL_WIDTH,
        (window.innerHeight - PAD) / BOARD_NATURAL_HEIGHT,
      );
      setScale(next);
    };
    fitToViewport();
    window.addEventListener("resize", fitToViewport);
    return () => window.removeEventListener("resize", fitToViewport);
  }, []);

  const wrapStyle = {
    width: `${BOARD_NATURAL_WIDTH * scale}px`,
    height: `${BOARD_NATURAL_HEIGHT * scale}px`,
  };
  const panelStyle = { transform: `scale(${scale})` };

  // 유저 태그는 캘린더와 동일한 /tags/ 에서 공유한다. 이 모달은 로그인 상태에서만 열린다.
  const { tagItems, fetchTags, createTag, editTag, deleteTag } = useTags(true);

  useEffect(() => {
    void fetchTags();
  }, [fetchTags]);

  useLayoutEffect(() => {
    const list = todoListRef.current;
    if (page !== 0 || todos.length === 0 || !list) {
      setHasTodoBelow(false);
      return;
    }

    const updateIndicator = () => {
      const hasOverflowBelow = list.scrollTop + list.clientHeight < list.scrollHeight - 1;
      setHasTodoBelow(hasOverflowBelow);
    };

    updateIndicator();
    list.addEventListener("scroll", updateIndicator, { passive: true });
    const resizeObserver = new ResizeObserver(updateIndicator);
    resizeObserver.observe(list);

    return () => {
      list.removeEventListener("scroll", updateIndicator);
      resizeObserver.disconnect();
    };
  }, [todos.length, page]);

  const tagById = useMemo(() => new Map(tagItems.map((t) => [t.id, t])), [tagItems]);
  const tagByContent = useMemo(() => new Map(tagItems.map((t) => [t.content, t])), [tagItems]);

  // 오늘 이미 부여된 퀘스트 수(서버에서 불러온 당일 savedTodos 기준) + 이번에 고른 수 = 남은 한도.
  const usedQuestsToday = useMemo(
    () => savedTodos.filter((t) => t.assignedQuest).length,
    [savedTodos],
  );
  const selectedQuestCount = todos.filter((t) => t.quest).length;
  const questAvailable = Math.max(0, QUEST_DAILY_LIMIT - usedQuestsToday - selectedQuestCount);
  const sentenceLength = sentence.length;
  const isSentenceAtLimit = sentenceLength >= MAYOR_PROMPT_MAX_LENGTH;

  // AI가 제안한 태그 문자열을 유저의 실제 태그에 이름으로 매칭. 없으면 null.
  const matchTagId = (names: string[] | undefined): number | null => {
    const first = names?.[0];
    return first ? (tagByContent.get(first)?.id ?? null) : null;
  };

  useEffect(
    () => () => {
      clearTimeout(toastTimer.current);
    },
    [],
  );

  function showToast(msg: string, ms = 2600) {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), ms);
  }

  // 정리·저장 중에는 게시판 조작을 막고, 클릭하면 안내 토스트를 띄운다.
  function blockedWhileBusy() {
    if (aiLoading || isBusy) {
      showToast("저장 중에는 잠시만 기다려주세요.");
      return true;
    }
    return false;
  }

  function addTodo() {
    if (blockedWhileBusy()) return;
    // 백엔드 content 는 최대 20자라, 입력 maxLength 와 더불어 안전망으로 한 번 더 자른다.
    const name = manualText.trim().slice(0, 20);
    if (!name) return;
    setTodos((prev) => [...prev, { id: createId("td"), name, tagId: selectedTagId, quest: false }]);
    setManualText("");
    setSelectedTagId(null);
  }

  function updateTodoName(id: string, name: string) {
    const trimmed = name.slice(0, 20);
    setTodos((prev) => prev.map((todo) => (todo.id === id ? { ...todo, name: trimmed } : todo)));
  }

  // 20자 도달 후 글자를 더 치려고 하면(선택 영역 없이 입력 키) 경고 토스트.
  function warnTodoNameLimit(event: React.KeyboardEvent<HTMLInputElement>) {
    if (isImeComposing(event)) return;
    if (event.key.length !== 1 || event.ctrlKey || event.metaKey || event.altKey) return;
    const input = event.currentTarget;
    const hasSelection = input.selectionStart !== input.selectionEnd;
    if (input.value.length >= 20 && !hasSelection) {
      showToast("할 일은 20자까지만 쓸 수 있어요.");
    }
  }

  function clearTodoTag(id: string) {
    if (blockedWhileBusy()) return;
    setTodos((prev) => prev.map((todo) => (todo.id === id ? { ...todo, tagId: null } : todo)));
  }

  function applySelectedTag(id: string) {
    if (blockedWhileBusy()) return;
    if (selectedTagId === null) {
      showToast("먼저 적용할 태그를 선택해주세요.");
      return;
    }
    setTodos((prev) =>
      prev.map((todo) => (todo.id === id ? { ...todo, tagId: selectedTagId } : todo)),
    );
  }

  // ⭐ 토글: 켤 때 하루 한도를 넘으면 막는다.
  function toggleQuest(id: string) {
    if (blockedWhileBusy()) return;
    setTodos((prev) => {
      const target = prev.find((t) => t.id === id);
      if (!target) return prev;
      if (!target.quest && questAvailable <= 0) {
        showToast(`캐릭터 퀘스트는 하루 ${QUEST_DAILY_LIMIT}개까지예요.`);
        return prev;
      }
      return prev.map((t) => (t.id === id ? { ...t, quest: !t.quest } : t));
    });
  }

  function deleteTodo(id: string) {
    if (blockedWhileBusy()) return;
    setTodos((prev) => prev.filter((t) => t.id !== id));
  }

  // 좌측 "이장님에게 말하기": 문장을 AI가 여러 TODO로 나눠 목록에 더한다.
  async function handleOrganize() {
    if (aiLoading) return;
    if (blockedWhileBusy()) return;
    const raw = sentence.trim();
    if (!raw) {
      showToast("문장을 먼저 입력해주세요!");
      return;
    }
    if (sentenceLength > MAYOR_PROMPT_MAX_LENGTH) {
      showToast(`이장님에게 말하기는 ${MAYOR_PROMPT_MAX_LENGTH}자까지만 가능해요.`);
      return;
    }
    setAiLoading(true);
    try {
      const result = await generateTodos(raw);
      // 일정/TODO로 나눌 수 없는 입력: 에러가 아니라 이장님 안내문으로 다시 적게 유도한다.
      if (result.kind === "out_of_scope") {
        showToast(
          result.message ||
            "음… 그건 할 일로 나누긴 어려워요. 준비할 일이나 이루고 싶은 목표를 들려주세요!",
          4200,
        );
        return;
      }
      const items = [...result.todos, ...result.calendar_events].map((t) => ({
        id: createId("ai"),
        name: t.title,
        tagId: matchTagId(t.tags),
        quest: false,
      }));
      setTodos((prev) => [...prev, ...items]);
      setSentence("");
      showToast(`이장님이 ${items.length}개의 할 일로 정리했어요!`);
    } catch {
      showToast("이장님이 할 일을 정리하지 못했어요. 잠시 후 다시 시도해주세요.");
    } finally {
      setAiLoading(false);
    }
  }

  // 푸터 "오늘의 TODO에 저장": ⭐ 항목은 퀘스트 요청(confirm), 나머지는 단일 API로 즉시 저장.
  // ⭐ 항목은 quest:null로 보내면 백엔드가 "당일 TODO·하루 5개" 한도로 LLM 퀘스트를 자동 배정한다.
  // 한도를 넘은 항목은 quest 없이 저장되어 그대로 plain 으로만 표시된다(가짜 퀘스트 안 보여줌).
  async function handleSave() {
    if (isBusy) return;
    if (!todos.length) {
      showToast("할 일을 먼저 추가해주세요!");
      return;
    }
    if (todos.some((t) => !t.name.trim())) {
      showToast("빈 할 일은 저장할 수 없어요. 내용을 입력해주세요!");
      return;
    }
    setIsBusy(true);
    try {
      const today = formatTodayIso();
      const questTodos = todos.filter((t) => t.quest);
      const plainTodos = todos.filter((t) => !t.quest);

      const committedRows: CommittedQuest[] = [];
      const savedForApp: TodoItem[] = [];
      const questPreviewsForApp: NonNullable<TodoCommitResult["questPreviews"]> = [];

      // 1) 퀘스트 없는 항목: 단일 생성 API(POST /todos/)로 즉시 저장 — LLM 미사용.
      if (plainTodos.length) {
        const created = await Promise.all(
          plainTodos.map((t) =>
            createTodo({
              content: t.name,
              todo_date: today,
              ...(t.tagId != null ? { tag_id: t.tagId } : {}),
            }),
          ),
        );
        created.forEach((todo, index) => {
          const localTagId = plainTodos[index]?.tagId ?? null;
          const tag = localTagId != null ? tagById.get(localTagId) : undefined;
          committedRows.push({
            id: todo.todo_id,
            title: todo.content,
            tagId: tag?.id ?? null,
            characterName: null,
            characterAvatarUrl: null,
            questText: null,
          });
          savedForApp.push({
            id: todo.todo_id,
            title: todo.content,
            dueDate: todo.todo_date,
            tags: tag ? [tag.content] : [],
            tagColors: tag ? { [tag.content]: tag.color } : {},
            status: "saved",
            assignedQuest: null,
          });
        });
      }

      // 2) 퀘스트 ⭐ 항목: confirm + quest:null → 백엔드가 당일·하루5개 한도로 LLM 퀘스트 배정.
      if (questTodos.length) {
        const result = await confirmTodos({
          todos: questTodos.map((t) => ({
            content: t.name,
            todo_date: today,
            // 스펙 권장: 이름이 아니라 tag_id로 연결. 태그 없으면 빈 tags로 폴백.
            ...(t.tagId != null ? { tag_id: t.tagId } : { tags: [] }),
            quest: null,
          })),
        });
        result.todos.forEach((todo, index) => {
          const localTagId = questTodos[index]?.tagId ?? null;
          const tag = localTagId != null ? tagById.get(localTagId) : undefined;
          // 퀘스트 응답에는 아바타 URL이 없어 character_id로 주민 목록에서 매칭.
          const resident = todo.quest
            ? residents.find((r) => r.id === todo.quest?.character_id)
            : undefined;
          committedRows.push({
            id: todo.todo_id,
            title: todo.content,
            tagId: tag?.id ?? null,
            characterName: todo.quest?.character_name ?? null,
            characterAvatarUrl: resident?.avatarUrl ?? null,
            questText: todo.quest?.content ?? null,
          });
          savedForApp.push({
            id: todo.todo_id,
            title: todo.content,
            dueDate: todo.todo_date,
            tags: tag ? [tag.content] : [],
            tagColors: tag ? { [tag.content]: tag.color } : {},
            status: "saved",
            assignedQuest: todo.quest
              ? {
                  characterName: todo.quest.character_name,
                  content: todo.quest.content,
                  isTemporary: false,
                }
              : null,
          });
          if (todo.quest) {
            questPreviewsForApp.push({
              questId: todo.quest.quest_id,
              content: todo.quest.content,
              characterId: todo.quest.character_id,
              characterName: todo.quest.character_name,
              todoId: todo.todo_id,
              todoTitle: todo.content,
            });
          }
        });
      }

      onTodosSaved({ todos: savedForApp, questPreviews: questPreviewsForApp });
      setCommitted(committedRows);
      setPage(1);
      const questCount = committedRows.filter((r) => r.questText).length;
      showToast(
        questCount > 0
          ? `${savedForApp.length}개 저장 · 퀘스트 ${questCount}개 부여!`
          : `${savedForApp.length}개의 할 일을 저장했어요!`,
      );
    } catch (error) {
      onNotice(`저장 실패: ${error instanceof Error ? error.message : "원인 미상"}`);
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <div className="tdRoot">
      {/* ── PAGE 0: 마을 게시판 ── */}
      {page === 0 && (
        <div className="tdScaleWrap" style={wrapStyle}>
          <div className="boardPanel" ref={modalRef} style={panelStyle}>
            {onClose && (
              <button type="button" className="boardClose" onClick={onClose} aria-label="닫기">
                <BoardCloseIcon />
              </button>
            )}

            {/* HEADER */}
            <header className="boardHeader">
              <img
                src="/assets/todo/flower_cluster_left.png"
                alt=""
                className="boardHeaderFlower"
                aria-hidden="true"
              />
              <h1 className="boardTitle">오늘의 마을 게시판</h1>
              <img
                src="/assets/todo/flower_cluster_right.png"
                alt=""
                className="boardHeaderFlower"
                aria-hidden="true"
              />
            </header>

            {/* BODY */}
            <div className="boardBody">
              <div className="boardRow">
                {/* LEFT: 이장님에게 말하기 */}
                <section className="boardCard">
                  <div className="boardCardHead">
                    <span className="boardTypeBadge">TYPE 1</span>
                    <span className="boardCardTitle">이장님에게 말하기</span>
                    <img
                      src="/assets/todo/mayor_character.png"
                      alt=""
                      className="boardCardDeco"
                      aria-hidden="true"
                    />
                  </div>
                  <div className="boardField">
                    <div className="boardFieldHint">오늘 해야 할 일을 문장으로 말해주세요</div>
                    <textarea
                      className={`boardTextarea${isSentenceAtLimit ? " isError" : ""}`}
                      value={sentence}
                      onChange={(e) =>
                        setSentence(e.target.value.slice(0, MAYOR_PROMPT_MAX_LENGTH))
                      }
                      maxLength={MAYOR_PROMPT_MAX_LENGTH}
                      rows={3}
                      disabled={aiLoading || isBusy}
                      placeholder="예) 헬스장 가야하고, 빨래 돌리고, 청소기도 돌려야해"
                      aria-invalid={isSentenceAtLimit}
                      aria-describedby="boardSentenceMeta"
                    />
                    <div className="boardFieldMeta" id="boardSentenceMeta" aria-live="polite">
                      <span className="boardFieldError">
                        {isSentenceAtLimit
                          ? `최대 글자수 ${MAYOR_PROMPT_MAX_LENGTH}자에 도달했어요.`
                          : " "}
                      </span>
                      <span className={`boardCharCount${isSentenceAtLimit ? " isError" : ""}`}>
                        {sentenceLength}/{MAYOR_PROMPT_MAX_LENGTH}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className={`boardOrganizeBtn${aiLoading ? " isLoading" : ""}`}
                    onClick={() => void handleOrganize()}
                    disabled={aiLoading}
                  >
                    {aiLoading ? (
                      <span className="tdSpinner" />
                    ) : (
                      <span className="tdGenStar">✨</span>
                    )}
                    {aiLoading ? "정리하는 중..." : "이장님이 TODO로 정리"}
                  </button>
                </section>

                {/* RIGHT: 직접 적기 */}
                <section className="boardCard">
                  <div className="boardCardHead">
                    <span className="boardTypeBadge">TYPE 2</span>
                    <span className="boardCardTitle">직접 적기</span>
                    <img
                      src="/assets/todo/yellow_chick.png"
                      alt=""
                      className="boardCardDeco"
                      aria-hidden="true"
                    />
                  </div>
                  <div className="boardAddRow">
                    <input
                      className="boardInput"
                      value={manualText}
                      maxLength={20}
                      onChange={(e) => setManualText(e.target.value)}
                      disabled={aiLoading || isBusy}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          if (isImeComposing(e)) return;
                          e.preventDefault();
                          addTodo();
                        }
                      }}
                      placeholder="할 일을 적어주세요 (최대 20자)"
                    />
                    <button type="button" className="boardAddBtn" onClick={addTodo}>
                      추가
                    </button>
                  </div>
                  {/* 캘린더와 공유하는 유저 태그 캐시(useTags). 새 할일에 적용할 태그 하나 선택. */}
                  <div className="boardTagBox">
                    <div className="boardTagBoxTitle">태그 선택</div>
                    <TagPicker
                      tags={tagItems}
                      pinNewButton
                      selectedId={selectedTagId}
                      onSelect={setSelectedTagId}
                      onCreateTag={createTag}
                      onEditTag={editTag}
                      onDeleteTag={deleteTag}
                    />
                  </div>
                </section>
              </div>

              {/* 점선 구분선 + 가운데 꽃 */}
              <div className="boardDivider">
                <img
                  src="/assets/todo/divider_flower.png"
                  alt=""
                  className="boardDividerFlower"
                  aria-hidden="true"
                />
              </div>

              {/* BOTTOM: 생성된 TODO */}
              <section className="boardCard boardGenerated">
                <div className="boardCardHead">
                  <span className="boardCardTitle">생성된 TODO</span>
                  <img
                    src="/assets/todo/small_flower_deco.png"
                    alt=""
                    className="boardCardDeco boardCardDeco--sm"
                    aria-hidden="true"
                  />
                </div>

                {todos.length > 0 && (
                  <div className={`boardQuestBudget${questAvailable === 0 ? " is-empty" : ""}`}>
                    <span aria-hidden="true">⭐</span> 캐릭터 퀘스트 {questAvailable}/
                    {QUEST_DAILY_LIMIT} 남음
                  </div>
                )}

                {todos.length === 0 ? (
                  <div className="boardEmpty">아직 생성된 TODO가 없어요. 위에서 추가해보세요!</div>
                ) : (
                  <div className="boardTodoListWrap">
                    <div className="boardTodoList" ref={todoListRef}>
                      {todos.map((todo, index) => {
                        const tag = todo.tagId != null ? tagById.get(todo.tagId) : undefined;
                        const rowLocked = aiLoading || isBusy;
                        const lockQuest = !todo.quest && questAvailable <= 0;
                        return (
                          <div key={todo.id} className="boardTodoRow">
                            <img
                              src={pinSrc(index)}
                              alt=""
                              className="boardPin"
                              aria-hidden="true"
                            />
                            {iconSrc(todo.name) && (
                              <img
                                src={iconSrc(todo.name) as string}
                                alt=""
                                className="boardTodoIcon"
                                aria-hidden="true"
                              />
                            )}
                            <input
                              className="boardTodoName"
                              value={todo.name}
                              onChange={(event) => updateTodoName(todo.id, event.target.value)}
                              onKeyDown={warnTodoNameLimit}
                              maxLength={20}
                              disabled={rowLocked}
                              aria-label="TODO 항목 수정"
                            />
                            <div className="boardTodoChips">
                              {tag && (
                                <span
                                  className="boardChip"
                                  style={{
                                    background: `${tag.color}22`,
                                    color: readableInk(tag.color),
                                    borderColor: tag.color,
                                  }}
                                >
                                  #{tag.content}
                                  <button
                                    type="button"
                                    className="boardChipRemove"
                                    onClick={() => clearTodoTag(todo.id)}
                                    aria-label={`${tag.content} 태그 제거`}
                                  >
                                    x
                                  </button>
                                </span>
                              )}
                            </div>
                            <button
                              type="button"
                              className="boardApplyTag"
                              onClick={() => applySelectedTag(todo.id)}
                            >
                              태그 적용
                            </button>
                            <button
                              type="button"
                              className={`boardQuestToggle${todo.quest ? " is-on" : ""}`}
                              onClick={() => toggleQuest(todo.id)}
                              disabled={lockQuest}
                              aria-pressed={todo.quest}
                              title={
                                lockQuest
                                  ? `캐릭터 퀘스트는 하루 ${QUEST_DAILY_LIMIT}개까지예요`
                                  : "이 할 일을 애착인형 퀘스트로"
                              }
                            >
                              {todo.quest ? "⭐" : "☆"} 퀘스트
                            </button>
                            <button
                              type="button"
                              className="boardRemove"
                              onClick={() => deleteTodo(todo.id)}
                              aria-label="삭제"
                            >
                              ✕
                            </button>
                          </div>
                        );
                      })}
                    </div>
                    {hasTodoBelow && (
                      <div className="boardTodoMoreIndicator" aria-hidden="true">
                        <KeyboardArrowDownRoundedIcon />
                      </div>
                    )}
                  </div>
                )}
              </section>
            </div>

            {/* FOOTER */}
            <footer className="boardFooter">
              <button
                type="button"
                className="boardSaveBtn"
                onClick={() => void handleSave()}
                disabled={isBusy}
              >
                {isBusy ? (
                  <span className="tdSpinner tdSpinner--lg" />
                ) : (
                  <img
                    src="/assets/todo/sparkle_star.png"
                    alt=""
                    className="boardSaveIcon"
                    aria-hidden="true"
                  />
                )}
                {isBusy ? "저장 중..." : "오늘의 TODO에 저장하기"}
                {!isBusy && (
                  <img
                    src="/assets/todo/save_disk_icon.png"
                    alt=""
                    className="boardSaveIcon"
                    aria-hidden="true"
                  />
                )}
              </button>
            </footer>
          </div>
        </div>
      )}

      {/* ── PAGE 1: 저장 결과(확정 TODO + 캐릭터 퀘스트) ── */}
      {page === 1 && (
        <div className="tdScaleWrap" style={wrapStyle}>
          <div className="boardPanel tdPageIn" ref={modalRef} style={panelStyle}>
            {onClose && (
              <button type="button" className="boardClose" onClick={onClose} aria-label="닫기">
                <BoardCloseIcon />
              </button>
            )}
            <header className="boardResultHeader">
              <div className="boardHeader">
                <img
                  src="/assets/todo/flower_cluster_left.png"
                  alt=""
                  className="boardHeaderFlower"
                  aria-hidden="true"
                />
                <h1 className="boardTitle">오늘의 할 일 목록</h1>
                <img
                  src="/assets/todo/flower_cluster_right.png"
                  alt=""
                  className="boardHeaderFlower"
                  aria-hidden="true"
                />
              </div>
              <div className="boardResultSub">
                <span className="boardDividerStar">✦</span>
                오늘의 할 일을 저장했어요
                <span className="boardDividerStar">✦</span>
              </div>
            </header>

            <div className="boardBody">
              <section className="boardCard boardGenerated">
                <div className="boardTodoList">
                  {committed.map((q, index) => {
                    const tag = q.tagId != null ? tagById.get(q.tagId) : undefined;
                    return (
                      <div key={q.id} className="boardQuestRow">
                        {q.questText ? (
                          <img
                            src={q.characterAvatarUrl ?? "/assets/character/bear.png"}
                            alt=""
                            className="boardQuestAvatar"
                          />
                        ) : (
                          <img src={pinSrc(index)} alt="" className="boardPin" aria-hidden="true" />
                        )}
                        <div className="boardQuestContent">
                          <div className="boardQuestTop">
                            <span className="boardQuestTitle">{q.title}</span>
                            {tag && (
                              <span
                                className="boardChip"
                                style={{
                                  background: `${tag.color}22`,
                                  color: readableInk(tag.color),
                                  borderColor: tag.color,
                                }}
                              >
                                #{tag.content}
                              </span>
                            )}
                          </div>
                          {q.questText && (
                            <div className="boardQuestDesc">
                              <span className="boardDividerStar">✦</span>
                              <span>
                                <b>{q.characterName ?? "애착인형"}</b>
                                <span className="boardQuestLabel">퀘스트</span>
                                {q.questText}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>

            <footer className="boardFooter">
              <button type="button" className="boardSaveBtn" onClick={() => onClose?.()}>
                <span>✓</span> 완료
              </button>
            </footer>
          </div>
        </div>
      )}

      {toast && (
        <div className="tdToast">
          <span>🌸</span>
          <span className="tdToastText">{toast}</span>
        </div>
      )}
    </div>
  );
}
