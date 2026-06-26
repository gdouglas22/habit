import { ACCENT } from "../theme";
import { WEEKDAYS } from "../data";

// Week strip with a progress ring around each day number.
const DATA = [
  { num: 22, pct: 1 },
  { num: 23, pct: 0.8 },
  { num: 24, pct: 1 },
  { num: 25, pct: 0.4 },
  { num: 26, pct: 0.6, today: true },
  { num: 27, pct: 0 },
  { num: 28, pct: 0 },
];

function Ring({ pct, today }: { pct: number; today?: boolean }) {
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
      {today && <circle cx="19" cy="19" r="14" fill={ACCENT} opacity="0.12" />}
    </svg>
  );
}

export function DaySelector() {
  return (
    <div style={{ display: "flex", gap: 4, marginBottom: 18 }}>
      {DATA.map((d, i) => (
        <div
          key={d.num}
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
            {WEEKDAYS[i]}
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
            <Ring pct={d.pct} today={d.today} />
            <span
              style={{
                position: "relative",
                fontSize: 14,
                fontWeight: 800,
                color: d.today ? ACCENT : "var(--text)",
              }}
            >
              {d.num}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
