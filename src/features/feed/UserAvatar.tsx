import type { CSSProperties } from "react";
import { APPLE_PAL, PixelSprite, SPRITES } from "./PixelSprite.js";

interface UserAvatarProps {
  className?: string;
  style?: CSSProperties;
  px?: number;
}

export function UserAvatar({ className, style, px = 2.2 }: UserAvatarProps) {
  const classes = ["user-avatar", className].filter(Boolean).join(" ");

  return (
    <div className={classes} style={style} aria-hidden="true">
      <PixelSprite art={SPRITES.apple} palette={APPLE_PAL} px={px} />
    </div>
  );
}
