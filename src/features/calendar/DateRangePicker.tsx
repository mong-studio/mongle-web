import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CalendarGrid } from "./CalendarGrid.js";
import { formatYMDKo, parseYMD, serial, toYMDStr } from "./calEngine.js";

type Props = {
  start: string;
  end: string;
  onStart: (v: string) => void;
  onEnd: (v: string) => void;
};

export function DateRangePicker({ start, end, onStart, onEnd }: Props) {
  const todaySr = useMemo(() => {
    const now = new Date();
    return serial(now.getFullYear(), now.getMonth(), now.getDate());
  }, []);

  const sp = parseYMD(start);
  const ep = parseYMD(end);
  const startSr = sp ? serial(sp[0], sp[1], sp[2]) : null;
  const endSr = ep ? serial(ep[0], ep[1], ep[2]) : null;

  const [field, setField] = useState<"start" | "end" | null>(null);
  const [view, setView] = useState<{ y: number; m: number }>(() => {
    const now = new Date();
    const p = sp ?? [now.getFullYear(), now.getMonth(), 1];
    return { y: p[0], m: p[1] };
  });
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!field) return;
    const fn = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setField(null);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, [field]);

  const openField = (f: "start" | "end") => {
    if (field === f) {
      setField(null);
      return;
    }
    setField(f);
    const ref = f === "start" ? sp : (ep ?? sp);
    if (ref) setView({ y: ref[0], m: ref[1] });
    else {
      const now = new Date();
      setView({ y: now.getFullYear(), m: now.getMonth() });
    }
  };

  const pick = useCallback(
    (cy: number, cm: number, cd: number) => {
      const s = toYMDStr(cy, cm, cd);
      if (field === "start") {
        onStart(s);
        if (end && s > end) onEnd(s);
        setField("end");
      } else if (field === "end") {
        // 선택한 날짜가 기존 시작일보다 앞이면 두 날짜를 교환한다. 이렇게 하면 start <= end 순서가 항상 유지된다.
        if (start && s < start) {
          onStart(s);
          onEnd(start);
        } else {
          onEnd(s);
        }
        setField(null);
      }
    },
    [field, start, end, onStart, onEnd],
  );

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
  const durDays =
    startSr !== null && endSr !== null && endSr > startSr ? endSr - startSr + 1 : null;

  return (
    <div ref={wrapRef} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {/* Date badge row */}
      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 14,
            color: "var(--ink-2)",
            flexShrink: 0,
          }}
        >
          기간
        </span>

        <button
          type="button"
          onClick={() => openField("start")}
          aria-label={`시작일: ${formatYMDKo(start)}`}
          style={{
            flex: 1,
            padding: "9px 11px",
            borderRadius: "var(--r-md)",
            border: `2px solid ${field === "start" ? "var(--accent)" : "var(--line-soft)"}`,
            background: field === "start" ? "var(--accent-tint)" : "var(--cream-1)",
            color: start ? "var(--ink-1)" : "var(--ink-3)",
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
          {formatYMDKo(start)}
        </button>

        <svg
          width="14"
          height="14"
          viewBox="0 0 16 16"
          fill="none"
          stroke="var(--ink-3)"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden="true"
          style={{ flexShrink: 0 }}
        >
          <path d="M3 8h10M9 4l4 4-4 4" />
        </svg>

        <button
          type="button"
          onClick={() => openField("end")}
          aria-label={`종료일: ${formatYMDKo(end)}`}
          style={{
            flex: 1,
            padding: "9px 11px",
            borderRadius: "var(--r-md)",
            border: `2px solid ${field === "end" ? "var(--accent)" : "var(--line-soft)"}`,
            background: field === "end" ? "var(--accent-tint)" : "var(--cream-1)",
            color: end ? "var(--ink-1)" : "var(--ink-3)",
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
          {formatYMDKo(end)}
        </button>
      </div>

      {durDays && (
        <span
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 12,
            color: "var(--ink-3)",
            paddingLeft: 2,
          }}
        >
          {durDays}일간 🐌
        </span>
      )}

      {/* Inline mini calendar */}
      {field && (
        <CalendarGrid
          year={y}
          month={m}
          todaySr={todaySr}
          onMonthStep={stepMonth}
          renderCell={(cell) => {
            const isStart = startSr !== null && cell.sr === startSr;
            const isEnd = endSr !== null && cell.sr === endSr;
            const inRange =
              startSr !== null && endSr !== null && cell.sr > startSr && cell.sr < endSr;
            const isEndpoint = isStart || isEnd;
            let bg = "transparent";
            let color = cell.inMonth
              ? cell.wd === 0
                ? "var(--sun)"
                : cell.wd === 6
                  ? "var(--sat)"
                  : "var(--ink-1)"
              : "var(--ink-3)";
            if (inRange) bg = "var(--accent-tint)";
            if (isEndpoint) {
              bg = "var(--accent)";
              color = "#fff";
            }
            return (
              <button
                type="button"
                key={`${cell.y}-${cell.m}-${cell.d}`}
                onClick={() => pick(cell.y, cell.m, cell.d)}
                aria-label={`${cell.y}년 ${cell.m + 1}월 ${cell.d}일`}
                aria-pressed={isEndpoint}
                className="calMiniDay"
                style={{
                  height: 32,
                  border:
                    cell.isToday && !isEndpoint ? "2px solid var(--line)" : "2px solid transparent",
                  borderRadius: 8,
                  background: bg,
                  color,
                  fontFamily: "var(--font-display)",
                  fontSize: 13,
                  fontWeight: isEndpoint ? 700 : 400,
                  cursor: "pointer",
                  opacity: cell.inMonth ? 1 : 0.3,
                  padding: 0,
                  boxShadow: isEndpoint ? "inset 0 -2px 0 rgba(0,0,0,.14)" : "none",
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
