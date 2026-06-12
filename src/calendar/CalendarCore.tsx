import { useCallback, useMemo, useState } from "react";
import type { CalEvent, CatKey, CellData } from "./calEngine.js";
import { assignLanes, CATS, dateToSerial, monthMatrix, serial } from "./calEngine.js";

// ── useCalendar hook ──────────────────────────────────────────

export type CalHook = ReturnType<typeof useCalendar>;

export function useCalendar(baseEvents: CalEvent[]) {
  const today = useMemo(() => new Date(), []);
  const todaySr = useMemo(() => dateToSerial(today), [today]);

  const [view, setView] = useState({ y: today.getFullYear(), m: today.getMonth() });
  const [sel, setSelRaw] = useState<{ y: number; m: number; d: number } | null>(null);
  const [selAdd, setSelAdd] = useState(false);
  const [extra, setExtra] = useState<CalEvent[]>([]);
  const [done, setDone] = useState<Set<string>>(
    () => new Set(baseEvents.filter((e) => e.done).map((e) => e.id)),
  );

  const setSel = useCallback((ymd: typeof sel) => {
    setSelAdd(false);
    setSelRaw(ymd);
  }, []);
  const openAdd = useCallback((ymd: typeof sel) => {
    setSelAdd(true);
    setSelRaw(ymd);
  }, []);

  const step = useCallback(
    (dir: number) =>
      setView((v) => {
        let m = v.m + dir,
          y = v.y;
        if (m < 0) {
          m = 11;
          y--;
        }
        if (m > 11) {
          m = 0;
          y++;
        }
        return { y, m };
      }),
    [],
  );

  const toToday = useCallback(
    () => setView({ y: today.getFullYear(), m: today.getMonth() }),
    [today],
  );

  const toggle = useCallback(
    (id: string) =>
      setDone((s) => {
        const n = new Set(s);
        n.has(id) ? n.delete(id) : n.add(id);
        return n;
      }),
    [],
  );

  const allEvents = useCallback(() => baseEvents.concat(extra), [baseEvents, extra]);

  const getEvents = useCallback(
    (y: number, m: number, d: number): CalEvent[] => {
      const sr = serial(y, m, d);
      return allEvents()
        .filter((e) => e.s <= sr && sr <= e.e)
        .sort((a, b) => a.s - b.s || b.e - b.s - (a.e - a.s));
    },
    [allEvents],
  );

  const addLocal = useCallback((ev: CalEvent) => {
    setExtra((x) => [...x, ev]);
  }, []);

  const weeks = useMemo(() => monthMatrix(view.y, view.m, todaySr), [view.y, view.m, todaySr]);

  const spanData = useMemo(() => {
    const flat = weeks.flat() as CellData[];
    if (!flat.length) return { spans: [] as CalEvent[], laneMap: {} as Record<string, number> };
    const gs = flat[0].s,
      ge = flat[flat.length - 1].s;
    const spans = allEvents().filter((e) => e.s !== e.e && e.e >= gs && e.s <= ge);
    return { spans, laneMap: assignLanes(spans) };
  }, [weeks, allEvents]);

  return {
    today,
    todaySr,
    view,
    weeks,
    sel,
    setSel,
    selAdd,
    openAdd,
    done,
    toggle,
    step,
    toToday,
    getEvents,
    addLocal,
    spanData,
  };
}

// ── Check ─────────────────────────────────────────────────────

export function Check({ on, onClick }: { on: boolean; onClick?: () => void }) {
  return (
    <button
      type="button"
      aria-label={on ? "완료 해제" : "완료로 표시"}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      style={{
        width: 26,
        height: 26,
        flex: "0 0 auto",
        borderRadius: 9,
        cursor: "pointer",
        border: on ? "none" : "2.5px solid var(--line)",
        background: on ? "var(--accent)" : "var(--cream-0)",
        boxShadow: on ? "inset 0 -2px 0 rgba(0,0,0,.12)" : "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "all .15s",
        padding: 0,
      }}
    >
      {on && (
        <svg
          aria-hidden="true"
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          stroke="#fff"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M2.5 7.5l3 3 6-7" />
        </svg>
      )}
    </button>
  );
}

// ── CatChip ───────────────────────────────────────────────────

export function CatChip({
  catKey,
  active,
  onClick,
}: {
  catKey: CatKey;
  active: boolean;
  onClick: () => void;
}) {
  const c = CATS[catKey];
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "7px 13px",
        borderRadius: 999,
        cursor: "pointer",
        fontFamily: "var(--font-display)",
        fontSize: 14,
        whiteSpace: "nowrap",
        border: active ? `2px solid ${c.color}` : "2px solid var(--line-soft)",
        background: active ? c.bg : "var(--cream-0)",
        color: active ? c.color : "var(--ink-3)",
        transition: "all .14s",
      }}
    >
      #{c.label}
    </button>
  );
}
