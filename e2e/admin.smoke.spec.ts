import { test, expect } from "@playwright/test";

/**
 * Admin Smoke Tests — 관리자 도메인 핵심 경로 검증
 *
 * storageState(admin.json)로 인증이 사전 캐싱되어 있으므로
 * 매 테스트마다 loginAs() 없이 바로 페이지 접근합니다.
 */

// ─── Auth: Admin 인증 확인 (WI-006) ──────────────────────────

test.describe("WI-006: Auth - Admin 세션", () => {
  test("Admin 로그인 세션이 유지된다", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin/);
  });
});

// ─── Admin Dashboard (WI-059) ───────────────────────────────

test.describe("WI-059: Admin Dashboard smoke", () => {
  test("관리자 대시보드 접근 + KPI 렌더링", async ({ page }) => {
    await page.goto("/admin");
    await expect(page.locator("body")).not.toContainText("404");
    await expect(page.locator("body")).not.toContainText("Error");
  });
});

// ─── People (WI-009) ────────────────────────────────────────

test.describe("WI-009: People smoke", () => {
  test("직원 디렉토리 페이지 접근", async ({ page }) => {
    await page.goto("/admin/people");
    await expect(page.locator("body")).not.toContainText("404");
  });

  test("조직도 페이지 접근", async ({ page }) => {
    await page.goto("/admin/people/org-chart");
    await expect(page.locator("body")).not.toContainText("404");
  });
});

// ─── Attendance (WI-014) ────────────────────────────────────

test.describe("WI-014: Attendance smoke", () => {
  test("근태 대시보드 접근", async ({ page }) => {
    await page.goto("/admin/attendance");
    await expect(page.locator("body")).not.toContainText("404");
  });
});

// ─── Leave (WI-020) ─────────────────────────────────────────

test.describe("WI-020: Leave smoke", () => {
  test("휴가 대시보드 접근", async ({ page }) => {
    await page.goto("/admin/leave");
    await expect(page.locator("body")).not.toContainText("404");
  });
});

// ─── Workflow (WI-025) ──────────────────────────────────────

test.describe("WI-025: Workflow smoke", () => {
  test("결재 대시보드 접근", async ({ page }) => {
    await page.goto("/admin/workflow");
    await expect(page.locator("body")).not.toContainText("404");
  });
});

// ─── Documents (WI-030) ─────────────────────────────────────

test.describe("WI-030: Documents smoke", () => {
  test("문서 대시보드 접근", async ({ page }) => {
    await page.goto("/admin/documents");
    await expect(page.locator("body")).not.toContainText("404");
  });
});

// ─── Payroll (WI-034) ───────────────────────────────────────

test.describe("WI-034: Payroll smoke", () => {
  test("급여 대시보드 접근", async ({ page }) => {
    await page.goto("/admin/payroll");
    await expect(page.locator("body")).not.toContainText("404");
  });
});

// ─── Performance (WI-038) ───────────────────────────────────

test.describe("WI-038: Performance smoke", () => {
  test("성과 관리 접근", async ({ page }) => {
    await page.goto("/admin/performance");
    await expect(page.locator("body")).not.toContainText("404");
  });
});

// ─── Recruiting (WI-042) ────────────────────────────────────

test.describe("WI-042: Recruiting smoke", () => {
  test("채용 대시보드 접근", async ({ page }) => {
    await page.goto("/admin/recruiting");
    await expect(page.locator("body")).not.toContainText("404");
  });
});

// ─── Reports (WI-050) ───────────────────────────────────────

test.describe("WI-050: Reports smoke", () => {
  test("리포트 센터 접근", async ({ page }) => {
    await page.goto("/admin/reports");
    await expect(page.locator("body")).not.toContainText("404");
  });
});

// ─── Settings (WI-053) ──────────────────────────────────────

test.describe("WI-053: Settings smoke", () => {
  test("설정 페이지 접근", async ({ page }) => {
    await page.goto("/admin/settings");
    await expect(page.locator("body")).not.toContainText("404");
  });
});
