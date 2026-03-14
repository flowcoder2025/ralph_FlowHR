import { test, expect } from "@playwright/test";

/**
 * E2E 핵심 플로우: 로그인 → 대시보드 → People → Attendance
 *
 * 데모 Admin 계정(admin@acme.example.com)으로 로그인 후
 * 관리자 핵심 페이지를 순회하며 정상 렌더링을 검증합니다.
 */

const ADMIN_EMAIL = "admin@acme.example.com";
const ADMIN_PASSWORD = "demo1234!";

// ─── Helper ─────────────────────────────────────────────────

async function loginAsAdmin(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await expect(page.locator("h1")).toContainText("로그인");

  await page.fill('input[id="email"]', ADMIN_EMAIL);
  await page.fill('input[id="password"]', ADMIN_PASSWORD);
  await page.click('button[type="submit"]');

  // 로그인 후 /admin 대시보드로 리디렉트 대기
  await page.waitForURL("**/admin**", { timeout: 15_000 });
}

// ─── Tests ──────────────────────────────────────────────────

test.describe("핵심 플로우: 로그인 → 대시보드 → People → Attendance", () => {
  test("로그인 페이지가 정상 렌더링된다", async ({ page }) => {
    await page.goto("/login");

    // 브랜드명, 로그인 폼 확인
    await expect(page.locator("h1")).toContainText("로그인");
    await expect(page.locator('input[id="email"]')).toBeVisible();
    await expect(page.locator('input[id="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test("데모 빠른 접근 버튼이 3개 표시된다", async ({ page }) => {
    await page.goto("/login");

    const demoSection = page.locator("text=데모 빠른 접근");
    await expect(demoSection).toBeVisible();

    // 데모 버튼: Platform Operator, Tenant Admin, Tenant Employee
    const demoButtons = page.locator("button", { hasText: "로그인" }).filter({
      has: page.locator("span"),
    });
    // At least the 3 demo buttons exist
    await expect(page.getByText("Platform Operator로 로그인")).toBeVisible();
    await expect(page.getByText("Tenant Admin으로 로그인")).toBeVisible();
    await expect(page.getByText("Tenant Employee로 로그인")).toBeVisible();
  });

  test("잘못된 자격 증명으로 로그인 실패 시 에러 표시", async ({ page }) => {
    await page.goto("/login");

    await page.fill('input[id="email"]', "wrong@example.com");
    await page.fill('input[id="password"]', "wrongpassword");
    await page.click('button[type="submit"]');

    // 에러 메시지 확인
    await expect(
      page.locator("text=이메일 또는 비밀번호가 올바르지 않습니다"),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("Admin 로그인 → 대시보드 진입", async ({ page }) => {
    await loginAsAdmin(page);

    // 대시보드 헤더 확인
    await expect(page.locator("text=안녕하세요, 관리자님")).toBeVisible({
      timeout: 10_000,
    });

    // KPI 카드 영역 확인
    await expect(page.locator("text=승인 필요")).toBeVisible();
    await expect(page.locator("text=근태 이상")).toBeVisible();
  });

  test("대시보드 → People(직원 관리) 페이지 이동", async ({ page }) => {
    await loginAsAdmin(page);

    // 사이드바에서 "직원 관리" 클릭
    await page.click("text=직원 관리");
    await page.waitForURL("**/admin/people", { timeout: 10_000 });

    // People 페이지 핵심 요소 확인 (검색, 상태 필터, 테이블)
    await expect(page.locator("text=전체")).toBeVisible({ timeout: 10_000 });
    await expect(page.locator("text=재직 중")).toBeVisible();
  });

  test("People → Attendance(근태 관리) 페이지 이동", async ({ page }) => {
    await loginAsAdmin(page);

    // 사이드바에서 "근태 관리" 클릭
    await page.click("text=근태 관리");
    await page.waitForURL("**/admin/attendance", { timeout: 10_000 });

    // Attendance 페이지 KPI 영역 확인
    await expect(page.locator("text=출근 완료")).toBeVisible({ timeout: 10_000 });
  });

  test("전체 플로우: 로그인 → 대시보드 → People → Attendance 순차 이동", async ({
    page,
  }) => {
    // 1. 로그인
    await loginAsAdmin(page);
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

  test("인증 없이 /admin 접근 시 /login으로 리디렉트", async ({ page }) => {
    await page.goto("/admin");

    // 인증 없으면 /login으로 리디렉트
    await page.waitForURL("**/login**", { timeout: 10_000 });
    await expect(page.locator("h1")).toContainText("로그인");
  });
});
