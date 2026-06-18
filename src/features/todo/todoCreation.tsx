import { useEffect, useMemo, useRef, useState } from "react";
import { useTags } from "../../shared/tags/useTags.js";
import { readableInk } from "../../shared/ui/Tag/Tag.js";
import { TagPicker } from "../../shared/ui/tags/TagPicker.js";
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

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function isImeComposing(event: React.KeyboardEvent<HTMLInputElement>) {
  return event.nativeEvent.isComposing || event.key === "Process" || event.keyCode === 229;
}

// 항목당 태그 1개(백엔드 Todo.tag FK가 단일). 캘린더와 동일한 유저 태그를 공유한다.
type LocalTodo = { id: string; name: string; tagId: number | null };
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
  tagId: number | null;
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
  const [selectedTagId, setSelectedTagId] = useState<number | null>(null);
  const [todos, setTodos] = useState<LocalTodo[]>([]);

  const [page, setPage] = useState<0 | 1>(0);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [isBusy, setIsBusy] = useState(false);
  const [toast, setToast] = useState("");

  const toastTimer = useRef<ReturnType<typeof setTimeout>>();

  // 유저 태그는 캘린더와 동일한 /tags/ 에서 공유한다. 이 모달은 로그인 상태에서만 열린다.
  const { tagItems, fetchTags, createTag, editTag, deleteTag } = useTags(true);

  useEffect(() => {
    void fetchTags();
  }, [fetchTags]);

  const tagById = useMemo(() => new Map(tagItems.map((t) => [t.id, t])), [tagItems]);
  const tagByContent = useMemo(() => new Map(tagItems.map((t) => [t.content, t])), [tagItems]);

  // 선택된 태그의 이름을 API용 배열로. 없으면 빈 배열(백엔드가 기본 태그로 처리).
  const tagNames = (tagId: number | null): string[] => {
    const t = tagId !== null ? tagById.get(tagId) : undefined;
    return t ? [t.content] : [];
  };
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

  function showToast(msg: string) {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2600);
  }

  function addTodo() {
    const name = manualText.trim();
    if (!name) return;
    setTodos((prev) => [...prev, { id: createId("td"), name, tagId: selectedTagId }]);
    setManualText("");
  }

  function updateTodoName(id: string, name: string) {
    setTodos((prev) => prev.map((todo) => (todo.id === id ? { ...todo, name } : todo)));
  }

  function clearTodoTag(id: string) {
    setTodos((prev) => prev.map((todo) => (todo.id === id ? { ...todo, tagId: null } : todo)));
  }

  function applySelectedTag(id: string) {
    if (selectedTagId === null) {
      showToast("먼저 적용할 태그를 선택해주세요.");
      return;
    }
    setTodos((prev) =>
      prev.map((todo) => (todo.id === id ? { ...todo, tagId: selectedTagId } : todo)),
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
        tagId: matchTagId(t.tags),
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
          tags: tagNames(todo.tagId),
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
            tagId: todos[index]?.tagId ?? matchTagId(todo.tags),
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
    try {
      const result = await confirmTodos({
        todos: quests.map((q) => ({
          content: q.title,
          todo_date: formatTodayIso(),
          tags: tagNames(q.tagId),
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
        const tag = previewQuest?.tagId != null ? tagById.get(previewQuest.tagId) : undefined;
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
          tags: tag ? [tag.content] : [],
          tagColors: tag ? { [tag.content]: tag.color } : {},
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

            {/* 캘린더와 공유하는 유저 태그. 새 할일에 적용할 태그를 하나 고른다. */}
            <TagPicker
              tags={tagItems}
              selectedId={selectedTagId}
              onSelect={setSelectedTagId}
              onCreateTag={createTag}
              onEditTag={editTag}
              onDeleteTag={deleteTag}
            />

            <div className="tdTodoList">
              {todos.map((todo) => {
                const tag = todo.tagId != null ? tagById.get(todo.tagId) : undefined;
                return (
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
                      {tag && (
                        <span
                          className="tdHashChip"
                          style={{ background: `${tag.color}22`, color: readableInk(tag.color) }}
                        >
                          #{tag.content}
                          <button
                            type="button"
                            className="tdHashRemove"
                            onClick={() => clearTodoTag(todo.id)}
                            aria-label={`${tag.content} 태그 제거`}
                          >
                            ×
                          </button>
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      className="tdApplyTagBtn"
                      onClick={() => applySelectedTag(todo.id)}
                    >
                      태그 적용
                    </button>
                    <button
                      type="button"
                      className="tdDeleteBtn"
                      onClick={() => deleteTodo(todo.id)}
                    >
                      삭제
                    </button>
                  </div>
                );
              })}
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
              quests.map((q) => {
                const tag = q.tagId != null ? tagById.get(q.tagId) : undefined;
                return (
                  <div key={q.id} className="tdQuestRow">
                    <img
                      src={q.characterAvatarUrl ?? "/assets/character/avatar.png"}
                      alt=""
                      className="tdAnimalAvatar"
                    />
                    <div className="tdQuestContent">
                      <span className="tdQuestTitleText">{q.title}</span>
                      {tag && (
                        <div className="tdQuestTagRow">
                          <span
                            className="tdQuestChip"
                            style={{ background: `${tag.color}22`, color: readableInk(tag.color) }}
                          >
                            {tag.content}
                          </span>
                        </div>
                      )}
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
                );
              })
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
