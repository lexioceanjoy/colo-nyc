import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.E2E_PORT ?? 3100);

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 30_000,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: { baseURL: `http://localhost:${PORT}`, trace: "retain-on-failure" },
  // Visual baselines (tests/e2e/visual.spec.ts) are Linux-only by convention, so no {platform} in the path.
  snapshotPathTemplate: "{testDir}/__screenshots__/{arg}{ext}",
  expect: { toHaveScreenshot: { maxDiffPixelRatio: 0.001, animations: "disabled", caret: "hide" } },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
    { name: "mobile", use: { ...devices["iPhone 13"], browserName: "chromium", viewport: { width: 390, height: 844 } } },
  ],
  webServer: {
    command: `pnpm exec next start -p ${PORT}`,
    port: PORT,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
