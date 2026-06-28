// Nutrition lookup with a free-database-first cascade:
//   1) Open Food Facts (free, no key, CORS)  →  2) Anthropic AI  →  3) error
import { MICRONUTRIENTS, emptyMicros, type Micros } from "./data";

export interface NutritionResult {
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
  fluid: number;
  micros: Micros;
}

export interface SourcedNutrition extends NutritionResult {
  source: string; // human-readable origin, e.g. "Open Food Facts"
  matchedName?: string;
}

// Reject obviously-bad results (all zero, negatives, impossible energy).
export function isPlausibleNutrition(r: NutritionResult): boolean {
  const macros = [r.kcal, r.protein, r.fat, r.carbs];
  if (macros.some((v) => !Number.isFinite(v) || v < 0)) return false;
  if (r.kcal > 1000) return false; // >1000 kcal / 100 g is impossible
  if (r.kcal <= 0 && r.protein <= 0 && r.fat <= 0 && r.carbs <= 0) return false;
  return true;
}

// Tier 1 — free database lookup via our own /api/nutrition proxy (Open Food
// Facts server-side; avoids browser CORS / bot-blocking). null = not found.
export async function lookupFreeDb(name: string): Promise<SourcedNutrition | null> {
  let res: Response;
  try {
    res = await fetch(`/api/nutrition?q=${encodeURIComponent(name)}`);
  } catch {
    return null;
  }
  if (res.status === 404) return null;
  if (!res.ok) return null;
  const d = await res.json().catch(() => null);
  if (!d || typeof d.kcal !== "number") return null;
  const result: SourcedNutrition = { ...d, micros: { ...emptyMicros(), ...d.micros } };
  return isPlausibleNutrition(result) ? result : null;
}

// Factual nutrition lookup — Sonnet 4.6 balances cost and stronger recall on
// rarer products / micronutrients. Drop to "claude-haiku-4-5" for cheaper/faster.
const MODEL = "claude-sonnet-4-6";

export async function lookupNutrition(apiKey: string, name: string): Promise<NutritionResult> {
  const microProps: Record<string, unknown> = {};
  for (const m of MICRONUTRIENTS) {
    microProps[m.key] = { type: "number", description: `${m.label}, ${m.unit} на 100 г` };
  }

  const schema = {
    type: "object",
    additionalProperties: false,
    properties: {
      kcal: { type: "number", description: "ккал на 100 г" },
      protein: { type: "number", description: "белки, г на 100 г" },
      fat: { type: "number", description: "жиры, г на 100 г" },
      carbs: { type: "number", description: "углеводы, г на 100 г" },
      fluid: { type: "number", description: "жидкость, мл на 100 г (напитки ~100, твёрдая еда ~0)" },
      micros: {
        type: "object",
        additionalProperties: false,
        properties: microProps,
        required: MICRONUTRIENTS.map((m) => m.key),
      },
    },
    required: ["kcal", "protein", "fat", "carbs", "fluid", "micros"],
  };

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      // Required to call the API directly from a browser origin.
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1024,
      tools: [
        {
          name: "save_nutrition",
          description:
            "Сохранить пищевую ценность продукта или блюда на 100 грамм, включая КБЖУ, жидкость и микроэлементы.",
          strict: true,
          input_schema: schema,
        },
      ],
      tool_choice: { type: "tool", name: "save_nutrition" },
      messages: [
        {
          role: "user",
          content:
            `Оцени пищевую ценность на 100 грамм для: "${name}". ` +
            "Если это готовое блюдо (например, бигмак или паста), дай усреднённую оценку. " +
            "Все значения — числами. Если данных нет, ставь 0. Не выдумывай экстремальные значения.",
        },
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Ошибка ИИ (${res.status}). ${text.slice(0, 160)}`);
  }

  const data = await res.json();
  const block = (data.content ?? []).find((b: { type: string }) => b.type === "tool_use");
  if (!block?.input) throw new Error("ИИ не вернул данные");
  return block.input as NutritionResult;
}

// --- Activity calorie-burn lookup ---------------------------------------
export interface ActivityInfo {
  unit: string; // "мин" | "км" | "повтор" | "подход" | "шаг"
  kcalPerUnit: number; // kcal burned per 1 unit, average adult ~70 kg
}

// Keep enough precision that tiny per-unit values survive (e.g. 0.04 kcal per
// step). Rounding to 1 decimal — the old behaviour — collapsed those to 0.
export function roundKcalPerUnit(x: number): number {
  return Math.round((Number(x) || 0) * 1000) / 1000;
}

export function isPlausibleActivity(a: ActivityInfo): boolean {
  return Number.isFinite(a.kcalPerUnit) && a.kcalPerUnit > 0 && a.kcalPerUnit < 1000;
}

// The AI answers "kcal_for_reference per reference_amount units" so it never has
// to express a sub-1-kcal per-1-unit figure (which it logically rounds to 0 for
// e.g. a single step). We derive the per-unit rate from that.
export function toActivityInfo(raw: {
  unit?: unknown;
  reference_amount?: unknown;
  kcal_for_reference?: unknown;
}): ActivityInfo {
  const unit = typeof raw?.unit === "string" ? raw.unit : "мин";
  const ref = Math.max(1, Number(raw?.reference_amount) || 1);
  const kref = Math.max(0, Number(raw?.kcal_for_reference) || 0);
  return { unit, kcalPerUnit: roundKcalPerUnit(kref / ref) };
}

export async function lookupActivity(apiKey: string, name: string): Promise<ActivityInfo> {
  const schema = {
    type: "object",
    additionalProperties: false,
    properties: {
      unit: {
        type: "string",
        enum: ["мин", "км", "повтор", "подход", "шаг"],
        description: "Наиболее естественная единица измерения для этой активности",
      },
      reference_amount: {
        type: "number",
        description:
          "Опорное количество единиц, за которое удобно считать расход (шаги — 1000, повторы — 10, км и минуты — 1).",
      },
      kcal_for_reference: {
        type: "number",
        description: "Сколько ккал сжигается за это опорное количество у взрослого ~70 кг. Не ноль.",
      },
    },
    required: ["unit", "reference_amount", "kcal_for_reference"],
  };

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 512,
      tools: [
        {
          name: "save_activity",
          description: "Сохранить расход калорий для физической активности.",
          strict: true,
          input_schema: schema,
        },
      ],
      tool_choice: { type: "tool", name: "save_activity" },
      messages: [
        {
          role: "user",
          content:
            `Оцени расход калорий для активности: "${name}". ` +
            "Выбери естественную единицу. Затем выбери удобное опорное количество (reference_amount) — " +
            "для шагов это 1000, для силовых повторов 10, для бега/ходьбы 1 км, для большинства 1 минута — " +
            "и укажи, сколько ккал сжигается за это количество у взрослого ~70 кг. " +
            "Расход за опорное количество не должен быть нулём.",
        },
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Ошибка ИИ (${res.status}). ${text.slice(0, 160)}`);
  }
  const data = await res.json();
  const block = (data.content ?? []).find((b: { type: string }) => b.type === "tool_use");
  if (!block?.input) throw new Error("ИИ не вернул данные");
  return toActivityInfo(block.input);
}
