import { useState } from "react";
import { useStore, newId } from "../store/store";
import type { ActivityRow } from "../data";
import { activityTypeById } from "../store/selectors";
import { haptic, notifySuccess } from "../telegram";
import { EditorShell, fieldLabel, stepBtn } from "../components/EditorShell";
import { Plus } from "../icons";

export function ActivityEditor({
  rowId,
  onClose,
  onCreateType,
}: {
  rowId: string | null;
  onClose: () => void;
  onCreateType: () => void;
}) {
  const { state, dispatch } = useStore();
  const existing = rowId ? state.activities.find((a) => a.id === rowId) : undefined;
  const [row, setRow] = useState<ActivityRow>(
    existing ?? { id: newId(), date: state.selectedDate, activityId: "", value: 30 }
  );
  const [q, setQ] = useState("");
  const set = (patch: Partial<ActivityRow>) => setRow((r) => ({ ...r, ...patch }));

  const type = activityTypeById(state.activityTypes, row.activityId);
  const w = state.profile.weight;
  const factor = w && w > 0 ? w / 70 : 1;
  const kcal = type ? Math.round(type.kcalPerUnit * row.value * factor) : 0;

  const save = () => {
    if (!row.activityId) {
      haptic("medium");
      return;
    }
    dispatch(existing ? { type: "update_activity", row } : { type: "add_activity", row });
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

  const filtered = state.activityTypes.filter((t) =>
    t.name.toLowerCase().includes(q.trim().toLowerCase())
  );

  return (
    <EditorShell
      title={existing ? "Активность" : "Новая активность"}
      canSave={!!row.activityId}
      onSave={save}
      onClose={onClose}
      onDelete={remove}
      deleteLabel="Удалить запись"
    >
      {!type ? (
        // --- pick an activity from the library ---
        <>
          <div style={fieldLabel}>Выбери активность из базы</div>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Поиск активности"
            style={{
              width: "100%",
              border: "none",
              background: "var(--card2)",
              borderRadius: 13,
              padding: "12px 14px",
              fontWeight: 700,
              fontSize: 15,
              color: "var(--text)",
              outline: "none",
              marginBottom: 10,
            }}
          />
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
            {filtered.map((t) => (
              <div
                key={t.id}
                onClick={() => {
                  haptic("light");
                  set({ activityId: t.id });
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  background: "var(--card)",
                  borderRadius: 12,
                  padding: "10px 12px",
                  cursor: "pointer",
                  boxShadow: "0 1px 2px rgba(60,40,30,.05)",
                }}
              >
                <div style={{ fontSize: 20 }}>{t.emoji}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: 15, color: "var(--text)" }}>{t.name}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--hint)" }}>
                    {t.kcalPerUnit} ккал / {t.unit}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => {
              haptic("light");
              onCreateType();
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
              padding: 12,
              cursor: "pointer",
            }}
          >
            <Plus size={16} />
            Создать новую активность
          </button>
        </>
      ) : (
        // --- selected activity + amount ---
        <>
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
              {type.emoji}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 19, fontWeight: 900, color: "var(--text)" }}>{type.name}</div>
              <button
                onClick={() => {
                  haptic("light");
                  set({ activityId: "" });
                }}
                style={{
                  border: "none",
                  background: "transparent",
                  color: "var(--accent)",
                  fontWeight: 800,
                  fontSize: 13,
                  padding: 0,
                  cursor: "pointer",
                }}
              >
                Сменить активность
              </button>
            </div>
          </div>

          <div style={fieldLabel}>Количество ({type.unit})</div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
            <button onClick={() => set({ value: Math.max(0, +(row.value - 1).toFixed(1)) })} style={stepBtn}>
              −
            </button>
            <input
              value={row.value}
              onChange={(e) => set({ value: Math.max(0, Number(e.target.value) || 0) })}
              inputMode="decimal"
              style={{
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
              }}
            />
            <button onClick={() => set({ value: +(row.value + 1).toFixed(1) })} style={stepBtn}>
              +
            </button>
          </div>

          {/* computed kcal */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 13,
              background: "var(--card2)",
              borderRadius: 16,
              padding: "14px 16px",
              marginBottom: 18,
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 13,
                background: "linear-gradient(135deg,#F2994A,#F26B7A)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 20,
                flex: "none",
              }}
            >
              🔥
            </div>
            <div className="bignum" style={{ fontSize: 26, fontWeight: 900, color: "var(--text)" }}>
              {kcal}
              <span style={{ fontSize: 14, fontWeight: 800, color: "var(--hint)" }}> ккал</span>
            </div>
          </div>

          <div style={fieldLabel}>Заметка</div>
          <input
            value={row.note ?? ""}
            onChange={(e) => set({ note: e.target.value })}
            placeholder="Необязательно"
            style={{
              width: "100%",
              border: "none",
              background: "var(--card2)",
              borderRadius: 13,
              fontWeight: 700,
              fontSize: 15,
              color: "var(--text)",
              padding: "13px 14px",
              outline: "none",
              marginBottom: 18,
            }}
          />
        </>
      )}
    </EditorShell>
  );
}
