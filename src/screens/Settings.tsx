import { ACCENT } from "../theme";
import type { ThemeName } from "../theme";
import { haptic } from "../telegram";
import { useStore } from "../store/store";
import { ACTIVITY_LEVELS, GOALS, computeTargets, type Profile } from "../data";
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

      <ProfileSection />

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

// --- User profile (age / weight / height / sex / name) ------------------
function NumField({
  label: lbl,
  unit,
  value,
  onChange,
}: {
  label: string;
  unit: string;
  value: number | undefined;
  onChange: (v: number | undefined) => void;
}) {
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 12, fontWeight: 800, color: "var(--hint)", marginBottom: 6 }}>{lbl}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 4, minWidth: 0, background: "var(--card2)", borderRadius: 12, padding: "10px 10px" }}>
        <input
          value={value ?? ""}
          onChange={(e) => {
            const n = parseInt(e.target.value, 10);
            onChange(Number.isFinite(n) && n > 0 ? n : undefined);
          }}
          inputMode="numeric"
          size={1}
          placeholder="—"
          style={{
            flex: 1,
            minWidth: 0,
            width: "100%",
            border: "none",
            background: "transparent",
            fontSize: 18,
            fontWeight: 900,
            color: "var(--text)",
            outline: "none",
            textAlign: "center",
          }}
        />
        <span style={{ fontSize: 11, fontWeight: 700, color: "var(--hint)" }}>{unit}</span>
      </div>
    </div>
  );
}

function ProfileSection() {
  const { state, dispatch } = useStore();
  const p = state.profile;
  const upd = (patch: Partial<Profile>) => dispatch({ type: "update_profile", patch });
  const targets = computeTargets(p);

  const chip = (active: boolean): React.CSSProperties => ({
    border: `1px solid ${active ? ACCENT : "var(--line)"}`,
    borderRadius: 999,
    padding: "7px 13px",
    fontWeight: 800,
    fontSize: 13,
    cursor: "pointer",
    background: active ? "rgba(242,107,122,.12)" : "transparent",
    color: active ? ACCENT : "var(--text)",
  });

  return (
    <>
      <div style={label}>Данные пользователя</div>
      <div
        style={{
          background: "var(--card)",
          borderRadius: 18,
          padding: 16,
          marginBottom: 12,
          boxShadow: "0 1px 2px rgba(60,40,30,.05)",
        }}
      >
        <input
          value={p.name ?? ""}
          onChange={(e) => upd({ name: e.target.value })}
          placeholder="Имя (необязательно)"
          style={{
            width: "100%",
            border: "none",
            background: "var(--card2)",
            borderRadius: 12,
            padding: "12px 14px",
            fontWeight: 700,
            fontSize: 15,
            color: "var(--text)",
            outline: "none",
            marginBottom: 14,
          }}
        />

        <div style={{ fontSize: 12, fontWeight: 800, color: "var(--hint)", marginBottom: 8 }}>Пол</div>
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          {(["male", "female"] as const).map((s) => (
            <button
              key={s}
              onClick={() => {
                haptic("light");
                upd({ sex: s });
              }}
              style={{ ...chip(p.sex === s), flex: 1, padding: "10px 0" }}
            >
              {s === "male" ? "Мужской" : "Женский"}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          <NumField label="Возраст" unit="лет" value={p.age} onChange={(v) => upd({ age: v })} />
          <NumField label="Вес" unit="кг" value={p.weight} onChange={(v) => upd({ weight: v })} />
          <NumField label="Рост" unit="см" value={p.height} onChange={(v) => upd({ height: v })} />
        </div>

        <div style={{ fontSize: 12, fontWeight: 800, color: "var(--hint)", marginBottom: 8 }}>Уровень активности</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
          {ACTIVITY_LEVELS.map((a) => (
            <button
              key={a.key}
              onClick={() => {
                haptic("light");
                upd({ activityLevel: a.key });
              }}
              style={chip((p.activityLevel ?? "moderate") === a.key)}
            >
              {a.label}
            </button>
          ))}
        </div>

        <div style={{ fontSize: 12, fontWeight: 800, color: "var(--hint)", marginBottom: 8 }}>Цель</div>
        <div style={{ display: "flex", gap: 8 }}>
          {GOALS.map((g) => (
            <button
              key={g.key}
              onClick={() => {
                haptic("light");
                upd({ goal: g.key });
              }}
              style={{ ...chip((p.goal ?? "maintain") === g.key), flex: 1, padding: "10px 0" }}
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>

      {/* computed calorie norm */}
      {targets ? (
        <div
          style={{
            background: "var(--card2)",
            borderRadius: 16,
            padding: "14px 16px",
            marginBottom: 24,
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
            <div>
              <div className="bignum" style={{ fontSize: 30, fontWeight: 900, color: "var(--text)", lineHeight: 1 }}>
                {targets.target}
              </div>
              <div style={{ fontSize: 12, fontWeight: 800, color: "var(--hint)", marginTop: 3 }}>
                ккал в день — цель
              </div>
            </div>
            <div style={{ textAlign: "right", fontSize: 12, fontWeight: 700, color: "var(--hint)", lineHeight: 1.5 }}>
              <div>Базовый обмен: {targets.bmr}</div>
              <div>Поддержание: {targets.tdee}</div>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ ...label, marginBottom: 24, fontWeight: 700, color: "var(--hint)" }}>
          Заполни пол, возраст, вес и рост — посчитаю норму калорий
        </div>
      )}
    </>
  );
}
