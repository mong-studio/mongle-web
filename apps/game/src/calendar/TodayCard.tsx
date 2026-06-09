import { motion } from "motion/react";
import type { CalHook } from "./CalendarCore.js";
import { Check, Tag } from "./CalendarCore.js";
import { WD } from "./calEngine.js";

const todayListVariants = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const todayItemVariants = {
  hidden: { opacity: 0, x: -10 },
  show: { opacity: 1, x: 0, transition: { duration: 0.18 } },
};

type TodayCardProps = {
  cal: CalHook;
  onToggle: (id: string) => void;
  isRefreshing: boolean;
};

export function TodayCard({ cal, onToggle, isRefreshing }: TodayCardProps) {
  const ty = cal.today.getFullYear();
  const tm = cal.today.getMonth();
  const td = cal.today.getDate();
  const twd = cal.today.getDay();
  const evs = cal.getEvents(ty, tm, td).filter((e) => e.s === e.e);

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
          {tm + 1}월 {td}일{" "}
          <span
            style={{ color: twd === 0 ? "var(--sun)" : twd === 6 ? "var(--sat)" : "var(--ink-2)" }}
          >
            ({WD[twd]})
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
          오늘의 일정
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
          onClick={() => !isRefreshing && cal.openAdd({ y: ty, m: tm, d: td })}
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
        {evs.map((e, i) => {
          const on = cal.done.has(e.id);
          return (
            <motion.div
              key={e.id}
              variants={todayItemVariants}
              whileHover={{ x: 2 }}
              whileTap={{ scale: 0.98 }}
              role="button"
              tabIndex={0}
              onClick={() => onToggle(e.id)}
              onKeyDown={(ev) => ev.key === "Enter" && onToggle(e.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                padding: "12px 2px",
                cursor: "pointer",
                borderTop: i ? "1px solid var(--line-soft)" : "none",
              }}
            >
              <Check on={on} onClick={() => onToggle(e.id)} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: 17,
                    color: on ? "var(--ink-3)" : "var(--ink-1)",
                    textDecoration: on ? "line-through" : "none",
                    lineHeight: 1.2,
                    marginBottom: 5,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {e.title}
                </div>
                <Tag color={e.color} bg={e.bg} label={e.tagLabel} />
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
