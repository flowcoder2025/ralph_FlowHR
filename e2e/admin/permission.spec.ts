import { test, expect } from "@playwright/test";

/**
 * WI-096: Permission 경계 E2E — Admin 역할
 *
 * storageState(admin.json)로 Admin 인증이 캐싱된 상태에서:
 * - Admin → /platform 접근차단 → /forbidden 리다이렉트 (403)
 * - Admin 사이드바 메뉴 노출범위 검증
 */

// ─── Admin → /platform 접근차단 ──────────────────────────────

test.describe("WI-096: Admin → /platform 접근차단", () => {
  test("Admin이 /platform 접근 시 /forbidden으로 리다이렉트된다", async ({
    page,
  }) => {
    await page.goto("/platform");
    await page.waitForURL("**/forbidden**", { timeout: 10_000 });

    await expect(page).toHaveURL(/\/forbidden/);
    await expect(page.locator("text=403")).toBeVisible();
    await expect(page.locator("text=접근 권한 없음")).toBeVisible();
  });

  test("Admin이 /platform/tenants 접근 시 /forbidden으로 리다이렉트된다", async ({
    page,
  }) => {
    await page.goto("/platform/tenants");
    await page.waitForURL("**/forbidden**", { timeout: 10_000 });

    await expect(page).toHaveURL(/\/forbidden/);
  });

  test("Admin이 /platform/billing 접근 시 /forbidden으로 리다이렉트된다", async ({
    page,
  }) => {
    await page.goto("/platform/billing");
    await page.waitForURL("**/forbidden**", { timeout: 10_000 });

    await expect(page).toHaveURL(/\/forbidden/);
  });

  test("forbidden 페이지에 '뒤로 가기'와 '다시 로그인' 버튼이 있다", async ({
    page,
  }) => {
    await page.goto("/platform");
    await page.waitForURL("**/forbidden**", { timeout: 10_000 });

    await expect(
      page.locator("button", { hasText: "뒤로 가기" }),
    ).toBeVisible();
    await expect(
      page.locator("button", { hasText: "다시 로그인" }),
    ).toBeVisible();
  });
});

// ─── Admin 사이드바 메뉴 노출범위 ────────────────────────────

test.describe("WI-096: Admin 사이드바 메뉴 노출범위", () => {
  test("Admin 사이드바에 인사관리 메뉴가 노출된다", async ({ page }) => {
    await page.goto("/admin");
    await expect(page.locator("body")).not.toContainText("404");

    // 메인
    await expect(page.locator("text=대시보드").first()).toBeVisible({
      timeout: 10_000,
    });

    // 인사관리
    await expect(page.locator("text=직원 관리")).toBeVisible();
    await expect(page.locator("text=조직도")).toBeVisible();
    await expect(page.locator("text=인사 변동")).toBeVisible();
    await expect(page.locator("text=근태 관리")).toBeVisible();
    await expect(page.locator("text=휴가 관리")).toBeVisible();
  });

  test("Admin 사이드바에 운영 메뉴가 노출된다", async ({ page }) => {
    await page.goto("/admin");
    await expect(page.locator("text=대시보드").first()).toBeVisible({
      timeout: 10_000,
    });

    // 운영
    await expect(page.locator("text=결재")).toBeVisible();
    await expect(page.locator("text=문서")).toBeVisible();
    await expect(page.locator("text=급여")).toBeVisible();
    await expect(page.locator("text=성과")).toBeVisible();
    await expect(page.locator("text=채용")).toBeVisible();
  });

  test("Admin 사이드바에 시스템 메뉴가 노출된다", async ({ page }) => {
    await page.goto("/admin");
    await expect(page.locator("text=대시보드").first()).toBeVisible({
      timeout: 10_000,
    });

    // 시스템
    await expect(page.locator("text=리포트")).toBeVisible();
    await expect(page.locator("text=설정").first()).toBeVisible();
  });

  test("Admin 사이드바에 플랫폼 콘솔 메뉴가 없다", async ({ page }) => {
    await page.goto("/admin");
    await expect(page.locator("text=대시보드").first()).toBeVisible({
      timeout: 10_000,
    });

    // 플랫폼 전용 메뉴가 표시되지 않아야 함
    await expect(page.locator("text=테넌트 관리")).not.toBeVisible();
    await expect(page.locator("text=플랜 & 빌링")).not.toBeVisible();
    await expect(page.locator("text=모니터링")).not.toBeVisible();
    await expect(page.locator("text=감사 & 보안")).not.toBeVisible();
  });
});
