export const TAG_COLORS = [
  "#8478C0",
  "#62A256",
  "#5790C4",
  "#CF7E97",
  "#D9943C",
  "#E06060",
  "#40A080",
  "#A07848",
  "#7C7C9C",
  "#5AA4A0",
];

const TAG_NAME_MAX_LENGTH = 10;

type TagEditorFormProps = {
  name: string;
  color: string;
  onNameChange: (v: string) => void;
  onColorChange: (v: string) => void;
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmLabel?: string;
};

export function TagEditorForm({
  name,
  color,
  onNameChange,
  onColorChange,
  onConfirm,
  onCancel,
  confirmLabel = "저장",
}: TagEditorFormProps) {
  const nameLength = name.length;
  const isNameAtLimit = nameLength >= TAG_NAME_MAX_LENGTH;

  return (
    <div
      style={{
        padding: "11px 12px",
        background: "var(--cream-1)",
        borderRadius: "var(--r-md)",
        border: "1.5px solid var(--line-soft)",
        display: "flex",
        flexDirection: "column",
        gap: 9,
      }}
    >
      <div>
        <input
          value={name}
          onChange={(e) => onNameChange(e.target.value.slice(0, TAG_NAME_MAX_LENGTH))}
          maxLength={TAG_NAME_MAX_LENGTH}
          placeholder={`태그 이름 (최대 ${TAG_NAME_MAX_LENGTH}자)`}
          aria-describedby="tagNameLimitMeta"
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: "8px 11px",
            borderRadius: "var(--r-md)",
            border: isNameAtLimit ? "2px solid var(--accent)" : "2px solid var(--line-soft)",
            background: "var(--cream-0)",
            color: "var(--ink-1)",
            fontFamily: "var(--font-display)",
            fontSize: 15,
            outline: "none",
          }}
        />
        <div
          id="tagNameLimitMeta"
          aria-live="polite"
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 8,
            minHeight: 15,
            marginTop: 5,
            fontFamily: "var(--font-display)",
            fontSize: 12,
            lineHeight: 1,
          }}
        >
          <span style={{ color: "var(--accent)" }}>
            {isNameAtLimit ? `최대 ${TAG_NAME_MAX_LENGTH}자까지 입력 가능해요.` : ""}
          </span>
          <span style={{ color: isNameAtLimit ? "var(--accent)" : "var(--ink-3)" }}>
            {nameLength}/{TAG_NAME_MAX_LENGTH}
          </span>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        {TAG_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            aria-label={`색상 선택 ${c}`}
            onClick={() => onColorChange(c)}
            style={{
              width: 24,
              height: 24,
              borderRadius: "50%",
              background: c,
              border: color === c ? "3px solid var(--ink-1)" : "2px solid transparent",
              outline: color === c ? `2px solid ${c}` : "none",
              outlineOffset: 2,
              cursor: "pointer",
              padding: 0,
              flexShrink: 0,
            }}
          />
        ))}
        <label
          title="직접 색상 선택"
          style={{
            position: "relative",
            width: 24,
            height: 24,
            borderRadius: "50%",
            overflow: "hidden",
            flexShrink: 0,
            cursor: "pointer",
            border: "2px solid var(--line-soft)",
          }}
        >
          <input
            type="color"
            value={color}
            onChange={(e) => onColorChange(e.target.value)}
            style={{ position: "absolute", opacity: 0, inset: 0, cursor: "pointer", padding: 0 }}
          />
          <div
            style={{
              width: "100%",
              height: "100%",
              background: "conic-gradient(red,yellow,lime,cyan,blue,magenta,red)",
            }}
          />
        </label>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span
          style={{ width: 10, height: 10, borderRadius: "50%", background: color, flexShrink: 0 }}
        />
        <span style={{ fontFamily: "var(--font-display)", fontSize: 13, color: "var(--ink-2)" }}>
          #{name.trim() || "새태그"} 미리보기
        </span>
      </div>
      {onConfirm && (
        <div style={{ display: "flex", gap: 7 }}>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              style={{
                flex: 1,
                padding: "8px",
                borderRadius: "var(--r-md)",
                cursor: "pointer",
                border: "2px solid var(--line)",
                background: "var(--cream-1)",
                color: "var(--ink-2)",
                fontFamily: "var(--font-display)",
                fontSize: 14,
              }}
            >
              취소
            </button>
          )}
          <button
            type="button"
            onClick={onConfirm}
            style={{
              flex: 2,
              padding: "8px",
              borderRadius: "var(--r-md)",
              cursor: "pointer",
              border: "none",
              background: "var(--accent)",
              color: "#fff",
              fontFamily: "var(--font-display)",
              fontSize: 14,
              boxShadow: "inset 0 -2px 0 rgba(0,0,0,.13)",
            }}
          >
            {confirmLabel}
          </button>
        </div>
      )}
    </div>
  );
}
