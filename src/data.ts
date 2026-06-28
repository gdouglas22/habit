// App data model + seeds. Seeds are empty for a clean start.

export type HabitIconKey =
  | "check"
  | "dumbbell"
  | "utensils"
  | "flame"
  | "star"
  | "bell"
  | "calendar"
  | "sun";

// check = simple done/undone, count = numeric target, time = timed target
export type HabitType = "check" | "count" | "time";

// Habit *definition*. Per-day completion lives in the entries log, and
// done/progress/streak are derived from it (see store/selectors).
export interface Habit {
  id: string;
  name: string;
  color: string; // key into HABIT_COLORS
  icon: HabitIconKey;
  type: HabitType;
  target?: number; // for count/time
  unit?: string; // for count/time
  days: number[]; // 0..6 (пн..вс)
  reminderOn: boolean;
  reminderTime?: string; // "HH:MM"
  // Pomodoro (only for type "time"): work/break intervals in minutes
  pomodoroOn?: boolean;
  workMin?: number;
  breakMin?: number;
}

// A persisted, resumable timer session. anchorMs (wall clock) + baseElapsed let
// the timer continue correctly after the Mini App is closed and reopened.
export interface TimerSession {
  habitId: string;
  date: string; // ISO day the focused time is credited to
  pomodoro: boolean;
  workSec: number; // work phase length (non-pomodoro: the daily goal)
  breakSec: number;
  phase: "work" | "break";
  running: boolean;
  anchorMs: number | null; // Date.now() when started; null while paused
  baseElapsed: number; // seconds elapsed in the current phase as of last pause
}

// habitId -> ISO date -> value (check: 0/1, count/time: amount done that day)
export type EntryLog = Record<string, Record<string, number>>;

// An activity in the user's library: how many kcal it burns per 1 unit
// (e.g. per minute / per km) for an average adult.
export interface ActivityType {
  id: string;
  name: string;
  emoji: string;
  unit: string; // "мин" | "км" | "повтор" | ...
  kcalPerUnit: number;
}

// A diary entry references a library activity + an amount in its unit.
export interface ActivityRow {
  id: string;
  date: string; // ISO day
  activityId: string;
  value: number; // amount in the activity's unit
  note?: string;
}

export const ACTIVITY_UNITS = ["мин", "км", "повтор", "подход", "шаг"];
export const ACTIVITY_EMOJIS = ["🏃", "🚴", "🧘", "🏊", "🚶", "💪", "⚽", "🏋️", "🤸", "⛹️", "🥊", "🧗"];

// Reference weight the AI/manual kcalPerUnit estimates assume.
export const REFERENCE_WEIGHT = 70;

export type Sex = "male" | "female";
export type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "veryActive";
export type Goal = "lose" | "maintain" | "gain";

export interface Profile {
  name?: string;
  sex?: Sex;
  age?: number; // years
  weight?: number; // kg
  height?: number; // cm
  activityLevel?: ActivityLevel;
  goal?: Goal;
}

export const ACTIVITY_LEVELS: { key: ActivityLevel; label: string; factor: number }[] = [
  { key: "sedentary", label: "Малоподвижный", factor: 1.2 },
  { key: "light", label: "Лёгкая активность", factor: 1.375 },
  { key: "moderate", label: "Умеренная", factor: 1.55 },
  { key: "active", label: "Высокая", factor: 1.725 },
  { key: "veryActive", label: "Очень высокая", factor: 1.9 },
];

export const GOALS: { key: Goal; label: string; delta: number }[] = [
  { key: "lose", label: "Похудение", delta: -0.15 },
  { key: "maintain", label: "Поддержание", delta: 0 },
  { key: "gain", label: "Набор", delta: 0.15 },
];

export interface Targets {
  bmr: number; // базовый обмен
  tdee: number; // суточный расход с учётом активности
  target: number; // целевые калории с учётом цели
}

