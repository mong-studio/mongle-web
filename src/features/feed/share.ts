// 피드 공유 로직 — 카카오톡 / 인스타그램 / 링크 복사.
// 외부 키 없이도 동작하도록 단계적 폴백을 둔다:
//   1) 가능한 브랜드 전용 공유(카카오 SDK)
//   2) OS 네이티브 공유 시트(Web Share API, 모바일)
//   3) 클립보드 링크 복사(어디서나 동작)

export interface SharePayload {
  /** 공유할 게시물 링크 */
  url: string;
  /** 공유 제목 */
  title: string;
  /** 공유 본문(미리보기 설명) */
  text: string;
  /** 카드 썸네일(게시물 생성 이미지). 공개 http(s) URL만 유효. */
  imageUrl?: string;
}

export interface ShareResult {
  ok: boolean;
  /** 사용자에게 보여줄 짧은 안내 문구 */
  message: string;
}

interface KakaoSdk {
  isInitialized: () => boolean;
  init: (key: string) => void;
  Share: {
    sendDefault: (settings: Record<string, unknown>) => void;
  };
}

declare global {
  interface Window {
    Kakao?: KakaoSdk;
  }
}

const KAKAO_JS_KEY = import.meta.env.VITE_KAKAO_JS_KEY;
const KAKAO_SDK_SRC = "https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js";

// 클립보드에 텍스트 복사 — Clipboard API → execCommand 폴백.
async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (error) {
    console.error("클립보드 복사 실패:", error);
  }

  try {
    const area = document.createElement("textarea");
    area.value = text;
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(area);
    return ok;
  } catch (error) {
    console.error("클립보드 복사 폴백 실패:", error);
    return false;
  }
}

// OS 네이티브 공유 시트(Web Share API). 미지원이면 null 반환.
async function tryNativeShare(payload: SharePayload): Promise<boolean | null> {
  if (typeof navigator === "undefined" || typeof navigator.share !== "function") {
    return null;
  }
  try {
    await navigator.share({ title: payload.title, text: payload.text, url: payload.url });
    return true;
  } catch (error) {
    // 사용자가 취소하면 AbortError — 실패가 아니라 취소로 처리.
    if (error instanceof DOMException && error.name === "AbortError") return false;
    console.error("네이티브 공유 실패:", error);
    return null;
  }
}

// 카카오 JS SDK를 1회 로드/초기화한다. 키가 없으면 false.
let kakaoLoading: Promise<boolean> | null = null;
function ensureKakao(): Promise<boolean> {
  if (!KAKAO_JS_KEY) return Promise.resolve(false);
  if (window.Kakao?.isInitialized()) return Promise.resolve(true);
  if (kakaoLoading) return kakaoLoading;

  kakaoLoading = new Promise<boolean>((resolve) => {
    const finish = () => {
      try {
        if (window.Kakao && !window.Kakao.isInitialized()) {
          window.Kakao.init(KAKAO_JS_KEY);
        }
        resolve(Boolean(window.Kakao?.isInitialized()));
      } catch (error) {
        console.error("카카오 SDK 초기화 실패:", error);
        resolve(false);
      }
    };

    if (window.Kakao) {
      finish();
      return;
    }
    const script = document.createElement("script");
    script.src = KAKAO_SDK_SRC;
    script.async = true;
    script.onload = finish;
    script.onerror = () => {
      console.error("카카오 SDK 로드 실패");
      resolve(false);
    };
    document.head.appendChild(script);
  });
  return kakaoLoading;
}

async function fallbackCopy(payload: SharePayload, prefix: string): Promise<ShareResult> {
  const copied = await copyToClipboard(payload.url);
  return copied
    ? { ok: true, message: `${prefix} 링크를 복사했어요.` }
    : { ok: false, message: "공유에 실패했어요. 잠시 후 다시 시도해주세요." };
}

// ── 공개 핸들러 ──────────────────────────────────────────────────────────────

export async function shareToKakao(payload: SharePayload): Promise<ShareResult> {
  const ready = await ensureKakao();
  if (ready && window.Kakao) {
    try {
      window.Kakao.Share.sendDefault({
        objectType: "feed",
        content: {
          title: payload.title,
          description: payload.text,
          imageUrl: payload.imageUrl ?? "",
          link: { mobileWebUrl: payload.url, webUrl: payload.url },
        },
        buttons: [
          {
            title: "몽글마을에서 보기",
            link: { mobileWebUrl: payload.url, webUrl: payload.url },
          },
        ],
      });
      return { ok: true, message: "카카오톡으로 공유했어요." };
    } catch (error) {
      console.error("카카오 공유 실패:", error);
    }
  }

  const native = await tryNativeShare(payload);
  if (native === true) return { ok: true, message: "공유했어요." };
  if (native === false) return { ok: false, message: "공유를 취소했어요." };

  return fallbackCopy(payload, "카카오톡 공유를 지원하지 않는 환경이라");
}

export async function shareToInstagram(payload: SharePayload): Promise<ShareResult> {
  // 인스타그램은 웹에서 임의 링크 공유 API가 없다.
  // 모바일이면 네이티브 시트(인스타 포함)를 띄우고, 아니면 링크 복사로 안내.
  const native = await tryNativeShare(payload);
  if (native === true) return { ok: true, message: "공유했어요." };
  if (native === false) return { ok: false, message: "공유를 취소했어요." };

  const copied = await copyToClipboard(payload.url);
  return copied
    ? { ok: true, message: "링크를 복사했어요. 인스타그램에 붙여넣어 공유하세요." }
    : { ok: false, message: "공유에 실패했어요. 잠시 후 다시 시도해주세요." };
}

export async function shareCopyLink(payload: SharePayload): Promise<ShareResult> {
  const copied = await copyToClipboard(payload.url);
  return copied
    ? { ok: true, message: "링크를 복사했어요!" }
    : { ok: false, message: "복사에 실패했어요. 잠시 후 다시 시도해주세요." };
}

// 게시물로부터 공유 페이로드를 만든다. 앱 진입 링크 + 작성자/내용 미리보기.
export function buildPostShare(
  postId: string,
  authorName: string,
  content: string,
  imageUrl?: string,
): SharePayload {
  const base =
    typeof window !== "undefined" ? `${window.location.origin}${window.location.pathname}` : "";
  const snippet = content.trim().split("\n")[0]?.slice(0, 60) ?? "";
  // 카카오는 공개 http(s) 썸네일만 받는다. raw 오브젝트 키 등은 버린다.
  const cardImage = imageUrl && /^https?:\/\//.test(imageUrl) ? imageUrl : undefined;
  return {
    url: `${base}?post=${encodeURIComponent(postId)}`,
    title: `${authorName}님의 몽글마을 소식`,
    text: snippet || "몽글마을의 따뜻한 소식을 확인해보세요 🌱",
    imageUrl: cardImage,
  };
}
