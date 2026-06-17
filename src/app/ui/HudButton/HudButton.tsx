import "./HudButton.css";

type HudButtonProps = {
  ariaLabel: string;
  iconSrc: string;
  label: string;
  onClick: () => void;
  badgeCount?: number;
  className?: string;
};

export function HudButton({
  ariaLabel,
  badgeCount,
  className = "",
  iconSrc,
  label,
  onClick,
}: HudButtonProps) {
  const showBadge = typeof badgeCount === "number" && badgeCount > 0;

  return (
    <button
      type="button"
      className={`hudButton ${className}`.trim()}
      onClick={onClick}
      aria-label={ariaLabel}
    >
      <span className="hudButtonIconWrap">
        <img src={iconSrc} alt="" className="hudButtonIcon" />
      </span>
      {showBadge ? <span className="hudButtonBadge" /> : null}
      <span className="hudButtonText">{label}</span>
    </button>
  );
}
