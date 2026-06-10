import { AnimatePresence, motion } from "framer-motion";
import type { CalHook } from "./CalendarCore.js";
import { WD, weekSegments } from "./calEngine.js";

const pageVariants = {
  enter: (d: number) => ({ x: d > 0 ? "100%" : d < 0 ? "-100%" : 0, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (d: number) => ({ x: d > 0 ? "-100%" : d < 0 ? "100%" : 0, opacity: 0 }),
};

type MonthCardProps = { cal: CalHook; dir: number };

export function MonthCard({ cal, dir }: MonthCardProps) {
  const { spans, laneMap } = cal.spanData;
  const BAR_H = 20;

  return (
    <div
      style={{
        flex: 1,
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        background: "var(--cream-0)",
        border: "2px solid var(--line)",
        borderRadius: "var(--r-lg)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,.6)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7,1fr)",
          padding: "13px 0 11px",
          borderBottom: "2px solid var(--line-soft)",
        }}
      >
        {WD.map((w, i) => (
          <div
            key={w}
            style={{
              textAlign: "center",
              fontFamily: "var(--font-display)",
              fontSize: 16,
              color: i === 0 ? "var(--sun)" : i === 6 ? "var(--sat)" : "var(--ink-2)",
            }}
          >
            {w}
          </div>
        ))}
      </div>
      <div
        style={{
          position: "relative",
          overflow: "hidden",
          flex: 1,
          minHeight: 0,
        }}
      >
        <AnimatePresence custom={dir}>
          <motion.div
            key={`${cal.view.y}-${cal.view.m}`}
            custom={dir}
            variants={pageVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.22, ease: "easeInOut" }}
            style={{
              position: "absolute",
              inset: 0,
              display: "grid",
              gridTemplateRows: `repeat(${cal.weeks.length},1fr)`,
            }}
          >
            {cal.weeks.map((week, wi) => {
              const { bars } = weekSegments(week, spans, laneMap, 99);
              const bandLanes = bars.reduce((mx, b) => Math.max(mx, b.lane + 1), 0);
              const weekKey = week[0] ? `${week[0].y}-${week[0].m}-${week[0].d}` : `week-${wi}`;
              return (
                <div
                  key={weekKey}
                  style={{
                    position: "relative",
                    borderTop: wi ? "1px solid var(--line-soft)" : "none",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "grid",
                      gridTemplateColumns: "repeat(7,1fr)",
                    }}
                  >
                    {week.map((c, ci) => (
                      // biome-ignore lint/a11y/noStaticElementInteractions: conditional role for in-month cells
                      <div
                        key={`${c.y}-${c.m}-${c.d}-bg`}
                        className={c.inMonth ? "calDay" : undefined}
                        role={c.inMonth ? "button" : undefined}
                        tabIndex={c.inMonth ? 0 : undefined}
                        onClick={() => c.inMonth && cal.setSel({ y: c.y, m: c.m, d: c.d })}
                        onKeyDown={(e) =>
                          e.key === "Enter" && c.inMonth && cal.setSel({ y: c.y, m: c.m, d: c.d })
                        }
                        style={{
                          position: "relative",
                          borderLeft: ci ? "1px solid var(--line-soft)" : "none",
                          cursor: c.inMonth ? "pointer" : "default",
                          background: !c.inMonth ? "rgba(120,84,38,.03)" : "transparent",
                        }}
                      >
                        {c.isToday && (
                          <div
                            style={{
                              position: "absolute",
                              inset: 0,
                              background: "var(--accent-tint)",
                              pointerEvents: "none",
                            }}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                  <div
                    style={{ position: "relative", padding: "7px 0 6px", pointerEvents: "none" }}
                  >
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)" }}>
                      {week.map((c) => (
                        <div
                          key={`${c.y}-${c.m}-${c.d}-num`}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            padding: "0 9px",
                            height: 28,
                          }}
                        >
                          {c.isToday ? (
                            <span
                              style={{
                                width: 25,
                                height: 25,
                                borderRadius: "50%",
                                background: "var(--accent)",
                                color: "#fff",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontFamily: "var(--font-display)",
                                fontSize: 15,
                                boxShadow: "inset 0 -2px 0 rgba(0,0,0,.13)",
                              }}
                            >
                              {c.d}
                            </span>
                          ) : (
                            <span
                              style={{
                                fontFamily: "var(--font-display)",
                                fontSize: 17,
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
                    {bandLanes > 0 && (
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(7,1fr)",
                          gridAutoRows: `${BAR_H}px`,
                          rowGap: 3,
                          padding: "5px 0 1px",
                        }}
                      >
                        {bars.map((b) => {
                          const isDone = cal.done.has(b.ev.id);
                          return (
                            <button
                              key={`${b.ev.id}-${b.startCol}`}
                              type="button"
                              className="calEventBar"
                              tabIndex={0}
                              onClick={(e) => {
                                e.stopPropagation();
                                cal.setSel({
                                  y: week[b.startCol].y,
                                  m: week[b.startCol].m,
                                  d: week[b.startCol].d,
                                });
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter")
                                  cal.setSel({
                                    y: week[b.startCol].y,
                                    m: week[b.startCol].m,
                                    d: week[b.startCol].d,
                                  });
                              }}
                              style={{
                                gridColumn: `${b.startCol + 1} / ${b.endCol + 2}`,
                                gridRow: b.lane + 1,
                                cursor: "pointer",
                                border: "none",
                                pointerEvents: "auto",
                                height: BAR_H - 2,
                                display: "flex",
                                alignItems: "center",
                                background: isDone ? "var(--cream-2)" : b.ev.bg,
                                color: isDone ? "var(--ink-3)" : b.ev.color,
                                marginLeft: b.roundL ? 6 : 0,
                                marginRight: b.roundR ? 6 : 0,
                                borderTopLeftRadius: b.roundL ? 8 : 2,
                                borderBottomLeftRadius: b.roundL ? 8 : 2,
                                borderTopRightRadius: b.roundR ? 8 : 2,
                                borderBottomRightRadius: b.roundR ? 8 : 2,
                                paddingLeft: b.roundL ? 9 : 5,
                                paddingRight: 7,
                                fontFamily: "var(--font-display)",
                                fontSize: 13,
                                lineHeight: 1,
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                textDecoration: isDone ? "line-through" : "none",
                              }}
                            >
                              {!b.roundL && <span style={{ marginRight: 3, opacity: 0.7 }}>‹</span>}
                              <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                                {b.ev.title}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(7,1fr)",
                        paddingTop: 4,
                      }}
                    >
                      {week.map((c) => {
                        const singles = c.inMonth
                          ? cal.getEvents(c.y, c.m, c.d).filter((e) => e.s === e.e)
                          : [];
                        const shown = singles.slice(0, 2);
                        const more = singles.length - shown.length;
                        return (
                          <div
                            key={`${c.y}-${c.m}-${c.d}-singles`}
                            style={{
                              padding: "0 8px 2px",
                              minHeight: 30,
                              display: "flex",
                              flexDirection: "column",
                              gap: 4,
                            }}
                          >
                            {shown.map((e) => (
                              <div
                                key={e.id}
                                style={{
                                  background: e.bg,
                                  color: e.color,
                                  borderRadius: 8,
                                  padding: "3px 9px",
                                  fontFamily: "var(--font-display)",
                                  fontSize: 13,
                                  lineHeight: 1.3,
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  opacity: cal.done.has(e.id) ? 0.5 : 1,
                                  textDecoration: cal.done.has(e.id) ? "line-through" : "none",
                                }}
                              >
                                {e.short || e.title}
                              </div>
                            ))}
                            {more > 0 && (
                              <span
                                style={{
                                  fontFamily: "var(--font-display)",
                                  fontSize: 12,
                                  color: "var(--ink-3)",
                                  paddingLeft: 4,
                                  alignSelf: "flex-end",
                                }}
                              >
                                +{more}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
