import { motion } from "motion/react";
import { useId, useState } from "react";
import type { TagItem } from "../../shared/tags/types.js";
import { TagPicker } from "../../shared/ui/tags/TagPicker.js";
import type { CalEvent } from "./calEngine.js";
import { serialToYMDStr } from "./calEngine.js";
import { DateRangePicker } from "./DateRangePicker.js";
import { SingleDatePicker } from "./SingleDatePicker.js";
import {
  CALENDAR_DESCRIPTION_LIMIT_MESSAGE,
  CALENDAR_DESCRIPTION_MAX_LENGTH,
  CALENDAR_TITLE_LIMIT_MESSAGE,
  CALENDAR_TITLE_MAX_LENGTH,
} from "./textLimits.js";
import "./EventEditForm.css";

const staggerItem = {
  hidden: { opacity: 0, y: 6 },
  show: { opacity: 1, y: 0, transition: { duration: 0.16 } },
};

type Props = {
  ev: CalEvent;
  tags: TagItem[];
  onSave: (
    title: string,
    tagId: number | null,
    startStr: string,
    endStr: string,
    description: string,
  ) => Promise<void>;
  onCreateTag: (name: string, color: string) => Promise<number | null>;
  onDeleteTag: (id: number) => Promise<void>;
  onEditTag: (id: number, content: string, color: string) => Promise<void>;
  onClose: () => void;
};

export function EventEditForm({
  ev,
  tags,
  onSave,
  onCreateTag,
  onDeleteTag,
  onEditTag,
  onClose,
}: Props) {
  const isSchedule = !!ev.scheduleId;
  const matchedTag =
    ev.tagId != null
      ? (tags.find((t) => t.id === ev.tagId)?.id ?? null)
      : (tags.find((t) => t.color === ev.color)?.id ?? null);

  const [title, setTitle] = useState(ev.title);
  const [description, setDescription] = useState(ev.description ?? "");
  const [start, setStart] = useState(serialToYMDStr(ev.s));
  const [end, setEnd] = useState(serialToYMDStr(ev.e));
  const [tagId, setTagId] = useState<number | null>(matchedTag);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const titleLimitId = useId();
  const descriptionLimitId = useId();

  const isTitleLimitReached = title.length >= CALENDAR_TITLE_MAX_LENGTH;
  const isDescriptionLimitReached = description.length >= CALENDAR_DESCRIPTION_MAX_LENGTH;
  const canSave =
    !!title.trim() &&
    title.length <= CALENDAR_TITLE_MAX_LENGTH &&
    description.length <= CALENDAR_DESCRIPTION_MAX_LENGTH &&
    !saving;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    setSaveError("");
    try {
      await onSave(title.trim(), tagId, start, isSchedule ? end : start, description.trim());
      onClose();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "수정에 실패했어요.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div variants={staggerItem} className="eventEditForm">
      <div className="eefField">
        <div className="eefControlWrap">
          <input
            className="eefInput"
            value={title}
            onChange={(e) => setTitle(e.target.value.slice(0, CALENDAR_TITLE_MAX_LENGTH))}
            onKeyDown={(e) => {
              if (e.key === "Enter") void handleSave();
              if (e.key === "Escape") {
                // 모달을 닫지 말고 수정 폼만 접는다.
                e.stopPropagation();
                onClose();
              }
            }}
            maxLength={CALENDAR_TITLE_MAX_LENGTH}
            placeholder="제목"
            aria-describedby={isTitleLimitReached ? titleLimitId : undefined}
            aria-invalid={title.length > CALENDAR_TITLE_MAX_LENGTH}
          />
          <span className={`eefCounter title${isTitleLimitReached ? " warn" : ""}`}>
            {title.length}/{CALENDAR_TITLE_MAX_LENGTH}
          </span>
        </div>
        {isTitleLimitReached && (
          <p id={titleLimitId} className="eefLimitMessage" role="alert">
            {CALENDAR_TITLE_LIMIT_MESSAGE}
          </p>
        )}
      </div>

      {isSchedule && (
        <div className="eefField">
          <div className="eefControlWrap">
            <textarea
              className="eefTextarea"
              value={description}
              onChange={(e) =>
                setDescription(e.target.value.slice(0, CALENDAR_DESCRIPTION_MAX_LENGTH))
              }
              maxLength={CALENDAR_DESCRIPTION_MAX_LENGTH}
              placeholder="설명 (선택)"
              rows={3}
              aria-describedby={isDescriptionLimitReached ? descriptionLimitId : undefined}
              aria-invalid={description.length > CALENDAR_DESCRIPTION_MAX_LENGTH}
            />
            <span className={`eefCounter desc${isDescriptionLimitReached ? " warn" : ""}`}>
              {description.length}/{CALENDAR_DESCRIPTION_MAX_LENGTH}
            </span>
          </div>
          {isDescriptionLimitReached && (
            <p id={descriptionLimitId} className="eefLimitMessage" role="alert">
              {CALENDAR_DESCRIPTION_LIMIT_MESSAGE}
            </p>
          )}
        </div>
      )}

      {isSchedule ? (
        <DateRangePicker start={start} end={end} onStart={setStart} onEnd={setEnd} />
      ) : (
        <SingleDatePicker value={start} onChange={setStart} />
      )}

      <TagPicker
        tags={tags}
        selectedId={tagId}
        onSelect={setTagId}
        onCreateTag={onCreateTag}
        onEditTag={onEditTag}
        onDeleteTag={onDeleteTag}
      />

      {saveError && <p className="eefError">{saveError}</p>}

      <div className="eefActions">
        <button type="button" className="eefCancel" onClick={onClose}>
          취소
        </button>
        <button
          type="button"
          className="eefSave"
          onClick={() => void handleSave()}
          disabled={!canSave}
          style={{
            cursor: canSave ? "pointer" : "default",
            background: title.trim() ? "var(--accent)" : "var(--accent-soft)",
            color: title.trim() ? "#fff" : "var(--ink-3)",
            boxShadow: title.trim() ? "inset 0 -2px 0 rgba(0,0,0,.13)" : "none",
          }}
        >
          {saving ? "저장 중..." : "저장"}
        </button>
      </div>
    </motion.div>
  );
}
