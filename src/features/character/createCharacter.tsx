import { useEffect, useRef, useState } from "react";
import { DeleteConfirmDialog } from "../../shared/ui/DeleteConfirmDialog.js";
import { fetchGenerationQuota, type GenerationQuota, retryAfterText } from "./api.js";
import "./createCharacter.css";

const PERSONALITY_CATEGORIES = [
  "모험적인",
  "차분한",
  "호기심많은",
  "다정한",
  "장난스러운",
  "부지런한",
  "강력한",
  "몽환적인",
  "분노가 많은",
  "용감한",
  "온화한",
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
  selectedKeywordCategories: string[];
  isBusy: boolean;
  lastCreatedResident?: Resident | null;
  onImageUpload: (file: File | undefined) => void;
  onNameChange: (value: string) => void;
  onPersonaChange: (value: string) => void;
  onToggleKeyword: (keyword: string) => void;
  onNotice: (message: string) => void;
  onSubmit: () => void;
  onCancelGeneration: () => void | Promise<void>;
  onConfirm: () => Promise<boolean>;
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
  lastCreatedResident,
  onImageUpload,
  onNameChange,
  onPersonaChange,
  onToggleKeyword,
  onNotice,
  onSubmit,
  onCancelGeneration,
  onConfirm,
  onClose,
}: Props) {
  const modalRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<"upload" | "text">("upload");
  const [nameError, setNameError] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [activeApple, setActiveApple] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [genFailed, setGenFailed] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [quota, setQuota] = useState<GenerationQuota | null>(null);
  const dragCounter = useRef(0);
  const wasBusyRef = useRef(false);
  // 생성 취소 시 실패 화면 대신 입력 화면으로 복귀하도록 표시하는 플래그.
  const cancelledRef = useRef(false);
  // 생성 시작 시점의 결과를 기억해, 종료 후 새 주민이 안 생겼으면 실패로 판정한다.
  const residentAtBusyStart = useRef(lastCreatedResident);
  const characterNameRef = useRef(characterName);
  characterNameRef.current = characterName;
  const characterPersonaRef = useRef(characterPersona);
  characterPersonaRef.current = characterPersona;

  const phase: "result" | "uploaded" | "generating" | "failed" | "idle-upload" | "idle-text" =
    isBusy
      ? "generating"
      : genFailed
        ? "failed"
        : showResult
          ? "result"
          : sourceImagePreview
            ? "uploaded"
            : mode === "upload"
              ? "idle-upload"
              : "idle-text";

  useEffect(() => {
    if (isBusy) {
      wasBusyRef.current = true;
      residentAtBusyStart.current = lastCreatedResident;
      setGenFailed(false);
      setShowResult(false);
      setActiveApple(0);
      const iv = setInterval(() => {
        setActiveApple((a) => (a + 1) % 4);
      }, 600);
      return () => clearInterval(iv);
    }
    if (wasBusyRef.current) {
      wasBusyRef.current = false;
      // 생성(또는 재생성)이 끝났으니 남은 생성 횟수를 갱신한다.
      fetchGenerationQuota()
        .then(setQuota)
        .catch(() => {});
      // 새 주민이 생겼으면 성공, 취소면 입력 화면 복귀, 그 외 변동 없으면 실패.
      if (lastCreatedResident && lastCreatedResident !== residentAtBusyStart.current) {
        setShowResult(true);
      } else if (cancelledRef.current) {
        cancelledRef.current = false;
      } else {
        setGenFailed(true);
      }
    }
    setActiveApple(0);
  }, [isBusy, lastCreatedResident]);

  // 마운트 시 계정당 일일 생성 횟수를 조회한다.
  useEffect(() => {
    fetchGenerationQuota()
      .then(setQuota)
      .catch(() => {});
  }, []);

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

  // 오늘 일일 생성 횟수를 모두 쓰면 더 생성할 수 없다(버튼 비활성화·생성 차단).
  const quotaFull = quota !== null && quota.used >= quota.limit;

  function handleGenerate() {
    if (isBusy || quotaFull) return;
    if (mode === "upload" && !sourceImagePreview) {
      setImageError(true);
      setTimeout(() => setImageError(false), 1500);
      onNotice("이미지를 먼저 업로드해주세요.");
      return;
    }
    if (!characterName.trim()) {
      setNameError(true);
      setTimeout(() => setNameError(false), 1500);
      return;
    }
    onSubmit();
  }

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
          <img src="/assets/icon/flower3.png" alt="" className="ccFlower ccFlower--l" />
          <h1 className="ccTitle">주민 캐릭터 만들기</h1>
          <img src="/assets/icon/flower3.png" alt="" className="ccFlower ccFlower--r" />
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
              <span className="ccSectionTitle">캐릭터 생성 방식</span>
            </div>
            <div className="ccCards">
              {/* 업로드 카드 */}
              <button
                type="button"
                className={`ccCard${mode === "upload" ? " ccCard--active" : ""}`}
                onClick={() => {
                  setMode("upload");
                  setShowResult(false);
                  setGenFailed(false);
                }}
              >
                <img src="/assets/character/photo.png" alt="" className="ccCardIcon" />
                <div>
                  <div className="ccCardHead">이미지 업로드</div>
                  <div className="ccCardSub">사진을 업로드해주세요</div>
                </div>
              </button>
              {/* 텍스트 카드 */}
              <button
                type="button"
                className={`ccCard${mode === "text" ? " ccCard--active" : ""}`}
                onClick={() => {
                  setMode("text");
                  setShowResult(false);
                  setGenFailed(false);
                  if (sourceImagePreview) onImageUpload(undefined);
                }}
              >
                <img src="/assets/character/magicWand.png" alt="" className="ccCardIcon" />
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
              <div className="ccChipLabelRow">
                <div className="ccFieldLabel ccChipLabel">
                  성격 키워드<span className="ccOptional">선택</span>
                </div>
                <span className="ccChipCount">{selectedKeywordCategories.length}/3</span>
              </div>
              <div className="ccChips">
                {PERSONALITY_CATEGORIES.map((kw, i) => {
                  const c = getChipColor(i);
                  const selected = selectedKeywordCategories.includes(kw);
                  const maxReached = !selected && selectedKeywordCategories.length >= 3;
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
                          : maxReached
                            ? { background: c.bg, color: c.fg, opacity: 0.4, cursor: "not-allowed" }
                            : { background: c.bg, color: c.fg }
                      }
                      onClick={() => {
                        if (maxReached) return;
                        onToggleKeyword(kw);
                      }}
                    >
                      {/* {selected && <span className="ccChipCheck">✓</span>} */}
                      {kw}
                    </button>
                  );
                })}
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
                disabled={isBusy || residents.length >= 10 || quotaFull}
                onClick={handleGenerate}
              >
                <img src="/assets/icon/bear.png" alt="" className="ccBearIcon" />
                캐릭터 생성하기
              </button>
              <div className="ccGenStatus">
                {quota && (
                  <span className="ccGenQuota">
                    생성 가능 횟수 {quota.used}/{quota.limit}
                    {quota.used >= quota.limit && (
                      <span className="ccGenQuotaReset">
                        {retryAfterText()} 다시 만들 수 있어요
                      </span>
                    )}
                  </span>
                )}
                {phase === "uploaded" && (
                  <div className="ccStatusMsg">
                    <span className="ccStatusStar">✿</span>
                    업로드 완료! 캐릭터 생성하기를 눌러주세요.
                  </div>
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
            {/* 이미지 업로드됨 */}
            {phase === "uploaded" && (
              <>
                <div className="ccPreviewImgBox ccPreviewImgBox--checker">
                  <img src={sourceImagePreview} alt="업로드 원본" className="ccUploadedImg" />
                </div>
                <div className="ccUploadedName">{sourceImageName}</div>
                <div className="ccUploadedHint">업로드한 이미지로 캐릭터를 만들 수 있어요!</div>
                {!isBusy && (
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
                )}
              </>
            )}

            {/* 이미지 업로드 드롭존 */}
            {phase === "idle-upload" && (
              // biome-ignore lint/a11y/noStaticElementInteractions: 드롭존은 클릭/드래그로 동작
              // biome-ignore lint/a11y/useKeyWithClickEvents: 드롭존은 키보드 대신 클릭/드래그로 동작
              <div
                className={`ccDropZone${dragOver ? " ccDropZone--active" : ""}${imageError ? " ccDropZone--error" : ""}`}
                onClick={() => fileInputRef.current?.click()}
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
              >
                <img src="/assets/character/photo.png" alt="" className="ccDropIcon" />
                <div className="ccDropTitle">여기에 파일을 올려주세요</div>
                <div className="ccDropSub">드래그 앤 드롭 또는 클릭하여 업로드 가능해요!</div>
                <ul className="ccDropConstraints">
                  <li>PNG · JPG · JPEG 파일 (최대 5MB)</li>
                </ul>
              </div>
            )}

            {/* 텍스트 자동생성 모드 */}
            {phase === "idle-text" && (
              <div className="ccTextIdle">
                <img src="/assets/character/magicWand.png" alt="" className="ccDropIcon" />
                <div className="ccDropTitle">텍스트로 자동 생성 모드</div>
                <div className="ccDropSub">
                  이름과 성격 키워드, 설명을 입력하면
                  <br />
                  AI가 캐릭터를 만들어드려요!
                </div>
              </div>
            )}

            {/* 생성 실패 */}
            {phase === "failed" && (
              <div className="ccTextIdle ccGenFailed">
                <img src="/assets/icon/flower3.png" alt="" className="ccDropIcon" />
                <div className="ccDropTitle">캐릭터 생성을 실패했어요</div>
                <div className="ccDropSub">다시 시도해 주세요ㅠㅠ</div>
              </div>
            )}

            {/* 생성 완료 결과 */}
            {phase === "result" && (
              <>
                <div
                  className={`ccPreviewImgBox${lastCreatedResident?.avatarUrl ? " ccPreviewImgBox--checker" : ""}`}
                >
                  <img
                    src={lastCreatedResident?.avatarUrl ?? "/assets/character/preview-scene.png"}
                    alt="생성된 캐릭터"
                    className={lastCreatedResident?.avatarUrl ? "ccUploadedImg" : "ccPreviewBg"}
                  />
                </div>
                <div className="ccResultInfo">
                  <div className="ccResultHeader">
                    {lastCreatedResident?.avatarUrl && (
                      <img src={lastCreatedResident.avatarUrl} alt="아바타" className="ccAvatar" />
                    )}
                    <span className="ccResultNameText">
                      {lastCreatedResident?.name || characterName || "이름을 입력해주세요"}
                    </span>
                  </div>
                  {selectedKeywordCategories.length > 0 && (
                    <div className="ccResultChips">
                      {selectedKeywordCategories.slice(0, 3).map((kw, i) => {
                        const catIdx = PERSONALITY_CATEGORIES.indexOf(
                          kw as (typeof PERSONALITY_CATEGORIES)[number],
                        );
                        const c = getChipColor(catIdx >= 0 ? catIdx : i);
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
                  {(lastCreatedResident?.personality || characterPersona) && (
                    <div className="ccResultDesc">
                      {lastCreatedResident?.personality || characterPersona}
                    </div>
                  )}
                  <div className="ccActionRow">
                    <DeleteConfirmDialog
                      trigger={
                        <button
                          type="button"
                          className="ccChangeBtn"
                          disabled={isBusy || residents.length >= 10 || quotaFull}
                        >
                          <span>↻</span> 다시 생성
                        </button>
                      }
                      title="다시 생성할까요?"
                      description="이미지를 다시 생성하면 생성 가능 횟수가 차감됩니다. 차감하고 다시 생성하시겠습니까?"
                      confirmLabel="다시 생성"
                      onConfirm={handleGenerate}
                    />
                    <button
                      type="button"
                      className="ccCompleteBtn"
                      disabled={confirming}
                      onClick={async () => {
                        setConfirming(true);
                        try {
                          const ok = await onConfirm();
                          if (ok) onClose();
                        } finally {
                          setConfirming(false);
                        }
                      }}
                    >
                      ✓ 입주하기
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* 생성 중 */}
            {phase === "generating" && (
              <>
                <div className="ccPreviewImgBox ccPreviewImgBox--checker ccPreviewImgBox--burst">
                  <img src="/assets/character/loading-burst.png" alt="" className="ccBurstImg" />
                </div>
                <div className="ccAppleLoader">
                  <p className="ccAppleTitle">생성 중</p>
                  <div className="ccAppleRow">
                    {[1, 2, 3, 4].map((n, i) => (
                      <div key={n} className="ccAppleStep">
                        <img
                          src={`/assets/icon/apple-stage-${n}.png`}
                          alt=""
                          className={`ccAppleImg${i === activeApple ? " ccAppleImg--active" : ""}`}
                        />
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="ccCancelGenBtn"
                    onClick={async () => {
                      cancelledRef.current = true;
                      // 서버 취소+환불(즉시)이 끝날 때까지 기다린 뒤 quota 를 갱신해
                      // 정확한 횟수를 표시한다(고정 지연에 의존하지 않는다).
                      await onCancelGeneration();
                      fetchGenerationQuota()
                        .then(setQuota)
                        .catch(() => {});
                    }}
                  >
                    생성 취소
                  </button>
                  <p className="ccCancelGenHint">취소하면 생성 횟수는 차감되지 않아요.</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
