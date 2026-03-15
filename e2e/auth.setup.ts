import { test as setup, expect } from "@playwright/test";

/**
 * Auth Setup — 3역할 인증 캐싱
 *
 * Admin, Employee, Operator 각각 로그인하여 storageState를
 * playwright/.auth/*.json에 저장합니다.
 * 이후 테스트에서는 storageState를 재사용하여 로그인 과정을 생략합니다.
 */

const ADMIN_FILE = "playwright/.auth/admin.json";
const EMPLOYEE_FILE = "playwright/.auth/employee.json";
const OPERATOR_FILE = "playwright/.auth/operator.json";

async function login(
  page: import("@playwright/test").Page,
  email: string,
  password: string,
  expectedUrl: string,
) {
  await page.goto("/login");
  await page.fill('input[id="email"]', email);
  await page.fill('input[id="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(`**${expectedUrl}**`, { timeout: 15_000 });
}

setup("Admin 인증 캐싱", async ({ page }) => {
  await login(page, "admin@acme.example.com", "demo1234!", "/admin");
  await expect(page).toHaveURL(/\/admin/);
  await page.context().storageState({ path: ADMIN_FILE });
});

setup("Employee 인증 캐싱", async ({ page }) => {
  await login(page, "employee@acme.example.com", "demo1234!", "/employee");
  await expect(page).toHaveURL(/\/employee/);
  await page.context().storageState({ path: EMPLOYEE_FILE });
});

setup("Operator 인증 캐싱", async ({ page }) => {
  await login(page, "operator@flowhr.io", "demo1234!", "/platform");
  await expect(page).toHaveURL(/\/platform/);
  await page.context().storageState({ path: OPERATOR_FILE });
});
