// Format a number with up to `maxDecimals` decimals, trimming trailing zeros.
// fmtNum(0.04) -> "0.04", fmtNum(65) -> "65", fmtNum(0.4) -> "0.4".
export function fmtNum(x: number, maxDecimals = 3): string {
  if (!Number.isFinite(x)) return "0";
  const f = 10 ** maxDecimals;
  return String(Math.round(x * f) / f);
}

// A relatable example amount for a unit, so a tiny per-unit rate reads sensibly
// (e.g. "0.04 ккал/шаг · 1000 шаг ≈ 40 ккал").
export function exampleAmount(unit: string): number {
  if (unit === "шаг") return 1000;
  if (unit === "повтор" || unit === "подход") return 10;
  if (unit === "км") return 5;
  return 30; // минуты и прочее
}
