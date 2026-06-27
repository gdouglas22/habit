import { useEffect, useState } from "react";
import { THEMES, applyThemeVars, type ThemeName } from "./theme";
import { preferredTheme, syncChrome, tg } from "./telegram";
import { BottomNav } from "./components/BottomNav";
import { Today } from "./screens/Today";
import { Activity } from "./screens/Activity";
import { Food } from "./screens/Food";
import { Calendar } from "./screens/Calendar";
import { Settings } from "./screens/Settings";
import { HabitEditor } from "./screens/HabitEditor";
import { ActivityEditor } from "./screens/ActivityEditor";
import { MealEditor } from "./screens/MealEditor";
import { Products } from "./screens/Products";
import { ProductEditor } from "./screens/ProductEditor";
import { Timer } from "./screens/Timer";

export type Screen = "today" | "activity" | "food" | "calendar" | "settings";

// id === null means "create new". Modals are a stack so nested flows work
// (meal → product picker → create product).
export type Modal =
  | { kind: "habit"; id: string | null }
  | { kind: "activity"; id: string | null }
  | { kind: "timer"; id: string }
  | { kind: "meal"; id: string | null }
  | { kind: "products" }
  | { kind: "product"; id: string | null };

export function App() {
  const [screen, setScreen] = useState<Screen>("today");
  const [stack, setStack] = useState<Modal[]>([]);
  const [theme, setTheme] = useState<ThemeName>(preferredTheme());

  const push = (m: Modal) => setStack((s) => [...s, m]);
  const pop = () => setStack((s) => s.slice(0, -1));

  useEffect(() => {
    const t = THEMES[theme];
    applyThemeVars(document.documentElement, t);
    document.body.style.background = t.bg;
    syncChrome(t.bg, t.header);
  }, [theme]);

  useEffect(() => {
    const t = tg;
    if (!t) return;
    const onChange = () => setTheme(preferredTheme());
    t.onEvent("themeChanged", onChange);
    return () => t.offEvent("themeChanged", onChange);
  }, []);

  const top = stack[stack.length - 1];
  if (top) {
    switch (top.kind) {
      case "habit":
        return <HabitEditor habitId={top.id} onClose={pop} />;
      case "activity":
        return <ActivityEditor rowId={top.id} onClose={pop} />;
      case "timer":
        return <Timer habitId={top.id} onClose={pop} />;
      case "meal":
        return (
          <MealEditor
            entryId={top.id}
            onClose={pop}
            onCreateProduct={() => push({ kind: "product", id: null })}
          />
        );
      case "products":
        return (
          <Products
            onClose={pop}
            onEdit={(id) => push({ kind: "product", id })}
          />
        );
      case "product":
        return <ProductEditor productId={top.id} onClose={pop} />;
    }
  }

  return (
    <div className="app">
      <div className="screen noscroll" key={screen}>
        {screen === "today" && (
          <Today
            onEdit={(id) => push({ kind: "habit", id })}
            onTimer={(id) => push({ kind: "timer", id })}
          />
        )}
        {screen === "activity" && (
          <Activity onEdit={(id) => push({ kind: "activity", id })} />
        )}
        {screen === "food" && (
          <Food
            onEdit={(id) => push({ kind: "meal", id })}
            onOpenBase={() => push({ kind: "products" })}
          />
        )}
        {screen === "calendar" && <Calendar onPick={() => setScreen("today")} />}
        {screen === "settings" && <Settings theme={theme} onTheme={setTheme} />}
      </div>
      <BottomNav screen={screen} onGo={setScreen} />
    </div>
  );
}
