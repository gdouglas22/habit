import { useState } from "react";
import { ACCENT } from "../theme";
import { useStore, newId } from "../store/store";
import { ACTIVITY_UNITS, ACTIVITY_EMOJIS, type ActivityType } from "../data";
import { haptic, notifySuccess } from "../telegram";
import { lookupActivity, isPlausibleActivity } from "../ai";
import { EditorShell, fieldLabel, stepBtn } from "../components/EditorShell";
import { Sparkles } from "../icons";

function draft(): ActivityType {
  return { id: newId(), name: "", emoji: "🏃", unit: "мин", kcalPerUnit: 5 };
}

export function ActivityTypeEditor({
  typeId,
  onClose,
}: {
  typeId: string | null;
  onClose: () => void;
}) {
  const { state, dispatch } = useStore();
  const existing = typeId ? state.activityTypes.find((a) => a.id === typeId) : undefined;
  const [a, setA] = useState<ActivityType>(existing ?? draft());
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [source, setSource] = useState<string | null>(null);
  const set = (patch: Partial<ActivityType>) => setA((x) => ({ ...x, ...patch }));

  const fillWithAI = async () => {
    setErr(null);
    setSource(null);
    if (!state.apiKey) {
      setErr("Добавь Anthropic API-ключ в Настройках, чтобы пользоваться ИИ.");
      return;
    }
    if (!a.name.trim()) {
      setErr("Введи название активности.");
      return;
    }
    setLoading(true);
    haptic("light");
    try {
      const r = await lookupActivity(state.apiKey, a.name.trim());
      if (!isPlausibleActivity(r)) {
        setErr("ИИ не смог оценить активность. Заполни вручную.");
        return;
      }
      set({ unit: r.unit, kcalPerUnit: r.kcalPerUnit });
      setSource("Источник: ИИ (оценка)");
      notifySuccess();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Не удалось получить данные");
    } finally {
      setLoading(false);
    }
  };

  const save = () => {
    const name = a.name.trim();
    if (!name) {
      haptic("medium");
      return;
    }
    dispatch(
      existing
        ? { type: "update_activity_type", activityType: { ...a, name } }
        : { type: "add_activity_type", activityType: { ...a, name } }
    );
    notifySuccess();
    onClose();
  };

  const remove = existing
    ? () => {
        haptic("medium");
        dispatch({ type: "delete_activity_type", id: existing.id });
        onClose();
      }
    : undefined;

  return (
    <EditorShell
      title={existing ? "Активность" : "Новая активность"}
      canSave={a.name.trim().length > 0}
      onSave={save}
      onClose={onClose}
      onDelete={remove}
      deleteLabel="Удалить активность"
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
          {a.emoji}
        </div>
        <input
          value={a.name}
          onChange={(e) => set({ name: e.target.value })}
          placeholder="Название активности"
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

      <div style={{ display: "grid", gridTemplateColumns: "repeat(12,1fr)", gap: 6, marginBottom: 18 }}>
        {ACTIVITY_EMOJIS.map((e) => (
          <div
            key={e}
            onClick={() => {
              haptic("light");
              set({ emoji: e });
            }}
            style={{
              aspectRatio: "1",
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
              cursor: "pointer",
              background: "var(--card2)",
              border: `2px solid ${a.emoji === e ? "var(--accent)" : "transparent"}`,
            }}
          >
            {e}
          </div>
        ))}
      </div>

      {/* AI fill */}
      <button
        onClick={fillWithAI}
        disabled={loading}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          width: "100%",
          border: "none",
          borderRadius: 14,
          background: "linear-gradient(120deg,#F26B7A,#F2994A)",
          color: "#fff",
          fontWeight: 900,
          fontSize: 15,
          padding: 13,
          cursor: loading ? "default" : "pointer",
          opacity: loading ? 0.7 : 1,
          marginBottom: 8,
          boxShadow: "0 8px 20px -10px rgba(242,107,122,.8)",
        }}
      >
        <Sparkles size={18} color="#fff" />
        {loading ? "ИИ оценивает…" : "Оценить через ИИ"}
      </button>
      {err && (
        <div style={{ fontSize: 13, fontWeight: 700, color: "#E0556A", marginBottom: 10, lineHeight: 1.4 }}>
          {err}
        </div>
      )}
      {source && (
        <div style={{ fontSize: 12, fontWeight: 800, color: "#3F9B5E", marginBottom: 8 }}>{source}</div>
      )}
      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--hint)", marginBottom: 18, lineHeight: 1.4 }}>
        Для бесплатной базы расхода калорий нет — заполни вручную или через ИИ.
      </div>

      {/* unit */}
      <div style={fieldLabel}>Единица</div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 22 }}>
        {ACTIVITY_UNITS.map((u) => {
          const active = a.unit === u;
          return (
            <button
              key={u}
              onClick={() => set({ unit: u })}
              style={{
                border: `1px solid ${active ? ACCENT : "var(--line)"}`,
                borderRadius: 999,
                padding: "7px 14px",
                fontWeight: 800,
                fontSize: 13,
                cursor: "pointer",
                background: active ? "rgba(242,107,122,.12)" : "transparent",
                color: active ? ACCENT : "var(--text)",
              }}
            >
              {u}
            </button>
          );
        })}
      </div>

      {/* kcal per unit */}
      <div style={fieldLabel}>Расход — ккал за 1 {a.unit}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22 }}>
        <button onClick={() => set({ kcalPerUnit: Math.max(0, Math.round((a.kcalPerUnit - 1) * 10) / 10) })} style={stepBtn}>
          −
        </button>
        <input
          value={a.kcalPerUnit}
          onChange={(e) => set({ kcalPerUnit: Math.max(0, Number(e.target.value) || 0) })}
          inputMode="decimal"
          style={{
            flex: 1,
            textAlign: "center",
            border: "none",
            background: "var(--card2)",
            borderRadius: 13,
            padding: 11,
            fontSize: 22,
            fontWeight: 900,
            color: "var(--text)",
            outline: "none",
            minWidth: 0,
          }}
        />
        <button onClick={() => set({ kcalPerUnit: Math.round((a.kcalPerUnit + 1) * 10) / 10 })} style={stepBtn}>
          +
        </button>
      </div>
    </EditorShell>
  );
}
