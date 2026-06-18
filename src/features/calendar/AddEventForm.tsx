import { useEffect, useRef, useState } from "react";
import type { TagItem } from "../../shared/tags/types.js";
import { TagPicker } from "../../shared/ui/tags/TagPicker.js";
import { toYMDStr } from "./calEngine.js";
import { DateRangePicker } from "./DateRangePicker.js";
import { SingleDatePicker } from "./SingleDatePicker.js";
import "./AddEventForm.css";

type Props = {
  ymd: { y: number; m: number; d: number };
  tags: TagItem[];
  onAddEvent: (
    kind: "todo" | "schedule",
    title: string,
    tagId: number | null,
    startStr: string,
    endStr: string,
    description: string,
  ) => Promise<void>;
  onCreateTag: (name: string, color: string) => Promise<number | null>;
  onDeleteTag: (id: number) => Promise<void>;
  onEditTag: (id: number, content: string, color: string) => Promise<void>;
  onCancel: () => void;
};

const KIND_OPTIONS = [
  { value: "todo", label: "할일" },
  { value: "schedule", label: "일정" },
] as const;

export function AddEventForm({
  ymd,
  tags,
  onAddEvent,
  onCreateTag,
  onDeleteTag,
  onEditTag,
  onCancel,
}: Props) {
  const initialDate = toYMDStr(ymd.y, ymd.m, ymd.d);
  const [kind, setKind] = useState<"todo" | "schedule">("todo");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedTagId, setSelectedTagId] = useState<number | null>(tags[0]?.id ?? null);
  const [start, setStart] = useState(initialDate);
  const [end, setEnd] = useState(initialDate);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const canSubmit = !!title.trim() && !saving;

  const submit = async () => {
    if (!canSubmit) return;
    setSaving(true);
    setSaveError("");
    try {
      await onAddEvent(
        kind,
        title.trim(),
        selectedTagId,
        start,
        kind === "schedule" ? end : start,
        description.trim(),
      );
      setTitle("");
      setDescription("");
      inputRef.current?.focus();
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "일정 추가에 실패했어요.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="addEventForm">
      <fieldset className="aefKindSet">
        <legend className="aefLegend">유형 선택</legend>
        {KIND_OPTIONS.map((opt) => {
          const isSel = kind === opt.value;
          return (
            <label key={opt.value} className={`aefKind${isSel ? " isSel" : ""}`}>
              <input
                className="aefRadioInput"
                type="radio"
                name="day-add-kind"
                value={opt.value}
                checked={isSel}
                onChange={() => setKind(opt.value)}
              />
              {opt.label}
            </label>
          );
        })}
      </fieldset>

      <input
        ref={inputRef}
        className="aefInput"
        value={title}
        onChange={(e) => setTitle(e.target.value.slice(0, 20))}
        onKeyDown={(e) => {
          if (e.key === "Enter") void submit();
          if (e.key === "Escape") {
            // 모달을 닫지 말고 추가 폼만 접는다.
            e.stopPropagation();
            onCancel();
          }
        }}
        maxLength={20}
        placeholder="무엇을 할까요?"
      />

      {kind === "schedule" && (
        <textarea
          className="aefTextarea"
          value={description}
          onChange={(e) => setDescription(e.target.value.slice(0, 200))}
          maxLength={200}
          placeholder="설명 (선택)"
          rows={3}
        />
      )}

      <TagPicker
        tags={tags}
        selectedId={selectedTagId}
        onSelect={setSelectedTagId}
        onCreateTag={onCreateTag}
        onEditTag={onEditTag}
        onDeleteTag={onDeleteTag}
      />

      {kind === "schedule" ? (
        <DateRangePicker start={start} end={end} onStart={setStart} onEnd={setEnd} />
      ) : (
        <SingleDatePicker value={start} onChange={setStart} />
      )}

      {saveError && <p className="aefError">{saveError}</p>}

      <div className="aefActions">
        <button type="button" className="calBtn-cancel aefCancel" onClick={onCancel}>
          닫기
        </button>
        <button
          type="button"
          className="calBtn-submit aefSubmit"
          onClick={() => void submit()}
          disabled={!canSubmit}
          style={{
            cursor: canSubmit ? "pointer" : "default",
            background: title.trim() ? "var(--accent)" : "var(--accent-soft)",
            color: title.trim() ? "#fff" : "var(--ink-3)",
            boxShadow: title.trim() ? "inset 0 -3px 0 rgba(0,0,0,.13)" : "none",
          }}
        >
          {saving ? "추가 중..." : "추가하기"}
        </button>
      </div>
    </div>
  );
}
