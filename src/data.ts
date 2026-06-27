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

export interface FoodRow {
  id: string;
  date: string; // ISO day
  emoji: string;
  name: string;
  note?: string;
  kcal: number;
  protein: number; // grams
  fat: number;
  carbs: number;
}

// Daily macro goals (grams) — drive the БЖУ progress bars.
export const MACRO_GOALS = { protein: 120, fat: 70, carbs: 250 };

// Clean slate — no demo content. The app starts empty so a real user builds
// up their own habits and diary entries from scratch.
export const HABITS: Habit[] = [];
export const ENTRIES: EntryLog = {};
export const ACTIVITIES: ActivityRow[] = [];
export const FOODS: FoodRow[] = [];
