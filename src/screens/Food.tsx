import { useStore } from "../store/store";
import { foodsOn, macroTotals } from "../store/selectors";
import { haptic } from "../telegram";
import { formatWeekdayFull, formatDayMonth } from "../date";
import { Header } from "../components/Header";
import { DaySelector } from "../components/DaySelector";
import { Plus, Trash } from "../icons";

export function Food({ onEdit }: { onEdit: (id: string | null) => void }) {
  const { state, dispatch } = useStore();
  const date = state.selectedDate;
  const rows = foodsOn(state.foods, date);
  const total = rows.reduce((s, f) => s + f.kcal, 0);
  const macros = macroTotals(rows);

  return (
    <div className="screen-pad">
      <Header
        eyebrow={formatWeekdayFull(date) + ", " + formatDayMonth(date)}
        title="Питание"
        right={
          <button
            onClick={() => {
              haptic("light");
              onEdit(null);
            }}
            title="Добавить приём пищи"
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
            marginBottom: 18,
            boxShadow: "0 1px 2px rgba(60,40,30,.05)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              marginBottom: 16,
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
                ккал за день
              </div>
            </div>
            <div style={{ fontSize: 12, fontWeight: 800, color: "var(--hint)" }}>
              {rows.length} записей
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            {macros.map((m) => (
              <div key={m.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ width: 16, fontSize: 13, fontWeight: 900, color: "var(--text)" }}>
                  {m.label}
                </span>
                <div
                  style={{
                    flex: 1,
                    height: 8,
                    borderRadius: 999,
                    background: "var(--card2)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: m.pct,
                      background: m.color,
                      borderRadius: 999,
                      transition: "width .5s ease",
                    }}
                  />
                </div>
                <span
                  style={{
                    width: 46,
                    textAlign: "right",
                    fontSize: 12,
                    fontWeight: 800,
                    color: "var(--hint)",
                  }}
                >
                  {m.grams} г
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
        {rows.map((f) => (
          <div
            key={f.id}
            onClick={() => onEdit(f.id)}
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
              {f.emoji}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: 16, color: "var(--text)", lineHeight: 1.15 }}>
                {f.name}
              </div>
              {f.note && (
                <div style={{ fontWeight: 700, fontSize: 13, color: "var(--hint)", marginTop: 2 }}>
                  {f.note}
                </div>
              )}
            </div>
            <div style={{ fontWeight: 900, fontSize: 15, color: "var(--text)", whiteSpace: "nowrap" }}>
              {f.kcal} ккал
            </div>
            <div
              onClick={(e) => {
                e.stopPropagation();
                haptic("light");
                dispatch({ type: "delete_food", id: f.id });
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
        Добавить приём пищи
      </button>
    </div>
  );
}
