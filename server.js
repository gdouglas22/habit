// Minimal static server for Railway. Serves the Vite build (dist/)
// with SPA fallback so deep links resolve to index.html.
import express from "express";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dist = join(__dirname, "dist");

const app = express();
app.use(express.static(dist, { maxAge: "1h", index: false }));

// SPA fallback
app.get("*", (_req, res) => {
  res.sendFile(join(dist, "index.html"));
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Habit Tracker TMA listening on :${port}`);
});
