import { useState } from "react";
import "./todoCreation.css";
import {
  buildCommitPayload,
  formatTodayIso,
  postWebJson,
  type TodoCommitResponse,
  type TodoGenerateResult,
} from "../todoApi.js";

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

type TodoCreationProps = {
  apiBase: string;
  userId: string;
  savedTodos: TodoItem[];
  onNotice: (message: string) => void;
  onTodosSaved: (result: TodoCommitResult) => void;
};

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getTagTone(tag?: string) {
  if (tag?.includes("건강")) return "health";
  if (tag?.includes("생활")) return "life";
  if (tag?.includes("업무")) return "work";
  return "default";
}

export function TodoCreation({
  apiBase,
  userId: _userId,
  savedTodos,
  onNotice,
  onTodosSaved,
}: TodoCreationProps) {
  const [prompt, setPrompt] = useState("");
  const [candidates, setCandidates] = useState<TodoItem[]>([]);
  const [isBusy, setIsBusy] = useState(false);

  async function splitTodoPrompt() {
    const trimmed = prompt.trim();
    if (!trimmed) {
      onNotice("먼저 오늘 할 일을 적어주세요.");
      return;
    }

    setIsBusy(true);
    try {
      const result = await postWebJson<TodoGenerateResult>(apiBase, "/api/v1/todos/generate/", {
        prompt: trimmed,
      });
      const nextCandidates = [...result.todos, ...result.calendar_events].map((task) => ({
        id: createId("todo"),
        title: task.title,
        dueDate: task.due_date,
        tags: task.tags ?? [],
        status: "candidate" as const,
      }));
      setCandidates(nextCandidates);
      onNotice(
        result.calendar_events.length > 0
          ? "AI가 오늘 TODO와 미래 일정을 함께 정리했어요."
          : "AI가 TODO 후보를 나눴어요. 저장하면 서버에 반영됩니다.",
      );
    } catch (error) {
      onNotice(`TODO 분리 실패: ${error instanceof Error ? error.message : "원인 미상"}`);
    } finally {
      setIsBusy(false);
    }
  }

  async function saveTodoCandidate(candidate: TodoItem) {
    setIsBusy(true);
    try {
      const result = await postWebJson<TodoCommitResponse>(
        apiBase,
        "/api/v1/todos/commit/",
        buildCommitPayload([candidate]),
      );
      const savedItems = result.todos.map((todo) => ({
        id: todo.todo_id,
        title: todo.content,
        dueDate: todo.todo_date,
        tags: todo.tags,
        status: "saved" as const,
      }));
      setCandidates((current) => current.filter((todo) => todo.id !== candidate.id));
      onTodosSaved({
        todos: savedItems,
        questPreviews: result.todos.flatMap((todo) =>
          todo.quest
            ? [
                {
                  questId: todo.quest.quest_id,
                  content: todo.quest.content,
                  characterId: todo.quest.character_id,
                  todoId: todo.todo_id,
                  todoTitle: todo.content,
                },
              ]
            : [],
        ),
        calendarEventCount: result.calendar_events.length,
      });
      onNotice(
        result.calendar_events.length > 0
          ? `${candidate.title} 항목이 일정으로 저장됐어요.`
          : `${candidate.title} TODO가 서버에 저장됐어요.`,
      );
    } catch (error) {
      onNotice(`TODO 저장 실패: ${error instanceof Error ? error.message : "원인 미상"}`);
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <div className="todoSheet todoReplica">
      <div className="todoOuterFrame">
        <header className="todoHeroCard">
          <div className="todoHeroCopy">
            <p className="todoHeroKicker">✦ 오늘의 할 일 등록 ✦</p>
            <h3>마을 친구들에게 나눠줄 TODO를 적어보세요</h3>
            <p className="todoHeroLead">
              할 일을 자연스럽게 적어주면, 마을 친구들이 태스크별로 나눠 정리해드릴게요.
            </p>
            <div className="todoUsageChip">오늘 사용 5/5회</div>
          </div>
          <div className="todoDateChip">{formatTodayIso().split("-").join(".")}</div>
        </header>

        <div className="todoSplitLayout">
          <section className="todoPanel todoMemoCard">
            <div className="todoPanelTitle">자연어 TODO 메모</div>
            <label className="todoMemoField">
              <textarea
                value={prompt}
                maxLength={200}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder="예: 회의록 정리하고 장보기, 운동 15분 하기"
              />
            </label>
            <div className="todoMemoFooter">
              <p>
                한 문장으로 적으면 오늘 할 일과
                <br />
                나중에 할 일을 나눠서 정리해줘요.
              </p>
              <button
                type="button"
                className="todoSplitButton"
                onClick={splitTodoPrompt}
                disabled={isBusy}
              >
                {isBusy ? "분리 중" : "할 일 나누기"}
              </button>
            </div>
          </section>

          <section className="todoPanel todoCandidateCard">
            <div className="todoCandidateHeader">
              <div className="todoPanelTitle">나눠진 할 일</div>
              <span>AI가 문장을 분석해 태스크로 나눠봤어요!</span>
            </div>
            <ul className="todoCandidateList">
              {candidates.length > 0 ? (
                candidates.map((todo) => (
                  <li key={todo.id} className="todoCandidateRow">
                    <div
                      className={`todoMiniIcon is-${getTagTone(todo.tags[0])}`}
                      aria-hidden="true"
                    />
                    <div className="todoCandidateText">
                      <b>{todo.title}</b>
                      <span className={`todoTag tone-${getTagTone(todo.tags[0])}`}>
                        {todo.tags[0] || "분류"}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="todoAddButton"
                      onClick={() => saveTodoCandidate(todo)}
                      disabled={isBusy}
                    >
                      + 추가
                    </button>
                  </li>
                ))
              ) : (
                <li className="todoCandidateEmpty">왼쪽에 문장을 적고 할 일을 나눠보세요.</li>
              )}
            </ul>
          </section>
        </div>

        <section className="todoPanel todoSavedCard">
          <div className="todoSavedHeader">
            <div className="todoPanelTitle">오늘의 등록 목록</div>
            <span>{savedTodos.length}건</span>
          </div>
          <ul className="todoSavedList">
            {savedTodos.map((todo) => (
              <li key={todo.id} className={todo.status === "done" ? "isDone" : ""}>
                <div className="todoSavedLead">
                  <span className="todoCheckBadge" aria-hidden="true" />
                  <b>{todo.title}</b>
                  <span className={`todoTag tone-${getTagTone(todo.tags[0])}`}>
                    {todo.tags[0] || "분류"}
                  </span>
                </div>
                <button type="button" className="todoMenuButton" aria-label="메뉴">
                  ⋮
                </button>
              </li>
            ))}
          </ul>
        </section>

        <footer className="todoFooterNote">
          <p>필요할 때 언제든 추가하고, 마을 친구들과 함께 계획을 채워가세요.</p>
        </footer>
      </div>
    </div>
  );
}
