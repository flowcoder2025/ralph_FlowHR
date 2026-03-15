import { test, expect } from "@playwright/test";

/**
 * Employee Smoke Tests — 직원 포탈 핵심 경로 검증
 *
 * storageState(employee.json)로 인증이 사전 캐싱되어 있으므로
 * 매 테스트마다 loginAs() 없이 바로 페이지 접근합니다.
 */

// ─── Employee Portal (WI-060) ───────────────────────────────

test.describe("WI-060: Employee Portal smoke", () => {
  test("직원 홈 접근", async ({ page }) => {
    await page.goto("/employee");
    await expect(page.locator("body")).not.toContainText("404");
  });

  test("직원 스케줄 접근", async ({ page }) => {
    await page.goto("/employee/schedule");
    await expect(page.locator("body")).not.toContainText("404");
  });

  test("직원 신청 접근", async ({ page }) => {
    await page.goto("/employee/requests");
    await expect(page.locator("body")).not.toContainText("404");
  });

  test("직원 프로필 접근", async ({ page }) => {
    await page.goto("/employee/profile");
    await expect(page.locator("body")).not.toContainText("404");
  });
});
