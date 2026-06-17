import { CharacterModal } from "../../features/character/createCharacter.js";
import { PlannerChat } from "../../features/planner-chat/plannerChat.js";
import {
  type TodoCommitResult,
  TodoCreation,
  type TodoItem,
} from "../../features/todo/todoCreation.js";
import { FEATURES, type FeatureId } from "../featureRegistry.js";
import type { Resident } from "../model/appTypes.js";

type FeatureModalHostProps = {
  activeFeature: FeatureId | null;
  apiBase: string;
  characterName: string;
  characterPersona: string;
  isBusy: boolean;
  lastCreatedResident: Resident | null;
  residents: Resident[];
  savedTodos: TodoItem[];
  selectedKeywordCategories: string[];
  sourceImageName: string;
  sourceImagePreview: string;
  onClose: () => void;
  onCreateCharacter: () => void;
  onImageUpload: (file: File | undefined) => void;
  onNameChange: (value: string) => void;
  onNotice: (message: string) => void;
  onPersonaChange: (value: string) => void;
  onTodosSaved: (result: TodoCommitResult) => void;
  onToggleKeyword: (keyword: string) => void;
};

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
    </svg>
  );
}

export function FeatureModalHost({
  activeFeature,
  apiBase,
  characterName,
  characterPersona,
  isBusy,
  lastCreatedResident,
  residents,
  savedTodos,
  selectedKeywordCategories,
  sourceImageName,
  sourceImagePreview,
  onClose,
  onCreateCharacter,
  onImageUpload,
  onNameChange,
  onNotice,
  onPersonaChange,
  onTodosSaved,
  onToggleKeyword,
}: FeatureModalHostProps) {
  const active = activeFeature ? FEATURES[activeFeature] : null;

  if (!activeFeature || !active) {
    return null;
  }

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: backdrop click-to-dismiss is intentional UX
    <div
      className="modalBackdrop"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section
        className={`featureModal${activeFeature === "character" ? " characterModal" : ""}${activeFeature === "planner" ? " plannerModalShell" : ""}${activeFeature === "todo" ? " todoModalShell" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="feature-title"
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.stopPropagation()}
      >
        {activeFeature === "planner" ? (
          <button
            type="button"
            className="closeButton plannerCloseButton"
            onClick={onClose}
            aria-label="닫기"
          >
            <CloseIcon />
          </button>
        ) : null}
        {activeFeature !== "character" &&
        activeFeature !== "planner" &&
        activeFeature !== "todo" ? (
          <>
            <button type="button" className="closeButton" onClick={onClose} aria-label="닫기">
              <CloseIcon />
            </button>
            <p className="modalKicker">MONGLE VILLAGE</p>
            <h2 id="feature-title">{active.title}</h2>
            <p className="modalLine">{active.npcLine}</p>
            <span className="featureMeta">{active.meta}</span>
          </>
        ) : null}

        {activeFeature === "character" ? (
          <CharacterModal
            residents={residents}
            sourceImagePreview={sourceImagePreview}
            sourceImageName={sourceImageName}
            characterName={characterName}
            characterPersona={characterPersona}
            selectedKeywordCategories={selectedKeywordCategories}
            isBusy={isBusy}
            lastCreatedResident={lastCreatedResident}
            onImageUpload={onImageUpload}
            onNameChange={onNameChange}
            onPersonaChange={onPersonaChange}
            onToggleKeyword={onToggleKeyword}
            onNotice={onNotice}
            onSubmit={onCreateCharacter}
            onClose={onClose}
          />
        ) : null}

        {activeFeature === "todo" ? (
          <TodoCreation
            apiBase={apiBase}
            savedTodos={savedTodos}
            onNotice={onNotice}
            onTodosSaved={onTodosSaved}
            onClose={onClose}
          />
        ) : null}

        {activeFeature === "planner" ? (
          <PlannerChat apiBase={apiBase} onNotice={onNotice} onTodosSaved={onTodosSaved} />
        ) : null}
      </section>
    </div>
  );
}
