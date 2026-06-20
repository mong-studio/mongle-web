import { KAKAO_STATE_KEY } from "./api.js";

/**
 * URL에 카카오 콜백(code+state)이 있으면 state를 검증하고 code를 반환한다.
 * 검증 성공/실패와 무관하게 쿼리스트링·state는 제거한다(코드 재사용·노출 방지).
 */
export function consumeKakaoCallback(): string | null {
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  const state = params.get("state");
  if (!code || !state) {
    return null;
  }

  const expected = sessionStorage.getItem(KAKAO_STATE_KEY);
  sessionStorage.removeItem(KAKAO_STATE_KEY);
  window.history.replaceState({}, "", window.location.pathname);

  return state === expected ? code : null;
}
