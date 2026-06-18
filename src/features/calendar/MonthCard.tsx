import { AnimatePresence, motion } from "motion/react";
import type { CSSProperties } from "react";
import type { CalHook } from "./CalendarCore.js";
import { WD } from "./calEngine.js";
import { MonthWeek } from "./MonthWeek.js";
import { useIsNarrow } from "./useIsNarrow.js";
import "./MonthCard.css";

const pageVariants = {
  enter: (d: number) => ({ x: d > 0 ? "100%" : d < 0 ? "-100%" : 0, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (d: number) => ({ x: d > 0 ? "-100%" : d < 0 ? "100%" : 0, opacity: 0 }),
};

type MonthCardProps = { cal: CalHook; dir: number };

export function MonthCard({ cal, dir }: MonthCardProps) {
  const sel = cal.selDate;
  const narrow = useIsNarrow();
  // 반응형 크기는 CSS 변수로 내려 자식 클래스가 소비한다(폰에서 셀이 눌려도 일정이 칸 안에 맞게).
  const sizeVars = {
    "--mc-bar-h": `${narrow ? 16 : 20}px`,
    "--mc-num-h": `${narrow ? 22 : 28}px`,
    "--mc-num-font": `${narrow ? 14 : 17}px`,
    "--mc-today-size": `${narrow ? 20 : 25}px`,
    "--mc-today-font": `${narrow ? 13 : 15}px`,
    "--mc-wd-font": `${narrow ? 12 : 16}px`,
    "--mc-bar-font": `${narrow ? 11 : 13}px`,
  } as CSSProperties;

  return (
    <div className="monthCard" style={sizeVars}>
      <div className="monthWeekHead">
        {WD.map((w, i) => (
          <div
            key={w}
            className="monthWeekHeadCell"
            style={{ color: i === 0 ? "var(--sun)" : i === 6 ? "var(--sat)" : "var(--ink-2)" }}
          >
            {w}
          </div>
        ))}
      </div>
      <div className="monthViewport">
        <AnimatePresence custom={dir} initial={false}>
          <motion.div
            key={`${cal.view.y}-${cal.view.m}`}
            custom={dir}
            variants={pageVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="monthPage"
            style={{ gridTemplateRows: `repeat(${cal.weeks.length},1fr)` }}
          >
            {cal.weeks.map((week, wi) => {
              const weekKey = week[0] ? `${week[0].y}-${week[0].m}-${week[0].d}` : `week-${wi}`;
              return <MonthWeek key={weekKey} week={week} cal={cal} sel={sel} narrow={narrow} />;
            })}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
