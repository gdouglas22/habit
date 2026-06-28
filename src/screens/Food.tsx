import { useState } from "react";
import { useStore } from "../store/store";
import { foodsOn, dayNutrition, entryNutrition } from "../store/selectors";
import { MICRONUTRIENTS, dailyGoals } from "../data";
import { haptic } from "../telegram";
import { formatWeekdayFull, formatDayMonth } from "../date";
import { Header } from "../components/Header";
import { DaySelector } from "../components/DaySelector";
import { Plus, Trash, Utensils, ChevronDown } from "../icons";

function fmt(n: number): string {
  const r = Math.round(n * 10) / 10;
  return Number.isInteger(r) ? String(r) : r.toFixed(1);
}

export function Food({
  onEdit,
  onOpenBase,
}: {
  onEdit: (id: string | null) => void;
  onOpenBase: () => void;
}) {
  const { state, dispatch } = useStore();
  const date = state.selectedDate;
  const meals = foodsOn(state.foods, date);
  const day = dayNutrition(meals, state.products);
  const goals = dailyGoals(state.profile);
  const [showMicros, setShowMicros] = useState(false);
  const microsShown = MICRONUTRIENTS.filter((m) => (day.micros[m.key] ?? 0) > 0);

  return (
    <div className="screen-pad">
      <Header
        eyebrow={formatWeekdayFull(date) + ", " + formatDayMonth(date)}
        title="Питание"
        right={
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => {
                haptic("light");
                onOpenBase();
              }}
              title="База продуктов"
              style={iconBtn}
            >
              <Utensils size={20} />
            </button>
            <button
              onClick={() => {
                haptic("light");
                onEdit(null);
              }}
              title="Добавить приём пищи"
              style={{ ...iconBtn, background: "var(--accent)", border: "none", color: "#fff" }}
            >
              <Plus size={20} color="#fff" />
            </button>
          </div>
        }
      />
      <DaySelector />

      {meals.length > 0 && (
        <div
          style={{
            background: "var(--card)",
            borderRadius: 20,
            padding: 18,
            marginBottom: 18,
            boxShadow: "0 1px 2px rgba(60,40,30,.05)",
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
            <div>
              <div className="bignum" style={{ fontSize: 40, fontWeight: 900, color: "var(--text)", lineHeight: 1 }}>
                {Math.round(day.kcal)}
                {goals.kcal && (
                  <span style={{ fontSize: 20, fontWeight: 800, color: "var(--hint)" }}> / {goals.kcal}</span>
                )}
              </div>
              <div style={{ fontSize: 13, fontWeight: 800, color: "var(--hint)", marginTop: 3 }}>ккал съедено</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div className="bignum" style={{ fontSize: 24, fontWeight: 900, color: "#4A90C2", lineHeight: 1 }}>
                {Math.round(day.fluid)}
                <span style={{ fontSize: 14, fontWeight: 800, color: "var(--hint)" }}> / {goals.fluid} мл</span>
              </div>
              <div style={{ fontSize: 13, fontWeight: 800, color: "var(--hint)", marginTop: 3 }}>жидкость</div>
            </div>
          </div>

          {/* macros: набрано / норма */}
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            {[
              { l: "Белки", v: day.protein, goal: goals.protein, c: "#58B978" },
              { l: "Жиры", v: day.fat, goal: goals.fat, c: "#F2994A" },
              { l: "Углеводы", v: day.carbs, goal: goals.carbs, c: "#4A90C2" },
            ].map((m) => (
              <div key={m.l} style={{ flex: 1, background: "var(--card2)", borderRadius: 12, padding: "10px 12px" }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: "var(--hint)" }}>{m.l}</div>
                <div style={{ fontSize: 17, fontWeight: 900, color: m.c, marginTop: 2 }}>
                  {fmt(m.v)}
                  {m.goal != null && <span style={{ color: "var(--hint)", fontSize: 12 }}> / {m.goal}</span>}
                  <span style={{ color: "var(--hint)", fontSize: 12, fontWeight: 800 }}> г</span>
                </div>
              </div>
            ))}
          </div>

          {/* vitamins / minerals — collapsible, collapsed by default */}
          {microsShown.length > 0 && (
            <>
              <button
                onClick={() => {
                  haptic("light");
                  setShowMicros((v) => !v);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  padding: 0,
                  margin: "16px 0 0",
                }}
              >
                <span style={{ fontSize: 12, fontWeight: 800, color: "var(--hint)" }}>
                  Витамины и минералы · {microsShown.length}
                </span>
                <span
                  style={{
                    color: "var(--hint)",
                    display: "flex",
                    transform: showMicros ? "rotate(180deg)" : "none",
                    transition: "transform .2s",
                  }}
                >
                  <ChevronDown size={16} />
                </span>
              </button>
              {showMicros && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
                  {microsShown.map((m) => (
                    <div
                      key={m.key}
                      style={{
                        display: "inline-flex",
                        alignItems: "baseline",
                        gap: 4,
                        background: "var(--card2)",
                        borderRadius: 999,
                        padding: "5px 10px",
                        fontSize: 12,
                        fontWeight: 800,
                        color: "var(--text)",
                      }}
                    >
                      {m.label}
                      <span style={{ color: "var(--accent)" }}>{fmt(day.micros[m.key])}</span>
                      <span style={{ color: "var(--hint)", fontWeight: 700 }}>/ {m.rda}</span>
                      <span style={{ color: "var(--hint)", fontWeight: 700 }}>{m.unit}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* meals */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
        {meals.map((meal) => {
          const n = entryNutrition(meal, state.products);
          return (
            <div
              key={meal.id}
              onClick={() => onEdit(meal.id)}
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
                {meal.emoji}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 800, fontSize: 16, color: "var(--text)" }}>
                  {meal.name?.trim() || "Приём пищи"}
                </div>
                <div style={{ fontWeight: 700, fontSize: 13, color: "var(--hint)", marginTop: 2 }}>
                  {meal.items.length}{" "}
                  {meal.items.length === 1 ? "продукт" : meal.items.length < 5 ? "продукта" : "продуктов"}
                </div>
              </div>
              <div style={{ fontWeight: 900, fontSize: 15, color: "var(--text)", whiteSpace: "nowrap" }}>
                {Math.round(n.kcal)} ккал
              </div>
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  haptic("light");
                  dispatch({ type: "delete_food", id: meal.id });
                }}
                style={{ color: "var(--hint)", flex: "none", display: "flex", cursor: "pointer" }}
              >
                <Trash size={18} />
              </div>
            </div>
          );
        })}
      </div>

      {meals.length === 0 && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            padding: "44px 24px",
          }}
        >
          <div style={{ fontSize: 40, marginBottom: 14 }}>🍽️</div>
          <div style={{ fontSize: 18, fontWeight: 900, color: "var(--text)" }}>Пока нет записей</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--hint)", marginTop: 6, maxWidth: 250, lineHeight: 1.4 }}>
            Добавь приём пищи из продуктов базы — программа сама посчитает калории и витамины
          </div>
          <button
            onClick={() => {
              haptic("light");
              onEdit(null);
            }}
            style={{
              marginTop: 20,
              background: "var(--accent)",
              color: "#fff",
              border: "none",
              borderRadius: 999,
              padding: "13px 24px",
              fontWeight: 900,
              fontSize: 15,
              cursor: "pointer",
              boxShadow: "0 8px 20px -8px rgba(242,107,122,.7)",
            }}
          >
            Добавить приём пищи
          </button>
        </div>
      )}
    </div>
  );
}

const iconBtn: React.CSSProperties = {
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
};
