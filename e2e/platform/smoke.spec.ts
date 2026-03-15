import { test, expect } from "@playwright/test";

/**
 * Operator Smoke Tests — 플랫폼 콘솔 핵심 경로 검증
 *
 * storageState(operator.json)로 인증이 사전 캐싱되어 있으므로
 * 매 테스트마다 loginAs() 없이 바로 페이지 접근합니다.
 */

// ─── Platform Console (WI-069) ──────────────────────────────

test.describe("WI-069: Platform Console smoke", () => {
  test("플랫폼 대시보드 접근", async ({ page }) => {
    await page.goto("/platform");
    await expect(page.locator("body")).not.toContainText("404");
  });
});
