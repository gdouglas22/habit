import { ACCENT } from "../theme";
import type { ThemeName } from "../theme";
import { haptic } from "../telegram";
import { useStore } from "../store/store";
import { Sun, Moon, Bell, Sparkles } from "../icons";

function Toggle({ on }: { on: boolean }) {
  return (
    <div
      style={{
        width: 46,
        height: 28,
        borderRadius: 999,
        background: on ? ACCENT : "var(--line)",
        position: "relative",
        transition: "background .2s",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 3,
          left: on ? 21 : 3,
          width: 22,
          height: 22,
          borderRadius: 999,
          background: "#fff",
          boxShadow: "0 1px 3px rgba(0,0,0,.2)",
          transition: "left .2s",
        }}
      />
    </div>
  );
}

export function Settings({
  theme,
  onTheme,
}: {
  theme: ThemeName;
  onTheme: (t: ThemeName) => void;
}) {
  const { state, dispatch } = useStore();

  const seg = (active: boolean): React.CSSProperties => ({
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    border: "none",
    borderRadius: 11,
    padding: "12px 0",
    fontWeight: 800,
    fontSize: 14,
    cursor: "pointer",
    background: active ? "var(--card)" : "transparent",
    color: active ? "var(--text)" : "var(--hint)",
    boxShadow: active ? "0 1px 3px rgba(0,0,0,.12)" : "none",
  });

  return (
    <div className="screen-pad">
      <div
        className="bignum"
        style={{ fontSize: 28, fontWeight: 900, color: "var(--text)", marginBottom: 20 }}
      >
        Настройки
      </div>

      <div style={label}>Оформление</div>
      <div
        style={{
          display: "flex",
          gap: 6,
          background: "var(--card2)",
          borderRadius: 14,
          padding: 4,
          marginBottom: 24,
        }}
      >
        <button
          style={seg(theme === "light")}
          onClick={() => {
            haptic("light");
            onTheme("light");
          }}
        >
          <Sun size={18} />
          Светлая
        </button>
        <button
          style={seg(theme === "dark")}
          onClick={() => {
            haptic("light");
            onTheme("dark");
          }}
        >
          <Moon size={18} />
          Тёмная
        </button>
      </div>

      <div style={label}>Уведомления</div>
      <div
        style={{
          background: "var(--card)",
          borderRadius: 18,
          overflow: "hidden",
          marginBottom: 24,
          boxShadow: "0 1px 2px rgba(60,40,30,.05)",
        }}
      >
        <Row icon={<Bell size={20} color="var(--hint)" />} title="Напоминания о привычках" border />
        <Row icon={<Sparkles size={20} color="var(--hint)" />} title="Тактильный отклик" />
      </div>

      <div style={label}>ИИ-ассистент (Anthropic)</div>
      <div
        style={{
          background: "var(--card)",
          borderRadius: 18,
          padding: "14px 16px",
          marginBottom: 10,
          boxShadow: "0 1px 2px rgba(60,40,30,.05)",
        }}
      >
        <input
          type="password"
          value={state.apiKey ?? ""}
          onChange={(e) => dispatch({ type: "set_api_key", apiKey: e.target.value })}
          placeholder="sk-ant-..."
          autoComplete="off"
          style={{
            width: "100%",
            border: "none",
            background: "var(--card2)",
            borderRadius: 12,
            padding: "12px 14px",
            fontWeight: 700,
            fontSize: 14,
            color: "var(--text)",
            outline: "none",
          }}
        />
        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--hint)", marginTop: 8, lineHeight: 1.4 }}>
          Ключ нужен, чтобы ИИ заполнял КБЖУ и витамины продуктов автоматически. Хранится только
          на устройстве.
        </div>
      </div>
      <div style={{ ...label, marginBottom: 24, fontWeight: 700, color: ACCENT }}>
        {state.apiKey ? "Ключ сохранён" : "Без ключа доступен ручной ввод"}
      </div>

      <div style={{ background: "var(--card2)", borderRadius: 16, padding: "15px 16px" }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text)", lineHeight: 1.5 }}>
          Тема подхватывается из Telegram автоматически — Mini App использует переменные{" "}
          <span style={{ color: ACCENT }}>bg_color</span>,{" "}
          <span style={{ color: ACCENT }}>text_color</span> и др.
        </div>
      </div>
    </div>
  );
}

const label: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 800,
  color: "var(--hint)",
  marginBottom: 10,
};

function Row({
  icon,
  title,
  border,
}: {
  icon: React.ReactNode;
  title: string;
  border?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "15px 16px",
        borderBottom: border ? "1px solid var(--line)" : "none",
      }}
    >
      <div style={{ color: "var(--hint)" }}>{icon}</div>
      <div style={{ flex: 1, fontSize: 15, fontWeight: 800, color: "var(--text)" }}>{title}</div>
      <Toggle on />
    </div>
  );
}
