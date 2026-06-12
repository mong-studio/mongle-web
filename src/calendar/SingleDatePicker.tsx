import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarGrid } from "./CalendarGrid.js";
import { formatYMDKo, parseYMD, serial, toYMDStr } from "./calEngine.js";

type Props = {
  value: string;
  onChange: (v: string) => void;
};

export function SingleDatePicker({ value, onChange }: Props) {
  const todaySr = useMemo(() => {
    const now = new Date();
    return serial(now.getFullYear(), now.getMonth(), now.getDate());
  }, []);

  const p = parseYMD(value);
  const valueSr = p ? serial(p[0], p[1], p[2]) : null;

  const [open, setOpen] = useState(false);
  const [view, setView] = useState<{ y: number; m: number }>(() => {
    if (p) return { y: p[0], m: p[1] };
    const n = new Date();
    return { y: n.getFullYear(), m: n.getMonth() };
  });
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const fn = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, [open]);

  const stepMonth = (dir: number) =>
    setView((v) => {
      let { m, y } = v;
      m += dir;
      if (m < 0) {
        m = 11;
        y--;
      }
      if (m > 11) {
        m = 0;
        y++;
      }
      return { y, m };
    });

  const { y, m } = view;

  return (
    <div ref={wrapRef} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {/* 날짜 버튼 */}
      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 14,
            color: "var(--ink-2)",
            flexShrink: 0,
          }}
        >
          날짜
        </span>
        <button
          type="button"
          onClick={() => {
            if (!open && p) setView({ y: p[0], m: p[1] });
            setOpen((v) => !v);
          }}
          aria-label={`날짜: ${formatYMDKo(value)}`}
          style={{
            flex: 1,
            padding: "9px 11px",
            borderRadius: "var(--r-md)",
            border: `2px solid ${open ? "var(--accent)" : "var(--line-soft)"}`,
            background: open ? "var(--accent-tint)" : "var(--cream-1)",
            color: value ? "var(--ink-1)" : "var(--ink-3)",
            fontFamily: "var(--font-display)",
            fontSize: 13,
            cursor: "pointer",
            textAlign: "left",
            transition: "border-color .14s, background .14s",
            whiteSpace: "nowrap",
            outline: "none",
            boxSizing: "border-box",
          }}
        >
          {formatYMDKo(value)}
        </button>
      </div>

      {/* 인라인 캘린더 팝업 */}
      {open && (
        <CalendarGrid
          year={y}
          month={m}
          todaySr={todaySr}
          onMonthStep={stepMonth}
          renderCell={(cell) => {
            const isSel = valueSr !== null && cell.sr === valueSr;
            let bg = "transparent";
            let color = cell.inMonth
              ? cell.wd === 0
                ? "var(--sun)"
                : cell.wd === 6
                  ? "var(--sat)"
                  : "var(--ink-1)"
              : "var(--ink-3)";
            if (isSel) {
              bg = "var(--accent)";
              color = "#fff";
            }
            return (
              <button
                type="button"
                key={`${cell.y}-${cell.m}-${cell.d}`}
                onClick={() => {
                  onChange(toYMDStr(cell.y, cell.m, cell.d));
                  setOpen(false);
                }}
                aria-label={`${cell.y}년 ${cell.m + 1}월 ${cell.d}일`}
                aria-pressed={isSel}
                className="calMiniDay"
                style={{
                  height: 32,
                  border:
                    cell.isToday && !isSel ? "2px solid var(--line)" : "2px solid transparent",
                  borderRadius: 8,
                  background: bg,
                  color,
                  fontFamily: "var(--font-display)",
                  fontSize: 13,
                  fontWeight: isSel ? 700 : 400,
                  cursor: "pointer",
                  opacity: cell.inMonth ? 1 : 0.3,
                  padding: 0,
                  boxShadow: isSel ? "inset 0 -2px 0 rgba(0,0,0,.14)" : "none",
                }}
              >
                {cell.d}
              </button>
            );
          }}
        />
      )}
    </div>
  );
}
