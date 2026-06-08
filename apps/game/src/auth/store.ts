import { create } from "zustand";
import * as authApi from "./api.js";
import { configureAuthClient } from "./client.js";

export type SessionUser = {
  userId: string;
  email: string;
  userName: string;
  hasCharacter?: boolean;
};

export type AuthStatus = "loading" | "authenticated" | "anonymous";

type AuthState = {
  user: SessionUser | null;
  accessToken: string | null;
  status: AuthStatus;
  login: (email: string, password: string, rememberMe: boolean) => Promise<void>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
};

const REFRESH_MARGIN_SECONDS = 60;

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
      const refreshed = await refreshSession();
      if (!refreshed) {
        clearSession();
        return;
      }
      try {
        const me = await authApi.fetchMe();
        set({
          user: { userId: me.user_id, email: me.email, userName: me.user_name },
        });
      } catch {
        // user 정보 조회 실패해도 토큰 세션은 유효하므로 유지한다.
      }
    },
  };
});
