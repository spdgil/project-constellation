import { defineConfig } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL,
    trace: "retain-on-failure",
  },
  webServer: {
    command: process.env.CI
      ? "PORT=3000 npm run start"
      : "PORT=3000 npm run dev",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
  },
});
