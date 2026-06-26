// Mock data for the design skeleton ("болванка"). Swap for a real backend later.

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
  progress: number; // 0..1
  progressText: string;
  streak: number;
  done: boolean;
}

export interface ActivityRow {
  id: string;
  emoji: string;
  name: string;
  note?: string;
  value: string;
  kcal: number;
}

export interface FoodRow {
  id: string;
  emoji: string;
  name: string;
  note?: string;
  kcal: number;
}

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
    progress: 0.75,
    progressText: "6 / 8 стаканов",
    streak: 12,
    done: false,
  },
  {
    id: "h2",
    name: "Зарядка",
    color: "amber",
    icon: "dumbbell",
    type: "check",
    days: ALL_DAYS,
    reminderOn: false,
    progress: 1,
    progressText: "Выполнено",
    streak: 5,
    done: true,
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
    progress: 0.4,
    progressText: "12 / 30 страниц",
    streak: 3,
    done: false,
  },
  {
    id: "h4",
    name: "Медитация",
    color: "mint",
    icon: "check",
    type: "check",
    days: ALL_DAYS,
    reminderOn: false,
    progress: 1,
    progressText: "Выполнено",
    streak: 21,
    done: true,
  },
  {
    id: "h5",
    name: "Без сахара",
    color: "coral",
    icon: "flame",
    type: "check",
    days: ALL_DAYS,
    reminderOn: false,
    progress: 0,
    progressText: "Сегодня",
    streak: 0,
    done: false,
  },
];

export const ACTIVITIES: ActivityRow[] = [
  { id: "a1", emoji: "🏃", name: "Бег", note: "Утренняя пробежка", value: "5.2 км", kcal: 320 },
  { id: "a2", emoji: "🚴", name: "Велосипед", value: "12 км", kcal: 280 },
  { id: "a3", emoji: "🧘", name: "Йога", note: "Растяжка", value: "30 мин", kcal: 90 },
];

export const FOODS: FoodRow[] = [
  { id: "f1", emoji: "🥗", name: "Салат с курицей", note: "Обед", kcal: 420 },
  { id: "f2", emoji: "🍎", name: "Яблоко", kcal: 95 },
  { id: "f3", emoji: "🍳", name: "Омлет", note: "Завтрак", kcal: 310 },
];

export const WEEKDAYS = ["пн", "вт", "ср", "чт", "пт", "сб", "вс"];

export const MACROS = [
  { label: "Б", pct: "62%", color: "#58B978", value: "78 г" },
  { label: "Ж", pct: "45%", color: "#F2994A", value: "41 г" },
  { label: "У", pct: "70%", color: "#4A90C2", value: "180 г" },
];
