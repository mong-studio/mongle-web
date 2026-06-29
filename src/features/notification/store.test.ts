import { beforeEach, describe, expect, it } from "vitest";
import type { ServerNotification } from "./api.js";
import { useNotificationStore } from "./store.js";

function serverNotification(
  notificationId: number,
  overrides: Partial<ServerNotification> = {},
): ServerNotification {
  return {
    notification_id: notificationId,
    type: "reflection",
    title: "회고 알림",
    content: "회고를 작성해 주세요.",
    is_read: false,
    data: { target: "reflection", reflection_date: "2026-06-21" },
    created_at: `2026-06-${String(notificationId).padStart(2, "0")}T00:00:00Z`,
    ...overrides,
  };
}

describe("notification store", () => {
  beforeEach(() => {
    useNotificationStore.getState().reset();
  });

  it("최초 서버 동기화는 목록만 채우고 토스트를 중복 노출하지 않는다", () => {
    // 로그인 직후 기존 미읽음 알림은 패널에만 복원하고 새 토스트로 재노출하지 않는다.
    useNotificationStore
      .getState()
      .replaceServerNotifications([serverNotification(1), serverNotification(2)]);

    const state = useNotificationStore.getState();
    expect(state.history.map((item) => item.serverId)).toEqual([2, 1]);
    expect(state.toasts).toEqual([]);
  });

  it("동기화 이후 새로 도착한 미읽음 서버 알림은 토스트로 노출한다", () => {
    // 최초 동기화 이후 추가된 서버 알림만 신규 토스트 대상으로 판별한다.
    useNotificationStore.getState().replaceServerNotifications([serverNotification(1)]);
    useNotificationStore
      .getState()
      .replaceServerNotifications([serverNotification(2), serverNotification(1)]);

    expect(useNotificationStore.getState().toasts.map((item) => item.serverId)).toEqual([2]);
  });

  it("TODO 완료 직후에는 최초 동기화여도 해당 날짜 회고 알림을 노출한다", () => {
    // TODO 완료 요청이 지정한 날짜의 회고 알림은 최초 조회에서도 즉시 사용자에게 알린다.
    useNotificationStore
      .getState()
      .replaceServerNotifications([serverNotification(1)], "2026-06-21");

    expect(useNotificationStore.getState().toasts.map((item) => item.serverId)).toEqual([1]);
  });

  it("서버 feed 알림은 type을 feed로 매핑하고 동기화 후 토스트로 노출한다", () => {
    // 캐릭터 생성 알림처럼, 피드 알림도 토스트 + 알림창(history)에 함께 떠야 한다.
    useNotificationStore.getState().replaceServerNotifications([]); // 최초 동기화로 hydrate
    useNotificationStore.getState().replaceServerNotifications([
      serverNotification(5, {
        type: "feed",
        title: "몽이의 새 소식이 도착했어요!",
        content: "오늘도 산책했어요!",
        data: { target: "feed", post_id: "abc" },
      }),
    ]);

    const state = useNotificationStore.getState();
    expect(state.history.find((item) => item.serverId === 5)?.type).toBe("feed");
    expect(state.toasts.map((item) => item.serverId)).toEqual([5]);
  });

  it("개별 및 전체 읽음 처리한 알림은 목록에서 제거한다", () => {
    // 개별 읽음과 모두 읽기 동작이 패널의 로컬 목록을 즉시 갱신하는지 검증한다.
    useNotificationStore
      .getState()
      .replaceServerNotifications([serverNotification(1), serverNotification(2)]);
    useNotificationStore.getState().markRead("server-1");
    expect(useNotificationStore.getState().history.map((item) => item.id)).toEqual(["server-2"]);

    useNotificationStore.getState().clearHistory();

    const state = useNotificationStore.getState();
    expect(state.history).toEqual([]);
  });

  it("서버에서 이미 읽은 알림은 동기화 목록에 포함하지 않는다", () => {
    // 서버가 읽음 처리한 알림은 이후 동기화에서 다시 패널에 나타나지 않아야 한다.
    useNotificationStore
      .getState()
      .replaceServerNotifications([
        serverNotification(1, { is_read: true }),
        serverNotification(2),
      ]);

    expect(useNotificationStore.getState().history.map((item) => item.serverId)).toEqual([2]);
  });
});
