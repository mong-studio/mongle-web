import type { ReactNode } from "react";
import { serial } from "./calEngine.js";

export type CalCell = {
  y: number;
  m: number;
  d: number;
  sr: number;
  inMonth: boolean;
  isToday: boolean;
  wd: number;
};

type CalendarGridProps = {
  year: number;
  month: number;
  todaySr: number;
  onMonthStep: (dir: -1 | 1) => void;
  renderCell: (cell: CalCell) => ReactNode;
};

const WD_KO = ["일", "월", "화", "수", "목", "금", "토"] as const;

function daysIn(y: number, m: number): number {
  return new Date(y, m + 1, 0).getDate();
}

export function CalendarGrid({ year, month, todaySr, onMonthStep, renderCell }: CalendarGridProps) {
  const firstWd = new Date(year, month, 1).getDay();
  const monthTotal = daysIn(year, month);
  const prevTotal = daysIn(month === 0 ? year - 1 : year, month === 0 ? 11 : month - 1);

  const cells: CalCell[] = Array.from({ length: 42 }, (_, i) => {
    const off = i - firstWd;
    let cy = year,
      cm = month,
      cd: number,
      inMonth: boolean;
    if (off < 0) {
      cm = month === 0 ? 11 : month - 1;
      cy = month === 0 ? year - 1 : year;
      cd = prevTotal + off + 1;
      inMonth = false;
    } else if (off >= monthTotal) {
      cm = month === 11 ? 0 : month + 1;
      cy = month === 11 ? year + 1 : year;
      cd = off - monthTotal + 1;
      inMonth = false;
    } else {
      cd = off + 1;
      inMonth = true;
    }
    const sr = serial(cy, cm, cd);
    return { y: cy, m: cm, d: cd, inMonth, sr, isToday: sr === todaySr, wd: i % 7 };
  });

  const weekRows: CalCell[][] = [];
  for (let w = 0; w < 6; w++) {
    const slice = cells.slice(w * 7, w * 7 + 7);
    if (w === 5 && slice.every((c) => !c.inMonth)) break;
    weekRows.push(slice);
  }

  return (
    <div
      style={{
        background: "var(--cream-0)",
        border: "2px solid var(--line-soft)",
        borderRadius: "var(--r-md)",
        padding: "12px 10px 10px",
        boxShadow: "var(--sh-card)",
      }}
    >
      {/* 월 네비게이션 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 10,
          paddingInline: 2,
        }}
      >
        <button
          type="button"
          aria-label="이전 달"
          onClick={() => onMonthStep(-1)}
          className="calBtn-nav"
          style={{
            width: 28,
            height: 28,
            border: "none",
            background: "transparent",
            cursor: "pointer",
            color: "var(--accent-deep)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 6,
            padding: 0,
          }}
        >
          <svg
            width="11"
            height="11"
            viewBox="0 0 14 14"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M9 2L4 7l5 5" />
          </svg>
        </button>
        <span style={{ fontFamily: "var(--font-display)", fontSize: 14, color: "var(--ink-1)" }}>
          {year}년 {month + 1}월
        </span>
        <button
          type="button"
          aria-label="다음 달"
          onClick={() => onMonthStep(1)}
          className="calBtn-nav"
          style={{
            width: 28,
            height: 28,
            border: "none",
            background: "transparent",
            cursor: "pointer",
            color: "var(--accent-deep)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 6,
            padding: 0,
          }}
        >
          <svg
            width="11"
            height="11"
            viewBox="0 0 14 14"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M5 2l5 5-5 5" />
          </svg>
        </button>
      </div>

      {/* 요일 헤더 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: 3 }}>
        {WD_KO.map((w, i) => (
          <div
            key={w}
            style={{
              textAlign: "center",
              fontFamily: "var(--font-display)",
              fontSize: 11,
              color: i === 0 ? "var(--sun)" : i === 6 ? "var(--sat)" : "var(--ink-3)",
              paddingBottom: 4,
            }}
          >
            {w}
          </div>
        ))}
      </div>

      {/* 날짜 그리드 */}
      {weekRows.map((week, wi) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: stable week grid rows
        <div key={wi} style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
          {week.map((cell) => renderCell(cell))}
        </div>
      ))}
    </div>
  );
}
