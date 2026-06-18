import type { TodoItem } from "../../features/todo/todoCreation.js";
import { FEATURES, type FeatureId } from "../featureRegistry.js";
import type { Resident } from "../model/appTypes.js";
import "./VillageDialogue.css";

type VillageDialogueProps = {
  doneTodoCount: number;
  open: boolean;
  residents: Resident[];
  savedTodos: TodoItem[];
  onClose: () => void;
  onOpen: () => void;
  onOpenFeature: (feature: FeatureId) => void;
};

const DIALOGUE_OPTION_META: Record<
  FeatureId,
  { image: string; shortTitle: string; subtitle: string }
> = {
  character: {
    image: "/assets/dialogue/dialogue_character.png",
    shortTitle: "새 주민 들이기",
    subtitle: "새 친구 만들기",
  },
  todo: {
    image: "/assets/dialogue/dialogue_todo.png",
    shortTitle: "TODO 만들기",
    subtitle: "퀘스트 나누기",
  },
  planner: {
    image: "/assets/dialogue/dialogue_chat.png",
    shortTitle: "계획 짜기",
    subtitle: "일정 정리하기",
  },
};

export function VillageDialogue({ open, onClose, onOpen, onOpenFeature }: VillageDialogueProps) {
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
        <div className="dialogueChiefPanel">
          <div className="dialogueChiefScene">
            <img
              className="dialogueRoom"
              src="/assets/dialogue/dialogue_background.png"
              alt=""
              aria-hidden="true"
            />
            <img
              className="chiefPortrait"
              src="/assets/dialogue/dialogue_mongle.png"
              alt="몽글마을 이장님"
            />
          </div>
          <div className="dialogueNamePlate">몽글이장님</div>
        </div>

        <div className="dialogueContent">
          <div className="dialogueText">
            <p>오늘은 어떤 걸 도와줄까?</p>
          </div>

          <div className="dialogueOptions">
            {Object.values(FEATURES).map((feature) => {
              const option = DIALOGUE_OPTION_META[feature.id];

              return (
                <button
                  type="button"
                  className="dialogueOptionButton"
                  key={feature.id}
                  onClick={() => onOpenFeature(feature.id)}
                >
                  <img src={option.image} alt="" aria-hidden="true" />
                  <b>{option.shortTitle}</b>
                  <span>{option.subtitle}</span>
                  <i aria-hidden="true">›</i>
                </button>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
