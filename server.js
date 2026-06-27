// Minimal static server for Railway. Serves the Vite build (dist/)
// with SPA fallback so deep links resolve to index.html.
import express from "express";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dist = join(__dirname, "dist");

const app = express();

// --- Free nutrition lookup (Open Food Facts), proxied server-side to avoid
// browser CORS and bot-blocking. Two steps: the search service resolves a
// name to product codes, then the v2 product API returns per-100g nutriments.
const UA = "habit-tracker-tma/0.1 (personal mini app)";
const num = (v) => {
  const n = typeof v === "string" ? parseFloat(v) : v;
  return Number.isFinite(n) ? n : undefined;
};
const round = (v) => Math.round(v * 100) / 100;
// OFF stores micronutrients in grams/100g; convert to the app's mg / мкг.
const OFF_MICROS = [
  ["fiber_100g", "fiber", 1],
  ["vitamin-a_100g", "vitaminA", 1e6],
  ["vitamin-c_100g", "vitaminC", 1e3],
  ["vitamin-d_100g", "vitaminD", 1e6],
  ["vitamin-e_100g", "vitaminE", 1e3],
  ["vitamin-k_100g", "vitaminK", 1e6],
  ["vitamin-b1_100g", "b1", 1e3],
  ["vitamin-b2_100g", "b2", 1e3],
  ["vitamin-b6_100g", "b6", 1e3],
  ["vitamin-b9_100g", "b9", 1e6],
  ["vitamin-b12_100g", "b12", 1e6],
  ["calcium_100g", "calcium", 1e3],
  ["iron_100g", "iron", 1e3],
  ["magnesium_100g", "magnesium", 1e3],
  ["potassium_100g", "potassium", 1e3],
  ["zinc_100g", "zinc", 1e3],
];
const MICRO_KEYS = OFF_MICROS.map((m) => m[1]);

function normalize(prod, fallbackName) {
  const n = prod.nutriments || {};
  let kcal = num(n["energy-kcal_100g"]);
  if (kcal === undefined && num(n["energy_100g"]) !== undefined) kcal = num(n["energy_100g"]) / 4.184;
  const protein = num(n["proteins_100g"]);
  const fat = num(n["fat_100g"]);
  const carbs = num(n["carbohydrates_100g"]);
  if (kcal === undefined && protein === undefined && fat === undefined && carbs === undefined) return null;
  if ((kcal ?? 0) > 1000) return null;
  const micros = {};
  for (const k of MICRO_KEYS) micros[k] = 0;
  for (const [off, key, factor] of OFF_MICROS) {
    const v = num(n[off]);
    if (v !== undefined) micros[key] = round(v * factor);
  }
  return {
    kcal: round(kcal ?? 0),
    protein: round(protein ?? 0),
    fat: round(fat ?? 0),
    carbs: round(carbs ?? 0),
    fluid: 0,
    micros,
    source: "Open Food Facts",
    matchedName: prod.product_name || fallbackName,
  };
}

app.get("/api/nutrition", async (req, res) => {
  const q = String(req.query.q || "").trim();
  if (!q) return res.status(400).json({ error: "q required" });
  try {
    const s = await fetch(
      `https://search.openfoodfacts.org/search?q=${encodeURIComponent(q)}&page_size=6`,
      { headers: { "User-Agent": UA } }
    );
    if (!s.ok) return res.status(502).json({ error: "search failed" });
    const sd = await s.json();
    const hits = (sd.hits || []).filter((h) => h.code).slice(0, 6);
    for (const h of hits) {
      const pr = await fetch(
        `https://world.openfoodfacts.org/api/v2/product/${h.code}?fields=product_name,nutriments`,
        { headers: { "User-Agent": UA } }
      );
      if (!pr.ok) continue;
      const pd = await pr.json();
      if (!pd.product) continue;
      const result = normalize(pd.product, h.product_name);
      if (result) return res.json(result);
    }
    return res.status(404).json({ error: "not found" });
  } catch (e) {
    return res.status(502).json({ error: String(e).slice(0, 140) });
  }
});

app.use(express.static(dist, { maxAge: "1h", index: false }));

// SPA fallback
app.get("*", (_req, res) => {
  res.sendFile(join(dist, "index.html"));
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Habit Tracker TMA listening on :${port}`);
});
