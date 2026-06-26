import { ACCENT } from "../theme";
import { WEEKDAYS } from "../data";
import { ChevronLeft, ChevronRight, Flame, Star } from "../icons";

// June 2026 starts on a Monday; 30 days.
const FIRST_WEEKDAY = 0; // 0 = Monday
const DAYS = 30;
const TODAY = 26;

function dayPct(n: number): number {
  if (n > TODAY) return 0;
  // deterministic pseudo-progress for the skeleton
  return [0, 0.3, 0.6, 1][n % 4];
}

export function Calendar() {
  const cells: (number | null)[] = [
    ...Array(FIRST_WEEKDAY).fill(null),
    ...Array.from({ length: DAYS }, (_, i) => i + 1),
  ];

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
        <button style={navBtn}>
          <ChevronLeft size={18} />
        </button>
        <div style={{ fontSize: 20, fontWeight: 900, color: "var(--text)" }}>Июнь 2026</div>
        <button style={navBtn}>
          <ChevronRight size={18} />
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7,1fr)",
          gap: 2,
          marginBottom: 6,
        }}
      >
        {WEEKDAYS.map((w) => (
          <div key={w} style={{ textAlign: "center", fontSize: 11, fontWeight: 800, color: "var(--hint)" }}>
            {w}
          </div>
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7,1fr)",
          gap: 5,
          marginBottom: 24,
        }}
      >
        {cells.map((n, i) => {
          if (n === null) return <div key={`b${i}`} style={{ aspectRatio: "1" }} />;
          const pct = dayPct(n);
          const r = 15;
          const c = 2 * Math.PI * r;
          const isToday = n === TODAY;
          return (
            <div
              key={n}
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
                {isToday && <circle cx="17" cy="17" r="12" fill={ACCENT} opacity="0.12" />}
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
                  color: isToday ? ACCENT : "var(--text)",
                }}
              >
                {n}
              </span>
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <StatCard icon={<Flame size={15} color="#F2994A" fill="#F2994A" stroke={1.5} />} label="Лучшая серия" value="21" unit="дней" />
        <StatCard icon={<Star size={15} color="#F2994A" fill="#F2994A" stroke={1.5} />} label="Идеальных" value="8" unit="дней" />
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
