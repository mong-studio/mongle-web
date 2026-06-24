import { motion } from "motion/react";
import { DeleteConfirmDialog } from "../../shared/ui/DeleteConfirmDialog.js";
import { Tag } from "../../shared/ui/Tag/Tag.js";
import type { CalHook } from "./CalendarCore.js";
import { Check } from "./CalendarCore.js";
import { type CalEvent, serial, WD } from "./calEngine.js";

const todayListVariants = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const todayItemVariants = {
  hidden: { opacity: 0, x: -10 },
  show: { opacity: 1, x: 0, transition: { duration: 0.18 } },
};

type TodayCardProps = {
  cal: CalHook;
  onToggle: (id: string) => void;
  onFailEvent: (id: string) => Promise<void>;
  isRefreshing: boolean;
};

export function TodayCard({ cal, onToggle, onFailEvent, isRefreshing }: TodayCardProps) {
  const { y: sy, m: sm, d: sd } = cal.selDate;
  const swd = new Date(sy, sm, sd).getDay();
  const isToday = cal.todaySr === serial(sy, sm, sd);
  const evs = cal.getEvents(sy, sm, sd).filter((e) => e.s === e.e);
  const scheduleEvs = evs.filter((e) => e.scheduleId);
  const todoEvs = evs.filter((e) => !e.scheduleId);

  const sectionLabel = (icon: string, text: string, count: number) => (
    <div style={{ display: "flex", alignItems: "center", gap: 7, margin: "10px 0 2px" }}>
      <span style={{ fontFamily: "var(--font-display)", fontSize: 15, color: "var(--ink-2)" }}>
        {icon} {text}
      </span>
      <span
        style={{
          minWidth: 20,
          height: 20,
          padding: "0 6px",
          borderRadius: 999,
          background: "var(--cream-3)",
          color: "var(--ink-2)",
          fontFamily: "var(--font-display)",
          fontSize: 12,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {count}
      </span>
    </div>
  );

  const renderItem = (e: CalEvent, i: number) => {
    const on = e.done;
    const failed = !!e.failed;
    const isTodo = !!e.todoId;
    const checkable = isTodo && !failed && !on;
    const canFail = isTodo && !failed && !on;

    return (
      <motion.div
        key={e.id}
        variants={todayItemVariants}
        whileHover={checkable ? { x: 2 } : undefined}
        whileTap={checkable ? { scale: 0.98 } : undefined}
        role="button"
        tabIndex={0}
        onClick={() => checkable && onToggle(e.id)}
        onKeyDown={(ev) => ev.key === "Enter" && checkable && onToggle(e.id)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 7,
          padding: "12px 2px",
          cursor: checkable ? "pointer" : "default",
          opacity: failed ? 0.6 : 1,
          borderTop: i ? "1px solid var(--line-soft)" : "none",
        }}
      >
        {failed ? (
          <span
            role="img"
            aria-label="포기됨"
            style={{
              width: 26,
              height: 26,
              flex: "0 0 auto",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 9,
              border: "2px solid var(--line)",
              background: "var(--cream-2)",
              color: "var(--ink-3)",
              fontFamily: "var(--font-display)",
              fontSize: 14,
            }}
          >
            x
          </span>
        ) : isTodo ? (
          <Check on={on} onClick={() => onToggle(e.id)} />
        ) : (
          <span
            aria-hidden="true"
            style={{
              width: 26,
              height: 26,
              flex: "0 0 auto",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 9,
              border: "2px solid var(--line-soft)",
              background: "var(--cream-1)",
            }}
          >
            <span style={{ width: 9, height: 9, borderRadius: "50%", background: e.color }} />
          </span>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 17,
              color: on || failed ? "var(--ink-3)" : "var(--ink-1)",
              textDecoration: on || failed ? "line-through" : "none",
              lineHeight: 1.2,
              marginBottom: 5,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {e.title}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            {failed && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "2px 8px",
                  borderRadius: 999,
                  background: "var(--cream-2)",
                  color: "var(--ink-3)",
                  fontFamily: "var(--font-display)",
                  fontSize: 11,
                  whiteSpace: "nowrap",
                }}
              >
                포기
              </span>
            )}
            <Tag color={e.color} bg={e.bg} label={e.tagLabel} />
            {canFail && (
              <DeleteConfirmDialog
                trigger={
                  <button
                    type="button"
                    aria-label={`${e.title} 포기`}
                    onClick={(event) => event.stopPropagation()}
                    style={{
                      minHeight: 24,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "3px 9px",
                      border: "1.5px solid #d8a46d",
                      borderRadius: 999,
                      background: "var(--cream-1)",
                      color: "#9a5735",
                      cursor: "pointer",
                      fontFamily: "var(--font-display)",
                      fontSize: 11,
                      lineHeight: 1,
                      whiteSpace: "nowrap",
                    }}
                  >
                    포기
                  </button>
                }
                title="포기할까요?"
                description="포기하면 완료할 수 없어요. 포기 기록은 남아요."
                confirmLabel="포기하기"
                onConfirm={() => void onFailEvent(e.id)}
              />
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        background: "var(--cream-0)",
        border: "2px solid var(--line)",
        borderRadius: "var(--r-lg)",
        padding: "17px 18px 16px",
        boxShadow: "var(--sh-card)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 14 }}>
        <span style={{ fontFamily: "var(--font-display)", fontSize: 22, color: "var(--ink-1)" }}>
          {sm + 1}월 {sd}일{" "}
          <span
            style={{ color: swd === 0 ? "var(--sun)" : swd === 6 ? "var(--sat)" : "var(--ink-2)" }}
          >
            ({WD[swd]})
          </span>
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 17,
            color: "var(--ink-2)",
            whiteSpace: "nowrap",
          }}
        >
          {isToday ? "오늘의 일정" : "이 날의 일정"}
        </span>
        <span
          style={{
            minWidth: 22,
            height: 22,
            padding: "0 6px",
            borderRadius: 999,
            background: "var(--cream-3)",
            color: "var(--ink-2)",
            fontFamily: "var(--font-display)",
            fontSize: 13,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {evs.length}
        </span>
        <div style={{ flex: 1 }} />
        <button
          type="button"
          className="calBtn-accent"
          onClick={() => !isRefreshing && cal.openAdd({ y: sy, m: sm, d: sd })}
          style={{
            width: 34,
            height: 34,
            borderRadius: "50%",
            cursor: isRefreshing ? "default" : "pointer",
            border: "none",
            background: "var(--accent)",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 2px 6px rgba(120,84,38,.30), inset 0 -2px 0 rgba(0,0,0,.12)",
            flexShrink: 0,
            transition: "background .14s",
          }}
        >
          {isRefreshing ? (
            <motion.svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              animate={{ rotate: 360 }}
              transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
              aria-hidden="true"
            >
              <circle
                cx="8"
                cy="8"
                r="5.5"
                fill="none"
                stroke="rgba(255,255,255,.35)"
                strokeWidth="2.5"
              />
              <path
                d="M8 2.5 A5.5 5.5 0 0 1 13.5 8"
                fill="none"
                stroke="#fff"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </motion.svg>
          ) : (
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="#fff"
              strokeWidth="2.5"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M8 3v10M3 8h10" />
            </svg>
          )}
        </button>
      </div>
      <motion.div
        style={{ display: "flex", flexDirection: "column" }}
        initial="hidden"
        animate="show"
        variants={todayListVariants}
      >
        {scheduleEvs.length > 0 && (
          <>
            {sectionLabel("•", "일정", scheduleEvs.length)}
            <div
              className="calScroll"
              style={{ maxHeight: 290, overflowX: "hidden", overflowY: "auto" }}
            >
              {scheduleEvs.map((e, i) => renderItem(e, i))}
            </div>
          </>
        )}
        {todoEvs.length > 0 && (
          <>
            {sectionLabel("✓", "할 일", todoEvs.length)}
            <div
              className="calScroll"
              style={{ maxHeight: 290, overflowX: "hidden", overflowY: "auto" }}
            >
              {todoEvs.map((e, i) => renderItem(e, i))}
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
