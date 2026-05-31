import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.PORT) || 3000;
const baseURL = `http://localhost:${PORT}`;

// E2E tests live in ./e2e (kept out of ./tests so vitest's *.test.ts glob and
// Playwright's *.spec.ts glob never pick up each other's files).
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  // Reuse a dev server already running on PORT (Next refuses to start a second
  // `next dev` for the same project); otherwise boot one. In CI it always boots
  // fresh.
  webServer: {
    command: `npm run dev -- --port ${PORT}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