// Mifflin–St Jeor. Returns null until the required fields are filled.
export function computeTargets(p: Profile): Targets | null {
  if (!p.sex || !p.age || !p.weight || !p.height) return null;
  const s = p.sex === "male" ? 5 : -161;
  const bmr = 10 * p.weight + 6.25 * p.height - 5 * p.age + s;
  const factor = ACTIVITY_LEVELS.find((a) => a.key === (p.activityLevel ?? "moderate"))?.factor ?? 1.55;
  const tdee = bmr * factor;
  const delta = GOALS.find((g) => g.key === (p.goal ?? "maintain"))?.delta ?? 0;
  return { bmr: Math.round(bmr), tdee: Math.round(tdee), target: Math.round(tdee * (1 + delta)) };
}

// Micronutrient catalog — the fixed set every product carries. Values are
// stored per 100 g; the app sums them up by grams eaten. Set chosen here.
export const MICRONUTRIENTS = [
  { key: "fiber", label: "Клетчатка", unit: "г", group: "Прочее" },
  { key: "vitaminA", label: "Витамин A", unit: "мкг", group: "Витамины" },
  { key: "vitaminC", label: "Витамин C", unit: "мг", group: "Витамины" },
  { key: "vitaminD", label: "Витамин D", unit: "мкг", group: "Витамины" },
  { key: "vitaminE", label: "Витамин E", unit: "мг", group: "Витамины" },
  { key: "vitaminK", label: "Витамин K", unit: "мкг", group: "Витамины" },
  { key: "b1", label: "B1 (тиамин)", unit: "мг", group: "Витамины" },
  { key: "b2", label: "B2 (рибофлавин)", unit: "мг", group: "Витамины" },
  { key: "b6", label: "B6", unit: "мг", group: "Витамины" },
  { key: "b9", label: "B9 (фолат)", unit: "мкг", group: "Витамины" },
  { key: "b12", label: "B12", unit: "мкг", group: "Витамины" },
  { key: "calcium", label: "Кальций", unit: "мг", group: "Минералы" },
  { key: "iron", label: "Железо", unit: "мг", group: "Минералы" },
  { key: "magnesium", label: "Магний", unit: "мг", group: "Минералы" },
  { key: "potassium", label: "Калий", unit: "мг", group: "Минералы" },
  { key: "zinc", label: "Цинк", unit: "мг", group: "Минералы" },
] as const;

export type MicroKey = (typeof MICRONUTRIENTS)[number]["key"];
export type Micros = Record<string, number>; // MicroKey -> amount per 100 g

// A product (or a whole dish) stored in the user's database. All nutrition is
// per 100 g; the diary multiplies by the grams eaten.
export interface Product {
  id: string;
  name: string;
  emoji: string;
  kcal: number; // per 100 g
  protein: number;
  fat: number;
  carbs: number;
  fluid: number; // ml of liquid per 100 g (drinks ~100, solids ~0)
  micros: Micros;
}

export interface FoodItem {
  productId: string;
  grams: number;
}

// A diary entry = one meal, composed of products with gram amounts.
export interface FoodEntry {
  id: string;
  date: string; // ISO day
  emoji: string;
  name?: string; // optional label, e.g. "Обед"
  items: FoodItem[];
}

export function emptyMicros(): Micros {
  const m: Micros = {};
  for (const n of MICRONUTRIENTS) m[n.key] = 0;
  return m;
}

// Food entry emoji choices (meaning is user-defined).
export const FOOD_EMOJIS = ["🍽️", "🍎", "🥛", "🥐", "🥗", "🍲"];

// Clean slate — no demo content. The app starts empty so a real user builds
// up their own habits and diary entries from scratch.
export const HABITS: Habit[] = [];
export const ENTRIES: EntryLog = {};
export const ACTIVITY_TYPES: ActivityType[] = [];
export const ACTIVITIES: ActivityRow[] = [];
export const PRODUCTS: Product[] = [];
export const FOODS: FoodEntry[] = [];
