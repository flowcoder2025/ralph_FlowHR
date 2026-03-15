import { defineConfig, devices } from "@playwright/test";

const ADMIN_STATE = "playwright/.auth/admin.json";
const EMPLOYEE_STATE = "playwright/.auth/employee.json";
const OPERATOR_STATE = "playwright/.auth/operator.json";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? "github" : "list",
  timeout: 30_000,
  use: {
    baseURL: process.env.BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    /* ── 0. Auth Setup ─────────────────────────────── */
    {
      name: "setup",
      testMatch: /auth\.setup\.ts/,
    },

    /* ── 1. Admin (storageState 캐싱) ──────────────── */
    {
      name: "admin",
      dependencies: ["setup"],
      use: { ...devices["Desktop Chrome"], storageState: ADMIN_STATE },
      testMatch: ["**/admin.*.spec.ts"],
    },

    /* ── 2. Employee (storageState 캐싱) ───────────── */
    {
      name: "employee",
      dependencies: ["setup"],
      use: { ...devices["Desktop Chrome"], storageState: EMPLOYEE_STATE },
      testMatch: ["**/employee.*.spec.ts"],
    },

    /* ── 3. Operator (storageState 캐싱) ───────────── */
    {
      name: "operator",
      dependencies: ["setup"],
      use: { ...devices["Desktop Chrome"], storageState: OPERATOR_STATE },
      testMatch: ["**/operator.*.spec.ts"],
    },

    /* ── 4. Logged-out (인증 불필요 테스트) ─────────── */
    {
      name: "logged-out",
      use: { ...devices["Desktop Chrome"] },
      testMatch: ["**/smoke.spec.ts", "**/core-flow.spec.ts"],
    },
  ],
  webServer: process.env.CI
    ? undefined
    : {
        command: "npm run dev",
        url: "http://localhost:3000",
        reuseExistingServer: true,
        timeout: 60_000,
      },
});
