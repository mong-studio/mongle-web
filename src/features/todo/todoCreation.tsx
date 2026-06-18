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
// 커밋 완료 화면(2단계)에 보여줄 항목: 확정된 TODO + 애착인형에게 부여된 퀘스트.
type CommittedQuest = {
  id: string;
  title: string;
  tagId: number | null;
  characterName: string | null;
  characterAvatarUrl: string | null;
  questText: string | null;
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
  const [aiLoading, setAiLoading] = useState(false);

  const [manualText, setManualText] = useState("");
  const [selectedTagId, setSelectedTagId] = useState<number | null>(null);
  const [todos, setTodos] = useState<LocalTodo[]>([]);

  // page 0: 게시판(작성/정리), page 1: 커밋 결과(확정 TODO + 캐릭터 퀘스트)
  const [page, setPage] = useState<0 | 1>(0);
  const [committed, setCommitted] = useState<CommittedQuest[]>([]);
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

  // 좌측 "이장님에게 말하기": 문장을 AI가 여러 TODO로 나눠 목록에 더한다.
  async function handleOrganize() {
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
      setSentence("");
      showToast(`이장님이 ${items.length}개의 할 일로 정리했어요!`);
    } catch {
      showToast("이장님이 할 일을 정리하지 못했어요. 잠시 후 다시 시도해주세요.");
    } finally {
      setAiLoading(false);
    }
  }

  // 푸터 "애착인형에게 퀘스트 부여하기": 퀘스트 배정(preview) → 커밋(confirm) → 결과 화면.
  async function handleAssignAndCommit() {
    if (isBusy) return;
    if (!todos.length) {
      showToast("할 일을 먼저 추가해주세요!");
      return;
    }
    setIsBusy(true);
    try {
      // 1) 애착인형(캐릭터)에게 퀘스트 배정
      const preview = await previewTodoQuests({
        todos: todos.map((todo) => ({ content: todo.name, tags: tagNames(todo.tagId) })),
      });
      const assigned = preview.todos.map((todo, index) => {
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
          isTemporary: !todo.quest && Boolean(fallbackQuest),
          characterId: quest?.character_id ?? null,
          characterName: quest?.character_name ?? null,
          characterAvatarUrl:
            residentByQuest?.avatarUrl ??
            quest?.character_image_url ??
            fallbackResident?.avatarUrl ??
            null,
          questText: quest?.content ?? null,
          tagId: todos[index]?.tagId ?? matchTagId(todo.tags),
          title: todo.content,
        };
      });

      // 2) 확정(commit). 임시 퀘스트가 아닌 경우에만 캐릭터 퀘스트를 함께 저장.
      const result = await confirmTodos({
        todos: assigned.map((q) => ({
          content: q.title,
          todo_date: formatTodayIso(),
          tags: tagNames(q.tagId),
          quest:
            !q.isTemporary && q.characterId && q.questText
              ? { character_id: q.characterId, content: q.questText }
              : null,
        })),
      });

      // 3) 앱 상태(HUD 등) 갱신용 결과 전달
      const savedItems: TodoItem[] = result.todos.map((todo, index) => {
        const a = assigned[index];
        const tag = a?.tagId != null ? tagById.get(a.tagId) : undefined;
        const savedQuest = todo.quest
          ? {
              characterName: todo.quest.character_name,
              content: todo.quest.content,
              isTemporary: false,
            }
          : a?.questText
            ? { characterName: a.characterName, content: a.questText, isTemporary: a.isTemporary }
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

      // 4) 확정 결과 화면(확정 TODO + 캐릭터 퀘스트)
      setCommitted(
        result.todos.map((todo, index) => {
          const a = assigned[index];
          return {
            id: todo.todo_id,
            title: todo.content,
            tagId: a?.tagId ?? null,
            characterName: todo.quest?.character_name ?? a?.characterName ?? null,
            characterAvatarUrl: a?.characterAvatarUrl ?? null,
            questText: todo.quest?.content ?? a?.questText ?? null,
          };
        }),
      );
      setPage(1);
      showToast(
        preview.quest_distribution_triggered
          ? "애착인형들에게 퀘스트를 부여했어요!"
          : "AI 연결 전이라 임시 퀘스트를 표시했어요.",
      );
    } catch (error) {
      onNotice(`퀘스트 부여 실패: ${error instanceof Error ? error.message : "원인 미상"}`);
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <div className="tdRoot">
      {/* ── PAGE 0: 마을 게시판 ── */}
      {page === 0 && (
        <div className="boardPanel">
          {onClose && (
            <button type="button" className="boardClose" onClick={onClose} aria-label="닫기">
              ✕
            </button>
          )}

          {/* HEADER */}
          <header className="boardHeader">
            <img src="/assets/mongle_chief.png" alt="이장님" className="boardMayor" />
            <div className="boardPlaque">
              <span className="boardPlaqueStar boardPlaqueStar--l">✦</span>
              <h1 className="boardTitle">오늘의 마을 게시판</h1>
              <span className="boardPlaqueStar boardPlaqueStar--r">✦</span>
            </div>
            <span className="boardHeaderDeco" aria-hidden="true">
              🌼
            </span>
          </header>

          {/* BODY */}
          <div className="boardBody">
            <div className="boardRow">
              {/* LEFT: 이장님에게 말하기 */}
              <section className="boardCard">
                <div className="boardCardHead">
                  <span className="boardCardIcon" aria-hidden="true">
                    💬
                  </span>
                  <span className="boardCardTitle">이장님에게 말하기</span>
                  <span className="boardCardDeco" aria-hidden="true">
                    🌷
                  </span>
                </div>
                <div className="boardField">
                  <div className="boardFieldHint">오늘 해야 할 일을 문장으로 말해주세요</div>
                  <textarea
                    className="boardTextarea"
                    value={sentence}
                    onChange={(e) => setSentence(e.target.value)}
                    rows={3}
                    placeholder="예) 헬스장 가야하고, 빨래 돌리고, 청소기도 돌려야해"
                  />
                </div>
                <button
                  type="button"
                  className="boardOrganizeBtn"
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
                  <span className="boardCardIcon" aria-hidden="true">
                    📝
                  </span>
                  <span className="boardCardTitle">직접 적기</span>
                  <span className="boardCardDeco" aria-hidden="true">
                    🌷
                  </span>
                </div>
                <div className="boardAddRow">
                  <input
                    className="boardInput"
                    value={manualText}
                    onChange={(e) => setManualText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        if (isImeComposing(e)) return;
                        e.preventDefault();
                        addTodo();
                      }
                    }}
                    placeholder="할 일을 적어주세요"
                  />
                  <button type="button" className="boardAddBtn" onClick={addTodo}>
                    추가
                  </button>
                </div>
                {/* 캘린더와 공유하는 유저 태그 캐시(useTags). 새 할일에 적용할 태그 하나 선택. */}
                <div className="boardTagBox">
                  <div className="boardTagBoxTitle">
                    <span>✿</span> 태그 선택 <span>✿</span>
                  </div>
                  <TagPicker
                    tags={tagItems}
                    selectedId={selectedTagId}
                    onSelect={setSelectedTagId}
                    onCreateTag={createTag}
                    onEditTag={editTag}
                    onDeleteTag={deleteTag}
                  />
                </div>
              </section>
            </div>

            {/* BOTTOM: 생성된 TODO */}
            <section className="boardCard boardGenerated">
              <div className="boardSectionDivider">
                <span className="boardDividerLine" />
                <span className="boardDividerLabel">
                  <span className="boardDividerStar">✦</span> 생성된 TODO{" "}
                  <span className="boardDividerStar">✦</span>
                </span>
                <span className="boardDividerLine" />
              </div>

              {todos.length === 0 ? (
                <div className="boardEmpty">아직 생성된 TODO가 없어요. 위에서 추가해보세요!</div>
              ) : (
                <div className="boardTodoList">
                  {todos.map((todo) => {
                    const tag = todo.tagId != null ? tagById.get(todo.tagId) : undefined;
                    return (
                      <div key={todo.id} className="boardTodoRow">
                        <span className="boardPin" aria-hidden="true">
                          📌
                        </span>
                        <input
                          className="boardTodoName"
                          value={todo.name}
                          onChange={(event) => updateTodoName(todo.id, event.target.value)}
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
                                ×
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
              )}
            </section>
          </div>

          {/* FOOTER */}
          <footer className="boardFooter">
            <button
              type="button"
              className="boardSaveBtn"
              onClick={() => void handleAssignAndCommit()}
              disabled={isBusy}
            >
              {isBusy ? <span className="tdSpinner tdSpinner--lg" /> : <span>✨</span>}
              {isBusy ? "퀘스트 부여 중..." : "애착인형에게 퀘스트 부여하기"}
              {!isBusy && <span>💾</span>}
            </button>
          </footer>
        </div>
      )}

      {/* ── PAGE 1: 확정 TODO + 캐릭터 퀘스트 ── */}
      {page === 1 && (
        <div className="boardPanel tdPageIn">
          {onClose && (
            <button type="button" className="boardClose" onClick={onClose} aria-label="닫기">
              ✕
            </button>
          )}
          <header className="boardResultHeader">
            <div className="boardPlaque">
              <span className="boardPlaqueStar boardPlaqueStar--l">✦</span>
              <h1 className="boardTitle">오늘의 할 일 목록</h1>
              <span className="boardPlaqueStar boardPlaqueStar--r">✦</span>
            </div>
            <div className="boardResultSub">
              <span className="boardDividerStar">✦</span>
              애착인형들에게 퀘스트를 부여했어요
              <span className="boardDividerStar">✦</span>
            </div>
          </header>

          <div className="boardBody">
            <section className="boardCard boardGenerated">
              <div className="boardTodoList">
                {committed.map((q) => {
                  const tag = q.tagId != null ? tagById.get(q.tagId) : undefined;
                  return (
                    <div key={q.id} className="boardQuestRow">
                      <img
                        src={q.characterAvatarUrl ?? "/assets/character/bear.png"}
                        alt=""
                        className="boardQuestAvatar"
                      />
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
                        <div className="boardQuestDesc">
                          <span className="boardDividerStar">✦</span>
                          {q.questText ? (
                            <span>
                              <b>{q.characterName ?? "애착인형"}</b>
                              <span className="boardQuestLabel">퀘스트</span>
                              {q.questText}
                            </span>
                          ) : (
                            <span>아직 이 할 일에 부여된 퀘스트가 없어요.</span>
                          )}
                        </div>
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
