import { useCallback, useEffect, useMemo, useState } from "react";
import { apiClient } from "../../shared/api/client.js";
import { useCalendar } from "./CalendarCore.js";
import { CalendarWindow } from "./CalendarWindow.js";
import type { CalEvent } from "./calEngine.js";
import { ymdStrToSerial } from "./calEngine.js";
import type { CalSchedule, CalTodo } from "./types.js";
import { scheduleToEvent, todoToEvent } from "./types.js";
import { useTagManager } from "./useTagManager.js";
import "./calendar.css";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  isAuthenticated: boolean;
  onOpenLogin: () => void;
};

export function CalendarModal({ isOpen, onClose, isAuthenticated, onOpenLogin }: Props) {
  const [todos, setTodos] = useState<CalTodo[]>([]);
  const [schedules, setSchedules] = useState<CalSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  const { tagItems, fetchTags, createTag, deleteTag, editTag } = useTagManager(isAuthenticated);

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
        const res = await apiClient.get("/todos/calendar/", {
          params: { year: cal.view.y, month: cal.view.m + 1 },
        });
        const newTodos = res.data.todos as CalTodo[];
        const newSchedules = res.data.schedules as CalSchedule[];
        setTodos((prev) => {
          const map = new Map(prev.map((t) => [t.todo_id, t]));
          for (const t of newTodos) map.set(t.todo_id, t);
          return Array.from(map.values());
        });
        setSchedules((prev) => {
          const map = new Map(prev.map((s) => [s.schedule_id, s]));
          for (const s of newSchedules) map.set(s.schedule_id, s);
          return Array.from(map.values());
        });
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
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  const handleToggle = useCallback(
    async (id: string) => {
      const ev = baseEvents.find((e) => e.id === id);
      if (!ev?.todoId) return;
      const wasDone = cal.done.has(id);
      const next = wasDone ? "IN_PROGRESS" : "COMPLETED";
      cal.toggle(id);
      try {
        await apiClient.patch(`/todos/${ev.todoId}/`, { status: next });
        setTodos((prev) => prev.map((t) => (t.todo_id === ev.todoId ? { ...t, status: next } : t)));
      } catch {
        cal.toggle(id);
      }
    },
    [baseEvents, cal],
  );

  const handleAddEvent = useCallback(
    async (
      title: string,
      tagId: number | null,
      newTag: { name: string; color: string } | null,
      startStr: string,
      endStr: string,
    ) => {
      let resolvedTagId = tagId;
      if (newTag) {
        resolvedTagId = await createTag(newTag.name, newTag.color);
      }
      const tagParam = resolvedTagId !== null ? { tag_id: resolvedTagId } : {};
      const sSerial = ymdStrToSerial(startStr);
      const eSerial = ymdStrToSerial(endStr);
      if (sSerial === eSerial) {
        const res = await apiClient.post("/todos/", {
          content: title,
          todo_date: startStr,
          ...tagParam,
        });
        setTodos((prev) => [...prev, res.data as CalTodo]);
      } else {
        const res = await apiClient.post("/todos/schedules/", {
          title,
          description: "",
          start_date: startStr,
          end_date: endStr,
          ...tagParam,
        });
        setSchedules((prev) => [...prev, res.data as CalSchedule]);
      }
    },
    [createTag],
  );

  if (!isOpen) return null;

  if (!isAuthenticated) {
    return (
      // biome-ignore lint/a11y/noStaticElementInteractions: backdrop click-to-dismiss is intentional UX
      <div
        className="modalBackdrop"
        role="presentation"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <section
          className="calLoginGate"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cal-login-title"
        >
          <button type="button" className="calLoginClose" onClick={onClose} aria-label="닫기">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
          <div className="calLoginIcon" aria-hidden="true">
            <img src="/favicon.png" alt="" className="calLoginIconImg" />
          </div>
          <h2 id="cal-login-title" className="calLoginTitle">
            로그인이 필요해요
          </h2>
          <p className="calLoginText">마을 게시판의 일정과 투두는 로그인한 뒤에 볼 수 있어요.</p>
          <button type="button" className="calLoginButton" onClick={onOpenLogin}>
            로그인하기
          </button>
        </section>
      </div>
    );
  }

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: backdrop click-to-dismiss is intentional UX
    <div
      className="modalBackdrop"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="calWindow" role="dialog" aria-modal="true" aria-label="마을 게시판 캘린더">
        <CalendarWindow
          cal={cal}
          onClose={onClose}
          onToggle={handleToggle}
          onAddEvent={handleAddEvent}
          onDeleteTag={deleteTag}
          onEditTag={editTag}
          isRefreshing={isLoading}
          tags={tagItems}
        />
      </div>
    </div>
  );
}
