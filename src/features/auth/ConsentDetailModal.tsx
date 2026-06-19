import { useBackdropDismiss } from "../../shared/ui/useBackdropDismiss.js";
import "./ConsentDetailModal.css";
import "./SignupModal.css";

type TableRow = { label: string; value: string };

export type ConsentDetail = {
  title: string;
  tag: string;
  tagReq: boolean;
  table: TableRow[];
  note: string;
};

export const PRIVACY_CONSENT: ConsentDetail = {
  title: "개인정보 수집·이용 동의",
  tag: "필수",
  tagReq: true,
  table: [
    {
      label: "수집 목적",
      value: "회원 가입 및 본인 확인, 서비스 제공, 고객 문의 응대",
    },
    {
      label: "수집 항목",
      value: "(필수) 이메일 주소, 닉네임, 직업, 생년월일",
    },
    {
      label: "보유 기간",
      value: "회원 탈퇴 시까지\n(단, 관련 법령에 따라 일정 기간 보존)",
    },
  ],
  note: "위 개인정보 수집·이용에 동의하지 않으실 수 있으나, 미동의 시 몽글마을 서비스 이용이 제한됩니다.",
};

export const AI_CONSENT: ConsentDetail = {
  title: "AI 학습 및 통계 활용 동의",
  tag: "선택",
  tagReq: false,
  table: [
    {
      label: "활용 목적",
      value: "AI 캐릭터 모델 성능 향상, 맞춤형 서비스 제공, 통계 분석",
    },
    {
      label: "활용 항목",
      value: "캐릭터 설정 정보(이름·성격·설명), 대화 내용, 서비스 이용 패턴",
    },
    {
      label: "보유 기간",
      value: "동의 철회 시까지",
    },
  ],
  note: "AI 학습 및 통계 활용 동의는 선택 사항으로, 동의하지 않으셔도 기본 서비스 이용에는 제한이 없습니다.",
};

type Props = {
  open: boolean;
  onClose: () => void;
  detail: ConsentDetail;
};

export function ConsentDetailModal({ open, onClose, detail }: Props) {
  const backdrop = useBackdropDismiss(onClose);

  if (!open) return null;

  return (
    <div className="cdmBackdrop" role="presentation" {...backdrop}>
      <section
        className="cdmModal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cdm-title"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <button type="button" className="suClose" onClick={onClose} aria-label="닫기">
          ✕
        </button>

        {/* 헤더 */}
        <div className="suEyebrow">
          <img
            src="/assets/icon/flower.png"
            alt=""
            style={{ width: 19, height: 19, flex: "none" }}
          />
          <span className="suEyebrowText">MONGLE ACCOUNT</span>
          <img
            src="/assets/icon/flower.png"
            alt=""
            style={{ width: 19, height: 19, flex: "none" }}
          />
          <div className="suEyebrowLine" />
        </div>

        <div className="suTitleRow">
          <img
            src="/assets/icon/sprout.png"
            alt=""
            style={{ width: 26, height: 26, flex: "none" }}
          />
          <h1 id="cdm-title" className="suTitle cdmTitle">
            {detail.title}
          </h1>
          <img
            src="/assets/icon/sprout.png"
            alt=""
            style={{ width: 26, height: 26, flex: "none", transform: "scaleX(-1)" }}
          />
        </div>

        <p className="suSubtitle">
          <span className={detail.tagReq ? "suAgreeTag--req" : "suAgreeTag--opt"}>
            ({detail.tag})
          </span>{" "}
          동의 내용을 확인해주세요.
        </p>

        <div className="suDivider">
          <div className="suDividerLine" />
          <img
            src="/assets/icon/flower.png"
            alt=""
            style={{ width: 20, height: 20, flex: "none" }}
          />
          <div className="suDividerLine" />
        </div>

        {/* 동의 내용 테이블 */}
        <div className="cdmTable">
          {detail.table.map((row) => (
            <div key={row.label} className="cdmRow">
              <div className="cdmRowLabel">{row.label}</div>
              <div className="cdmRowValue">{row.value}</div>
            </div>
          ))}
        </div>

        {/* 안내 */}
        <div className="cdmNote">
          <span className="cdmNoteStar">✿</span>
          <span>{detail.note}</span>
        </div>

        {/* 확인 버튼 */}
        <button type="button" className="suSubmitBtn" onClick={onClose}>
          <span className="suSubmitLabel">확인</span>
        </button>
      </section>
    </div>
  );
}
