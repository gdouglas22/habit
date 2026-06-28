import { useEffect, useRef, useState } from "react";
import { ACCENT } from "../theme";
import { useStore } from "../store/store";
import { valueOn, targetFor } from "../store/selectors";
import {
  hasTelegram,
  haptic,
  notifySuccess,
  showMainButton,
  hideMainButton,
  showBackButton,
  hideBackButton,
} from "../telegram";
import { ChevronLeft, Play, Pause, RotateCcw, SkipForward, Volume, VolumeOff } from "../icons";
import { formatMinutes } from "../date";
import { resumeAudio, playTick, playChime, isMuted, setMuted } from "../sound";
import { keepAwake } from "../wakelock";
import type { TimerSession } from "../data";

const BREAK_COLOR = "#3FA86A";

function fmt(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  const mm = h > 0 ? String(m).padStart(2, "0") : String(m);
  return h > 0 ? `${h}:${mm}:${String(ss).padStart(2, "0")}` : `${mm}:${String(ss).padStart(2, "0")}`;
}

function liveElapsed(s: TimerSession): number {
  return s.baseElapsed + (s.running && s.anchorMs ? Math.floor((Date.now() - s.anchorMs) / 1000) : 0);
}

export function Timer({ habitId, onClose }: { habitId: string; onClose: () => void }) {
  const { state, dispatch } = useStore();
  const habit = state.habits.find((h) => h.id === habitId);
  const date = state.selectedDate;
  const [muted, setMutedState] = useState(isMuted());

  // Resume an existing session for this habit, or start a fresh paused one.
  useEffect(() => {
    if (!habit) return;
    const cur = state.timer;
    if (cur && cur.habitId === habitId) return;
    const pomodoro = !!habit.pomodoroOn;
    const workSec = pomodoro ? Math.max(1, habit.workMin ?? 25) * 60 : targetFor(habit) * 60;
    const breakSec = pomodoro ? Math.max(1, habit.breakMin ?? 5) * 60 : 0;
    dispatch({
      type: "set_timer",
      timer: { habitId, date, pomodoro, workSec, breakSec, phase: "work", running: false, anchorMs: null, baseElapsed: 0 },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const session = state.timer && state.timer.habitId === habitId ? state.timer : null;

  // 4 Hz re-render so the dial + countdown stay live.
  const [, force] = useState(0);
  useEffect(() => {
    const id = setInterval(() => force((x) => x + 1), 250);
    return () => clearInterval(id);
  }, []);

  // Keep the screen awake while the timer is running.
  const running = !!session && session.running;
  useEffect(() => {
    keepAwake(running);
  }, [running]);
  useEffect(() => () => keepAwake(false), []);

  const phaseTotal = session ? (session.phase === "work" ? session.workSec : session.breakSec) : 0;
  const elapsed = session ? liveElapsed(session) : 0;
  const remaining = phaseTotal - elapsed;

  const bankMinutes = (min: number) => {
    if (!habit || min <= 0) return;
    const cur = valueOn(state.entries, habit.id, date);
    dispatch({ type: "set_habit_value", id: habit.id, date, value: cur + Math.round(min) });
  };

  // second-tick sound while running
  const lastSecRef = useRef(-1);
  useEffect(() => {
    if (!session || !session.running) {
      lastSecRef.current = -1;
      return;
    }
    if (lastSecRef.current !== elapsed) {
      const prev = lastSecRef.current;
      lastSecRef.current = elapsed;
      if (prev >= 0 && elapsed > 0) playTick();
    }
  });

  // phase completion: pomodoro auto-advances; non-pomodoro chimes once into overtime
  const handledRef = useRef(false);
  useEffect(() => {
    if (!session || !session.running) return;
    if (remaining > 0) {
      handledRef.current = false;
      return;
    }
    if (handledRef.current) return;
    handledRef.current = true;
    playChime();
    notifySuccess();
    if (session.pomodoro) {
      if (session.phase === "work") {
        bankMinutes(session.workSec / 60);
        dispatch({ type: "set_timer", timer: { ...session, phase: "break", baseElapsed: 0, anchorMs: Date.now() } });
      } else {
        dispatch({ type: "set_timer", timer: { ...session, phase: "work", baseElapsed: 0, anchorMs: Date.now() } });
      }
    }
  });

  // commit + close (also wired to Telegram MainButton/BackButton)
  const commitAndClose = () => {
    if (session && session.phase === "work") {
      bankMinutes(Math.floor(liveElapsed(session) / 60));
    }
    dispatch({ type: "set_timer", timer: null });
    onClose();
  };
  const saveRef = useRef(commitAndClose);
  saveRef.current = commitAndClose;
  useEffect(() => {
    showMainButton("Готово", () => saveRef.current());
    showBackButton(() => saveRef.current());
    return () => {
      hideMainButton();
      hideBackButton();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!habit) {
    onClose();
    return null;
  }
  if (!session) return <div className="app" />;

  const targetMin = targetFor(habit);
  const doneMin = valueOn(state.entries, habit.id, date) + (session.phase === "work" ? Math.floor(elapsed / 60) : 0);
  const isBreak = session.phase === "break";
  const overtime = !session.pomodoro && remaining <= 0;
  const progress = phaseTotal > 0 ? Math.min(1, elapsed / phaseTotal) : 0;
  const ringColor = isBreak ? BREAK_COLOR : overtime ? BREAK_COLOR : ACCENT;
  const r = 130;
  const c = 2 * Math.PI * r;

  const toggle = () => {
    resumeAudio();
    haptic("medium");
    if (session.running) {
      dispatch({ type: "set_timer", timer: { ...session, running: false, baseElapsed: elapsed, anchorMs: null } });
    } else {
      playTick(); // immediate feedback + engages audio on iOS
      dispatch({ type: "set_timer", timer: { ...session, running: true, anchorMs: Date.now() } });
    }
  };
  const reset = () => {
    haptic("light");
    handledRef.current = false;
    dispatch({ type: "set_timer", timer: { ...session, baseElapsed: 0, anchorMs: session.running ? Date.now() : null } });
  };
  const skipBreak = () => {
    haptic("light");
    handledRef.current = false;
    dispatch({ type: "set_timer", timer: { ...session, phase: "work", baseElapsed: 0, anchorMs: session.running ? Date.now() : null } });
  };
  const addFive = () => {
    haptic("light");
    dispatch({ type: "set_timer", timer: { ...session, workSec: session.workSec + 300 } });
  };

  const centerText = overtime ? `+${fmt(-remaining)}` : fmt(Math.max(0, remaining));
  const phaseLabel = isBreak
    ? session.running ? "перерыв" : "перерыв · пауза"
    : overtime ? "сверх плана" : session.running ? "идёт фокус" : "на паузе";

  return (
    <div className="app">
      <div className="screen noscroll" style={{ display: "flex", flexDirection: "column", padding: "14px 16px 40px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <button onClick={commitAndClose} style={iconBtn}>
            <ChevronLeft size={18} />
          </button>
          <div style={{ fontSize: 19, fontWeight: 900, color: "var(--text)", flex: 1 }}>Таймер</div>
          <button
            onClick={() => {
              const m = !muted;
              setMuted(m);
              setMutedState(m);
              haptic("light");
              if (!m) {
                resumeAudio();
                playTick(); // confirm sound works
              }
            }}
            style={iconBtn}
            title={muted ? "Включить звук" : "Выключить звук"}
          >
            {muted ? <VolumeOff size={18} /> : <Volume size={18} />}
          </button>
        </div>

        <div style={{ textAlign: "center", marginTop: 10, marginBottom: 4 }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: "var(--text)" }}>{habit.name}</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--hint)", marginTop: 4 }}>
            {session.pomodoro
              ? `Помодоро · работа ${Math.round(session.workSec / 60)} / перерыв ${Math.round(session.breakSec / 60)} мин`
              : `Цель ${formatMinutes(targetMin)}`}
          </div>
          <div style={{ fontSize: 13, fontWeight: 800, color: "var(--hint)", marginTop: 2 }}>
            сегодня {formatMinutes(doneMin)} / {formatMinutes(targetMin)}
          </div>
        </div>

        {/* dial */}
        <div style={{ display: "flex", justifyContent: "center", margin: "26px 0 32px" }}>
          <div style={{ position: "relative", width: 300, height: 300 }}>
            <svg width="300" height="300" viewBox="0 0 300 300">
              <circle cx="150" cy="150" r={r} fill="none" stroke="var(--card2)" strokeWidth="14" />
              <circle
                cx="150"
                cy="150"
                r={r}
                fill="none"
                stroke={ringColor}
                strokeWidth="14"
                strokeLinecap="round"
                strokeDasharray={c}
                strokeDashoffset={c * (1 - progress)}
                transform="rotate(-90 150 150)"
                style={{ transition: "stroke-dashoffset .35s linear, stroke .3s" }}
              />
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <div className="bignum" style={{ fontSize: 54, fontWeight: 900, color: isBreak || overtime ? BREAK_COLOR : "var(--text)" }}>
                {centerText}
              </div>
              <div style={{ fontSize: 14, fontWeight: 800, color: isBreak || overtime ? BREAK_COLOR : "var(--hint)", marginTop: 2 }}>
                {phaseLabel}
              </div>
            </div>
          </div>
        </div>

        {/* controls */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 20 }}>
          <button onClick={reset} style={roundBtn(false)} title="Сбросить">
            <RotateCcw size={22} />
          </button>
          <button onClick={toggle} style={{ ...roundBtn(true), width: 80, height: 80 }}>
            {session.running ? <Pause size={30} color="#fff" /> : <Play size={28} color="#fff" />}
          </button>
          {isBreak ? (
            <button onClick={skipBreak} style={{ ...roundBtn(false), fontSize: 10, fontWeight: 800, flexDirection: "column", gap: 2 }} title="Пропустить перерыв">
              <SkipForward size={18} />
              работа
            </button>
          ) : session.pomodoro ? (
            <div style={{ width: 56 }} />
          ) : (
            <button onClick={addFive} style={{ ...roundBtn(false), fontSize: 13, fontWeight: 800 }} title="Продлить на 5 минут">
              +5м
            </button>
          )}
        </div>

        {!hasTelegram && (
          <button
            onClick={commitAndClose}
            style={{
              marginTop: 36,
              width: "100%",
              border: "none",
              borderRadius: 16,
              background: ACCENT,
              color: "#fff",
              fontWeight: 900,
              fontSize: 16,
              padding: 15,
              cursor: "pointer",
              boxShadow: "0 8px 20px -8px rgba(242,107,122,.7)",
            }}
          >
            Готово
          </button>
        )}
      </div>
    </div>
  );
}

const iconBtn: React.CSSProperties = {
  width: 36,
  height: 36,
  border: "none",
  borderRadius: 12,
  background: "var(--card2)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  color: "var(--text)",
};

function roundBtn(primary: boolean): React.CSSProperties {
  return {
    width: 56,
    height: 56,
    border: "none",
    borderRadius: 999,
    background: primary ? ACCENT : "var(--card2)",
    color: primary ? "#fff" : "var(--text)",
    fontSize: 22,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    boxShadow: primary ? "0 12px 28px -8px rgba(242,107,122,.8)" : "none",
  };
}
