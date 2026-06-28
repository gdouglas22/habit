import { describe, it, expect } from "vitest";
import {
  isPerfectDay,
  perfectDaysInMonth,
  breakBudget,
  canTakeBreak,
  streakOn,
  FREE_BREAKS_PER_MONTH,
  BREAK_PER_PERFECT_DAY,
} from "../src/store/selectors";
import type { Habit, EntryLog } from "../src/data";

// A habit scheduled every day of the week, so any ISO date is "scheduled".
function daily(id: string, name = id): Habit {
  return {
    id,
    name,
    color: "coral",
    icon: "check",
    type: "check",
    days: [0, 1, 2, 3, 4, 5, 6],
    reminderOn: false,
  };
}

// Mark a set of dates done for every habit listed.
function entriesFor(habitIds: string[], dates: string[]): EntryLog {
  const e: EntryLog = {};
  for (const id of habitIds) {
    e[id] = {};
    for (const d of dates) e[id][d] = 1;
  }
  return e;
}

describe("isPerfectDay", () => {
  const habits = [daily("a"), daily("b")];

  it("true only when every scheduled habit is done", () => {
    const entries = entriesFor(["a", "b"], ["2026-06-10"]);
    expect(isPerfectDay(habits, entries, [], "2026-06-10")).toBe(true);
  });

  it("false when one habit is missing", () => {
    const entries = entriesFor(["a"], ["2026-06-10"]); // b not done
    expect(isPerfectDay(habits, entries, [], "2026-06-10")).toBe(false);
  });

  it("false when nothing is scheduled (no habits)", () => {
    expect(isPerfectDay([], {}, [], "2026-06-10")).toBe(false);
  });

  it("a break day never counts as perfect — even if everything is done", () => {
    const entries = entriesFor(["a", "b"], ["2026-06-10"]);
    expect(isPerfectDay(habits, entries, ["2026-06-10"], "2026-06-10")).toBe(false);
  });
});

describe("perfectDaysInMonth", () => {
  const habits = [daily("a")];

  it("counts perfect days up to `today`, ignoring the future", () => {
    const entries = entriesFor(["a"], ["2026-06-01", "2026-06-02", "2026-06-30"]);
    // today is the 2nd: the 30th hasn't happened yet
    const n = perfectDaysInMonth(habits, entries, [], 2026, 5, "2026-06-02");
    expect(n).toBe(2);
  });

  it("ignores days in other months", () => {
    const entries = entriesFor(["a"], ["2026-05-31", "2026-06-01"]);
    const n = perfectDaysInMonth(habits, entries, [], 2026, 5, "2026-06-30");
    expect(n).toBe(1); // only June 1
  });
});

describe("breakBudget", () => {
  const habits = [daily("a")];

  it("grants 3 free breaks with no perfect days", () => {
    const b = breakBudget(habits, {}, [], 2026, 5, "2026-06-30");
    expect(b.allowance).toBe(FREE_BREAKS_PER_MONTH);
    expect(b.remaining).toBe(3);
    expect(canTakeBreak(b)).toBe(true);
  });

  it("earns 0.25 per perfect day on top of the free 3", () => {
    const entries = entriesFor(["a"], ["2026-06-01", "2026-06-02", "2026-06-03", "2026-06-04"]);
    const b = breakBudget(habits, entries, [], 2026, 5, "2026-06-30");
    expect(b.perfect).toBe(4);
    expect(b.earned).toBe(4 * BREAK_PER_PERFECT_DAY); // 1.0
    expect(b.allowance).toBe(4); // 3 + 1
  });

  it("subtracts breaks already taken this month", () => {
    const entries = entriesFor(["a"], ["2026-06-01", "2026-06-02"]);
    // two breaks taken in June; they aren't perfect days
    const breaks = ["2026-06-10", "2026-06-11"];
    const b = breakBudget(habits, entries, breaks, 2026, 5, "2026-06-30");
    expect(b.perfect).toBe(2);
    expect(b.allowance).toBe(3.5); // 3 + 0.5
    expect(b.used).toBe(2);
    expect(b.remaining).toBe(1.5);
  });

  it("breaks in other months don't count against this month", () => {
    const b = breakBudget(habits, {}, ["2026-05-20", "2026-07-01"], 2026, 5, "2026-06-30");
    expect(b.used).toBe(0);
    expect(b.remaining).toBe(3);
  });

  it("blocks taking a break once less than one is left", () => {
    const breaks = ["2026-06-01", "2026-06-02", "2026-06-03"]; // used all 3 free
    const b = breakBudget(habits, {}, breaks, 2026, 5, "2026-06-30");
    expect(b.remaining).toBe(0);
    expect(canTakeBreak(b)).toBe(false);
  });
});

