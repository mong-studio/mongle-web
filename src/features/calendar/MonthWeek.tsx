import type { CalHook } from "./CalendarCore.js";
import type { CalEvent, CellData } from "./calEngine.js";
import { weekSegments } from "./calEngine.js";
import { EventBar } from "./EventBar.js";
import { EventChip } from "./EventChip.js";

type Props = {
  week: CellData[];
  cal: CalHook;
  sel: { y: number; m: number; d: number };
  narrow: boolean;
};

// 한 주(週) 행. 3개 레이어: 배경 셀(클릭 타깃) · 날짜 숫자 · 일정 그리드.
export function MonthWeek({ week, cal, sel, narrow }: Props) {
  const { spans, laneMap } = cal.spanData;
  const { bars } = weekSegments(week, spans, laneMap, 99);

  // 멀티데이 바가 칸별로 차지한 레인을 기록한다.
  const occupied: Record<number, Set<number>> = {};
  for (const b of bars) {
    for (let col = b.startCol; col <= b.endCol; col++) {
      if (!occupied[col]) occupied[col] = new Set<number>();
      occupied[col].add(b.lane);
    }
  }
  // 단일 일정은 그 칸에서 비어 있는 가장 위 레인에 배치한다 → 날짜 바로 아래에서 시작.
  const singleItems: { ev: CalEvent; col: number; lane: number }[] = [];
  week.forEach((c, col) => {
    if (!c.inMonth) return;
    let lane = 0;
    for (const ev of cal.getEvents(c.y, c.m, c.d).filter((e) => e.s === e.e)) {
      while (occupied[col]?.has(lane)) lane++;
      if (!occupied[col]) occupied[col] = new Set<number>();
      occupied[col].add(lane);
      singleItems.push({ ev, col, lane });
      lane++;
    }
  });

  // 보이는 레인 수를 제한하고, 넘치는 이벤트는 칸별 "+N"으로 표시한다.
  const maxLanes = narrow ? 2 : 4;
  const hiddenPerCol = new Array<number>(7).fill(0);
  for (const b of bars) {
    if (b.lane >= maxLanes) {
      for (let col = b.startCol; col <= b.endCol; col++) hiddenPerCol[col] += 1;
    }
  }
  for (const s of singleItems) {
    if (s.lane >= maxLanes) hiddenPerCol[s.col] += 1;
  }
  const hasEvents = bars.length > 0 || singleItems.length > 0;

  const isSelDay = (c: CellData) => c.inMonth && c.y === sel.y && c.m === sel.m && c.d === sel.d;

  return (
    <div className="monthWeekRow">
      <div className="monthCellLayer">
        {week.map((c) => {
          const isSel = c.inMonth && c.y === sel.y && c.m === sel.m && c.d === sel.d;
          const cls = [
            "monthCell",
            c.inMonth ? "inMonth calDay" : "out",
            isSel && !c.isToday ? "sel" : "",
          ]
            .filter(Boolean)
            .join(" ");
          // 첫 활성화=날짜 선택(우측 패널), 선택된 날을 다시 활성화=상세 모달. 클릭·Enter·Space 동일.
          const activate = () => {
            if (!c.inMonth) return;
            if (isSel) cal.setSel({ y: c.y, m: c.m, d: c.d });
            else cal.setSelDay(c.d);
          };
          return (
            // biome-ignore lint/a11y/noStaticElementInteractions: conditional role for in-month cells
            <div
              key={`${c.y}-${c.m}-${c.d}-bg`}
              className={cls}
              role={c.inMonth ? "button" : undefined}
              tabIndex={c.inMonth ? 0 : undefined}
              onClick={activate}
              onKeyDown={(e) => {
                if (c.inMonth && (e.key === "Enter" || e.key === " ")) {
                  e.preventDefault();
                  activate();
                }
              }}
            >
              {c.isToday && <div className="monthTodayBg" />}
            </div>
          );
        })}
      </div>
      <div className="monthNumLayer">
        <div className="monthNumRow">
          {week.map((c) => (
            <div key={`${c.y}-${c.m}-${c.d}-num`} className="monthNumCell">
              {c.isToday ? (
                <span className="monthTodayCircle">{c.d}</span>
              ) : (
                <span
                  className="monthNum"
                  style={{
                    color: !c.inMonth
                      ? "var(--ink-3)"
                      : c.wd === 0
                        ? "var(--sun)"
                        : c.wd === 6
                          ? "var(--sat)"
                          : "var(--ink-1)",
                  }}
                >
                  {c.d}
                </span>
              )}
            </div>
          ))}
        </div>
        {hasEvents && (
          <div className="monthEvents">
            {bars
              .filter((b) => b.lane < maxLanes)
              .map((b) => {
                const day = week[b.startCol];
                return (
                  <EventBar
                    key={`${b.ev.id}-${b.startCol}`}
                    seg={b}
                    selected={isSelDay(day)}
                    onSelect={() => cal.setSelDay(day.d)}
                    onOpen={() => cal.setSel({ y: day.y, m: day.m, d: day.d })}
                  />
                );
              })}
            {singleItems
              .filter((s) => s.lane < maxLanes)
              .map(({ ev, col, lane }) => {
                const day = week[col];
                return (
                  <EventChip
                    key={ev.id}
                    ev={ev}
                    col={col}
                    lane={lane}
                    selected={isSelDay(day)}
                    onSelect={() => cal.setSelDay(day.d)}
                    onOpen={() => cal.setSel({ y: day.y, m: day.m, d: day.d })}
                  />
                );
              })}
            {hiddenPerCol.map((n, col) =>
              n > 0 ? (
                <span
                  key={`more-${week[col]?.y}-${week[col]?.m}-${week[col]?.d}`}
                  className="monthMore"
                  style={{ gridColumn: `${col + 1} / ${col + 2}`, gridRow: maxLanes + 1 }}
                >
                  +{n}
                </span>
              ) : null,
            )}
          </div>
        )}
      </div>
    </div>
  );
}
