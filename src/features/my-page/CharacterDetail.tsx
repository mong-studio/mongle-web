import { useEffect, useState } from "react";
import type { Resident } from "../../app/model/appTypes.js";
import { apiClient } from "../../shared/api/client.js";
import "./CharacterDetail.css";

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

function parseKeywords(s: string) {
  return s
    .split(/[,，\s]+/)
    .filter(Boolean)
    .slice(0, 3);
}

function fmtDate(iso: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
}

type Quest = { quest_id: string; todo_id: string; title: string };

type CharacterDetailData = {
  created_at: string;
  active_quests: Quest[];
};

type Props = {
  resident: Resident;
  residentIdx: number;
  onClose: () => void;
  onShowToast: (msg: string) => void;
};

export function CharacterDetail({ resident, residentIdx, onClose, onShowToast }: Props) {
  const [detail, setDetail] = useState<CharacterDetailData | null>(null);

  useEffect(() => {
    setDetail(null);
    apiClient
      .get<CharacterDetailData>(`/characters/${resident.id}/`)
      .then((res) => setDetail(res.data))
      .catch(() => {});
  }, [resident.id]);

  const quests = detail?.active_quests ?? [];

  return (
    <div
      className="mpRdBg"
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={`${resident.name} 상세`}
    >
      <div
        className="mpRdModal"
        role="document"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <div className="mpRdHdr">
          <div className="mpRdHdrTitle">
            <img src="/assets/myPage/icon-bear.png" alt="" className="mpRdHdrIcon" />
            <span>주민 상세 조회</span>
            <span className="mpRdHdrStar">✦</span>
            <span className="mpRdHdrStar">✦</span>
          </div>
          <button type="button" className="mpRdClose" onClick={onClose} aria-label="닫기">
            ✕
          </button>
        </div>

        <div className="mpRdBody">
          <div className="mpRdLeft">
            <div className="mpRdImgCard">
              <div className="mpRdImgWrap">
                {resident.avatarUrl ? (
                  <img src={resident.avatarUrl} alt={resident.name} className="mpRdImg" />
                ) : (
                  <div
                    className="mpRdAv"
                    style={{ background: AV_COLORS[residentIdx % AV_COLORS.length] }}
                  >
                    {resident.name.charAt(0)}
                  </div>
                )}
              </div>
            </div>

            <h2 className="mpRdName">
              <span className="mpRdNameFlower">✿</span>
              {resident.name}
              <span className="mpRdNameFlower">✿</span>
            </h2>
            <hr className="mpRdDivider" />

            <div className="mpRdSecHead">
              <img src="/assets/myPage/sprout.png" alt="" className="mpRdSecIcon" />
              주민 소개
            </div>
            <div className="mpRdChips">
              {parseKeywords(resident.personality).map((kw, ki) => (
                <span
                  key={kw}
                  className="cdResChip"
                  style={{
                    background: CHIP_COLORS[ki % CHIP_COLORS.length].bg,
                    color: CHIP_COLORS[ki % CHIP_COLORS.length].fg,
                  }}
                >
                  {kw}
                </span>
              ))}
            </div>
            <p className="mpRdDesc">{resident.speechStyle}</p>
          </div>

          <div className="mpRdRight">
            <div className="mpRdSec">
              <div className="mpRdSecHead">
                <img src="/assets/myPage/sprout.png" alt="" className="mpRdSecIcon" />
                진행 중인 퀘스트
              </div>
              <div className="mpRdQuestBody">
                {quests.length === 0 ? (
                  <div className="mpRdQuestEmpty">
                    <span>아직 진행 중인 퀘스트가 없어요</span>
                  </div>
                ) : (
                  <div className="mpRdQuestList">
                    {quests.map((q) => (
                      <div key={q.quest_id} className="mpRdQuestItem">
                        <img src="/assets/myPage/sprout.png" alt="" className="mpRdQuestItemIcon" />
                        <span>{q.title}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="mpRdSec">
              <div className="mpRdSecHead">
                <img src="/assets/myPage/sprout.png" alt="" className="mpRdSecIcon" />
                기본 정보
              </div>
              <div className="mpRdInfoRows">
                <div className="mpRdInfoRow">
                  <span className="mpRdInfoKey">
                    <img src="/assets/myPage/calendar.png" alt="" className="mpRdInfoIcon" />
                    생성일
                  </span>
                  <span className="mpRdInfoVal">{detail ? fmtDate(detail.created_at) : "—"}</span>
                </div>
                <div className="mpRdInfoRow">
                  <span className="mpRdInfoKey">
                    <img src="/assets/myPage/icon-house.png" alt="" className="mpRdInfoIcon" />
                    현재 거주지
                  </span>
                  <span className="mpRdInfoVal">—</span>
                </div>
                <div className="mpRdInfoRow">
                  <span className="mpRdInfoKey">
                    <img src="/assets/myPage/icon-phone.png" alt="" className="mpRdInfoIcon" />
                    함께한 피드 수
                  </span>
                  <span className="mpRdInfoVal">—</span>
                </div>
              </div>
            </div>
            <div className="mpRdMoveBtnWrap">
              <button
                type="button"
                className="mpRdMoveBtn"
                onClick={() => onShowToast("이사 기능은 준비 중이에요")}
              >
                <img src="/assets/myPage/icon-truck.png" alt="" className="mpRdMoveBtnIcon" />
                이사 보내기
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
