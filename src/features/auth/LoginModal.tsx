import { useEffect, useRef, useState } from "react";
import "./LoginModal.css";
import { toUserMessage } from "./api.js";
import { type AuthState, useAuthStore } from "./store.js";

type LoginModalProps = {
  open: boolean;
  onClose: () => void;
  onSwitchToSignup: () => void;
  onResetPw: () => void;
};

export function LoginModal({ open, onClose, onSwitchToSignup, onResetPw }: LoginModalProps) {
  const login = useAuthStore((state: AuthState) => state.login);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [keep, setKeep] = useState(true);
  const [busy, setBusy] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [toast, setToast] = useState("");
  const toastTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (open) {
      setEmailError("");
      setToast("");
    }
  }, [open]);

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  if (!open) return null;

  function showToast(msg: string) {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2600);
  }

  async function submit() {
    setEmailError("");
    if (!email.trim() || !password.trim()) {
      showToast("이메일과 비밀번호를 입력해주세요");
      return;
    }
    setBusy(true);
    try {
      await login(email.trim(), password, keep);
      setEmail("");
      setPassword("");
      onClose();
    } catch (error) {
      setPassword("");
      showToast(toUserMessage(error));
    } finally {
      setBusy(false);
    }
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === "Enter") submit();
  }

  const eyeOpen = (
    <svg
      aria-hidden="true"
      width={22}
      height={22}
      viewBox="0 0 24 24"
      fill="none"
      stroke="#b79a6e"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx={12} cy={12} r={3} />
    </svg>
  );
  const eyeOff = (
    <svg
      aria-hidden="true"
      width={22}
      height={22}
      viewBox="0 0 24 24"
      fill="none"
      stroke="#b79a6e"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9.9 5.1A9.6 9.6 0 0 1 12 5c6.5 0 10 7 10 7a16 16 0 0 1-3.2 4M6.1 6.1C3.3 7.8 2 12 2 12s3.5 7 10 7a9.7 9.7 0 0 0 3.9-.8" />
      <path d="M3 3l18 18" />
    </svg>
  );

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: backdrop click-to-dismiss is intentional UX
    <div className="lgBackdrop" role="presentation" onClick={onClose}>
      <div
        className="lgCard"
        role="dialog"
        aria-modal="true"
        aria-labelledby="lg-title"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="lgHeader">
          <span className="lgTwinkle lgTwinkle--tl1">✦</span>
          <span className="lgTwinkle lgTwinkle--tl2">✦</span>
          <span className="lgTwinkle lgTwinkle--tr1">✦</span>
          <span className="lgTwinkle lgTwinkle--tr2">✦</span>
        </div>

        {/* HERO */}
        <div className="lgHero">
          <img src="/assets/auth/main.png" alt="몽글마을 친구들" />
        </div>

        {/* EMAIL */}
        <div className="lgField">
          <span className="lgFieldIcon">
            <svg
              aria-hidden="true"
              width={22}
              height={22}
              viewBox="0 0 24 24"
              fill="none"
              stroke="#c49a5e"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x={3} y={5} width={18} height={14} rx={3} />
              <path d="M4 7l8 6 8-6" />
            </svg>
          </span>
          <input
            className="lgInput"
            type="email"
            placeholder="이메일"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setEmailError("");
            }}
            onKeyDown={onKey}
            autoComplete="off"
          />
          {emailError && <span className="lgFieldError">{emailError}</span>}
        </div>

        {/* PASSWORD */}
        <div className="lgField">
          <span className="lgFieldIcon">
            <svg
              aria-hidden="true"
              width={22}
              height={22}
              viewBox="0 0 24 24"
              fill="none"
              stroke="#c49a5e"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x={4} y={10} width={16} height={11} rx={2.5} />
              <path d="M8 10V7a4 4 0 0 1 8 0v3" />
            </svg>
          </span>
          <input
            className="lgInput lgInput--pw"
            type={showPw ? "text" : "password"}
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={onKey}
            autoComplete="off"
          />
          <button
            type="button"
            className="lgEyeBtn"
            onClick={() => setShowPw((p) => !p)}
            aria-label="비밀번호 표시"
          >
            {showPw ? eyeOpen : eyeOff}
          </button>
        </div>

        {/* ROW */}
        <div className="lgRow">
          <button type="button" className="lgKeepBtn" onClick={() => setKeep((k) => !k)}>
            <span className={`lgCheckbox ${keep ? "lgCheckbox--on" : "lgCheckbox--off"}`}>
              {keep && <span className="lgCheckmark">✓</span>}
            </span>
            <span className="lgKeepLabel">로그인 상태 유지</span>
          </button>
          <div className="lgLinks">
            <button type="button" className="lgLinkBtn" onClick={onSwitchToSignup}>
              회원가입
            </button>
            <span className="lgLinkSep">|</span>
            <button type="button" className="lgLinkBtn" onClick={onResetPw}>
              비밀번호 찾기
            </button>
          </div>
        </div>

        {/* LOGIN BUTTON */}
        <button type="button" className="lgLoginBtn" onClick={submit} disabled={busy}>
          <span className="lgBtnFlower">✿</span>
          {busy && <span className="lgSpinner" />}
          <span className="lgBtnLabel">{busy ? "들어가는 중…" : "로그인"}</span>
          <span className="lgBtnFlower">✿</span>
        </button>

        {/* DIVIDER */}
        <div className="lgDivider">
          <div className="lgDividerLine" />
          <span className="lgDividerText">✼ 간편 로그인 ✼</span>
          <div className="lgDividerLine" />
        </div>

        {/* SOCIAL */}
        <div className="lgSocials">
          <button
            type="button"
            className="lgSocialBtn"
            onClick={() => showToast("Kakao(으)로 시작하기")}
          >
            <span className="lgSocialBadge--k">
              <span />
            </span>
            Kakao로 시작하기
          </button>
        </div>

        {/* FOOTER */}
        <div className="lgFooter">
          <span>✿</span>
          <span className="lgFooterText">작은 습관이 몽글한 하루를 만들어요</span>
          <span>✿</span>
        </div>

        <button type="button" className="lgClose" onClick={onClose} aria-label="닫기">
          ✕
        </button>
      </div>

      {toast && (
        <div className="lgToast">
          <span className="lgToastFlower">✿</span>
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}
