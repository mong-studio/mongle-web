type TagProps = {
  color: string;
  bg: string;
  label: string;
};

export function Tag({ color, bg, label }: TagProps) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "2px 8px",
        borderRadius: 999,
        background: bg,
        color,
        fontFamily: "var(--font-display)",
        fontSize: 12,
        lineHeight: 1.1,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
}
