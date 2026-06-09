import { useEffect, useState } from "react";
import "./LoginModal.css";
import { toUserMessage } from "./api.js";
import { type AuthState, useAuthStore } from "./store.js";

type LoginModalProps = {
  open: boolean;
  onClose: () => void;
  onSwitchToSignup: () => void;
};

export function LoginModal({ open, onClose, onSwitchToSignup }: LoginModalProps) {
  const login = useAuthStore((state: AuthState) => state.login);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [serverError, setServerError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setEmailError("");
      setPasswordError("");
      setServerError("");
    }
  }, [open]);

  if (!open) {
    return null;
  }

  async function submit() {
    setEmailError("");
    setPasswordError("");
    setServerError("");

    let valid = true;
    if (!email.trim()) {
      setEmailError("이메일을 입력해 주세요.");
      valid = false;
    }
    if (!password) {
      setPasswordError("비밀번호를 입력해 주세요.");
      valid = false;
    }
    if (!valid) return;

    setBusy(true);
    try {
      await login(email.trim(), password, rememberMe);
      setEmail("");
      setPassword("");
      setRememberMe(false);
      onClose();
    } catch (error) {
      setPassword("");
      setServerError(toUserMessage(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modalBackdrop" role="presentation">
      <section
        className="featureModal signupModal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-title"
      >
        <button type="button" className="closeButton" onClick={onClose} aria-label="닫기">
          ×
        </button>
        <p className="modalKicker">MONGLE ACCOUNT</p>
        <h2 id="login-title">로그인</h2>

        <div className="signupSheet">
          <label>
            이메일
            <input
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setEmailError("");
              }}
              placeholder="user@example.com"
            />
            {emailError ? <span className="fieldError">{emailError}</span> : null}
          </label>
          <label>
            비밀번호
            <input
              type="password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setPasswordError("");
              }}
              placeholder="비밀번호"
            />
            {passwordError ? <span className="fieldError">{passwordError}</span> : null}
          </label>

          <label className="checkboxLabel">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(event) => setRememberMe(event.target.checked)}
            />
            자동 로그인
          </label>

          {serverError ? <p className="signupMessage">{serverError}</p> : null}

          <button type="button" className="primaryButton" onClick={submit} disabled={busy}>
            {busy ? "로그인 중..." : "로그인"}
          </button>

          <p className="signupCta">
            우리 처음보는건가?{" "}
            <button type="button" className="textLink" onClick={onSwitchToSignup}>
              회원가입
            </button>
          </p>
        </div>
      </section>
    </div>
  );
}
