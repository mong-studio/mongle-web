import { motion } from "motion/react";
import { useState } from "react";
import { DeleteConfirmDialog } from "../../shared/ui/DeleteConfirmDialog.js";
import { Tag } from "../../shared/ui/Tag/Tag.js";
import { Check } from "./CalendarCore.js";
import type { CalEvent } from "./calEngine.js";
import { canExtendTodo, serialToMD } from "./calEngine.js";
import { EventEditForm } from "./EventEditForm.js";
import { ExtendTodoDialog } from "./ExtendTodoDialog.js";
import type { TagItem } from "./types.js";
import "./EventRow.css";

// 지난 미완료 TODO 연장에 사용하는 토큰 수(백엔드 TODO_EXTENSION_TOKEN_COST 와 일치).
const EXTEND_TOKEN_COST = 4;

type Props = {
  ev: CalEvent;
  isDone: boolean;
  todaySr: number;
  onToggle: () => void;
  onDelete: () => Promise<void>;
  onFail: () => Promise<void>;
  onExtend?: (newDate: string) => Promise<void>;
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
  todaySr,
  onToggle,
  onDelete,
  onFail,
  onExtend,
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
  const isPastTodo = !isSchedule && ev.s < todaySr;
  // 지난 미완료(진행 중·포기) 할일은 토큰을 써서 오늘 이후로 연장할 수 있다.
  const canExtend = !!onExtend && canExtendTodo(ev, todaySr);
  // 일정(schedule)만 수정 가능. 할일(TODO)은 항상 수정 불가.
  const canEdit = isSchedule;
  // 휴지통 버튼 동작:
  //   일정 → 삭제 / 완료·지난 할일 → 없음(포기·삭제 불가) / 오늘 할일 → 포기 / 다음날 할일 → 삭제
  const action: "fail" | "delete" | null = isSchedule
    ? "delete"
    : isDone || isPastTodo
      ? null
      : ev.s === todaySr
        ? "fail"
        : "delete";
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

  const handleFail = async () => {
    setDeleteError("");
    try {
      await onFail();
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
                <svg
                  aria-hidden="true"
                  width="15"
                  height="15"
                  viewBox="0 0 14 14"
                  fill="none"
                  stroke="var(--ink-3)"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                >
                  <path d="M3.5 3.5l7 7M10.5 3.5l-7 7" />
                </svg>
              </span>
            ) : (
              <Check on={isDone} onClick={onToggle} disabled={isPastTodo} />
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
        {(canExtend || (!isFailed && (canEdit || action))) && (
          <div className="eventRowActions">
            {!isFailed && canEdit && (
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
            {!isFailed && action && (
              <DeleteConfirmDialog
                trigger={
                  <button
                    type="button"
                    className={action === "fail" ? "eventRowFailButton" : "calIconBtn calBtn-icon"}
                    aria-label={action === "fail" ? "포기" : "삭제"}
                  >
                    {action === "fail" ? "포기" : trashIcon}
                  </button>
                }
                title={
                  action === "fail"
                    ? "포기할까요?"
                    : isSchedule
                      ? "일정을 삭제할까요?"
                      : "할일을 삭제할까요?"
                }
                description={
                  action === "fail"
                    ? "정말로 포기할까요? 포기 기록은 남아요."
                    : "삭제하면 되돌릴 수 없어요."
                }
                confirmLabel={action === "fail" ? "포기하기" : undefined}
                onConfirm={() => void (action === "fail" ? handleFail() : handleDelete())}
              />
            )}
            {canExtend && onExtend && (
              <ExtendTodoDialog
                tokenCost={EXTEND_TOKEN_COST}
                onConfirm={onExtend}
                trigger={
                  <button type="button" className="eventRowExtendButton" aria-label="연장">
                    연장
                  </button>
                }
              />
            )}
          </div>
        )}
      </motion.div>
      {deleteError && <p className="eventRowError">{deleteError}</p>}
    </>
  );
}
