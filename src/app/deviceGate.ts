/**
 * 모바일/태블릿 접속 판별 (순수 함수). window/navigator 를 직접 만지지 않고
 * 필요한 신호만 인자로 받아 vitest 로 단위 테스트할 수 있게 한다.
 *
 * 뷰포트 폭은 쓰지 않는다 — 데스크톱에서 창을 줄여도 막히지 않도록, 실제 기기
 * 신호(UA·터치)만으로 판별한다. 폰과 태블릿(아이패드 포함)을 모두 차단한다.
 */

// 폰 + 안드로이드 태블릿(UA 에 "Android" 포함)을 포괄한다.
const MOBILE_UA =
  /Android|iPhone|iPod|iPad|Windows Phone|webOS|BlackBerry|Opera Mini|IEMobile|Mobile/i;

export type DeviceSignals = {
  /** navigator.userAgent */
  ua: string;
  /** navigator.userAgentData?.mobile — 최신 브라우저의 명시적 모바일 신호 */
  uaDataMobile?: boolean;
  /** navigator.maxTouchPoints — iPadOS 위장 감지에 사용 */
  maxTouchPoints: number;
};

export function isMobileDevice({ ua, uaDataMobile, maxTouchPoints }: DeviceSignals): boolean {
  // 1) 최신 브라우저가 모바일이라고 명시하면 그대로 신뢰한다.
  if (uaDataMobile === true) {
    return true;
  }
  // 2) UA 정규식 — 폰 + 안드로이드 태블릿.
  if (MOBILE_UA.test(ua)) {
    return true;
  }
  // 3) iPadOS 13+ 는 데스크톱 Safari(Macintosh)로 위장한다. 터치 지점으로 태블릿을 가려낸다.
  //    (터치스크린 Windows 노트북은 Macintosh 가 아니므로 여기에 걸리지 않는다.)
  if (/Macintosh/.test(ua) && maxTouchPoints > 1) {
    return true;
  }
  return false;
}
