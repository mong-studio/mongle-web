import type { InternalAxiosRequestConfig } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient, configureAuthClient } from "./client.js";

type AdapterHandler = (config: InternalAxiosRequestConfig) => {
  status: number;
  data: unknown;
};

/** axios 어댑터를 가짜로 교체해 네트워크 없이 응답을 흉내 낸다. */
function useAdapter(handler: AdapterHandler) {
  apiClient.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
    const { status, data } = handler(config as InternalAxiosRequestConfig);
    return {
      data,
      status,
      statusText: String(status),
      headers: {},
      config: config as InternalAxiosRequestConfig,
    };
  };
}

describe("apiClient", () => {
  beforeEach(() => {
    configureAuthClient({
      getAccessToken: () => null,
      refreshSession: async () => false,
      onSessionExpired: () => {},
    });
  });

  it("공통 헤더(X-Client-Type)와 토큰을 부착한다", async () => {
    configureAuthClient({
      getAccessToken: () => "token-1",
      refreshSession: async () => false,
      onSessionExpired: () => {},
    });
    let seen: InternalAxiosRequestConfig | undefined;
    useAdapter((config) => {
      seen = config;
      return { status: 200, data: {} };
    });

    await apiClient.get("/todos");

    expect(seen?.headers.Authorization).toBe("Bearer token-1");
    expect(seen?.headers["X-Client-Type"]).toBe("react");
    expect(seen?.headers["X-Client-Version"]).toBe(__APP_VERSION__);
  });

  it("401이면 refresh 후 원요청을 1회 재시도한다", async () => {
    const calls: string[] = [];
    const refreshSession = vi.fn(async () => {
      configureAuthClient({
        getAccessToken: () => "token-2",
        refreshSession,
        onSessionExpired: () => {},
      });
      return true;
    });
    configureAuthClient({
      getAccessToken: () => "token-1",
      refreshSession,
      onSessionExpired: () => {},
    });
    useAdapter((config) => {
      calls.push(`${config.headers.Authorization}`);
      return calls.length === 1 ? { status: 401, data: {} } : { status: 200, data: { ok: true } };
    });

    const response = await apiClient.get("/todos");

    expect(refreshSession).toHaveBeenCalledTimes(1);
    expect(calls).toEqual(["Bearer token-1", "Bearer token-2"]);
    expect(response.data).toEqual({ ok: true });
  });

  it("동시 401은 refresh를 한 번만 수행한다", async () => {
    const refreshSession = vi.fn(async () => true);
    configureAuthClient({
      getAccessToken: () => "token-1",
      refreshSession,
      onSessionExpired: () => {},
    });
    let count = 0;
    useAdapter(() => {
      count += 1;
      return count <= 2 ? { status: 401, data: {} } : { status: 200, data: {} };
    });

    await Promise.all([apiClient.get("/a"), apiClient.get("/b")]);

    expect(refreshSession).toHaveBeenCalledTimes(1);
  });

  it("refresh 실패 시 onSessionExpired를 호출하고 에러를 던진다", async () => {
    const onSessionExpired = vi.fn();
    configureAuthClient({
      getAccessToken: () => "token-1",
      refreshSession: async () => false,
      onSessionExpired,
    });
    useAdapter(() => ({ status: 401, data: {} }));

    await expect(apiClient.get("/todos")).rejects.toThrow();
    expect(onSessionExpired).toHaveBeenCalledTimes(1);
  });

  it("auth 엔드포인트의 401은 재시도하지 않는다", async () => {
    const refreshSession = vi.fn(async () => true);
    configureAuthClient({
      getAccessToken: () => null,
      refreshSession,
      onSessionExpired: () => {},
    });
    useAdapter(() => ({ status: 401, data: {} }));

    await expect(apiClient.post("/auth/login", {})).rejects.toThrow();
    expect(refreshSession).not.toHaveBeenCalled();
  });
});
