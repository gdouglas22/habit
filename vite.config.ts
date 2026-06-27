import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Telegram Mini App is served as a static SPA.
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist",
  },
  // In dev, forward /api to the Express server (run `node server.js` alongside).
  server: {
    proxy: {
      "/api": "http://localhost:3000",
    },
  },
});
