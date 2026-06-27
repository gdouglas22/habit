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
import { ChevronLeft } from "../icons";
import { formatMinutes } from "../date";

function fmt(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const mm = h > 0 ? String(m).padStart(2, "0") : String(m);
  return h > 0 ? `${h}:${mm}:${String(s).padStart(2, "0")}` : `${mm}:${String(s).padStart(2, "0")}`;
}

// Concentration timer for a "time" habit. Counts down from the habit's target
// minutes; focused minutes are written into the day's progress on save.
export function Timer({
  habitId,
  onClose,
}: {
  habitId: string;
  onClose: () => void;
}) {
  const { state, dispatch } = useStore();
  const date = state.selectedDate;
  const habit = state.habits.find((h) => h.id === habitId);
  const targetMin = habit ? targetFor(habit) : 25;
  const alreadyMin = habit ? valueOn(state.entries, habit.id, date) : 0;

  const [total, setTotal] = useState(targetMin * 60); // planned seconds
  const [elapsed, setElapsed] = useState(0); // seconds counted up this session
  const [running, setRunning] = useState(false);
  const notifiedRef = useRef(false);

  // tick — counts up and keeps going past the goal into "overtime"
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setElapsed((e) => {
        const next = e + 1;
        if (!notifiedRef.current && next >= total) {
          notifiedRef.current = true;
          notifySuccess();
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running, total]);

  const commitAndClose = () => {
    const addMin = Math.round(elapsed / 60);
    if (addMin > 0 && habit) {
      dispatch({ type: "set_habit_value", id: habit.id, date, value: alreadyMin + addMin });
    }
    onClose();
  };

  // Telegram chrome
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

  const remaining = total - elapsed; // <= 0 means overtime
  const overtime = remaining <= 0;
  const progress = total > 0 ? Math.min(1, elapsed / total) : 0;
  const r = 130;
  const c = 2 * Math.PI * r;
  const focusedMin = Math.round(elapsed / 60);

  return (
    <div className="app">
      <div className="screen noscroll" style={{ display: "flex", flexDirection: "column", padding: "14px 16px 40px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <button
            onClick={commitAndClose}
            style={{
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
            }}
          >
            <ChevronLeft size={18} />
          </button>
          <div style={{ fontSize: 19, fontWeight: 900, color: "var(--text)" }}>Таймер</div>
        </div>

        <div style={{ textAlign: "center", marginTop: 14, marginBottom: 4 }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: "var(--text)" }}>{habit.name}</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--hint)", marginTop: 4 }}>
            Цель {formatMinutes(targetMin)} · сегодня {formatMinutes(alreadyMin + focusedMin)} /{" "}
            {formatMinutes(targetMin)}
          </div>
        </div>

        {/* dial */}
        <div style={{ display: "flex", justifyContent: "center", margin: "30px 0 36px" }}>
          <div style={{ position: "relative", width: 300, height: 300 }}>
            <svg width="300" height="300" viewBox="0 0 300 300">
              <circle cx="150" cy="150" r={r} fill="none" stroke="var(--card2)" strokeWidth="14" />
              <circle
                cx="150"
                cy="150"
                r={r}
                fill="none"
                stroke={overtime ? "#58B978" : ACCENT}
                strokeWidth="14"
                strokeLinecap="round"
                strokeDasharray={c}
                strokeDashoffset={c * (1 - progress)}
                transform="rotate(-90 150 150)"
                style={{ transition: "stroke-dashoffset .9s linear, stroke .3s" }}
              />
            </svg>
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                className="bignum"
                style={{ fontSize: 56, fontWeight: 900, color: overtime ? "#3F9B5E" : "var(--text)" }}
              >
                {overtime ? `+${fmt(-remaining)}` : fmt(remaining)}
              </div>
              <div style={{ fontSize: 14, fontWeight: 800, color: overtime ? "#3F9B5E" : "var(--hint)", marginTop: 2 }}>
                {overtime ? "сверх плана" : running ? "идёт фокус" : "на паузе"}
              </div>
            </div>
          </div>
        </div>

        {/* controls */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 20 }}>
          <button
            onClick={() => {
              haptic("light");
              setRunning(false);
              setElapsed(0);
              notifiedRef.current = false;
            }}
            style={roundBtn(false)}
            title="Сбросить"
          >
            ↺
          </button>
          <button
            onClick={() => {
              haptic("medium");
              setRunning((v) => !v);
            }}
            style={{ ...roundBtn(true), width: 80, height: 80 }}
          >
            {running ? "⏸" : "▶"}
          </button>
          <button
            onClick={() => {
              haptic("light");
              setTotal((t) => t + 300);
            }}
            style={{ ...roundBtn(false), fontSize: 13, fontWeight: 800 }}
            title="Продлить план на 5 минут"
          >
            +5м
          </button>
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
