import type { ReactNode } from "react";
import { MobileBlock } from "../features/error/MobileBlock.js";
import { isMobileDevice } from "./deviceGate.js";

/**
 * 모바일/태블릿 접속 차단 게이트. 몽글마을은 넓은 화면 기준의 데스크톱 픽셀 게임이라
 * 폰·태블릿에서는 제대로 동작하지 않으므로, 실제 기기(UA·터치)를 감지해 안내 화면으로 막는다.
 *
 * RouteGate 와 동일하게 로드 시 1회 평가한다 — UA·터치 기반이라 창 리사이즈와 무관하다.
 * (client-side 판별이므로 UA 위조·DevTools 에뮬레이션까지 막지는 못한다. 접근성 안내 수준.)
 *
 * QA 우회: `?desktop=1` 쿼리 또는 localStorage("forceDesktop") === "1".
 */
type NavigatorUAData = { mobile?: boolean };

function isDesktopForced(): boolean {
  try {
    if (new URLSearchParams(window.location.search).get("desktop") === "1") {
      return true;
    }
    return window.localStorage.getItem("forceDesktop") === "1";
  } catch {
    return false;
  }
}

export function MobileGate({ children }: { children: ReactNode }) {
  const uaData = (navigator as Navigator & { userAgentData?: NavigatorUAData }).userAgentData;
  const blocked =
    !isDesktopForced() &&
    isMobileDevice({
      ua: navigator.userAgent,
      uaDataMobile: uaData?.mobile,
      maxTouchPoints: navigator.maxTouchPoints,
    });

  if (blocked) {
    return <MobileBlock />;
  }
  return <>{children}</>;
}
