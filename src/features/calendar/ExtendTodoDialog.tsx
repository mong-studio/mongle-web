import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { type ReactNode, useState } from "react";
import { toYMDStr } from "./calEngine.js";
import { SingleDatePicker } from "./SingleDatePicker.js";

type Props = {
  trigger: ReactNode;
  tokenCost: number;
  // 선택한 희망 날짜(YYYY-MM-DD)로 연장을 시도한다. 실패하면 throw 한다.
  onConfirm: (newDate: string) => Promise<void>;
};

function todayStr(): string {
  const now = new Date();
  return toYMDStr(now.getFullYear(), now.getMonth(), now.getDate());
}

// 지난 미완료 TODO를 옮길 날짜를 고르는 확인 다이얼로그.
// 오늘 포함 미래 날짜만 허용하고, 확정 시 토큰을 사용해 연장한다.
export function ExtendTodoDialog({ trigger, tokenCost, onConfirm }: Props) {
  const today = todayStr();
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(today);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleConfirm = async () => {
    if (date < today) {
      setError("오늘 이후 날짜만 선택할 수 있어요.");
      return;
    }
    setBusy(true);
    try {
      await onConfirm(date);
      setOpen(false);
    } catch {
      // 토큰 부족 등 실패는 상위(App)에서 토스트로 안내한다. 다이얼로그만 닫는다.
      setOpen(false);
    }
  };

  return (
    <AlertDialog.Root
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          // 열 때마다 오늘 기준으로 초기화한다.
          setDate(today);
          setError("");
          setBusy(false);
        }
      }}
    >
      <AlertDialog.Trigger asChild>{trigger}</AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Overlay
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            background: "rgba(70,48,22,0.34)",
            pointerEvents: "auto",
          }}
        />
        <AlertDialog.Content
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 1001,
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
            할일을 연장할까요?
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
            옮길 날짜를 고르면 토큰 {tokenCost}개를 사용해 할일을 오늘 이후로 옮겨요.
          </AlertDialog.Description>
          <SingleDatePicker
            value={date}
            onChange={(next) => {
              setDate(next);
              setError("");
            }}
          />
          {error && (
            <p
              style={{
                margin: 0,
                fontFamily: "var(--font-body)",
                fontSize: 13,
                color: "var(--c-danger)",
              }}
            >
              {error}
            </p>
          )}
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
            <button
              type="button"
              onClick={handleConfirm}
              disabled={busy}
              style={{
                flex: 2,
                padding: "10px",
                borderRadius: "var(--r-md)",
                cursor: busy ? "default" : "pointer",
                border: "none",
                background: "var(--accent)",
                color: "#fff",
                fontFamily: "var(--font-display)",
                fontSize: 14,
                opacity: busy ? 0.6 : 1,
                boxShadow: "inset 0 -2px 0 rgba(0,0,0,.13)",
              }}
            >
              연장하기
            </button>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
