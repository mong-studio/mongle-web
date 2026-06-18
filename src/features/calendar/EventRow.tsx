import { motion } from "motion/react";
import { useState } from "react";
import { DeleteConfirmDialog } from "../../shared/ui/DeleteConfirmDialog.js";
import { Tag } from "../../shared/ui/Tag/Tag.js";
import { Check } from "./CalendarCore.js";
import type { CalEvent } from "./calEngine.js";
import { serialToMD } from "./calEngine.js";
import { EventEditForm } from "./EventEditForm.js";
import type { TagItem } from "./types.js";
import "./EventRow.css";

type Props = {
  ev: CalEvent;
  isDone: boolean;
  isToday: boolean;
  onToggle: () => void;
  onDelete: () => Promise<void>;
  onAbandon: () => Promise<void>;
  onEdit: (
    title: string,
    tagId: number | null,
    startStr: string,
    endStr: string,
    description: string,
  ) => Promise<void>;
  onCreateTag: (name: string, color: string) => Promise<number | null>;
  onDeleteTag: (id: number) => Promise<void>;
  onEditTag: (id: number, content: string, color: string) => Promise<void>;
  tags: TagItem[];
};

const staggerItem = {
  hidden: { opacity: 0, y: 6 },
  show: { opacity: 1, y: 0, transition: { duration: 0.16 } },
};

const trashIcon = (
  <svg
    width="12"
    height="12"
    viewBox="0 0 14 14"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    aria-hidden="true"
  >
    <path d="M2 4h10M5 4V2h4v2M6 7v4M8 7v4M3 4l1 8h6l1-8" />
  </svg>
);

export function EventRow({
  ev,
  isDone,
  isToday,
  onToggle,
  onDelete,
  onAbandon,
  onEdit,
  onCreateTag,
  onDeleteTag,
  onEditTag,
  tags,
}: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const isSchedule = !!ev.scheduleId;
  const isFailed = !!ev.failed;
  // 당일 TODO는 수정 불가 + 삭제 대신 포기. 일정(기간)은 당일이어도 그대로 삭제/수정 가능.
  const locked = isToday && !isSchedule;
  const { m: sm, d: sd } = serialToMD(ev.s);
  const { m: em, d: ed } = serialToMD(ev.e);

  const handleDelete = async () => {
    setDeleteError("");
    try {
      await onDelete();
    } catch {
      setDeleteError("삭제에 실패했어요.");
    }
  };

  const handleAbandon = async () => {
    setDeleteError("");
    try {
      await onAbandon();
    } catch {
      setDeleteError("포기에 실패했어요.");
    }
  };

  if (isEditing) {
    return (
      <EventEditForm
        ev={ev}
        tags={tags}
        onSave={onEdit}
        onCreateTag={onCreateTag}
        onDeleteTag={onDeleteTag}
        onEditTag={onEditTag}
        onClose={() => setIsEditing(false)}
      />
    );
  }

  const mutedColor = isDone || isFailed ? "var(--ink-3)" : "var(--ink-1)";

  return (
    <>
      <motion.div
        variants={staggerItem}
        whileHover={isFailed ? undefined : { x: 1 }}
        className="eventRow"
        style={{ opacity: isFailed ? 0.65 : 1 }}
      >
        {(isFailed || !isSchedule) && (
          <div className="eventRowMark">
            {isFailed ? (
              <span role="img" aria-label="포기됨" className="eventRowFailMark">
                ✕
              </span>
            ) : (
              <Check on={isDone} onClick={onToggle} />
            )}
          </div>
        )}
        <span className="eventRowDot" style={{ background: ev.color }} />
        <div className="eventRowBody">
          <div
            className="eventRowTitle"
            style={{
              color: mutedColor,
              textDecoration: isDone || isFailed ? "line-through" : "none",
            }}
          >
            {ev.title}
          </div>
          {ev.description && <div className="eventRowDesc">{ev.description}</div>}
          <div className="eventRowMeta">
            {ev.s !== ev.e && (
              <span className="eventRowChip">
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 14 14"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  aria-hidden="true"
                  style={{ flexShrink: 0 }}
                >
                  <rect x="1" y="2.5" width="12" height="10.5" rx="2.5" />
                  <path d="M1 6h12" />
                  <path d="M4.5 1v3M9.5 1v3" />
                </svg>
                {sm + 1}/{sd}–{em + 1}/{ed}
              </span>
            )}
            {isFailed && <span className="eventRowBadge">포기</span>}
            <Tag color={ev.color} bg={ev.bg} label={ev.tagLabel} />
          </div>
        </div>
        {!isFailed && (
          <div className="eventRowActions">
            {!locked && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="calIconBtn calBtn-icon"
                aria-label="수정"
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 14 14"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M10 2l2 2L5 11H3V9L10 2z" />
                </svg>
              </button>
            )}
            <DeleteConfirmDialog
              trigger={
                <button
                  type="button"
                  className="calIconBtn calBtn-icon"
                  aria-label={locked ? "포기" : "삭제"}
                >
                  {trashIcon}
                </button>
              }
              title={
                locked ? "포기할까요?" : isSchedule ? "일정을 삭제할까요?" : "할일을 삭제할까요?"
              }
              description={
                locked
                  ? "포기하면 오늘은 완료할 수 없어요. 포기 기록은 남아요."
                  : "삭제하면 되돌릴 수 없어요."
              }
              confirmLabel={locked ? "포기하기" : undefined}
              onConfirm={() => void (locked ? handleAbandon() : handleDelete())}
            />
          </div>
        )}
      </motion.div>
      {deleteError && <p className="eventRowError">{deleteError}</p>}
    </>
  );
}
