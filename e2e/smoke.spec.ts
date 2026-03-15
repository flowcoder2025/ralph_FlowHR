import { test, expect } from "@playwright/test";

/**
 * Smoke Tests — 인증 불필요 테스트
 *
 * 로그인 페이지 렌더링, 미인증 리디렉트, 랜딩 페이지 등
 * 인증 없이 검증 가능한 테스트입니다.
 *
 * 역할별 인증 테스트는 admin.smoke / employee.smoke / operator.smoke에서 실행됩니다.
 */

// ─── Auth (WI-006) ──────────────────────────────────────────

test.describe("WI-006: Auth smoke", () => {
  test("로그인 페이지 렌더링", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("h1")).toContainText("로그인");
    await expect(page.locator('input[id="email"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test("미인증 시 /login 리디렉트", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForURL("**/login**", { timeout: 10_000 });
  });
});

// ─── Landing (WI-074) ───────────────────────────────────────

test.describe("WI-074: Landing smoke", () => {
  test("랜딩 페이지 렌더링 (인증 불필요)", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("body")).not.toContainText("404");
    await expect(page.locator("body")).not.toContainText("Error");
  });
});
