import { test, expect } from "@playwright/test";

/**
 * Admin Core Flow — 관리자 핵심 플로우 (인증 캐싱)
 *
 * storageState(admin.json)로 사전 인증된 상태에서
 * 대시보드 → People → Attendance 순회를 검증합니다.
 */

test.describe("핵심 플로우: 대시보드 → People → Attendance", () => {
  test("Admin 대시보드 진입", async ({ page }) => {
    await page.goto("/admin");

    await expect(page.locator("text=안녕하세요, 관리자님")).toBeVisible({
      timeout: 10_000,
    });

    await expect(page.locator("text=승인 필요")).toBeVisible();
    await expect(page.locator("text=근태 이상")).toBeVisible();
  });

  test("대시보드 → People(직원 관리) 페이지 이동", async ({ page }) => {
    await page.goto("/admin");

    await page.click("text=직원 관리");
    await page.waitForURL("**/admin/people", { timeout: 10_000 });

    await expect(page.locator("text=전체")).toBeVisible({ timeout: 10_000 });
    await expect(page.locator("text=재직 중")).toBeVisible();
  });

  test("People → Attendance(근태 관리) 페이지 이동", async ({ page }) => {
    await page.goto("/admin");

    await page.click("text=근태 관리");
    await page.waitForURL("**/admin/attendance", { timeout: 10_000 });

    await expect(page.locator("text=출근 완료")).toBeVisible({ timeout: 10_000 });
  });

  test("전체 플로우: 대시보드 → People → Attendance 순차 이동", async ({
    page,
  }) => {
    // 1. 대시보드
    await page.goto("/admin");
    await expect(page.locator("text=안녕하세요, 관리자님")).toBeVisible({
      timeout: 10_000,
    });

    // 2. People 이동
    await page.click("text=직원 관리");
    await page.waitForURL("**/admin/people", { timeout: 10_000 });
    await expect(page.locator("text=전체")).toBeVisible({ timeout: 10_000 });

    // 3. Attendance 이동
    await page.click("text=근태 관리");
    await page.waitForURL("**/admin/attendance", { timeout: 10_000 });
    await expect(page.locator("text=출근 완료")).toBeVisible({ timeout: 10_000 });

    // 4. 대시보드로 복귀
    await page.click("text=대시보드");
    await page.waitForURL("**/admin", { timeout: 10_000 });
    await expect(page.locator("text=안녕하세요, 관리자님")).toBeVisible({
      timeout: 10_000,
    });
  });
});
