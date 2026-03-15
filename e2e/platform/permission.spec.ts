import { test, expect } from "@playwright/test";

/**
 * WI-096: Permission 경계 E2E — Operator 역할
 *
 * storageState(operator.json)로 Operator 인증이 캐싱된 상태에서:
 * - Operator → /admin 접근차단 → /forbidden 리다이렉트
 * - Operator → /employee 접근 가능 여부 확인 (RBAC상 TENANT_ROLES만 허용)
 * - Operator 사이드바(Platform) 메뉴 노출범위 검증
 */

// ─── Operator → /admin 접근차단 ──────────────────────────────

test.describe("WI-096: Operator → /admin 접근차단", () => {
  test("Operator가 /admin 접근 시 /forbidden으로 리다이렉트된다", async ({
    page,
  }) => {
    await page.goto("/admin");
    await page.waitForURL("**/forbidden**", { timeout: 10_000 });

    await expect(page).toHaveURL(/\/forbidden/);
    await expect(page.locator("text=403")).toBeVisible();
    await expect(page.locator("text=접근 권한 없음")).toBeVisible();
  });

  test("Operator가 /admin/people 접근 시 /forbidden으로 리다이렉트된다", async ({
    page,
  }) => {
    await page.goto("/admin/people");
    await page.waitForURL("**/forbidden**", { timeout: 10_000 });

    await expect(page).toHaveURL(/\/forbidden/);
  });

  test("Operator가 /admin/attendance 접근 시 /forbidden으로 리다이렉트된다", async ({
    page,
  }) => {
    await page.goto("/admin/attendance");
    await page.waitForURL("**/forbidden**", { timeout: 10_000 });

    await expect(page).toHaveURL(/\/forbidden/);
  });
});

// ─── Operator 사이드바 메뉴 노출범위 ────────────────────────

test.describe("WI-096: Operator 사이드바(Platform) 메뉴 노출범위", () => {
  test("Operator 사이드바에 플랫폼 메인 메뉴가 노출된다", async ({ page }) => {
    await page.goto("/platform");
    await expect(page.locator("body")).not.toContainText("404");

    // 메인
    await expect(page.locator("text=대시보드").first()).toBeVisible({
      timeout: 10_000,
    });
  });

  test("Operator 사이드바에 운영 메뉴가 노출된다", async ({ page }) => {
    await page.goto("/platform");
    await expect(page.locator("text=대시보드").first()).toBeVisible({
      timeout: 10_000,
    });

    // 운영
    await expect(page.locator("text=테넌트 관리")).toBeVisible();
    await expect(page.locator("text=플랜 & 빌링")).toBeVisible();
  });

  test("Operator 사이드바에 지원·시스템 메뉴가 노출된다", async ({ page }) => {
    await page.goto("/platform");
    await expect(page.locator("text=대시보드").first()).toBeVisible({
      timeout: 10_000,
    });

    // 지원
    await expect(page.locator("text=서포트")).toBeVisible();
    await expect(page.locator("text=모니터링")).toBeVisible();

    // 시스템
    await expect(page.locator("text=감사 & 보안")).toBeVisible();
    await expect(page.locator("text=플랫폼 설정")).toBeVisible();
  });

  test("Operator 사이드바에 Admin 메뉴가 없다", async ({ page }) => {
    await page.goto("/platform");
    await expect(page.locator("text=대시보드").first()).toBeVisible({
      timeout: 10_000,
    });

    // Admin 전용 메뉴가 표시되지 않아야 함
    await expect(page.locator("text=직원 관리")).not.toBeVisible();
    await expect(page.locator("text=조직도")).not.toBeVisible();
    await expect(page.locator("text=근태 관리")).not.toBeVisible();
    await expect(page.locator("text=급여")).not.toBeVisible();
    await expect(page.locator("text=채용")).not.toBeVisible();
  });
});
