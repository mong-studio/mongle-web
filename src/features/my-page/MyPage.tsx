import { useEffect, useRef, useState } from "react";
import type { Resident } from "../../app/model/appTypes.js";
import { ChangePasswordModal } from "./ChangePasswordModal.js";
import { CharacterDetail } from "./CharacterDetail.js";
import "./MyPage.css";

type Props = {
  userName: string;
  userEmail: string;
  userJob: string;
  userBirth: string;
  joinDate: string;
  tokenBalance: number;
  residents: Resident[];
  onClose: () => void;
  onWithdraw: () => void;
  onMoveOut: (characterId: string) => void;
  onUpdateProfile: (nickname: string, job: string, birth: string) => Promise<void>;
  onUpdatePassword: (current: string, next: string) => Promise<void>;
  loginType: string;
};

const JOB_OPTIONS = [
  "회사원",
  "전문직 (의사, 변호사, 회계사 등)",
  "사업자/자영업자",
  "공무원/교직원",
  "프리랜서",
  "학생",
  "주부",
  "무직/기타",
] as const;

const CHIP_COLORS = [
  { bg: "#f8d9df", fg: "#c56b7d" },
  { bg: "#dcebc2", fg: "#6e9a47" },
  { bg: "#fbe0c5", fg: "#c0763e" },
  { bg: "#cfe6f2", fg: "#3e7c9a" },
  { bg: "#e4d9f1", fg: "#8268b0" },
  { bg: "#fbe7a8", fg: "#b07f1e" },
];

const AV_COLORS = [
  "#E9B782",
  "#C9D2DE",
  "#F6E6EC",
  "#D8C2A0",
  "#D9B38C",
  "#C8A6E6",
  "#B8D4B8",
  "#F0D090",
];

function fmtBirth(b: string) {
  if (!b) return "—";
  const d = new Date(b);
  if (Number.isNaN(d.getTime())) return b;
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
}

function parseKeywords(s: string) {
  return s
    .split(/[,，\s]+/)
    .filter(Boolean)
    .slice(0, 3);
}

