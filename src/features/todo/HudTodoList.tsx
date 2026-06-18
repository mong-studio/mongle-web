import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import type { CSSProperties } from "react";
import { useState } from "react";
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
  업무: "#D06F5F",
  약속: "#D9943C",
  일상: "#CF7E97",
  운동: "#D9943C",
  휴식: "#CF7E97",
};
const MAX_HUD_TAGS = 1;
const MAX_HUD_TAG_LENGTH = 10;

function getDisplayTags(tags: string[]) {
  const normalized = tags.map((tag) => tag.trim().slice(0, MAX_HUD_TAG_LENGTH)).filter(Boolean);
  return Array.from(new Set(normalized)).slice(0, MAX_HUD_TAGS);
}

function getHudTagStyle(todo: TodoItem, tag: string): CSSProperties {
  const color = todo.tagColors?.[tag] ?? FALLBACK_TAG_COLORS[tag] ?? "#BD7B3D";
  return {
    backgroundColor: `${color}22`,
    borderColor: color,
    color,
  };
}

export function HudTodoList({ todos, tagColors, onAddTodo, onCompleteTodo }: HudTodoListProps) {
  const [openTooltipId, setOpenTooltipId] = useState<string | null>(null);
  const [dismissedTooltipId, setDismissedTooltipId] = useState<string | null>(null);
  const visibleTodos = todos.filter((todo) => todo.status !== "candidate").slice(0, 4);

  return (
    <aside className="hudTodoList" aria-label="오늘의 할 일">
      <div className="hudTodoHeader">
        <b>오늘의 할 일</b>
      </div>
      <ul>
        {visibleTodos.map((todo) => {
          const isDone = todo.status === "done";
          const tags = getDisplayTags(todo.tags);
          const tagTodo = {
            ...todo,
            tagColors: { ...tagColors, ...todo.tagColors },
          };

          const isTooltipOpen = openTooltipId === todo.id;

          return (
            <li
              key={todo.id}
              className={[isDone ? "isDone" : "", isTooltipOpen ? "isTooltipOpen" : ""]
                .filter(Boolean)
                .join(" ")}
              onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) {
                  setOpenTooltipId(null);
                  setDismissedTooltipId(null);
                }
              }}
              onMouseEnter={() => {
                if (dismissedTooltipId !== todo.id) {
                  setOpenTooltipId(todo.id);
                }
              }}
              onMouseLeave={() => {
                setOpenTooltipId(null);
                setDismissedTooltipId(null);
              }}
            >
              <button
                type="button"
                className="hudTodoCheck"
                aria-label={`${todo.title} 완료`}
                aria-pressed={isDone}
                disabled={isDone}
                onClick={(event) => {
                  event.stopPropagation();
                  onCompleteTodo(todo.id);
                }}
              >
                {isDone ? (
                  <CheckRoundedIcon className="hudTodoCheckIcon" aria-hidden="true" />
                ) : null}
                <span className="srOnly">{isDone ? "완료됨" : "미완료"}</span>
              </button>
              <button
                type="button"
                className="hudTodoContentButton"
                aria-expanded={isTooltipOpen}
                onClick={() => {
                  setOpenTooltipId((current) => {
                    if (current === todo.id) {
                      setDismissedTooltipId(todo.id);
                      return null;
                    }
                    setDismissedTooltipId(null);
                    return todo.id;
                  });
                }}
              >
                <p className="hudTodoTitle">{todo.title}</p>
                <span className="hudTodoTooltip" aria-hidden={!isTooltipOpen}>
                  {todo.title}
                </span>
                {todo.assignedQuest?.content ? (
                  <p className="hudTodoQuest">
                    <b>{todo.assignedQuest.characterName ?? "캐릭터"}</b>
                    <span>{todo.assignedQuest.content}</span>
                  </p>
                ) : null}
              </button>
              {tags.length ? (
                <div className="hudTodoTags">
                  {tags.map((tag) => (
                    <small key={tag} style={getHudTagStyle(tagTodo, tag)}>
                      #{tag}
                    </small>
                  ))}
                </div>
              ) : null}
            </li>
          );
        })}
        {visibleTodos.length === 0 ? (
          <li className="emptyTodo">
            <img src="/assets/hud/plant.png" alt="" />
            <b>아직 등록된 할 일이 없어요</b>
            <p>몽글마을 친구들과 함께 오늘의 첫 할 일을 만들어봐요</p>
          </li>
        ) : null}
      </ul>
      <button type="button" className="hudTodoAddButton" onClick={onAddTodo}>
        <span aria-hidden="true">+</span>
        <b>할 일 추가</b>
      </button>
      <p className="hudTodoFooter">
        완료하면 주민이 피드를 올려요!
        <span aria-hidden="true">♥</span>
      </p>
    </aside>
  );
}
