import { useState } from "react";
import { ACCENT } from "../theme";
import { useStore } from "../store/store";
import { dayProgress, scheduledHabits, isDoneOn, streakOn } from "../store/selectors";
import { haptic } from "../telegram";
import {
  RU_WEEKDAYS_SHORT,
  monthGrid,
  monthLabel,
  dayOfMonth,
  todayISO,
  fromISO,
} from "../date";
import { ChevronLeft, ChevronRight, Flame, Star } from "../icons";

export function Calendar({ onPick }: { onPick: () => void }) {
  const { state, dispatch } = useStore();
  const today = todayISO();
  const init = fromISO(state.selectedDate);
  const [year, setYear] = useState(init.getFullYear());
  const [month, setMonth] = useState(init.getMonth());

  const cells = monthGrid(year, month);

  const step = (delta: number) => {
    haptic("light");
    let m = month + delta;
    let y = year;
    if (m < 0) {
      m = 11;
      y--;
    } else if (m > 11) {
      m = 0;
      y++;
    }
    setMonth(m);
    setYear(y);
  };

  const pick = (iso: string) => {
    haptic("light");
    dispatch({ type: "select_date", date: iso });
    onPick();
  };

  // Stats
  const bestStreak = Math.max(
    0,
    ...state.habits.map((h) => streakOn(state.entries, h, today))
  );
  const perfectDays = cells.filter((iso) => {
    if (!iso || iso > today) return false;
    const due = scheduledHabits(state.habits, iso);
    return due.length > 0 && due.every((h) => isDoneOn(state.entries, h, iso));
  }).length;

  return (
    <div className="screen-pad">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <button style={navBtn} onClick={() => step(-1)}>
          <ChevronLeft size={18} />
        </button>
        <div style={{ fontSize: 20, fontWeight: 900, color: "var(--text)" }}>
          {monthLabel(year, month)}
        </div>
        <button style={navBtn} onClick={() => step(1)}>
          <ChevronRight size={18} />
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2, marginBottom: 6 }}>
        {RU_WEEKDAYS_SHORT.map((w) => (
          <div key={w} style={{ textAlign: "center", fontSize: 11, fontWeight: 800, color: "var(--hint)" }}>
            {w}
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 5, marginBottom: 24 }}>
        {cells.map((iso, i) => {
          if (iso === null) return <div key={`b${i}`} style={{ aspectRatio: "1" }} />;
          const pct = dayProgress(state.habits, state.entries, iso);
          const r = 15;
          const c = 2 * Math.PI * r;
          const isToday = iso === today;
          const selected = iso === state.selectedDate;
          return (
            <div
              key={iso}
              onClick={() => pick(iso)}
              style={{
                aspectRatio: "1",
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <svg width="34" height="34" viewBox="0 0 34 34" style={{ position: "absolute" }}>
                <circle cx="17" cy="17" r={r} fill="none" stroke="var(--card2)" strokeWidth="2.5" />
                {pct > 0 && (
                  <circle
                    cx="17"
                    cy="17"
                    r={r}
                    fill="none"
                    stroke={ACCENT}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeDasharray={c}
                    strokeDashoffset={c * (1 - pct)}
                    transform="rotate(-90 17 17)"
                  />
                )}
                {(isToday || selected) && <circle cx="17" cy="17" r="12" fill={ACCENT} opacity="0.12" />}
              </svg>
              <span
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 13,
                  fontWeight: 800,
                  color: isToday || selected ? ACCENT : "var(--text)",
                }}
              >
                {dayOfMonth(iso)}
              </span>
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <StatCard
          icon={<Flame size={15} color="#F2994A" fill="#F2994A" stroke={1.5} />}
          label="Лучшая серия"
          value={String(bestStreak)}
          unit="дней"
        />
        <StatCard
          icon={<Star size={15} color="#F2994A" fill="#F2994A" stroke={1.5} />}
          label="Идеальных"
          value={String(perfectDays)}
          unit="дней"
        />
      </div>
    </div>
  );
}

const navBtn: React.CSSProperties = {
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

function StatCard({
  icon,
  label,
  value,
  unit,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit: string;
}) {
  return (
    <div
      style={{
        flex: 1,
        background: "var(--card)",
        borderRadius: 18,
        padding: 16,
        boxShadow: "0 1px 2px rgba(60,40,30,.05)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          color: "var(--hint)",
          fontSize: 12,
          fontWeight: 800,
        }}
      >
        {icon}
        {label}
      </div>
      <div
        className="bignum"
        style={{ fontSize: 30, fontWeight: 900, color: "var(--text)", marginTop: 6, lineHeight: 1 }}
      >
        {value}
        <span style={{ fontSize: 15, fontWeight: 800, color: "var(--hint)" }}> {unit}</span>
      </div>
    </div>
  );
}
