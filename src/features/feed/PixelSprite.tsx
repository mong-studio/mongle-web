import type React from "react";

type Palette = Record<string, string | undefined>;

interface PixelSpriteProps {
  art: string[];
  palette: Palette;
  px?: number;
  style?: React.CSSProperties;
  className?: string;
  title?: string;
}

export function PixelSprite({
  art,
  palette,
  px = 3,
  style = {},
  className = "",
  title,
}: PixelSpriteProps) {
  const cols = art[0].length;
  const cells: React.ReactNode[] = [];
  for (let y = 0; y < art.length; y++) {
    const row = art[y];
    for (let x = 0; x < row.length; x++) {
      const color = palette[row[x]];
      cells.push(
        <div
          key={`${y}-${x}`}
          style={{ width: px, height: px, background: color ?? "transparent" }}
        />,
      );
    }
  }
  return (
    // biome-ignore lint/a11y/useAriaPropsSupportedByRole: aria-label conditionally paired with role=img
    <div
      className={`pix${className ? ` ${className}` : ""}`}
      role={title ? "img" : undefined}
      aria-label={title}
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${cols}, ${px}px)`,
        gridAutoRows: `${px}px`,
        lineHeight: 0,
        imageRendering: "pixelated",
        flexShrink: 0,
        ...style,
      }}
    >
      {cells}
    </div>
  );
}

export const SPRITES = {
  apple: [
    "....s....",
    "...sll...",
    ".rr...rr.",
    "rrrrhrrrr",
    "rrhhrrrrd",
    "rrrrrrrrd",
    "drrrrrrrd",
    ".drrrrrd.",
    "..ddddd..",
  ],
  heart: [
    ".rr...rr.",
    "rrhrrrrrr",
    "rrhrrrrrr",
    "rrrrrrrrr",
    ".rrrrrrr.",
    "..rrrrr..",
    "...rrr...",
    "....r....",
  ],
  heartOutline: [
    ".rr...rr.",
    "r..r.r..r",
    "r...r...r",
    "r.......r",
    ".r.....r.",
    "..r...r..",
    "...r.r...",
    "....r....",
  ],
  spark: ["..y..", "..y..", "yyhyy", "..y..", "..y.."],
  comment: [
    ".xxxxxxx.",
    "x.......x",
    "x.......x",
    "x.......x",
    "x.......x",
    ".xxxxxxx.",
    "..x......",
    ".x.......",
  ],
  arrow: ["....x..", ".....x.", "xxxxxxx", ".....x.", "....x.."],
  close: ["x.....x", ".x...x.", "..x.x..", "...x...", "..x.x..", ".x...x.", "x.....x"],
};

export const APPLE_PAL = { r: "#E0533B", d: "#B23A2A", h: "#FF9B82", s: "#7A4A2A", l: "#5BA45A" };
export const SPARK_PAL = { y: "#FFCB45", h: "#FFF0BE" };
