import { useState } from "react";

interface ImageSlotProps {
  /** 백엔드(DB)가 내려준 이미지 URL. 없거나 로드 실패 시 placeholder 를 보여준다. */
  imageUrl?: string;
  placeholder: string;
  width?: string | number;
  height?: string | number;
  tint?: string;
  radius?: number;
  pixelated?: boolean;
}

// 이모지/설명 텍스트가 아니라 실제로 불러올 수 있는 이미지 주소인지 판별한다.
function isRenderableUrl(value?: string): value is string {
  return !!value && /^(https?:\/\/|data:image\/|blob:)/.test(value);
}

export function ImageSlot({
  imageUrl,
  placeholder,
  width = "100%",
  height = 232,
  tint = "#f0e8d8",
  radius = 14,
  pixelated = false,
}: ImageSlotProps) {
  // 로드에 실패한 URL만 기억한다. imageUrl 이 바뀌면 자동으로 다시 시도한다.
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  const src = isRenderableUrl(imageUrl) && imageUrl !== failedUrl ? imageUrl : null;

  return (
    <div
      style={{
        width,
        height,
        borderRadius: radius,
        background: tint,
        position: "relative",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {src ? (
        <img
          src={src}
          alt=""
          onError={() => setFailedUrl(imageUrl ?? null)}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            imageRendering: pixelated ? "pixelated" : "auto",
          }}
        />
      ) : (
        <div
          style={{
            textAlign: "center",
            color: "rgba(96,72,48,.55)",
            fontSize: 13,
            padding: 12,
            pointerEvents: "none",
            userSelect: "none",
          }}
        >
          <div style={{ fontSize: 22, marginBottom: 5 }}>🖼</div>
          <div style={{ lineHeight: 1.4 }}>{placeholder}</div>
        </div>
      )}
    </div>
  );
}
