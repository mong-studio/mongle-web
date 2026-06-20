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
});
