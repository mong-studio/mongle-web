import { useCallback, useEffect, useMemo, useState } from "react";
import { apiClient } from "../../shared/api/client.js";
import { useTags } from "../../shared/tags/useTags.js";
import { useBackdropDismiss } from "../../shared/ui/useBackdropDismiss.js";
import { useCalendar } from "./CalendarCore.js";
import { CalendarWindow } from "./CalendarWindow.js";
import { type CalEvent, ymdStrToSerial } from "./calEngine.js";
import type { CalSchedule, CalTodo } from "./types.js";
import { scheduleToEvent, todoToEvent } from "./types.js";
import "./calendar.css";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  isAuthenticated: boolean;
  onOpenLogin: () => void;
  // 캘린더에서 할일을 바꾸면 호출 — 메인화면(HUD) 할일과 동기화한다.
  onTodosChanged?: () => void;
  // 할일 체크(완료) 시 메인화면과 동일한 보상 처리를 위임한다.
  onCompleteTodo: (todoId: string, title: string, dueDate: string) => Promise<void>;
};

function mergeById<T>(prev: T[], next: T[], key: keyof T): T[] {
  const map = new Map(prev.map((x) => [x[key], x]));
  for (const x of next) map.set(x[key], x);
  return Array.from(map.values());
}

export function CalendarModal({
  isOpen,
  onClose,
  isAuthenticated,
  onOpenLogin,
  onTodosChanged,
  onCompleteTodo,
}: Props) {
  const [todos, setTodos] = useState<CalTodo[]>([]);
  const [schedules, setSchedules] = useState<CalSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  const { tagItems, fetchTags, createTag, deleteTag, editTag } = useTags(isAuthenticated);

  const baseEvents = useMemo<CalEvent[]>(
    () => [...todos.map(todoToEvent), ...schedules.map(scheduleToEvent)],
    [todos, schedules],
  );

  const cal = useCalendar(baseEvents);

  const fetchCalendar = useCallback(
    async (showSpinner: boolean) => {
      if (!isAuthenticated) return;
      if (showSpinner) setIsLoading(true);
      try {
        const res = await apiClient.get("/calendar/", {
          params: { year: cal.view.y, month: cal.view.m + 1 },
        });
        const newTodos = res.data.todos as CalTodo[];
        const newSchedules = res.data.schedules as CalSchedule[];
        setTodos((prev) => mergeById(prev, newTodos, "todo_id"));
        setSchedules((prev) => mergeById(prev, newSchedules, "schedule_id"));
        setHasLoaded(true);
      } catch {
        // network error — keep empty state
      } finally {
        if (showSpinner) setIsLoading(false);
      }
    },
    [isAuthenticated, cal.view.y, cal.view.m],
  );

  useEffect(() => {
    if (isOpen && isAuthenticated) {
      void fetchCalendar(!hasLoaded);
    }
  }, [isOpen, isAuthenticated, fetchCalendar, hasLoaded]);

  useEffect(() => {
    if (isOpen && isAuthenticated) void fetchTags();
  }, [isOpen, isAuthenticated, fetchTags]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      // 날짜 상세(DayModal)가 열려 있으면 Esc는 그쪽이 닫는다. 캘린더 전체는 그대로 둔다.
      if (e.key === "Escape" && !cal.sel) onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose, cal.sel]);

  const handleToggle = useCallback(
    async (id: string) => {
      const ev = baseEvents.find((e) => e.id === id);
      if (!ev?.todoId) return; // 일정(schedule)은 체크 대상이 아니다
      if (ev.done) return; // 완료한 할일은 체크 해제 불가 (체크는 되지만 되돌릴 수 없다)
      if (ev.s < cal.todaySr) return; // 과거 TODO는 완료 처리하지 않는다.
      const todoId = ev.todoId;
      const dueDate = todos.find((t) => t.todo_id === todoId)?.todo_date ?? "";
      // 낙관적 업데이트: 완료로 바로 반영하고 실패 시 되돌린다.
      setTodos((prev) =>
        prev.map((t) => (t.todo_id === todoId ? { ...t, status: "COMPLETED" } : t)),
      );
      try {
        // 메인화면 체크와 동일한 로직(/complete — 사과 보상·알림·HUD 동기화)을 위임한다.
        await onCompleteTodo(todoId, ev.title, dueDate);
      } catch {
        setTodos((prev) =>
          prev.map((t) => (t.todo_id === todoId ? { ...t, status: "IN_PROGRESS" } : t)),
        );
      }
    },
    [baseEvents, cal.todaySr, todos, onCompleteTodo],
  );

  const handleAddEvent = useCallback(
    async (
      kind: "todo" | "schedule",
      title: string,
      tagId: number | null,
      startStr: string,
      endStr: string,
      description: string,
    ) => {
      // 지난 날짜에는 추가할 수 없다. throw 하면 폼이 닫히지 않고 안내 메시지가 표시된다.
      if (ymdStrToSerial(startStr) < cal.todaySr) {
        throw new Error(
          kind === "todo"
            ? "지난 날짜에는 할일을 추가할 수 없어요."
            : "지난 날짜에는 일정을 추가할 수 없어요.",
        );
      }
      const tagParam = tagId !== null ? { tag_id: tagId } : {};
      if (kind === "todo") {
        const res = await apiClient.post("/todos/", {
          content: title,
          todo_date: startStr,
          ...tagParam,
        });
        setTodos((prev) => [...prev, res.data as CalTodo]);
        onTodosChanged?.();
      } else {
        const res = await apiClient.post("/schedules/", {
          title,
          description,
          start_date: startStr,
          end_date: endStr,
          ...tagParam,
        });
        setSchedules((prev) => [...prev, res.data as CalSchedule]);
      }
    },
    [cal.todaySr, onTodosChanged],
  );

  const handleDeleteEvent = useCallback(
    async (id: string) => {
      if (id.startsWith("todo-")) {
        const todoId = id.slice(5);
        await apiClient.delete(`/todos/${todoId}/`);
        setTodos((prev) => prev.filter((t) => t.todo_id !== todoId));
        onTodosChanged?.();
      } else if (id.startsWith("sched-")) {
        const schedId = id.slice(6);
        await apiClient.delete(`/schedules/${schedId}/`);
        setSchedules((prev) => prev.filter((s) => s.schedule_id !== schedId));
      }
    },
    [onTodosChanged],
  );

  const handleFailEvent = useCallback(
    async (id: string) => {
      if (!id.startsWith("todo-")) return;
      const todoId = id.slice(5);
      await apiClient.patch(`/todos/${todoId}/fail/`);
      setTodos((prev) => prev.map((t) => (t.todo_id === todoId ? { ...t, status: "FAILED" } : t)));
      onTodosChanged?.();
    },
    [onTodosChanged],
  );

  const handleEditEvent = useCallback(
    async (
      id: string,
      title: string,
      tagId: number | null,
      startStr: string,
      endStr: string,
      description: string,
    ) => {
      const tagParam = tagId !== null ? { tag_id: tagId } : {};
      if (id.startsWith("todo-")) {
        const todoId = id.slice(5);
        const res = await apiClient.patch(`/todos/${todoId}/`, {
          content: title,
          todo_date: startStr,
          ...tagParam,
        });
        setTodos((prev) =>
          prev.map((t) => (t.todo_id === todoId ? { ...t, ...(res.data as CalTodo) } : t)),
        );
        onTodosChanged?.();
      } else if (id.startsWith("sched-")) {
        const schedId = id.slice(6);
        const res = await apiClient.patch(`/schedules/${schedId}/`, {
          title,
          description,
          start_date: startStr,
          end_date: endStr,
          ...tagParam,
        });
        setSchedules((prev) =>
          prev.map((s) => (s.schedule_id === schedId ? { ...s, ...(res.data as CalSchedule) } : s)),
        );
      }
    },
    [onTodosChanged],
  );

  const backdrop = useBackdropDismiss(onClose);

  if (!isOpen) return null;

  return (
    <div className="modalBackdrop" role="presentation" {...backdrop}>
      <div className="calWindow" role="dialog" aria-modal="true" aria-label="마을 게시판 캘린더">
        {!isAuthenticated ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 18,
              height: "100%",
              fontFamily: "var(--font-body)",
            }}
          >
            <div style={{ fontSize: 52 }}>🏡</div>
            <p
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 22,
                color: "var(--ink-1)",
                margin: 0,
              }}
            >
              일정과 투두를 보려면 로그인이 필요해요
            </p>
            <button
              type="button"
              onClick={onOpenLogin}
              style={{
                padding: "14px 32px",
                borderRadius: 999,
                cursor: "pointer",
                border: "none",
                background: "var(--accent)",
                color: "#fff",
                fontFamily: "var(--font-display)",
                fontSize: 18,
                boxShadow: "inset 0 -3px 0 rgba(0,0,0,.13)",
              }}
            >
              로그인하기
            </button>
          </div>
        ) : (
          <CalendarWindow
            cal={cal}
            onClose={onClose}
            onToggle={handleToggle}
            onAddEvent={handleAddEvent}
            onDeleteEvent={handleDeleteEvent}
            onFailEvent={handleFailEvent}
            onEditEvent={handleEditEvent}
            onCreateTag={createTag}
            onDeleteTag={deleteTag}
            onEditTag={editTag}
            isRefreshing={isLoading}
            tags={tagItems}
          />
        )}
      </div>
    </div>
  );
}
