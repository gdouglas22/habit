// Mock data for the design skeleton ("болванка"). Swap for a real backend later.
import { addDays, todayISO } from "./date";

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

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

export const HABITS: Habit[] = [
  {
    id: "h1",
    name: "Выпить воды",
    color: "blue",
    icon: "check",
    type: "count",
    target: 8,
    unit: "стаканов",
    days: ALL_DAYS,
    reminderOn: true,
    reminderTime: "10:00",
  },
  {
    id: "h2",
    name: "Зарядка",
    color: "amber",
    icon: "dumbbell",
    type: "check",
    days: ALL_DAYS,
    reminderOn: false,
  },
  {
    id: "h3",
    name: "Читать книгу",
    color: "lav",
    icon: "star",
    type: "count",
    target: 30,
    unit: "страниц",
    days: ALL_DAYS,
    reminderOn: true,
    reminderTime: "21:00",
  },
  {
    id: "h4",
    name: "Медитация",
    color: "mint",
    icon: "check",
    type: "check",
    days: ALL_DAYS,
    reminderOn: false,
  },
  {
    id: "h5",
    name: "Без сахара",
    color: "coral",
    icon: "flame",
    type: "check",
    days: ALL_DAYS,
    reminderOn: false,
  },
];

// Seed a completion log so the demo opens with visible streaks/progress.
// Past days are filled to produce streaks; today is left partial.
function seedEntries(): EntryLog {
  const today = todayISO();
  const log: EntryLog = { h1: {}, h2: {}, h3: {}, h4: {}, h5: {} };
  const fillPast = (id: string, days: number, value: number) => {
    for (let i = 1; i <= days; i++) log[id][addDays(today, -i)] = value;
  };
  fillPast("h1", 11, 8); // вода: 12-дневный стрик до сегодня
  fillPast("h2", 4, 1); // зарядка: 5-дневный стрик (вкл. сегодня)
  fillPast("h3", 2, 30); // книга: 3-дневный стрик
  fillPast("h4", 20, 1); // медитация: 21-дневный стрик
  // today partial / done
  log.h1[today] = 6; // 6/8
  log.h2[today] = 1; // выполнено
  log.h3[today] = 12; // 12/30
  log.h4[today] = 1; // выполнено
  return log;
}

export const ENTRIES: EntryLog = seedEntries();

const TODAY = todayISO();

export const ACTIVITIES: ActivityRow[] = [
  { id: "a1", date: TODAY, emoji: "🏃", name: "Бег", note: "Утренняя пробежка", value: 5.2, unit: "км", kcal: 320 },
  { id: "a2", date: TODAY, emoji: "🚴", name: "Велосипед", value: 12, unit: "км", kcal: 280 },
  { id: "a3", date: TODAY, emoji: "🧘", name: "Йога", note: "Растяжка", value: 30, unit: "мин", kcal: 90 },
];

export const FOODS: FoodRow[] = [
  { id: "f1", date: TODAY, emoji: "🥗", name: "Салат с курицей", note: "Обед", kcal: 420, protein: 35, fat: 18, carbs: 22 },
  { id: "f2", date: TODAY, emoji: "🍎", name: "Яблоко", kcal: 95, protein: 0, fat: 0, carbs: 25 },
  { id: "f3", date: TODAY, emoji: "🍳", name: "Омлет", note: "Завтрак", kcal: 310, protein: 20, fat: 24, carbs: 3 },
];
