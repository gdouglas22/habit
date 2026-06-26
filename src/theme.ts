// Design tokens lifted directly from the Claude Design prototype
// "Habit Tracker.dc.html" (light + dark token sets).

export type ThemeName = "light" | "dark";

export interface ThemeTokens {
  bg: string;
  card: string;
  card2: string;
  text: string;
  hint: string;
  line: string;
  chip: string;
  header: string;
}

export const ACCENT = "#F26B7A";
export const ACCENT2 = "#F2994A";
export const ACCENT_GRADIENT = "linear-gradient(120deg,#F26B7A,#F2994A)";

export const THEMES: Record<ThemeName, ThemeTokens> = {
  light: {
    bg: "#FBF7F4",
    card: "#FFFFFF",
    card2: "#F3ECE6",
    text: "#2A2A2A",
    hint: "#9B9B9B",
    line: "#ECE3DC",
    chip: "rgba(255,255,255,.65)",
    header: "#FFFFFF",
  },
  dark: {
    bg: "#1C1A18",
    card: "#2A2724",
    card2: "#232120",
    text: "#F2EDE9",
    hint: "#8A827B",
    line: "#34302C",
    chip: "rgba(255,255,255,.08)",
    header: "#232120",
  },
};

// Per-habit accent palette (track = soft tint, fill = stronger progress fill).
export const HABIT_COLORS: Record<
  string,
  { light: { track: string; fill: string }; solid: string }
> = {
  coral: { light: { track: "#FBE8E6", fill: "#F8D2CE" }, solid: "#F26B7A" },
  amber: { light: { track: "#FBEFD9", fill: "#F7E0B0" }, solid: "#F2994A" },
  mint: { light: { track: "#E2F0E7", fill: "#C7E4D2" }, solid: "#58B978" },
  blue: { light: { track: "#E1ECF6", fill: "#C3DAEE" }, solid: "#4A90C2" },
  lav: { light: { track: "#ECE7F6", fill: "#D7CEEE" }, solid: "#8A74C2" },
  teal: { light: { track: "#DFF0EE", fill: "#BFE3DD" }, solid: "#3FA89C" },
  pink: { light: { track: "#FBE6EF", fill: "#F4C9DE" }, solid: "#E06AA0" },
};

export function applyThemeVars(el: HTMLElement, t: ThemeTokens) {
  el.style.setProperty("--bg", t.bg);
  el.style.setProperty("--card", t.card);
  el.style.setProperty("--card2", t.card2);
  el.style.setProperty("--text", t.text);
  el.style.setProperty("--hint", t.hint);
  el.style.setProperty("--line", t.line);
  el.style.setProperty("--chip", t.chip);
  el.style.setProperty("--header", t.header);
  el.style.setProperty("--accent", ACCENT);
  el.style.setProperty("--accent2", ACCENT2);
}
