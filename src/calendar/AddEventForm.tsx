import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";
import { DateRangePicker } from "./DateRangePicker.js";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog.js";
import { SingleDatePicker } from "./SingleDatePicker.js";
import { TagEditorForm } from "./TagEditorForm.js";
import type { TagItem } from "./types.js";

type AddEventFormProps = {
  initialDate: string;
  tags: TagItem[];
  onSubmit: (
    title: string,
    tagId: number | null,
    newTag: { name: string; color: string } | null,
    startStr: string,
    endStr: string,
    type: "todo" | "schedule",
    description: string,
  ) => Promise<void>;
  onDeleteTag: (id: number) => Promise<void>;
  onEditTag: (id: number, content: string, color: string) => Promise<void>;
  onClose: () => void;
};

const RADIO_COLORS = {
  todo: { border: "var(--c-health)", bg: "var(--c-health-bg)", fg: "var(--c-health)" },
  schedule: { border: "var(--c-grow)", bg: "var(--c-grow-bg)", fg: "var(--c-grow)" },
} as const;

const radioBtn = (active: boolean, kind: "todo" | "schedule"): CSSProperties => {
  const c = RADIO_COLORS[kind];
  return {
    flex: 1,
    padding: "8px 0",
    borderRadius: "var(--r-sm)",
    cursor: "pointer",
    border: active ? `2px solid ${c.border}` : "2px solid var(--line-soft)",
    background: active ? c.bg : "var(--cream-1)",
    color: active ? c.fg : "var(--ink-3)",
    fontFamily: "var(--font-display)",
    fontSize: 13,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    transition: "border-color .14s, background .14s, color .14s",
  };
};

