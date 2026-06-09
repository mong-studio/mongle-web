import { useState } from "react";
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
  "회사원 ",
  "전문직 (의사, 변호사, 회계사 등)",
  "사업자/자영업자",
  "공무원/교직원",
  "프리랜서",
  "학생",
  "주부",
  "무직/기타",
] as const;
type TabId = "residents" | "info" | "settings";

const AVATAR_COLORS = [
  "#E9B782",
  "#C9D2DE",
  "#F6E6EC",
  "#D8C2A0",
  "#D9B38C",
  "#C8A6E6",
  "#B8D4B8",
  "#F0D090",
  "#C0D8F0",
  "#E8C0C8",
];

export function MyPageModal({
  userName,
  userJob,
  userBirth,
  joinDate,
  tokenBalance,
  residents,
  onClose,
  onWithdraw,
  onUpdateProfile,
  onUpdatePassword,
}: Props) {
  const [tab, setTab] = useState<TabId>("residents");
  const [nickname, setNickname] = useState(userName);
  const [job, setJob] = useState<string>(
    (JOB_OPTIONS as readonly string[]).includes(userJob) ? userJob : "무직/기타",
  );
  const [birth, setBirth] = useState(userBirth);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [selectedResident, setSelectedResident] = useState<{ r: Resident; idx: number } | null>(
    null,
  );

  async function handleSave() {
    await onUpdateProfile(nickname, job, birth);
    if (currentPw || newPw || confirmPw) {
      await onUpdatePassword(currentPw, newPw, confirmPw);
    }
  }

  const joinDateFmt = joinDate ? joinDate.slice(0, 10).replace(/-/g, ".") : "";

  return (
    <div className="mpPage">
      {/* ── 상단 바 ── */}
      <header className="mpTopbar">
        <div className="mpTopbarBrand">
          <span>🍎</span>
          <span>몽글마을</span>
        </div>
        <div className="mpTopbarRight">
          <div className="mpAppleChip">
            <span>🍎</span>
            <b>{tokenBalance}</b>
            <span>개의 사과</span>
          </div>
          <div className="mpTopbarAv">{userName.charAt(0)}</div>
          <button type="button" className="mpBackBtn" onClick={onClose}>
            ← 마을로
          </button>
        </div>
      </header>

      {/* ── 커버 ── */}
      <div className="mpCover">
        <span className="mpCloud mpCloudA">☁️</span>
        <span className="mpCloud mpCloudB">☁️</span>
        <span className="mpCloud mpCloudC">☁️</span>
      </div>

      {/* ── 본문 ── */}
      <div className="mpContent">
        {/* 프로필 밴드 */}
        <section className="mpProfileBand">
          <div className="mpAvatarWrap">
            <span className="mpCrown">👑</span>
            <div className="mpAv">{userName.charAt(0)}</div>
          </div>
          <div className="mpPInfo">
            <div className="mpNameRow">
              <span className="mpName">{userName}</span>
              <span className="mpVillageBadge">몽글러</span>
              {joinDateFmt && <span className="mpJoinBadge">{joinDateFmt} 가입</span>}
            </div>
            <div className="mpChipRow">
              {userJob && <span className="mpInfoChip">{userJob}</span>}
              {userBirth && <span className="mpInfoChip">{userBirth}</span>}
            </div>
            <div className="mpTokenDisplay">
              <span className="mpTokenEmoji">🍎</span>
              <span className="mpTokenNum">{tokenBalance}</span>
              <span className="mpTokenUnit">개의 사과 토큰</span>
            </div>
          </div>
        </section>

        {/* 통계 카드 */}
        <div className="mpStatGrid">
          <div className="mpStatCard mpStatApple">
            <span className="mpStatEm">🍎</span>
            <span className="mpStatNum">{tokenBalance}</span>
            <span className="mpStatLb">사과 토큰</span>
          </div>
          <div className="mpStatCard mpStatVillage">
            <span className="mpStatEm">🏡</span>
            <span className="mpStatNum">
              {residents.length}
              <small>명</small>
            </span>
            <span className="mpStatLb">마을 주민</span>
          </div>
          <div className="mpStatCard mpStatJob">
            <span className="mpStatEm">💼</span>
            <span className="mpStatNumSm">{userJob || "—"}</span>
            <span className="mpStatLb">직업</span>
          </div>
          <div className="mpStatCard mpStatJoin">
            <span className="mpStatEm">🎂</span>
            <span className="mpStatNumSm">{userBirth || "—"}</span>
            <span className="mpStatLb">생년월일</span>
          </div>
        </div>

        {/* 탭 바 */}
        <div className="mpTabBar" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "residents"}
            className={`mpTab${tab === "residents" ? " on" : ""}`}
            onClick={() => setTab("residents")}
          >
            내 주민 <span className="mpTabBadge">{residents.length}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "info"}
            className={`mpTab${tab === "info" ? " on" : ""}`}
            onClick={() => setTab("info")}
          >
            내 정보
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "settings"}
            className={`mpTab${tab === "settings" ? " on" : ""}`}
            onClick={() => setTab("settings")}
          >
            설정
          </button>
        </div>

        {/* 탭 본문 */}
        <div className="mpTabBody">
          {tab === "residents" ? (
            <div className="mpSection">
              <div className="mpSecHead">
                <span>🏡</span>
                <span>우리 마을 주민</span>
              </div>
              <div className="mpResGrid">
                {residents.length === 0 ? (
                  <p className="mpResEmpty">
                    아직 마을 주민이 없어요
                    <br />
                    <em>새 친구를 만들어보세요!</em>
                  </p>
                ) : (
                  residents.map((r, i) => (
                    <button
                      key={r.id}
                      type="button"
                      className="mpResCard"
                      onClick={() => setSelectedResident({ r, idx: i })}
                    >
                      <div
                        className="mpResAv"
                        style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length] }}
                      >
                        {r.avatarUrl ? <img src={r.avatarUrl} alt={r.name} /> : r.name.charAt(0)}
                      </div>
                      <span className="mpResName">{r.name}</span>
                      <span className="mpResKind">{r.personality}</span>
                    </button>
                  ))
                )}
              </div>
            </div>
          ) : null}

          {tab === "info" ? (
            <div className="mpSection">
              <div className="mpInfoForm">
                <div className="mpFormGroup">
                  <label className="mpLabel" htmlFor="mp-nickname">
                    닉네임
                  </label>
                  <div className="mpInputRow">
                    <input
                      id="mp-nickname"
                      type="text"
                      value={nickname}
                      maxLength={8}
                      onChange={(e) =>
                        setNickname(e.target.value.replace(/[^ㄱ-ㅎ가-힣a-zA-Z0-9]/g, ""))
                      }
                      placeholder="최대 8자"
                    />
                    <span className="mpCount">{nickname.length}/8</span>
                  </div>
                </div>

                <div className="mpFormRow">
                  <div className="mpFormGroup">
                    <label className="mpLabel" htmlFor="mp-job">
                      직업
                    </label>
                    <select id="mp-job" value={job} onChange={(e) => setJob(e.target.value)}>
                      {JOB_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mpFormGroup">
                    <label className="mpLabel" htmlFor="mp-birth">
                      생년월일
                    </label>
                    <input
                      id="mp-birth"
                      type="date"
                      value={birth}
                      onChange={(e) => setBirth(e.target.value)}
                    />
                  </div>
                </div>

                <div className="mpDivider" aria-hidden="true" />

                <div className="mpFormGroup">
                  <label className="mpLabel" htmlFor="mp-cur-pw">
                    비밀번호 변경
                  </label>
                  <input
                    id="mp-cur-pw"
                    type="password"
                    value={currentPw}
                    onChange={(e) => setCurrentPw(e.target.value)}
                    placeholder="현재 비밀번호"
                  />
                  <input
                    type="password"
                    value={newPw}
                    onChange={(e) => setNewPw(e.target.value)}
                    placeholder="새 비밀번호"
                    aria-label="새 비밀번호"
                    className="mpInputGap"
                  />
                  <input
                    type="password"
                    value={confirmPw}
                    onChange={(e) => setConfirmPw(e.target.value)}
                    placeholder="새 비밀번호 확인"
                    aria-label="새 비밀번호 확인"
                    className="mpInputGap"
                  />
                </div>

                <button type="button" className="mpSaveBtn" onClick={handleSave}>
                  저장하기
                </button>
              </div>
            </div>
          ) : null}

          {tab === "settings" ? (
            <div className="mpSection">
              <div className="mpPolicySection">
                <span className="mpPolicyLabel">약관 및 정책</span>
                <a className="mpLinkBtn" href="/privacy" target="_blank" rel="noreferrer">
                  개인정보처리방침
                </a>
                <a className="mpLinkBtn" href="/terms" target="_blank" rel="noreferrer">
                  이용약관
                </a>
                <a className="mpLinkBtn" href="/ai-consent" target="_blank" rel="noreferrer">
                  AI 학습 통계활용 동의
                </a>
              </div>
              <button type="button" className="mpWithdrawBtn" onClick={onWithdraw}>
                회원 탈퇴
              </button>
            </div>
          ) : null}
        </div>

        <footer className="mpFoot">
          <div>🤎 💛 🤎</div>
          <span>몽글마을에서 오늘도 한 걸음 🌿</span>
        </footer>
      </div>

      {/* ── 주민 상세 오버레이 ── */}
      {selectedResident && (
        <div className="mpResDetail">
          <button
            type="button"
            className="mpResDetailBack"
            onClick={() => setSelectedResident(null)}
          >
            ← 돌아가기
          </button>
          <div
            className="mpResDetailAv"
            style={{ background: AVATAR_COLORS[selectedResident.idx % AVATAR_COLORS.length] }}
          >
            {selectedResident.r.avatarUrl ? (
              <img src={selectedResident.r.avatarUrl} alt={selectedResident.r.name} />
            ) : (
              selectedResident.r.name.charAt(0)
            )}
          </div>
          <span className="mpResDetailName">{selectedResident.r.name}</span>
          <div className="mpResDetailRows">
            <div className="mpResDetailRow">
              <span className="mpResDetailKey">성격</span>
              <span className="mpResDetailVal">{selectedResident.r.personality}</span>
            </div>
            <div className="mpResDetailRow">
              <span className="mpResDetailKey">말투</span>
              <span className="mpResDetailVal">{selectedResident.r.speechStyle}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
