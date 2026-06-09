import { useState } from "react";
import { toUserMessage } from "./api.js";
import { useAuthStore, type AuthState } from "./store.js";

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
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  if (!open) {
    return null;
  }

  async function submit() {
    if (!email.trim() || !password) {
      setMessage("이메일과 비밀번호를 모두 입력해 주세요.");
      return;
    }

    setBusy(true);
    setMessage("");
    try {
      await login(email.trim(), password, rememberMe);
      setEmail("");
      setPassword("");
      setRememberMe(false);
      onClose();
    } catch (error) {
      setMessage(toUserMessage(error));
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
          x
        </button>
        <p className="modalKicker">MONGLE ACCOUNT</p>
        <h2 id="login-title">로그인</h2>
        <p className="modalLine">몽글마을 계정으로 로그인하고 마을로 들어가요.</p>

        <div className="signupSheet">
          <label>
            이메일
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="user@example.com"
            />
          </label>
          <label>
            비밀번호
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="비밀번호"
            />
          </label>

          <label>
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(event) => setRememberMe(event.target.checked)}
            />
            자동 로그인
          </label>

          {message ? <p className="signupMessage">{message}</p> : null}

          <button type="button" className="primaryButton" onClick={submit} disabled={busy}>
            {busy ? "로그인 중..." : "로그인"}
          </button>

          <p className="modalLine">
            계정이 없어요{" "}
            <button type="button" className="inlineAction" onClick={onSwitchToSignup}>
              회원가입
            </button>
          </p>
        </div>
      </section>
    </div>
  );
}
