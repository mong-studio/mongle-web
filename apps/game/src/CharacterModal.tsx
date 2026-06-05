import "./CharacterModal.css";

const PERSONALITY_CATEGORIES = [
  "모험적인", "차분한", "호기심많은", "다정한",
  "열정적인", "섬세한", "활발한", "느긋한",
  "유쾌한", "수줍은", "장난꾸러기", "야무진",
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
  return (
    <div className="characterBook">
      {/* 왼쪽 패널 */}
      <div className="bookLeft">
        <button type="button" className="bookCloseButton" onClick={onClose} aria-label="닫기">
          ×
        </button>

        <div className="bookPanelHeader">
          <span className="bookTagRow">몽글빌리지 그림책</span>
          <h2 className="bookTitle">
            새로운 친구가<br />찾아왔어요
          </h2>
          <p className="bookIntro">
            어느 맑은 좋은 날, 작은 마을에<br />반가운 친구가 도착했답니다.
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

        <label className="bookUploadZone">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => onImageUpload(e.target.files?.[0])}
          />
          <span className="bookUploadTitle">애착인형 사진 올리기</span>
          <small>{sourceImageName || "귀여운 토끼 드래그 · PNG·JPG"}</small>
        </label>

        <div className="bookResidents">
          <span className="bookResidentsLabel">이미 마을에 사는 친구들</span>
          <div className="bookResidentRow">
            {residents.map((r) => (
              <span key={r.id} className="bookResidentChip">
                {r.avatarUrl ? <img src={r.avatarUrl} alt="" /> : null}
                {r.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 책등 구분선 */}
      <div className="bookSpine" aria-hidden="true" />

      {/* 오른쪽 패널 */}
      <div className="bookRight">
        <div className="bookPanelHeader bookPanelHeaderRight">
          <span className="bookTagRow">친구를 소개해요</span>
          <h3 className="bookTitle">
            이 친구는<br />어떤 아이인가요?
          </h3>
        </div>

        <div className="bookField">
          <div className="bookFieldLabel">
            <span>🌿 이름</span>
            <span className="bookFieldCount">{characterName.length} / 50</span>
          </div>
          <input
            value={characterName}
            maxLength={50}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="예: 몽글아"
          />
        </div>

        <div className="bookField">
          <div className="bookFieldLabel">
            <span>🌿 페르소나</span>
            <span className="bookFieldCount">{characterPersona.length} / 300</span>
          </div>
          <textarea
            value={characterPersona}
            maxLength={300}
            onChange={(e) => onPersonaChange(e.target.value)}
            placeholder="어떤 성격과 이야기를 가진 친구인지 들려주세요."
          />
        </div>

        <div className="bookField">
          <div className="bookFieldLabel">
            <span>🌿 성격 키워드 메모 <em>선택</em></span>
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
            <span>🌿 성격 키워드</span>
            <span className="bookFieldCount">{selectedKeywordCategories.length} / 3</span>
          </div>
          <div className="bookKeywordChips">
            {PERSONALITY_CATEGORIES.map((kw) => (
              <button
                key={kw}
                type="button"
                className={selectedKeywordCategories.includes(kw) ? "isSelected" : ""}
                onClick={() => onToggleKeyword(kw)}
              >
                {kw}
              </button>
            ))}
          </div>
        </div>

        <div className="bookSubmitRow">
          <p className="stampHint">
            도장을 '쾅!' 찍으면 그림책 마을에 등장해요.
          </p>
          <button
            type="button"
            className="stampButton"
            onClick={onSubmit}
            disabled={isBusy || residents.length >= 10}
          >
            {isBusy ? "생성 중" : "입주\n도장"}
          </button>
        </div>
      </div>
    </div>
  );
}
