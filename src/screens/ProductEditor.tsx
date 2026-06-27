import { useState } from "react";
import { useStore, newId } from "../store/store";
import { MICRONUTRIENTS, emptyMicros, type Product } from "../data";
import { haptic, notifySuccess } from "../telegram";
import { lookupNutrition } from "../ai";
import { EditorShell, fieldLabel } from "../components/EditorShell";
import { Sparkles } from "../icons";

const EMOJIS = ["🍎", "🍗", "🥦", "🍚", "🥛", "🥐", "🍫", "🥑", "🍔", "🍝", "🥚", "🐟"];

function draft(): Product {
  return {
    id: newId(),
    name: "",
    emoji: "🍎",
    kcal: 0,
    protein: 0,
    fat: 0,
    carbs: 0,
    fluid: 0,
    micros: emptyMicros(),
  };
}

const numInput: React.CSSProperties = {
  width: "100%",
  textAlign: "center",
  border: "none",
  background: "var(--card2)",
  borderRadius: 12,
  padding: "10px 4px",
  fontSize: 17,
  fontWeight: 900,
  color: "var(--text)",
  outline: "none",
};

export function ProductEditor({
  productId,
  onClose,
}: {
  productId: string | null;
  onClose: () => void;
}) {
  const { state, dispatch } = useStore();
  const existing = productId ? state.products.find((p) => p.id === productId) : undefined;
  const [p, setP] = useState<Product>(existing ?? draft());
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const set = (patch: Partial<Product>) => setP((x) => ({ ...x, ...patch }));
  const setMicro = (key: string, v: number) =>
    setP((x) => ({ ...x, micros: { ...x.micros, [key]: v } }));

  const num = (v: number) => (Number.isFinite(v) ? +v.toFixed(2).replace(/\.00$/, "") : 0);

  const fillWithAI = async () => {
    setErr(null);
    if (!state.apiKey) {
      setErr("Добавь Anthropic API-ключ в Настройках, чтобы пользоваться ИИ.");
      return;
    }
    if (!p.name.trim()) {
      setErr("Введи название продукта или блюда.");
      return;
    }
    setLoading(true);
    haptic("light");
    try {
      const r = await lookupNutrition(state.apiKey, p.name.trim());
      set({
        kcal: num(r.kcal),
        protein: num(r.protein),
        fat: num(r.fat),
        carbs: num(r.carbs),
        fluid: num(r.fluid),
        micros: { ...emptyMicros(), ...r.micros },
      });
      notifySuccess();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Не удалось получить данные");
    } finally {
      setLoading(false);
    }
  };

  const save = () => {
    const name = p.name.trim();
    if (!name) {
      haptic("medium");
      return;
    }
    dispatch(existing ? { type: "update_product", product: { ...p, name } } : { type: "add_product", product: { ...p, name } });
    notifySuccess();
    onClose();
  };

  const remove = existing
    ? () => {
        haptic("medium");
        dispatch({ type: "delete_product", id: existing.id });
        onClose();
      }
    : undefined;

  const macroField = (key: "kcal" | "protein" | "fat" | "carbs" | "fluid", label: string) => (
    <div style={{ flex: 1 }}>
      <div style={{ ...fieldLabel, marginBottom: 6 }}>{label}</div>
      <input
        value={p[key]}
        onChange={(e) => set({ [key]: Math.max(0, Number(e.target.value) || 0) } as Partial<Product>)}
        inputMode="decimal"
        style={numInput}
      />
    </div>
  );

  return (
    <EditorShell
      title={existing ? "Продукт" : "Новый продукт"}
      canSave={p.name.trim().length > 0}
      onSave={save}
      onClose={onClose}
      onDelete={remove}
      deleteLabel="Удалить продукт"
    >
      {/* emoji + name */}
      <div style={{ display: "flex", alignItems: "center", gap: 13, marginBottom: 16 }}>
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
          {p.emoji}
        </div>
        <input
          value={p.name}
          onChange={(e) => set({ name: e.target.value })}
          placeholder="Название (продукт или блюдо)"
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
        {EMOJIS.map((e) => (
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
              border: `2px solid ${p.emoji === e ? "var(--accent)" : "transparent"}`,
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
        {loading ? "ИИ ищет данные…" : "Заполнить через ИИ"}
      </button>
      {err && (
        <div style={{ fontSize: 13, fontWeight: 700, color: "#E0556A", marginBottom: 12, lineHeight: 1.4 }}>
          {err}
        </div>
      )}
      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--hint)", marginBottom: 18, lineHeight: 1.4 }}>
        Значения на 100 г. Заполни вручную или через ИИ.
      </div>

      {/* macros */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        {macroField("kcal", "Ккал")}
        {macroField("protein", "Белки")}
        {macroField("fat", "Жиры")}
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 22 }}>
        {macroField("carbs", "Углев.")}
        {macroField("fluid", "Жидк., мл")}
        <div style={{ flex: 1 }} />
      </div>

      {/* micros */}
      <div style={fieldLabel}>Витамины и минералы (на 100 г)</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 8 }}>
        {MICRONUTRIENTS.map((m) => (
          <div
            key={m.key}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "var(--card)",
              borderRadius: 12,
              padding: "8px 10px",
              boxShadow: "0 1px 2px rgba(60,40,30,.05)",
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {m.label}
              </div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "var(--hint)" }}>{m.unit}</div>
            </div>
            <input
              value={p.micros[m.key] ?? 0}
              onChange={(e) => setMicro(m.key, Math.max(0, Number(e.target.value) || 0))}
              inputMode="decimal"
              style={{
                width: 56,
                textAlign: "center",
                border: "none",
                background: "var(--card2)",
                borderRadius: 9,
                padding: "8px 4px",
                fontSize: 14,
                fontWeight: 800,
                color: "var(--text)",
                outline: "none",
              }}
            />
          </div>
        ))}
      </div>
      <div style={{ height: 8 }} />
    </EditorShell>
  );
}
