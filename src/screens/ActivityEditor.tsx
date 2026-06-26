import { useState } from "react";
import { useStore, newId } from "../store/store";
import type { ActivityRow } from "../data";
import { haptic, notifySuccess } from "../telegram";
import { EditorShell, fieldLabel, stepBtn } from "../components/EditorShell";

const EMOJIS = ["🏃", "🚴", "🧘", "🏊", "🚶", "💪", "⚽", "🏋️"];
const UNITS = ["км", "мин", "шаг", "повт", "подх"];

function draft(date: string): ActivityRow {
  return { id: newId(), date, emoji: "🏃", name: "", value: 1, unit: "км", kcal: 100 };
}

export function ActivityEditor({
  rowId,
  onClose,
}: {
  rowId: string | null;
  onClose: () => void;
}) {
  const { state, dispatch } = useStore();
  const existing = rowId ? state.activities.find((a) => a.id === rowId) : undefined;
  const [row, setRow] = useState<ActivityRow>(existing ?? draft(state.selectedDate));
  const set = (p: Partial<ActivityRow>) => setRow((r) => ({ ...r, ...p }));

  const save = () => {
    const name = row.name.trim();
    if (!name) {
      haptic("medium");
      return;
    }
    dispatch(existing ? { type: "update_activity", row: { ...row, name } } : { type: "add_activity", row: { ...row, name } });
    notifySuccess();
    onClose();
  };

  const remove = existing
    ? () => {
        haptic("medium");
        dispatch({ type: "delete_activity", id: existing.id });
        onClose();
      }
    : undefined;

  return (
    <EditorShell
      title={existing ? "Активность" : "Новая активность"}
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
          placeholder="Название активности"
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

      {/* value + unit */}
      <div style={fieldLabel}>Значение</div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
        <button onClick={() => set({ value: Math.max(0, +(row.value - 1).toFixed(1)) })} style={stepBtn}>
          −
        </button>
        <input
          value={row.value}
          onChange={(e) => set({ value: Math.max(0, Number(e.target.value) || 0) })}
          inputMode="decimal"
          style={numberInput}
        />
        <button onClick={() => set({ value: +(row.value + 1).toFixed(1) })} style={stepBtn}>
          +
        </button>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 22 }}>
        {UNITS.map((u) => (
          <button key={u} onClick={() => set({ unit: u })} style={chip(row.unit === u)}>
            {u}
          </button>
        ))}
      </div>

      {/* kcal */}
      <div style={fieldLabel}>Расход калорий</div>
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

      {/* note */}
      <div style={fieldLabel}>Заметка</div>
      <input
        value={row.note ?? ""}
        onChange={(e) => set({ note: e.target.value })}
        placeholder="Необязательно"
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

const numberInput: React.CSSProperties = {
  flex: 1,
  textAlign: "center",
  border: "none",
  background: "var(--card2)",
  borderRadius: 13,
  padding: 11,
  fontSize: 24,
  fontWeight: 900,
  color: "var(--text)",
  outline: "none",
  minWidth: 0,
};

const chip = (active: boolean): React.CSSProperties => ({
  border: `1px solid ${active ? "var(--accent)" : "var(--line)"}`,
  borderRadius: 999,
  padding: "8px 15px",
  background: active ? "rgba(242,107,122,.12)" : "transparent",
  color: active ? "var(--accent)" : "var(--text)",
  fontWeight: 800,
  fontSize: 13,
  cursor: "pointer",
});
