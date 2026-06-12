import { motion } from "motion/react";
import type { CSSProperties } from "react";
import { useState } from "react";
import type { CalHook } from "./CalendarCore.js";
import { DayModal } from "./DayModal.js";
import { MonthCard } from "./MonthCard.js";
import { TodayCard } from "./TodayCard.js";
import type { TagItem } from "./types.js";

type CalendarWindowProps = {
  cal: CalHook;
  onClose: () => void;
  onToggle: (id: string) => void;
  onAddEvent: (
    title: string,
    tagId: number | null,
    newTag: { name: string; color: string } | null,
    startStr: string,
    endStr: string,
  ) => Promise<void>;
  onDeleteEvent: (id: string) => Promise<void>;
  onEditEvent: (
    id: string,
    title: string,
    tagId: number | null,
    startStr: string,
    endStr: string,
    description: string,
  ) => Promise<void>;
  onDeleteTag: (id: number) => Promise<void>;
  onEditTag: (id: number, content: string, color: string) => Promise<void>;
  isRefreshing: boolean;
  tags: TagItem[];
};

export function CalendarWindow({
  cal,
  onClose,
  onToggle,
  onAddEvent,
  onDeleteEvent,
  onEditEvent,
  onDeleteTag,
  onEditTag,
  isRefreshing,
  tags,
}: CalendarWindowProps) {
  const { y, m } = cal.view;
  const [dir, setDir] = useState(0);

  const iconPath = (d: string) => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );

  const panel: CSSProperties = {
    position: "relative",
    flex: 1,
    minHeight: 0,
    display: "flex",
    flexDirection: "column",
    background: "var(--cream-1)",
    border: "3px solid var(--line)",
    borderRadius: "var(--r-xl)",
    boxShadow: "var(--sh-panel), inset 0 0 0 2px rgba(255,255,255,.45)",
    padding: "20px 22px 22px",
  };

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        gap: 16,
        padding: 4,
        fontFamily: "var(--font-body)",
      }}
    >
      <motion.div
        style={panel}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", damping: 28, stiffness: 320 }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 28,
              color: "var(--ink-1)",
              whiteSpace: "nowrap",
              flex: "0 0 auto",
            }}
          >
            캘린더
          </span>
          <div style={{ flex: 1 }} />
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 12,
              padding: "8px 12px",
              borderRadius: 999,
              border: "2px solid var(--line)",
              background: "var(--cream-0)",
              boxShadow: "0 2px 0 var(--line-soft)",
            }}
          >
            <button
              type="button"
              className="calBtn-nav"
              aria-label="이전 달"
              onClick={() => {
                setDir(-1);
                cal.step(-1);
              }}
              style={{
                border: "none",
                background: "transparent",
                color: "var(--accent-deep)",
                cursor: "pointer",
                display: "flex",
                padding: 2,
              }}
            >
              {iconPath("M9 2L4 7l5 5")}
            </button>
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 19,
                color: "var(--ink-1)",
                minWidth: 120,
                textAlign: "center",
              }}
            >
              {y}년 {m + 1}월
            </span>
            <button
              type="button"
              className="calBtn-nav"
              aria-label="다음 달"
              onClick={() => {
                setDir(1);
                cal.step(1);
              }}
              style={{
                border: "none",
                background: "transparent",
                color: "var(--accent-deep)",
                cursor: "pointer",
                display: "flex",
                padding: 2,
              }}
            >
              {iconPath("M5 2l5 5-5 5")}
            </button>
          </div>
          <div style={{ flex: 1 }} />
          <button
            type="button"
            className="calBtn-ghost"
            onClick={cal.toToday}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              padding: "9px 16px",
              cursor: "pointer",
              borderRadius: 999,
              fontFamily: "var(--font-display)",
              fontSize: 15,
              whiteSpace: "nowrap",
              border: "2px solid var(--line)",
              background: "var(--cream-0)",
              color: "var(--ink-2)",
              boxShadow: "0 2px 0 var(--line-soft)",
            }}
          >
            오늘
          </button>
          <button
            type="button"
            className="calBtn-ghost"
            aria-label="닫기"
            onClick={onClose}
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              cursor: "pointer",
              border: "2px solid var(--line)",
              background: "var(--cream-0)",
              color: "var(--ink-2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 0 var(--line-soft)",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        </div>

        <div style={{ flex: 1, minHeight: 0, display: "flex", gap: 20 }}>
          <div
            style={{
              flex: "1.92 1 0",
              minWidth: 0,
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <MonthCard cal={cal} dir={dir} />
          </div>
          <div
            style={{
              flex: "1 1 0",
              minWidth: 0,
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <TodayCard cal={cal} onToggle={onToggle} isRefreshing={isRefreshing} />
          </div>
        </div>

        <DayModal
          ymd={cal.sel}
          cal={cal}
          onClose={() => cal.setSel(null)}
          onToggle={onToggle}
          tags={tags}
          onAddEvent={onAddEvent}
          onDeleteEvent={onDeleteEvent}
          onEditEvent={onEditEvent}
          onDeleteTag={onDeleteTag}
          onEditTag={onEditTag}
        />
      </motion.div>
    </div>
  );
}
