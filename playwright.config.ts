import { defineConfig, devices } from "@playwright/test";

const baseURL =
  process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

const useAutoServer = process.env.PLAYWRIGHT_AUTO_SERVER === "1";
const isCI = !!process.env.CI;

export default defineConfig({
  testDir: "./tests",
  // Vitest specs live in tests/unit/*.test.ts; Playwright owns *.spec.ts only.
  testMatch: /.*\.spec\.ts$/,
  globalSetup: "./tests/global-setup.ts",
  // Routes can stream RSC content for several seconds in dev mode after a cold
  // compile; 60s gives enough headroom without masking real regressions.
  timeout: 60_000,
  expect: { timeout: 15_000 },
  retries: isCI ? 2 : 1,
  outputDir: "test-results/playwright",
  reporter: isCI ? [["github"], ["list"]] : "list",
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 15_000,
    navigationTimeout: 60_000,
  },
  // Optional: when invoked via `npm run smoke:local`, Playwright owns the dev
  // server lifecycle so the harness is reproducible. Default workflow (running
  // `npx playwright test` with a dev server already up) still works.
  webServer: useAutoServer
    ? {
        command: "npm run dev -- --port 3100",
        url: "http://localhost:3100/login",
        reuseExistingServer: !isCI,
        timeout: 120_000,
        env: { PORT: "3100" },
      }
    : undefined,
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
