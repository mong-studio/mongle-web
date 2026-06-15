import { useEffect, useRef, useState } from "react";
import {
  confirmEmailVerification,
  requestEmailVerification,
  signup as signupRequest,
  toUserMessage,
} from "./api.js";
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
  { k: "terms" as const, label: "만 14세 이상입니다.", tag: "(필수)", req: true },
  { k: "privacy" as const, label: "개인정보 수집·이용에 동의합니다.", tag: "(필수)", req: true },
  { k: "ai" as const, label: "AI 학습 및 통계 활용에 동의합니다.", tag: "(선택)", req: false },
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
  const [verified, setVerified] = useState(false);
  const [verificationToken, setVerificationToken] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [agree, setAgree] = useState({ terms: false, privacy: false, ai: false });
  const [toast, setToast] = useState("");
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
      await requestEmailVerification(email.trim());
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
    if (pw.length < 8) {
      showToast("비밀번호는 8자 이상이어야 해요");
      return;
    }
    if (pw !== pw2) {
      showToast("비밀번호가 일치하지 않아요");
      return;
    }
    if (nick.trim().length < 2) {
      showToast("닉네임을 2자 이상 입력해주세요");
      return;
    }
    if (!job) {
      showToast("직업을 선택해주세요");
      return;
    }
    if (!birth) {
      showToast("생년월일을 입력해주세요");
      return;
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
    <div className="suBackdrop" role="presentation">
      <section className="suModal" role="dialog" aria-modal="true" aria-labelledby="su-title">
        <button type="button" className="suClose" onClick={onClose} aria-label="닫기">
          ✕
        </button>

        {/* Eyebrow */}
        <div className="suEyebrow">
          <img
            src="/assets/auth/flower.png"
            alt=""
            style={{ width: 19, height: 19, flex: "none" }}
          />
          <span className="suEyebrowText">MONGLE ACCOUNT</span>
          <img
            src="/assets/auth/flower.png"
            alt=""
            style={{ width: 19, height: 19, flex: "none" }}
          />
          <div className="suEyebrowLine" />
        </div>

        {/* Title */}
        <div className="suTitleRow">
          <img
            src="/assets/auth/sprout.png"
            alt=""
            style={{ width: 26, height: 26, flex: "none" }}
          />
          <h1 id="su-title" className="suTitle">
            회원가입
          </h1>
          <img
            src="/assets/auth/sprout.png"
            alt=""
            style={{ width: 26, height: 26, flex: "none", transform: "scaleX(-1)" }}
          />
        </div>
        <p className="suSubtitle">이메일 인증 후 계정을 만들어 몽글마을을 방문해봐요!</p>

        {/* Divider */}
        <div className="suDivider">
          <div className="suDividerLine" />
          <img
            src="/assets/auth/flower.png"
            alt=""
            style={{ width: 20, height: 20, flex: "none" }}
          />
          <div className="suDividerLine" />
        </div>

        {/* Email */}
        <div className="suLabel">
          <img
            src="/assets/auth/flower.png"
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
            placeholder="user@example.com"
          />
          <button type="button" className="suAmberBtn" onClick={handleSendCode} disabled={sending}>
            {sending && <span className="suSpinner" />}
            <img
              src="/assets/auth/flower.png"
              alt=""
              style={{ width: 23, height: 23, flex: "none" }}
            />
            {sending ? "발송 중…" : "코드 발송"}
          </button>
        </div>

        {/* Verification code */}
        <div className="suLabel suSection">
          <img
            src="/assets/auth/flower.png"
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
              src="/assets/auth/flower.png"
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

        {/* Password 2-col */}
        <div className="suGrid2 suSection">
          <div>
            <div className="suLabel">
              <img
                src="/assets/auth/flower.png"
                alt=""
                style={{ width: 23, height: 23, flex: "none" }}
              />
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
              <img
                src="/assets/auth/flower.png"
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

        {/* Nickname */}
        <div className="suLabel suSection">
          <img
            src="/assets/auth/flower.png"
            alt=""
            style={{ width: 23, height: 23, flex: "none" }}
          />
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
              <img
                src="/assets/auth/flower.png"
                alt=""
                style={{ width: 23, height: 23, flex: "none" }}
              />
              직업
            </div>
            <div className="suSelectWrap">
              <select
                className={`suSelect${!job ? " suSelect--placeholder" : ""}`}
                value={job}
                onChange={(e) => setJob(e.target.value)}
              >
                <option value="" disabled>
                  선택
                </option>
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
              <img
                src="/assets/auth/flower.png"
                alt=""
                style={{ width: 23, height: 22, flex: "none" }}
              />
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
                  stroke="#C49A5E"
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
          <img src="/assets/auth/flower3.png" alt="" className="suAgreeCorner suAgreeCorner--bl" />
          <img src="/assets/auth/flower3.png" alt="" className="suAgreeCorner suAgreeCorner--br" />
          <div className="suAgreeList">
            {AGREEMENTS.map(({ k, label, tag, req }) => (
              <button key={k} type="button" className="suAgreeRow" onClick={() => toggleAgree(k)}>
                <span className={`suCheckbox${agree[k] ? " suCheckbox--on" : ""}`}>
                  {agree[k] && <span className="suCheckmark">✓</span>}
                </span>
                <span className="suAgreeLabel">
                  {label} <span className={req ? "suAgreeTag--req" : "suAgreeTag--opt"}>{tag}</span>
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Submit */}
        <button type="button" className="suSubmitBtn" onClick={handleSubmit} disabled={submitting}>
          {/* <img
            src="/assets/auth/su-bigflower.png"
            alt=""
            style={{ width: 26, height: 26, flex: "none" }}
          /> */}
          {submitting && <span className="suSpinner suSpinner--lg" />}
          <span className="suSubmitLabel">{submitting ? "가입하는 중…" : "회원가입"}</span>
          {/* <img
            src="/assets/auth/su-bigflower.png"
            alt=""
            style={{ width: 26, height: 26, flex: "none", transform: "scaleX(-1)" }}
          /> */}
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
