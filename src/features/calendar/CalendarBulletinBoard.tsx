import { useMemo } from "react";
import "./calendar.css";

type LocalTodo = {
  id: string;
  dueDate: string;
  status: "candidate" | "saved" | "done";
};

type Props = {
  todos: LocalTodo[];
  onOpen: () => void;
};

const WEEK_DAYS = ["월", "화", "수", "목", "금", "토", "일"] as const;

function toYMD(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getCurrentWeekYMDs(): string[] {
  const today = new Date();
  const dow = (today.getDay() + 6) % 7;
  const monday = new Date(today);
  monday.setDate(today.getDate() - dow);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return toYMD(d);
  });
}

function getDayIcon(hasDone: boolean, hasPending: boolean): { icon: string; cls: string } {
  if (hasDone && !hasPending) return { icon: "✓", cls: "iconDone" };
  if (hasDone && hasPending) return { icon: "◐", cls: "iconPartial" };
  if (hasPending) return { icon: "○", cls: "iconPending" };
  return { icon: "·", cls: "" };
}

export function CalendarBulletinBoard({ todos, onOpen }: Props) {
  const todayYMD = toYMD(new Date());
  const weekDates = useMemo(() => getCurrentWeekYMDs(), []);

  const dayData = useMemo(
    () =>
      weekDates.map((ymd) => {
        const dayTodos = todos.filter((t) => t.dueDate === ymd && t.status !== "candidate");
        return {
          ymd,
          isToday: ymd === todayYMD,
          hasDone: dayTodos.some((t) => t.status === "done"),
          hasPending: dayTodos.some((t) => t.status === "saved"),
        };
      }),
    [todos, weekDates, todayYMD],
  );

  return (
    <button type="button" className="bulletinBoard" onClick={onOpen} aria-label="마을 게시판 열기">
      <div className="boardHeader">
        <span className="boardTitle">마을 게시판</span>
        <span className="boardBell" aria-hidden="true">
          🔔
        </span>
      </div>
      <div className="boardGrid">
        {WEEK_DAYS.map((day) => (
          <div key={day} className="boardDayLabel">
            {day}
          </div>
        ))}
        {dayData.map(({ ymd, isToday, hasDone, hasPending }) => {
          const { icon, cls } = getDayIcon(hasDone, hasPending);
          return (
            <div key={ymd} className={`boardCell${isToday ? " isToday" : ""}`}>
              <span className={`boardIcon${cls ? ` ${cls}` : ""}`}>{icon}</span>
            </div>
          );
        })}
      </div>
    </button>
  );
}
