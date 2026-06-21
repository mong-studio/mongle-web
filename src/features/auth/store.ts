import { isAxiosError } from "axios";
import { create } from "zustand";
import { configureAuthClient } from "../../shared/api/client.js";
import * as authApi from "./api.js";

export type SessionUser = {
  userId: string;
  email: string;
  userName: string;
  hasCharacter?: boolean;
};

export type AuthStatus = "loading" | "authenticated" | "anonymous";

export type AuthState = {
  user: SessionUser | null;
  accessToken: string | null;
  status: AuthStatus;
  login: (email: string, password: string, rememberMe: boolean) => Promise<void>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
  setSocialSession: (data: import("./api.js").KakaoAuthenticated) => void;
};

const REFRESH_MARGIN_SECONDS = 60;
// 일시적(네트워크/오프라인/백그라운드 throttle) 실패 후 재시도 간격.
// ponytail: 고정 30초. 잦은 백오프가 필요해지면 그때 추가.
const RETRY_DELAY_SECONDS = 30;
const SESSION_KEY = "mongle_access";

// "ok": 재발급 성공 / "expired": refresh token이 실제로 거부됨(진짜 로그아웃)
// "error": 일시적 실패(세션 유지하고 재시도)
type RefreshResult = "ok" | "expired" | "error";

let refreshTimer: ReturnType<typeof setTimeout> | null = null;
// access token 만료 예정 시각(ms). 탭 복귀/온라인 시 재발급 필요 여부 판단용.
let accessExpiresAtMs = 0;

function clearRefreshTimer(): void {
  if (refreshTimer) {
    clearTimeout(refreshTimer);
    refreshTimer = null;
  }
}

export const useAuthStore = create<AuthState>((set, get) => {
  const clearSession = (): void => {
    clearRefreshTimer();
    sessionStorage.removeItem(SESSION_KEY);
    set({ user: null, accessToken: null, status: "anonymous" });
  };

  const scheduleRefresh = (expiresInSeconds: number): void => {
    clearRefreshTimer();
    accessExpiresAtMs = Date.now() + expiresInSeconds * 1000;
    const delayMs = Math.max((expiresInSeconds - REFRESH_MARGIN_SECONDS) * 1000, 0);
    refreshTimer = setTimeout(() => void runProactiveRefresh(), delayMs);
  };

  // 타이머/복귀로 트리거되는 선제 재발급. 성공 시 scheduleRefresh가 다음 타이머를 건다.
  // 일시적 실패는 세션을 유지하고 짧게 재시도한다(절전·백그라운드 throttle 복구용).
  const runProactiveRefresh = async (): Promise<void> => {
    const result = await refreshSession();
    if (result === "expired") {
      clearSession();
    } else if (result === "error") {
      clearRefreshTimer();
      refreshTimer = setTimeout(() => void runProactiveRefresh(), RETRY_DELAY_SECONDS * 1000);
    }
  };

  // 타이머·복귀·인터셉터(401)가 동시에 호출해도 refresh는 1회만.
  // 서버가 refresh 시 토큰을 rotation(기존 행 삭제)하므로, 중복 호출이 겹치면
  // 두 번째가 삭제된 토큰으로 401을 받아 멀쩡한 세션이 풀린다. 진행 중 promise를 공유한다.
  let inFlightRefresh: Promise<RefreshResult> | null = null;

  const doRefresh = async (): Promise<RefreshResult> => {
    try {
      const data = await authApi.refreshToken();
      sessionStorage.setItem(SESSION_KEY, data.access_token);
      set({ accessToken: data.access_token, status: "authenticated" });
      scheduleRefresh(data.expires_in_seconds);
      return "ok";
    } catch (error) {
      // 401 = refresh token이 실제로 거부됨(만료/회전 불일치) → 진짜 로그아웃.
      // 그 외(네트워크/오프라인/백그라운드 throttle) = 일시적 → 세션 유지.
      return isAxiosError(error) && error.response?.status === 401 ? "expired" : "error";
    }
  };

  const refreshSession = (): Promise<RefreshResult> => {
    if (inFlightRefresh) return inFlightRefresh;
    inFlightRefresh = doRefresh().finally(() => {
      inFlightRefresh = null;
    });
    return inFlightRefresh;
  };

  // 탭 복귀/네트워크 재연결 시, 토큰이 만료 임박이면 재발급한다.
  // 백그라운드에서 throttle/정지됐던 타이머를 복구하는 안전망.
  const refreshOnWake = (): void => {
    if (get().status !== "authenticated") return;
    if (Date.now() < accessExpiresAtMs - REFRESH_MARGIN_SECONDS * 1000) return;
    void runProactiveRefresh();
  };

  if (typeof document !== "undefined") {
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") refreshOnWake();
    });
  }
  if (typeof window !== "undefined") {
    window.addEventListener("online", refreshOnWake);
  }

  configureAuthClient({
    getAccessToken: () => get().accessToken,
    refreshSession: async () => (await refreshSession()) === "ok",
    onSessionExpired: clearSession,
  });

  return {
    user: null,
    accessToken: null,
    status: "loading",

    login: async (email, password, rememberMe) => {
      const data = await authApi.login(email, password, rememberMe);
      sessionStorage.setItem(SESSION_KEY, data.access_token);
      set({
        user: {
          userId: data.users.user_id,
          email: data.users.email,
          userName: data.users.user_name,
          hasCharacter: data.users.has_character,
        },
        accessToken: data.access_token,
        status: "authenticated",
      });
      scheduleRefresh(data.expires_in_seconds);
    },

    setSocialSession: (data) => {
      sessionStorage.setItem(SESSION_KEY, data.access_token);
      set({
        user: {
          userId: data.users.user_id,
          email: data.users.email,
          userName: data.users.user_name,
          hasCharacter: data.users.has_character,
        },
        accessToken: data.access_token,
        status: "authenticated",
      });
      scheduleRefresh(data.expires_in_seconds);
    },

    logout: async () => {
      try {
        await authApi.logout();
      } catch {
        // 서버 호출이 실패해도 로컬 세션은 비운다.
      }
      clearSession();
    },

    restoreSession: async () => {
      const saved = sessionStorage.getItem(SESSION_KEY);
      if (saved) {
        set({ accessToken: saved, status: "authenticated" });
        try {
          const me = await authApi.fetchMe();
          set({ user: { userId: me.user_id, email: me.email, userName: me.user_name } });
        } catch {
          // 401: interceptor가 refresh를 시도하고 실패 시 onSessionExpired로 clearSession을 호출한다.
          // 네트워크 에러 등 그 외 실패: 직접 세션을 초기화해 로그인 버튼을 표시한다.
          clearSession();
        }
        return;
      }

      const refreshed = await refreshSession();
      if (refreshed !== "ok") {
        clearSession();
        return;
      }
      try {
        const me = await authApi.fetchMe();
        set({ user: { userId: me.user_id, email: me.email, userName: me.user_name } });
      } catch {
        clearSession();
      }
    },
  };
});
