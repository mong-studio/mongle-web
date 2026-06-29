import { describe, expect, it } from "vitest";
import { isMobileDevice } from "./deviceGate.js";

const UA = {
  iphone:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  androidPhone:
    "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
  androidTablet:
    "Mozilla/5.0 (Linux; Android 13; SM-X700) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  ipadLegacy:
    "Mozilla/5.0 (iPad; CPU OS 12_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.0 Mobile/15E148 Safari/604.1",
  ipadOS:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
  windows:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  mac: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
};

describe("isMobileDevice", () => {
  it("아이폰은 차단한다", () => {
    expect(isMobileDevice({ ua: UA.iphone, maxTouchPoints: 5 })).toBe(true);
  });

  it("안드로이드 폰은 차단한다", () => {
    expect(isMobileDevice({ ua: UA.androidPhone, maxTouchPoints: 5 })).toBe(true);
  });

  it("안드로이드 태블릿(Mobile 없음)도 차단한다", () => {
    expect(isMobileDevice({ ua: UA.androidTablet, maxTouchPoints: 5 })).toBe(true);
  });

  it("구형 iPad UA 도 차단한다", () => {
    expect(isMobileDevice({ ua: UA.ipadLegacy, maxTouchPoints: 5 })).toBe(true);
  });

  it("iPadOS 13+ 데스크톱 위장은 터치로 감지해 차단한다", () => {
    expect(isMobileDevice({ ua: UA.ipadOS, maxTouchPoints: 5 })).toBe(true);
  });

  it("userAgentData.mobile 이 true 면 차단한다", () => {
    expect(isMobileDevice({ ua: UA.windows, uaDataMobile: true, maxTouchPoints: 0 })).toBe(true);
  });

  it("Windows 데스크톱은 허용한다", () => {
    expect(isMobileDevice({ ua: UA.windows, maxTouchPoints: 0 })).toBe(false);
  });

  it("Mac 데스크톱(터치 없음)은 허용한다", () => {
    expect(isMobileDevice({ ua: UA.mac, maxTouchPoints: 0 })).toBe(false);
  });

  it("터치스크린 Windows 노트북은 허용한다(데스크톱)", () => {
    expect(isMobileDevice({ ua: UA.windows, maxTouchPoints: 10 })).toBe(false);
  });
});
