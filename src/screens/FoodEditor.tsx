import { useState } from "react";
import { useStore, newId } from "../store/store";
import type { FoodRow } from "../data";
import { haptic, notifySuccess } from "../telegram";
import { EditorShell, fieldLabel, stepBtn } from "../components/EditorShell";

const EMOJIS = ["🥗", "🍎", "🍳", "🍗", "🍚", "🥑", "🍌", "🥤"];

function draft(date: string): FoodRow {
  return { id: newId(), date, emoji: "🥗", name: "", kcal: 200, protein: 0, fat: 0, carbs: 0 };
}

export function FoodEditor({
  rowId,
  onClose,
}: {
  rowId: string | null;
  onClose: () => void;
}) {
  const { state, dispatch } = useStore();
  const existing = rowId ? state.foods.find((f) => f.id === rowId) : undefined;
  const [row, setRow] = useState<FoodRow>(existing ?? draft(state.selectedDate));
  const set = (p: Partial<FoodRow>) => setRow((r) => ({ ...r, ...p }));

  const save = () => {
    const name = row.name.trim();
    if (!name) {
      haptic("medium");
      return;
    }
    dispatch(existing ? { type: "update_food", row: { ...row, name } } : { type: "add_food", row: { ...row, name } });
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

  const macro = (key: "protein" | "fat" | "carbs", label: string) => (
    <div style={{ flex: 1 }}>
      <div style={{ ...fieldLabel, marginBottom: 6 }}>{label}</div>
      <input
        value={row[key]}
        onChange={(e) => set({ [key]: Math.max(0, Number(e.target.value) || 0) } as Partial<FoodRow>)}
        inputMode="numeric"
        style={macroInput}
      />
    </div>
  );

  return (
    <EditorShell
      title={existing ? "Приём пищи" : "Новый приём пищи"}
      canSave={row.name.trim().length > 0}
      onSave={save}
      onClose={onClose}
      onDelete={remove}
      deleteLabel="Удалить запись"
    >
      {/* emoji + name */}
      <div style={{ display: "flex", alignItems: "center", gap: 13, marginBottom: 20 }}>
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
          {row.emoji}
        </div>
        <input
          value={row.name}
          onChange={(e) => set({ name: e.target.value })}
          placeholder="Название блюда"
          style={inputUnderline}
        />
      </div>

      {/* emoji picker */}
      <div style={fieldLabel}>Иконка</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(8,1fr)", gap: 8, marginBottom: 22 }}>
        {EMOJIS.map((e) => (
          <div
            key={e}
            onClick={() => {
              haptic("light");
              set({ emoji: e });
            }}
            style={{
              aspectRatio: "1",
              borderRadius: 13,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
              cursor: "pointer",
              background: "var(--card2)",
              border: `2px solid ${row.emoji === e ? "var(--accent)" : "transparent"}`,
            }}
          >
            {e}
          </div>
        ))}
      </div>

      {/* kcal */}
      <div style={fieldLabel}>Калории</div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22 }}>
        <button onClick={() => set({ kcal: Math.max(0, row.kcal - 10) })} style={stepBtn}>
          −
        </button>
        <div
          className="bignum"
          style={{ flex: 1, textAlign: "center", fontSize: 24, fontWeight: 900, color: "var(--text)" }}
        >
          {row.kcal}
          <span style={{ fontSize: 14, fontWeight: 800, color: "var(--hint)" }}> ккал</span>
        </div>
        <button onClick={() => set({ kcal: row.kcal + 10 })} style={stepBtn}>
          +
        </button>
      </div>

      {/* macros */}
      <div style={fieldLabel}>Белки · Жиры · Углеводы (г)</div>
      <div style={{ display: "flex", gap: 10, marginBottom: 22 }}>
        {macro("protein", "Белки")}
        {macro("fat", "Жиры")}
        {macro("carbs", "Углеводы")}
      </div>

      {/* note */}
      <div style={fieldLabel}>Заметка</div>
      <input
        value={row.note ?? ""}
        onChange={(e) => set({ note: e.target.value })}
        placeholder="Например: завтрак"
        style={{ ...inputFilled, marginBottom: 18 }}
      />
    </EditorShell>
  );
}

const inputUnderline: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
  border: "none",
  borderBottom: "2px solid var(--line)",
  background: "transparent",
  fontWeight: 800,
  fontSize: 19,
  color: "var(--text)",
  padding: "8px 2px",
  outline: "none",
};

const inputFilled: React.CSSProperties = {
  border: "none",
  background: "var(--card2)",
  borderRadius: 13,
  fontWeight: 700,
  fontSize: 15,
  color: "var(--text)",
  padding: "13px 14px",
  outline: "none",
};

const macroInput: React.CSSProperties = {
  width: "100%",
  textAlign: "center",
  border: "none",
  background: "var(--card2)",
  borderRadius: 13,
  padding: "12px 6px",
  fontSize: 20,
  fontWeight: 900,
  color: "var(--text)",
  outline: "none",
};
