import { useEffect, useRef, useState } from "react";
import "./todoCreation.css";
import {
  buildCommitPayload,
  formatTodayIso,
  postWebJson,
  type TodoCommitResponse,
  type TodoGenerateResult,
} from "./todoApi.js";

export type TodoItem = {
  id: string;
  title: string;
  dueDate: string;
  tags: string[];
  status: "candidate" | "saved" | "done";
};

export type QuestCommitPreview = {
  questId: string;
  content: string;
  characterId: string;
  todoId: string;
  todoTitle: string;
};

export type TodoCommitResult = {
  todos: TodoItem[];
  questPreviews: QuestCommitPreview[];
  calendarEventCount: number;
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
const ANIMALS = ["choco", "nabi", "mongsil", "tosil", "kong", "mul"];
const ANIMAL_NAMES = ["초코", "나비", "몽실이", "토실이", "콩이", "물동이"];
const DESCS = [
  "몸을 가볍게 움직여보기!",
  "보송한 하루 만들기!",
  "먼지를 싹 정리하기!",
  "바람 쐬며 기분 전환하기!",
  "건강 챙기고 힘내기!",
  "촉촉한 하루 보내기!",
  "오늘도 활기차게 시작!",
  "조금씩 꾸준히 해봐요!",
  "기분 좋은 하루 만들기!",
  "한 걸음씩 천천히!",
];

function getTagColor(tag: string, idx: number) {
  return TAG_COLORS[tag] ?? EXTRA_COLORS[idx % EXTRA_COLORS.length];
}

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

type LocalTodo = { id: string; name: string; tags: string[] };
type Quest = {
  id: string;
  title: string;
  tags: string[];
  animal: string;
  who: string;
  desc: string;
};

type TodoCreationProps = {
  apiBase: string;
  savedTodos: TodoItem[];
  onNotice: (message: string) => void;
  onTodosSaved: (result: TodoCommitResult) => void;
};

export function TodoCreation({
  apiBase,
  savedTodos: _savedTodos,
  onNotice,
  onTodosSaved,
}: TodoCreationProps) {
  const [sentence, setSentence] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiTodos, setAiTodos] = useState<LocalTodo[]>([]);

  const [manualText, setManualText] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [addingTag, setAddingTag] = useState(false);
  const [tagText, setTagText] = useState("");
  const [customTags, setCustomTags] = useState<string[]>([]);
  const [todos, setTodos] = useState<LocalTodo[]>([]);

  const [page, setPage] = useState<0 | 1>(0);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [spinning, setSpinning] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [toast, setToast] = useState("");

  const tagInputRef = useRef<HTMLInputElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>();
  const spinTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(
    () => () => {
      clearTimeout(toastTimer.current);
      clearTimeout(spinTimer.current);
    },
    [],
  );

  function showToast(msg: string) {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2600);
  }

  function toggleTag(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }

  function startAddTag() {
    setAddingTag(true);
    setTimeout(() => tagInputRef.current?.focus(), 0);
  }

  function commitTag() {
    const t = tagText.trim();
    const known = [...BUILT_IN_TAGS, ...customTags];
    if (t && !known.includes(t)) {
      setCustomTags((prev) => [...prev, t]);
      setSelectedTags((prev) => [...prev, t]);
    }
    setAddingTag(false);
    setTagText("");
  }

  function addTodo() {
    const name = manualText.trim();
    if (!name) return;
    setTodos((prev) => [...prev, { id: createId("td"), name, tags: [...selectedTags] }]);
    setManualText("");
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
      const result = await postWebJson<TodoGenerateResult>(apiBase, "/api/v1/todos/generate/", {
        prompt: raw,
      });
      const items = [...result.todos, ...result.calendar_events].map((t) => ({
        id: createId("ai"),
        name: t.title,
        tags: t.tags ?? [],
      }));
      setAiTodos(items);
      setConfirmed(true);
      showToast(`AI가 ${items.length}개의 할 일로 나눴어요!`);
    } catch {
      const parts = raw
        .split(/[,.\n·]|그리고|하고|및/)
        .map((x) => x.trim())
        .filter((x) => x.length > 1);
      const fallback = parts.slice(0, 6).map((p) => ({ id: createId("ai"), name: p, tags: [] }));
      setAiTodos(fallback);
      setConfirmed(true);
      showToast("할 일로 나눴어요!");
    } finally {
      setAiLoading(false);
    }
  }

  function handleGenerate() {
    const all = [...aiTodos, ...todos];
    if (!all.length) {
      showToast("할 일을 먼저 추가해주세요!");
      return;
    }
    const newQuests: Quest[] = all.map((t, i) => ({
      id: createId("q"),
      title: t.name,
      tags: t.tags.length ? t.tags : ["일상"],
      animal: ANIMALS[i % ANIMALS.length],
      who: ANIMAL_NAMES[i % ANIMAL_NAMES.length],
      desc: DESCS[i % DESCS.length],
    }));
    setQuests(newQuests);
    setChecked({});
    setPage(1);
    showToast("퀘스트를 생성했어요!");
  }

  function handleRegenerate() {
    setSpinning(true);
    setQuests((prev) =>
      prev.map((q, i) => ({
        ...q,
        desc: DESCS[(i + 1 + Math.floor(Math.random() * 4)) % DESCS.length],
      })),
    );
    clearTimeout(spinTimer.current);
    spinTimer.current = setTimeout(() => setSpinning(false), 600);
  }

  function toggleCheck(id: string) {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  async function handleAddToToday() {
    if (!quests.length) {
      showToast("먼저 생성하기를 눌러주세요!");
      return;
    }
    setIsBusy(true);
    const today = formatTodayIso();
    try {
      const items = quests.map((q) => ({ title: q.title, dueDate: today, tags: q.tags }));
      const result = await postWebJson<TodoCommitResponse>(
        apiBase,
        "/api/v1/todos/commit/",
        buildCommitPayload(items),
      );
      const savedItems = result.todos.map((t) => ({
        id: t.todo_id,
        title: t.content,
        dueDate: t.todo_date,
        tags: t.tags,
        status: "saved" as const,
      }));
      onTodosSaved({
        todos: savedItems,
        questPreviews: result.todos.flatMap((t) =>
          t.quest
            ? [
                {
                  questId: t.quest.quest_id,
                  content: t.quest.content,
                  characterId: t.quest.character_id,
                  todoId: t.todo_id,
                  todoTitle: t.content,
                },
              ]
            : [],
        ),
        calendarEventCount: result.calendar_events.length,
      });
      showToast(`${quests.length}개의 할 일이 오늘의 목록에 추가됐어요!`);
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
              <img src="/assets/character/mp-lock.png" alt="" className="tdLockIcon" />
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
          <div className="tdSection">
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
                  onChange={(e) => setTagText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      commitTag();
                    } else if (e.key === "Escape") {
                      setAddingTag(false);
                      setTagText("");
                    }
                  }}
                  onBlur={commitTag}
                  placeholder="태그명"
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
                  <span className="tdTodoName">{todo.name}</span>
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
                        </span>
                      );
                    })}
                  </div>
                  <button
                    type="button"
                    className="tdDeleteBtn"
                    onClick={() => deleteTodo(todo.id)}
                    title="삭제"
                  >
                    🗑
                  </button>
                </div>
              ))}
            </div>
          </div>

          <button type="button" className="tdGenerateBtn" onClick={handleGenerate}>
            <span className="tdGenStar">✨</span> 생성하기
          </button>
        </div>
      )}

      {/* ── PAGE 1: QUEST PREVIEW ── */}
      {page === 1 && (
        <div className="tdPanel tdSingle tdPageIn">
          <div className="tdRightHeader">
            <button type="button" className="tdBackBtn" onClick={() => setPage(0)}>
              ← 돌아가기
            </button>
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
              <div className="tdQuestEmpty">왼쪽에서 생성하기를 눌러보세요 🌸</div>
            ) : (
              quests.map((q) => {
                const ck = !!checked[q.id];
                return (
                  <div key={q.id} className="tdQuestRow">
                    <button
                      type="button"
                      className="tdCheckbox"
                      style={{
                        borderColor: ck ? "#93C56A" : "#D9BE84",
                        background: ck ? "#93C56A" : "#FFFDF6",
                      }}
                      onClick={() => toggleCheck(q.id)}
                    >
                      {ck && <span className="tdCheckMark">✓</span>}
                    </button>
                    <img src="/assets/character/avatar.png" alt="" className="tdAnimalAvatar" />
                    <div className="tdQuestContent">
                      <div className="tdQuestTitleRow">
                        <span
                          className="tdQuestTitle"
                          style={{
                            color: ck ? "#B6A78C" : "#6E5C44",
                            textDecoration: ck ? "line-through" : "none",
                            opacity: ck ? 0.6 : 1,
                          }}
                        >
                          {q.title}
                        </span>
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
                        <span>
                          {q.who}의 퀘스트: {q.desc}
                        </span>
                        <span className="tdAccentStar">✦</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="tdRightFooter">
            <button type="button" className="tdRegenBtn" onClick={handleRegenerate}>
              <span
                style={
                  spinning ? { display: "inline-block", animation: "tdSpin .6s linear" } : undefined
                }
              >
                ↻
              </span>
              다시 생성
            </button>
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
