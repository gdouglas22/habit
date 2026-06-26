import { ACCENT } from "../theme";
import { useStore } from "../store/store";
import { dayProgress } from "../store/selectors";
import { haptic } from "../telegram";
import { RU_WEEKDAYS_SHORT, weekDates, dayOfMonth, todayISO } from "../date";

function Ring({ pct, highlight }: { pct: number; highlight?: boolean }) {
  const r = 17;
  const c = 2 * Math.PI * r;
  return (
    <svg width="38" height="38" viewBox="0 0 38 38" style={{ position: "absolute" }}>
      <circle cx="19" cy="19" r={r} fill="none" stroke="var(--card2)" strokeWidth="3" />
      {pct > 0 && (
        <circle
          cx="19"
          cy="19"
          r={r}
          fill="none"
          stroke={ACCENT}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          transform="rotate(-90 19 19)"
        />
      )}
      {highlight && <circle cx="19" cy="19" r="14" fill={ACCENT} opacity="0.12" />}
    </svg>
  );
}

export function DaySelector() {
  const { state, dispatch } = useStore();
  const today = todayISO();
  const days = weekDates(state.selectedDate);

  return (
    <div style={{ display: "flex", gap: 4, marginBottom: 18 }}>
      {days.map((iso, i) => {
        const selected = iso === state.selectedDate;
        const isToday = iso === today;
        const pct = dayProgress(state.habits, state.entries, iso);
        return (
          <div
            key={iso}
            onClick={() => {
              haptic("light");
              dispatch({ type: "select_date", date: iso });
            }}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 7,
              cursor: "pointer",
            }}
          >
            <span style={{ fontSize: 11, fontWeight: 800, color: "var(--hint)" }}>
              {RU_WEEKDAYS_SHORT[i]}
            </span>
            <div
              style={{
                position: "relative",
                width: 38,
                height: 38,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ring pct={pct} highlight={selected || isToday} />
              <span
                style={{
                  position: "relative",
                  fontSize: 14,
                  fontWeight: 800,
                  color: selected || isToday ? ACCENT : "var(--text)",
                }}
              >
                {dayOfMonth(iso)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
