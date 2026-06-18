import { readableInk } from "../../shared/ui/Tag/Tag.js";
import type { BarSeg } from "./calEngine.js";

type Props = {
  seg: BarSeg;
  selected: boolean;
  onSelect: () => void;
  onOpen: () => void;
};

// 여러 날에 걸친 일정 막대. 위치(grid)·모서리·색은 동적이라 인라인, 정적 레이아웃은 .monthBar.
export function EventBar({ seg, selected, onSelect, onOpen }: Props) {
  const { ev, startCol, endCol, lane, roundL, roundR } = seg;
  const isDone = ev.done;
  return (
    <button
      type="button"
      className="calEventBar monthBar"
      // 첫 활성화(클릭/Enter/Space)=날짜 선택, 선택된 날을 다시 활성화=상세 모달.
      onClick={(e) => {
        e.stopPropagation();
        if (selected) onOpen();
        else onSelect();
      }}
      style={{
        gridColumn: `${startCol + 1} / ${endCol + 2}`,
        gridRow: lane + 1,
        background: isDone ? "var(--cream-2)" : ev.bg,
        color: isDone ? "var(--ink-3)" : readableInk(ev.color),
        marginLeft: roundL ? 6 : 0,
        marginRight: roundR ? 6 : 0,
        borderTopLeftRadius: roundL ? 8 : 2,
        borderBottomLeftRadius: roundL ? 8 : 2,
        borderTopRightRadius: roundR ? 8 : 2,
        borderBottomRightRadius: roundR ? 8 : 2,
        paddingLeft: roundL ? 9 : 5,
        textDecoration: isDone ? "line-through" : "none",
      }}
    >
      {!roundL && <span className="monthBarCaret">‹</span>}
      <span className="monthBarTitle">{ev.title}</span>
    </button>
  );
}
