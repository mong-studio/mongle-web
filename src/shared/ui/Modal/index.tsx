import { type ReactNode, useEffect } from "react";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  /** id of the heading element for aria-labelledby */
  labelledBy?: string;
  /** accessible name when there is no visible heading id */
  ariaLabel?: string;
  /** extra classes appended to the `.featureModal` section */
  className?: string;
  /** close when the dimmed backdrop is clicked (default: true) */
  closeOnBackdrop?: boolean;
  /** close when Escape is pressed (default: true) */
  closeOnEscape?: boolean;
  /** render the top-right close button (default: true) */
  showCloseButton?: boolean;
  children: ReactNode;
};

/**
 * Shared pixel-tone modal shell: dimmed backdrop + `.featureModal` card +
 * close button. Consumers provide their own kicker/heading/body as children.
 */
export function Modal({
  open,
  onClose,
  labelledBy,
  ariaLabel,
  className,
  closeOnBackdrop = true,
  closeOnEscape = true,
  showCloseButton = true,
  children,
}: ModalProps) {
  useEffect(() => {
    if (!open || !closeOnEscape) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, closeOnEscape, onClose]);

  if (!open) return null;

  const sectionClassName = className ? `featureModal ${className}` : "featureModal";

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: backdrop click-to-dismiss is intentional UX
    <div
      className="modalBackdrop"
      role="presentation"
      onClick={(event) => {
        if (closeOnBackdrop && event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className={sectionClassName}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-label={labelledBy ? undefined : ariaLabel}
      >
        {showCloseButton ? (
          <button type="button" className="closeButton" onClick={onClose} aria-label="닫기">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        ) : null}
        {children}
      </section>
    </div>
  );
}
