import type { CSSProperties } from "react";
import type { TodoItem } from "./todoCreation.js";
import "./HudTodoList.css";

type HudTodoListProps = {
  todos: TodoItem[];
  tagColors: Record<string, string>;
  onAddTodo: () => void;
  onCompleteTodo: (todoId: string) => void;
};

const FALLBACK_TAG_COLORS: Record<string, string> = {
  건강: "#62A256",
  성장: "#5790C4",
  작업: "#8478C0",
  약속: "#D9943C",
  일상: "#CF7E97",
  휴식: "#CF7E97",
};

function getHudTagStyle(todo: TodoItem, tag: string): CSSProperties {
  const color = todo.tagColors?.[tag] ?? FALLBACK_TAG_COLORS[tag] ?? "#BD7B3D";
  return {
    backgroundColor: `${color}22`,
    borderColor: color,
    color,
  };
}

export function HudTodoList({ todos, tagColors, onAddTodo, onCompleteTodo }: HudTodoListProps) {
  const visibleTodos = todos.filter((todo) => todo.status !== "candidate").slice(0, 5);

  return (
    <aside className="hudTodoList" aria-label="오늘의 할 일">
      <div className="hudTodoHeader">
        <img src="/assets/hud/plant.png" alt="" />
        <b>오늘의 할 일</b>
        <img src="/assets/hud/plant.png" alt="" />
      </div>
      <ul>
        {visibleTodos.map((todo) => {
          const isDone = todo.status === "done";
          const tag = todo.tags[0] ?? "오늘";
          const tagTodo = {
            ...todo,
            tagColors: { ...tagColors, ...todo.tagColors },
          };

          return (
            <li key={todo.id} className={isDone ? "isDone" : ""}>
              <button
                type="button"
                className="hudTodoCheck"
                aria-label={`${todo.title} 완료`}
                aria-pressed={isDone}
                disabled={isDone}
                onClick={() => onCompleteTodo(todo.id)}
              >
                <span className="srOnly">{isDone ? "완료됨" : "미완료"}</span>
              </button>
              <div className="hudTodoBody">
                <p className="hudTodoTitle">{todo.title}</p>
                {todo.assignedQuest?.content ? (
                  <p className="hudTodoQuest">
                    <b>{todo.assignedQuest.characterName ?? "캐릭터"}</b>
                    {todo.assignedQuest.content}
                  </p>
                ) : null}
              </div>
              <small style={getHudTagStyle(tagTodo, tag)}>#{tag}</small>
            </li>
          );
        })}
        {visibleTodos.length === 0 ? (
          <li className="emptyTodo">
            <p>오늘 할 일을 추가해보세요</p>
          </li>
        ) : null}
      </ul>
      <button type="button" className="hudTodoAddButton" onClick={onAddTodo}>
        <span aria-hidden="true">+</span>할 일 추가
      </button>
    </aside>
  );
}
