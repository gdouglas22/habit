import { defineConfig } from "vitest/config";

// Unit tests run in plain Node — the tested modules are pure (no DOM).
export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
