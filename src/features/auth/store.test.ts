import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./api", () => ({
  login: vi.fn(),
  logout: vi.fn(),
  refreshToken: vi.fn(),
  fetchMe: vi.fn(),
}));
vi.mock("../../shared/api/client.js", () => ({ configureAuthClient: vi.fn() }));

import * as authApi from "./api.js";
import { useAuthStore } from "./store.js";

const LOGIN_RESPONSE = {
  access_token: "token-1",
  token_type: "Bearer",
  expires_in_seconds: 3600,
  users: {
    user_id: "u-1",
    email: "test@test.com",
    user_name: "테스터",
    has_character: false,
  },
};

describe("useAuthStore", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    sessionStorage.clear();
    useAuthStore.setState({ user: null, accessToken: null, status: "loading" });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("login 성공 시 authenticated 상태가 된다", async () => {
    vi.mocked(authApi.login).mockResolvedValue(LOGIN_RESPONSE);

    await useAuthStore.getState().login("test@test.com", "password123", true);

    const state = useAuthStore.getState();
    expect(state.status).toBe("authenticated");
    expect(state.accessToken).toBe("token-1");
    expect(state.user).toEqual({
      userId: "u-1",
      email: "test@test.com",
      userName: "테스터",
      hasCharacter: false,
    });
  });

  it("login 실패 시 에러를 전파하고 세션을 만들지 않는다", async () => {
    vi.mocked(authApi.login).mockRejectedValue(new Error("INVALID_CREDENTIALS"));

    await expect(useAuthStore.getState().login("test@test.com", "bad", false)).rejects.toThrow();
    expect(useAuthStore.getState().accessToken).toBeNull();
  });

  it("만료 60초 전에 자동으로 재발급한다", async () => {
    vi.mocked(authApi.login).mockResolvedValue(LOGIN_RESPONSE);
    vi.mocked(authApi.refreshToken).mockResolvedValue({
      access_token: "token-2",
      expires_in_seconds: 3600,
    });

    await useAuthStore.getState().login("test@test.com", "password123", true);
    await vi.advanceTimersByTimeAsync((3600 - 60) * 1000);

    expect(authApi.refreshToken).toHaveBeenCalledTimes(1);
    expect(useAuthStore.getState().accessToken).toBe("token-2");
  });

  it("선제 재발급이 일시적(네트워크)으로 실패해도 세션을 유지하고 재시도한다", async () => {
    vi.mocked(authApi.login).mockResolvedValue(LOGIN_RESPONSE);
    // 1차: 네트워크 에러(401 아님) → 세션 유지, 2차(재시도): 성공
    vi.mocked(authApi.refreshToken)
      .mockRejectedValueOnce(new Error("network down"))
      .mockResolvedValue({ access_token: "token-3", expires_in_seconds: 3600 });

    await useAuthStore.getState().login("test@test.com", "password123", true);
    await vi.advanceTimersByTimeAsync((3600 - 60) * 1000);
    expect(useAuthStore.getState().status).toBe("authenticated"); // 로그아웃되지 않음

    await vi.advanceTimersByTimeAsync(30 * 1000); // 재시도
    expect(useAuthStore.getState().accessToken).toBe("token-3");
  });

  it("선제 재발급이 401(refresh token 거부)이면 로그아웃한다", async () => {
    vi.mocked(authApi.login).mockResolvedValue(LOGIN_RESPONSE);
    const authError = Object.assign(new Error("unauthorized"), {
      isAxiosError: true,
      response: { status: 401 },
    });
    vi.mocked(authApi.refreshToken).mockRejectedValue(authError);

    await useAuthStore.getState().login("test@test.com", "password123", true);
    await vi.advanceTimersByTimeAsync((3600 - 60) * 1000);

    expect(useAuthStore.getState().status).toBe("anonymous");
    expect(useAuthStore.getState().accessToken).toBeNull();
  });

  it("restoreSession 성공 시 me를 조회해 user를 복원한다", async () => {
    vi.mocked(authApi.refreshToken).mockResolvedValue({
      access_token: "token-9",
      expires_in_seconds: 3600,
    });
    vi.mocked(authApi.fetchMe).mockResolvedValue({
      user_id: "u-1",
      email: "test@test.com",
      user_name: "테스터",
      token_balance: 5,
      login_type: "email",
    });

    await useAuthStore.getState().restoreSession();

    const state = useAuthStore.getState();
    expect(state.status).toBe("authenticated");
    expect(state.accessToken).toBe("token-9");
    expect(state.user?.userName).toBe("테스터");
  });

  it("동시에 여러 refresh가 트리거돼도 네트워크 호출은 1회만 한다(rotation race 방지)", async () => {
    // 서버는 refresh마다 토큰을 rotation하므로 같은 쿠키로 동시 호출하면 하나가 401난다.
    // single-flight로 합쳐 1회만 보내야 한다.
    let resolveRefresh: (v: { access_token: string; expires_in_seconds: number }) => void =
      () => {};
    vi.mocked(authApi.refreshToken).mockReturnValue(
      new Promise((resolve) => {
        resolveRefresh = resolve;
      }),
    );

    // 저장된 토큰이 없으면 restoreSession은 refreshSession을 호출한다 → 동시 2건.
    const p1 = useAuthStore.getState().restoreSession();
    const p2 = useAuthStore.getState().restoreSession();
    resolveRefresh({ access_token: "token-x", expires_in_seconds: 3600 });
    vi.mocked(authApi.fetchMe).mockResolvedValue({
      user_id: "u-1",
      email: "test@test.com",
      user_name: "테스터",
      token_balance: 0,
      login_type: "email",
    });
    await Promise.all([p1, p2]);

    expect(authApi.refreshToken).toHaveBeenCalledTimes(1);
  });

  it("restoreSession 실패 시 anonymous가 된다", async () => {
    vi.mocked(authApi.refreshToken).mockRejectedValue(new Error("no cookie"));

    await useAuthStore.getState().restoreSession();

    expect(useAuthStore.getState().status).toBe("anonymous");
  });

  it("logout은 서버 실패와 무관하게 로컬 세션을 비운다", async () => {
    vi.mocked(authApi.login).mockResolvedValue(LOGIN_RESPONSE);
    vi.mocked(authApi.logout).mockRejectedValue(new Error("network"));
    await useAuthStore.getState().login("test@test.com", "password123", true);

    await useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.status).toBe("anonymous");
    expect(state.accessToken).toBeNull();
    expect(state.user).toBeNull();
  });

  it("setSocialSession sets authenticated user and token", () => {
    useAuthStore.getState().setSocialSession({
      status: "authenticated",
      access_token: "atk",
      token_type: "Bearer",
      expires_in_seconds: 3600,
      users: {
        user_id: "u1",
        email: "s@example.com",
        user_name: "소셜",
        has_character: false,
      },
    });
    const state = useAuthStore.getState();
    expect(state.status).toBe("authenticated");
    expect(state.accessToken).toBe("atk");
    expect(state.user?.email).toBe("s@example.com");
  });
});
