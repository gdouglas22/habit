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
import { FoodEditor } from "./screens/FoodEditor";
import { Timer } from "./screens/Timer";

export type Screen = "today" | "activity" | "food" | "calendar" | "settings";

// id === null means "create new"
type Modal =
  | { kind: "habit"; id: string | null }
  | { kind: "activity"; id: string | null }
  | { kind: "food"; id: string | null }
  | { kind: "timer"; id: string }
  | null;

export function App() {
  const [screen, setScreen] = useState<Screen>("today");
  const [modal, setModal] = useState<Modal>(null);
  const [theme, setTheme] = useState<ThemeName>(preferredTheme());

  // Apply CSS theme vars to the document root + sync Telegram chrome.
  useEffect(() => {
    const t = THEMES[theme];
    applyThemeVars(document.documentElement, t);
    document.body.style.background = t.bg;
    syncChrome(t.bg, t.header);
  }, [theme]);

  // Follow Telegram's own theme switches unless the user overrode it here.
  useEffect(() => {
    const t = tg;
    if (!t) return;
    const onChange = () => setTheme(preferredTheme());
    t.onEvent("themeChanged", onChange);
    return () => t.offEvent("themeChanged", onChange);
  }, []);

  const close = () => setModal(null);
  if (modal) {
    if (modal.kind === "habit") return <HabitEditor habitId={modal.id} onClose={close} />;
    if (modal.kind === "activity") return <ActivityEditor rowId={modal.id} onClose={close} />;
    if (modal.kind === "timer") return <Timer habitId={modal.id} onClose={close} />;
    return <FoodEditor rowId={modal.id} onClose={close} />;
  }

  return (
    <div className="app">
      <div className="screen noscroll" key={screen}>
        {screen === "today" && (
          <Today
            onEdit={(id) => setModal({ kind: "habit", id })}
            onTimer={(id) => setModal({ kind: "timer", id })}
          />
        )}
        {screen === "activity" && (
          <Activity onEdit={(id) => setModal({ kind: "activity", id })} />
        )}
        {screen === "food" && <Food onEdit={(id) => setModal({ kind: "food", id })} />}
        {screen === "calendar" && <Calendar onPick={() => setScreen("today")} />}
        {screen === "settings" && <Settings theme={theme} onTheme={setTheme} />}
      </div>
      <BottomNav screen={screen} onGo={setScreen} />
    </div>
  );
}
