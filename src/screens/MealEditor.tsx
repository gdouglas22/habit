import { useState } from "react";
import { useStore, newId } from "../store/store";
import { FOOD_EMOJIS, type FoodEntry } from "../data";
import { entryNutrition, productById } from "../store/selectors";
import { haptic, notifySuccess } from "../telegram";
import { EditorShell, fieldLabel } from "../components/EditorShell";
import { Plus, Trash } from "../icons";

function draft(date: string): FoodEntry {
  return { id: newId(), date, emoji: "🍽️", name: "", items: [] };
}

export function MealEditor({
  entryId,
  onClose,
  onCreateProduct,
}: {
  entryId: string | null;
  onClose: () => void;
  onCreateProduct: () => void;
}) {
  const { state, dispatch } = useStore();
  const existing = entryId ? state.foods.find((f) => f.id === entryId) : undefined;
  const [entry, setEntry] = useState<FoodEntry>(existing ?? draft(state.selectedDate));
  const [picking, setPicking] = useState(false);
  const [q, setQ] = useState("");
  const set = (patch: Partial<FoodEntry>) => setEntry((e) => ({ ...e, ...patch }));

  const total = entryNutrition(entry, state.products);

  const addItem = (productId: string) => {
    haptic("light");
    set({ items: [...entry.items, { productId, grams: 100 }] });
    setPicking(false);
    setQ("");
  };
  const setGrams = (i: number, grams: number) =>
    set({ items: entry.items.map((it, idx) => (idx === i ? { ...it, grams: Math.max(0, grams) } : it)) });
  const removeItem = (i: number) => set({ items: entry.items.filter((_, idx) => idx !== i) });

  const save = () => {
    if (entry.items.length === 0) {
      haptic("medium");
      return;
    }
    dispatch(existing ? { type: "update_food", row: entry } : { type: "add_food", row: entry });
    notifySuccess();
    onClose();
  };

  const remove = existing
    ? () => {
        haptic("medium");
        dispatch({ type: "delete_food", id: existing.id });
        onClose();
      }
    : undefined;

  const filtered = state.products.filter((p) =>
    p.name.toLowerCase().includes(q.trim().toLowerCase())
  );

  return (
    <EditorShell
      title={existing ? "Приём пищи" : "Новый приём пищи"}
      canSave={entry.items.length > 0}
      onSave={save}
      onClose={onClose}
      onDelete={remove}
      deleteLabel="Удалить приём пищи"
    >
      {/* emoji + name */}
      <div style={{ display: "flex", alignItems: "center", gap: 13, marginBottom: 14 }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            background: "var(--card2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 30,
            flex: "none",
          }}
        >
          {entry.emoji}
        </div>
        <input
          value={entry.name ?? ""}
          onChange={(e) => set({ name: e.target.value })}
          placeholder="Например: Обед"
          style={{
            flex: 1,
            minWidth: 0,
            border: "none",
            borderBottom: "2px solid var(--line)",
            background: "transparent",
            fontWeight: 800,
            fontSize: 18,
            color: "var(--text)",
            padding: "8px 2px",
            outline: "none",
          }}
        />
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {FOOD_EMOJIS.map((e) => (
          <div
            key={e}
            onClick={() => {
              haptic("light");
              set({ emoji: e });
            }}
            style={{
              flex: 1,
              aspectRatio: "1",
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
              cursor: "pointer",
              background: "var(--card2)",
              border: `2px solid ${entry.emoji === e ? "var(--accent)" : "transparent"}`,
            }}
          >
            {e}
          </div>
        ))}
      </div>

      {/* total summary */}
      <div
        style={{
          background: "var(--card)",
          borderRadius: 16,
          padding: "14px 16px",
          marginBottom: 18,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 1px 2px rgba(60,40,30,.05)",
        }}
      >
        <div className="bignum" style={{ fontSize: 28, fontWeight: 900, color: "var(--text)" }}>
          {Math.round(total.kcal)}
          <span style={{ fontSize: 14, fontWeight: 800, color: "var(--hint)" }}> ккал</span>
        </div>
        <div style={{ fontSize: 13, fontWeight: 800, color: "var(--hint)" }}>
          Б {Math.round(total.protein)} · Ж {Math.round(total.fat)} · У {Math.round(total.carbs)}
        </div>
      </div>

      {/* items */}
      <div style={fieldLabel}>Продукты</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
        {entry.items.map((it, i) => {
          const p = productById(state.products, it.productId);
          const kcal = p ? Math.round((p.kcal * it.grams) / 100) : 0;
          return (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                background: "var(--card)",
                borderRadius: 14,
                padding: "10px 12px",
                boxShadow: "0 1px 2px rgba(60,40,30,.05)",
              }}
            >
              <div style={{ fontSize: 22, flex: "none" }}>{p?.emoji ?? "❓"}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 800, fontSize: 15, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {p?.name ?? "Удалённый продукт"}
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--hint)" }}>{kcal} ккал</div>
              </div>
              <input
                value={it.grams}
                onChange={(e) => setGrams(i, Number(e.target.value) || 0)}
                inputMode="numeric"
                style={{
                  width: 58,
                  textAlign: "center",
                  border: "none",
                  background: "var(--card2)",
                  borderRadius: 10,
                  padding: "8px 4px",
                  fontSize: 15,
                  fontWeight: 800,
                  color: "var(--text)",
                  outline: "none",
                }}
              />
              <span style={{ fontSize: 12, fontWeight: 800, color: "var(--hint)" }}>г</span>
              <div
                onClick={() => removeItem(i)}
                style={{ color: "var(--hint)", flex: "none", display: "flex", cursor: "pointer" }}
              >
                <Trash size={16} />
              </div>
            </div>
          );
        })}
      </div>

      {/* picker toggle */}
      {!picking && (
        <button
          onClick={() => {
            haptic("light");
            setPicking(true);
          }}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 7,
            width: "100%",
            border: "2px dashed var(--line)",
            borderRadius: 14,
            background: "transparent",
            color: "var(--text)",
            fontWeight: 800,
            fontSize: 15,
            padding: 13,
            cursor: "pointer",
            marginBottom: 18,
          }}
        >
          <Plus size={18} />
          Добавить продукт
        </button>
      )}

      {picking && (
        <div style={{ marginBottom: 18 }}>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Поиск в базе"
            autoFocus
            style={{
              width: "100%",
              border: "none",
              background: "var(--card2)",
              borderRadius: 12,
              padding: "11px 14px",
              fontWeight: 700,
              fontSize: 15,
              color: "var(--text)",
              outline: "none",
              marginBottom: 8,
            }}
          />
          <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 260, overflowY: "auto" }} className="noscroll">
            {filtered.map((p) => (
              <div
                key={p.id}
                onClick={() => addItem(p.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  background: "var(--card)",
                  borderRadius: 12,
                  padding: "9px 12px",
                  cursor: "pointer",
                  boxShadow: "0 1px 2px rgba(60,40,30,.05)",
                }}
              >
                <div style={{ fontSize: 20 }}>{p.emoji}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: 14, color: "var(--text)" }}>{p.name}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--hint)" }}>
                    {Math.round(p.kcal)} ккал / 100 г
                  </div>
                </div>
                <Plus size={16} color="var(--accent)" />
              </div>
            ))}
          </div>
          <button
            onClick={() => {
              haptic("light");
              onCreateProduct();
            }}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 7,
              width: "100%",
              border: "none",
              borderRadius: 12,
              background: "var(--card2)",
              color: "var(--text)",
              fontWeight: 800,
              fontSize: 14,
              padding: 11,
              cursor: "pointer",
              marginTop: 8,
            }}
          >
            <Plus size={16} />
            Создать новый продукт
          </button>
        </div>
      )}
    </EditorShell>
  );
}
