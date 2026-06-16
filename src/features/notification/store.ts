/**
 * notification/store.ts
 *
 * 알림 관련 전역 상태 (Zustand).
 * 앱 어디서든 pushToast() 를 호출하면 토스트가 뜨고, history 에도 쌓인다.
 *
 * ┌─ state ─────────────────────────────────────────────────────┐
 * │  toasts   현재 화면에 떠 있는 토스트 목록 (최대 동시 N개)      │
 * │  history  이번 세션 동안 받은 알림 전체 목록 (패널에서 표시)    │
 * └─────────────────────────────────────────────────────────────┘
 *
 * ┌─ actions ───────────────────────────────────────────────────┐
 * │  pushToast(payload)       토스트 발행 — toasts + history 추가 │
 * │  dismissToast(id)         토스트 닫기 — toasts 에서만 제거    │
 * │  dismissFromHistory(id)   패널에서 개별 알림 삭제             │
 * │  clearHistory()           "모두 읽기" — history 전체 비우기   │
 * └─────────────────────────────────────────────────────────────┘
 *
 * ※ 페이지 새로고침 시 초기화됨 (서버 저장 없음, 세션 메모리만 유지)
 */

import { create } from "zustand";
import type { NotificationToastItem, NotificationToastType } from "./types.js";

/** pushToast 호출 시 넘기는 인자 타입 (id·createdAt 은 store 내부에서 자동 생성) */
type PushPayload = {
  type: NotificationToastType;
  title: string;
  body: string;
  avatarUrl?: string; // 없으면 기본 아바타 사용
  rewardApples?: number; // type:"reward" 일 때만 필요
};

type NotificationStore = {
  toasts: NotificationToastItem[];
  history: NotificationToastItem[];
  pushToast: (payload: PushPayload) => void;
  dismissToast: (id: string) => void;
  dismissFromHistory: (id: string) => void;
  clearHistory: () => void;
};

export const useNotificationStore = create<NotificationStore>((set) => ({
  toasts: [],
  history: [],

  /**
   * 새 알림 발행.
   * - toasts 끝에 추가  → NotificationToastLayer 가 화면에 렌더링
   * - history 맨 앞에 추가 → 패널에서 최신 순으로 표시
   */
  pushToast: (payload) => {
    const item: NotificationToastItem = {
      ...payload,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
    };
    set((state) => ({
      toasts: [...state.toasts, item],
      history: [item, ...state.history],
    }));
  },

  /** 토스트 카드 닫기 — 화면에서만 제거, history 는 유지 */
  dismissToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),

  /** 패널에서 개별 알림 ✕ 클릭 — history 에서만 제거 */
  dismissFromHistory: (id) =>
    set((state) => ({
      history: state.history.filter((t) => t.id !== id),
    })),

  /** "모두 읽기" 버튼 — history 전체 삭제 */
  clearHistory: () => set(() => ({ history: [] })),
}));
