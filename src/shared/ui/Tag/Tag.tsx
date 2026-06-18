type TagProps = {
  color: string;
  bg: string;
  label: string;
};

// 파스텔 태그색(예: 기타 #E7D39F)을 그대로 글씨에 쓰면 옅은 틴트 배경에서 잘 안 보인다.
// 밝은 색만 어둡게 눌러 가독성을 확보한다. 어두운 색은 그대로 둔다.
export function readableInk(hex: string): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return hex;
  const n = Number.parseInt(m[1], 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  if (lum <= 0.62) return hex;
  const f = 0.55;
  const d = (1 << 24) | ((r * f) << 16) | ((g * f) << 8) | (b * f);
  return `#${(d >>> 0).toString(16).slice(1)}`;
}

export function Tag({ color, bg, label }: TagProps) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "2px 8px",
        borderRadius: 999,
        background: bg,
        color: readableInk(color),
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
