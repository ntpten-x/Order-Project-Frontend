import { defineConfig } from "@playwright/test";

const e2eBaseUrl = process.env.E2E_BASE_URL || "http://localhost:8101";

export default defineConfig({
  testDir: "./tests/e2e-api",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: e2eBaseUrl,
  },
});
