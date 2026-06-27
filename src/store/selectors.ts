// Derived habit state. Nothing about completion is stored on the habit itself —
// it all comes from the entries log keyed by date.
import type {
  Habit,
  EntryLog,
  ActivityRow,
  FoodEntry,
  Product,
  Micros,
} from "../data";
import { MICRONUTRIENTS, emptyMicros } from "../data";
import { addDays, weekdayMon0, formatMinutes } from "../date";

export function activitiesOn(rows: ActivityRow[], date: string): ActivityRow[] {
  return rows.filter((a) => a.date === date);
}

export function foodsOn(rows: FoodEntry[], date: string): FoodEntry[] {
  return rows.filter((f) => f.date === date);
}

export interface Nutrition {
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
  fluid: number;
  micros: Micros;
}

function zero(): Nutrition {
  return { kcal: 0, protein: 0, fat: 0, carbs: 0, fluid: 0, micros: emptyMicros() };
}

function scale(p: Product, grams: number): Nutrition {
  const k = grams / 100;
  const micros: Micros = {};
  for (const m of MICRONUTRIENTS) micros[m.key] = (p.micros[m.key] ?? 0) * k;
  return {
    kcal: p.kcal * k,
    protein: p.protein * k,
    fat: p.fat * k,
    carbs: p.carbs * k,
    fluid: p.fluid * k,
    micros,
  };
}

function add(a: Nutrition, b: Nutrition): Nutrition {
  const micros: Micros = {};
  for (const m of MICRONUTRIENTS) micros[m.key] = (a.micros[m.key] ?? 0) + (b.micros[m.key] ?? 0);
  return {
    kcal: a.kcal + b.kcal,
    protein: a.protein + b.protein,
    fat: a.fat + b.fat,
    carbs: a.carbs + b.carbs,
    fluid: a.fluid + b.fluid,
    micros,
  };
}

export function productById(products: Product[], id: string): Product | undefined {
  return products.find((p) => p.id === id);
}

// Sum of an entry's items, resolved against the product database.
export function entryNutrition(entry: FoodEntry, products: Product[]): Nutrition {
  return entry.items.reduce((acc, item) => {
    const p = productById(products, item.productId);
    return p ? add(acc, scale(p, item.grams)) : acc;
  }, zero());
}

export function dayNutrition(foods: FoodEntry[], products: Product[]): Nutrition {
  return foods.reduce((acc, e) => add(acc, entryNutrition(e, products)), zero());
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
// check: toggle 0/1. count: +1 with no upper bound (overachievement allowed —
// use the minus control to correct). time habits open the timer instead.
export function nextTapValue(h: Habit, current: number): number {
  if (h.type === "check") return current >= 1 ? 0 : 1;
  return current + 1;
}
