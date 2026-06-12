import { motion } from "motion/react";
import type { CSSProperties } from "react";
import { useEffect, useState } from "react";
import { AddEventForm } from "./AddEventForm.js";
import type { CalHook } from "./CalendarCore.js";
import { Check } from "./CalendarCore.js";
import { serial, toYMDStr, WD } from "./calEngine.js";
import { EventRow } from "./EventRow.js";
import type { TagItem } from "./types.js";

const staggerContainer = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };

type DayModalProps = {
  ymd: { y: number; m: number; d: number } | null;
  cal: CalHook;
  onClose: () => void;
  onToggle: (id: string) => void;
  tags: TagItem[];
  onAddEvent: (
    title: string,
    tagId: number | null,
    newTag: { name: string; color: string } | null,
    startStr: string,
    endStr: string,
    type: "todo" | "schedule",
    description: string,
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
};

export function DayModal({
  ymd,
  cal,
  onClose,
  onToggle,
  tags,
  onAddEvent,
  onDeleteEvent,
  onEditEvent,
  onDeleteTag,
  onEditTag,
}: DayModalProps) {
  const [adding, setAdding] = useState(false);

  const { selAdd } = cal;

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally runs only on ymd/selAdd change to reset form
  useEffect(() => {
    if (!ymd) return;
    setAdding(!!selAdd);
  }, [ymd, selAdd]);

  if (!ymd) return null;
  const { y, m, d } = ymd;
  const wd = new Date(y, m, d).getDay();
  const evs = cal.getEvents(y, m, d);
  const total = evs.length;
  const doneCount = evs.filter((e) => cal.done.has(e.id)).length;
  const isToday = cal.todaySr === serial(y, m, d);

  const backdrop: CSSProperties = {
    position: "absolute",
    inset: 0,
    zIndex: 60,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 26,
    background: "rgba(70,48,22,0.34)",
    backdropFilter: "blur(3px)",
  };

  const panel: CSSProperties = {
    width: "100%",
    maxWidth: 472,
    maxHeight: "100%",
    display: "flex",
    flexDirection: "column",
    background: "var(--cream-1)",
    borderRadius: "var(--r-xl)",
    border: "2px solid var(--line)",
    boxShadow: "var(--sh-pop)",
    overflow: "hidden",
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15 }}
      onClick={onClose}
      style={backdrop}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="day-modal-title"
        initial={{ opacity: 0, y: 12, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", damping: 24, stiffness: 380 }}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        style={panel}
      >
        {/* 헤더 */}
        <div style={{ display: "flex", alignItems: "center", gap: 13, padding: "17px 19px 15px" }}>
          <span
            style={{
              width: 50,
              height: 50,
              flex: "0 0 auto",
              borderRadius: 16,
              background: isToday ? "var(--accent)" : "var(--cream-2)",
              border: `2px solid ${isToday ? "var(--accent-deep)" : "var(--line)"}`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              lineHeight: 1,
              boxShadow: "inset 0 -2px 0 rgba(0,0,0,.10)",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 11,
                color: isToday ? "rgba(255,255,255,.85)" : "var(--ink-3)",
              }}
            >
              {m + 1}월
            </span>
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 23,
                color: isToday ? "#fff" : "var(--ink-1)",
                marginTop: 1,
              }}
            >
              {d}
            </span>
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              id="day-modal-title"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 22,
                color: "var(--ink-1)",
                lineHeight: 1.1,
              }}
            >
              {m + 1}월 {d}일{" "}
              <span
                style={{
                  color: wd === 0 ? "var(--sun)" : wd === 6 ? "var(--sat)" : "var(--ink-3)",
                }}
              >
                ({WD[wd]})
              </span>
            </div>
            <div
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 14,
                color: "var(--ink-2)",
                marginTop: 3,
              }}
            >
              {isToday ? "오늘의 일정 · " : "몽글마을 일정 · "}
              {total > 0 ? `${doneCount}/${total} 완료` : "일정 없음"}
            </div>
          </div>
          <button
            type="button"
            className="calBtn-ghost"
            aria-label="닫기"
            onClick={onClose}
            style={{
              width: 36,
              height: 36,
              flex: "0 0 auto",
              borderRadius: 12,
              cursor: "pointer",
              border: "2px solid var(--line)",
              background: "var(--cream-0)",
              color: "var(--ink-2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        </div>

        {/* 이벤트 목록 */}
        <div
          style={{
            padding: "2px 19px 10px",
            overflowY: "auto",
            flex: "1 1 auto",
            pointerEvents: adding ? "none" : "auto",
            opacity: adding ? 0.45 : 1,
            transition: "opacity .2s",
          }}
        >
          {total === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "28px 0",
                color: "var(--ink-3)",
                fontFamily: "var(--font-body)",
                fontSize: 15,
              }}
            >
              아직 등록된 일정이 없어요
            </div>
          ) : (
            <motion.div
              style={{ display: "flex", flexDirection: "column", gap: 9 }}
              initial="hidden"
              animate="show"
              variants={staggerContainer}
            >
              {evs.map((e) => (
                <EventRow
                  key={e.id}
                  ev={e}
                  isDone={cal.done.has(e.id)}
                  onToggle={() => onToggle(e.id)}
                  onDelete={() => onDeleteEvent(e.id)}
                  onEdit={(t, tagId, startStr, endStr, desc) =>
                    onEditEvent(e.id, t, tagId, startStr, endStr, desc)
                  }
                  tags={tags}
                />
              ))}
            </motion.div>
          )}
        </div>

        {/* 추가 폼 */}
        <div style={{ padding: "8px 19px 19px", flex: "0 0 auto" }}>
          {!adding ? (
            <button
              type="button"
              className="calBtn-dashed"
              onClick={() => setAdding(true)}
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: "var(--r-lg)",
                cursor: "pointer",
                border: "2px dashed var(--line)",
                background: "var(--cream-0)",
                color: "var(--ink-2)",
                fontFamily: "var(--font-display)",
                fontSize: 16,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 7,
                whiteSpace: "nowrap",
              }}
            >
              <span style={{ fontSize: 20, lineHeight: 1 }}>＋</span> 추가하기
            </button>
          ) : (
            <AddEventForm
              key={toYMDStr(y, m, d)}
              initialDate={toYMDStr(y, m, d)}
              tags={tags}
              onSubmit={onAddEvent}
              onDeleteTag={onDeleteTag}
              onEditTag={onEditTag}
              onClose={() => setAdding(false)}
            />
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
