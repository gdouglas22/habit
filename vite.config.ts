import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { lookupNutritionServer } from "./server/nutrition.js";

// Serve /api/nutrition inside the dev server so `npm run dev` works on its own
// (the same handler runs in Express in prod — see server.js).
function nutritionApi(): Plugin {
  return {
    name: "nutrition-api",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url || !req.url.startsWith("/api/nutrition")) return next();
        const q = new URL(req.url, "http://localhost").searchParams.get("q");
        const { status, body } = await lookupNutritionServer(q);
        res.statusCode = status;
        res.setHeader("content-type", "application/json");
        res.end(JSON.stringify(body));
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), nutritionApi()],
  build: {
    outDir: "dist",
  },
});
