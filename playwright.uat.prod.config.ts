import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.UAT_BASE_URL || "https://system.pos-hub.shop";

export default defineConfig({
  testDir: "./tests/uat",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"], ["html", { outputFolder: "playwright-report-uat", open: "never" }]],
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "off",
    ...devices["Desktop Chrome"],
  },
});
