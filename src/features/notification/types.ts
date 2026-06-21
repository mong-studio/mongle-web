/**
 * 알림 타입 종류
 *   "resident" — 새 주민이 마을에 입주했을 때  (캐릭터 생성 완료)
 *   "reward"   — 할일 완료 보상을 받았을 때     (사과 +N)
 */
export type NotificationToastType = "resident" | "reward" | "reflection";

/**
 * 토스트 / 알림 패널 양쪽에서 공통으로 쓰는 알림 데이터 구조.
 * store의 toasts 배열과 history 배열 모두 이 타입을 사용한다.
 */
export type NotificationToastItem = {
  id: string; // crypto.randomUUID() 로 생성
  type: NotificationToastType;
  title: string; // 굵게 표시되는 제목
  body: string; // 제목 아래 부제 텍스트
  avatarUrl?: string; // 캐릭터 이미지 URL (없으면 기본 아바타 사용)
  rewardApples?: number; // type:"reward" 일 때 지급되는 사과 개수
  createdAt: number; // Date.now() 타임스탬프 — 경과 시간 표시용
  isRead: boolean;
  source: "local" | "server";
  serverId?: number;
  reflectionDate?: string;
};
