// Shared habit metadata: icon registry, type/unit options, and a draft factory.
import {
  CheckSquare,
  Dumbbell,
  Utensils,
  Flame,
  Star,
  Bell,
  Calendar,
  Sun,
} from "./icons";
import { HABIT_COLORS } from "./theme";
import type { Habit, HabitIconKey, HabitType } from "./data";

type IconComp = typeof CheckSquare;

export const HABIT_ICONS: Record<HabitIconKey, IconComp> = {
  check: CheckSquare,
  dumbbell: Dumbbell,
  utensils: Utensils,
  flame: Flame,
  star: Star,
  bell: Bell,
  calendar: Calendar,
  sun: Sun,
};

export const ICON_KEYS = Object.keys(HABIT_ICONS) as HabitIconKey[];
export const COLOR_KEYS = Object.keys(HABIT_COLORS);

export const TYPE_OPTIONS: { key: HabitType; label: string }[] = [
  { key: "check", label: "Отметка" },
  { key: "count", label: "Количество" },
  { key: "time", label: "Время" },
];

export const UNIT_OPTIONS = ["раз", "стаканов", "страниц", "минут", "км", "шагов"];
export const DAY_LABELS = ["пн", "вт", "ср", "чт", "пт", "сб", "вс"];

export function draftHabit(id: string): Habit {
  return {
    id,
    name: "",
    color: "coral",
    icon: "check",
    type: "check",
    target: 8,
    unit: "раз",
    days: [0, 1, 2, 3, 4, 5, 6],
    reminderOn: false,
    reminderTime: "09:00",
  };
}
