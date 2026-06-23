import { LoginModal } from "../../features/auth/LoginModal.js";
import { ResetPasswordModal } from "../../features/auth/ResetPasswordModal.js";
import { SignupModal } from "../../features/auth/SignupModal.js";
import type { AuthStatus, SessionUser } from "../../features/auth/store.js";
import { CalendarModal } from "../../features/calendar/CalendarModal.js";
import { CharacterModal } from "../../features/character/createCharacter.js";
import { FeedModal } from "../../features/feed/FeedModal.js";
import { MyPageWrapper } from "../../features/my-page/MyPageWrapper.js";
import { ReflectionModal } from "../../features/reflection/ReflectionModal.js";
import type { TodoItem } from "../../features/todo/todoCreation.js";
import { useBackdropDismiss } from "../../shared/ui/useBackdropDismiss.js";
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
  lastCreatedResident: Resident | null;
  loginOpen: boolean;
  reflectionOpen: boolean;
  reflectionDate?: string;
  resetPwOpen: boolean;
  residents: Resident[];
  selectedKeywordCategories: string[];
  showMyPage: boolean;
  signupOpen: boolean;
  sourceImageName: string;
  sourceImagePreview: string;
  todos: TodoItem[];
  onCalendarClose: () => void;
  onCalendarTodosChanged: () => void;
  onCalendarCompleteTodo: (todoId: string, title: string, dueDate: string) => Promise<void>;
  onCharacterImageUpload: (file: File | undefined) => void;
  onCharacterNameChange: (value: string) => void;
  onCharacterPersonaChange: (value: string) => void;
  onCharacterSetupClose: () => void;
  onCharacterSubmit: () => void;
  onCharacterConfirm: () => Promise<boolean>;
  onFeedClose: () => void;
  onLoginClose: () => void;
  onLoginOpen: () => void;
  onLogout: () => void | Promise<void>;
  onMoveOut: (characterId: string) => void;
  onMyPageClose: () => void;
  onNotice: (message: string) => void;
  onReflectionClose: () => void;
  onResetPwClose: () => void;
  onResetPwComplete: (notice: string) => void;
  onResetPwOpen: () => void;
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
  lastCreatedResident,
  loginOpen,
  reflectionOpen,
  reflectionDate,
  resetPwOpen,
  residents,
  selectedKeywordCategories,
  showMyPage,
  signupOpen,
  sourceImageName,
  sourceImagePreview,
  todos,
  onCalendarClose,
  onCalendarTodosChanged,
  onCalendarCompleteTodo,
  onCharacterImageUpload,
  onCharacterNameChange,
  onCharacterPersonaChange,
  onCharacterSetupClose,
  onCharacterSubmit,
  onCharacterConfirm,
  onFeedClose,
  onLoginClose,
  onLoginOpen,
  onLogout,
  onMoveOut,
  onMyPageClose,
  onNotice,
  onReflectionClose,
  onResetPwClose,
  onResetPwComplete,
  onResetPwOpen,
  onRewardApples,
  onSignupClose,
  onSignupComplete,
  onSwitchLoginToSignup,
  onToggleKeyword,
}: AppModalLayerProps) {
  const reflectionBackdrop = useBackdropDismiss(onReflectionClose);
  const characterSetupBackdrop = useBackdropDismiss(onCharacterSetupClose);
  const feedBackdrop = useBackdropDismiss(onFeedClose);

  return (
    <>
      {reflectionOpen ? (
        <div className="modalBackdrop" role="presentation" {...reflectionBackdrop}>
          <section
            className="featureModal reflectionModalShell"
            role="dialog"
            aria-modal="true"
            aria-label="오늘의 회고 일기"
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
          >
            <ReflectionModal
              key={reflectionDate ?? "today"}
              todos={todos}
              initialDate={reflectionDate}
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
          onMoveOut={onMoveOut}
          onNotice={onNotice}
        />
      ) : null}

      <LoginModal
        open={loginOpen}
        onClose={onLoginClose}
        onSwitchToSignup={onSwitchLoginToSignup}
        onResetPw={onResetPwOpen}
      />

      <ResetPasswordModal
        open={resetPwOpen}
        onClose={onResetPwClose}
        onComplete={onResetPwComplete}
      />

      {characterSetupOpen ? (
        <div className="modalBackdrop" role="presentation" {...characterSetupBackdrop}>
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
              lastCreatedResident={lastCreatedResident}
              onImageUpload={onCharacterImageUpload}
              onNameChange={onCharacterNameChange}
              onPersonaChange={onCharacterPersonaChange}
              onToggleKeyword={onToggleKeyword}
              onNotice={onNotice}
              onSubmit={onCharacterSubmit}
              onConfirm={onCharacterConfirm}
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
        onTodosChanged={onCalendarTodosChanged}
        onCompleteTodo={onCalendarCompleteTodo}
      />

      {feedOpen ? (
        <div className="modalBackdrop" role="presentation" {...feedBackdrop}>
          <FeedModal onClose={onFeedClose} />
        </div>
      ) : null}
    </>
  );
}
