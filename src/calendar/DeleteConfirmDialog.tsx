import * as AlertDialog from "@radix-ui/react-alert-dialog";
import type { ReactNode } from "react";

type DeleteConfirmDialogProps = {
  trigger: ReactNode;
  title: string;
  description: string;
  onConfirm: () => void;
};

export function DeleteConfirmDialog({
  trigger,
  title,
  description,
  onConfirm,
}: DeleteConfirmDialogProps) {
  return (
    <AlertDialog.Root>
      <AlertDialog.Trigger asChild>{trigger}</AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Overlay
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 80,
            background: "rgba(70,48,22,0.34)",
          }}
        />
        <AlertDialog.Content
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 81,
            width: "90%",
            maxWidth: 340,
            background: "var(--cream-1)",
            borderRadius: "var(--r-xl)",
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
          <div style={{ display: "flex", gap: 9, marginTop: 4 }}>
            <AlertDialog.Cancel asChild>
              <button
                type="button"
                style={{
                  flex: 1,
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
                  flex: 2,
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
                삭제
              </button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
