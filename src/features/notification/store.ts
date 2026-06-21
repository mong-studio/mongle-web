/**
 * notification/store.ts
 *
 * 알림 관련 전역 상태 (Zustand).
 * 앱 어디서든 pushToast() 를 호출하면 토스트가 뜨고, history 에도 쌓인다.
 *
 * ┌─ state ─────────────────────────────────────────────────────┐
 * │  toasts   현재 화면에 떠 있는 토스트 목록 (최대 동시 N개)      │
 * │  history  서버 알림과 이번 세션 로컬 알림 목록                 │
 * └─────────────────────────────────────────────────────────────┘
 *
 * ┌─ actions ───────────────────────────────────────────────────┐
 * │  pushToast(payload)       토스트 발행 — toasts + history 추가 │
 * │  dismissToast(id)         토스트 닫기 — toasts 에서만 제거    │
 * │  clearHistory()           "모두 읽기" — 목록에서 제거         │
 * └─────────────────────────────────────────────────────────────┘
 *
 * 서버 알림은 재조회하며 주민 생성 등 로컬 알림만 새로고침 시 초기화된다.
 */

import { create } from "zustand";
import type { ServerNotification } from "./api.js";
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
  serverHydrated: boolean;
  pushToast: (payload: PushPayload) => void;
  dismissToast: (id: string) => void;
  clearHistory: () => void;
  replaceServerNotifications: (
    notifications: ServerNotification[],
    announceReflectionDate?: string,
  ) => void;
  markRead: (id: string) => void;
  reset: () => void;
};

export const useNotificationStore = create<NotificationStore>((set) => ({
  toasts: [],
  history: [],
  serverHydrated: false,

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
      isRead: false,
      source: "local",
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

  /** "모두 읽기" 버튼 — 읽은 알림은 목록에서 제거 */
  clearHistory: () => set({ history: [] }),

  replaceServerNotifications: (notifications, announceReflectionDate) =>
    set((state) => {
      const existingServerIds = new Set(
        state.history.flatMap((item) => (item.serverId === undefined ? [] : [item.serverId])),
      );
      const serverItems: NotificationToastItem[] = notifications
        .filter((notification) => !notification.is_read)
        .map((notification) => ({
          id: `server-${notification.notification_id}`,
          type: notification.type === "reflection" ? "reflection" : "resident",
          title: notification.title,
          body: notification.content,
          createdAt: new Date(notification.created_at).getTime(),
          isRead: false,
          source: "server",
          serverId: notification.notification_id,
          reflectionDate: notification.data.reflection_date,
        }));
      const newToasts = serverItems.filter(
        (item) =>
          !item.isRead &&
          item.serverId !== undefined &&
          !existingServerIds.has(item.serverId) &&
          (state.serverHydrated || item.reflectionDate === announceReflectionDate),
      );
      const localItems = state.history.filter((item) => item.source === "local");
      return {
        history: [...serverItems, ...localItems].sort((a, b) => b.createdAt - a.createdAt),
        toasts: [...state.toasts, ...newToasts],
        serverHydrated: true,
      };
    }),

  markRead: (id) =>
    set((state) => ({
      history: state.history.filter((item) => item.id !== id),
    })),

  reset: () => set({ toasts: [], history: [], serverHydrated: false }),
}));
