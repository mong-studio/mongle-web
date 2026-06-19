import { useEffect, useRef, useState } from "react";
import {
  confirmEmailVerification,
  requestEmailVerification,
  signup as signupRequest,
  toUserMessage,
} from "./api.js";
import { AI_CONSENT, ConsentDetailModal, PRIVACY_CONSENT } from "./ConsentDetailModal.js";
import "./SignupModal.css";

const JOBS = [
  "학생",
  "직장인",
  "프리랜서",
  "자영업",
  "주부",
  "기획자",
  "개발자",
  "디자이너",
  "기타",
];

const AGREEMENTS = [
  { k: "terms" as const, label: "만 14세 이상입니다.", tag: "(필수)", req: true, detail: null },
  {
    k: "privacy" as const,
    label: "개인정보 수집·이용에 동의합니다.",
    tag: "(필수)",
    req: true,
    detail: "privacy" as const,
  },
  {
    k: "ai" as const,
    label: "AI 학습 및 통계 활용에 동의합니다.",
    tag: "(선택)",
    req: false,
    detail: "ai" as const,
  },
];

type SignupModalProps = {
  open: boolean;
  onClose: () => void;
  onComplete: (notice: string) => void;
};

export function SignupModal({ open, onClose, onComplete }: SignupModalProps) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [nick, setNick] = useState("");
  const [job, setJob] = useState("");
  const [birth, setBirth] = useState("");
  const [sending, setSending] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval>>();
  const [codeTimer, setCodeTimer] = useState(0);
  const codeTimerRef = useRef<ReturnType<typeof setInterval>>();
  const [verified, setVerified] = useState(false);
  const [verificationToken, setVerificationToken] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [agree, setAgree] = useState({ terms: false, privacy: false, ai: false });
  const [toast, setToast] = useState("");
  const [privacyDetailOpen, setPrivacyDetailOpen] = useState(false);
  const [aiDetailOpen, setAiDetailOpen] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!open) {
      setEmail("");
      setCode("");
      setPw("");
      setPw2("");
      setNick("");
      setJob("");
      setBirth("");
      setSending(false);
      setCodeSent(false);
      setVerified(false);
      setVerificationToken("");
      setSubmitting(false);
      setAgree({ terms: false, privacy: false, ai: false });
      setToast("");
      setPrivacyDetailOpen(false);
      setAiDetailOpen(false);
      clearTimeout(toastTimer.current);
      clearInterval(cooldownRef.current);
      setCooldown(0);
      clearInterval(codeTimerRef.current);
      setCodeTimer(0);
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
      await requestEmailVerification(email.trim());
      setCodeSent(true);
      showToast("인증 코드를 보냈어요! 메일함을 확인해주세요");
      setCooldown(30);
      cooldownRef.current = setInterval(() => {
        setCooldown((c) => {
          if (c <= 1) {
            clearInterval(cooldownRef.current);
            return 0;
          }
          return c - 1;
        });
      }, 1000);
      clearInterval(codeTimerRef.current);
      setCodeTimer(180);
      codeTimerRef.current = setInterval(() => {
        setCodeTimer((t) => {
          if (t <= 1) {
            clearInterval(codeTimerRef.current);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
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
      const result = await confirmEmailVerification(email.trim(), code.trim().toUpperCase());
      setVerificationToken(result.verification_token);
      setVerified(true);
      showToast("이메일 인증 완료! ✿");
    } catch (err) {
      showToast(toUserMessage(err));
    }
  }

  function toggleAgree(k: keyof typeof agree) {
    setAgree((prev) => ({ ...prev, [k]: !prev[k] }));
  }

  async function handleSubmit() {
    if (submitting) return;
    if (!verified) {
      showToast("이메일 인증을 먼저 완료해주세요");
      return;
    }
    if (pw.includes(" ")) {
      showToast("비밀번호에 공백을 포함할 수 없어요");
      return;
    }
    if (pw.length < 8 || pw.length > 16) {
      showToast("비밀번호는 8~16자로 입력해주세요");
      return;
    }
    const pwTypeCount = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^a-zA-Z0-9]/].filter((r) =>
      r.test(pw),
    ).length;
    if (pwTypeCount < 2) {
      showToast("대문자·소문자·숫자·특수문자 중 2종류 이상을 포함해주세요");
      return;
    }
    if (pw !== pw2) {
      showToast("비밀번호가 일치하지 않아요");
      return;
    }
    const nickTrimmed = nick.trim();
    if (nickTrimmed.length < 2 || nickTrimmed.length > 8) {
      showToast("닉네임은 2~8자로 입력해주세요");
      return;
    }
    if (!/^[가-힣a-zA-Z0-9]+$/.test(nickTrimmed)) {
      showToast("닉네임은 한글·영문·숫자만 사용할 수 있어요");
      return;
    }
    if (!birth) {
      showToast("생년월일을 입력해주세요");
      return;
    }
    {
      const today = new Date();
      const b = new Date(birth);
      let age = today.getFullYear() - b.getFullYear();
      const m = today.getMonth() - b.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < b.getDate())) age--;
      if (age < 14) {
        showToast("생년월일을 확인해 주세요 (만 14세 이상 가입 가능)");
        return;
      }
    }
    if (!agree.terms || !agree.privacy) {
      showToast("필수 약관에 동의해주세요");
      return;
    }
    setSubmitting(true);
    try {
      const user = await signupRequest({
        email: email.trim(),
        password: pw,
        user_name: nick.trim(),
        job: job.trim(),
        birth,
        is_aiconsent: agree.ai,
        verification_token: verificationToken,
      });
      onComplete(`${user.user_name}님 가입 완료! 시작 토큰 ${user.token_balance}개가 지급됐어요.`);
    } catch (err) {
      showToast(toUserMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <>
      {
        // biome-ignore lint/a11y/noStaticElementInteractions: backdrop click-to-dismiss is intentional UX
        <div
          className="modalBackdrop suBackdrop"
          role="presentation"
          onClick={(event) => {
            if (event.target === event.currentTarget) onClose();
          }}
        >
          <section
            className="suModal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="su-title"
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
          >
            <button type="button" className="suClose" onClick={onClose} aria-label="닫기">
              ✕
            </button>

            {/* Eyebrow */}
            <div className="suEyebrow">
              <img src="/assets/auth/flower.png" alt="" className="suEyebrowImg" />
              <span className="suEyebrowText">MONGLE ACCOUNT</span>
              <img src="/assets/auth/flower.png" alt="" className="suEyebrowImg" />
              <div className="suEyebrowLine" />
            </div>

            {/* Title */}
            <div className="suTitleRow">
              <img src="/assets/auth/sprout.png" alt="" className="suTitleImg" />
              <h1 id="su-title" className="suTitle">
                회원가입
              </h1>
              <img src="/assets/auth/sprout.png" alt="" className="suTitleImg suMirror" />
            </div>

            {/* Divider */}
            <div className="suDivider">
              <div className="suDividerLine" />
              <img src="/assets/auth/flower.png" alt="" className="suDividerImg" />
              <div className="suDividerLine" />
            </div>

            {/* Email */}
            <div className="suLabel suLabel--between">
              <span className="suLabelInner">
                <img src="/assets/auth/flower.png" alt="" className="suLabelImg" />
                이메일
              </span>
              {cooldown > 0 && <span className="suLabelStatus">{cooldown}초 후 재발송</span>}
            </div>
            <div className="suInlineRow">
              <input
                className="suInput"
                type="email"
                value={email}
                autoComplete="off"
                disabled={verified}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setVerified(false);
                  setCodeSent(false);
                }}
                placeholder="user@example.com"
              />
              <button
                type="button"
                className="suAmberBtn suSendBtn"
                onClick={handleSendCode}
                disabled={sending || cooldown > 0 || verified}
              >
                {sending ? "발송 중…" : "코드 발송"}
              </button>
            </div>

            {/* Verification code */}
            <div className="suLabel suLabel--between suSection">
              <span className="suLabelInner">
                <img src="/assets/auth/flower.png" alt="" className="suLabelImg" />
                인증 코드
              </span>
              {codeSent &&
                !verified &&
                (codeTimer > 0 ? (
                  <span
                    className={`suLabelStatus${codeTimer <= 30 ? " suLabelStatus--warning" : ""}`}
                  >
                    {String(Math.floor(codeTimer / 60)).padStart(2, "0")}:
                    {String(codeTimer % 60).padStart(2, "0")} 남음
                  </span>
                ) : (
                  <span className="suLabelStatus suLabelStatus--warning">
                    시간 초과 · 코드를 재발송해주세요
                  </span>
                ))}
              {verified && (
                <span className="suLabelStatus suLabelStatus--success">✓ 인증 완료</span>
              )}
            </div>
            <div className="suInlineRow">
              <input
                className={`suInput suInput--code${verified ? " suInput--verified" : ""}`}
                value={code}
                maxLength={6}
                autoComplete="one-time-code"
                disabled={verified}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="ABCDEF"
              />
              <button
                type="button"
                className="suAmberBtn"
                onClick={handleVerifyCode}
                disabled={verified}
              >
                인증 확인
              </button>
            </div>

            {/* Password 2-col */}
            <div className="suGrid2 suSection">
              <div>
                <div className="suLabel">
                  <img src="/assets/auth/flower.png" alt="" className="suLabelImg" />
                  비밀번호
                </div>
                <input
                  className="suInput"
                  type="password"
                  value={pw}
                  autoComplete="new-password"
                  onChange={(e) => setPw(e.target.value)}
                  placeholder="8~16자, 2종 이상 조합"
                />
              </div>
              <div>
                <div className="suLabel">
                  <img src="/assets/auth/flower.png" alt="" className="suLabelImg" />
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

            {/* Nickname */}
            <div className="suLabel suSection">
              <img src="/assets/auth/flower.png" alt="" className="suLabelImg" />
              닉네임
            </div>
            <input
              className="suInput"
              value={nick}
              maxLength={8}
              onChange={(e) => setNick(e.target.value)}
              placeholder="한글/영문/숫자 2~8자"
            />

            {/* Job + Birth 2-col */}
            <div className="suGrid2 suSection">
              <div>
                <div className="suLabel">
                  <img src="/assets/auth/flower.png" alt="" className="suLabelImg" />
                  직업 <span className="suOptionalBadge">(선택)</span>
                </div>
                <div className="suSelectWrap">
                  <select
                    className={`suSelect${!job ? " suSelect--placeholder" : ""}`}
                    value={job}
                    onChange={(e) => setJob(e.target.value)}
                  >
                    <option value="">선택</option>
                    {JOBS.map((j) => (
                      <option key={j} value={j}>
                        {j}
                      </option>
                    ))}
                  </select>
                  <span className="suSelectCaret">▼</span>
                </div>
              </div>
              <div>
                <div className="suLabel">
                  <img src="/assets/auth/flower.png" alt="" className="suLabelImg" />
                  생년월일
                </div>
                <div className="suDateWrap">
                  <input
                    className={`suInput suDateInput${birth ? " filled" : ""}`}
                    type="date"
                    value={birth}
                    onChange={(e) => setBirth(e.target.value)}
                  />
                  <span className="suDateCaret">
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <rect x="3" y="4.5" width="18" height="17" rx="3" />
                      <path d="M3 9h18M8 2.5v4M16 2.5v4" />
                    </svg>
                  </span>
                </div>
              </div>
            </div>

            {/* Agreements */}
            <div className="suAgreeBox">
              <img src="/assets/auth/bear.png" alt="" className="suAgreeCorner suAgreeCorner--tl" />
              <img src="/assets/auth/bear.png" alt="" className="suAgreeCorner suAgreeCorner--tr" />
              <img
                src="/assets/auth/flower3.png"
                alt=""
                className="suAgreeCorner suAgreeCorner--bl"
              />
              <img
                src="/assets/auth/flower3.png"
                alt=""
                className="suAgreeCorner suAgreeCorner--br"
              />
              <div className="suAgreeList">
                {AGREEMENTS.map(({ k, label, tag, req, detail }) => (
                  <div key={k} className="suAgreeRow">
                    <button type="button" className="suAgreeToggle" onClick={() => toggleAgree(k)}>
                      <span className={`suCheckbox${agree[k] ? " suCheckbox--on" : ""}`}>
                        {agree[k] && <span className="suCheckmark">✓</span>}
                      </span>
                      <span className="suAgreeLabel">
                        {label}{" "}
                        <span className={req ? "suAgreeTag--req" : "suAgreeTag--opt"}>{tag}</span>
                      </span>
                    </button>
                    {detail && (
                      <button
                        type="button"
                        className="suAgreeViewBtn"
                        onClick={() =>
                          detail === "privacy" ? setPrivacyDetailOpen(true) : setAiDetailOpen(true)
                        }
                      >
                        보기
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Submit */}
            <button
              type="button"
              className="suSubmitBtn"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting && <span className="suSpinner suSpinner--lg" />}
              <span className="suSubmitLabel">{submitting ? "가입하는 중…" : "회원가입"}</span>
            </button>
          </section>

          {toast && (
            <div className="suToast">
              <span className="suToastFlower">✿</span>
              {toast}
            </div>
          )}
        </div>
      }
      <ConsentDetailModal
        open={privacyDetailOpen}
        onClose={() => setPrivacyDetailOpen(false)}
        detail={PRIVACY_CONSENT}
      />
      <ConsentDetailModal
        open={aiDetailOpen}
        onClose={() => setAiDetailOpen(false)}
        detail={AI_CONSENT}
      />
    </>
  );
}
