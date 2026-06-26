// Mock data for the design skeleton ("болванка"). Swap for a real backend later.

export interface Habit {
  id: string;
  name: string;
  color: string; // key into HABIT_COLORS
  icon: "check" | "dumbbell" | "utensils" | "flame" | "star";
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

export const HABITS: Habit[] = [
  {
    id: "h1",
    name: "Выпить воды",
    color: "blue",
    icon: "check",
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
