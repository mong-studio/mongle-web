import { useRef, useState } from "react";

interface ImageSlotProps {
  id: string;
  placeholder: string;
  width?: string | number;
  height?: string | number;
  tint?: string;
  radius?: number;
  pixelated?: boolean;
}

function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, val: string | null) {
  try {
    if (val === null) localStorage.removeItem(key);
    else localStorage.setItem(key, val);
  } catch {}
}

export function ImageSlot({
  id,
  placeholder,
  width = "100%",
  height = 232,
  tint = "#f0e8d8",
  radius = 14,
  pixelated = false,
}: ImageSlotProps) {
  const [src, setSrc] = useState<string | null>(() => readStorage(`img-slot-${id}`));
  const [over, setOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const depthRef = useRef(0);

  function ingest(file: File) {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      setSrc(url);
      writeStorage(`img-slot-${id}`, url);
    };
    reader.readAsDataURL(file);
  }

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: file upload trigger div, keyboard not needed here
    // biome-ignore lint/a11y/useKeyWithClickEvents: file upload trigger div, keyboard not needed here
    <div
      style={{
        width,
        height,
        borderRadius: radius,
        background: tint,
        position: "relative",
        overflow: "hidden",
        cursor: src ? "default" : "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        outline: over ? "2px solid rgba(200,100,66,.7)" : "none",
        outlineOffset: -2,
        transition: "outline .12s",
      }}
      onClick={() => {
        if (!src) inputRef.current?.click();
      }}
      onDragEnter={(e) => {
        e.preventDefault();
        depthRef.current++;
        setOver(true);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
      }}
      onDragLeave={() => {
        if (--depthRef.current <= 0) {
          depthRef.current = 0;
          setOver(false);
        }
      }}
      onDrop={(e) => {
        e.preventDefault();
        depthRef.current = 0;
        setOver(false);
        const file = e.dataTransfer.files[0];
        if (file) ingest(file);
      }}
    >
      {src ? (
        <>
          <img
            src={src}
            alt=""
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              imageRendering: pixelated ? "pixelated" : "auto",
            }}
          />
          <button
            type="button"
            style={{
              position: "absolute",
              top: 6,
              right: 6,
              width: 22,
              height: 22,
              borderRadius: "50%",
              background: "rgba(0,0,0,.52)",
              border: "none",
              color: "#fff",
              fontSize: 13,
              lineHeight: 1,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 0,
            }}
            aria-label="이미지 제거"
            onClick={(e) => {
              e.stopPropagation();
              setSrc(null);
              writeStorage(`img-slot-${id}`, null);
            }}
          >
            ×
          </button>
        </>
      ) : (
        <div
          style={{
            textAlign: "center",
            color: "rgba(96,72,48,.62)",
            fontSize: 13,
            padding: 12,
            pointerEvents: "none",
            userSelect: "none",
          }}
        >
          <div style={{ fontSize: 22, marginBottom: 5 }}>🖼</div>
          <div style={{ lineHeight: 1.4 }}>{placeholder}</div>
          <div style={{ fontSize: 11, marginTop: 4, opacity: 0.65 }}>드래그하거나 클릭</div>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) ingest(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}
