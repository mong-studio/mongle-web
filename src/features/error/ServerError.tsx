import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";
import { goHome, openErrorReportMail, reloadPage } from "./serverErrorActions.js";
import "./serverError.css";

// Resolve against the app base so assets keep working if `vite.base` changes.
const ASSET_BASE = `${import.meta.env.BASE_URL}assets/error`;

export type ServerErrorProps = {
  /** "다시 시도하기" — defaults to reloading the page. */
  onRetry?: () => void;
  /** "메인으로 돌아가기" — defaults to navigating to the village home. */
  onGoHome?: () => void;
  /** Bottom note — "오류 신고하기". Defaults to opening an error-report mail. */
  onReconnect?: () => void;
};

const SPARKS = ["se-s1", "se-s2", "se-s3", "se-s4", "se-s5"];

/**
 * 500 cozy pixel-village error page. Faithful reproduction of the Claude Design
 * handoff (500.html) as a self-contained surface. Shown when the app crashes
 * (server/app error), distinct from the 404 "lost path" page. Wire the actions
 * via props — the ErrorBoundary passes `onRetry` to re-render the tree.
 */
export function ServerError({ onRetry, onGoHome, onReconnect }: ServerErrorProps) {
  const reduce = useReducedMotion();
  const handleRetry = onRetry ?? reloadPage;
  const handleHome = onGoHome ?? goHome;
  const handleReconnect = onReconnect ?? openErrorReportMail;

  // This page replaces the whole app surface, so move focus to it on mount —
  // the standard SPA route-change pattern so screen-reader users land here.
  const stageRef = useRef<HTMLElement>(null);
  useEffect(() => {
    stageRef.current?.focus();
  }, []);

  // Staged entrance: house drops in, 500 pops, copy + scene rise, controls settle.
  const rise = (delay: number) =>
    reduce
      ? { initial: false as const }
      : {
          initial: { opacity: 0, y: 16 },
          animate: { opacity: 1, y: 0 },
          transition: { delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
        };

  return (
    <div className="se-root">
      <main className="se-stage" ref={stageRef} tabIndex={-1} aria-labelledby="se-title">
        {SPARKS.map((cls) => (
          <span key={cls} className={`se-spark ${cls}`} aria-hidden="true" />
        ))}

        <motion.img
          className="se-house"
          src={`${ASSET_BASE}/house500_v2.png`}
          alt="마을 집"
          {...(reduce
            ? { initial: false as const }
            : {
                initial: { opacity: 0, y: -24 },
                animate: { opacity: 1, y: 0 },
                transition: { duration: 0.55, ease: [0.34, 1.56, 0.64, 1] as const },
              })}
        />

        <motion.div
          className="se-num-wrap"
          {...(reduce
            ? { initial: false as const }
            : {
                initial: { opacity: 0, scale: 0.72 },
                animate: { opacity: 1, scale: 1 },
                transition: { delay: 0.12, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] as const },
              })}
        >
          <img
            className="se-sprig se-left"
            src={`${ASSET_BASE}/sprig500_left.png`}
            alt=""
            aria-hidden="true"
          />
          <span className="se-num">500</span>
          <img
            className="se-sprig se-right"
            src={`${ASSET_BASE}/sprig500_right.png`}
            alt=""
            aria-hidden="true"
          />
        </motion.div>

        <motion.h1 id="se-title" className="se-title" {...rise(0.24)}>
          앗, 마을에 잠시 문제가 생겼어요!
        </motion.h1>
        <motion.p className="se-sub" {...rise(0.32)}>
          서버가 잠깐 쉬어가는 중이에요. 잠시 후 다시 시도해주세요.
        </motion.p>

        <motion.div className="se-scene-wrap" {...rise(0.4)}>
          <picture>
            <source srcSet={`${ASSET_BASE}/server-error-scene.webp`} type="image/webp" />
            <img
              className="se-scene"
              src={`${ASSET_BASE}/server-error-scene.png`}
              alt="고장난 기계를 고치는 이장님과 토끼"
              width={696}
              height={280}
              decoding="async"
            />
          </picture>
        </motion.div>

        <div className="se-divider" aria-hidden="true">
          <span className="se-line" />
          <span className="se-flower">&#10047;</span>
          <span className="se-line" />
        </div>

        <motion.div className="se-btn-row" {...rise(0.5)}>
          <button type="button" className="se-btn se-btn-primary" onClick={handleRetry}>
            <img src={`${ASSET_BASE}/flower_t.png`} alt="" aria-hidden="true" />
            다시 시도하기
          </button>
          <button type="button" className="se-btn se-btn-secondary" onClick={handleHome}>
            메인으로 돌아가기
            <img src={`${ASSET_BASE}/flower_t.png`} alt="" aria-hidden="true" />
          </button>
        </motion.div>

        <motion.button type="button" className="se-note" onClick={handleReconnect} {...rise(0.58)}>
          <img src={`${ASSET_BASE}/hamster_t.png`} alt="" aria-hidden="true" />
          <span className="se-note-txt">문제가 계속되면 이장님께 오류를 신고해주세요.</span>
          <span className="se-chev" aria-hidden="true">
            &rsaquo;
          </span>
        </motion.button>
      </main>
    </div>
  );
}
