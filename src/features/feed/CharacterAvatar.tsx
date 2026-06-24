import type { CSSProperties } from "react";

const API_BASE = import.meta.env.VITE_API_BASE ?? "";

// gen_img_url 은 보통 S3 presigned 절대 URL(http)이지만, 상대 경로면 API_BASE 를 붙인다.
export function resolveCharacterImgUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  if (/^(https?:|data:|blob:)/.test(url)) return url;
  if (!API_BASE) return url;
  const base = API_BASE.endsWith("/") ? API_BASE.slice(0, -1) : API_BASE;
  const path = url.startsWith("/") ? url : `/${url}`;
  return `${base}${path}`;
}

interface CharacterAvatarProps {
  imageUrl?: string | null;
  name?: string | null;
  fallback?: string;
  alt?: string;
  className?: string;
  imageFit?: "contain" | "cover";
  style?: CSSProperties;
}

export function CharacterAvatar({
  imageUrl,
  name,
  fallback,
  alt = "",
  className,
  imageFit = "contain",
  style,
}: CharacterAvatarProps) {
  const resolvedUrl = resolveCharacterImgUrl(imageUrl);
  const label = fallback ?? name?.[0]?.toUpperCase() ?? "?";
  const classes = ["character-avatar", className].filter(Boolean).join(" ");

  return (
    <div className={classes} style={style} aria-hidden={alt ? undefined : true}>
      {resolvedUrl ? (
        <img
          src={resolvedUrl}
          alt={alt}
          className="character-avatar-img"
          style={{ objectFit: imageFit }}
        />
      ) : (
        label
      )}
    </div>
  );
}
