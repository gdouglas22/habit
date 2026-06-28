import { useState } from "react";
import { ACCENT, ACCENT2, BREAK } from "../theme";
import { useStore } from "../store/store";
import {
  dayProgress,
  isPerfectDay,
  isBreak,
  streakOn,
  foodKcalOn,
  activityKcalOn,
  calorieCloseness,
} from "../store/selectors";
import { computeTargets } from "../data";
import { haptic } from "../telegram";
import { RU_WEEKDAYS_SHORT, monthGrid, monthLabel, dayOfMonth, todayISO, fromISO } from "../date";
import { ChevronLeft, ChevronRight, Flame, Star, CheckSquare, Dumbbell, Utensils } from "../icons";

type Cat = "habits" | "activity" | "food";
const ACTIVITY_DAY_TARGET = 300; // kcal — soft scale for the ring fill

// pastel red → amber → green by closeness (0..1)
function lerp(a: number, b: number, t: number) {
  return Math.round(a + (b - a) * t);
}
function mix(c1: number[], c2: number[], t: number) {
  return `rgb(${lerp(c1[0], c2[0], t)},${lerp(c1[1], c2[1], t)},${lerp(c1[2], c2[2], t)})`;
}
const RED = [242, 184, 181];
const AMBER = [244, 226, 166];
const GREEN = [183, 228, 199];
function foodColor(closeness: number) {
  return closeness < 0.5 ? mix(RED, AMBER, closeness / 0.5) : mix(AMBER, GREEN, (closeness - 0.5) / 0.5);
}