describe("streakOn with break days", () => {
  const h = daily("a");

  it("a break in the middle does not reset the streak", () => {
    // done Mon+Tue+Thu, break on Wed -> streak spans all three done days
    const entries = entriesFor(["a"], ["2026-06-22", "2026-06-23", "2026-06-25"]);
    const breaks = ["2026-06-24"]; // Wednesday excused
    expect(streakOn(entries, h, "2026-06-25", breaks)).toBe(3);
  });

  it("a missed (non-break) day still resets the streak", () => {
    const entries = entriesFor(["a"], ["2026-06-22", "2026-06-23", "2026-06-25"]);
    // no break on the 24th -> only the 25th counts
    expect(streakOn(entries, h, "2026-06-25", [])).toBe(1);
  });

  it("a queue of consecutive break days bridges the streak", () => {
    // done 20th, three breaks (21/22/23) in a row, done 24th
    const entries = entriesFor(["a"], ["2026-06-20", "2026-06-24"]);
    const breaks = ["2026-06-21", "2026-06-22", "2026-06-23"];
    expect(streakOn(entries, h, "2026-06-24", breaks)).toBe(2);
  });

  it("a leading run of breaks (long vacation) doesn't crash or count", () => {
    const entries = entriesFor(["a"], ["2026-06-24"]);
    const breaks = ["2026-06-21", "2026-06-22", "2026-06-23"];
    // only the 24th is done; the breaks before it are excused, nothing earlier
    expect(streakOn(entries, h, "2026-06-24", breaks)).toBe(1);
  });
});

describe("retroactive breaks (задним числом)", () => {
  const habits = [daily("a")];

  it("excusing a past MISSED day costs exactly one and heals the streak", () => {
    // 14th done, 15th MISSED, 16th done -> streak normally just 1
    const entries = entriesFor(["a"], ["2026-06-14", "2026-06-16"]);
    expect(streakOn(entries, habits[0], "2026-06-16", [])).toBe(1);

    // mark the 15th as a break after the fact
    const breaks = ["2026-06-15"];
    expect(streakOn(entries, habits[0], "2026-06-16", breaks)).toBe(2);

    const b = breakBudget(habits, entries, breaks, 2026, 5, "2026-06-30");
    expect(b.perfect).toBe(2); // 14th & 16th still perfect; the missed 15th never was
    expect(b.used).toBe(1);
    expect(b.remaining).toBe(2.5); // 3 + 0.5 − 1
    expect(b.remaining).toBeGreaterThanOrEqual(0); // never goes negative
  });

  it("excusing a past PERFECT day would double-cost — which is why the UI blocks it", () => {
    // 4 perfect days -> allowance 4
    const entries = entriesFor(["a"], ["2026-06-01", "2026-06-02", "2026-06-03", "2026-06-04"]);
    const before = breakBudget(habits, entries, [], 2026, 5, "2026-06-30");
    expect(before.remaining).toBe(4);

    // if a perfect day were turned into a break, it stops counting as perfect
    // (allowance −0.25) AND consumes one (used +1): remaining drops by 1.25.
    const after = breakBudget(habits, entries, ["2026-06-02"], 2026, 5, "2026-06-30");
    expect(after.perfect).toBe(3);
    expect(after.remaining).toBe(2.75);
    // Today.tsx prevents reaching this by hiding "Взять" on a completed day.
  });
});
