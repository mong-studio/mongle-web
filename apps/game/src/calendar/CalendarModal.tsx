import { useCallback, useEffect, useMemo, useState } from "react";
import { apiClient } from "../auth/client.js";
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
        ) : isLoading && !hasLoaded ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              fontFamily: "var(--font-display)",
              fontSize: 22,
              color: "var(--ink-3)",
            }}
          >
            🌸 불러오는 중...
          </div>
        ) : (
          <CalendarWindow
            cal={cal}
            onClose={onClose}
            onToggle={handleToggle}
            onAddEvent={handleAddEvent}
            onDeleteTag={deleteTag}
            onEditTag={editTag}
            isRefreshing={isLoading && hasLoaded}
            tags={tagItems}
          />
        )}
      </div>
    </div>
  );
}
