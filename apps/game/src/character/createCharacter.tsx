import { useEffect, useRef, useState } from "react";
import "./createCharacter.css";

const PERSONALITY_CATEGORIES = [
  "모험적인",
  "차분한",
  "호기심많은",
  "다정한",
  "열정적인",
  "섬세한",
  "활발한",
  "느긋한",
  "유쾌한",
  "수줍은",
  "장난꾸러기",
  "야무진",
  "명랑한",
] as const;

type Resident = {
  id: string;
  name: string;
  personality: string;
  speechStyle: string;
  avatarUrl?: string;
};

type Props = {
  residents: Resident[];
  sourceImagePreview: string;
  sourceImageName: string;
  characterName: string;
  characterPersona: string;
  characterKeywords: string;
  selectedKeywordCategories: string[];
  isBusy: boolean;
  onImageUpload: (file: File | undefined) => void;
  onNameChange: (value: string) => void;
  onPersonaChange: (value: string) => void;
  onKeywordsChange: (value: string) => void;
  onToggleKeyword: (keyword: string) => void;
  onSubmit: () => void;
  onClose: () => void;
};

export function CharacterModal({
  residents,
  sourceImagePreview,
  sourceImageName,
  characterName,
  characterPersona,
  characterKeywords,
  selectedKeywordCategories,
  isBusy,
  onImageUpload,
  onNameChange,
  onPersonaChange,
  onKeywordsChange,
  onToggleKeyword,
  onSubmit,
  onClose,
}: Props) {
  const bookRef = useRef<HTMLDivElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const dragCounter = useRef(0);

  // biome-ignore lint/correctness/useExhaustiveDependencies: 마운트 시 한 번만 실행해 유효하지 않은 초기 키워드를 제거
  useEffect(() => {
    selectedKeywordCategories.forEach((k) => {
      if (!PERSONALITY_CATEGORIES.includes(k as (typeof PERSONALITY_CATEGORIES)[number])) {
        onToggleKeyword(k);
      }
    });
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (bookRef.current && !bookRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  return (
    <div className="characterBook" ref={bookRef}>
      {/* ── 왼쪽 콘텐츠 ── */}
      <div className="bookLeft">
        <div className="bookPanelHeader">
          <span className="bookTagRow">몽글마을 주민등록</span>
          <h2 className="bookTitle">
            새로운 친구가
            <br />
            찾아왔어요!!
          </h2>
          <p className="bookIntro">
            날씨가 좋은 어느 날, 몽글 마을에
            <br />
            반가운 친구가 도착했답니다!!
          </p>
        </div>

        <div className="characterImageWrap">
          <div className="characterImageBox">
            {sourceImagePreview ? (
              <img src={sourceImagePreview} alt="업로드한 애착인형" />
            ) : (
              <div className="imagePlaceholder" />
            )}
          </div>
          <span className="imageCaption">애착인형의 사진</span>
        </div>

        {sourceImageName ? (
          <div className="bookUploadZone bookUploadZoneFilled">
            <span className="bookUploadFileName">📎 {sourceImageName}</span>
            <button
              type="button"
              className="bookUploadCancel"
              onClick={() => onImageUpload(undefined)}
            >
              취소
            </button>
          </div>
        ) : (
          <label
            className={`bookUploadZone${isDragOver ? " isDragOver" : ""}`}
            onDragEnter={(e) => {
              e.preventDefault();
              dragCounter.current += 1;
              setIsDragOver(true);
            }}
            onDragOver={(e) => e.preventDefault()}
            onDragLeave={() => {
              dragCounter.current -= 1;
              if (dragCounter.current === 0) setIsDragOver(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              dragCounter.current = 0;
              setIsDragOver(false);
              onImageUpload(e.dataTransfer.files?.[0]);
            }}
          >
            <input
              type="file"
              accept="image/*"
              onChange={(e) => onImageUpload(e.target.files?.[0])}
            />
            <span className="bookUploadTitle">
              애착인형 사진 올리기 <em className="bookUploadOptional">선택</em>
            </span>
            <small>PNG · JPG · JPEG · 드래그도 괜찮아요</small>
            <span className="bookUploadHint">
              인형이 혼자 담긴 사진이 좋아요 🌿<br />
              하얀 배경이면 더 예쁜 친구가 태어난답니다
            </span>
          </label>
        )}

        {/* ── 왼쪽 하단: 각주 ── */}
        <p className="bookLeftFootnote">
          🌱 사진이 없어도 걱정 마세요~!
          <br />
          페르소나에 외형을 살짝 적어주면 그 모습 그대로 뿅 나타나요 ✨<br />
          <em>예시: 보들보들한 크림색 털에 까만 콩 눈, 귀에 노란 리본이 달려 있어요 🎀</em>
        </p>
      </div>

      {/* ── 책등 ── */}
      <div className="bookSpine" aria-hidden="true" />

      {/* ── 오른쪽 콘텐츠 ── */}
      <div className="bookRight">
        <div className="bookBookmark" aria-hidden="true" />
        <button type="button" className="bookCloseButton" onClick={onClose} aria-label="닫기">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
          </svg>
        </button>

        <div className="bookPanelHeaderRight">
          <span className="bookTagRowRight">친구를 소개해요</span>
          <h3 className="bookTitleRight">
            이 친구는
            <br />
            어떤 아이인가요?
          </h3>
          <div className="bookDecorDots" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
          </div>
        </div>

        <div className="bookField">
          <div className="bookFieldLabel">
            <div className="bookFieldLabelLeft">
              <span className="bookLeafIcon" aria-hidden="true">
                🌿
              </span>
              <span>이름</span>
            </div>
            <span className="bookFieldCount">{characterName.length} / 10</span>
          </div>
          <input
            value={characterName}
            maxLength={10}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="예: 몽글아"
          />
          {!characterName.trim() && <p className="bookFieldError">주민 이름을 적어주세요.</p>}
        </div>

        <div className="bookField">
          <div className="bookFieldLabel">
            <div className="bookFieldLabelLeft">
              <span className="bookLeafIcon" aria-hidden="true">
                🌿
              </span>
              <span>페르소나</span>
            </div>
            <span className="bookFieldCount">{characterPersona.length} / 300</span>
          </div>
          <textarea
            value={characterPersona}
            maxLength={300}
            onChange={(e) => onPersonaChange(e.target.value)}
            placeholder="어떤 성격과 이야기를 가진 친구인지 들려주세요."
          />
          {!characterPersona.trim() && (
            <p className="bookFieldError">어떤 친구인지 소개해 주세요.</p>
          )}
        </div>

        <div className="bookField">
          <div className="bookFieldLabel">
            <div className="bookFieldLabelLeft">
              <span className="bookLeafIcon" aria-hidden="true">
                🌿
              </span>
              <span>
                성격 키워드 메모 <em>선택</em>
              </span>
            </div>
            <span className="bookFieldCount">{characterKeywords.length} / 100</span>
          </div>
          <input
            value={characterKeywords}
            maxLength={100}
            onChange={(e) => onKeywordsChange(e.target.value)}
            placeholder="자유 메모 (선택)"
          />
        </div>

        <div className="bookField">
          <div className="bookFieldLabel">
            <div className="bookFieldLabelLeft">
              <span className="bookLeafIcon" aria-hidden="true">
                🌿
              </span>
              <span>성격 키워드</span>
            </div>
            <span className="bookFieldCount">
              {
                selectedKeywordCategories.filter((k) =>
                  PERSONALITY_CATEGORIES.includes(k as (typeof PERSONALITY_CATEGORIES)[number]),
                ).length
              }{" "}
              / 3
            </span>
          </div>
          <div className="bookKeywordChips">
            {PERSONALITY_CATEGORIES.map((kw) => (
              <button
                key={kw}
                type="button"
                className={`bookKeywordChip${selectedKeywordCategories.includes(kw) ? " isSelected" : ""}`}
                onClick={() => onToggleKeyword(kw)}
              >
                {kw}
              </button>
            ))}
          </div>
        </div>

        {/* ── 오른쪽 하단: 입주 도장 ── */}
        <div className="bookSubmitRow">
          <p className="stampHint">
            도장을 '쾅!' 찍으면
            <br />
            몽글마을에 입주가 가능해요!
          </p>
          <button
            type="button"
            className="stampButton"
            onClick={onSubmit}
            disabled={
              isBusy || residents.length >= 10 || !characterName.trim() || !characterPersona.trim()
            }
            aria-label="입주 도장"
          >
            {isBusy ? "생성 중" : "입주\n도장"}
          </button>
        </div>
      </div>
    </div>
  );
}
