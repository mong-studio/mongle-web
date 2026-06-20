import { afterEach, describe, expect, it } from "vitest";
import { KAKAO_STATE_KEY } from "./api.js";
import { consumeKakaoCallback } from "./kakaoCallback.js";

function setUrl(search: string) {
  window.history.replaceState({}, "", `/oauth/kakao/callback${search}`);
}

afterEach(() => {
  sessionStorage.clear();
  window.history.replaceState({}, "", "/");
});

describe("consumeKakaoCallback", () => {
  it("returns code when state matches", () => {
    sessionStorage.setItem(KAKAO_STATE_KEY, "s1");
    setUrl("?code=abc&state=s1");
    expect(consumeKakaoCallback()).toBe("abc");
    expect(window.location.search).toBe("");
  });

  it("returns null when state mismatches", () => {
    sessionStorage.setItem(KAKAO_STATE_KEY, "s1");
    setUrl("?code=abc&state=evil");
    expect(consumeKakaoCallback()).toBeNull();
  });

  it("returns null when no code", () => {
    setUrl("");
    expect(consumeKakaoCallback()).toBeNull();
  });
});
