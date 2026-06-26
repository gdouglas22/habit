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

export type Screen = "today" | "activity" | "food" | "calendar" | "settings";

// null habitId = creating a new habit
type EditorRoute = { habitId: string | null } | null;

export function App() {
  const [screen, setScreen] = useState<Screen>("today");
  const [editor, setEditor] = useState<EditorRoute>(null);
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

  if (editor) {
    return (
      <HabitEditor habitId={editor.habitId} onClose={() => setEditor(null)} />
    );
  }

  return (
    <div className="app">
      <div className="screen noscroll" key={screen}>
        {screen === "today" && <Today onEdit={(id) => setEditor({ habitId: id })} />}
        {screen === "activity" && <Activity />}
        {screen === "food" && <Food />}
        {screen === "calendar" && <Calendar />}
        {screen === "settings" && <Settings theme={theme} onTheme={setTheme} />}
      </div>
      <BottomNav screen={screen} onGo={setScreen} />
    </div>
  );
}
