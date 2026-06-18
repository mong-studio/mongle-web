import { WD } from "./calEngine.js";
import "./DayModalHeader.css";

type Props = {
  m: number;
  d: number;
  wd: number;
  isToday: boolean;
  total: number;
  doneCount: number;
  onClose: () => void;
};

export function DayModalHeader({ m, d, wd, isToday, total, doneCount, onClose }: Props) {
  const wdColor = wd === 0 ? "var(--sun)" : wd === 6 ? "var(--sat)" : "var(--ink-3)";
  return (
    <div className="dayModalHead">
      <span className={`dayModalBadge${isToday ? " isToday" : ""}`}>
        <span className="dayModalBadgeMonth">{m + 1}월</span>
        <span className="dayModalBadgeDay">{d}</span>
      </span>
      <div className="dayModalTitleWrap">
        <div id="day-modal-title" className="dayModalTitle">
          {m + 1}월 {d}일 <span style={{ color: wdColor }}>({WD[wd]})</span>
        </div>
        <div className="dayModalSub">
          {isToday ? "오늘의 일정 · " : "몽글마을 일정 · "}
          {total > 0 ? `${doneCount}/${total} 완료` : "일정 없음"}
        </div>
      </div>
      <button
        type="button"
        className="calBtn-ghost dayModalClose"
        aria-label="닫기"
        onClick={onClose}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
        </svg>
      </button>
    </div>
  );
}
