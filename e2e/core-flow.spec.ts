import { test, expect } from "@playwright/test";

/**
 * Core Flow — 인증 불필요 핵심 플로우 테스트
 *
 * 로그인 폼, 데모 버튼, 잘못된 자격 증명, 미인증 리디렉트 등
 * 인증이 필요 없는 테스트만 포함합니다.
 *
 * 인증이 필요한 핵심 플로우 테스트는 admin.core-flow.spec.ts에서 실행됩니다.
 */

test.describe("핵심 플로우: 로그인 + 인증 불필요 시나리오", () => {
  test("로그인 페이지가 정상 렌더링된다", async ({ page }) => {
    await page.goto("/login");

    await expect(page.locator("h1")).toContainText("로그인");
    await expect(page.locator('input[id="email"]')).toBeVisible();
    await expect(page.locator('input[id="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test("데모 빠른 접근 버튼이 3개 표시된다", async ({ page }) => {
    await page.goto("/login");

    const demoSection = page.locator("text=데모 빠른 접근");
    await expect(demoSection).toBeVisible();

    await expect(page.getByText("Platform Operator로 로그인")).toBeVisible();
    await expect(page.getByText("Tenant Admin으로 로그인")).toBeVisible();
    await expect(page.getByText("Tenant Employee로 로그인")).toBeVisible();
  });

  test("잘못된 자격 증명으로 로그인 실패 시 에러 표시", async ({ page }) => {
    await page.goto("/login");

    await page.fill('input[id="email"]', "wrong@example.com");
    await page.fill('input[id="password"]', "wrongpassword");
    await page.click('button[type="submit"]');

    await expect(
      page.locator("text=이메일 또는 비밀번호가 올바르지 않습니다"),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("인증 없이 /admin 접근 시 /login으로 리디렉트", async ({ page }) => {
    await page.goto("/admin");

    await page.waitForURL("**/login**", { timeout: 10_000 });
    await expect(page.locator("h1")).toContainText("로그인");
  });
});

// ─── WI-096: 미인증 Permission 경계 ─────────────────────────

test.describe("WI-096: 미인증 → 보호 경로 리다이렉트", () => {
  test("미인증 → /admin 접근 시 /login으로 리다이렉트된다", async ({
    page,
  }) => {
    await page.goto("/admin");
    await page.waitForURL("**/login**", { timeout: 10_000 });

    await expect(page).toHaveURL(/\/login/);

    // callbackUrl 파라미터가 보존됨
    const url = new URL(page.url());
    const callbackUrl = url.searchParams.get("callbackUrl");
    expect(callbackUrl).toContain("/admin");
  });

  test("미인증 → /employee 접근 시 /login으로 리다이렉트된다", async ({
    page,
  }) => {
    await page.goto("/employee");
    await page.waitForURL("**/login**", { timeout: 10_000 });

    await expect(page).toHaveURL(/\/login/);

    const url = new URL(page.url());
    const callbackUrl = url.searchParams.get("callbackUrl");
    expect(callbackUrl).toContain("/employee");
  });

  test("미인증 → /platform 접근 시 /login으로 리다이렉트된다", async ({
    page,
  }) => {
    await page.goto("/platform");
    await page.waitForURL("**/login**", { timeout: 10_000 });

    await expect(page).toHaveURL(/\/login/);
  });

  test("미인증 → /admin/people 접근 시 callbackUrl이 보존된다", async ({
    page,
  }) => {
    await page.goto("/admin/people");
    await page.waitForURL("**/login**", { timeout: 10_000 });

    const url = new URL(page.url());
    const callbackUrl = url.searchParams.get("callbackUrl");
    expect(callbackUrl).toContain("/admin/people");
  });

  test("미인증 → /employee/schedule 접근 시 callbackUrl이 보존된다", async ({
    page,
  }) => {
    await page.goto("/employee/schedule");
    await page.waitForURL("**/login**", { timeout: 10_000 });

    const url = new URL(page.url());
    const callbackUrl = url.searchParams.get("callbackUrl");
    expect(callbackUrl).toContain("/employee/schedule");
  });
});
