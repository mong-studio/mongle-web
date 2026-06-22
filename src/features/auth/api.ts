import { isAxiosError } from "axios";
import { apiClient } from "../../shared/api/client.js";

export type AuthUser = {
  user_id: string;
  email: string;
  user_name: string;
  has_character: boolean;
};

export type LoginResponse = {
  access_token: string;
  token_type: string;
  expires_in_seconds: number;
  users: AuthUser;
};

export type RefreshResponse = {
  access_token: string;
  expires_in_seconds: number;
};

export type MeResponse = {
  user_id: string;
  email: string;
  user_name: string;
  token_balance: number;
  login_type: string;
};

export type SignupPayload = {
  email: string;
  password: string;
  user_name: string;
  job: string;
  birth: string;
  is_aiconsent: boolean;
  verification_token: string;
};

export type SignupResponse = {
  user_id: string;
  email: string;
  user_name: string;
  token_balance: number;
};

export async function login(
  email: string,
  password: string,
  rememberMe: boolean,
): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>("/auth/login", {
    email,
    password,
    remember_me: rememberMe,
  });
  return data;
}

export async function refreshToken(): Promise<RefreshResponse> {
  const { data } = await apiClient.post<RefreshResponse>("/auth/token/refresh");
  return data;
}

export async function logout(): Promise<void> {
  await apiClient.post("/auth/logout");
}

export async function fetchMe(): Promise<MeResponse> {
  const { data } = await apiClient.get<MeResponse>("/auth/me/");
  return data;
}

export async function requestEmailVerification(email: string): Promise<void> {
  await apiClient.post("/auth/email-verification", { email, purpose: "SIGNUP" });
}

export async function confirmEmailVerification(
  email: string,
  code: string,
): Promise<{ verification_token: string }> {
  const { data } = await apiClient.post<{ verification_token: string }>(
    "/auth/email-verification/confirm",
    { email, purpose: "SIGNUP", code },
  );
  return data;
}

export async function signup(payload: SignupPayload): Promise<SignupResponse> {
  const { data } = await apiClient.post<SignupResponse>("/auth/signup", payload);
  return data;
}

export async function requestPasswordResetCode(email: string): Promise<void> {
  await apiClient.post("/auth/email-verification", { email, purpose: "PASSWORD_RESET" });
}

export async function confirmPasswordResetCode(
  email: string,
  code: string,
): Promise<{ verification_token: string }> {
  const { data } = await apiClient.post<{ verification_token: string }>(
    "/auth/email-verification/confirm",
    { email, purpose: "PASSWORD_RESET", code },
  );
  return data;
}

export async function resetPassword(
  email: string,
  newPassword: string,
  verificationToken: string,
): Promise<void> {
  await apiClient.post("/auth/password-reset", {
    email,
    new_password: newPassword,
    verification_token: verificationToken,
  });
}

export const KAKAO_STATE_KEY = "mongle_kakao_state";

export type KakaoAuthenticated = LoginResponse & { status: "authenticated" };
export type KakaoProfileRequired = {
  status: "profile_required";
  signup_token: string;
  email: string;
};
export type KakaoLoginResult = KakaoAuthenticated | KakaoProfileRequired;

export type KakaoCompletePayload = {
  signup_token: string;
  user_name: string;
  job: string;
  birth: string;
  is_aiconsent: boolean;
};

export function startKakaoLogin(): void {
  const clientId = import.meta.env.VITE_KAKAO_CLIENT_ID;
  const redirectUri = import.meta.env.VITE_KAKAO_REDIRECT_URI;
  if (!clientId || !redirectUri) {
    throw new Error("카카오 로그인 설정이 없어요.");
  }
  const state = crypto.randomUUID();
  sessionStorage.setItem(KAKAO_STATE_KEY, state);
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: "account_email",
    state,
  });
  window.location.assign(`https://kauth.kakao.com/oauth/authorize?${params}`);
}

export async function exchangeKakaoCode(code: string): Promise<KakaoLoginResult> {
  const { data } = await apiClient.post<KakaoLoginResult>("/auth/social/kakao", { code });
  return data;
}

export async function completeKakaoSignup(
  payload: KakaoCompletePayload,
): Promise<KakaoAuthenticated> {
  const { data } = await apiClient.post<KakaoAuthenticated>("/auth/social/kakao/complete", payload);
  return data;
}

const ERROR_MESSAGES: Record<string, string> = {
  INVALID_CREDENTIALS: "이메일 또는 비밀번호가 올바르지 않아요.",
  INVALID_CURRENT_PASSWORD: "현재 비밀번호가 올바르지 않아요.",
  VALIDATION_ERROR: "입력값을 다시 확인해 주세요.",
  EMAIL_DUPLICATED: "이미 가입된 이메일이에요.",
  USER_NOT_FOUND: "등록되어 있지 않은 이메일입니다.",
  EMAIL_NOT_VERIFIED: "이메일 인증을 먼저 완료해 주세요.",
  INVALID_VERIFICATION_CODE: "인증 코드가 올바르지 않아요.",
  VERIFICATION_CODE_EXPIRED: "인증 코드가 만료됐어요. 다시 요청해 주세요.",
  EMAIL_VERIFICATION_RATE_LIMITED: "잠시 후 다시 인증 코드를 요청해 주세요.",
  LOGIN_RATE_LIMITED: "로그인 시도가 너무 많아요. 잠시 후 다시 시도해 주세요.",
  INVALID_REFRESH_TOKEN: "세션이 만료됐어요. 다시 로그인해 주세요.",
  REFRESH_TOKEN_EXPIRED: "세션이 만료됐어요. 다시 로그인해 주세요.",
  EMAIL_REQUIRED: "카카오 계정의 이메일 제공에 동의해 주세요.",
  SOCIAL_LOGIN_FAILED: "카카오 로그인에 실패했어요. 잠시 후 다시 시도해 주세요.",
  SOCIAL_SIGNUP_EXPIRED: "가입 시간이 만료됐어요. 다시 시도해 주세요.",
  SOCIAL_ACCOUNT_NO_PASSWORD: "카카오 계정은 비밀번호를 사용하지 않아요.",
};

/** 서버 공통 에러 형식 {error:{code,message,details}}를 사용자 메시지로 변환. */
export function toUserMessage(error: unknown): string {
  if (isAxiosError(error)) {
    const code = (error.response?.data as { error?: { message?: string } } | undefined)?.error
      ?.message;
    if (code && ERROR_MESSAGES[code]) {
      return ERROR_MESSAGES[code];
    }
  }
  return "잠시 후 다시 시도해 주세요.";
}
