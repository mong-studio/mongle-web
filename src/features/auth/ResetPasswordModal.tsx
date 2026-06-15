import { useEffect, useRef, useState } from "react";
import {
  confirmPasswordResetCode,
  requestPasswordResetCode,
  resetPassword,
  toUserMessage,
} from "./api.js";
import "./SignupModal.css";

type ResetPasswordModalProps = {
  open: boolean;
  onClose: () => void;
  onComplete: (notice: string) => void;
};

export function ResetPasswordModal({ open, onClose, onComplete }: ResetPasswordModalProps) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [sending, setSending] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [verified, setVerified] = useState(false);
  const [verificationToken, setVerificationToken] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState("");
  const toastTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!open) {
      setEmail("");
      setCode("");
      setPw("");
      setPw2("");
      setSending(false);
      setCodeSent(false);
      setVerified(false);
      setVerificationToken("");
      setSubmitting(false);
      setToast("");
      clearTimeout(toastTimer.current);
    }
  }, [open]);

  const pwMismatch = pw2.length > 0 && pw !== pw2;

  function showToast(msg: string) {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2600);
  }

  async function handleSendCode() {
    if (sending) return;
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
      showToast("올바른 이메일을 입력해주세요");
      return;
    }
    setSending(true);
    try {
      await requestPasswordResetCode(email.trim());
      setCodeSent(true);
      showToast("인증 코드를 보냈어요! 메일함을 확인해주세요");
    } catch (err) {
      showToast(toUserMessage(err));
    } finally {
      setSending(false);
    }
  }

  async function handleVerifyCode() {
    if (!codeSent) {
      showToast("먼저 코드를 발송해주세요");
      return;
    }
    if (code.trim().length < 4) {
      showToast("인증 코드를 정확히 입력해주세요");
      return;
    }
    try {
      const result = await confirmPasswordResetCode(email.trim(), code.trim().toUpperCase());
      setVerificationToken(result.verification_token);
      setVerified(true);
      showToast("이메일 인증 완료! ✿");
    } catch (err) {
      showToast(toUserMessage(err));
    }
  }

  async function handleSubmit() {
    if (submitting) return;
    if (!verified) {
      showToast("이메일 인증을 먼저 완료해주세요");
      return;
    }
    if (pw.length < 8) {
      showToast("비밀번호는 8자 이상이어야 해요");
      return;
    }
    if (pw !== pw2) {
      showToast("비밀번호가 일치하지 않아요");
      return;
    }
    setSubmitting(true);
    try {
      await resetPassword(email.trim(), pw, verificationToken);
      onComplete("비밀번호가 변경됐어요! 새 비밀번호로 로그인해 주세요.");
    } catch (err) {
      showToast(toUserMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div className="suBackdrop" role="presentation">
      <section className="suModal" role="dialog" aria-modal="true" aria-labelledby="rp-title">
        <button type="button" className="suClose" onClick={onClose} aria-label="닫기">
          ✕
        </button>

        {/* Eyebrow */}
        <div className="suEyebrow">
          <img
            src="/assets/auth/su-flower.png"
            alt=""
            style={{ width: 19, height: 19, flex: "none" }}
          />
          <span className="suEyebrowText">MONGLE ACCOUNT</span>
          <img
            src="/assets/auth/su-flower.png"
            alt=""
            style={{ width: 19, height: 19, flex: "none" }}
          />
          <div className="suEyebrowLine" />
        </div>

        {/* Title */}
        <div className="suTitleRow">
          <img
            src="/assets/auth/su-sprout.png"
            alt=""
            style={{ width: 26, height: 26, flex: "none" }}
          />
          <h1 id="rp-title" className="suTitle">
            비밀번호 재설정
          </h1>
          <img
            src="/assets/auth/su-sprout.png"
            alt=""
            style={{ width: 26, height: 26, flex: "none", transform: "scaleX(-1)" }}
          />
        </div>
        <p className="suSubtitle">이메일 인증 후 새 비밀번호를 설정해요.</p>

        {/* Divider */}
        <div className="suDivider">
          <div className="suDividerLine" />
          <img
            src="/assets/auth/su-flower.png"
            alt=""
            style={{ width: 20, height: 20, flex: "none" }}
          />
          <div className="suDividerLine" />
        </div>

        {/* Email */}
        <div className="suLabel">
          <img
            src="/assets/auth/su-flower.png"
            alt=""
            style={{ width: 23, height: 23, flex: "none" }}
          />
          이메일
        </div>
        <div className="suInlineRow">
          <input
            className="suInput"
            type="email"
            value={email}
            autoComplete="off"
            onChange={(e) => {
              setEmail(e.target.value);
              setVerified(false);
              setCodeSent(false);
            }}
            placeholder="가입한 이메일을 입력해주세요"
          />
          <button type="button" className="suAmberBtn" onClick={handleSendCode} disabled={sending}>
            {sending && <span className="suSpinner" />}
            <img
              src="/assets/auth/su-btnflower.png"
              alt=""
              style={{ width: 23, height: 23, flex: "none" }}
            />
            {sending ? "발송 중…" : "코드 발송"}
          </button>
        </div>

        {/* Verification code */}
        <div className="suLabel suSection">
          <img
            src="/assets/auth/su-flower.png"
            alt=""
            style={{ width: 23, height: 23, flex: "none" }}
          />
          인증 코드
        </div>
        <div className="suInlineRow">
          <input
            className={`suInput suInput--code${verified ? " suInput--verified" : ""}`}
            value={code}
            maxLength={6}
            autoComplete="one-time-code"
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="ABCDEF"
          />
          <button
            type="button"
            className="suAmberBtn"
            onClick={handleVerifyCode}
            disabled={verified}
          >
            <img
              src="/assets/auth/su-btnflower.png"
              alt=""
              style={{ width: 23, height: 23, flex: "none" }}
            />
            인증 확인
          </button>
        </div>
        {verified && (
          <div className="suSuccessLine">
            <span className="suSuccessIcon">✓</span>
            이메일 인증이 완료됐어요!
          </div>
        )}

        {/* New password 2-col */}
        <div className="suGrid2 suSection">
          <div>
            <div className="suLabel">
              <img
                src="/assets/auth/su-flower.png"
                alt=""
                style={{ width: 23, height: 23, flex: "none" }}
              />
              새 비밀번호
            </div>
            <input
              className="suInput"
              type="password"
              value={pw}
              autoComplete="new-password"
              onChange={(e) => setPw(e.target.value)}
              placeholder="8자 이상 입력해주세요"
            />
          </div>
          <div>
            <div className="suLabel">
              <img
                src="/assets/auth/su-flower.png"
                alt=""
                style={{ width: 23, height: 23, flex: "none" }}
              />
              비밀번호 확인
            </div>
            <input
              className={`suInput${pwMismatch ? " suInput--warn" : ""}`}
              type="password"
              value={pw2}
              autoComplete="new-password"
              onChange={(e) => setPw2(e.target.value)}
            />
          </div>
        </div>
        {pwMismatch && <div className="suWarnLine">✿ 비밀번호가 일치하지 않아요.</div>}

        {/* Submit */}
        <button type="button" className="suSubmitBtn" onClick={handleSubmit} disabled={submitting}>
          <img
            src="/assets/auth/su-bigflower.png"
            alt=""
            style={{ width: 26, height: 26, flex: "none" }}
          />
          {submitting && <span className="suSpinner suSpinner--lg" />}
          <span className="suSubmitLabel">{submitting ? "변경 중…" : "확인"}</span>
          <img
            src="/assets/auth/su-bigflower.png"
            alt=""
            style={{ width: 26, height: 26, flex: "none", transform: "scaleX(-1)" }}
          />
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
