import { useEffect, useRef, useState } from "react";
import "./PomodoroHud.css";

const DUR = { focus: 25 * 60, break: 5 * 60 } as const;
type Mode = "focus" | "break";

function fmt(t: number) {
  const m = Math.floor(t / 60);
  const s = t % 60;
  return `${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
}

function saveLocal(mode: Mode, remaining: number, running: boolean) {
  try {
    localStorage.setItem("pomodoro_hud", JSON.stringify({ mode, remaining, running }));
  } catch {
    // ignore storage errors
  }
}

export function PomodoroHud() {
  const [mode, setMode] = useState<Mode>("focus");
  const [remaining, setRemaining] = useState(DUR.focus);
  const [running, setRunning] = useState(false);
  const [toast, setToast] = useState("");
  const [spinning, setSpinning] = useState(false);

  const runningRef = useRef(false);
  const modeRef = useRef<Mode>("focus");
  const remainingRef = useRef(DUR.focus);
  runningRef.current = running;
  modeRef.current = mode;
  remainingRef.current = remaining;

  const toastTimer = useRef<ReturnType<typeof setTimeout>>();
  const spinTimer = useRef<ReturnType<typeof setTimeout>>();

  function showToast(msg: string) {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2800);
  }

  useEffect(() => {
    try {
      const raw = localStorage.getItem("pomodoro_hud");
      if (raw) {
        const s = JSON.parse(raw) as { mode?: string; remaining?: number };
        if (s.mode === "focus" || s.mode === "break") {
          setMode(s.mode);
          modeRef.current = s.mode;
        }
        if (typeof s.remaining === "number") {
          setRemaining(s.remaining);
          remainingRef.current = s.remaining;
        }
      }
    } catch {
      // ignore storage errors
    }

    const iv = setInterval(() => {
      if (!runningRef.current) return;
      const r = remainingRef.current - 1;
      if (r <= 0) {
        const nm: Mode = modeRef.current === "focus" ? "break" : "focus";
        const next = DUR[nm];
        setMode(nm);
        setRemaining(next);
        setRunning(false);
        saveLocal(nm, next, false);
        const msg =
          nm === "break" ? "휴식 시간이에요! 잠시 쉬어가요" : "집중 시간이에요! 다시 힘내요";
        setToast(msg);
        clearTimeout(toastTimer.current);
        toastTimer.current = setTimeout(() => setToast(""), 2800);
      } else {
        setRemaining(r);
        saveLocal(modeRef.current, r, true);
      }
    }, 1000);

    return () => {
      clearInterval(iv);
      clearTimeout(toastTimer.current);
      clearTimeout(spinTimer.current);
    };
  }, []);

  function toggleRun() {
    const next = !runningRef.current;
    setRunning(next);
    saveLocal(modeRef.current, remainingRef.current, next);
  }

  function switchMode() {
    if (runningRef.current) return;
    const nm: Mode = modeRef.current === "focus" ? "break" : "focus";
    setMode(nm);
    setRemaining(DUR[nm]);
    saveLocal(nm, DUR[nm], false);
  }

  function reset() {
    if (runningRef.current) return;
    const r = DUR[modeRef.current];
    setRemaining(r);
    setSpinning(true);
    saveLocal(modeRef.current, r, false);
    clearTimeout(spinTimer.current);
    spinTimer.current = setTimeout(() => setSpinning(false), 520);
    showToast("타이머를 초기화했어요");
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
              <span className="pmEmoji">☀️</span>
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
              <img src="/assets/character/ic-apple.png" alt="" className="pmActionIcon" />
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
              <span className="pmEmoji pmEmoji--moon">🌙</span>
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
