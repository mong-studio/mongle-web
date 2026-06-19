import { CharacterModal } from "../../features/character/createCharacter.js";
import { PlannerChat } from "../../features/planner-chat/plannerChat.js";
import {
  type TodoCommitResult,
  TodoCreation,
  type TodoItem,
} from "../../features/todo/todoCreation.js";
import { useBackdropDismiss } from "../../shared/ui/useBackdropDismiss.js";
import { FEATURES, type FeatureId } from "../featureRegistry.js";
import type { Resident } from "../model/appTypes.js";

type FeatureModalHostProps = {
  activeFeature: FeatureId | null;
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

export function FeatureModalHost({
  activeFeature,
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
  const backdrop = useBackdropDismiss(onClose);

  if (!activeFeature || !active) {
    return null;
  }

  return (
    <div className="modalBackdrop" role="presentation" {...backdrop}>
      <section
        className={`featureModal${activeFeature === "character" ? " characterModal" : ""}${activeFeature === "planner" ? " plannerModalShell" : ""}${activeFeature === "todo" ? " todoModalShell" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="feature-title"
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.stopPropagation()}
      >
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
            residents={residents}
            savedTodos={savedTodos}
            onNotice={onNotice}
            onTodosSaved={onTodosSaved}
            onClose={onClose}
          />
        ) : null}

        {activeFeature === "planner" ? (
          <PlannerChat onNotice={onNotice} onTodosSaved={onTodosSaved} onClose={onClose} />
        ) : null}
      </section>
    </div>
  );
}
