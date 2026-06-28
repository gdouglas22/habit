import { useState, useEffect } from "react";
import { useStore } from "../store/store";
import { haptic, showBackButton, hideBackButton } from "../telegram";
import { fmtNum } from "../num";
import { ChevronLeft, Plus, Trash } from "../icons";

export function ActivityTypes({
  onClose,
  onEdit,
}: {
  onClose: () => void;
  onEdit: (id: string | null) => void;
}) {
  const { state, dispatch } = useStore();
  const [q, setQ] = useState("");
  const items = state.activityTypes.filter((a) =>
    a.name.toLowerCase().includes(q.trim().toLowerCase())
  );

  useEffect(() => {
    showBackButton(onClose);
    return () => hideBackButton();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="app">
      <div className="screen noscroll" style={{ padding: "14px 16px 40px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <button onClick={onClose} style={backBtn}>
            <ChevronLeft size={18} />
          </button>
          <div style={{ fontSize: 19, fontWeight: 900, color: "var(--text)", flex: 1 }}>
            База активностей
          </div>
          <button
            onClick={() => {
              haptic("light");
              onEdit(null);
            }}
            style={{
              width: 36,
              height: 36,
              border: "none",
              borderRadius: 999,
              background: "var(--accent)",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <Plus size={18} color="#fff" />
          </button>
        </div>

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
            marginBottom: 16,
          }}
        />

        {items.length === 0 && (
          <div
            style={{
              textAlign: "center",
              color: "var(--hint)",
              fontSize: 14,
              fontWeight: 700,
              padding: "40px 20px",
              lineHeight: 1.5,
            }}
          >
            {state.activityTypes.length === 0
              ? "Пока пусто. Добавь активность — вручную или через ИИ."
              : "Ничего не найдено"}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {items.map((a) => (
            <div key={a.id} onClick={() => onEdit(a.id)} style={card}>
              <div style={iconBox}>{a.emoji}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 800, fontSize: 16, color: "var(--text)" }}>{a.name}</div>
                <div style={{ fontWeight: 700, fontSize: 13, color: "var(--hint)", marginTop: 2 }}>
                  {fmtNum(a.kcalPerUnit)} ккал / {a.unit}
                </div>
              </div>
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  haptic("light");
                  dispatch({ type: "delete_activity_type", id: a.id });
                }}
                style={{ color: "var(--hint)", flex: "none", display: "flex", cursor: "pointer" }}
              >
                <Trash size={18} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const backBtn: React.CSSProperties = {
  width: 36,
  height: 36,
  border: "none",
  borderRadius: 12,
  background: "var(--card2)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  color: "var(--text)",
};

const card: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 13,
  background: "var(--card)",
  borderRadius: 18,
  padding: "13px 15px",
  boxShadow: "0 1px 2px rgba(60,40,30,.05)",
  cursor: "pointer",
};

const iconBox: React.CSSProperties = {
  width: 44,
  height: 44,
  borderRadius: 13,
  background: "var(--card2)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 23,
  flex: "none",
};
