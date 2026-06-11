import { useEffect, useRef, useState } from "react";
import "./myPage.css";

export type Resident = {
  id: string;
  name: string;
  personality: string;
  speechStyle: string;
  avatarUrl?: string;
};

type Props = {
  userName: string;
  userJob: string;
  userBirth: string;
  joinDate: string;
  tokenBalance: number;
  residents: Resident[];
  onClose: () => void;
  onWithdraw: () => void;
  onUpdateProfile: (nickname: string, job: string, birth: string) => Promise<void>;
  onUpdatePassword: (current: string, next: string, confirm: string) => Promise<void>;
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
  userJob,
  userBirth,
  tokenBalance,
  residents,
  onClose,
  onWithdraw,
  onUpdateProfile,
  onUpdatePassword,
}: Props) {
  const [pwOpen, setPwOpen] = useState(false);
  const [editingInfo, setEditingInfo] = useState(false);
  const [jobDraft, setJobDraft] = useState(userJob);
  const [birthDraft, setBirthDraft] = useState(userBirth);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [profileIdx, setProfileIdx] = useState<number | null>(null);
  const [bellOpen, setBellOpen] = useState(false);
  const [nameMenuOpen, setNameMenuOpen] = useState(false);
  const [tipOpen, setTipOpen] = useState(false);
  const [toast, setToast] = useState("");
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    },
    [],
  );

  useEffect(() => {
    setJobDraft(userJob);
    setBirthDraft(userBirth);
  }, [userJob, userBirth]);

  async function handleSaveInfo() {
    await onUpdateProfile(userName, jobDraft, birthDraft);
    setEditingInfo(false);
    showToast("기본 정보가 저장되었어요!");
  }

  function showToast(msg: string) {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2600);
  }

  function closeAll() {
    setBellOpen(false);
    setNameMenuOpen(false);
  }

  const pwMismatch = !!(newPw && confirmPw && newPw !== confirmPw);

  async function handleSavePw() {
    if (!currentPw || !newPw || pwMismatch) return;
    await onUpdatePassword(currentPw, newPw, confirmPw);
    setPwOpen(false);
    setCurrentPw("");
    setNewPw("");
    setConfirmPw("");
    showToast("비밀번호가 변경되었어요!");
  }

  const activeRes = profileIdx !== null ? residents[profileIdx] : null;

  return (
    <div className="mpPage">
      {/* ── 배경 블롭 ── */}
      <div className="mpBlobs" aria-hidden="true">
        <span className="mpBlob mpBlob1" />
        <span className="mpBlob mpBlob2" />
        <span className="mpBlob mpBlob3" />
        <span className="mpBlob mpBlob4" />
        <span className="mpBlob mpBlob5" />
      </div>

      <div className="mpContainer">
        <div className="mpCard">
          {/* ── 헤더 ── */}
          <header className="mpHeader">
            <div className="mpHeaderBrand">
              <img src="/assets/character/mp-logo-rabbit.png" alt="" className="mpBrandLogo" />
              <span className="mpBrandName">몽글마을</span>
              <span className="mpBrandStar">✦</span>
            </div>

            <button type="button" className="mpGoVillage" onClick={onClose}>
              <img src="/assets/character/ic-house.png" alt="" />
              마을로 가기
            </button>

            <div className="mpHeaderRight">
              <div className="mpTokenChip">
                <img src="/assets/character/ic-apple.png" alt="토큰" />
                <span>{tokenBalance}</span>
              </div>

              <button
                type="button"
                className="mpBellBtn"
                onClick={() => {
                  setBellOpen((o) => !o);
                  setNameMenuOpen(false);
                }}
              >
                <img src="/assets/character/ic-bell.png" alt="알림" />
              </button>

              <button
                type="button"
                className="mpNameBtn"
                onClick={() => {
                  setNameMenuOpen((o) => !o);
                  setBellOpen(false);
                }}
              >
                <img src="/assets/character/mp-avatar-sm.png" alt="" className="mpNameAvatar" />
                <span>{userName}</span>
                <span
                  className="mpCaret"
                  style={{ transform: nameMenuOpen ? "rotate(180deg)" : undefined }}
                >
                  ▾
                </span>
              </button>
            </div>
          </header>

          {/* ── 타이틀 ── */}
          <div className="mpTitleRow">
            <img
              src="/assets/character/deco-flowers-l.png"
              alt=""
              className="mpTitleFlower mpFlowerL"
            />
            <div className="mpTitleCenter">
              <div className="mpTitleLine">
                <span className="mpTitleStar mpStarY">✦</span>
                <h1 className="mpTitle">마이페이지</h1>
                <span className="mpTitleStar mpStarG">✦</span>
              </div>
              <p className="mpSubtitle">나의 마을과 나를 소개해요</p>
            </div>
            <img
              src="/assets/character/deco-flowers-r.png"
              alt=""
              className="mpTitleFlower mpFlowerR"
            />
          </div>

          <div className="mpBody">
            {/* ── 상단 2열 ── */}
            <div className="mpTopRow">
              {/* 프로필 + 기본정보 카드 */}
              <div className="mpProfileCard">
                <div className="mpAvatarCol">
                  <div className="mpAvatarRing">
                    <img
                      src="/assets/character/mp-avatar.png"
                      alt={userName}
                      className="mpAvatarImg"
                    />
                    <div className="mpNamePlate">
                      <span className="mpPlateFleur">✿</span>
                      <span className="mpNamePlateText">{userName}</span>
                      <span className="mpPlateFleur">✿</span>
                    </div>
                  </div>
                </div>

                <div className="mpInfoCol">
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
                        ✏️ 수정
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
                      <img src="/assets/character/ic-apple.png" alt="" className="mpInfoIcon" />
                      <span className="mpInfoLabel">보유 토큰</span>
                      <span className="mpInfoVal">
                        {tokenBalance}
                        <img
                          src="/assets/character/ic-apple.png"
                          alt=""
                          className="mpInfoValIcon"
                        />
                      </span>
                    </div>
                    <div className="mpInfoRow">
                      <img src="/assets/character/ic-house.png" alt="" className="mpInfoIcon" />
                      <span className="mpInfoLabel">마을 주민 수</span>
                      <span className="mpInfoVal">{residents.length}명</span>
                    </div>
                    <div className="mpInfoRow">
                      <img src="/assets/character/ic-briefcase.png" alt="" className="mpInfoIcon" />
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
                      <img src="/assets/character/ic-calendar.png" alt="" className="mpInfoIcon" />
                      <span className="mpInfoLabel">생년월일</span>
                      {editingInfo ? (
                        <input
                          type="date"
                          className="mpInfoDateInput"
                          value={birthDraft}
                          onChange={(e) => setBirthDraft(e.target.value)}
                        />
                      ) : (
                        <span className="mpInfoVal">{fmtBirth(userBirth)}</span>
                      )}
                    </div>
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

                <div className="mpPwBlock">
                  <div className="mpPwInfo">
                    <img src="/assets/character/mp-lock.png" alt="" className="mpLockIcon" />
                    <div>
                      <div className="mpPwTitle">비밀번호 변경</div>
                      <div className="mpPwDesc">
                        계정 보안을 위해
                        <br />
                        정기적으로 비밀번호를 변경해요.
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="mpPwToggleBtn"
                    onClick={() => setPwOpen((o) => !o)}
                  >
                    비밀번호 변경하기{" "}
                    <span className="mpChevron" aria-hidden="true">
                      ›
                    </span>
                  </button>
                  {pwOpen && (
                    <div className="mpPwForm">
                      <input
                        type="password"
                        placeholder="현재 비밀번호"
                        value={currentPw}
                        onChange={(e) => setCurrentPw(e.target.value)}
                        className="mpPwInput"
                      />
                      <input
                        type="password"
                        placeholder="새 비밀번호"
                        value={newPw}
                        onChange={(e) => setNewPw(e.target.value)}
                        className="mpPwInput"
                      />
                      <input
                        type="password"
                        placeholder="새 비밀번호 확인"
                        value={confirmPw}
                        onChange={(e) => setConfirmPw(e.target.value)}
                        className="mpPwInput"
                      />
                      {pwMismatch && <p className="mpPwError">새 비밀번호가 일치하지 않아요.</p>}
                      <button
                        type="button"
                        className="mpPwSaveBtn"
                        onClick={() => void handleSavePw()}
                      >
                        변경 완료
                      </button>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  className="mpSettingsRow"
                  onClick={() => showToast("알림 설정으로 이동해요")}
                >
                  <img src="/assets/character/ic-bell.png" alt="" /> 알림 설정
                  <span className="mpChevron" aria-hidden="true">
                    ›
                  </span>
                </button>
                <button
                  type="button"
                  className="mpSettingsRow"
                  onClick={() => showToast("연결된 계정 관리로 이동해요")}
                >
                  🔗 연결된 계정 관리
                  <span className="mpChevron" aria-hidden="true">
                    ›
                  </span>
                </button>

                <button type="button" className="mpWithdrawBtn" onClick={onWithdraw}>
                  회원 탈퇴
                </button>
              </div>
            </div>

            {/* ── 내 주민들 ── */}
            <div className="mpResSection">
              <div className="mpResSectionHead">
                <div className="mpResHeadLeft">
                  <span className="mpResHeadStar">✿</span>
                  <span>내 주민들</span>
                  <span className="mpResHeadStar">✿</span>
                </div>
                <div className="mpTipWrap">
                  <button type="button" className="mpTipBtn" onClick={() => setTipOpen((o) => !o)}>
                    주민 관리 팁 보기{" "}
                    <span className="mpTipQ" aria-hidden="true">
                      ?
                    </span>
                  </button>
                  {tipOpen && (
                    <div className="mpTipBox">
                      <div className="mpTipTitle">✿ 주민 관리 팁</div>
                      <p>
                        매일 주민에게 인사하면 친밀도가 올라가요! 좋아하는 음식을 선물하면 더 빨리
                        친해질 수 있답니다.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {residents.length === 0 ? (
                <div className="mpResEmpty">
                  <p>아직 마을 주민이 없어요</p>
                  <em>새 친구를 만들어보세요!</em>
                </div>
              ) : (
                <div className="mpResGrid">
                  {residents.map((r, i) => (
                    <div key={r.id} className="mpResCard">
                      <div className="mpResImgWrap">
                        {r.avatarUrl ? (
                          <img src={r.avatarUrl} alt={r.name} className="mpResImg" />
                        ) : (
                          <div
                            className="mpResAv"
                            style={{ background: AV_COLORS[i % AV_COLORS.length] }}
                          >
                            {r.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="mpResName">{r.name}</div>
                      <div className="mpResChips">
                        {parseKeywords(r.personality).map((kw, ki) => (
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
                      <button
                        type="button"
                        className="mpResProfileBtn"
                        onClick={() => setProfileIdx(i)}
                      >
                        👤 프로필 보기
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── 이름 드롭다운 ── */}
      {nameMenuOpen && (
        <>
          <div className="mpDismiss" onClick={closeAll} aria-hidden="true" />
          <div className="mpNameMenu">
            <button type="button" className="mpNameMenuItem" onClick={() => setNameMenuOpen(false)}>
              👤 내 프로필
            </button>
            <button
              type="button"
              className="mpNameMenuItem"
              onClick={() => {
                setNameMenuOpen(false);
                showToast("설정으로 이동해요");
              }}
            >
              ⚙️ 설정
            </button>
            <button
              type="button"
              className="mpNameMenuItem"
              onClick={() => {
                setNameMenuOpen(false);
                showToast("로그아웃 되었어요");
              }}
            >
              🚪 로그아웃
            </button>
          </div>
        </>
      )}

      {/* ── 알림 팝오버 ── */}
      {bellOpen && (
        <>
          <div className="mpDismiss" onClick={closeAll} aria-hidden="true" />
          <div className="mpBellPopover">
            <div className="mpBellPopTitle">알림</div>
            <div className="mpBellItem">
              <span>🌸</span>
              <div>
                <div>봄이가 새 요리 레시피를 공유했어요!</div>
                <div className="mpBellTime">10분 전</div>
              </div>
            </div>
            <div className="mpBellItem">
              <span>🍎</span>
              <div>
                <div>일일 토큰 2개가 지급되었어요.</div>
                <div className="mpBellTime">2시간 전</div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── 주민 프로필 오버레이 ── */}
      {activeRes && (
        <div
          className="mpResOverlayBg"
          onClick={() => setProfileIdx(null)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setProfileIdx(null);
          }}
          role="dialog"
          aria-modal="true"
          aria-label={`${activeRes.name} 프로필`}
        >
          <div
            className="mpResOverlay"
            role="document"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="mpResOverlayClose"
              onClick={() => setProfileIdx(null)}
              aria-label="닫기"
            >
              ✕
            </button>
            <div className="mpResOverlayImgWrap">
              {activeRes.avatarUrl ? (
                <img src={activeRes.avatarUrl} alt={activeRes.name} className="mpResOverlayImg" />
              ) : (
                <div
                  className="mpResOverlayAv"
                  style={{
                    background: AV_COLORS[(profileIdx as number) % AV_COLORS.length],
                  }}
                >
                  {activeRes.name.charAt(0)}
                </div>
              )}
            </div>
            <div className="mpResOverlayBody">
              <div className="mpResOverlayName">{activeRes.name}</div>
              <div className="mpResOverlayChips">
                {parseKeywords(activeRes.personality).map((kw, ki) => (
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
              <div className="mpResOverlayRows">
                <div className="mpResOverlayRow">
                  <span className="mpResOverlayKey">성격</span>
                  <span className="mpResOverlayVal">{activeRes.personality}</span>
                </div>
                <div className="mpResOverlayRow">
                  <span className="mpResOverlayKey">말투</span>
                  <span className="mpResOverlayVal">{activeRes.speechStyle}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 토스트 ── */}
      {toast && (
        <div className="mpToast" role="status">
          <span>✿</span>
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}
