import { LoginModal } from "../../features/auth/LoginModal.js";
import { SignupModal } from "../../features/auth/SignupModal.js";
import type { AuthStatus, SessionUser } from "../../features/auth/store.js";
import { CalendarModal } from "../../features/calendar/CalendarModal.js";
import { CharacterModal } from "../../features/character/createCharacter.js";
import { FeedModal } from "../../features/feed/FeedModal.js";
import { MyPageWrapper } from "../../features/my-page/MyPageWrapper.js";
import { ReflectionModal } from "../../features/reflection/ReflectionModal.js";
import type { TodoItem } from "../../features/todo/todoCreation.js";
import type { Resident } from "../model/appTypes.js";

type AppModalLayerProps = {
  apples: number;
  authStatus: AuthStatus;
  authUser: SessionUser | null;
  calendarOpen: boolean;
  characterName: string;
  characterPersona: string;
  characterSetupOpen: boolean;
  feedOpen: boolean;
  isBusy: boolean;
  loginOpen: boolean;
  reflectionOpen: boolean;
  residents: Resident[];
  selectedKeywordCategories: string[];
  showMyPage: boolean;
  signupOpen: boolean;
  sourceImageName: string;
  sourceImagePreview: string;
  todos: TodoItem[];
  onCalendarClose: () => void;
  onCharacterImageUpload: (file: File | undefined) => void;
  onCharacterNameChange: (value: string) => void;
  onCharacterPersonaChange: (value: string) => void;
  onCharacterSetupClose: () => void;
  onCharacterSubmit: () => void;
  onFeedClose: () => void;
  onLoginClose: () => void;
  onLoginOpen: () => void;
  onLogout: () => void | Promise<void>;
  onMyPageClose: () => void;
  onNotice: (message: string) => void;
  onReflectionClose: () => void;
  onRewardApples: (amount: number) => void;
  onSignupClose: () => void;
  onSignupComplete: (notice: string) => void;
  onSwitchLoginToSignup: () => void;
  onToggleKeyword: (keyword: string) => void;
};

export function AppModalLayer({
  apples,
  authStatus,
  authUser,
  calendarOpen,
  characterName,
  characterPersona,
  characterSetupOpen,
  feedOpen,
  isBusy,
  loginOpen,
  reflectionOpen,
  residents,
  selectedKeywordCategories,
  showMyPage,
  signupOpen,
  sourceImageName,
  sourceImagePreview,
  todos,
  onCalendarClose,
  onCharacterImageUpload,
  onCharacterNameChange,
  onCharacterPersonaChange,
  onCharacterSetupClose,
  onCharacterSubmit,
  onFeedClose,
  onLoginClose,
  onLoginOpen,
  onLogout,
  onMyPageClose,
  onNotice,
  onReflectionClose,
  onRewardApples,
  onSignupClose,
  onSignupComplete,
  onSwitchLoginToSignup,
  onToggleKeyword,
}: AppModalLayerProps) {
  return (
    <>
      {reflectionOpen ? (
        // biome-ignore lint/a11y/noStaticElementInteractions: backdrop click-to-dismiss is intentional UX
        <div
          className="modalBackdrop"
          role="presentation"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              onReflectionClose();
            }
          }}
        >
          <section
            className="featureModal reflectionModalShell"
            role="dialog"
            aria-modal="true"
            aria-label="오늘의 회고 일기"
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
          >
            <ReflectionModal
              todos={todos}
              tokenBalance={apples}
              onRewardApples={onRewardApples}
              onNotice={onNotice}
              onClose={onReflectionClose}
            />
          </section>
        </div>
      ) : null}

      <SignupModal open={signupOpen} onClose={onSignupClose} onComplete={onSignupComplete} />

      {showMyPage ? (
        <MyPageWrapper
          fallbackUserName={authUser?.userName ?? "몽글러"}
          residents={residents}
          onClose={onMyPageClose}
          onLogout={onLogout}
          onNotice={onNotice}
        />
      ) : null}

      <LoginModal
        open={loginOpen}
        onClose={onLoginClose}
        onSwitchToSignup={onSwitchLoginToSignup}
      />

      {characterSetupOpen ? (
        // biome-ignore lint/a11y/noStaticElementInteractions: backdrop click-to-dismiss is intentional UX
        <div
          className="modalBackdrop"
          role="presentation"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              onCharacterSetupClose();
            }
          }}
        >
          <section
            className="featureModal characterModal"
            role="dialog"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
          >
            <CharacterModal
              residents={residents}
              sourceImagePreview={sourceImagePreview}
              sourceImageName={sourceImageName}
              characterName={characterName}
              characterPersona={characterPersona}
              selectedKeywordCategories={selectedKeywordCategories}
              isBusy={isBusy}
              onImageUpload={onCharacterImageUpload}
              onNameChange={onCharacterNameChange}
              onPersonaChange={onCharacterPersonaChange}
              onToggleKeyword={onToggleKeyword}
              onSubmit={onCharacterSubmit}
              onClose={onCharacterSetupClose}
            />
          </section>
        </div>
      ) : null}

      <CalendarModal
        isOpen={calendarOpen}
        onClose={onCalendarClose}
        isAuthenticated={authStatus === "authenticated"}
        onOpenLogin={onLoginOpen}
      />

      {feedOpen ? (
        // biome-ignore lint/a11y/noStaticElementInteractions: backdrop click-to-dismiss is intentional UX
        <div
          className="modalBackdrop"
          role="presentation"
          onClick={(event) => {
            if (event.target === event.currentTarget) onFeedClose();
          }}
        >
          <FeedModal onClose={onFeedClose} />
        </div>
      ) : null}
    </>
  );
}
