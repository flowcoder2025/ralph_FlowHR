import { defineConfig, devices } from "@playwright/test";

const ADMIN_STATE = "playwright/.auth/admin.json";
const EMPLOYEE_STATE = "playwright/.auth/employee.json";
const OPERATOR_STATE = "playwright/.auth/operator.json";

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  globalTeardown: "./e2e/global-teardown.ts",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI
    ? [["html", { open: "never" }], ["github"]]
    : "list",
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

    /* ── 1. Admin (storageState 캐싱, e2e/admin/) ─── */
    {
      name: "admin",
      dependencies: ["setup"],
      use: { ...devices["Desktop Chrome"], storageState: ADMIN_STATE },
      testMatch: ["**/admin/*.spec.ts"],
    },

    /* ── 2. Employee (storageState 캐싱, e2e/employee/) */
    {
      name: "employee",
      dependencies: ["setup"],
      use: { ...devices["Desktop Chrome"], storageState: EMPLOYEE_STATE },
      testMatch: ["**/employee/*.spec.ts"],
    },

    /* ── 3. Platform/Operator (storageState 캐싱, e2e/platform/) */
    {
      name: "operator",
      dependencies: ["setup"],
      use: { ...devices["Desktop Chrome"], storageState: OPERATOR_STATE },
      testMatch: ["**/platform/*.spec.ts"],
    },

    /* ── 4. Logged-out (인증 불필요, e2e/ 루트) ────── */
    {
      name: "logged-out",
      use: { ...devices["Desktop Chrome"] },
      testMatch: ["smoke.spec.ts", "core-flow.spec.ts"],
    },

    /* ── 5. Cross-role (역할 전환, 자체 인증) ────────── */
    {
      name: "cross-role",
      dependencies: ["setup"],
      use: { ...devices["Desktop Chrome"] },
      testMatch: ["cross-role.*.spec.ts", "auth.spec.ts"],
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
