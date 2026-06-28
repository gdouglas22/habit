// Derived habit state. Nothing about completion is stored on the habit itself —
// it all comes from the entries log keyed by date.
import type {
  Habit,
  EntryLog,
  ActivityRow,
  ActivityType,
  FoodEntry,
  Product,
  Micros,
} from "../data";
import { MICRONUTRIENTS, emptyMicros, REFERENCE_WEIGHT } from "../data";
import { addDays, weekdayMon0, formatMinutes, toISO } from "../date";

export function activitiesOn(rows: ActivityRow[], date: string): ActivityRow[] {
  return rows.filter((a) => a.date === date);
}

export function activityTypeById(types: ActivityType[], id: string): ActivityType | undefined {
  return types.find((t) => t.id === id);
}

// kcalPerUnit estimates assume REFERENCE_WEIGHT; scale by the user's weight
// when known so heavier/lighter users get a closer number.
export function activityKcal(row: ActivityRow, types: ActivityType[], weightKg?: number): number {
  const t = activityTypeById(types, row.activityId);
  if (!t) return 0;
  const factor = weightKg && weightKg > 0 ? weightKg / REFERENCE_WEIGHT : 1;
  return Math.round(t.kcalPerUnit * row.value * factor);
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

// kcal eaten on a date (0 if nothing logged).
export function foodKcalOn(foods: FoodEntry[], products: Product[], date: string): number {
  return dayNutrition(foodsOn(foods, date), products).kcal;
}

// kcal burned on a date across all activities.
export function activityKcalOn(
  activities: ActivityRow[],
  types: ActivityType[],
  date: string,
  weightKg?: number
): number {
  return activitiesOn(activities, date).reduce((s, a) => s + activityKcal(a, types, weightKg), 0);
}

// 1 = at target, 0 = far off in either direction (under or over).
export function calorieCloseness(eaten: number, target: number): number {
  if (!target || target <= 0) return 0;
  return Math.max(0, Math.min(1, 1 - Math.abs(eaten - target) / target));
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
// Today not-yet-done does not break a streak built on prior days. Break days
// ("каникулы") are excused — they neither extend nor reset the streak.
export function streakOn(entries: EntryLog, h: Habit, date: string, breaks: string[] = []): number {
  let streak = 0;
  let cur = date;
  // Allow today to be incomplete without zeroing the streak.
  if (isScheduled(h, cur) && !isBreak(breaks, cur) && !isDoneOn(entries, h, cur)) cur = addDays(cur, -1);
  for (let guard = 0; guard < 400; guard++) {
    if (isBreak(breaks, cur)) {
      // excused day — skip without counting or breaking the streak
    } else if (isScheduled(h, cur)) {
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

// --- Break days ("каникулы") ----------------------------------------------
// A break excuses every habit for that day. Budget is earned ONLY from habits
// (food / activity don't count), so breaks can't be farmed: each month grants
// 3 free breaks + 0.25 per "perfect" habit day (all scheduled habits done).

export const FREE_BREAKS_PER_MONTH = 3;
export const BREAK_PER_PERFECT_DAY = 0.25;

export function isBreak(breaks: string[], date: string): boolean {
  return breaks.includes(date);
}

// A "perfect" day: at least one habit was scheduled and all were done. Break
// days never count (they're excused, not earned).
export function isPerfectDay(
  habits: Habit[],
  entries: EntryLog,
  breaks: string[],
  date: string
): boolean {
  if (isBreak(breaks, date)) return false;
  const due = scheduledHabits(habits, date);
  return due.length > 0 && due.every((h) => isDoneOn(entries, h, date));
}

function isoInMonth(iso: string, year: number, month0: number): boolean {
  const [y, m] = iso.split("-").map(Number);
  return y === year && m - 1 === month0;
}

// Perfect habit days within a calendar month, counting only days up to `today`
// (the future hasn't happened yet, so it can't have earned anything).
export function perfectDaysInMonth(
  habits: Habit[],
  entries: EntryLog,
  breaks: string[],
  year: number,
  month0: number,
  today: string
): number {
  const days = new Date(year, month0 + 1, 0).getDate();
  let n = 0;
  for (let d = 1; d <= days; d++) {
    const iso = toISO(new Date(year, month0, d));
    if (iso > today) break;
    if (isPerfectDay(habits, entries, breaks, iso)) n++;
  }
  return n;
}

export interface BreakBudget {
  perfect: number; // perfect habit days this month
  earned: number; // 0.25 × perfect
  allowance: number; // free + earned
  used: number; // breaks already taken this month
  remaining: number; // allowance − used (may be fractional)
}

// Break budget for the calendar month containing `year`/`month0`.
export function breakBudget(
  habits: Habit[],
  entries: EntryLog,
  breaks: string[],
  year: number,
  month0: number,
  today: string
): BreakBudget {
  const perfect = perfectDaysInMonth(habits, entries, breaks, year, month0, today);
  const earned = perfect * BREAK_PER_PERFECT_DAY;
  const allowance = FREE_BREAKS_PER_MONTH + earned;
  const used = breaks.filter((d) => isoInMonth(d, year, month0)).length;
  return { perfect, earned, allowance, used, remaining: allowance - used };
}

// You can take a break only if at least a whole one is left in the budget.
export function canTakeBreak(b: BreakBudget): boolean {
  return b.remaining >= 1;
}
