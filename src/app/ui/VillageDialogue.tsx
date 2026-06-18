import type { TodoItem } from "../../features/todo/todoCreation.js";
import { FEATURES, type FeatureId } from "../featureRegistry.js";
import type { Resident } from "../model/appTypes.js";

type VillageDialogueProps = {
  doneTodoCount: number;
  open: boolean;
  residents: Resident[];
  savedTodos: TodoItem[];
  onClose: () => void;
  onOpen: () => void;
  onOpenFeature: (feature: FeatureId) => void;
};

export function VillageDialogue({
  doneTodoCount,
  open,
  residents,
  savedTodos,
  onClose,
  onOpen,
  onOpenFeature,
}: VillageDialogueProps) {
  if (!open) {
    return (
      <button type="button" className="talkButton" onClick={onOpen}>
        <span className="mainHoverLabel">이장님과 대화</span>
      </button>
    );
  }

  return (
    <>
      <button
        type="button"
        className="dialogueDismissLayer"
        onClick={onClose}
        aria-label="이장님 대화 닫기"
      />
      <section className="dialogueBox" aria-label="마을 이장님 대화">
        <img className="chiefPortrait" src="/assets/mongle_chief.png" alt="몽글마을 이장님" />
        <div className="dialogueText">
          <span>몽글이장님</span>
          <p>안녕! 오늘은 어떤 걸 먼저 정리해볼까?</p>
          <small>
            완료 {doneTodoCount}개 · TODO {savedTodos.length}개 · 주민 {residents.length}명
          </small>
        </div>
        <div className="dialogueOptions">
          {Object.values(FEATURES).map((feature) => (
            <button type="button" key={feature.id} onClick={() => onOpenFeature(feature.id)}>
              <b>{feature.title}</b>
              <span>{feature.npcLine}</span>
            </button>
          ))}
        </div>
      </section>
    </>
  );
}
