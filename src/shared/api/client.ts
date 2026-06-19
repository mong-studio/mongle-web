import axios, { type AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from "axios";

export type AuthHandlers = {
  getAccessToken: () => string | null;
  refreshSession: () => Promise<boolean>;
  onSessionExpired: () => void;
};

let handlers: AuthHandlers = {
  getAccessToken: () => null,
  refreshSession: async () => false,
  onSessionExpired: () => {},
};

// 클라이언트 시작 시 주입
export function configureAuthClient(next: AuthHandlers): void {
  handlers = next;
}

const RETRY_EXEMPT_PATHS = ["/auth/login", "/auth/token/refresh", "/auth/logout"];

type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean };

export const apiClient = axios.create({
  // 프로덕션: VITE_API_BASE(=https://api.mongle-village.com)가 빌드 때 주입됨.
  // 로컬: 미설정이라 "/api/v1" 상대경로 → vite dev proxy(/api→localhost:8000).
  baseURL: `${import.meta.env.VITE_API_BASE ?? ""}/api/v1`,
  withCredentials: true,
  headers: {
    "X-Client-Type": "react",
    "X-Client-Version": __APP_VERSION__,
  },
});

apiClient.interceptors.request.use((config) => {
  const token = handlers.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshPromise: Promise<boolean> | null = null;

apiClient.interceptors.response.use((response: AxiosResponse) => {
  const validateStatus = response.config.validateStatus;
  const ok = validateStatus
    ? validateStatus(response.status)
    : response.status >= 200 && response.status < 300;

  if (!ok) {
    const err = new axios.AxiosError(
      `Request failed with status code ${response.status}`,
      String(response.status),
      response.config,
      undefined,
      response,
    );
    throw err;
  }
  return response;
});

apiClient.interceptors.response.use(undefined, async (error: AxiosError) => {
  const config = error.config as RetriableConfig | undefined;
  const status = error.response?.status;
  const isExempt = RETRY_EXEMPT_PATHS.some((path) => config?.url?.endsWith(path));

  if (!config || status !== 401 || config._retried || isExempt) {
    throw error;
  }

  // 동시 다발 401에서도 refresh는 1회만 - 진행 중인 promise를 공유한다.
  if (!refreshPromise) {
    refreshPromise = handlers.refreshSession().finally(() => {
      refreshPromise = null;
    });
  }
  const refreshed = await refreshPromise;

  if (!refreshed) {
    handlers.onSessionExpired();
    throw error;
  }

  return apiClient({ ...config, _retried: true } as RetriableConfig);
});
