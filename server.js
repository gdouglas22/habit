// Minimal static server for Railway. Serves the Vite build (dist/) with SPA
// fallback, plus the /api/nutrition free-DB proxy.
import express from "express";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { lookupNutritionServer } from "./server/nutrition.js";
import { verifyInitData } from "./server/telegram.js";
import { dbEnabled, getState, putState } from "./server/db.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dist = join(__dirname, "dist");
const BOT_TOKEN = process.env.BOT_TOKEN;

const app = express();
app.use(express.json({ limit: "2mb" }));

app.get("/api/nutrition", async (req, res) => {
  const { status, body } = await lookupNutritionServer(req.query.q);
  res.status(status).json(body);
});

// --- Per-user state sync (requires Postgres + bot token) ---------------
// Returns the verified Telegram user id, or writes an error response and
// returns null.
function authUser(req, res) {
  if (!dbEnabled || !BOT_TOKEN) {
    res.status(501).json({ error: "storage disabled" });
    return null;
  }
  const uid = verifyInitData(BOT_TOKEN, req.get("x-telegram-init-data"));
  if (!uid) {
    res.status(401).json({ error: "unauthorized" });
    return null;
  }
  return uid;
}

app.get("/api/state", async (req, res) => {
  const uid = authUser(req, res);
  if (!uid) return;
  try {
    res.json({ data: await getState(uid) });
  } catch (e) {
    res.status(500).json({ error: String(e).slice(0, 140) });
  }
});

app.put("/api/state", async (req, res) => {
  const uid = authUser(req, res);
  if (!uid) return;
  try {
    await putState(uid, req.body?.data ?? {});
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: String(e).slice(0, 140) });
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
