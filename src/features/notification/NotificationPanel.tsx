/**
 * NotificationPanel.tsx
 *
 * 벨(알림) HUD 버튼을 클릭하면 나타나는 알림 목록 패널.
 *
 * 구성
 *   NotificationPanel  — 전체 래퍼: 배경 딤 + 패널 카드 (외부 export)
 *   PanelInner         — 실제 헤더·목록·푸터 콘텐츠 (내부 컴포넌트)
 *
 * 동작
 *   - open=false 이면 null 반환 → DOM 에서 완전히 제거됨
 *   - 패널 바깥(배경 딤) 클릭 or Esc 키 → onClose() 호출
 *   - 패널 안쪽 클릭 → stopPropagation() 으로 닫힘 차단
 *   - "모두 읽기" 버튼 → store.clearHistory() → 목록이 빈 상태로 전환
 *   - 개별 ✕ 버튼 → store.dismissFromHistory(id)
 *
 * App.tsx 에서 사용
 *   const [notificationOpen, setNotificationOpen] = useState(false);
 *   <NotificationPanel open={notificationOpen} onClose={() => setNotificationOpen(false)} />
 */

import { useNotificationStore } from "./store.js";
import type { NotificationToastItem } from "./types.js";
import "./notification.css";

type NotificationPanelProps = {
  open: boolean;
  onClose: () => void;
};

/**
 * 알림 타입에 따라 카드 아이콘 이미지 URL 결정
 *   resident → avatarUrl (캐릭터 이미지) 또는 기본 아바타
 *   reward   → 사과 이미지
 */
function iconForItem(item: NotificationToastItem): string {
  if (item.avatarUrl) return item.avatarUrl;
  if (item.type === "reward") return "/assets/notification/icon-apple.png";
  return "/assets/character/avatar.png";
}

/** createdAt 타임스탬프를 "방금 전" / "N분 전" 문자열로 변환 */
function relativeTime(createdAt: number) {
  const diff = Date.now() - createdAt;
  if (diff < 60_000) return "방금 전";
  const mins = Math.floor(diff / 60_000);
  return `${mins}분 전`;
}

/** 알림 패널 루트 컴포넌트 */
export function NotificationPanel({ open, onClose }: NotificationPanelProps) {
  // open=false 면 렌더링 자체를 하지 않음
  if (!open) return null;

  return (
    // 전체화면 배경 딤 (다른 모달들과 동일한 rgba(21,18,16,0.58))
    // 바깥 클릭 시 패널 닫힘
    // biome-ignore lint/a11y/noStaticElementInteractions: backdrop click-to-dismiss
    <div
      style={{ position: "fixed", inset: 0, zIndex: 39 }}
      onClick={onClose}
      onKeyDown={(e) => e.key === "Escape" && onClose()}
    >
      {/* 패널 카드 — 클릭이 배경 딤으로 전파되지 않게 stopPropagation */}
      {/* biome-ignore lint/a11y/noStaticElementInteractions: panel click stop propagation */}
      <div
        className="notifPanel"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        {/* 말풍선 꼬리 (▲) — CSS로 사각형을 45° 회전해 삼각형처럼 표현 */}
        <div className="notifPanelPointer" />
        <PanelInner onClose={onClose} />
      </div>
    </div>
  );
}

/** 패널 내부 콘텐츠: 헤더 / 알림 목록 / 푸터 */
function PanelInner({ onClose: _ }: { onClose: () => void }) {
  const history = useNotificationStore((s) => s.history);
  const dismissFromHistory = useNotificationStore((s) => s.dismissFromHistory);
  const clearHistory = useNotificationStore((s) => s.clearHistory);

  return (
    <div className="notifPanelInner">
      {/* ── 헤더: [새싹 알 림 새싹 - 패널 정중앙] [모두읽기 - 우측] ── */}
      <div className="notifPanelHeader">
        <div className="notifPanelHeaderTitle">
          <h2 className="notifPanelTitle">알 림</h2>
        </div>
        {/* 모두 읽기: history 전체 삭제 → 빈 상태 표시 */}
        <button type="button" className="notifPanelMarkAll" onClick={clearHistory}>
          모두 읽기
        </button>
      </div>

      <div className="notifPanelDivider" />

      {/* ── 알림 목록 or 빈 상태 ── */}
      {history.length === 0 ? (
        <p className="notifPanelEmpty">모든 알림을 확인했어요 🌿</p>
      ) : (
        <ul className="notifPanelList">
          {history.map((item) => (
            <li key={item.id}>
              <div className="notifPanelCard">
                {/* 읽지 않음 빨간 점 — 카드 왼쪽 상단 모서리 */}
                <span className="notifPanelCardUnreadDot" />
                {/* 타입별 아이콘: resident=캐릭터 아바타, reward=사과 */}
                <img src={iconForItem(item)} alt="" className="notifPanelCardIcon" />

                {/* 제목 + 본문 + 시간 */}
                <div className="notifPanelCardBody">
                  <p className="notifPanelCardTitle">{item.title}</p>
                  <div className="notifPanelCardSub">
                    <span>{item.body}</span>
                    {/* reward 타입이면 본문 옆에 사과 아이콘 추가 */}
                    {item.type === "reward" && typeof item.rewardApples === "number" && (
                      <img
                        src="/assets/notification/icon-apple.png"
                        alt=""
                        className="notifPanelCardSubApple"
                      />
                    )}
                  </div>
                  <p className="notifPanelCardTime">{relativeTime(item.createdAt)}</p>
                </div>

                {/* 오른쪽 열: 닫기 / 읽지않음 점 / 꽃 장식 */}
                <div className="notifPanelCardRight">
                  <button
                    type="button"
                    className="notifPanelCardDismiss"
                    aria-label="닫기"
                    onClick={() => dismissFromHistory(item.id)}
                  >
                    ✕
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
