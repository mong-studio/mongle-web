import { useEffect, useLayoutEffect, useRef, useState } from "react";
import "./PomodoroHud.css";

const DUR = { focus: 25 * 60, break: 5 * 60 } as const;
type Mode = "focus" | "break";

function fmt(t: number) {
  const m = Math.floor(t / 60);
  const s = t % 60;
  return `${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
}

function saveLocal(mode: Mode, remaining: number, running: boolean, endAt: number | null) {
  try {
    localStorage.setItem("pomodoro_hud", JSON.stringify({ mode, remaining, running, endAt }));
  } catch {
    // ignore storage errors
  }
}

type PomodoroHudProps = {
  canResumeSavedRun: boolean;
  isLoggedOut: boolean;
  onBeforeStart: () => boolean | Promise<boolean>;
};

export function PomodoroHud({ canResumeSavedRun, isLoggedOut, onBeforeStart }: PomodoroHudProps) {
  const [mode, setMode] = useState<Mode>("focus");
  const [remaining, setRemaining] = useState(DUR.focus);
  const [running, setRunning] = useState(false);
  const [toast, setToast] = useState("");
  const [spinning, setSpinning] = useState(false);

  const runningRef = useRef(false);
  const modeRef = useRef<Mode>("focus");
  const remainingRef = useRef(DUR.focus);

  // Fix 3: assign refs after commit, not during render, to be safe under concurrent rendering
  useLayoutEffect(() => {
    runningRef.current = running;
    modeRef.current = mode;
    remainingRef.current = remaining;
  });

  const toastTimer = useRef<ReturnType<typeof setTimeout>>();
  const spinTimer = useRef<ReturnType<typeof setTimeout>>();
  const endAtRef = useRef<number | null>(null);

  useEffect(() => {
    if (canResumeSavedRun || !runningRef.current) {
      return;
    }
    setRunning(false);
    endAtRef.current = null;
    saveLocal(modeRef.current, remainingRef.current, false, null);
  }, [canResumeSavedRun]);

  useEffect(() => {
    if (!isLoggedOut) return;
    setRunning(false);
    runningRef.current = false;
    setMode("focus");
    modeRef.current = "focus";
    setRemaining(DUR.focus);
    remainingRef.current = DUR.focus;
    endAtRef.current = null;
    try {
      localStorage.removeItem("pomodoro_hud");
    } catch {
      // ignore storage errors
    }
  }, [isLoggedOut]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("pomodoro_hud");
      if (raw) {
        const s = JSON.parse(raw) as {
          mode?: string;
          remaining?: number;
          running?: boolean;
          endAt?: number | null;
        };
        const mode: Mode = s.mode === "focus" || s.mode === "break" ? s.mode : "focus";

        if (s.running === true && typeof s.endAt === "number") {
          // Display accuracy doesn't depend on auth - it's pure arithmetic
          // from the stored end timestamp. Only resuming the actual ticking
          // (setRunning) is gated by canResumeSavedRun.
          const r = Math.ceil((s.endAt - Date.now()) / 1000);
          if (r > 0) {
            setMode(mode);
            modeRef.current = mode;
            setRemaining(r);
            remainingRef.current = r;
            if (canResumeSavedRun) {
              setRunning(true);
              runningRef.current = true;
              endAtRef.current = s.endAt;
            }
          } else {
            const nm: Mode = mode === "focus" ? "break" : "focus";
            setMode(nm);
            modeRef.current = nm;
            setRemaining(DUR[nm]);
            remainingRef.current = DUR[nm];
            if (canResumeSavedRun) {
              saveLocal(nm, DUR[nm], false, null);
            }
          }
        } else {
          setMode(mode);
          modeRef.current = mode;
          const r = typeof s.remaining === "number" && s.remaining > 0 ? s.remaining : DUR[mode];
          setRemaining(r);
          remainingRef.current = r;
        }
      }
    } catch {
      // ignore storage errors
    }

    const iv = setInterval(() => {
      if (!runningRef.current || endAtRef.current == null) return;
      const r = Math.ceil((endAtRef.current - Date.now()) / 1000);
      if (r <= 0) {
        const nm: Mode = modeRef.current === "focus" ? "break" : "focus";
        const next = DUR[nm];
        setMode(nm);
        setRemaining(next);
        setRunning(false);
        endAtRef.current = null;
        saveLocal(nm, next, false, null);
        const msg =
          nm === "break" ? "휴식 시간이에요! 잠시 쉬어가요" : "집중 시간이에요! 다시 힘내요";
        setToast(msg);
        clearTimeout(toastTimer.current);
        toastTimer.current = setTimeout(() => setToast(""), 2800);
      } else {
        setRemaining(r);
      }
    }, 1000);

    return () => {
      clearInterval(iv);
      clearTimeout(toastTimer.current);
      clearTimeout(spinTimer.current);
    };
  }, [canResumeSavedRun]);

  async function toggleRun() {
    const next = !runningRef.current;
    if (next) {
      const canStart = await onBeforeStart();
      if (!canStart) {
        return;
      }
      const endAt = Date.now() + remainingRef.current * 1000;
      endAtRef.current = endAt;
      saveLocal(modeRef.current, remainingRef.current, true, endAt);
    } else {
      endAtRef.current = null;
      saveLocal(modeRef.current, remainingRef.current, false, null);
    }
    setRunning(next);
  }

  async function switchMode() {
    if (runningRef.current) return;
    const canProceed = await onBeforeStart();
    if (!canProceed) return;
    const nm: Mode = modeRef.current === "focus" ? "break" : "focus";
    setMode(nm);
    setRemaining(DUR[nm]);
    saveLocal(nm, DUR[nm], false, null);
  }

  async function reset() {
    if (runningRef.current) return;
    const canProceed = await onBeforeStart();
    if (!canProceed) return;
    const r = DUR[modeRef.current];
    setRemaining(r);
    setSpinning(true);
    saveLocal(modeRef.current, r, false, null);
    clearTimeout(spinTimer.current);
    spinTimer.current = setTimeout(() => setSpinning(false), 520);
  }

  const isFocus = mode === "focus";

  return (
    <div className="pmHud">
      {isFocus ? (
        <div className="pmCard pmCard--focus">
          <div className="pmTwinkle pmTwinkle--tr1">✦</div>
          <div className="pmTwinkle pmTwinkle--tr2">✦</div>
          <div className="pmTitle">
            <span className="pmFlower">✿</span>
            <span className="pmTitleText pmTitleText--focus">뽀모도로</span>
            <span className="pmFlower">✿</span>
          </div>
          <div className="pmMain">
            <div className="pmImageWrap">
              <div className="pmImageGlow pmImageGlow--sun" />
              <img src="/assets/hud/icon-sun.png" alt="" className="pmEmoji pmEmoji--sun" />
              <span className="pmPetal">✿</span>
            </div>
            <div className="pmTime pmTime--focus">{fmt(remaining)}</div>
            <button type="button" className="pmPlayBtn pmPlayBtn--focus" onClick={toggleRun}>
              {running ? (
                <span className="pmPause">
                  <span />
                  <span />
                </span>
              ) : (
                <span className="pmPlay" />
              )}
            </button>
          </div>
          <div className="pmDivider pmDivider--focus">
            <div />
            <span>✿</span>
            <div />
          </div>
          <div className="pmActions">
            <button
              type="button"
              className="pmModeBtn pmModeBtn--focus"
              onClick={switchMode}
              disabled={running}
            >
              <img src="/assets/hud/icon-apple.png" alt="" className="pmActionIcon" />
              집중
            </button>
            <button
              type="button"
              className="pmResetBtn pmResetBtn--focus"
              onClick={reset}
              disabled={running}
            >
              <span className={spinning ? "pmSpinIcon" : "pmSpinIconIdle"}>↺</span>
              초기화
            </button>
          </div>
        </div>
      ) : (
        <div className="pmCard pmCard--break">
          <div className="pmBreakGlow" />
          <div className="pmTwinkle pmTwinkle--bl1">✦</div>
          <div className="pmTwinkle pmTwinkle--bl2">✦</div>
          <div className="pmTwinkle pmTwinkle--bl3">✦</div>
          <div className="pmTwinkle pmTwinkle--tr1b">✦</div>
          <div className="pmTitle">
            <span className="pmStar">✦</span>
            <span className="pmTitleText pmTitleText--break">뽀모도로</span>
            <span className="pmStar">✦</span>
          </div>
          <div className="pmMain">
            <div className="pmImageWrap">
              <div className="pmImageGlow pmImageGlow--moon" />
              <img src="/assets/hud/moon.png" alt="" className="pmEmoji pmEmoji--moon" />
              <div className="pmMoonShadow pmMoonShadow--l" />
              <div className="pmMoonShadow pmMoonShadow--r" />
            </div>
            <div className="pmTime pmTime--break">{fmt(remaining)}</div>
            <button type="button" className="pmPlayBtn pmPlayBtn--break" onClick={toggleRun}>
              {running ? (
                <span className="pmPause pmPause--break">
                  <span />
                  <span />
                </span>
              ) : (
                <span className="pmPlay pmPlay--break" />
              )}
            </button>
          </div>
          <div className="pmDivider pmDivider--break">
            <div />
            <span>✦</span>
            <div />
          </div>
          <div className="pmActions">
            <button
              type="button"
              className="pmModeBtn pmModeBtn--break"
              onClick={switchMode}
              disabled={running}
            >
              ☕ 휴식
            </button>
            <button
              type="button"
              className="pmResetBtn pmResetBtn--break"
              onClick={reset}
              disabled={running}
            >
              <span className={spinning ? "pmSpinIcon" : "pmSpinIconIdle"}>↺</span>
              초기화
            </button>
          </div>
        </div>
      )}

      {toast && (
        <div className="pmToast">
          <span>✿</span>
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}
