/**
 * NotificationToast.tsx
 *
 * 화면 우하단에 슬라이드로 올라오는 크림색 토스트 카드.
 *
 * 구성
 *   ToastCard          — 개별 토스트 카드 (내부 컴포넌트)
 *   NotificationToastLayer — store.toasts 를 순서대로 쌓아 렌더링 (외부 export)
 *
 * 동작 흐름
 *   1. pushToast() 호출 → store.toasts 에 추가 → ToastCard 마운트
 *   2. 마운트 시 Web Animations API 로 슬라이드-인 재생
 *   3. 5초 후 자동으로 dismiss() 실행 (또는 ✕ 버튼으로 즉시 닫기)
 *   4. dismiss(): 슬라이드-아웃 애니메이션 → 완료 후 store.dismissToast()
 *
 * App.tsx 에서 사용
 *   <NotificationToastLayer />  ← JSX 에 한 번만 배치
 *   pushToast({ type, title, body, ... })  ← 어디서든 호출 가능
 */

import { useCallback, useEffect, useRef } from "react";
import { useNotificationStore } from "./store.js";
import type { NotificationToastItem } from "./types.js";
import "./notification.css";

/** 토스트가 자동으로 사라지기까지의 시간 (ms) */
const AUTO_DISMISS_MS = 3000;

/** 개별 토스트 카드 컴포넌트 */
function ToastCard({ item }: { item: NotificationToastItem }) {
  const dismissToast = useNotificationStore((s) => s.dismissToast);
  const cardRef = useRef<HTMLDivElement>(null);
  // 중복 dismiss 방지 플래그 (자동 타이머 + ✕ 버튼 동시 실행 차단)
  const dismissedRef = useRef(false);

  const dismiss = useCallback(() => {
    if (dismissedRef.current) return;
    dismissedRef.current = true;

    const el = cardRef.current;
    const finish = () => dismissToast(item.id);

    if (el?.animate) {
      const anim = el.animate(
        [
          { transform: "translateY(0) scale(1)", opacity: "1" },
          { transform: "translateY(24px) scale(.96)", opacity: "0" },
        ],
        { duration: 250, easing: "ease-in", fill: "forwards" },
      );
      anim.onfinish = finish;
    } else {
      finish();
    }
  }, [dismissToast, item.id]);

  useEffect(() => {
    // 마운트 시 슬라이드-인 애니메이션
    const el = cardRef.current;
    if (el?.animate) {
      el.animate(
        [
          { transform: "translateY(16px) scale(.96)", opacity: "0" },
          { transform: "translateY(0) scale(1)", opacity: "1" },
        ],
        { duration: 480, easing: "cubic-bezier(.18,.86,.32,1.18)" },
      );
    }

    // 5초 후 자동 닫기
    const timer = window.setTimeout(dismiss, AUTO_DISMISS_MS);
    return () => window.clearTimeout(timer);
  }, [dismiss]);

  return (
    <div ref={cardRef} className="notifToastCard">
      {/* 캐릭터 아바타 — 없으면 기본 이미지 */}
      <img
        src={item.avatarUrl ?? "/assets/character/avatar.png"}
        alt=""
        className="notifToastAvatar"
      />

      {/* 제목 + 본문 */}
      <div
        className={`notifToastBody${item.type === "reward" && typeof item.rewardApples === "number" ? " notifToastBodyReward" : ""}`}
      >
        <p className="notifToastTitle">{item.title}</p>
        <p className="notifToastSub">{item.body}</p>
      </div>

      {/* 사과 보상 배지 — type:"reward" 이고 개수가 있을 때만 표시 */}
      {item.type === "reward" && typeof item.rewardApples === "number" && (
        <div className="notifToastReward">
          <img src="/assets/notification/icon-apple.png" alt="사과" className="notifToastApple" />
          <span className="notifToastRewardCount">+{item.rewardApples}</span>
        </div>
      )}

      {/* 우상단 고정: 닫기 버튼 */}
      <div className="notifToastMeta">
        <button type="button" className="notifToastClose" aria-label="닫기" onClick={dismiss}>
          ✕
        </button>
      </div>
    </div>
  );
}

/**
 * 토스트 레이어 — App.tsx 에서 한 번 배치.
 * store.toasts 가 비어있으면 DOM 에 아무것도 렌더링하지 않음.
 */
export function NotificationToastLayer() {
  const toasts = useNotificationStore((s) => s.toasts);

  if (toasts.length === 0) return null;

  return (
    // aria-live: 스크린리더에 새 알림 내용을 알림
    <div className="notifToastLayer" aria-live="polite" aria-atomic="false">
      {toasts.map((item) => (
        <ToastCard key={item.id} item={item} />
      ))}
    </div>
  );
}
