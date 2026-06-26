import { ACCENT } from "../theme";
import { haptic } from "../telegram";
import { CheckSquare, Dumbbell, Utensils, Calendar, Gear } from "../icons";
import type { Screen } from "../App";

const ITEMS: { key: Screen; label: string; Icon: typeof CheckSquare }[] = [
  { key: "today", label: "Сегодня", Icon: CheckSquare },
  { key: "activity", label: "Активность", Icon: Dumbbell },
  { key: "food", label: "Питание", Icon: Utensils },
  { key: "calendar", label: "Календарь", Icon: Calendar },
  { key: "settings", label: "Настройки", Icon: Gear },
];

export function BottomNav({
  screen,
  onGo,
}: {
  screen: Screen;
  onGo: (s: Screen) => void;
}) {
  return (
    <div
      style={{
        flex: "none",
        display: "flex",
        background: "var(--header)",
        borderTop: "1px solid var(--line)",
        padding: "8px 6px calc(8px + env(safe-area-inset-bottom))",
      }}
    >
      {ITEMS.map(({ key, label, Icon }) => {
        const active = screen === key;
        const color = active ? ACCENT : "var(--hint)";
        return (
          <button
            key={key}
            onClick={() => {
              haptic("light");
              onGo(key);
            }}
            style={{
              flex: 1,
              background: "none",
              border: "none",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
              padding: "4px 0",
              color,
            }}
          >
            <Icon size={23} color={active ? ACCENT : undefined} stroke={2} />
            <span style={{ fontSize: 10, fontWeight: 800, color }}>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
