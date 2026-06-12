import { useState } from "react";
import {
  confirmEmailVerification,
  requestEmailVerification,
  signup as signupRequest,
  toUserMessage,
} from "./api.js";

type SignupStep = "form" | "code" | "verified";

type SignupModalProps = {
  open: boolean;
  onClose: () => void;
  onComplete: (notice: string) => void;
};

export function SignupModal({ open, onClose, onComplete }: SignupModalProps) {
  const [signupStep, setSignupStep] = useState<SignupStep>("form");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupCode, setSignupCode] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupPasswordConfirm, setSignupPasswordConfirm] = useState("");
  const [signupUserName, setSignupUserName] = useState("");
  const [signupJob, setSignupJob] = useState("");
  const [signupBirth, setSignupBirth] = useState("");
  const [signupServiceTermsAgreed, setSignupServiceTermsAgreed] = useState(false);
  const [signupPrivacyAgreed, setSignupPrivacyAgreed] = useState(false);
  const [signupAiConsent, setSignupAiConsent] = useState(false);
  const [signupMessage, setSignupMessage] = useState("");
  const [verificationToken, setVerificationToken] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  function ensureSignupRequiredFields() {
    if (
      !signupEmail.trim() ||
      !signupPassword ||
      !signupPasswordConfirm ||
      !signupUserName.trim()
    ) {
      setSignupMessage("이메일, 비밀번호, 비밀번호 확인, 닉네임을 모두 입력해 주세요.");
      return false;
    }
    if (!signupServiceTermsAgreed || !signupPrivacyAgreed) {
      setSignupMessage("필수 이용약관과 개인정보 수집·이용에 동의해야 가입할 수 있어요.");
      return false;
    }
    if (signupPassword !== signupPasswordConfirm) {
      setSignupMessage("비밀번호 확인이 일치하지 않아요.");
      return false;
    }
    return true;
  }

  async function requestSignupEmailVerification() {
    if (!signupEmail.trim()) {
      setSignupMessage("이메일을 먼저 입력해 주세요.");
      return;
    }

    setIsBusy(true);
    setSignupMessage("");
    try {
      await requestEmailVerification(signupEmail.trim());
      setSignupStep("code");
      setSignupMessage("인증 코드를 발송했어요. Django 콘솔 로그에서 코드를 확인해 주세요.");
    } catch (error) {
      setSignupMessage(toUserMessage(error));
    } finally {
      setIsBusy(false);
    }
  }

  async function confirmSignupEmailVerification() {
    if (!signupCode.trim()) {
      setSignupMessage("인증 코드를 입력해 주세요.");
      return;
    }

    setIsBusy(true);
    setSignupMessage("");
    try {
      const result = await confirmEmailVerification(
        signupEmail.trim(),
        signupCode.trim().toUpperCase(),
      );
      setVerificationToken(result.verification_token);
      setSignupStep("verified");
      setSignupMessage("이메일 인증이 완료됐어요. 입력값 확인 후 가입을 완료해 주세요.");
    } catch (error) {
      setSignupMessage(toUserMessage(error));
    } finally {
      setIsBusy(false);
    }
  }

  async function submitSignup() {
    if (!ensureSignupRequiredFields()) {
      return;
    }
    if (signupStep !== "verified") {
      setSignupMessage("이메일 인증을 먼저 완료해 주세요.");
      return;
    }

    setIsBusy(true);
    setSignupMessage("");
    try {
      const user = await signupRequest({
        email: signupEmail.trim(),
        password: signupPassword,
        user_name: signupUserName.trim(),
        job: signupJob.trim(),
        birth: signupBirth || "",
        is_aiconsent: signupAiConsent,
        verification_token: verificationToken,
      });
      onComplete(`${user.user_name}님 가입 완료! 시작 토큰 ${user.token_balance}개가 지급됐어요.`);
    } catch (error) {
      setSignupMessage(toUserMessage(error));
    } finally {
      setIsBusy(false);
    }
  }

  if (!open) {
    return null;
  }

  return (
    <div className="modalBackdrop" role="presentation">
      <section
        className="featureModal signupModal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="signup-title"
      >
        <button type="button" className="closeButton" onClick={onClose} aria-label="닫기">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
          </svg>
        </button>
        <p className="modalKicker">MONGLE ACCOUNT</p>
        <h2 id="signup-title">회원가입</h2>
        <p className="modalLine">이메일 인증 후 모든 입력값을 확인해 몽글마을 계정을 만들어요.</p>

        <div className="signupSheet">
          <label>
            이메일
            <span className="inlineAction">
              <input
                type="email"
                value={signupEmail}
                onChange={(event) => {
                  setSignupEmail(event.target.value);
                  setSignupStep("form");
                }}
                placeholder="user@example.com"
              />
              <button type="button" onClick={requestSignupEmailVerification} disabled={isBusy}>
                코드 발송
              </button>
            </span>
          </label>
          <label>
            인증 코드
            <span className="inlineAction">
              <input
                value={signupCode}
                maxLength={6}
                onChange={(event) => setSignupCode(event.target.value.toUpperCase())}
                placeholder="ABCDEF"
              />
              <button
                type="button"
                onClick={confirmSignupEmailVerification}
                disabled={isBusy || signupStep === "form"}
              >
                인증 확인
              </button>
            </span>
          </label>
          <div className="signupGrid">
            <label>
              비밀번호
              <input
                type="password"
                value={signupPassword}
                onChange={(event) => setSignupPassword(event.target.value)}
                placeholder="8~16자, 2종 이상 조합"
              />
            </label>
            <label>
              비밀번호 확인
              <input
                type="password"
                value={signupPasswordConfirm}
                onChange={(event) => setSignupPasswordConfirm(event.target.value)}
              />
            </label>
          </div>
          <label>
            닉네임
            <input
              value={signupUserName}
              maxLength={8}
              onChange={(event) => setSignupUserName(event.target.value)}
              placeholder="한글/영문/숫자 2~8자"
            />
          </label>
          <div className="signupGrid">
            <label>
              직업
              <input
                value={signupJob}
                onChange={(event) => setSignupJob(event.target.value)}
                placeholder="선택"
              />
            </label>
            <label>
              생년월일
              <input
                type="date"
                value={signupBirth}
                onChange={(event) => setSignupBirth(event.target.value)}
              />
            </label>
          </div>

          <div className="termsBox">
            <label>
              <input
                type="checkbox"
                checked={signupServiceTermsAgreed}
                onChange={(event) => setSignupServiceTermsAgreed(event.target.checked)}
              />
              이용약관에 동의합니다. (필수)
            </label>
            <label>
              <input
                type="checkbox"
                checked={signupPrivacyAgreed}
                onChange={(event) => setSignupPrivacyAgreed(event.target.checked)}
              />
              개인정보 수집·이용에 동의합니다. (필수)
            </label>
            <label>
              <input
                type="checkbox"
                checked={signupAiConsent}
                onChange={(event) => setSignupAiConsent(event.target.checked)}
              />
              AI 학습 및 통계 활용에 동의합니다. (선택)
            </label>
          </div>

          {signupMessage ? <p className="signupMessage">{signupMessage}</p> : null}

          <button type="button" className="primaryButton" onClick={submitSignup} disabled={isBusy}>
            {isBusy ? "처리 중..." : "확인"}
          </button>
        </div>
      </section>
    </div>
  );
}
