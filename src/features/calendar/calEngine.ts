// Pure calendar utilities — types, math, constants
// Callers: CalendarCore.tsx, CalendarModal.tsx

export type CatKey = "work" | "health" | "grow" | "rest" | "meet";

export const CATS: Record<CatKey, { label: string; color: string; bg: string }> = {
  work: { label: "작업", color: "#8478C0", bg: "#ECE7F8" },
  health: { label: "건강", color: "#62A256", bg: "#E3F0DC" },
  grow: { label: "성장", color: "#5790C4", bg: "#DCEBF8" },
  rest: { label: "휴식", color: "#CF7E97", bg: "#F8E3EA" },
  meet: { label: "약속", color: "#D9943C", bg: "#FBEBD2" },
};

export const WD = ["일", "월", "화", "수", "목", "금", "토"] as const;

export type CalEvent = {
  id: string;
  title: string;
  short: string;
  done: boolean;
  failed?: boolean; // 포기(FAILED)된 TODO
  s: number; // UTC day serial
  e: number;
  color: string; // text / border color
  bg: string; // background color
  tagLabel: string; // e.g. '#작업'
  description?: string;
  tagId?: number | null;
  todoId?: string;
  scheduleId?: string;
};

export type CellData = {
  y: number;
  m: number;
  d: number;
  inMonth: boolean;
  wd: number; // 0=Sun … 6=Sat
  s: number;
  isToday: boolean;
};

export type BarSeg = {
  lane: number;
  startCol: number;
  endCol: number;
  ev: CalEvent;
  roundL: boolean; // event start is within this week
  roundR: boolean; // event end is within this week
};

export function serial(y: number, m: number, d: number): number {
  return Math.floor(Date.UTC(y, m, d) / 86400000);
}

export function serialToMD(sr: number): { m: number; d: number } {
  const dt = new Date(sr * 86400000);
  return { m: dt.getUTCMonth(), d: dt.getUTCDate() };
}

export function dateToSerial(d: Date): number {
  return serial(d.getFullYear(), d.getMonth(), d.getDate());
}

// 날짜 문자열(YYYY-MM-DD)을 파싱하거나 한국어로 포맷하는 함수들. DateRangePicker, SingleDatePicker 양쪽에서 공용으로 쓴다.
export function parseYMD(s: string): [number, number, number] | null {
  if (!s) return null;
  const parts = s.split("-").map(Number);
  return parts.length === 3 && !parts.some(Number.isNaN)
    ? [parts[0], parts[1] - 1, parts[2]]
    : null;
}

export function formatYMDKo(s: string): string {
  const p = parseYMD(s);
  if (!p) return "날짜 선택";
  const wd = new Date(p[0], p[1], p[2]).getDay();
  return `${p[1] + 1}월 ${p[2]}일 (${WD[wd]})`;
}

export function ymdStrToSerial(s: string): number {
  const p = parseYMD(s);
  if (!p) return 0; // 잘못된 날짜 문자열이 들어오면 0(epoch serial)을 반환. 정상 흐름에서 API는 항상 YYYY-MM-DD 형식을 보낸다.
  return serial(p[0], p[1], p[2]);
}

export function serialToYMDStr(sr: number): string {
  const dt = new Date(sr * 86400000);
  return toYMDStr(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate());
}

export function toYMDStr(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export function assignLanes(events: CalEvent[]): Record<string, number> {
  const sorted = [...events].sort((a, b) => a.s - b.s || b.e - b.s - (a.e - a.s));
  const laneEnd: number[] = [];
  const lane: Record<string, number> = {};
  sorted.forEach((ev) => {
    let i = 0;
    while (i < laneEnd.length && laneEnd[i] >= ev.s) i++;
    laneEnd[i] = ev.e;
    lane[ev.id] = i;
  });
  return lane;
}

export function monthMatrix(y: number, m: number, todaySr: number): CellData[][] {
  const startWd = new Date(y, m, 1).getDay();
  const daysIn = new Date(y, m + 1, 0).getDate();
  const prevDays = new Date(y, m, 0).getDate();
  const cells: CellData[] = [];
  for (let i = 0; i < 42; i++) {
    const off = i - startWd;
    let cy = y,
      cm = m,
      cd = off + 1,
      inMonth = true;
    if (off < 0) {
      cm--;
      cd = prevDays + off + 1;
      inMonth = false;
    } else if (off >= daysIn) {
      cm++;
      cd = off - daysIn + 1;
      inMonth = false;
    }
    if (cm < 0) {
      cm = 11;
      cy--;
    }
    if (cm > 11) {
      cm = 0;
      cy++;
    }
    const s = serial(cy, cm, cd);
    cells.push({ y: cy, m: cm, d: cd, inMonth, wd: i % 7, s, isToday: s === todaySr });
  }
  const weeks: CellData[][] = [];
  for (let w = 0; w < 6; w++) weeks.push(cells.slice(w * 7, w * 7 + 7));
  if (weeks[5].every((c) => !c.inMonth)) weeks.pop();
  return weeks;
}

export function weekSegments(
  week: CellData[],
  spans: CalEvent[],
  laneMap: Record<string, number>,
  maxLane: number,
): { bars: BarSeg[]; overflow: number[] } {
  const ws = week[0].s,
    we = week[6].s;
  const bars: BarSeg[] = [];
  const overflow: number[] = Array<number>(7).fill(0);
  spans.forEach((ev) => {
    if (ev.e < ws || ev.s > we) return;
    const startCol = Math.max(0, ev.s - ws);
    const endCol = Math.min(6, ev.e - ws);
    const L = laneMap[ev.id] ?? 0;
    if (L < maxLane) {
      bars.push({ lane: L, startCol, endCol, ev, roundL: ev.s >= ws, roundR: ev.e <= we });
    } else {
      for (let c = startCol; c <= endCol; c++) overflow[c]++;
    }
  });
  return { bars, overflow };
}

// Map an arbitrary hex color to the closest design category
const CAT_RGB: Array<[CatKey, [number, number, number]]> = [
  ["work", [132, 120, 192]],
  ["health", [98, 162, 86]],
  ["grow", [87, 144, 196]],
  ["rest", [207, 126, 151]],
  ["meet", [217, 148, 60]],
];

export function catFromHex(hex: string): CatKey {
  const clean = (hex ?? "").replace("#", "");
  const mat = clean.match(/([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i);
  if (!mat) return "work";
  const r = parseInt(mat[1], 16),
    g = parseInt(mat[2], 16),
    b = parseInt(mat[3], 16);
  let best: CatKey = "work",
    bestD = Infinity;
  for (const [k, [cr, cg, cb]] of CAT_RGB) {
    const d = Math.hypot(r - cr, g - cg, b - cb);
    if (d < bestD) {
      bestD = d;
      best = k;
    }
  }
  return best;
}
