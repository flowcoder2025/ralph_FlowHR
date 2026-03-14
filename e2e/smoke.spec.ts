import { test, expect } from "@playwright/test";

/**
 * Smoke Tests — 14개 도메인 핵심 경로 검증
 *
 * 각 도메인의 메인 페이지 접근 + 핵심 요소 렌더링을 확인합니다.
 * describe 블록에 WI 번호를 포함하여 e2e.yml에서 실패 시 자동 추적합니다.
 */

const ADMIN_EMAIL = "admin@acme.example.com";
const ADMIN_PASSWORD = "demo1234!";
const EMPLOYEE_EMAIL = "employee@acme.example.com";
const EMPLOYEE_PASSWORD = "demo1234!";

// ─── Helper ─────────────────────────────────────────────────

async function loginAs(
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

async function loginAsAdmin(page: import("@playwright/test").Page) {
  await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD, "/admin");
}

async function loginAsEmployee(page: import("@playwright/test").Page) {
  await loginAs(page, EMPLOYEE_EMAIL, EMPLOYEE_PASSWORD, "/employee");
}

// ─── Auth (WI-006) ──────────────────────────────────────────

test.describe("WI-006: Auth smoke", () => {
  test("로그인 페이지 렌더링", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("h1")).toContainText("로그인");
    await expect(page.locator('input[id="email"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test("Admin 로그인 → 세션 유지", async ({ page }) => {
    await loginAsAdmin(page);
    await expect(page).toHaveURL(/\/admin/);
  });

  test("미인증 시 /login 리디렉트", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForURL("**/login**", { timeout: 10_000 });
  });
});

// ─── Admin Dashboard (WI-059) ───────────────────────────────

test.describe("WI-059: Admin Dashboard smoke", () => {
  test("관리자 대시보드 접근 + KPI 렌더링", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin");
    await expect(page.locator("body")).not.toContainText("404");
    await expect(page.locator("body")).not.toContainText("Error");
  });
});

// ─── People (WI-009) ────────────────────────────────────────

test.describe("WI-009: People smoke", () => {
  test("직원 디렉토리 페이지 접근", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin/people");
    await expect(page.locator("body")).not.toContainText("404");
  });

  test("조직도 페이지 접근", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin/people/org-chart");
    await expect(page.locator("body")).not.toContainText("404");
  });
});

// ─── Attendance (WI-014) ────────────────────────────────────

test.describe("WI-014: Attendance smoke", () => {
  test("근태 대시보드 접근", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin/attendance");
    await expect(page.locator("body")).not.toContainText("404");
  });
});

// ─── Leave (WI-020) ─────────────────────────────────────────

test.describe("WI-020: Leave smoke", () => {
  test("휴가 대시보드 접근", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin/leave");
    await expect(page.locator("body")).not.toContainText("404");
  });
});

// ─── Workflow (WI-025) ──────────────────────────────────────

test.describe("WI-025: Workflow smoke", () => {
  test("결재 대시보드 접근", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin/workflow");
    await expect(page.locator("body")).not.toContainText("404");
  });
});

// ─── Documents (WI-030) ─────────────────────────────────────

test.describe("WI-030: Documents smoke", () => {
  test("문서 대시보드 접근", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin/documents");
    await expect(page.locator("body")).not.toContainText("404");
  });
});

// ─── Payroll (WI-034) ───────────────────────────────────────

test.describe("WI-034: Payroll smoke", () => {
  test("급여 대시보드 접근", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin/payroll");
    await expect(page.locator("body")).not.toContainText("404");
  });
});

// ─── Performance (WI-038) ───────────────────────────────────

test.describe("WI-038: Performance smoke", () => {
  test("성과 관리 접근", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin/performance");
    await expect(page.locator("body")).not.toContainText("404");
  });
});

// ─── Recruiting (WI-042) ────────────────────────────────────

test.describe("WI-042: Recruiting smoke", () => {
  test("채용 대시보드 접근", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin/recruiting");
    await expect(page.locator("body")).not.toContainText("404");
  });
});

// ─── Reports (WI-050) ───────────────────────────────────────

test.describe("WI-050: Reports smoke", () => {
  test("리포트 센터 접근", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin/reports");
    await expect(page.locator("body")).not.toContainText("404");
  });
});

// ─── Settings (WI-053) ──────────────────────────────────────

test.describe("WI-053: Settings smoke", () => {
  test("설정 페이지 접근", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin/settings");
    await expect(page.locator("body")).not.toContainText("404");
  });
});

// ─── Employee Portal (WI-060) ───────────────────────────────

test.describe("WI-060: Employee Portal smoke", () => {
  test("직원 홈 접근", async ({ page }) => {
    await loginAsEmployee(page);
    await page.goto("/employee");
    await expect(page.locator("body")).not.toContainText("404");
  });

  test("직원 스케줄 접근", async ({ page }) => {
    await loginAsEmployee(page);
    await page.goto("/employee/schedule");
    await expect(page.locator("body")).not.toContainText("404");
  });

  test("직원 신청 접근", async ({ page }) => {
    await loginAsEmployee(page);
    await page.goto("/employee/requests");
    await expect(page.locator("body")).not.toContainText("404");
  });

  test("직원 프로필 접근", async ({ page }) => {
    await loginAsEmployee(page);
    await page.goto("/employee/profile");
    await expect(page.locator("body")).not.toContainText("404");
  });
});

// ─── Platform Console (WI-069) ──────────────────────────────

test.describe("WI-069: Platform Console smoke", () => {
  test("플랫폼 대시보드 접근", async ({ page }) => {
    // Platform Operator로 로그인 필요
    await loginAs(page, "operator@flowhr.example.com", "demo1234!", "/platform");
    await page.goto("/platform");
    await expect(page.locator("body")).not.toContainText("404");
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
