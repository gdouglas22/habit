import { describe, it, expect } from "vitest";
import { isScheduled, isPerfectDay, breakBudget } from "../src/store/selectors";
import { weekdayMon0 } from "../src/date";
import type { Habit, EntryLog } from "../src/data";

function daily(id: string, startDate?: string): Habit {
  return {
    id,
    name: id,
    color: "coral",
    icon: "check",
    type: "check",
    days: [0, 1, 2, 3, 4, 5, 6],
    startDate,
    reminderOn: false,
  };
}

function entriesFor(ids: string[], dates: string[]): EntryLog {
  const e: EntryLog = {};
  for (const id of ids) {
    e[id] = {};
    for (const d of dates) e[id][d] = 1;
  }
  return e;
}

describe("isScheduled respects startDate (no backdating)", () => {
  const h = daily("a", "2026-06-15");

  it("is NOT scheduled before its startDate", () => {
    expect(isScheduled(h, "2026-06-14")).toBe(false);
    expect(isScheduled(h, "2026-01-01")).toBe(false);
  });

  it("is scheduled on and after its startDate", () => {
    expect(isScheduled(h, "2026-06-15")).toBe(true);
    expect(isScheduled(h, "2026-06-16")).toBe(true);
  });

  it("still honours the weekday set after the start", () => {
    const wd = weekdayMon0("2026-06-16");
    const only = { ...daily("a", "2026-06-15"), days: [wd] };
    expect(isScheduled(only, "2026-06-16")).toBe(true);
    expect(isScheduled(only, "2026-06-17")).toBe(false); // next day = different weekday
  });

  it("a legacy habit without startDate behaves as before", () => {
    expect(isScheduled(daily("a"), "2020-01-01")).toBe(true);
  });
});

describe("startDate keeps the past out of the budget", () => {
  const habits = [daily("a", "2026-06-10")];

  it("a day before the habit existed is never perfect and earns nothing", () => {
    const entries = entriesFor(["a"], ["2026-06-08"]); // value before startDate
    expect(isPerfectDay(habits, entries, {}, "2026-06-08")).toBe(false);
    expect(breakBudget(habits, entries, {}, 2026, 5, "2026-06-30").perfect).toBe(0);
  });

  it("counts only once the habit is active", () => {
    const entries = entriesFor(["a"], ["2026-06-10", "2026-06-11"]);
    expect(breakBudget(habits, entries, {}, 2026, 5, "2026-06-30").perfect).toBe(2);
  });
});
