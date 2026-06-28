import { describe, it, expect } from "vitest";
import { toActivityInfo, isPlausibleActivity, roundKcalPerUnit } from "../src/ai";
import { activityKcal, activityTypeById } from "../src/store/selectors";
import type { ActivityType, ActivityRow } from "../src/data";

// Regression: adding "шаги" / "отжимания" (1 unit) must produce a usable,
// non-zero per-unit rate. The old code rounded the AI's per-unit value to one
// decimal, collapsing ~0.04 kcal/step to 0 and breaking the whole activity.

describe("roundKcalPerUnit", () => {
  it("keeps tiny per-unit values instead of zeroing them", () => {
    expect(roundKcalPerUnit(0.04)).toBe(0.04); // a step
    expect(roundKcalPerUnit(0.4)).toBe(0.4); // a push-up
    expect(roundKcalPerUnit(0)).toBe(0);
    // the old Math.round(x*10)/10 would have made 0.04 -> 0
    expect(Math.round(0.04 * 10) / 10).toBe(0);
  });
});

describe("toActivityInfo (reference-amount based)", () => {
  it("steps: 1000 шагов = 40 ккал -> 0.04 / шаг", () => {
    const info = toActivityInfo({ unit: "шаг", reference_amount: 1000, kcal_for_reference: 40 });
    expect(info.unit).toBe("шаг");
    expect(info.kcalPerUnit).toBe(0.04);
    expect(isPlausibleActivity(info)).toBe(true);
  });

  it("push-ups: 10 повторов = 4 ккал -> 0.4 / повтор", () => {
    const info = toActivityInfo({ unit: "повтор", reference_amount: 10, kcal_for_reference: 4 });
    expect(info.kcalPerUnit).toBe(0.4);
    expect(isPlausibleActivity(info)).toBe(true);
  });

  it("running: 1 км = 65 ккал -> 65 / км", () => {
    const info = toActivityInfo({ unit: "км", reference_amount: 1, kcal_for_reference: 65 });
    expect(info.kcalPerUnit).toBe(65);
  });

  it("guards a zero / missing reference amount", () => {
    const info = toActivityInfo({ unit: "шаг", reference_amount: 0, kcal_for_reference: 0.04 });
    expect(info.kcalPerUnit).toBe(0.04); // divides by 1, not 0
  });

  it("AI returning 0 stays implausible (so the UI can fall back to manual)", () => {
    const info = toActivityInfo({ unit: "шаг", reference_amount: 1000, kcal_for_reference: 0 });
    expect(info.kcalPerUnit).toBe(0);
    expect(isPlausibleActivity(info)).toBe(false);
  });
});

describe("isPlausibleActivity", () => {
  it("accepts small positive rates, rejects 0 / negative / absurd", () => {
    expect(isPlausibleActivity({ unit: "шаг", kcalPerUnit: 0.04 })).toBe(true);
    expect(isPlausibleActivity({ unit: "мин", kcalPerUnit: 8 })).toBe(true);
    expect(isPlausibleActivity({ unit: "шаг", kcalPerUnit: 0 })).toBe(false);
    expect(isPlausibleActivity({ unit: "мин", kcalPerUnit: -1 })).toBe(false);
    expect(isPlausibleActivity({ unit: "мин", kcalPerUnit: 5000 })).toBe(false);
  });
});

describe("activityKcal with a step/push-up library entry", () => {
  const steps: ActivityType = { id: "steps", name: "Шаги", emoji: "🚶", unit: "шаг", kcalPerUnit: 0.04 };
  const pushups: ActivityType = { id: "pu", name: "Отжимания", emoji: "💪", unit: "повтор", kcalPerUnit: 0.4 };
  const types = [steps, pushups];

  it("5000 steps ≈ 200 kcal", () => {
    const row: ActivityRow = { id: "r1", date: "2026-06-28", activityId: "steps", value: 5000 };
    expect(activityKcal(row, types)).toBe(200);
  });

  it("30 push-ups = 12 kcal", () => {
    const row: ActivityRow = { id: "r2", date: "2026-06-28", activityId: "pu", value: 30 };
    expect(activityKcal(row, types)).toBe(12);
  });

  it("scales by body weight (80 kg vs 70 kg reference)", () => {
    const row: ActivityRow = { id: "r3", date: "2026-06-28", activityId: "steps", value: 5000 };
    expect(activityKcal(row, types, 80)).toBe(Math.round(200 * (80 / 70)));
  });

  it("a single step rounds to 0 kcal (correct — one step really is ~0)", () => {
    const row: ActivityRow = { id: "r4", date: "2026-06-28", activityId: "steps", value: 1 };
    expect(activityKcal(row, types)).toBe(0);
  });

  it("resolves the library entry by id", () => {
    expect(activityTypeById(types, "pu")?.name).toBe("Отжимания");
    expect(activityTypeById(types, "nope")).toBeUndefined();
  });
});
