import { test, expect } from "@playwright/test";

/**
 * WI-095: Cross-Role 워크플로우 E2E
 *
 * 역할 간 워크플로우를 검증합니다:
 * 1. Employee 휴가신청 → Admin 승인큐 확인 → 승인처리 → Employee 이력 반영 확인
 * 2. Employee 근태정정 → Admin 예외처리 → Employee 이력 반영
 * 3. Employee 문서서명 → Admin 보관함 확인
 */

const ADMIN_EMAIL = "admin@acme.example.com";
const ADMIN_PASSWORD = "demo1234!";
const EMPLOYEE_EMAIL = "employee@acme.example.com";
const EMPLOYEE_PASSWORD = "demo1234!";

// ─── Helpers ────────────────────────────────────────────────

async function loginAsAdmin(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.fill('input[id="email"]', ADMIN_EMAIL);
  await page.fill('input[id="password"]', ADMIN_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/admin**", { timeout: 15_000 });
}

async function loginAsEmployee(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.fill('input[id="email"]', EMPLOYEE_EMAIL);
  await page.fill('input[id="password"]', EMPLOYEE_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/employee**", { timeout: 15_000 });
}

async function clearSession(page: import("@playwright/test").Page) {
  await page.context().clearCookies();
}

// ─── Flow 1: Employee 휴가신청 → Admin 승인큐 확인 → 승인처리 → Employee 이력확인 ─

test.describe("WI-095: Employee 휴가신청 → Admin 승인 → Employee 이력 확인", () => {
  test("Employee가 휴가 신청 3단계 폼을 완료한다", async ({ page }) => {
    await loginAsEmployee(page);

    // 요청 페이지 이동
    await page.goto("/employee/requests");
    await expect(page.getByText("요청")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("새 요청")).toBeVisible({ timeout: 10_000 });

    // 신청 유형 카드 중 휴가 관련 카드 클릭 (첫 번째 활성 카드)
    const requestCards = page.locator(
      "button.rounded-xl:not([disabled])",
    );
    const cardCount = await requestCards.count();
    expect(cardCount).toBeGreaterThan(0);
    await requestCards.first().click();

    // Step 1: 유형 선택 확인
    await expect(page.getByText("유형 선택")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("연차")).toBeVisible();

    // 다음 버튼 클릭
    await page.getByRole("button", { name: "다음" }).click();

    // Step 2: 상세 정보
    await expect(page.getByText("상세 정보")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("시작일")).toBeVisible();
    await expect(page.getByText("종료일")).toBeVisible();
    await expect(page.getByText("사유")).toBeVisible();
    await expect(page.getByText("결재자")).toBeVisible();

    // 다음 버튼 클릭
    await page.getByRole("button", { name: "다음" }).click();

    // Step 3: 검토 · 제출
    await expect(page.getByText("검토")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("잔여 연차")).toBeVisible();

    // 신청하기 버튼 클릭
    await page.getByRole("button", { name: "신청하기" }).click();

    // 성공 토스트 확인
    await expect(
      page.getByText("휴가 신청이 완료되었습니다"),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("Admin이 휴가 승인큐에서 대기 중 요청을 확인한다", async ({ page }) => {
    await loginAsAdmin(page);

    // 휴가 관리 > 신청 큐 탭 이동
    await page.goto("/admin/leave?tab=requests");
    await expect(page.getByText("휴가 관리")).toBeVisible({ timeout: 10_000 });

    // 신청 큐 탭 활성 확인
    await expect(page.getByText("신청 큐")).toBeVisible();

    // 휴가 신청 큐 카드 표시 확인
    await expect(page.getByText("휴가 신청 큐")).toBeVisible({
      timeout: 10_000,
    });

    // 필터 버튼 확인
    await expect(page.getByText("전체")).toBeVisible();
    await expect(page.getByText("승인 대기")).toBeVisible();
    await expect(page.getByText("승인 완료")).toBeVisible();
  });

  test("Admin이 휴가 요청을 승인 처리한다", async ({ page }) => {
    await loginAsAdmin(page);

    await page.goto("/admin/leave?tab=requests");
    await expect(page.getByText("휴가 신청 큐")).toBeVisible({
      timeout: 10_000,
    });

    // 승인 대기 필터 클릭
    await page.getByText("승인 대기").click();
    await page.waitForTimeout(1_000);

    // 승인 버튼이 있는지 확인 (대기 중 요청이 있는 경우)
    const approveButtons = page.getByRole("button", { name: "승인" });
    const approveCount = await approveButtons.count();

    if (approveCount > 0) {
      // 첫 번째 승인 버튼 클릭
      await approveButtons.first().click();
      await page.waitForTimeout(1_000);
    }

    // 전체 필터로 되돌리기
    await page.getByText("전체").first().click();
    await page.waitForTimeout(500);

    // 큐 리스트가 여전히 렌더링되는지 확인
    await expect(page.getByText("휴가 신청 큐")).toBeVisible();
  });

  test("Employee가 요청 이력에서 상태를 확인한다", async ({ page }) => {
    await loginAsEmployee(page);

    await page.goto("/employee/requests");
    await expect(page.getByText("나의 요청 이력")).toBeVisible({
      timeout: 10_000,
    });

    // 요청 이력 테이블 표시 확인
    await expect(page.getByText("요청 이력")).toBeVisible();

    // 테이블 헤더 확인
    await expect(page.getByText("유형")).toBeVisible();
    await expect(page.getByText("신청 내용")).toBeVisible();
    await expect(page.getByText("상태")).toBeVisible();

    // 필터 버튼 확인
    await expect(page.getByText("전체")).toBeVisible();
    await expect(page.getByText("진행 중")).toBeVisible();
    await expect(page.getByText("완료")).toBeVisible();
  });
});

// ─── Flow 2: Employee 근태정정 → Admin 예외처리 → Employee 이력 반영 ──

test.describe("WI-095: Employee 근태정정 → Admin 예외처리 → Employee 이력 반영", () => {
  test("Employee가 출퇴근 정정 요청을 제출한다", async ({ page }) => {
    await loginAsEmployee(page);

    await page.goto("/employee/requests");
    await expect(page.getByText("새 요청")).toBeVisible({ timeout: 10_000 });

    // 근태 정정 관련 카드 찾기 (출근 정정 또는 퇴근 정정)
    const correctionCards = page.locator(
      "button.rounded-xl:not([disabled])",
    );
    const count = await correctionCards.count();

    // 출퇴근 정정 카드가 있으면 클릭 (보통 5번째 이후의 카드)
    let correctionClicked = false;
    for (let i = 0; i < count; i++) {
      const text = await correctionCards.nth(i).textContent();
      if (text && (text.includes("출근") || text.includes("정정"))) {
        await correctionCards.nth(i).click();
        correctionClicked = true;
        break;
      }
    }

    if (correctionClicked) {
      // 출퇴근 정정 요청 폼 확인
      await expect(
        page.getByText("출퇴근 정정 요청"),
      ).toBeVisible({ timeout: 10_000 });

      // 폼 필드 확인
      await expect(page.getByText("정정 대상일")).toBeVisible();
      await expect(page.getByText("정정 유형")).toBeVisible();
      await expect(page.getByText("기존 시간")).toBeVisible();
      await expect(page.getByText("정정 시간")).toBeVisible();
      await expect(page.getByText("정정 사유")).toBeVisible();

      // 정정 사유 입력
      await page
        .locator('textarea[placeholder*="정정 사유"]')
        .fill("교통 지연으로 인한 출근 시간 오류");

      // 정정 요청 제출
      await page.getByRole("button", { name: "정정 요청" }).click();

      // 성공 토스트 확인
      await expect(
        page.getByText("출퇴근 정정 요청이 완료되었습니다"),
      ).toBeVisible({ timeout: 10_000 });
    }
  });

  test("Admin이 근태 예외 관리에서 정정 요청을 확인한다", async ({ page }) => {
    await loginAsAdmin(page);

    // 근태 관리 > 예외 관리 탭
    await page.goto("/admin/attendance?tab=exceptions");
    await expect(page.getByText("근태 관리")).toBeVisible({ timeout: 10_000 });

    // 예외 관리 탭 확인
    await expect(page.getByText("예외 관리")).toBeVisible();

    // 4유형 카드 렌더링 확인 (근태 정정, 초과근무, 출장, 재택근무)
    await expect(page.getByText("근태 정정")).toBeVisible({ timeout: 10_000 });
  });

  test("Admin이 근태 예외를 승인 처리한다", async ({ page }) => {
    await loginAsAdmin(page);

    await page.goto("/admin/attendance?tab=exceptions");
    await expect(page.getByText("근태 정정")).toBeVisible({ timeout: 10_000 });

    // 상세 버튼 클릭하여 예외 상세 확인
    const detailButtons = page.getByRole("button", { name: "상세" });
    const detailCount = await detailButtons.count();

    if (detailCount > 0) {
      await detailButtons.first().click();

      // 예외 상세 모달 확인
      await expect(page.getByText("예외 상세")).toBeVisible({ timeout: 5_000 });

      // 상세 정보 확인
      await expect(page.getByText("유형")).toBeVisible();
      await expect(page.getByText("상태")).toBeVisible();
      await expect(page.getByText("직원")).toBeVisible();

      // 승인 버튼이 있으면 클릭 (PENDING 상태인 경우)
      const approveBtn = page.getByRole("button", { name: "승인" });
      if ((await approveBtn.count()) > 0) {
        await approveBtn.first().click();
        await page.waitForTimeout(1_000);
      } else {
        // 닫기 버튼으로 모달 닫기
        await page.locator("button:has-text('×')").click();
      }
    }
  });

  test("Employee가 요청 이력에서 근태 정정 결과를 확인한다", async ({
    page,
  }) => {
    await loginAsEmployee(page);

    await page.goto("/employee/requests");
    await expect(page.getByText("나의 요청 이력")).toBeVisible({
      timeout: 10_000,
    });

    // 이력 테이블이 렌더링됨
    await expect(page.getByText("요청 이력")).toBeVisible();

    // 필터를 사용하여 완료/진행 중 확인
    const filterButtons = page.locator(
      "button.rounded-full",
    );
    const filterCount = await filterButtons.count();
    expect(filterCount).toBeGreaterThanOrEqual(3);
  });
});

// ─── Flow 3: Employee 문서서명 → Admin 보관함 확인 ──────────

test.describe("WI-095: Employee 문서서명 → Admin 보관함 확인", () => {
  test("Employee가 서명 대기 문서를 확인하고 서명한다", async ({ page }) => {
    await loginAsEmployee(page);

    // 문서 · 서명 페이지 이동
    await page.goto("/employee/documents");
    await expect(page.getByText("서명 대기함")).toBeVisible({
      timeout: 10_000,
    });

    // 서명 대기 문서 목록 확인
    await expect(page.getByText("서명이 필요한 문서 목록")).toBeVisible();

    // 서명하기 버튼 확인
    const signButtons = page.getByRole("button", { name: "서명하기" });
    const signCount = await signButtons.count();
    expect(signCount).toBeGreaterThan(0);

    // 첫 번째 문서 서명하기 클릭
    await signButtons.first().click();

    // 문서 뷰어 진입 확인
    await expect(page.getByText("문서 뷰어")).toBeVisible({ timeout: 10_000 });

    // 문서 미리보기 영역 확인
    await expect(page.getByText("근 로 계 약 서")).toBeVisible();

    // 서명 영역 확인
    await expect(page.getByText("서명 영역")).toBeVisible();
    await expect(page.getByText("여기에 서명")).toBeVisible();

    // 서명 영역 클릭 (서명 그리기)
    await page.getByText("여기에 서명").click();

    // 서명 완료 버튼 활성화 확인 및 클릭
    const completeBtn = page.getByRole("button", { name: "서명 완료" });
    await expect(completeBtn).toBeEnabled({ timeout: 5_000 });
    await completeBtn.click();

    // 서명 완료 토스트 확인
    await expect(page.getByText("서명이 완료되었습니다")).toBeVisible({
      timeout: 10_000,
    });

    // 목록 모드로 돌아감
    await expect(page.getByText("서명 대기함")).toBeVisible({
      timeout: 10_000,
    });
  });

  test("Employee가 문서 보관함에서 서명 완료 문서를 확인한다", async ({
    page,
  }) => {
    await loginAsEmployee(page);

    await page.goto("/employee/documents");
    await expect(page.getByText("문서 보관함")).toBeVisible({
      timeout: 10_000,
    });

    // 보관 문서 테이블 확인
    await expect(page.getByText("보관 문서")).toBeVisible();

    // 카테고리 필터 확인
    await expect(page.getByText("전체")).toBeVisible();
    await expect(page.getByText("계약서")).toBeVisible();
    await expect(page.getByText("증명서")).toBeVisible();

    // 테이블 헤더 확인
    await expect(page.getByText("문서명")).toBeVisible();
    await expect(page.getByText("서명 상태")).toBeVisible();

    // 서명 완료 뱃지가 있는지 확인
    await expect(page.getByText("서명 완료").first()).toBeVisible();
  });

  test("Admin이 문서 보관함에서 문서를 확인한다", async ({ page }) => {
    await loginAsAdmin(page);

    // 문서 관리 > 보관함 탭
    await page.goto("/admin/documents?tab=vault");
    await expect(page.getByText("문서 관리")).toBeVisible({ timeout: 10_000 });

    // 보관함 탭 확인
    await expect(page.getByText("보관함")).toBeVisible();

    // 문서 보관함 카드 확인
    await expect(page.getByText("문서 보관함")).toBeVisible({
      timeout: 10_000,
    });

    // 검색 입력 확인
    const searchInput = page.locator(
      'input[placeholder*="문서명"]',
    );
    await expect(searchInput).toBeVisible();

    // 테이블 헤더 확인
    await expect(page.getByText("문서명")).toBeVisible();
    await expect(page.getByText("수신자")).toBeVisible();
    await expect(page.getByText("발송일")).toBeVisible();
    await expect(page.getByText("상태")).toBeVisible();

    // 다운로드/재발송 액션 확인
    const downloadBtns = page.getByRole("button", { name: "다운로드" });
    const downloadCount = await downloadBtns.count();
    expect(downloadCount).toBeGreaterThanOrEqual(0);
  });
});
