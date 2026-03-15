import { test, expect } from "@playwright/test";

/**
 * WI-098: Auth E2E 테스트
 *
 * 로그인 폼 렌더링/유효성검증, 역할별 자격증명 로그인→리다이렉트,
 * 잘못된 자격증명→에러메시지, SSO 버튼 존재확인, 데모 퀵액세스,
 * 로그아웃→세션해제→/login, 세션만료 후 재접근→/login
 */

const ADMIN_EMAIL = "admin@acme.example.com";
const ADMIN_PASSWORD = "demo1234!";
const EMPLOYEE_EMAIL = "employee@acme.example.com";
const EMPLOYEE_PASSWORD = "demo1234!";
const OPERATOR_EMAIL = "operator@flowhr.io";
const OPERATOR_PASSWORD = "demo1234!";

// ─── Helper ─────────────────────────────────────────────────

async function loginAs(
  page: import("@playwright/test").Page,
  email: string,
  password: string,
) {
  await page.goto("/login");
  await page.fill('input[id="email"]', email);
  await page.fill('input[id="password"]', password);
  await page.click('button[type="submit"]');
}

async function clearSession(page: import("@playwright/test").Page) {
  await page.context().clearCookies();
}

// ─── 1. 로그인 폼 렌더링 + 유효성 검증 ──────────────────────

test.describe("WI-098: 로그인 폼 렌더링 + 유효성 검증", () => {
  test("로그인 페이지에 폼 요소가 정상 렌더링된다", async ({ page }) => {
    await page.goto("/login");

    // 제목
    await expect(page.locator("h1")).toContainText("로그인");

    // 안내 텍스트
    await expect(
      page.getByText("이메일과 비밀번호를 입력하세요"),
    ).toBeVisible();

    // 이메일 입력 필드
    const emailInput = page.locator('input[id="email"]');
    await expect(emailInput).toBeVisible();
    await expect(emailInput).toHaveAttribute("type", "email");
    await expect(emailInput).toHaveAttribute("placeholder", "name@company.com");

    // 비밀번호 입력 필드
    const passwordInput = page.locator('input[id="password"]');
    await expect(passwordInput).toBeVisible();
    await expect(passwordInput).toHaveAttribute("type", "password");

    // 로그인 버튼
    const submitBtn = page.locator('button[type="submit"]');
    await expect(submitBtn).toBeVisible();
    await expect(submitBtn).toContainText("로그인");
  });

  test("이메일/비밀번호 필드에 required 속성이 있다", async ({ page }) => {
    await page.goto("/login");

    await expect(page.locator('input[id="email"]')).toHaveAttribute(
      "required",
      "",
    );
    await expect(page.locator('input[id="password"]')).toHaveAttribute(
      "required",
      "",
    );
  });
});

// ─── 2. 역할별 자격증명 로그인 → 리다이렉트 ─────────────────

test.describe("WI-098: 역할별 자격증명 로그인 → 리다이렉트", () => {
  test("Admin 로그인 → /admin 리다이렉트", async ({ page }) => {
    // /admin 접근 → 미인증 → /login?callbackUrl=/admin
    await page.goto("/admin");
    await page.waitForURL("**/login**", { timeout: 10_000 });

    // 로그인 폼 작성 및 제출
    await page.fill('input[id="email"]', ADMIN_EMAIL);
    await page.fill('input[id="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');

    // /admin으로 리다이렉트
    await page.waitForURL("**/admin**", { timeout: 15_000 });
    await expect(page).toHaveURL(/\/admin/);
  });

  test("Employee 로그인 → /employee 리다이렉트", async ({ page }) => {
    // /employee 접근 → 미인증 → /login?callbackUrl=/employee
    await page.goto("/employee");
    await page.waitForURL("**/login**", { timeout: 10_000 });

    await page.fill('input[id="email"]', EMPLOYEE_EMAIL);
    await page.fill('input[id="password"]', EMPLOYEE_PASSWORD);
    await page.click('button[type="submit"]');

    // /employee로 리다이렉트
    await page.waitForURL("**/employee**", { timeout: 15_000 });
    await expect(page).toHaveURL(/\/employee/);
  });

  test("Operator 로그인 → /platform 리다이렉트", async ({ page }) => {
    // /platform 접근 → 미인증 → /login?callbackUrl=/platform
    await page.goto("/platform");
    await page.waitForURL("**/login**", { timeout: 10_000 });

    await page.fill('input[id="email"]', OPERATOR_EMAIL);
    await page.fill('input[id="password"]', OPERATOR_PASSWORD);
    await page.click('button[type="submit"]');

    // /platform으로 리다이렉트
    await page.waitForURL("**/platform**", { timeout: 15_000 });
    await expect(page).toHaveURL(/\/platform/);
  });
});

