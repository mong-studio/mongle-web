import { useEffect, useState } from "react";
import { useBackdropDismiss } from "../../shared/ui/useBackdropDismiss.js";
import { TUTORIAL_TABS } from "./tutorialContent.js";
import "./tutorial.css";

type TutorialModalProps = {
  open: boolean;
  onClose: () => void;
};

function parseNumberedParagraph(paragraph: string) {
  const normalized = paragraph.replace(/\n+/g, " ").replace(/\s+/g, " ").trim();
  const match = normalized.match(/^(\d+)[.)]\s*([^:：]+)[:：]\s*(.+)$/);

  if (!match) {
    return null;
  }

  return {
    number: match[1],
    label: match[2].trim(),
    text: match[3].trim(),
  };
}

function parseTipParagraph(paragraph: string) {
  const normalized = paragraph.replace(/\n+/g, " ").replace(/\s+/g, " ").trim();
  const match = normalized.match(/^Tip!\s*(.+)$/i);

  return match?.[1]?.trim() ?? null;
}

export function TutorialModal({ open, onClose }: TutorialModalProps) {
  const [tabIndex, setTabIndex] = useState(0);
  const [pageIndex, setPageIndex] = useState(0);
  const backdrop = useBackdropDismiss(onClose);

  // 모달을 다시 열 때는 항상 첫 필드 첫 페이지부터 보여준다.
  useEffect(() => {
    if (open) {
      setTabIndex(0);
      setPageIndex(0);
    }
  }, [open]);

  const tab = TUTORIAL_TABS[tabIndex];
  const isFirst = tabIndex === 0 && pageIndex === 0;
  const isLast = tabIndex === TUTORIAL_TABS.length - 1 && pageIndex === tab.pages.length - 1;

  // 페이지는 필드 안에서 이동하되, 끝에 닿으면 다음/이전 필드로 흐름이 이어진다.
  function goPrev() {
    if (pageIndex > 0) {
      setPageIndex((p) => p - 1);
    } else if (tabIndex > 0) {
      const prevTab = tabIndex - 1;
      setTabIndex(prevTab);
      setPageIndex(TUTORIAL_TABS[prevTab].pages.length - 1);
    } else {
      onClose();
    }
  }

  function goNext() {
    if (pageIndex < tab.pages.length - 1) {
      setPageIndex((p) => p + 1);
    } else if (tabIndex < TUTORIAL_TABS.length - 1) {
      setTabIndex((t) => t + 1);
      setPageIndex(0);
    } else {
      onClose();
    }
  }

  function selectTab(i: number) {
    setTabIndex(i);
    setPageIndex(0);
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: goPrev/goNext는 tabIndex·pageIndex에 의존하므로 함께 재바인딩한다
  useEffect(() => {
    if (!open) {
      return;
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      } else if (event.key === "ArrowLeft") {
        goPrev();
      } else if (event.key === "ArrowRight") {
        goNext();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, tabIndex, pageIndex, onClose]);

  if (!open) {
    return null;
  }

  const active = tab.pages[pageIndex];
  const isChiefIllustration = active.illustration === "/assets/mongle_chief.png";
  const showBubbleInIllustration = isChiefIllustration && Boolean(active.bubble);
  const summary = active.summary ?? (!showBubbleInIllustration ? active.bubble : undefined);
  const tipParagraphs = active.paragraphs
    .map(parseTipParagraph)
    .filter((tip): tip is string => Boolean(tip));
  const bodyParagraphs = active.paragraphs.filter((paragraph) => !parseTipParagraph(paragraph));
  const numberedParagraphs = bodyParagraphs.map(parseNumberedParagraph);
  const hasNumberedParagraphs =
    numberedParagraphs.length > 0 && numberedParagraphs.every((item) => item !== null);

  return (
    <div className="tutorialBackdrop" role="presentation" {...backdrop}>
      <div className="tutorialStage">
        <nav className="tutorialTabs" aria-label="튜토리얼 주제">
          {TUTORIAL_TABS.map((item, i) => (
            <button
              key={item.id}
              type="button"
              className={`tutorialTab${i === tabIndex ? " isActive" : ""}`}
              aria-current={i === tabIndex ? "true" : undefined}
              onClick={() => selectTab(i)}
            >
              {item.tab}
            </button>
          ))}
        </nav>

        <section
          className="tutorialCard"
          role="dialog"
          aria-modal="true"
          aria-label="몽글마을 튜토리얼"
        >
          <button
            type="button"
            className="tutorialClose"
            aria-label="튜토리얼 닫기"
            onClick={onClose}
          >
            ✕
          </button>

          <header className="tutorialHead">
            {active.eyebrow ? <span className="tutorialEyebrow">{active.eyebrow}</span> : null}
            <h2 className="tutorialTitle">
              <img
                className="tutorialTitleFlower"
                src="/assets/todo/flower_cluster_left.png"
                alt=""
              />
              {active.title}
              <img
                className="tutorialTitleFlower"
                src="/assets/todo/flower_cluster_right.png"
                alt=""
              />
            </h2>
            {summary ? <p className="tutorialSummary">{summary}</p> : null}
          </header>

          <div className="tutorialBody">
            <div
              className={`tutorialIllustration${
                showBubbleInIllustration ? " tutorialIllustration--hasBubble" : ""
              }`}
            >
              {showBubbleInIllustration ? (
                <div className="tutorialBubble">
                  {active.bubble?.split("\n").map((line, i) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: 정적 말풍선 줄, 순서가 바뀌지 않음
                    <span key={i}>{line}</span>
                  ))}
                </div>
              ) : null}
              <div
                aria-hidden="true"
                className={`tutorialIllustrationImg${
                  active.illustration === "/assets/mongle_chief.png"
                    ? " tutorialIllustrationImg--chief"
                    : ""
                }`}
                style={{ backgroundImage: `url("${active.illustration}")` }}
              />
              {active.bubbleName ? (
                <span className="tutorialNameTag">{active.bubbleName}</span>
              ) : null}
            </div>

            <div
              className={`tutorialText${hasNumberedParagraphs ? " tutorialText--numbered" : ""}${
                tipParagraphs.length > 0 ? " tutorialText--withTip" : ""
              }`}
            >
              {hasNumberedParagraphs ? (
                <ol className="tutorialNumberList">
                  {numberedParagraphs.map((item) =>
                    item ? (
                      <li key={`${item.number}-${item.label}`} className="tutorialNumberItem">
                        <span className="tutorialNumberBadge">{item.number}</span>
                        <span className="tutorialNumberCopy">
                          <b>{item.label}:</b> {item.text}
                        </span>
                      </li>
                    ) : null,
                  )}
                </ol>
              ) : (
                <div className="tutorialParagraphs">
                  {bodyParagraphs.map((paragraph, i) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: 정적 문단, 순서가 바뀌지 않음
                    <p key={i}>{paragraph.replace(/\n+/g, " ").trim()}</p>
                  ))}
                </div>
              )}
              {tipParagraphs.length > 0 ? (
                <aside className="tutorialTipBox" aria-label="팁">
                  <div className="tutorialTipHead">
                    <span className="tutorialTipIcon" aria-hidden="true">
                      ★
                    </span>
                    <b>TIP</b>
                  </div>
                  <div className="tutorialTipCopy">
                    {tipParagraphs.map((tip) => (
                      <p key={tip}>{tip}</p>
                    ))}
                  </div>
                </aside>
              ) : null}
            </div>
          </div>

          <footer className="tutorialFooter">
            <button type="button" className="tutorialGhostButton" onClick={goPrev}>
              {isFirst ? "건너뛰기" : "이전"}
            </button>

            <div className="tutorialDots" aria-hidden="true">
              <span className="tutorialDotRow">
                {tab.pages.map((_, i) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: 페이지 수만큼의 고정 점, 순서가 바뀌지 않음
                  <span key={i} className={`tutorialDot${i === pageIndex ? " isActive" : ""}`} />
                ))}
              </span>
              <b className="tutorialDotCount">
                {pageIndex + 1} / {tab.pages.length}
              </b>
            </div>

            <button type="button" className="tutorialPrimaryButton" onClick={goNext}>
              {isLast ? "시작하기" : "다음"}
              <span aria-hidden="true">›</span>
            </button>
          </footer>
        </section>
      </div>
    </div>
  );
}