export function Calendar({ onPick }: { onPick: () => void }) {
  const { state, dispatch } = useStore();
  const today = todayISO();
  const init = fromISO(state.selectedDate);
  const [year, setYear] = useState(init.getFullYear());
  const [month, setMonth] = useState(init.getMonth());
  const [cat, setCat] = useState<Cat>("habits");

  const cells = monthGrid(year, month);
  const weight = state.profile.weight;
  const calTarget = computeTargets(state.profile)?.target ?? 0;

  const step = (delta: number) => {
    haptic("light");
    let m = month + delta;
    let y = year;
    if (m < 0) { m = 11; y--; } else if (m > 11) { m = 0; y++; }
    setMonth(m);
    setYear(y);
  };

  const pick = (iso: string) => {
    haptic("light");
    dispatch({ type: "select_date", date: iso });
    onPick();
  };

  const monthDays = cells.filter((c): c is string => c !== null && c <= today);

  // ---- stats per category ----
  let statA: { icon: React.ReactNode; label: string; value: string; unit: string };
  let statB: { icon: React.ReactNode; label: string; value: string; unit: string };
  if (cat === "habits") {
    const best = Math.max(0, ...state.habits.map((h) => streakOn(state.entries, h, today, state.breaks)));
    const perfect = monthDays.filter((iso) =>
      isPerfectDay(state.habits, state.entries, state.breaks, iso)
    ).length;
    statA = { icon: <Flame size={15} color={ACCENT2} fill={ACCENT2} stroke={1.5} />, label: "Лучшая серия", value: String(best), unit: "дней" };
    statB = { icon: <Star size={15} color={ACCENT2} fill={ACCENT2} stroke={1.5} />, label: "Идеальных", value: String(perfect), unit: "дней" };
  } else if (cat === "activity") {
    const kcals = monthDays.map((iso) => activityKcalOn(state.activities, state.activityTypes, iso, weight));
    const active = kcals.filter((k) => k > 0).length;
    const total = Math.round(kcals.reduce((s, k) => s + k, 0));
    statA = { icon: <Dumbbell size={15} color={ACCENT2} />, label: "Активных", value: String(active), unit: "дней" };
    statB = { icon: <Flame size={15} color={ACCENT2} fill={ACCENT2} stroke={1.5} />, label: "Сожжено", value: String(total), unit: "ккал" };
  } else {
    const withFood = monthDays.map((iso) => foodKcalOn(state.foods, state.products, iso)).filter((k) => k > 0);
    const inNorm = withFood.filter((k) => calorieCloseness(k, calTarget) >= 0.85).length;
    const avg = withFood.length ? Math.round(withFood.reduce((s, k) => s + k, 0) / withFood.length) : 0;
    statA = { icon: <Utensils size={15} color={ACCENT2} />, label: "Дней в норме", value: String(inNorm), unit: "дней" };
    statB = { icon: <Flame size={15} color={ACCENT2} fill={ACCENT2} stroke={1.5} />, label: "В среднем", value: String(avg), unit: "ккал" };
  }

  return (
    <div className="screen-pad">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <button style={navBtn} onClick={() => step(-1)}>
          <ChevronLeft size={18} />
        </button>
        <div style={{ fontSize: 20, fontWeight: 900, color: "var(--text)" }}>{monthLabel(year, month)}</div>
        <button style={navBtn} onClick={() => step(1)}>
          <ChevronRight size={18} />
        </button>
      </div>

      {/* category tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        {([
          { key: "habits", label: "Привычки", Icon: CheckSquare },
          { key: "activity", label: "Активность", Icon: Dumbbell },
          { key: "food", label: "Питание", Icon: Utensils },
        ] as const).map(({ key, label, Icon }) => {
          const active = cat === key;
          return (
            <button
              key={key}
              onClick={() => { haptic("light"); setCat(key); }}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 5,
                border: "none",
                borderRadius: 11,
                padding: "9px 0",
                fontWeight: 800,
                fontSize: 13,
                cursor: "pointer",
                background: active ? ACCENT : "var(--card2)",
                color: active ? "#fff" : "var(--hint)",
              }}
            >
              <Icon size={15} color={active ? "#fff" : undefined} />
              {label}
            </button>
          );
        })}
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
          const isToday = iso === today;
          const selected = iso === state.selectedDate;
          const future = iso > today;
          return (
            <DayCell
              key={iso}
              day={dayOfMonth(iso)}
              isToday={isToday}
              selected={selected}
              future={future}
              onClick={() => pick(iso)}
              {...cellProps(cat, iso, state, weight, calTarget)}
            />
          );
        })}
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <StatCard {...statA} />
        <StatCard {...statB} />
      </div>
    </div>
  );
}

// Per-category visual props for a day.
function cellProps(
  cat: Cat,
  iso: string,
  state: ReturnType<typeof useStore>["state"],
  weight: number | undefined,
  calTarget: number
): { ring?: { pct: number; color: string }; fill?: string; breakDay?: boolean } {
  if (cat === "habits") {
    if (isBreak(state.breaks, iso)) return { breakDay: true };
    return { ring: { pct: dayProgress(state.habits, state.entries, iso), color: ACCENT } };
  }
  if (cat === "activity") {
    const k = activityKcalOn(state.activities, state.activityTypes, iso, weight);
    return { ring: { pct: Math.min(1, k / ACTIVITY_DAY_TARGET), color: ACCENT2 } };
  }
  const eaten = foodKcalOn(state.foods, state.products, iso);
  return eaten > 0 ? { fill: foodColor(calorieCloseness(eaten, calTarget)) } : {};
}

function DayCell({
  day,
  isToday,
  selected,
  future,
  ring,
  fill,
  breakDay,
  onClick,
}: {
  day: number;
  isToday: boolean;
  selected: boolean;
  future: boolean;
  ring?: { pct: number; color: string };
  fill?: string;
  breakDay?: boolean;
  onClick: () => void;
}) {
  const r = 15;
  const c = 2 * Math.PI * r;
  const hi = isToday || selected;
  if (breakDay) {
    return (
      <div
        onClick={onClick}
        style={{
          aspectRatio: "1",
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          opacity: future ? 0.5 : 1,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 3,
            borderRadius: 999,
            background: "rgba(52,179,163,.16)",
            border: hi ? `2px solid ${BREAK}` : "none",
          }}
        />
        <span style={{ position: "relative", fontSize: 14 }} title="Каникулы">
          🌴
        </span>
      </div>
    );
  }
  return (
    <div
      onClick={onClick}
      style={{
        aspectRatio: "1",
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        opacity: future ? 0.5 : 1,
      }}
    >
      {fill && (
        <div
          style={{
            position: "absolute",
            inset: 3,
            borderRadius: 999,
            background: fill,
            border: hi ? `2px solid ${ACCENT}` : "none",
          }}
        />
      )}
      {ring && (
        <svg width="34" height="34" viewBox="0 0 34 34" style={{ position: "absolute" }}>
          <circle cx="17" cy="17" r={r} fill="none" stroke="var(--card2)" strokeWidth="2.5" />
          {ring.pct > 0 && (
            <circle
              cx="17"
              cy="17"
              r={r}
              fill="none"
              stroke={ring.color}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray={c}
              strokeDashoffset={c * (1 - ring.pct)}
              transform="rotate(-90 17 17)"
            />
          )}
          {hi && <circle cx="17" cy="17" r="12" fill={ACCENT} opacity="0.12" />}
        </svg>
      )}
      <span
        style={{
          position: "relative",
          fontSize: 13,
          fontWeight: 800,
          color: hi && !fill ? ACCENT : "var(--text)",
        }}
      >
        {day}
      </span>
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
    <div style={{ flex: 1, background: "var(--card)", borderRadius: 18, padding: 16, boxShadow: "0 1px 2px rgba(60,40,30,.05)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--hint)", fontSize: 12, fontWeight: 800 }}>
        {icon}
        {label}
      </div>
      <div className="bignum" style={{ fontSize: 30, fontWeight: 900, color: "var(--text)", marginTop: 6, lineHeight: 1 }}>
        {value}
        <span style={{ fontSize: 15, fontWeight: 800, color: "var(--hint)" }}> {unit}</span>
      </div>
    </div>
  );
}
