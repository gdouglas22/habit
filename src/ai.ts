// Anthropic nutrition lookup, called directly from the Mini App (browser).
// Returns per-100g КБЖУ + fluid + the full micronutrient set as a strict tool.
import { MICRONUTRIENTS, type Micros } from "./data";

export interface NutritionResult {
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
  fluid: number;
  micros: Micros;
}

const MODEL = "claude-opus-4-8";

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
