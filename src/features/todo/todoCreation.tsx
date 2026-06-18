import { useEffect, useRef, useState } from "react";
import "./todoCreation.css";
import { confirmTodos, formatTodayIso, generateTodos, previewTodoQuests } from "./todoApi.js";

export type TodoItem = {
  id: string;
  title: string;
  dueDate: string;
  tags: string[];
  tagColors?: Record<string, string>;
  status: "candidate" | "saved" | "done";
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

const TAG_COLORS: Record<string, { bg: string; fg: string; sel: string }> = {
  일상: { bg: "#E7DCF5", fg: "#8268B0", sel: "#B79FD9" },
  건강: { bg: "#DCEBC2", fg: "#5E8C3C", sel: "#93C56A" },
  집안일: { bg: "#CFE6F2", fg: "#3E7C9A", sel: "#7FB8D4" },
  청소: { bg: "#E2D6F1", fg: "#7D5BA6", sel: "#B79FD9" },
  공부: { bg: "#FBEFC9", fg: "#B07F1E", sel: "#EAC45C" },
  작업: { bg: "#FBE0C5", fg: "#C0763E", sel: "#EBA877" },
  운동: { bg: "#F8D9DF", fg: "#C56B7D", sel: "#EC9BB0" },
};
const EXTRA_COLORS = [
  { bg: "#CDE9DD", fg: "#3F8E6B", sel: "#8FCFB0" },
  { bg: "#FBDAC0", fg: "#C0763E", sel: "#EBA877" },
];
const BUILT_IN_TAGS = Object.keys(TAG_COLORS);
const MAX_TAGS_PER_TODO = 3;
const MAX_TAG_LENGTH = 10;

function getTagColor(tag: string, idx: number) {
  return TAG_COLORS[tag] ?? EXTRA_COLORS[idx % EXTRA_COLORS.length];
}

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeTodoTags(tags: string[]) {
  const normalized = tags.map((tag) => tag.trim().slice(0, MAX_TAG_LENGTH)).filter(Boolean);
  return Array.from(new Set(normalized)).slice(0, MAX_TAGS_PER_TODO);
}

function isImeComposing(event: React.KeyboardEvent<HTMLInputElement>) {
  return event.nativeEvent.isComposing || event.key === "Process" || event.keyCode === 229;
}

type LocalTodo = { id: string; name: string; tags: string[] };
type ResidentPreview = {
  id: string;
  name: string;
  personality?: string;
  persona?: string;
  avatarUrl?: string;
};
type Quest = {
  id: string;
  characterAvatarUrl: string | null;
  characterId: string | null;
  characterName: string | null;
  isTemporaryQuest: boolean;
  questText: string | null;
  previewId: string;
  title: string;
  tags: string[];
};

function createFallbackQuestText(resident: ResidentPreview) {
  // TODO: AI 서버 연결 확인 후 프론트 테스트용 fallback 제거하기.
  return `${resident.name}가 몽글마을 산책하기`;
}

type TodoCreationProps = {
  residents: ResidentPreview[];
  savedTodos: TodoItem[];
  onNotice: (message: string) => void;
  onTodosSaved: (result: TodoCommitResult) => void;
  onClose?: () => void;
};

export function TodoCreation({
  residents,
  savedTodos: _savedTodos,
  onNotice,
  onTodosSaved,
  onClose,
}: TodoCreationProps) {
  const [sentence, setSentence] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const [manualText, setManualText] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [addingTag, setAddingTag] = useState(false);
  const [tagText, setTagText] = useState("");
  const [customTags, setCustomTags] = useState<string[]>([]);
  const [todos, setTodos] = useState<LocalTodo[]>([]);

  const [page, setPage] = useState<0 | 1>(0);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [isBusy, setIsBusy] = useState(false);
  const [toast, setToast] = useState("");

  const tagInputRef = useRef<HTMLInputElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(
    () => () => {
      clearTimeout(toastTimer.current);
    },
    [],
  );

  function showToast(msg: string) {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2600);
  }

  function toggleTag(tag: string) {
    setSelectedTags((prev) => {
      if (prev.includes(tag)) {
        return prev.filter((t) => t !== tag);
      }
      if (prev.length >= MAX_TAGS_PER_TODO) {
        showToast("태그는 할 일마다 최대 3개까지 선택할 수 있어요.");
        return prev;
      }
      return normalizeTodoTags([...prev, tag]);
    });
  }

  function startAddTag() {
    setAddingTag(true);
    setTimeout(() => tagInputRef.current?.focus(), 0);
  }

  function commitTag() {
    const t = tagText.trim().slice(0, MAX_TAG_LENGTH);
    const known = [...BUILT_IN_TAGS, ...customTags];
    if (t && !known.includes(t)) {
      setCustomTags((prev) => [...prev, t]);
      setSelectedTags((prev) => {
        if (prev.length >= MAX_TAGS_PER_TODO) {
          showToast("태그가 추가됐어요. 선택은 최대 3개까지 가능해요.");
          return prev;
        }
        return normalizeTodoTags([...prev, t]);
      });
    }
    setAddingTag(false);
    setTagText("");
  }

  function addTodo() {
    const name = manualText.trim();
    if (!name) return;
    setTodos((prev) => [
      ...prev,
      { id: createId("td"), name, tags: normalizeTodoTags(selectedTags) },
    ]);
    setManualText("");
  }

  function updateTodoName(id: string, name: string) {
    setTodos((prev) => prev.map((todo) => (todo.id === id ? { ...todo, name } : todo)));
  }

  function removeTodoTag(id: string, tag: string) {
    setTodos((prev) =>
      prev.map((todo) =>
        todo.id === id ? { ...todo, tags: todo.tags.filter((item) => item !== tag) } : todo,
      ),
    );
  }

  function applySelectedTags(id: string) {
    if (!selectedTags.length) {
      showToast("먼저 적용할 태그를 선택해주세요.");
      return;
    }
    setTodos((prev) =>
      prev.map((todo) =>
        todo.id === id
          ? { ...todo, tags: normalizeTodoTags([...todo.tags, ...selectedTags]) }
          : todo,
      ),
    );
  }

  function deleteTodo(id: string) {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  }

  async function handleConfirm() {
    if (aiLoading) return;
    const raw = sentence.trim();
    if (!raw) {
      showToast("문장을 먼저 입력해주세요!");
      return;
    }
    setAiLoading(true);
    try {
      const result = await generateTodos(raw);
      const items = [...result.todos, ...result.calendar_events].map((t) => ({
        id: createId("ai"),
        name: t.title,
        tags: normalizeTodoTags(t.tags ?? []),
      }));
      setTodos((prev) => [...prev, ...items]);
      setConfirmed(true);
      showToast(`AI가 ${items.length}개의 할 일로 나눴어요!`);
    } catch {
      setConfirmed(false);
      showToast("AI가 할 일을 나누지 못했어요. 잠시 후 다시 시도해주세요.");
    } finally {
      setAiLoading(false);
    }
  }

  async function handleGenerate() {
    if (!todos.length) {
      showToast("할 일을 먼저 추가해주세요!");
      return;
    }
    if (isBusy) {
      return;
    }
    setIsBusy(true);
    try {
      const result = await previewTodoQuests({
        todos: todos.map((todo) => ({
          content: todo.name,
          tags: todo.tags.length ? normalizeTodoTags(todo.tags) : ["일상"],
        })),
      });
      setQuests(
        result.todos.map((todo, index) => {
          const residentByQuest = residents.find(
            (resident) => resident.id === todo.quest?.character_id,
          );
          const fallbackResident = residents[index % Math.max(1, residents.length)];
          const fallbackQuest =
            !todo.quest && fallbackResident
              ? {
                  character_id: fallbackResident.id,
                  character_name: fallbackResident.name,
                  character_image_url: fallbackResident.avatarUrl ?? null,
                  content: createFallbackQuestText(fallbackResident),
                }
              : null;
          const quest = todo.quest ?? fallbackQuest;
          return {
            id: todo.preview_id,
            characterAvatarUrl:
              residentByQuest?.avatarUrl ??
              quest?.character_image_url ??
              fallbackResident?.avatarUrl ??
              null,
            characterId: quest?.character_id ?? null,
            characterName: quest?.character_name ?? null,
            isTemporaryQuest: !todo.quest && Boolean(fallbackQuest),
            questText: quest?.content ?? null,
            previewId: todo.preview_id,
            title: todo.content,
            tags: todo.tags.length ? normalizeTodoTags(todo.tags) : ["일상"],
          };
        }),
      );
      setPage(1);
      showToast(
        result.quest_distribution_triggered
          ? "캐릭터 퀘스트를 생성했어요!"
          : "AI 연결 전이라 임시 퀘스트를 표시했어요.",
      );
    } catch (error) {
      onNotice(`퀘스트 생성 실패: ${error instanceof Error ? error.message : "원인 미상"}`);
    } finally {
      setIsBusy(false);
    }
  }

  async function handleAddToToday() {
    if (!quests.length) {
      showToast("먼저 생성하기를 눌러주세요!");
      return;
    }
    setIsBusy(true);
    const today = formatTodayIso();
    try {
      const result = await confirmTodos({
        todos: quests.map((q) => ({
          content: q.title,
          todo_date: today,
          tags: normalizeTodoTags(q.tags),
          quest:
            !q.isTemporaryQuest && q.characterId && q.questText
              ? {
                  character_id: q.characterId,
                  content: q.questText,
                }
              : null,
        })),
      });
      const savedItems = result.todos.map((todo, index) => {
        const previewQuest = quests[index];
        const savedQuest = todo.quest
          ? {
              characterName: todo.quest.character_name,
              content: todo.quest.content,
              isTemporary: false,
            }
          : previewQuest?.questText
            ? {
                characterName: previewQuest.characterName,
                content: previewQuest.questText,
                isTemporary: previewQuest.isTemporaryQuest,
              }
            : null;
        return {
          id: todo.todo_id,
          title: todo.content,
          dueDate: todo.todo_date,
          tags: normalizeTodoTags(todo.tags),
          status: "saved" as const,
          assignedQuest: savedQuest,
        };
      });
      onTodosSaved({
        todos: savedItems,
        questPreviews: result.todos.flatMap((todo) =>
          todo.quest
            ? [
                {
                  questId: todo.quest.quest_id,
                  content: todo.quest.content,
                  characterId: todo.quest.character_id,
                  characterName: todo.quest.character_name,
                  todoId: todo.todo_id,
                  todoTitle: todo.content,
                },
              ]
            : [],
        ),
      });
      showToast(`${savedItems.length}개의 할 일이 오늘의 목록에 추가됐어요!`);
      onClose?.();
    } catch (error) {
      onNotice(`TODO 저장 실패: ${error instanceof Error ? error.message : "원인 미상"}`);
    } finally {
      setIsBusy(false);
    }
  }

  const allTags = [...BUILT_IN_TAGS, ...customTags];

  return (
    <div className="tdRoot">
      {/* ── PAGE 0: INPUT ── */}
      {page === 0 && (
        <div className="tdPanel tdSingle">
          {onClose && (
            <button type="button" className="tdCloseBtn" onClick={onClose} aria-label="닫기">
              ✕
            </button>
          )}
          <div className="tdHeader">
            <img src="/assets/character/deco-flowers-l.png" alt="" className="tdFlower" />
            <h1 className="tdTitle">TODO 만들기</h1>
            <img
              src="/assets/character/deco-flowers-r.png"
              alt=""
              className="tdFlower tdFlower--r"
            />
          </div>

          {/* Section 1 */}
          <div className="tdSection">
            <div className="tdSectionHead">
              <span className="tdNumBadge">1</span>
              <span className="tdSectionTitle">무엇을 계획하고 싶나요?</span>
            </div>
            <div className="tdTextareaWrap">
              <textarea
                className="tdTextarea"
                value={sentence}
                onChange={(e) => {
                  setSentence(e.target.value);
                  setConfirmed(false);
                }}
                rows={4}
                placeholder="예) 오늘 헬스장 가야하고, 빨래 돌리고, 청소기도 돌려야해"
              />
              {confirmed && (
                <div className="tdConfirmedBadge">
                  <span className="tdConfirmedCheck">✓</span> 입력 완료
                </div>
              )}
            </div>
            <div className="tdConfirmRow">
              <span className="tdHintIcon">🌸</span>
              <span className="tdHintText">입력한 문장을 AI가 여러 TODO로 나눠드려요.</span>
              <button type="button" className="tdConfirmBtn" onClick={handleConfirm}>
                {aiLoading && <span className="tdSpinner" />}
                확인
              </button>
            </div>
          </div>

          <div className="tdDivider" />

          {/* Section 2 */}
          <div className="tdSection tdSection--grow">
            <div className="tdSectionHead">
              <span className="tdNumBadge">2</span>
              <span className="tdSectionTitle">직접 TODO 추가</span>
            </div>
            <div className="tdInputRow">
              <input
                className="tdInput"
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    if (isImeComposing(e)) {
                      return;
                    }
                    e.preventDefault();
                    addTodo();
                  }
                }}
                placeholder="할 일을 입력하세요"
              />
              <button type="button" className="tdAddBtn" onClick={addTodo}>
                추가
              </button>
            </div>

            <div className="tdChips">
              {allTags.map((tag, i) => {
                const c = getTagColor(tag, i);
                const sel = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    className="tdChip"
                    style={
                      sel
                        ? {
                            background: c.sel,
                            color: "#fff",
                            border: "2px solid transparent",
                            boxShadow: `0 3px 8px -3px ${c.sel}`,
                          }
                        : { background: c.bg, color: c.fg, border: "2px solid transparent" }
                    }
                    onClick={() => toggleTag(tag)}
                  >
                    {sel && <span className="tdChipCheck">✓</span>}
                    {tag}
                  </button>
                );
              })}
              {addingTag ? (
                <input
                  ref={tagInputRef}
                  className="tdTagInput"
                  value={tagText}
                  maxLength={MAX_TAG_LENGTH}
                  onChange={(e) => setTagText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      if (isImeComposing(e)) {
                        return;
                      }
                      e.preventDefault();
                      commitTag();
                    } else if (e.key === "Escape") {
                      setAddingTag(false);
                      setTagText("");
                    }
                  }}
                  onBlur={commitTag}
                  placeholder="태그명"
                  aria-label="태그명 입력, 최대 10글자"
                />
              ) : (
                <button type="button" className="tdAddTag" onClick={startAddTag}>
                  + 태그 추가
                </button>
              )}
            </div>

            <div className="tdTodoList">
              {todos.map((todo) => (
                <div key={todo.id} className="tdTodoRow">
                  <span className="tdDragDots">
                    {[0, 1, 2].map((ri) => (
                      <span key={ri} className="tdDotRow">
                        <span className="tdDot" />
                        <span className="tdDot" />
                      </span>
                    ))}
                  </span>
                  <input
                    className="tdTodoNameInput"
                    value={todo.name}
                    onChange={(event) => updateTodoName(todo.id, event.target.value)}
                    aria-label="TODO 항목 수정"
                  />
                  <div className="tdTodoChips">
                    {todo.tags.map((tag, i) => {
                      const c = getTagColor(tag, i);
                      return (
                        <span
                          key={tag}
                          className="tdHashChip"
                          style={{ background: c.bg, color: c.fg }}
                        >
                          #{tag}
                          <button
                            type="button"
                            className="tdHashRemove"
                            onClick={() => removeTodoTag(todo.id, tag)}
                            aria-label={`${tag} 태그 제거`}
                          >
                            ×
                          </button>
                        </span>
                      );
                    })}
                  </div>
                  <button
                    type="button"
                    className="tdApplyTagBtn"
                    onClick={() => applySelectedTags(todo.id)}
                  >
                    태그 적용
                  </button>
                  <button type="button" className="tdDeleteBtn" onClick={() => deleteTodo(todo.id)}>
                    삭제
                  </button>
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            className="tdGenerateBtn"
            onClick={() => void handleGenerate()}
            disabled={isBusy}
          >
            {isBusy ? <span className="tdSpinner" /> : <span className="tdGenStar">✨</span>}
            {isBusy ? "생성 중..." : "생성하기"}
          </button>
        </div>
      )}

      {/* ── PAGE 1: QUEST PREVIEW ── */}
      {page === 1 && (
        <div className="tdPanel tdSingle tdPageIn">
          <div className="tdRightHeader">
            <div className="tdRightTitle">
              <img src="/assets/character/deco-flowers-l.png" alt="" className="tdFlowerSm" />
              <h2 className="tdRightTitleText">오늘의 할 일 목록</h2>
              <img src="/assets/character/deco-flowers-r.png" alt="" className="tdFlowerSm" />
            </div>
            <div className="tdRightSub">
              <span className="tdStar">✦</span>
              캐릭터 퀘스트와 함께 생성됐어요
              <span className="tdStar tdStar--delay">✦</span>
            </div>
          </div>

          <div className="tdQuestList">
            {quests.length === 0 ? (
              <div className="tdQuestEmpty">돌아가서 TODO를 추가해주세요!!</div>
            ) : (
              quests.map((q) => (
                <div key={q.id} className="tdQuestRow">
                  <img
                    src={q.characterAvatarUrl ?? "/assets/character/avatar.png"}
                    alt=""
                    className="tdAnimalAvatar"
                  />
                  <div className="tdQuestContent">
                    <span className="tdQuestTitleText">{q.title}</span>
                    <div className="tdQuestTagRow">
                      {q.tags.map((tag, i) => {
                        const c = getTagColor(tag, i);
                        return (
                          <span
                            key={tag}
                            className="tdQuestChip"
                            style={{ background: c.bg, color: c.fg }}
                          >
                            {tag}
                          </span>
                        );
                      })}
                    </div>
                    <div className="tdQuestDesc">
                      <span className="tdAccentStar">✦</span>
                      {q.questText ? (
                        <span>
                          <b>{q.characterName ?? "캐릭터"}</b>
                          <span className="tdQuestLabel">퀘스트</span>
                          {q.questText}
                        </span>
                      ) : (
                        <span>아직 이 할 일에 부여된 캐릭터 퀘스트가 없어요.</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="tdRightFooter">
            <button
              type="button"
              className="tdAddTodayBtn"
              onClick={handleAddToToday}
              disabled={isBusy}
            >
              <span>✓</span> 오늘의 할 일에 추가
            </button>
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
