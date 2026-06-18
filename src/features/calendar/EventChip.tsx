import { readableInk } from "../../shared/ui/Tag/Tag.js";
import type { CalEvent } from "./calEngine.js";

type Props = {
  ev: CalEvent;
  col: number;
  lane: number;
  selected: boolean;
  onSelect: () => void;
  onOpen: () => void;
};

// 하루짜리 일정 칩. 위치(grid)·색은 동적이라 인라인, 정적 레이아웃은 .monthChip.
export function EventChip({ ev, col, lane, selected, onSelect, onOpen }: Props) {
  const muted = ev.done || ev.failed;
  return (
    <button
      type="button"
      className="calEventBar monthChip"
      // 첫 활성화(클릭/Enter/Space)=날짜 선택, 선택된 날을 다시 활성화=상세 모달.
      onClick={(e) => {
        e.stopPropagation();
        if (selected) onOpen();
        else onSelect();
      }}
      style={{
        gridColumn: `${col + 1} / ${col + 2}`,
        gridRow: lane + 1,
        background: muted ? "var(--cream-2)" : ev.bg,
        color: muted ? "var(--ink-3)" : readableInk(ev.color),
        textDecoration: muted ? "line-through" : "none",
      }}
    >
      {ev.short || ev.title}
    </button>
  );
}
