import * as AlertDialog from "@radix-ui/react-alert-dialog";
import type { ReactElement, ReactNode, SyntheticEvent } from "react";
import { cloneElement, isValidElement, useState } from "react";

type DeleteConfirmDialogProps = {
  trigger: ReactNode;
  title: string;
  description: string;
  onConfirm: () => void;
  confirmLabel?: string;
};

type TriggerEventProps = {
  onClick?: (event: SyntheticEvent) => void;
  onMouseDown?: (event: SyntheticEvent) => void;
  onMouseUp?: (event: SyntheticEvent) => void;
  onPointerDown?: (event: SyntheticEvent) => void;
  onPointerUp?: (event: SyntheticEvent) => void;
  onTouchStart?: (event: SyntheticEvent) => void;
  onTouchEnd?: (event: SyntheticEvent) => void;
};

function stopDialogEvent(event: SyntheticEvent) {
  event.stopPropagation();
  event.nativeEvent.stopImmediatePropagation?.();
}

function stopTriggerEvent(event: SyntheticEvent) {
  event.stopPropagation();
}

function withStoppedTriggerEvents(trigger: ReactNode, openDialog: () => void): ReactNode {
  if (!isValidElement<TriggerEventProps>(trigger)) {
    return trigger;
  }

  const element = trigger as ReactElement<TriggerEventProps>;
  return cloneElement(element, {
    onPointerDown: (event: SyntheticEvent) => {
      element.props.onPointerDown?.(event);
      stopTriggerEvent(event);
    },
    onPointerUp: (event: SyntheticEvent) => {
      element.props.onPointerUp?.(event);
      stopTriggerEvent(event);
    },
    onMouseDown: (event: SyntheticEvent) => {
      element.props.onMouseDown?.(event);
      stopTriggerEvent(event);
    },
    onMouseUp: (event: SyntheticEvent) => {
      element.props.onMouseUp?.(event);
      stopTriggerEvent(event);
    },
    onTouchStart: (event: SyntheticEvent) => {
      element.props.onTouchStart?.(event);
      stopTriggerEvent(event);
    },
    onTouchEnd: (event: SyntheticEvent) => {
      element.props.onTouchEnd?.(event);
      stopTriggerEvent(event);
    },
    onClick: (event: SyntheticEvent) => {
      element.props.onClick?.(event);
      if (!event.isDefaultPrevented()) {
        event.preventDefault();
        openDialog();
      }
      stopTriggerEvent(event);
    },
  });
}

export function DeleteConfirmDialog({
  trigger,
  title,
  description,
  onConfirm,
  confirmLabel = "삭제",
}: DeleteConfirmDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <AlertDialog.Root open={open} onOpenChange={setOpen}>
      <AlertDialog.Trigger asChild>
        {withStoppedTriggerEvents(trigger, () => setOpen(true))}
      </AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Overlay
          onClick={stopDialogEvent}
          onMouseDown={stopDialogEvent}
          onMouseUp={stopDialogEvent}
          onPointerDown={stopDialogEvent}
          onPointerUp={stopDialogEvent}
          onTouchEnd={stopDialogEvent}
          onTouchStart={stopDialogEvent}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            background: "rgba(70,48,22,0.34)",
            pointerEvents: "auto",
          }}
        />
        <AlertDialog.Content
          onClick={stopDialogEvent}
          onMouseDown={stopDialogEvent}
          onMouseUp={stopDialogEvent}
          onPointerDown={stopDialogEvent}
          onPointerUp={stopDialogEvent}
          onTouchEnd={stopDialogEvent}
          onTouchStart={stopDialogEvent}
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 1001,
            width: "90%",
            maxWidth: 340,
            background: "var(--cream-1)",
            borderRadius: "var(--r-lg)",
            border: "2px solid var(--line)",
            boxShadow: "var(--sh-pop)",
            padding: "22px 20px 18px",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <AlertDialog.Title
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 18,
              color: "var(--ink-1)",
              margin: 0,
            }}
          >
            {title}
          </AlertDialog.Title>
          <AlertDialog.Description
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 14,
              color: "var(--ink-2)",
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            {description}
          </AlertDialog.Description>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9, marginTop: 4 }}>
            <AlertDialog.Cancel asChild>
              <button
                type="button"
                style={{
                  padding: "10px",
                  borderRadius: "var(--r-md)",
                  cursor: "pointer",
                  border: "2px solid var(--line)",
                  background: "var(--cream-1)",
                  color: "var(--ink-2)",
                  fontFamily: "var(--font-display)",
                  fontSize: 14,
                }}
              >
                취소
              </button>
            </AlertDialog.Cancel>
            <AlertDialog.Action asChild>
              <button
                type="button"
                onClick={onConfirm}
                style={{
                  padding: "10px",
                  borderRadius: "var(--r-md)",
                  cursor: "pointer",
                  border: "none",
                  background: "var(--c-danger)",
                  color: "#fff",
                  fontFamily: "var(--font-display)",
                  fontSize: 14,
                  boxShadow: "inset 0 -2px 0 rgba(0,0,0,.13)",
                }}
              >
                {confirmLabel}
              </button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
