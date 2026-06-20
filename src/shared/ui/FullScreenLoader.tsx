import "./FullScreenLoader.css";

type FullScreenLoaderProps = {
  show: boolean;
  title?: string;
  caption?: string;
};

const APPLE_STAGES = [1, 2, 3, 4];

export function FullScreenLoader({
  show,
  title = "로딩 중...",
  caption = "이장님댁 노크 중",
}: FullScreenLoaderProps) {
  if (!show) return null;

  return (
    <div className="fsLoader" role="status" aria-live="polite" aria-label={title}>
      <p className="fsLoaderTitle">{title}</p>
      <div className="fsLoaderRow">
        {APPLE_STAGES.map((n, i) => (
          <img
            key={n}
            src={`/assets/icon/apple-stage-${n}.png`}
            alt=""
            className="fsLoaderApple"
            style={{ animationDelay: `${i * 0.5}s, ${i * 0.5}s` }}
          />
        ))}
      </div>
      {caption && (
        <p className="fsLoaderCaption">
          <span className="fsLoaderSprout" aria-hidden="true">
            🌱
          </span>
          {caption}
          <span className="fsLoaderSprout" aria-hidden="true">
            🌱
          </span>
        </p>
      )}
    </div>
  );
}
