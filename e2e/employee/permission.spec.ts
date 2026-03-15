import { test, expect } from "@playwright/test";

/**
 * WI-096: Permission 경계 E2E — Employee 역할
 *
 * storageState(employee.json)로 Employee 인증이 캐싱된 상태에서:
 * - Employee → /admin 접근차단 → /forbidden 리다이렉트
 * - Employee → /platform 접근차단 → /forbidden 리다이렉트
 * - Employee 사이드바 메뉴 노출범위 검증
 */

// ─── Employee → /admin 접근차단 ──────────────────────────────

test.describe("WI-096: Employee → /admin 접근차단", () => {
  test("Employee가 /admin 접근 시 /forbidden으로 리다이렉트된다", async ({
    page,
  }) => {
    await page.goto("/admin");
    await page.waitForURL("**/forbidden**", { timeout: 10_000 });

    await expect(page).toHaveURL(/\/forbidden/);
    await expect(page.locator("text=403")).toBeVisible();
    await expect(page.locator("text=접근 권한 없음")).toBeVisible();
  });

  test("Employee가 /admin/people 접근 시 /forbidden으로 리다이렉트된다", async ({
    page,
  }) => {
    await page.goto("/admin/people");
    await page.waitForURL("**/forbidden**", { timeout: 10_000 });

    await expect(page).toHaveURL(/\/forbidden/);
  });

  test("Employee가 /platform 접근 시 /forbidden으로 리다이렉트된다", async ({
    page,
  }) => {
    await page.goto("/platform");
    await page.waitForURL("**/forbidden**", { timeout: 10_000 });

    await expect(page).toHaveURL(/\/forbidden/);
  });
});

// ─── Employee 사이드바 메뉴 노출범위 ────────────────────────

test.describe("WI-096: Employee 사이드바 메뉴 노출범위", () => {
  test("Employee 사이드바에 직원 메뉴가 노출된다", async ({ page }) => {
    await page.goto("/employee");
    await expect(page.locator("body")).not.toContainText("404");

    // Employee 전용 메뉴
    await expect(page.locator("text=홈")).toBeVisible({ timeout: 10_000 });
    await expect(page.locator("text=일정")).toBeVisible();
    await expect(page.locator("text=요청")).toBeVisible();
    await expect(page.locator("text=인박스")).toBeVisible();
    await expect(page.locator("text=문서")).toBeVisible();
    await expect(page.locator("text=내 정보")).toBeVisible();
  });

  test("Employee 사이드바에 Admin 메뉴가 없다", async ({ page }) => {
    await page.goto("/employee");
    await expect(page.locator("text=홈")).toBeVisible({ timeout: 10_000 });

    // Admin 전용 메뉴가 표시되지 않아야 함
    await expect(page.locator("text=직원 관리")).not.toBeVisible();
    await expect(page.locator("text=조직도")).not.toBeVisible();
    await expect(page.locator("text=근태 관리")).not.toBeVisible();
    await expect(page.locator("text=급여")).not.toBeVisible();
    await expect(page.locator("text=채용")).not.toBeVisible();
  });

  test("Employee 사이드바에 플랫폼 메뉴가 없다", async ({ page }) => {
    await page.goto("/employee");
    await expect(page.locator("text=홈")).toBeVisible({ timeout: 10_000 });

    // 플랫폼 전용 메뉴가 표시되지 않아야 함
    await expect(page.locator("text=테넌트 관리")).not.toBeVisible();
    await expect(page.locator("text=플랜 & 빌링")).not.toBeVisible();
    await expect(page.locator("text=모니터링")).not.toBeVisible();
    await expect(page.locator("text=감사 & 보안")).not.toBeVisible();
  });
});
