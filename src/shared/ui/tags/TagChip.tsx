import type { TagItem } from "../../tags/types.js";
import { DeleteConfirmDialog } from "../DeleteConfirmDialog.js";
import "./TagChip.css";

type Props = {
  tag: TagItem;
  selected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

export function TagChip({ tag, selected, onSelect, onEdit, onDelete }: Props) {
  const fg = selected ? tag.color : "var(--ink-3)";
  return (
    <div
      className="calTagGroup tagChip"
      style={{
        border: selected ? `2px solid ${tag.color}` : "2px solid var(--line-soft)",
        background: selected ? `${tag.color}22` : "var(--cream-0)",
      }}
    >
      <button type="button" className="tagChipSelect" style={{ color: fg }} onClick={onSelect}>
        <span className="tagChipDot" style={{ background: tag.color }} />
        {tag.content}
      </button>
      <div className="tagChipActions">
        <button
          type="button"
          className="tagChipEdit"
          aria-label="태그 수정"
          style={{ color: fg }}
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 14 14"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <g transform="rotate(45, 7, 7)">
              <path d="M7 1.5L8.5 3V10L7 13L5.5 10V3Z" />
            </g>
          </svg>
        </button>
        <DeleteConfirmDialog
          trigger={
            <button
              type="button"
              className="tagChipDelete"
              aria-label="태그 삭제"
              style={{ color: fg }}
              onClick={(e) => e.stopPropagation()}
            >
              <svg
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
              </svg>
            </button>
          }
          title="태그를 삭제할까요?"
          description="이 태그를 삭제하면 되돌릴 수 없어요."
          onConfirm={onDelete}
        />
      </div>
    </div>
  );
}
