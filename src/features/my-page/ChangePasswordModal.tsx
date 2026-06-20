import { useEffect, useRef, useState } from "react";
import "../auth/SignupModal.css";

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (current: string, next: string) => Promise<void>;
};

export function ChangePasswordModal({ open, onClose, onSubmit }: Props) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState("");
  const toastTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!open) {
      setCurrent("");
      setNext("");
      setConfirm("");
      setSubmitting(false);
      setToast("");
      clearTimeout(toastTimer.current);
    }
  }, [open]);

  const mismatch = confirm.length > 0 && next !== confirm;

  function showToast(msg: string) {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2600);
  }

  async function handleSubmit() {
    if (submitting) return;
    if (!current) {
      showToast("현재 비밀번호를 입력해주세요");
      return;
    }
    if (next.includes(" ")) {
      showToast("비밀번호에 공백을 포함할 수 없어요");
      return;
    }
    if (next.length < 8 || next.length > 16) {
      showToast("새 비밀번호는 8~16자로 입력해주세요");
      return;
    }
    const typeCount = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^a-zA-Z0-9]/].filter((r) =>
      r.test(next),
    ).length;
    if (typeCount < 2) {
      showToast("대문자·소문자·숫자·특수문자 중 2종류 이상을 포함해주세요");
      return;
    }
    if (next !== confirm) {
      showToast("새 비밀번호가 일치하지 않아요");
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(current, next);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "비밀번호 변경에 실패했어요");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div className="modalBackdrop suBackdrop" role="presentation" style={{ zIndex: 220 }}>
      <section className="suModal" role="dialog" aria-modal="true" aria-labelledby="cp-title">
        <button type="button" className="suClose" onClick={onClose} aria-label="닫기">
          ✕
        </button>

        <div className="suEyebrow">
          <img src="/assets/auth/flower.png" alt="" className="suEyebrowImg" />
          <span className="suEyebrowText">MONGLE ACCOUNT</span>
          <img src="/assets/auth/flower.png" alt="" className="suEyebrowImg" />
          <div className="suEyebrowLine" />
        </div>

        <div className="suTitleRow">
          <img src="/assets/auth/sprout.png" alt="" className="suTitleImg" />
          <h1 id="cp-title" className="suTitle">
            비밀번호 변경
          </h1>
          <img src="/assets/auth/sprout.png" alt="" className="suTitleImg suMirror" />
        </div>

        <div className="suDivider">
          <div className="suDividerLine" />
          <img src="/assets/auth/flower.png" alt="" className="suDividerImg" />
          <div className="suDividerLine" />
        </div>

        <div className="suLabel suSection">
          <img src="/assets/auth/flower.png" alt="" className="suLabelImg" />
          현재 비밀번호
        </div>
        <input
          className="suInput"
          type="password"
          value={current}
          autoComplete="current-password"
          onChange={(e) => setCurrent(e.target.value)}
          placeholder="현재 비밀번호를 입력해주세요"
        />

        <div className="suGrid2 suSection">
          <div>
            <div className="suLabel">
              <img src="/assets/auth/flower.png" alt="" className="suLabelImg" />새 비밀번호
            </div>
            <input
              className="suInput"
              type="password"
              value={next}
              autoComplete="new-password"
              onChange={(e) => setNext(e.target.value)}
              placeholder="8~16자, 2종 이상 조합"
            />
          </div>
          <div>
            <div className="suLabel">
              <img src="/assets/auth/flower.png" alt="" className="suLabelImg" />
              비밀번호 확인
            </div>
            <input
              className={`suInput${mismatch ? " suInput--warn" : ""}`}
              type="password"
              value={confirm}
              autoComplete="new-password"
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>
        </div>

        <button type="button" className="suSubmitBtn" onClick={handleSubmit} disabled={submitting}>
          {submitting && <span className="suSpinner suSpinner--lg" />}
          <span className="suSubmitLabel">{submitting ? "변경 중…" : "변경 완료"}</span>
        </button>
      </section>

      {toast && (
        <div className="suToast">
          <span className="suToastFlower">✿</span>
          {toast}
        </div>
      )}
    </div>
  );
}
