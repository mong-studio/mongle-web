import { motion } from "motion/react";
import { useState } from "react";
import { Tag } from "../../shared/ui/Tag/index.js";
import { Check } from "./CalendarCore.js";
import type { CalEvent } from "./calEngine.js";
import { serialToMD, serialToYMDStr } from "./calEngine.js";
import { DateRangePicker } from "./DateRangePicker.js";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog.js";
import { SingleDatePicker } from "./SingleDatePicker.js";
import type { TagItem } from "./types.js";

type Props = {
  ev: CalEvent;
  isDone: boolean;
  onToggle: () => void;
  onDelete: () => Promise<void>;
  onEdit: (
    title: string,
    tagId: number | null,
    startStr: string,
    endStr: string,
    description: string,
  ) => Promise<void>;
  tags: TagItem[];
};

const staggerItem = {
  hidden: { opacity: 0, y: 6 },
  show: { opacity: 1, y: 0, transition: { duration: 0.16 } },
};

export function EventRow({ ev, isDone, onToggle, onDelete, onEdit, tags }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStart, setEditStart] = useState("");
  const [editEnd, setEditEnd] = useState("");
  const [editTagId, setEditTagId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState("");

  const isSchedule = !!ev.scheduleId;
  const { m: sm, d: sd } = serialToMD(ev.s);
  const { m: em, d: ed } = serialToMD(ev.e);

  const openEdit = () => {
    setEditTitle(ev.title);
    setEditDescription(ev.description ?? "");
    setEditStart(serialToYMDStr(ev.s));
    setEditEnd(serialToYMDStr(ev.e));
    const matched =
      ev.tagId != null
        ? (tags.find((t) => t.id === ev.tagId)?.id ?? null)
        : (tags.find((t) => t.color === ev.color)?.id ?? null);
    setEditTagId(matched);
    setSaveError("");
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!editTitle.trim() || saving) return;
    setSaving(true);
    setSaveError("");
    try {
      await onEdit(
        editTitle.trim(),
        editTagId,
        editStart,
        isSchedule ? editEnd : editStart,
        editDescription.trim(),
      );
      setIsEditing(false);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "수정에 실패했어요.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleteError("");
    try {
      await onDelete();
    } catch {
      setDeleteError("삭제에 실패했어요.");
    }
  };

  if (isEditing) {
    return (
      <motion.div
        variants={staggerItem}
        style={{
          background: "var(--cream-0)",
          border: "2px solid var(--accent)",
          borderRadius: "var(--r-md)",
          padding: "12px 14px",
          display: "flex",
          flexDirection: "column",
          gap: 10,
          boxShadow: "var(--sh-card)",
        }}
      >
        {/* 제목 */}
        <div style={{ position: "relative" }}>
          <input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value.slice(0, 20))}
            maxLength={20}
            placeholder="제목"
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "9px 44px 9px 12px",
              borderRadius: "var(--r-sm)",
              border: "2px solid var(--line-soft)",
              background: "var(--cream-1)",
              color: "var(--ink-1)",
              fontFamily: "var(--font-display)",
              fontSize: 15,
              outline: "none",
            }}
          />
          <span
            style={{
              position: "absolute",
              right: 10,
              top: "50%",
              transform: "translateY(-50%)",
              fontFamily: "var(--font-body)",
              fontSize: 11,
              color: editTitle.length >= 20 ? "var(--sun)" : "var(--ink-3)",
              pointerEvents: "none",
            }}
          >
            {editTitle.length}/20
          </span>
        </div>

        {/* 설명 (일정만) */}
        {isSchedule && (
          <div style={{ position: "relative" }}>
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value.slice(0, 200))}
              maxLength={200}
              placeholder="설명 (선택)"
              rows={3}
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "9px 12px",
                borderRadius: "var(--r-sm)",
                border: "2px solid var(--line-soft)",
                background: "var(--cream-1)",
                color: "var(--ink-1)",
                fontFamily: "var(--font-body)",
                fontSize: 13,
                outline: "none",
                resize: "none",
                lineHeight: 1.5,
              }}
            />
            <span
              style={{
                position: "absolute",
                right: 10,
                bottom: 8,
                fontFamily: "var(--font-body)",
                fontSize: 11,
                color: editDescription.length >= 200 ? "var(--sun)" : "var(--ink-3)",
                pointerEvents: "none",
              }}
            >
              {editDescription.length}/200
            </span>
          </div>
        )}

        {/* 날짜 */}
        {isSchedule ? (
          <DateRangePicker
            start={editStart}
            end={editEnd}
            onStart={setEditStart}
            onEnd={setEditEnd}
          />
        ) : (
          <SingleDatePicker value={editStart} onChange={setEditStart} />
        )}

        {/* 태그 선택 */}
        {tags.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {tags.map((t) => {
              const isSel = editTagId === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setEditTagId(isSel ? null : t.id)}
                  style={{
                    padding: "5px 10px",
                    borderRadius: 999,
                    cursor: "pointer",
                    fontFamily: "var(--font-display)",
                    fontSize: 12,
                    border: isSel ? `2px solid ${t.color}` : "2px solid var(--line-soft)",
                    background: isSel ? `${t.color}22` : "var(--cream-0)",
                    color: isSel ? t.color : "var(--ink-3)",
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    transition: "all .12s",
                  }}
                >
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      background: t.color,
                      flexShrink: 0,
                    }}
                  />
                  {t.content}
                </button>
              );
            })}
          </div>
        )}

        {saveError && (
          <p
            style={{
              margin: 0,
              padding: "7px 10px",
              borderRadius: "var(--r-sm)",
              background: "#fee2e2",
              color: "#b91c1c",
              fontFamily: "var(--font-body)",
              fontSize: 12,
            }}
          >
            {saveError}
          </p>
        )}

        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            style={{
              flex: 1,
              padding: "10px",
              borderRadius: "var(--r-sm)",
              cursor: "pointer",
              border: "2px solid var(--line)",
              background: "var(--cream-1)",
              color: "var(--ink-2)",
              fontFamily: "var(--font-display)",
              fontSize: 13,
            }}
          >
            취소
          </button>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={!editTitle.trim() || saving}
            style={{
              flex: 2,
              padding: "10px",
              borderRadius: "var(--r-sm)",
              cursor: editTitle.trim() && !saving ? "pointer" : "default",
              border: "none",
              background: editTitle.trim() ? "var(--accent)" : "var(--accent-soft)",
              color: editTitle.trim() ? "#fff" : "var(--ink-3)",
              fontFamily: "var(--font-display)",
              fontSize: 13,
              boxShadow: editTitle.trim() ? "inset 0 -2px 0 rgba(0,0,0,.13)" : "none",
            }}
          >
            {saving ? "저장 중..." : "저장"}
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <>
      <motion.div
        variants={staggerItem}
        whileHover={{ x: 1 }}
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 10,
          padding: "12px 14px",
          background: "var(--cream-0)",
          borderRadius: "var(--r-md)",
          border: "1.5px solid var(--line-soft)",
          boxShadow: "var(--sh-card)",
        }}
      >
        <div style={{ paddingTop: 2 }}>
          <Check on={isDone} onClick={onToggle} />
        </div>
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            flexShrink: 0,
            background: ev.color,
            marginTop: 6,
          }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 17,
              color: isDone ? "var(--ink-3)" : "var(--ink-1)",
              textDecoration: isDone ? "line-through" : "none",
              lineHeight: 1.2,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {ev.title}
          </div>
          {ev.description && (
            <div
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 12,
                color: "var(--ink-3)",
                marginTop: 3,
                lineHeight: 1.4,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical" as const,
                overflow: "hidden",
              }}
            >
              {ev.description}
            </div>
          )}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginTop: 5,
              flexWrap: "wrap",
            }}
          >
            {ev.s !== ev.e && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 3,
                  padding: "2px 7px",
                  borderRadius: 999,
                  background: "var(--cream-2)",
                  color: "var(--ink-2)",
                  fontFamily: "var(--font-display)",
                  fontSize: 11,
                  whiteSpace: "nowrap",
                }}
              >
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
            <Tag color={ev.color} bg={ev.bg} label={ev.tagLabel} />
          </div>
        </div>
        <div style={{ display: "flex", gap: 5, flexShrink: 0, paddingTop: 1 }}>
          <button
            type="button"
            onClick={openEdit}
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
          <DeleteConfirmDialog
            trigger={
              <button type="button" className="calIconBtn calBtn-icon" aria-label="삭제">
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
              </button>
            }
            title={isSchedule ? "일정을 삭제할까요?" : "할일을 삭제할까요?"}
            description="삭제하면 되돌릴 수 없어요."
            onConfirm={() => void handleDelete()}
          />
        </div>
      </motion.div>
      {deleteError && (
        <p
          style={{
            margin: "2px 0 0",
            padding: "6px 10px",
            borderRadius: "var(--r-sm)",
            background: "#fee2e2",
            color: "#b91c1c",
            fontFamily: "var(--font-body)",
            fontSize: 12,
          }}
        >
          {deleteError}
        </p>
      )}
    </>
  );
}
