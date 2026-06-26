import { ACCENT_GRADIENT } from "../theme";
import { useStore } from "../store/store";
import { haptic } from "../telegram";
import { Header } from "../components/Header";
import { DaySelector } from "../components/DaySelector";
import { Flame, Plus, Trash } from "../icons";

const SEGMENTS = [
  { pct: "45%", color: "#F2994A" },
  { pct: "30%", color: "#F26B7A" },
  { pct: "15%", color: "#58B978" },
];

export function Activity() {
  const { state, dispatch } = useStore();
  const activities = state.activities;
  const total = activities.reduce((s, a) => s + a.kcal, 0);
  return (
    <div className="screen-pad">
      <Header
        eyebrow="пятница, 26 июня"
        title="Активность"
        right={
          <button
            title="База упражнений"
            style={{
              width: 40,
              height: 40,
              border: "1px solid var(--line)",
              borderRadius: 12,
              background: "var(--card)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "var(--text)",
            }}
          >
            <Flame size={20} />
          </button>
        }
      />
      <DaySelector />

      <div
        style={{
          background: "var(--card)",
          borderRadius: 20,
          padding: 18,
          marginBottom: 16,
          boxShadow: "0 1px 2px rgba(60,40,30,.05)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 14,
          }}
        >
          <div>
            <div
              className="bignum"
              style={{ fontSize: 40, fontWeight: 900, color: "var(--text)", lineHeight: 1 }}
            >
              {total}
            </div>
            <div style={{ fontSize: 13, fontWeight: 800, color: "var(--hint)", marginTop: 3 }}>
              ккал потрачено · {activities.length} активности
            </div>
          </div>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 999,
              background: ACCENT_GRADIENT,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flex: "none",
              boxShadow: "0 8px 20px -8px rgba(242,153,74,.7)",
            }}
          >
            <Flame size={26} color="#fff" fill="#fff" stroke={1.5} />
          </div>
        </div>
        <div
          style={{
            display: "flex",
            height: 10,
            borderRadius: 999,
            overflow: "hidden",
            background: "var(--card2)",
            gap: 2,
          }}
        >
          {SEGMENTS.map((g, i) => (
            <div key={i} style={{ height: "100%", width: g.pct, background: g.color }} />
          ))}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
        {activities.map((a) => (
          <div
            key={a.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 13,
              background: "var(--card)",
              borderRadius: 18,
              padding: "13px 15px",
              boxShadow: "0 1px 2px rgba(60,40,30,.05)",
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 13,
                background: "var(--card2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 23,
                flex: "none",
              }}
            >
              {a.emoji}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: 16, color: "var(--text)", lineHeight: 1.15 }}>
                {a.name}
              </div>
              {a.note && (
                <div style={{ fontWeight: 700, fontSize: 13, color: "var(--hint)", marginTop: 2 }}>
                  {a.note}
                </div>
              )}
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
                gap: 5,
                flex: "none",
              }}
            >
              <div style={{ fontWeight: 900, fontSize: 15, color: "var(--text)", whiteSpace: "nowrap" }}>
                {a.value}
              </div>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 3,
                  background: "rgba(242,153,74,.16)",
                  borderRadius: 999,
                  padding: "2px 8px",
                  fontSize: 11,
                  fontWeight: 800,
                  color: "#D9531E",
                  whiteSpace: "nowrap",
                }}
              >
                <Flame size={11} color="#D9531E" fill="#D9531E" stroke={1.5} />
                {a.kcal} ккал
              </div>
            </div>
            <div
              onClick={() => {
                haptic("light");
                dispatch({ type: "delete_activity", id: a.id });
              }}
              style={{ color: "var(--hint)", flex: "none", display: "flex", cursor: "pointer" }}
            >
              <Trash size={18} />
            </div>
          </div>
        ))}
      </div>

      <button
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 7,
          width: "100%",
          border: "2px dashed var(--line)",
          borderRadius: 16,
          background: "transparent",
          color: "var(--text)",
          fontWeight: 800,
          fontSize: 15,
          padding: 14,
          cursor: "pointer",
        }}
      >
        <Plus size={18} />
        Добавить активность
      </button>
    </div>
  );
}
