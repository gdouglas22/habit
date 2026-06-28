// Minimal static server for Railway. Serves the Vite build (dist/) with SPA
// fallback, plus the /api/nutrition free-DB proxy.
import express from "express";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { lookupNutritionServer } from "./server/nutrition.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dist = join(__dirname, "dist");

const app = express();

app.get("/api/nutrition", async (req, res) => {
  const { status, body } = await lookupNutritionServer(req.query.q);
  res.status(status).json(body);
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
