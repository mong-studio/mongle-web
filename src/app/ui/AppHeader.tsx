import { useEffect, useRef, useState } from "react";
import type { AuthStatus, SessionUser } from "../../features/auth/store.js";
import { HudButtonGroup } from "./HudButtonGroup/HudButtonGroup.js";

type AppHeaderProps = {
  apples: number;
  authStatus: AuthStatus;
  authUser: SessionUser | null;
  onOpenDiary: () => void;
  onOpenNotifications: () => void;
  onOpenPhone: () => void;
  onLogin: () => void;
  onLogout: () => void;
  onOpenSettings: () => void;
  onOpenTutorial: () => void;
  onSignup: () => void;
  unreadNotificationCount?: number;
};

export function AppHeader({
  apples,
  authStatus,
  authUser,
  onOpenDiary,
  onOpenNotifications,
  onOpenPhone,
  onLogin,
  onLogout,
  onOpenSettings,
  onOpenTutorial,
  onSignup,
  unreadNotificationCount,
}: AppHeaderProps) {
  const [settingsMenuOpen, setSettingsMenuOpen] = useState(false);
  const settingsMenuRef = useRef<HTMLDivElement | null>(null);
  const isAuthenticated = authStatus === "authenticated" && Boolean(authUser);

  useEffect(() => {
    if (!settingsMenuOpen) {
      return;
    }

    function closeOnOutsideClick(event: MouseEvent) {
      if (
        event.target instanceof Node &&
        settingsMenuRef.current &&
        !settingsMenuRef.current.contains(event.target)
      ) {
        setSettingsMenuOpen(false);
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSettingsMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [settingsMenuOpen]);

  useEffect(() => {
    if (!isAuthenticated) {
      setSettingsMenuOpen(false);
    }
  }, [isAuthenticated]);

  function closeSettingsMenu() {
    setSettingsMenuOpen(false);
  }

  function openSettingsMenu() {
    if (!isAuthenticated) {
      onOpenSettings();
      return;
    }
    setSettingsMenuOpen((open) => !open);
  }

  function openMyPage() {
    closeSettingsMenu();
    onOpenSettings();
  }

  function logout() {
    closeSettingsMenu();
    onLogout();
  }

  return (
    <header className="townNav">
      <div className="brandBadge">
        <img className="navLogo" src="/assets/hud/square_logo.png" alt="몽글 로고" />
        <button
          type="button"
          className="tutorialHelpButton"
          aria-label="튜토리얼 보기"
          onClick={onOpenTutorial}
        >
          ?
        </button>
      </div>
      <div className="navUserArea">
        {isAuthenticated ? (
          <>
            <div className="headerHudMenu" ref={settingsMenuRef}>
              <HudButtonGroup
                onOpenDiary={() => {
                  closeSettingsMenu();
                  onOpenDiary();
                }}
                onOpenNotifications={() => {
                  closeSettingsMenu();
                  onOpenNotifications();
                }}
                onOpenPhone={() => {
                  closeSettingsMenu();
                  onOpenPhone();
                }}
                onOpenSettings={openSettingsMenu}
                unreadNotificationCount={unreadNotificationCount}
              />
              {settingsMenuOpen ? (
                <div className="settingsDropdown" role="menu" aria-label="설정 메뉴">
                  <span className="settingsDropdownPointer" aria-hidden="true" />
                  <button type="button" role="menuitem" onClick={openMyPage}>
                    마이페이지
                  </button>
                  <button type="button" role="menuitem" onClick={logout}>
                    로그아웃
                  </button>
                </div>
              ) : null}
            </div>
            <div className="tokenBadge" role="status" aria-label={`보유 사과 ${apples}개`}>
              <img className="tokenBadgeIcon" src="/assets/hud/icon-apple.png" alt="" />
              <b className="tokenBadgeCount">{apples}</b>
            </div>
          </>
        ) : authStatus === "anonymous" ? (
          <>
            <button type="button" className="loginButton" onClick={onLogin}>
              <span className="mainHoverLabel">로그인</span>
            </button>
            <button type="button" className="loginButton" onClick={onSignup}>
              <span className="mainHoverLabel">회원가입</span>
            </button>
          </>
        ) : null}
      </div>
    </header>
  );
}
