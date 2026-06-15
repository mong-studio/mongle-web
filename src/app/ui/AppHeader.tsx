import type { AuthStatus, SessionUser } from "../../features/auth/store.js";

type AppHeaderProps = {
  apples: number;
  authStatus: AuthStatus;
  authUser: SessionUser | null;
  onLogin: () => void;
  onLogout: () => void;
  onOpenSettings: () => void;
  onSignup: () => void;
};

export function AppHeader({
  apples,
  authStatus,
  authUser,
  onLogin,
  onLogout,
  onOpenSettings,
  onSignup,
}: AppHeaderProps) {
  return (
    <header className="townNav">
      <nav aria-label="몽글마을 메뉴">
        <button type="button" className="settingsOnlyButton" onClick={onOpenSettings}>
          <img className="settingsOnlyButtonIcon" src="/assets/hud/setting.png" alt="" />
          <span>설정</span>
        </button>
      </nav>
      <div className="navUserArea">
        {authStatus === "authenticated" && authUser ? (
          <>
            <div className="tokenBadge" role="status" aria-label={`보유 사과 ${apples}개`}>
              <span className="tokenBadgeIcon" aria-hidden="true">
                🍎
              </span>
              <b className="tokenBadgeCount">{apples}</b>
              <span className="tokenBadgePlus" aria-hidden="true">
                +
              </span>
            </div>
            <button type="button" className="loginButton" onClick={onLogout}>
              로그아웃
            </button>
          </>
        ) : authStatus === "anonymous" ? (
          <>
            <button type="button" className="loginButton" onClick={onLogin}>
              로그인
            </button>
            <button type="button" className="loginButton" onClick={onSignup}>
              회원가입
            </button>
          </>
        ) : null}
      </div>
    </header>
  );
}