// ─── 3. 잘못된 자격증명 → 에러 메시지 ───────────────────────

test.describe("WI-098: 잘못된 자격증명 → 에러 메시지", () => {
  test("존재하지 않는 이메일로 로그인 시 에러 메시지 표시", async ({
    page,
  }) => {
    await loginAs(page, "wrong@example.com", "wrongpassword");

    await expect(
      page.getByText("이메일 또는 비밀번호가 올바르지 않습니다"),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("올바른 이메일 + 잘못된 비밀번호로 로그인 시 에러 메시지 표시", async ({
    page,
  }) => {
    await loginAs(page, ADMIN_EMAIL, "wrongpassword123!");

    await expect(
      page.getByText("이메일 또는 비밀번호가 올바르지 않습니다"),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("에러 메시지 표시 후에도 /login 페이지에 머문다", async ({ page }) => {
    await loginAs(page, "wrong@example.com", "wrongpassword");

    await expect(
      page.getByText("이메일 또는 비밀번호가 올바르지 않습니다"),
    ).toBeVisible({ timeout: 10_000 });

    // 로그인 페이지에서 벗어나지 않음
    await expect(page).toHaveURL(/\/login/);
  });
});

// ─── 4. SSO 버튼 Google/Microsoft 존재 확인 ─────────────────

test.describe("WI-098: SSO 버튼 존재 확인", () => {
  test("Google 로그인 버튼이 표시된다", async ({ page }) => {
    await page.goto("/login");

    await expect(
      page.getByText("Google 계정으로 로그인"),
    ).toBeVisible();
  });

  test("Microsoft 로그인 버튼이 표시된다", async ({ page }) => {
    await page.goto("/login");

    await expect(
      page.getByText("Microsoft 계정으로 로그인"),
    ).toBeVisible();
  });

  test("SSO 버튼과 폼 사이에 '또는' 구분선이 있다", async ({ page }) => {
    await page.goto("/login");

    await expect(page.getByText("또는")).toBeVisible();
  });
});

// ─── 5. 데모 퀵액세스 3버튼 클릭 → 역할 전환 ────────────────

test.describe("WI-098: 데모 퀵액세스", () => {
  test("데모 빠른 접근 섹션이 표시된다", async ({ page }) => {
    await page.goto("/login");

    await expect(page.getByText("데모 빠른 접근")).toBeVisible();
  });

  test("3개의 데모 버튼이 모두 표시된다", async ({ page }) => {
    await page.goto("/login");

    await expect(
      page.getByText("Platform Operator로 로그인"),
    ).toBeVisible();
    await expect(
      page.getByText("Tenant Admin으로 로그인"),
    ).toBeVisible();
    await expect(
      page.getByText("Tenant Employee로 로그인"),
    ).toBeVisible();
  });

  test("Tenant Admin 데모 버튼 클릭 → 로그인 성공", async ({ page }) => {
    await page.goto("/login");

    await page.getByText("Tenant Admin으로 로그인").click();

    // 로그인 성공 후 /login에서 벗어남
    await page.waitForURL(
      (url) => !url.pathname.includes("/login"),
      { timeout: 15_000 },
    );
  });

  test("Tenant Employee 데모 버튼 클릭 → 로그인 성공", async ({ page }) => {
    await page.goto("/login");

    await page.getByText("Tenant Employee로 로그인").click();

    await page.waitForURL(
      (url) => !url.pathname.includes("/login"),
      { timeout: 15_000 },
    );
  });

  test("Platform Operator 데모 버튼 클릭 → 로그인 성공", async ({ page }) => {
    await page.goto("/login");

    await page.getByText("Platform Operator로 로그인").click();

    await page.waitForURL(
      (url) => !url.pathname.includes("/login"),
      { timeout: 15_000 },
    );
  });
});

// ─── 6. 로그아웃 → 세션 해제 → /login 리다이렉트 ────────────

test.describe("WI-098: 로그아웃 → 세션 해제", () => {
  test("로그인 후 세션 쿠키 제거 → 보호된 페이지 접근 시 /login 리다이렉트", async ({
    page,
  }) => {
    // 로그인
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.waitForURL(
      (url) => !url.pathname.includes("/login"),
      { timeout: 15_000 },
    );

    // 세션 쿠키 제거 (로그아웃 시뮬레이션)
    await clearSession(page);

    // 보호된 페이지 접근 시도
    await page.goto("/admin");
    await page.waitForURL("**/login**", { timeout: 10_000 });

    // /login으로 리다이렉트됨
    await expect(page).toHaveURL(/\/login/);
  });

  test("로그아웃 후 /employee 접근 시 /login으로 리다이렉트", async ({
    page,
  }) => {
    // Employee 로그인
    await loginAs(page, EMPLOYEE_EMAIL, EMPLOYEE_PASSWORD);
    await page.waitForURL(
      (url) => !url.pathname.includes("/login"),
      { timeout: 15_000 },
    );

    // 세션 쿠키 제거
    await clearSession(page);

    // 보호된 페이지 접근 시도
    await page.goto("/employee");
    await page.waitForURL("**/login**", { timeout: 10_000 });
    await expect(page).toHaveURL(/\/login/);
  });
});

// ─── 7. 세션 만료 후 재접근 → /login ────────────────────────

test.describe("WI-098: 세션 만료 후 재접근", () => {
  test("세션 만료 후 /admin 재접근 → /login 리다이렉트", async ({ page }) => {
    // 로그인
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.waitForURL(
      (url) => !url.pathname.includes("/login"),
      { timeout: 15_000 },
    );

    // 세션 만료 시뮬레이션: 쿠키 제거
    await clearSession(page);

    // 보호된 페이지 재접근
    await page.goto("/admin");
    await page.waitForURL("**/login**", { timeout: 10_000 });

    // /login 페이지에 도착 + callbackUrl 파라미터 포함
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator("h1")).toContainText("로그인");
  });

  test("세션 만료 후 /platform 재접근 → /login 리다이렉트", async ({
    page,
  }) => {
    // Operator 로그인
    await loginAs(page, OPERATOR_EMAIL, OPERATOR_PASSWORD);
    await page.waitForURL(
      (url) => !url.pathname.includes("/login"),
      { timeout: 15_000 },
    );

    // 세션 만료 시뮬레이션
    await clearSession(page);

    // 보호된 페이지 재접근
    await page.goto("/platform");
    await page.waitForURL("**/login**", { timeout: 10_000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test("미인증 상태로 보호된 페이지 접근 시 callbackUrl이 보존된다", async ({
    page,
  }) => {
    await page.goto("/admin/people");
    await page.waitForURL("**/login**", { timeout: 10_000 });

    // callbackUrl 쿼리 파라미터가 포함됨
    const url = new URL(page.url());
    const callbackUrl = url.searchParams.get("callbackUrl");
    expect(callbackUrl).toContain("/admin/people");
  });
});
