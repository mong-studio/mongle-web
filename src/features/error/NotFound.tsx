import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";
import "./notFound.css";

// Resolve against the app base so assets keep working if `vite.base` changes
// (e.g. served from a sub-path). BASE_URL always ends with a trailing slash.
const ASSET_BASE = `${import.meta.env.BASE_URL}assets/error`;

export type NotFoundProps = {
  /** "마을로 돌아가기" — defaults to navigating to the village home. */
  onGoHome?: () => void;
  /** "이장님에게 길 묻기" — defaults to onConsult (reach the mayor). */
  onAskMayor?: () => void;
  /** Bottom note — "일정 상담으로 돌아가기". Defaults to onGoHome. */
  onConsult?: () => void;
};

const SPARKS = ["nf-s1", "nf-s2", "nf-s3", "nf-s4", "nf-s5"];

function goHomeFallback() {
  window.location.assign(import.meta.env.BASE_URL);
}

/**
 * 404 cozy pixel-village error page. Faithful reproduction of the Claude Design
 * handoff (404.html) as a self-contained overlay. Renders above all app surfaces
 * so it can be shown for any "lost" state. Wire the three actions via props.
 */
export function NotFound({ onGoHome, onAskMayor, onConsult }: NotFoundProps) {
  const reduce = useReducedMotion();
  const handleHome = onGoHome ?? goHomeFallback;
  // "이장님에게 길 묻기" should reach the mayor (consultation), not duplicate
  // "마을로 돌아가기". Chain: ask → consult → home, so each surface stays distinct.
  const handleConsult = onConsult ?? handleHome;
  const handleAsk = onAskMayor ?? handleConsult;

  // This page replaces the whole app surface (route guard / error fallback), so
  // move focus to it on mount — the standard SPA route-change pattern that lets
  // screen-reader users land on the error instead of stale, removed content.
  const stageRef = useRef<HTMLElement>(null);
  useEffect(() => {
    stageRef.current?.focus();
  }, []);

  // Staged entrance: house drops in, 404 pops, copy + scene rise, controls settle.
  const rise = (delay: number) =>
    reduce
      ? { initial: false as const }
      : {
          initial: { opacity: 0, y: 16 },
          animate: { opacity: 1, y: 0 },
          transition: { delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
        };

  return (
    <div className="nf-root">
      <main className="nf-stage" ref={stageRef} tabIndex={-1} aria-labelledby="nf-title">
        {SPARKS.map((cls) => (
          <span key={cls} className={`nf-spark ${cls}`} aria-hidden="true" />
        ))}

        <motion.img
          className="nf-house"
          src={`${ASSET_BASE}/house.png`}
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
          className="nf-num-wrap"
          {...(reduce
            ? { initial: false as const }
            : {
                initial: { opacity: 0, scale: 0.72 },
                animate: { opacity: 1, scale: 1 },
                transition: { delay: 0.12, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] as const },
              })}
        >
          <img
            className="nf-sprig nf-left"
            src={`${ASSET_BASE}/sprig_left.png`}
            alt=""
            aria-hidden="true"
          />
          <span className="nf-num">404</span>
          <img
            className="nf-sprig nf-right"
            src={`${ASSET_BASE}/sprig_right.png`}
            alt=""
            aria-hidden="true"
          />
        </motion.div>

        <motion.h1 id="nf-title" className="nf-title" {...rise(0.24)}>
          앗, 길을 잃어버렸어요!
        </motion.h1>
        <motion.p className="nf-sub" {...rise(0.32)}>
          찾으시는 페이지가 구름 너머로 사라진 것 같아요.
        </motion.p>

        <motion.div className="nf-scene-wrap" {...rise(0.4)}>
          <picture>
            <source srcSet={`${ASSET_BASE}/scene.webp`} type="image/webp" />
            <img
              className="nf-scene"
              src={`${ASSET_BASE}/scene.png`}
              alt="길을 잃은 토끼와 길을 알려주는 이장님"
              width={632}
              height={332}
              decoding="async"
            />
          </picture>
          <div className="nf-bubble">
            혼자 찾기
            <br />
            어려우시죠?
            <br />
            제가 도와드릴게요!
          </div>
        </motion.div>

        <div className="nf-divider" aria-hidden="true">
          <span className="nf-line" />
          <span className="nf-flower">&#10047;</span>
          <span className="nf-line" />
        </div>

        <motion.div className="nf-btn-row" {...rise(0.5)}>
          <button type="button" className="nf-btn nf-btn-primary" onClick={handleHome}>
            <img src={`${ASSET_BASE}/flower_t.png`} alt="" aria-hidden="true" />
            마을로 돌아가기
          </button>
          <button type="button" className="nf-btn nf-btn-secondary" onClick={handleAsk}>
            이장님에게 길 묻기
            <img src={`${ASSET_BASE}/flower_t.png`} alt="" aria-hidden="true" />
          </button>
        </motion.div>

        <motion.button type="button" className="nf-note" onClick={handleConsult} {...rise(0.58)}>
          <img src={`${ASSET_BASE}/hamster_t.png`} alt="" aria-hidden="true" />
          <span className="nf-note-txt">문제가 계속되면 이장님과 일정 상담으로 돌아가 보세요.</span>
          <span className="nf-chev" aria-hidden="true">
            &rsaquo;
          </span>
        </motion.button>
      </main>
    </div>
  );
}
