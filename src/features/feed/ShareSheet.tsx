import type React from "react";
import { useState } from "react";
import type { ThemeTokens } from "./feedData.js";
import {
  type SharePayload,
  type ShareResult,
  shareCopyLink,
  shareToInstagram,
  shareToKakao,
} from "./share.js";

interface ShareSheetProps {
  th: ThemeTokens;
  share: SharePayload;
  onClose: () => void;
}

interface SnsItem {
  id: string;
  label: string;
  bg: string;
  icon: React.ReactNode;
  run: (payload: SharePayload) => Promise<ShareResult>;
}

// SNS 공유 대상 — 카카오톡 / 인스타그램 / 링크 복사. 각 버튼은 실제 공유 동작을 수행한다.
const SNS: SnsItem[] = [
  {
    id: "kakao",
    label: "카카오톡",
    bg: "#FEE500",
    run: shareToKakao,
    icon: (
      <svg aria-hidden="true" width="26" height="26" viewBox="0 0 40 40">
        <ellipse cx="20" cy="19.5" rx="16" ry="14" fill="#3C1E1E" />
        <path
          d="M13 22c1-4 7-7 13-4"
          stroke="#FEE500"
          strokeWidth="2.2"
          fill="none"
          strokeLinecap="round"
        />
        <circle cx="15" cy="18" r="2" fill="#FEE500" />
        <circle cx="20" cy="16.5" r="2" fill="#FEE500" />
        <circle cx="25" cy="18" r="2" fill="#FEE500" />
      </svg>
    ),
  },
  {
    id: "instagram",
    label: "인스타그램",
    bg: "linear-gradient(135deg,#f9ce34,#ee2a7b,#6228d7)",
    run: shareToInstagram,
    icon: (
      <svg
        aria-hidden="true"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#fff"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="2" y="2" width="20" height="20" rx="5" />
        <circle cx="12" cy="12" r="5" />
        <circle cx="17.5" cy="6.5" r="1.2" fill="#fff" stroke="none" />
      </svg>
    ),
  },
  {
    id: "link",
    label: "링크 복사",
    bg: "#f0ebe3",
    run: shareCopyLink,
    icon: (
      <svg
        aria-hidden="true"
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#6b4f33"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      </svg>
    ),
  },
];

const CLOSE_DELAY = 1100;

export function ShareSheet({ th, share, onClose }: ShareSheetProps) {
  const [toast, setToast] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleShare(item: SnsItem) {
    if (busy) return;
    setBusy(true);
    try {
      const result = await item.run(share);
      setToast(result.message);
      if (result.ok) setTimeout(onClose, CLOSE_DELAY);
    } catch (error) {
      console.error("공유 처리 실패:", error);
      setToast("공유에 실패했어요. 잠시 후 다시 시도해주세요.");
    } finally {
      setBusy(false);
    }
  }

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: sheet backdrop click-to-dismiss
    // biome-ignore lint/a11y/useKeyWithClickEvents: sheet backdrop click-to-dismiss
    <div className="share-backdrop" onClick={onClose}>
      {/* biome-ignore lint/a11y/noStaticElementInteractions: stop propagation only */}
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: stop propagation only */}
      <div
        className="share-sheet"
        style={{ background: th.cardBg }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="share-handle" style={{ background: th.modalEdge }} />
        <div className="share-title" style={{ color: th.ink }}>
          공유하기
        </div>
        <div className="share-sns-row">
          {SNS.map((s) => (
            <button
              key={s.id}
              type="button"
              className="share-sns-item"
              disabled={busy}
              onClick={() => handleShare(s)}
            >
              <span className="share-sns-icon" style={{ background: s.bg }}>
                {s.icon}
              </span>
              <span className="share-sns-label" style={{ color: th.inkFaint }}>
                {s.label}
              </span>
            </button>
          ))}
        </div>
        {toast && (
          <div className="share-toast" style={{ background: th.rowBg, color: th.ink }}>
            {toast}
          </div>
        )}
        <button
          type="button"
          className="share-cancel"
          style={{ background: th.rowBg, borderColor: th.modalEdge, color: th.ink }}
          onClick={onClose}
        >
          닫기
        </button>
      </div>
    </div>
  );
}
