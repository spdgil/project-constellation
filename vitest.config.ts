import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    include: ["**/*.{test,spec}.{ts,tsx}"],
    exclude: ["node_modules", ".next"],
    pool: "forks",
    teardownTimeout: 3000,
    env: {
      // Dummy values for env validation in tests (no real connections made)
      DATABASE_URL: "postgresql://test:test@localhost:5432/test",
      OPENAI_API_KEY: "test-key",
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
});