export function AddEventForm({
  initialDate,
  tags,
  onSubmit,
  onDeleteTag,
  onEditTag,
  onClose,
}: AddEventFormProps) {
  const [type, setType] = useState<"todo" | "schedule">("todo");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedTagId, setSelectedTagId] = useState<number | null>(tags[0]?.id ?? null);
  const [isCreatingTag, setIsCreatingTag] = useState(tags.length === 0);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("#8478C0");
  const [editingTagId, setEditingTagId] = useState<number | null>(null);
  const [editTagName, setEditTagName] = useState("");
  const [editTagColor, setEditTagColor] = useState("#8478C0");
  const [start, setStart] = useState(initialDate);
  const [end, setEnd] = useState(initialDate);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const submit = async () => {
    if (!title.trim() || saving) return;
    setSaving(true);
    setSaveError("");
    try {
      const tagId = isCreatingTag ? null : selectedTagId;
      const newTag = isCreatingTag
        ? { name: newTagName.trim() || "태그", color: newTagColor }
        : null;
      const endStr = type === "schedule" ? end : start;
      await onSubmit(title.trim(), tagId, newTag, start, endStr, type, description.trim());
      setTitle("");
      setDescription("");
      setIsCreatingTag(false);
      setNewTagName("");
      inputRef.current?.focus();
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "일정 추가에 실패했어요.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        background: "var(--cream-0)",
        border: "2px solid var(--line)",
        borderRadius: "var(--r-lg)",
        padding: "14px",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      {/* 타입 선택 */}
      <div style={{ display: "flex", gap: 8 }}>
        <button
          type="button"
          onClick={() => setType("todo")}
          style={radioBtn(type === "todo", "todo")}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="1.5" y="1.5" width="11" height="11" rx="3" />
            <path d="M4 7l2 2.5 4-4" />
          </svg>
          할일
        </button>
        <button
          type="button"
          onClick={() => setType("schedule")}
          style={radioBtn(type === "schedule", "schedule")}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <rect x="1" y="2.5" width="12" height="10.5" rx="2.5" />
            <path d="M1 6h12" />
            <path d="M4.5 1v3M9.5 1v3" />
            <circle cx="4.5" cy="9.5" r="0.9" fill="currentColor" stroke="none" />
            <circle cx="7" cy="9.5" r="0.9" fill="currentColor" stroke="none" />
            <circle cx="9.5" cy="9.5" r="0.9" fill="currentColor" stroke="none" />
          </svg>
          일정
        </button>
      </div>

      {/* 제목 */}
      <div style={{ position: "relative" }}>
        <input
          ref={inputRef}
          value={title}
          onChange={(e) => setTitle(e.target.value.slice(0, 20))}
          maxLength={20}
          onKeyDown={(e) => {
            if (e.key === "Enter") void submit();
            if (e.key === "Escape") onClose();
          }}
          aria-label="제목"
          placeholder="무엇을 할까요?"
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: "11px 44px 11px 14px",
            borderRadius: "var(--r-md)",
            border: "2px solid var(--line-soft)",
            background: "var(--cream-1)",
            color: "var(--ink-1)",
            fontFamily: "var(--font-display)",
            fontSize: 17,
            outline: "none",
          }}
        />
        <span
          style={{
            position: "absolute",
            right: 12,
            top: "50%",
            transform: "translateY(-50%)",
            fontFamily: "var(--font-body)",
            fontSize: 11,
            color: title.length >= 20 ? "var(--sun)" : "var(--ink-3)",
            pointerEvents: "none",
          }}
        >
          {title.length}/20
        </span>
      </div>

      {/* 설명 (일정만) */}
      {type === "schedule" && (
        <div style={{ position: "relative" }}>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value.slice(0, 200))}
            maxLength={200}
            aria-label="설명"
            placeholder="설명 (선택)"
            rows={3}
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "9px 14px",
              borderRadius: "var(--r-md)",
              border: "2px solid var(--line-soft)",
              background: "var(--cream-1)",
              color: "var(--ink-1)",
              fontFamily: "var(--font-body)",
              fontSize: 14,
              outline: "none",
              resize: "none",
              lineHeight: 1.5,
            }}
          />
          <span
            style={{
              position: "absolute",
              right: 12,
              bottom: 8,
              fontFamily: "var(--font-body)",
              fontSize: 11,
              color: description.length >= 200 ? "var(--sun)" : "var(--ink-3)",
              pointerEvents: "none",
            }}
          >
            {description.length}/200
          </span>
        </div>
      )}

      {/* 태그 */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
        {tags.map((t) => {
          const isSel = !isCreatingTag && selectedTagId === t.id;
          const fg = isSel ? t.color : "var(--ink-3)";
          return (
            <div
              key={t.id}
              className="calTagGroup"
              style={{
                display: "inline-flex",
                alignItems: "center",
                border: isSel ? `2px solid ${t.color}` : "2px solid var(--line-soft)",
                borderRadius: 999,
                background: isSel ? `${t.color}22` : "var(--cream-0)",
                overflow: "hidden",
                transition: "border-color .14s, background .14s",
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setSelectedTagId(t.id);
                  setIsCreatingTag(false);
                  setEditingTagId(null);
                }}
                style={{
                  padding: "6px 10px 6px 12px",
                  border: "none",
                  background: "transparent",
                  color: fg,
                  cursor: "pointer",
                  fontFamily: "var(--font-display)",
                  fontSize: 13,
                  lineHeight: 1,
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  whiteSpace: "nowrap",
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: t.color,
                    flexShrink: 0,
                  }}
                />
                {t.content}
              </button>
              <div style={{ display: "flex", alignItems: "center", paddingRight: 7 }}>
                <button
                  type="button"
                  aria-label="태그 수정"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingTagId(t.id);
                    setEditTagName(t.content);
                    setEditTagColor(t.color);
                    setIsCreatingTag(false);
                  }}
                  style={{
                    padding: "3px 1px",
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    color: fg,
                    lineHeight: 1,
                    borderRadius: 3,
                    opacity: 0.7,
                    transition: "opacity .12s",
                    display: "flex",
                    alignItems: "center",
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
                      aria-label="태그 삭제"
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        padding: "3px 5px 3px 1px",
                        border: "none",
                        background: "transparent",
                        cursor: "pointer",
                        color: fg,
                        fontSize: 14,
                        lineHeight: 1,
                        borderRadius: 3,
                        opacity: 0.55,
                        transition: "opacity .12s",
                        display: "flex",
                        alignItems: "center",
                      }}
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
                  onConfirm={() => void onDeleteTag(t.id)}
                />
              </div>
            </div>
          );
        })}
        <button
          type="button"
          className="calBtn-tag"
          onClick={() => {
            setIsCreatingTag(true);
            setSelectedTagId(null);
            setEditingTagId(null);
          }}
          style={{
            padding: "6px 12px",
            borderRadius: 999,
            cursor: "pointer",
            fontFamily: "var(--font-display)",
            fontSize: 13,
            lineHeight: 1,
            whiteSpace: "nowrap",
            border: isCreatingTag ? "2px solid var(--accent)" : "2px dashed var(--line-soft)",
            background: isCreatingTag ? "var(--accent-tint)" : "var(--cream-0)",
            color: isCreatingTag ? "var(--accent-deep)" : "var(--ink-3)",
            transition: "all .14s",
          }}
        >
          ＋ 새 태그
        </button>
      </div>

      {editingTagId !== null && (
        <TagEditorForm
          name={editTagName}
          color={editTagColor}
          onNameChange={setEditTagName}
          onColorChange={setEditTagColor}
          onCancel={() => setEditingTagId(null)}
          onConfirm={() => {
            const id = editingTagId;
            setEditingTagId(null);
            void onEditTag(id, editTagName.trim() || "태그", editTagColor);
          }}
          confirmLabel="저장"
        />
      )}

      {isCreatingTag && (
        <TagEditorForm
          name={newTagName}
          color={newTagColor}
          onNameChange={setNewTagName}
          onColorChange={setNewTagColor}
        />
      )}

      {/* 날짜: 할일은 단일 날짜 선택, 일정은 기간 선택 */}
      {type === "schedule" ? (
        <DateRangePicker start={start} end={end} onStart={setStart} onEnd={setEnd} />
      ) : (
        <SingleDatePicker value={start} onChange={setStart} />
      )}

      {saveError && (
        <p
          style={{
            margin: "0 0 4px",
            padding: "9px 12px",
            borderRadius: "var(--r-sm)",
            background: "#fee2e2",
            color: "#b91c1c",
            fontFamily: "var(--font-body)",
            fontSize: 13,
          }}
        >
          {saveError}
        </p>
      )}

      <div style={{ display: "flex", gap: 9 }}>
        <button
          type="button"
          className="calBtn-cancel"
          onClick={onClose}
          style={{
            flex: 1,
            padding: "12px",
            borderRadius: "var(--r-md)",
            cursor: "pointer",
            border: "2px solid var(--line)",
            background: "var(--cream-1)",
            color: "var(--ink-2)",
            fontFamily: "var(--font-display)",
            fontSize: 15,
          }}
        >
          닫기
        </button>
        <button
          type="button"
          className="calBtn-submit"
          onClick={() => void submit()}
          disabled={!title.trim() || saving}
          style={{
            flex: 2,
            padding: "12px",
            borderRadius: "var(--r-md)",
            cursor: title.trim() && !saving ? "pointer" : "default",
            border: "none",
            background: title.trim() ? "var(--accent)" : "var(--accent-soft)",
            color: title.trim() ? "#fff" : "var(--ink-3)",
            boxShadow: title.trim() ? "inset 0 -3px 0 rgba(0,0,0,.13)" : "none",
            fontFamily: "var(--font-display)",
            fontSize: 15,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            whiteSpace: "nowrap",
          }}
        >
          {saving ? (
            <>
              <span className="calSpinner" /> 추가 중...
            </>
          ) : (
            "추가하기"
          )}
        </button>
      </div>
    </div>
  );
}
