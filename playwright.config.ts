import { defineConfig, devices } from "@playwright/test";
import { API_URL, DATABASE_URL, WEB_URL } from "./tests/e2e/environment";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  // Some cases intentionally share the exact email addresses from the test plan.
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  timeout: 30_000,
  expect: { timeout: 10_000 },
  globalSetup: "./tests/e2e/global-setup.ts",
  outputDir: "test-results",
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],
  use: {
    baseURL: WEB_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command:
        "yarn workspace api exec prisma db push --skip-generate && yarn workspace api exec tsx src/server.ts",
      url: new URL("/", API_URL).href,
      timeout: 120_000,
      reuseExistingServer: false,
      env: {
        DATABASE_URL,
        PORT: "4100",
        CORS_ORIGIN: WEB_URL,
        JWT_SECRET: "local-e2e-only-jwt-secret",
        REDIS_URL: "",
        NODE_ENV: "development",
        VERCEL: "0",
      },
    },
    {
      command: "yarn workspace web dev --hostname 127.0.0.1 --port 3100",
      url: `${WEB_URL}/login`,
      timeout: 120_000,
      reuseExistingServer: false,
      env: {
        NEXT_PUBLIC_API_URL: API_URL,
        NEXT_PUBLIC_SOCKET_URL: new URL("/", API_URL).origin,
      },
    },
  ],
});
