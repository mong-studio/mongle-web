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

const CHIP_COLORS = [
  { bg: "#FBE6A8", fg: "#B07F1E", border: "#E7B53C" },
  { bg: "#F8D4DA", fg: "#C56577", border: "#EE9BAA" },
  { bg: "#D7EBBE", fg: "#6E9A47", border: "#A7CE7E" },
  { bg: "#E2D6F1", fg: "#8268B0", border: "#B79FD9" },
  { bg: "#FBDDC0", fg: "#C0763E", border: "#EBB084" },
  { bg: "#CDE6F2", fg: "#3E7C9A", border: "#90C4DC" },
  { bg: "#CFEDDD", fg: "#3F8E6B", border: "#8FCFB0" },
];

function getChipColor(idx: number) {
  return CHIP_COLORS[idx % CHIP_COLORS.length];
}

function getProgressMsg(p: number) {
  if (p >= 100) return "거의 다 됐어요!";
  if (p >= 80) return "오두막 앞에서 포즈 잡는 중! ✦";
  if (p >= 50) return "좋아하는 음식을 정하는 중…";
  if (p >= 25) return "성격을 콩닥콩닥 빚는 중이에요…";
  return "마을에 어울리는 주민을 찾고 있어요!";
}

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
  selectedKeywordCategories,
  isBusy,
  onImageUpload,
  onNameChange,
  onPersonaChange,
  onToggleKeyword,
  onSubmit,
  onClose,
}: Props) {
  const modalRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const customInputRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<"upload" | "text">("upload");
  const [customTraits, setCustomTraits] = useState<string[]>([]);
  const [adding, setAdding] = useState(false);
  const [customText, setCustomText] = useState("");
  const [nameError, setNameError] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loadToastHidden, setLoadToastHidden] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const dragCounter = useRef(0);

  const phase: "result" | "uploaded" | "generating" = isBusy
    ? "generating"
    : sourceImagePreview
      ? "uploaded"
      : "result";

  useEffect(() => {
    if (!isBusy) {
      setProgress(0);
      setLoadToastHidden(false);
      return;
    }
    const iv = setInterval(() => {
      setProgress((p) => Math.min(Math.round(p + 3 + Math.random() * 5), 95));
    }, 90);
    return () => clearInterval(iv);
  }, [isBusy]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: 마운트 시 한 번만 실행해 유효하지 않은 초기 키워드를 제거
  useEffect(() => {
    for (const k of selectedKeywordCategories) {
      if (!PERSONALITY_CATEGORIES.includes(k as (typeof PERSONALITY_CATEGORIES)[number])) {
        onToggleKeyword(k);
      }
    }
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  function handleGenerate() {
    if (isBusy) return;
    if (!characterName.trim()) {
      setNameError(true);
      setTimeout(() => setNameError(false), 1500);
      return;
    }
    onSubmit();
  }

  function commitCustom() {
    const t = customText.trim();
    const allBase = PERSONALITY_CATEGORIES as readonly string[];
    if (t && !customTraits.includes(t) && !allBase.includes(t)) {
      setCustomTraits((prev) => [...prev, t]);
      onToggleKeyword(t);
    }
    setAdding(false);
    setCustomText("");
  }

  const allChips = [...PERSONALITY_CATEGORIES, ...customTraits];

  return (
    <div className="ccModal" ref={modalRef}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e) => {
          onImageUpload(e.target.files?.[0]);
          e.target.value = "";
        }}
      />

      {/* ── 헤더 ── */}
      <div className="ccHeader">
        <div className="ccHeaderTitle">
          <img src="/assets/character/deco-flowers-l.png" alt="" className="ccFlower ccFlower--l" />
          <h1 className="ccTitle">주민 캐릭터 만들기</h1>
          <img src="/assets/character/deco-flowers-r.png" alt="" className="ccFlower ccFlower--r" />
        </div>
        <button type="button" className="ccCloseBtn" onClick={onClose} aria-label="닫기">
          ✕
        </button>
      </div>

      {/* ── 본문 ── */}
      <div className="ccBody">
        {/* ── 왼쪽 ── */}
        <div className="ccLeft">
          {/* ① 이미지 입력 */}
          <div className="ccSection">
            <div className="ccSectionLabel">
              <span className="ccNumBadge">1</span>
              <span className="ccSectionTitle">이미지 입력</span>
            </div>
            <div className="ccCards">
              {/* 업로드 카드 */}
              <button
                type="button"
                className={`ccCard${mode === "upload" ? " ccCard--active" : ""}`}
                style={dragOver ? { borderColor: "#E8A24E", background: "#FBE3AE" } : undefined}
                onDragEnter={(e) => {
                  e.preventDefault();
                  dragCounter.current += 1;
                  setDragOver(true);
                }}
                onDragOver={(e) => e.preventDefault()}
                onDragLeave={() => {
                  dragCounter.current -= 1;
                  if (dragCounter.current === 0) setDragOver(false);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  dragCounter.current = 0;
                  setDragOver(false);
                  onImageUpload(e.dataTransfer.files?.[0]);
                }}
                onClick={() => {
                  setMode("upload");
                  if (!sourceImagePreview) fileInputRef.current?.click();
                }}
              >
                {sourceImagePreview ? (
                  <>
                    <div className="ccCardThumbWrap">
                      <img src={sourceImagePreview} alt="업로드" className="ccCardThumb" />
                      <button
                        type="button"
                        className="ccCardClearBtn"
                        onClick={(e) => {
                          e.stopPropagation();
                          onImageUpload(undefined);
                        }}
                      >
                        ✕
                      </button>
                    </div>
                    <span className="ccCardFileName">{sourceImageName}</span>
                    <span className="ccCardSub">눌러서 변경</span>
                  </>
                ) : (
                  <>
                    <img src="/assets/character/icon-photo.png" alt="" className="ccCardIcon" />
                    <div>
                      <div className="ccCardHead">이미지 업로드</div>
                      <div className="ccCardSub">사진을 업로드해주세요</div>
                    </div>
                  </>
                )}
              </button>
              {/* 텍스트 카드 */}
              <button
                type="button"
                className={`ccCard${mode === "text" ? " ccCard--active" : ""}`}
                onClick={() => setMode("text")}
              >
                <img src="/assets/character/icon-wand.png" alt="" className="ccCardIcon" />
                <div>
                  <div className="ccCardHead">텍스트로 자동 생성</div>
                  <div className="ccCardSub">설명만으로 자동 생성해요</div>
                </div>
              </button>
            </div>
          </div>

          {/* ② 정보 입력 */}
          <div className="ccSection">
            <div className="ccSectionLabel">
              <span className="ccNumBadge">2</span>
              <span className="ccSectionTitle">정보 입력</span>
            </div>

            {/* 이름 */}
            <div className={`ccNameRow${nameError ? " ccNameRow--shake" : ""}`}>
              <label htmlFor="cc-name" className="ccFieldLabel">
                이름
              </label>
              <input
                id="cc-name"
                value={characterName}
                maxLength={10}
                onChange={(e) => {
                  onNameChange(e.target.value);
                  setNameError(false);
                }}
                placeholder="예) 토실이, 루비, 별이 등"
                className="ccInput"
              />
            </div>
            {nameError && <div className="ccNameError">✿ 이름을 먼저 적어주세요!</div>}

            {/* 성격 키워드 */}
            <div className="ccChipSection">
              <div className="ccFieldLabel ccChipLabel">성격 키워드</div>
              <div className="ccChips">
                {allChips.map((kw, i) => {
                  const c = getChipColor(i);
                  const selected = selectedKeywordCategories.includes(kw);
                  return (
                    <button
                      key={kw}
                      type="button"
                      className="ccChip"
                      style={
                        selected
                          ? {
                              background: c.bg,
                              color: c.fg,
                              borderColor: c.border,
                              boxShadow: `0 3px 9px -4px ${c.border}`,
                              transform: "translateY(-1px)",
                            }
                          : { background: c.bg, color: c.fg }
                      }
                      onClick={() => onToggleKeyword(kw)}
                    >
                      {selected && <span className="ccChipCheck">✓</span>}
                      {kw}
                    </button>
                  );
                })}
                {adding ? (
                  <input
                    ref={customInputRef}
                    value={customText}
                    onChange={(e) => setCustomText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        commitCustom();
                      } else if (e.key === "Escape") {
                        setAdding(false);
                        setCustomText("");
                      }
                    }}
                    onBlur={commitCustom}
                    placeholder="키워드 입력"
                    className="ccChipInput"
                  />
                ) : (
                  <button
                    type="button"
                    className="ccAddChip"
                    onClick={() => {
                      setAdding(true);
                      setTimeout(() => customInputRef.current?.focus(), 0);
                    }}
                  >
                    + 직접 입력
                  </button>
                )}
              </div>
            </div>

            {/* 설명 */}
            <div className="ccDescSection">
              <div className="ccFieldLabel">설명</div>
              <textarea
                value={characterPersona}
                rows={4}
                maxLength={300}
                onChange={(e) => onPersonaChange(e.target.value)}
                placeholder={
                  "캐릭터의 특징, 좋아하는 것, 말투 등을 자유롭게 입력해주세요.\n예) 사과를 좋아하고, 새로운 요리를 배우는 걸 좋아해요."
                }
                className="ccTextarea"
              />
            </div>
          </div>

          <div className="ccDivider" />

          {/* 생성하기 */}
          <div className="ccGenSection">
            <div className="ccFieldLabel">생성하기</div>
            <div className="ccGenRow">
              <button
                type="button"
                className="ccGenBtn"
                disabled={isBusy || residents.length >= 10}
                onClick={handleGenerate}
              >
                <img src="/assets/character/icon-bear.png" alt="" className="ccBearIcon" />
                {isBusy ? "생성 중…" : "캐릭터 생성하기"}
              </button>
              <div className="ccGenStatus">
                {phase === "uploaded" && (
                  <div className="ccStatusMsg">
                    <span className="ccStatusStar">✿</span>
                    업로드 완료! 캐릭터 생성하기를 눌러주세요.
                  </div>
                )}
                {phase === "generating" && (
                  <>
                    <div className="ccProgressHeader">
                      <span className="ccProgressStar">✦</span>
                      <span className="ccProgressLabel">생성 중…</span>
                      <span className="ccProgressPct">{progress}%</span>
                    </div>
                    <div className="ccProgressBar">
                      <div className="ccProgressFill" style={{ width: `${progress}%` }} />
                    </div>
                    <div className="ccProgressMsg">{getProgressMsg(progress)}</div>
                  </>
                )}
                {phase === "result" && (
                  <div className="ccStatusDone">
                    <span>✓</span> 생성 완료! 오른쪽에서 확인해 보세요.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── 오른쪽 ── */}
        <div className="ccRight">
          <div className="ccSectionLabel">
            <span className="ccNumBadge">3</span>
            <span className="ccSectionTitle">미리보기</span>
          </div>

          <div className="ccPreviewPanel">
            {/* 생성 중 */}
            {phase === "generating" && (
              <>
                <div className="ccPreviewImgBox">
                  <img src="/assets/character/loading-burst.png" alt="" className="ccPreviewBg" />
                  <div className="ccShimmer" />
                </div>
                <div className="ccLoadingInfo">
                  <img src="/assets/character/loading-rabbit.png" alt="" className="ccRabbit" />
                  <div>
                    <div className="ccLoadingTitle">
                      마을에 어울리는 주민을
                      <br />
                      만들고 있어요...
                    </div>
                    <div className="ccLoadingSub">잠시만 기다려주세요!</div>
                  </div>
                </div>
                <div className="ccDots">
                  {([0, 0.18, 0.36, 0.54] as const).map((delay) => (
                    <span key={delay} className="ccDot" style={{ animationDelay: `${delay}s` }} />
                  ))}
                </div>
                <div className="ccPreviewProgress">
                  <span className="ccProgressDot" />
                  <div className="ccProgressBar">
                    <div className="ccProgressFill" style={{ width: `${progress}%` }} />
                  </div>
                  <span className="ccProgressDot" />
                </div>
                <div className="ccPreviewPct">{progress}%</div>
              </>
            )}

            {/* 이미지 업로드됨 */}
            {phase === "uploaded" && (
              <>
                <div className="ccPreviewImgBox ccPreviewImgBox--checker">
                  <img src={sourceImagePreview} alt="업로드 원본" className="ccUploadedImg" />
                </div>
                <div className="ccUploadedName">{sourceImageName}</div>
                <div className="ccUploadedHint">업로드한 이미지로 캐릭터를 만들 수 있어요!</div>
                <div className="ccActionRow">
                  <button
                    type="button"
                    className="ccDeleteBtn"
                    onClick={() => onImageUpload(undefined)}
                  >
                    <span>✕</span> 삭제
                  </button>
                  <button
                    type="button"
                    className="ccChangeBtn"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <span>↻</span> 이미지 변경
                  </button>
                </div>
              </>
            )}

            {/* 기본 / 결과 */}
            {phase === "result" && (
              <>
                <div className="ccPreviewImgBox">
                  <img
                    src="/assets/character/preview-scene.png"
                    alt="마을 미리보기"
                    className="ccPreviewBg"
                  />
                </div>
                <div className="ccResultInfo">
                  <div className="ccResultHeader">
                    <img src="/assets/character/avatar.png" alt="아바타" className="ccAvatar" />
                    <span className="ccResultNameText">
                      {characterName || "이름을 입력해주세요"}
                    </span>
                  </div>
                  {selectedKeywordCategories.length > 0 && (
                    <div className="ccResultChips">
                      {selectedKeywordCategories.slice(0, 3).map((kw, i) => {
                        const c = getChipColor(i);
                        return (
                          <span
                            key={kw}
                            className="ccChip"
                            style={{
                              background: c.bg,
                              color: c.fg,
                              borderColor: c.border,
                              boxShadow: `0 3px 9px -4px ${c.border}`,
                            }}
                          >
                            {kw}
                          </span>
                        );
                      })}
                    </div>
                  )}
                  {characterPersona && <div className="ccResultDesc">{characterPersona}</div>}
                  <div className="ccActionRow">
                    <button
                      type="button"
                      className="ccChangeBtn"
                      disabled={isBusy || residents.length >= 10}
                      onClick={handleGenerate}
                    >
                      <span>↻</span> 다시 생성
                    </button>
                    <button type="button" className="ccCompleteBtn" onClick={onClose}>
                      ✓ 완료
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 로딩 토스트 */}
      {phase === "generating" && !loadToastHidden && (
        <div className="ccToast">
          <img src="/assets/character/house.png" alt="" className="ccToastIcon" />
          <div>
            <div className="ccToastTitle">주민 입주 준비 중!</div>
            <div className="ccToastBody">
              멋진 주민이 태어나고 있어요!
              <br />
              조금만 기다려주세요!
            </div>
          </div>
          <button type="button" className="ccToastClose" onClick={() => setLoadToastHidden(true)}>
            ✕
          </button>
          <span className="ccToastStar">✦</span>
        </div>
      )}
    </div>
  );
}
