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
}

// habitId -> ISO date -> value (check: 0/1, count/time: amount done that day)
export type EntryLog = Record<string, Record<string, number>>;

export interface ActivityRow {
  id: string;
  date: string; // ISO day
  emoji: string;
  name: string;
  note?: string;
  value: number;
  unit: string;
  kcal: number;
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
export const ACTIVITIES: ActivityRow[] = [];
export const PRODUCTS: Product[] = [];
export const FOODS: FoodEntry[] = [];
