import { useState } from "react";
import type { TagItem } from "../../tags/types.js";
import { TagChip } from "./TagChip.js";
import { TagEditorForm } from "./TagEditorForm.js";
import "./TagPicker.css";

const DEFAULT_COLOR = "#8478C0";

type Props = {
  tags: TagItem[];
  // 단일 선택. 선택된 태그를 다시 누르면 해제(null).
  selectedId: number | null;
  onSelect: (id: number | null) => void;
  // 생성은 즉시 저장 후 새 id를 돌려준다. 성공 시 그 태그를 선택한다.
  onCreateTag: (name: string, color: string) => Promise<number | null>;
  onEditTag: (id: number, content: string, color: string) => Promise<void>;
  onDeleteTag: (id: number) => Promise<void>;
};

export function TagPicker({
  tags,
  selectedId,
  onSelect,
  onCreateTag,
  onEditTag,
  onDeleteTag,
}: Props) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState(DEFAULT_COLOR);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(DEFAULT_COLOR);

  const startEdit = (t: TagItem) => {
    setCreating(false);
    setEditingId(t.id);
    setEditName(t.content);
    setEditColor(t.color);
  };

  const startCreate = () => {
    setEditingId(null);
    setNewName("");
    setNewColor(DEFAULT_COLOR);
    setCreating(true);
  };

  const confirmEdit = () => {
    if (editingId === null) return;
    const id = editingId;
    setEditingId(null);
    void onEditTag(id, editName.trim() || "태그", editColor);
  };

  const confirmCreate = async () => {
    const id = await onCreateTag(newName.trim() || "태그", newColor);
    setCreating(false);
    setNewName("");
    if (id !== null) onSelect(id);
  };

  return (
    <div className="tagPicker">
      <div className="tagPickerRow">
        {tags.map((t) => (
          <TagChip
            key={t.id}
            tag={t}
            selected={selectedId === t.id}
            onSelect={() => onSelect(selectedId === t.id ? null : t.id)}
            onEdit={() => startEdit(t)}
            onDelete={() => void onDeleteTag(t.id)}
          />
        ))}
        <button
          type="button"
          className={`tagPickerNew${creating ? " isSel" : ""}`}
          onClick={startCreate}
        >
          ＋ 새 태그
        </button>
      </div>

      {editingId !== null && (
        <TagEditorForm
          name={editName}
          color={editColor}
          onNameChange={setEditName}
          onColorChange={setEditColor}
          onCancel={() => setEditingId(null)}
          onConfirm={confirmEdit}
          confirmLabel="저장"
        />
      )}
      {creating && (
        <TagEditorForm
          name={newName}
          color={newColor}
          onNameChange={setNewName}
          onColorChange={setNewColor}
          onCancel={() => setCreating(false)}
          onConfirm={() => void confirmCreate()}
          confirmLabel="추가"
        />
      )}
    </div>
  );
}
