import { useEffect, useRef, useState } from "react";
import "../auth/SignupModal.css";

const CONFIRM_PHRASE = "회원 탈퇴";

type Props = {
  open: boolean;
  loginType: string;
  onClose: () => void;
  onConfirm: (password?: string) => Promise<void>;
};

export function WithdrawModal({ open, loginType, onClose, onConfirm }: Props) {
  // 이메일 가입자만 현재 비밀번호 확인이 필요하다(소셜 가입자는 비번 없이 진행).
  const needsPassword = loginType === "email";
  const [password, setPassword] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState("");
  const toastTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!open) {
      setPassword("");
      setConfirmText("");
      setSubmitting(false);
      setToast("");
      clearTimeout(toastTimer.current);
    }
  }, [open]);

  function showToast(msg: string) {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2600);
  }

  // "회원 탈퇴" 문구 재입력 + (이메일 가입자면) 비밀번호가 있어야 진행 가능.
  const canSubmit =
    confirmText === CONFIRM_PHRASE && (!needsPassword || password.length > 0) && !submitting;

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await onConfirm(needsPassword ? password : undefined);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "탈퇴에 실패했어요");
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div className="modalBackdrop suBackdrop" role="presentation" style={{ zIndex: 220 }}>
      <section className="suModal" role="dialog" aria-modal="true" aria-labelledby="wd-title">
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
          <h1 id="wd-title" className="suTitle">
            회원 탈퇴
          </h1>
          <img src="/assets/auth/sprout.png" alt="" className="suTitleImg suMirror" />
        </div>

        <div className="suDivider">
          <div className="suDividerLine" />
          <img src="/assets/auth/flower.png" alt="" className="suDividerImg" />
          <div className="suDividerLine" />
        </div>

        <p
          className="suSection"
          style={{ color: "#b06a6a", fontSize: 13, lineHeight: 1.6, margin: 0 }}
        >
          탈퇴하면 원본 사진·닉네임·이메일·비밀번호 등 개인정보가 삭제되며 되돌릴 수 없어요.
        </p>

        {needsPassword && (
          <>
            <div className="suLabel suSection">
              <img src="/assets/auth/flower.png" alt="" className="suLabelImg" />
              현재 비밀번호
            </div>
            <input
              className="suInput"
              type="password"
              value={password}
              autoComplete="current-password"
              onChange={(e) => setPassword(e.target.value)}
              placeholder="현재 비밀번호를 입력해주세요"
            />
          </>
        )}

        <div className="suLabel suSection">
          <img src="/assets/auth/flower.png" alt="" className="suLabelImg" />
          확인을 위해 "회원 탈퇴"를 입력해주세요
        </div>
        <input
          className="suInput"
          type="text"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder="회원 탈퇴"
        />

        <button type="button" className="suSubmitBtn" onClick={handleSubmit} disabled={!canSubmit}>
          {submitting && <span className="suSpinner suSpinner--lg" />}
          <span className="suSubmitLabel">{submitting ? "탈퇴 중…" : "회원 탈퇴"}</span>
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
