import { HudButton } from "../HudButton/HudButton.js";
import "./HudButtonGroup.css";

type HudButtonGroupProps = {
  onOpenDiary: () => void;
  onOpenNotifications: () => void;
  onOpenPhone: () => void;
  unreadNotificationCount?: number;
  onOpenSettings: () => void;
};

export function HudButtonGroup({
  onOpenDiary,
  onOpenNotifications,
  onOpenPhone,
  onOpenSettings,
  unreadNotificationCount,
}: HudButtonGroupProps) {
  return (
    <nav className="hudButtonGroup" aria-label="빠른 메뉴">
      <HudButton
        ariaLabel="알림 열기"
        badgeCount={unreadNotificationCount}
        className="hudButton--bell"
        iconSrc="/assets/hud/icon-bell.png"
        label="알림"
        onClick={onOpenNotifications}
      />
      <HudButton
        ariaLabel="핸드폰 열기"
        className="hudButton--phone"
        iconSrc="/assets/hud/icon-phone.png"
        label="핸드폰"
        onClick={onOpenPhone}
      />
      <HudButton
        ariaLabel="회고 일기장 열기"
        className="hudButton--diary"
        iconSrc="/assets/hud/icon-diary.png"
        label="일기장"
        onClick={onOpenDiary}
      />
      <HudButton
        ariaLabel="설정 열기"
        className="hudButton--settings"
        iconSrc="/assets/hud/icon-setting.png"
        label="설정"
        onClick={onOpenSettings}
      />
    </nav>
  );
}