export function MyPageModal({
  userName,
  userEmail,
  userJob,
  userBirth,
  tokenBalance,
  residents,
  onClose,
  onWithdraw,
  onMoveOut,
  onUpdateProfile,
  onUpdatePassword,
  loginType,
}: Props) {
  const [changePwOpen, setChangePwOpen] = useState(false);
  const [editingInfo, setEditingInfo] = useState(false);
  const [nicknameDraft, setNicknameDraft] = useState(userName);
  const [jobDraft, setJobDraft] = useState(userJob);
  const [birthDraft, setBirthDraft] = useState(userBirth);
  const [profileIdx, setProfileIdx] = useState<number | null>(null);
  const [toast, setToast] = useState("");
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    },
    [],
  );

  useEffect(() => {
    setNicknameDraft(userName);
    setJobDraft(userJob);
    setBirthDraft(userBirth);
  }, [userName, userJob, userBirth]);

  async function handleSaveInfo() {
    // 닉네임 규정은 회원가입과 동일하게: 2~8자, 한글·영문·숫자만.
    const nickTrimmed = nicknameDraft.trim();
    if (nickTrimmed.length < 2 || nickTrimmed.length > 8) {
      showToast("닉네임은 2~8자로 입력해주세요");
      return;
    }
    if (!/^[가-힣a-zA-Z0-9]+$/.test(nickTrimmed)) {
      showToast("닉네임은 한글·영문·숫자만 사용할 수 있어요");
      return;
    }
    await onUpdateProfile(nickTrimmed, jobDraft, birthDraft);
    setEditingInfo(false);
    showToast("기본 정보가 저장되었어요!");
  }

  function showToast(msg: string) {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2600);
  }

  const activeRes = profileIdx !== null ? residents[profileIdx] : null;

  return (
    <>
      <div className="mpPage">
        <header className="mpHeader">
          <div className="mpHeaderBrand">
            <img src="/assets/auth/main.png" alt="" className="mpBrandLogo" />
            <span className="mpBrandStar">✦</span>
          </div>

          <button type="button" className="mpGoVillage" onClick={onClose}>
            <img src="/assets/icon/house.png" alt="" />
            마을로 가기
          </button>

          <div className="mpHeaderRight">
            <div className="mpTokenChip" role="status" aria-label={`보유 사과 ${tokenBalance}개`}>
              <img
                src="/assets/icon/icon-apple.png"
                alt=""
                className="mpTokenIcon"
                aria-hidden="true"
              />
              <b className="mpTokenCount">{tokenBalance}</b>
            </div>
          </div>
        </header>
        <div className="mpContainer">
          {/* ── 타이틀 ── */}
          <div className="mpTitleRow">
            <div className="mpTitleCenter">
              <div className="mpTitleLine">
                <span className="mpTitleStar mpStarY">✦</span>
                <h1 className="mpTitle">마이페이지</h1>
                <span className="mpTitleStar mpStarG">✦</span>
              </div>
              <p className="mpSubtitle">나의 마을과 나를 소개해요</p>
            </div>
          </div>

          <div className="mpBody">
            {/* ── 왼쪽: 내 주민들 리스트 ── */}
            <div className="mpResSection">
              <div className="mpResSectionHead">
                <div className="mpResHeadLeft">
                  <span className="mpResHeadStar">✿</span>
                  <span>내 주민들</span>
                  <span className="mpResHeadStar">✿</span>
                </div>
                <span className="mpResCount">{residents.length} / 10</span>
              </div>
              {residents.length === 0 ? (
                <div className="mpResEmpty">
                  <p>아직 마을 주민이 없어요</p>
                  <em>새 친구를 만들어보세요!</em>
                </div>
              ) : (
                <div className="mpResList">
                  {residents.map((r, i) => (
                    <div key={r.id} className="mpResListItem">
                      <div className="mpResListImgWrap">
                        {r.avatarUrl ? (
                          <img src={r.avatarUrl} alt={r.name} className="mpResListImg" />
                        ) : (
                          <div
                            className="mpResListAv"
                            style={{ background: AV_COLORS[i % AV_COLORS.length] }}
                          >
                            {r.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="mpResListInfo">
                        <div className="mpResListName">{r.name}</div>
                        <div className="mpResChips">
                          {parseKeywords(r.personality)
                            .slice(0, 1)
                            .map((kw, ki) => (
                              <span
                                key={kw}
                                className="mpResChip"
                                style={{
                                  background: CHIP_COLORS[ki % CHIP_COLORS.length].bg,
                                  color: CHIP_COLORS[ki % CHIP_COLORS.length].fg,
                                }}
                              >
                                {kw}
                              </span>
                            ))}
                        </div>
                      </div>
                      <button
                        type="button"
                        className="mpResProfileBtn"
                        onClick={() => setProfileIdx(i)}
                      >
                        보기
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── 오른쪽: 기본 정보 + 계정 설정 ── */}
            <div className="mpRightCol">
              {/* 기본 정보 카드 */}
              <div className="mpInfoCard">
                <div className="mpSecHead">
                  <span className="mpSecFleur">✿</span>
                  <span>기본 정보</span>
                  <span className="mpSecFleur">✿</span>
                  {!editingInfo ? (
                    <button
                      type="button"
                      className="mpInfoEditBtn"
                      onClick={() => setEditingInfo(true)}
                    >
                      <img src="/assets/icon/pencil.png" alt="" className="mpEditIcon" />
                      수정
                    </button>
                  ) : (
                    <div className="mpInfoEditActions">
                      <button
                        type="button"
                        className="mpInfoSaveBtn"
                        onClick={() => void handleSaveInfo()}
                      >
                        저장
                      </button>
                      <button
                        type="button"
                        className="mpInfoCancelBtn"
                        onClick={() => {
                          setNicknameDraft(userName);
                          setJobDraft(userJob);
                          setBirthDraft(userBirth);
                          setEditingInfo(false);
                        }}
                      >
                        취소
                      </button>
                    </div>
                  )}
                </div>
                <div className="mpInfoRows">
                  <div className="mpInfoRow">
                    <img src="/assets/icon/mail.png" alt="" className="mpInfoIcon" />
                    <span className="mpInfoLabel">이메일</span>
                    <span className="mpInfoVal mpInfoVal">{userEmail || "—"}</span>
                  </div>
                  <div className="mpInfoRow">
                    <img src="/assets/myPage/yellow-bear.png" alt="" className="mpInfoIcon" />
                    <span className="mpInfoLabel">닉네임</span>
                    {editingInfo ? (
                      <input
                        className="mpInfoTextInput"
                        type="text"
                        value={nicknameDraft}
                        maxLength={8}
                        onChange={(e) => setNicknameDraft(e.target.value)}
                      />
                    ) : (
                      <span className="mpInfoVal">{userName}</span>
                    )}
                  </div>
                  <div className="mpInfoRow">
                    <img src="/assets/myPage/bag.png" alt="" className="mpInfoIcon" />
                    <span className="mpInfoLabel">직업</span>
                    {editingInfo ? (
                      <select
                        className="mpInfoSelect"
                        value={jobDraft}
                        onChange={(e) => setJobDraft(e.target.value)}
                      >
                        {JOB_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="mpInfoVal">{userJob || "—"}</span>
                    )}
                  </div>
                  <div className="mpInfoRow">
                    <img src="/assets/icon/calendar.png" alt="" className="mpInfoIcon" />
                    <span className="mpInfoLabel">생년월일</span>
                    <span className="mpInfoVal">{fmtBirth(userBirth)}</span>
                  </div>
                </div>
              </div>

              {/* 계정 설정 카드 */}
              <div className="mpSettingsCard">
                <div className="mpSecHead">
                  <span className="mpSecFleur">✿</span>
                  <span>계정 설정</span>
                  <span className="mpSecFleur">✿</span>
                </div>
                {loginType !== "kakao" && (
                  <button
                    type="button"
                    className="mpSettingsRow"
                    onClick={() => setChangePwOpen(true)}
                  >
                    <img src="/assets/myPage/lock-flower.png" alt="" />
                    비밀번호 변경
                  </button>
                )}
                <button type="button" className="mpWithdrawBtn" onClick={onWithdraw}>
                  회원 탈퇴
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── 주민 상세 조회 ── */}
        {activeRes && (
          <CharacterDetail
            resident={activeRes}
            residentIdx={profileIdx as number}
            onClose={() => setProfileIdx(null)}
            onShowToast={showToast}
            onMoveOut={onMoveOut}
          />
        )}

        {/* ── 토스트 ── */}
        {toast && (
          <div className="mpToast" role="status">
            <span>✿</span>
            <span>{toast}</span>
          </div>
        )}
      </div>
      {loginType !== "kakao" && (
        <ChangePasswordModal
          open={changePwOpen}
          onClose={() => setChangePwOpen(false)}
          onSubmit={async (current, next) => {
            await onUpdatePassword(current, next);
            setChangePwOpen(false);
            showToast("비밀번호가 변경되었어요!");
          }}
        />
      )}
    </>
  );
}
