// Derived habit state. Nothing about completion is stored on the habit itself —
// it all comes from the entries log keyed by date.
import type { Habit, EntryLog, ActivityRow, FoodRow } from "../data";
import { MACRO_GOALS } from "../data";
import { addDays, weekdayMon0, formatMinutes } from "../date";

export function activitiesOn(rows: ActivityRow[], date: string): ActivityRow[] {
  return rows.filter((a) => a.date === date);
}

export function foodsOn(rows: FoodRow[], date: string): FoodRow[] {
  return rows.filter((f) => f.date === date);
}

export function macroTotals(foods: FoodRow[]) {
  const sum = foods.reduce(
    (acc, f) => ({
      protein: acc.protein + f.protein,
      fat: acc.fat + f.fat,
      carbs: acc.carbs + f.carbs,
    }),
    { protein: 0, fat: 0, carbs: 0 }
  );
  const pct = (g: number, goal: number) => `${Math.min(100, Math.round((g / goal) * 100))}%`;
  return [
    { label: "Б", grams: sum.protein, pct: pct(sum.protein, MACRO_GOALS.protein), color: "#58B978" },
    { label: "Ж", grams: sum.fat, pct: pct(sum.fat, MACRO_GOALS.fat), color: "#F2994A" },
    { label: "У", grams: sum.carbs, pct: pct(sum.carbs, MACRO_GOALS.carbs), color: "#4A90C2" },
  ];
}

export function targetFor(h: Habit): number {
  if (h.type === "count" || h.type === "time") return Math.max(1, h.target ?? 1);
  return 1;
}

export function valueOn(entries: EntryLog, habitId: string, date: string): number {
  return entries[habitId]?.[date] ?? 0;
}

export function isDoneOn(entries: EntryLog, h: Habit, date: string): boolean {
  return valueOn(entries, h.id, date) >= targetFor(h);
}

export function progressOn(entries: EntryLog, h: Habit, date: string): number {
  const v = valueOn(entries, h.id, date);
  return Math.max(0, Math.min(1, v / targetFor(h)));
}

export function progressTextOn(entries: EntryLog, h: Habit, date: string): string {
  if (isDoneOn(entries, h, date)) return "Выполнено";
  const v = valueOn(entries, h.id, date);
  if (h.type === "time") {
    return `${formatMinutes(v)} / ${formatMinutes(targetFor(h))}`;
  }
  if (h.type === "count") {
    return `${v} / ${targetFor(h)} ${h.unit ?? ""}`.trim();
  }
  return "Сегодня";
}

export function isScheduled(h: Habit, date: string): boolean {
  return h.days.includes(weekdayMon0(date));
}

export function scheduledHabits(habits: Habit[], date: string): Habit[] {
  return habits.filter((h) => isScheduled(h, date));
}

// Consecutive scheduled days (ending at `date`) where the habit was done.
// Today not-yet-done does not break a streak built on prior days.
export function streakOn(entries: EntryLog, h: Habit, date: string): number {
  let streak = 0;
  let cur = date;
  // Allow today to be incomplete without zeroing the streak.
  if (isScheduled(h, cur) && !isDoneOn(entries, h, cur)) cur = addDays(cur, -1);
  for (let guard = 0; guard < 400; guard++) {
    if (isScheduled(h, cur)) {
      if (isDoneOn(entries, h, cur)) streak++;
      else break;
    }
    cur = addDays(cur, -1);
  }
  return streak;
}

// Fraction (0..1) of scheduled habits completed on a date. 0 if none scheduled.
export function dayProgress(habits: Habit[], entries: EntryLog, date: string): number {
  const due = scheduledHabits(habits, date);
  if (due.length === 0) return 0;
  const done = due.filter((h) => isDoneOn(entries, h, date)).length;
  return done / due.length;
}

// Next value when the user taps a habit card.
// check: toggle 0/1. count/time: +1, wrapping to 0 once past target.
export function nextTapValue(h: Habit, current: number): number {
  if (h.type === "check") return current >= 1 ? 0 : 1;
  const t = targetFor(h);
  return current >= t ? 0 : current + 1;
}
