import { useEffect, useRef, useState } from "react";
import { JOB_OPTIONS as JOBS } from "../../shared/jobs.js";
import { useBackdropDismiss } from "../../shared/ui/useBackdropDismiss.js";
import { completeKakaoSignup, toUserMessage } from "./api.js";
import { AI_CONSENT, ConsentDetailModal, PRIVACY_CONSENT } from "./ConsentDetailModal.js";
import { useAuthStore } from "./store.js";
import "./SignupModal.css";

type Props = {
  open: boolean;
  signupToken: string;
  onClose: () => void;
  onComplete: () => void;
};

export function KakaoOnboardingModal({ open, signupToken, onClose, onComplete }: Props) {
  const [nick, setNick] = useState("");
  const [job, setJob] = useState("");
  const [birth, setBirth] = useState("");
  const [agree, setAgree] = useState({ terms: false, privacy: false, ai: false });
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState("");
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!open) {
      setNick("");
      setJob("");
      setBirth("");
      setAgree({ terms: false, privacy: false, ai: false });
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

  async function handleSubmit() {
    if (submitting) return;
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
      const data = await completeKakaoSignup({
        signup_token: signupToken,
        user_name: nickTrimmed,
        job: job.trim(),
        birth,
        is_aiconsent: agree.ai,
      });
      useAuthStore.getState().setSocialSession(data);
      onComplete();
    } catch (error) {
      showToast(toUserMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  const backdrop = useBackdropDismiss(onClose);
  if (!open) return null;

  return (
    <>
      <div className="modalBackdrop suBackdrop" role="presentation" {...backdrop}>
        <section
          className="suModal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="ko-title"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <button type="button" className="suClose" onClick={onClose} aria-label="닫기">
            ✕
          </button>

          <div className="suTitleRow">
            <img src="/assets/auth/sprout.png" alt="" className="suTitleImg" />
            <h1 id="ko-title" className="suTitle">
              추가 정보 입력
            </h1>
            <img src="/assets/auth/sprout.png" alt="" className="suTitleImg suMirror" />
          </div>

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
              <input
                className={`suInput suDateInput${birth ? " filled" : ""}`}
                type="date"
                value={birth}
                onChange={(e) => setBirth(e.target.value)}
              />
            </div>
          </div>

          <div className="suAgreeBox suSection">
            <div className="suAgreeList">
              <div className="suAgreeRow">
                <button
                  type="button"
                  className="suAgreeToggle"
                  onClick={() => setAgree((p) => ({ ...p, terms: !p.terms }))}
                >
                  <span className={`suCheckbox${agree.terms ? " suCheckbox--on" : ""}`}>
                    {agree.terms && <span className="suCheckmark">✓</span>}
                  </span>
                  <span className="suAgreeLabel">
                    만 14세 이상입니다. <span className="suAgreeTag--req">(필수)</span>
                  </span>
                </button>
              </div>
              <div className="suAgreeRow">
                <button
                  type="button"
                  className="suAgreeToggle"
                  onClick={() => setAgree((p) => ({ ...p, privacy: !p.privacy }))}
                >
                  <span className={`suCheckbox${agree.privacy ? " suCheckbox--on" : ""}`}>
                    {agree.privacy && <span className="suCheckmark">✓</span>}
                  </span>
                  <span className="suAgreeLabel">
                    개인정보 수집·이용에 동의합니다. <span className="suAgreeTag--req">(필수)</span>
                  </span>
                </button>
                <button
                  type="button"
                  className="suAgreeViewBtn"
                  onClick={() => setPrivacyOpen(true)}
                >
                  보기
                </button>
              </div>
              <div className="suAgreeRow">
                <button
                  type="button"
                  className="suAgreeToggle"
                  onClick={() => setAgree((p) => ({ ...p, ai: !p.ai }))}
                >
                  <span className={`suCheckbox${agree.ai ? " suCheckbox--on" : ""}`}>
                    {agree.ai && <span className="suCheckmark">✓</span>}
                  </span>
                  <span className="suAgreeLabel">
                    AI 학습 및 통계 활용에 동의합니다.{" "}
                    <span className="suAgreeTag--opt">(선택)</span>
                  </span>
                </button>
                <button type="button" className="suAgreeViewBtn" onClick={() => setAiOpen(true)}>
                  보기
                </button>
              </div>
            </div>
          </div>

          <button
            type="button"
            className="suSubmitBtn"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting && <span className="suSpinner suSpinner--lg" />}
            <span className="suSubmitLabel">
              {submitting ? "시작하는 중…" : "몽글마을 시작하기"}
            </span>
          </button>
        </section>

        {toast && (
          <div className="suToast">
            <span className="suToastFlower">✿</span>
            {toast}
          </div>
        )}
      </div>
      <ConsentDetailModal
        open={privacyOpen}
        onClose={() => setPrivacyOpen(false)}
        detail={PRIVACY_CONSENT}
      />
      <ConsentDetailModal open={aiOpen} onClose={() => setAiOpen(false)} detail={AI_CONSENT} />
    </>
  );
}
