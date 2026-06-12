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
};

const REFRESH_MARGIN_SECONDS = 60;
const SESSION_KEY = "mongle_access";

let refreshTimer: ReturnType<typeof setTimeout> | null = null;

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
    const delayMs = Math.max((expiresInSeconds - REFRESH_MARGIN_SECONDS) * 1000, 0);
    refreshTimer = setTimeout(() => {
      void refreshSession().then((ok) => {
        if (!ok) {
          clearSession();
        }
      });
    }, delayMs);
  };

  const refreshSession = async (): Promise<boolean> => {
    try {
      const data = await authApi.refreshToken();
      sessionStorage.setItem(SESSION_KEY, data.access_token);
      set({ accessToken: data.access_token, status: "authenticated" });
      scheduleRefresh(data.expires_in_seconds);
      return true;
    } catch {
      return false;
    }
  };

  configureAuthClient({
    getAccessToken: () => get().accessToken,
    refreshSession,
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
      if (!refreshed) {
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
