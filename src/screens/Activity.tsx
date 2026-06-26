import { ACCENT_GRADIENT } from "../theme";
import { useStore } from "../store/store";
import { activitiesOn } from "../store/selectors";
import { haptic } from "../telegram";
import { formatWeekdayFull, formatDayMonth } from "../date";
import { Header } from "../components/Header";
import { DaySelector } from "../components/DaySelector";
import { Flame, Plus, Trash } from "../icons";

export function Activity({ onEdit }: { onEdit: (id: string | null) => void }) {
  const { state, dispatch } = useStore();
  const date = state.selectedDate;
  const rows = activitiesOn(state.activities, date);
  const total = rows.reduce((s, a) => s + a.kcal, 0);
  const maxKcal = Math.max(1, ...rows.map((a) => a.kcal));

  return (
    <div className="screen-pad">
      <Header
        eyebrow={formatWeekdayFull(date) + ", " + formatDayMonth(date)}
        title="Активность"
        right={
          <button
            onClick={() => {
              haptic("light");
              onEdit(null);
            }}
            title="Добавить активность"
            style={{
              width: 40,
              height: 40,
              border: "none",
              borderRadius: 999,
              background: "var(--accent)",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              boxShadow: "0 6px 16px -6px rgba(242,107,122,.8)",
            }}
          >
            <Plus size={20} color="#fff" />
          </button>
        }
      />
      <DaySelector />

      {rows.length > 0 && (
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
                ккал потрачено · {rows.length}{" "}
                {rows.length === 1 ? "активность" : "активности"}
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
            {rows.map((a) => (
              <div
                key={a.id}
                style={{
                  height: "100%",
                  width: `${(a.kcal / total) * 100}%`,
                  background: ACCENT_GRADIENT,
                  opacity: 0.5 + 0.5 * (a.kcal / maxKcal),
                }}
              />
            ))}
          </div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
        {rows.map((a) => (
          <div
            key={a.id}
            onClick={() => onEdit(a.id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 13,
              background: "var(--card)",
              borderRadius: 18,
              padding: "13px 15px",
              boxShadow: "0 1px 2px rgba(60,40,30,.05)",
              cursor: "pointer",
              WebkitTapHighlightColor: "transparent",
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
                {a.value} {a.unit}
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
              onClick={(e) => {
                e.stopPropagation();
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
        onClick={() => {
          haptic("light");
          onEdit(null);
        }}
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
