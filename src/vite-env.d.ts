/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE?: string;
  /** 카카오 JavaScript 앱 키 — 설정 시 카카오톡 공유 SDK 사용 (미설정 시 네이티브 공유/링크 복사로 폴백) */
  readonly VITE_KAKAO_JS_KEY?: string;
  readonly VITE_KAKAO_CLIENT_ID?: string;
  readonly VITE_KAKAO_REDIRECT_URI?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare const __APP_VERSION__: string;
