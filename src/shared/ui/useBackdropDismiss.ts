import type { MouseEvent } from "react";
import { useRef } from "react";

/**
 * Closes a modal only when both mousedown and the resulting click land on the
 * backdrop itself. Prevents text-selection drags that start inside the modal
 * and release outside it from being misread as a backdrop click.
 */
export function useBackdropDismiss(onClose: () => void) {
  const pressedOnBackdrop = useRef(false);

  return {
    onMouseDown: (event: MouseEvent<HTMLElement>) => {
      pressedOnBackdrop.current = event.target === event.currentTarget;
    },
    onClick: (event: MouseEvent<HTMLElement>) => {
      if (pressedOnBackdrop.current && event.target === event.currentTarget) {
        onClose();
      }
      pressedOnBackdrop.current = false;
    },
  };
}
