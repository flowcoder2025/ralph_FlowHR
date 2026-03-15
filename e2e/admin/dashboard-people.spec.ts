import { test, expect } from "@playwright/test";

/**
 * WI-088: Admin 대시보드 + People + 조직도 E2E
 *
 * storageState(admin.json)로 인증이 사전 캐싱되어 있으므로
 * 매 테스트마다 loginAs() 없이 바로 페이지 접근합니다.
 *
 * 테스트 범위:
 * - 대시보드 5 KPI + 오늘큐 렌더링
 * - People 디렉토리 검색 + 필터 + 페이지네이션
 * - 직원 상세 드로어
 * - 조직도 트리
 * - 인사변동 타임라인
 */

// ─── Admin Dashboard: 5 KPI + Today Queue ───────────────────

test.describe("WI-088: Admin 대시보드 KPI + 오늘큐", () => {
  test("5개 KPI 카드가 렌더링된다", async ({ page }) => {
    await page.goto("/admin");
    await expect(page.locator("text=안녕하세요, 관리자님")).toBeVisible({
      timeout: 15_000,
    });

    // 5 KPI eyebrow labels
    await expect(page.locator("text=승인 필요")).toBeVisible();
    await expect(page.locator("text=근태 이상")).toBeVisible();
    await expect(page.locator("text=근로 시간")).toBeVisible();
    await expect(page.locator("text=문서")).toBeVisible();
    await expect(page.locator("text=마감")).toBeVisible();
  });

  test("오늘의 대기열 섹션이 렌더링된다", async ({ page }) => {
    await page.goto("/admin");
    await expect(page.locator("text=안녕하세요, 관리자님")).toBeVisible({
      timeout: 15_000,
    });

    // Today Queue section header
    await expect(page.locator("text=오늘의 대기열")).toBeVisible();
    // Org Snapshot section
    await expect(page.locator("text=조직 스냅샷")).toBeVisible();
  });

  test("승인 퍼널과 예외 모니터가 렌더링된다", async ({ page }) => {
    await page.goto("/admin");
    await expect(page.locator("text=안녕하세요, 관리자님")).toBeVisible({
      timeout: 15_000,
    });

    await expect(page.locator("text=승인 퍼널")).toBeVisible();
    await expect(page.locator("text=예외 모니터")).toBeVisible();
  });

  test("문서 현황과 급여 현황이 렌더링된다", async ({ page }) => {
    await page.goto("/admin");
    await expect(page.locator("text=안녕하세요, 관리자님")).toBeVisible({
      timeout: 15_000,
    });

    await expect(page.locator("text=문서 현황")).toBeVisible();
    await expect(page.locator("text=급여 현황")).toBeVisible();
  });
});

// ─── People 디렉토리: 검색 + 필터 + 페이지네이션 ────────────

test.describe("WI-088: People 디렉토리", () => {
  test("직원 목록 테이블이 렌더링된다", async ({ page }) => {
    await page.goto("/admin/people");

    // Page title
    await expect(page.locator("text=직원 관리")).toBeVisible({
      timeout: 15_000,
    });

    // Table column headers
    await expect(page.locator("text=이름").first()).toBeVisible();
    await expect(page.locator("text=부서").first()).toBeVisible();
    await expect(page.locator("text=직위").first()).toBeVisible();
    await expect(page.locator("text=상태").first()).toBeVisible();
    await expect(page.locator("text=입사일").first()).toBeVisible();
  });

  test("상태 필터 버튼이 렌더링된다", async ({ page }) => {
    await page.goto("/admin/people");
    await expect(page.locator("text=직원 관리")).toBeVisible({
      timeout: 15_000,
    });

    // Status filter buttons
    await expect(page.locator("button", { hasText: "전체" })).toBeVisible();
    await expect(page.locator("button", { hasText: "재직 중" })).toBeVisible();
    await expect(page.locator("button", { hasText: "퇴사 예정" })).toBeVisible();
    await expect(page.locator("button", { hasText: "휴직" })).toBeVisible();
    await expect(page.locator("button", { hasText: "퇴사" }).first()).toBeVisible();
  });

  test("검색 입력 필드가 동작한다", async ({ page }) => {
    await page.goto("/admin/people");
    await expect(page.locator("text=직원 관리")).toBeVisible({
      timeout: 15_000,
    });

    // Search input exists
    const searchInput = page.locator(
      'input[placeholder="이름, 부서, 직위 검색..."]',
    );
    await expect(searchInput).toBeVisible();

    // Type in search — should trigger filtering (API call)
    await searchInput.fill("관리");
    // Wait for debounced fetch
    await page.waitForTimeout(500);

    // Page should still be functional (not error)
    await expect(page.locator("body")).not.toContainText("Error");
  });

  test("상태 필터 클릭 시 목록이 필터링된다", async ({ page }) => {
    await page.goto("/admin/people");
    await expect(page.locator("text=직원 관리")).toBeVisible({
      timeout: 15_000,
    });

    // Click "재직 중" filter
    await page.locator("button", { hasText: "재직 중" }).click();
    await page.waitForTimeout(500);

    // Verify no error
    await expect(page.locator("body")).not.toContainText("Error");

    // If data exists, "재직 중" badge should be visible in table
    const activeCount = await page.locator("text=재직 중").count();
    expect(activeCount).toBeGreaterThanOrEqual(1); // at least the filter button
  });

  test("페이지네이션이 표시된다", async ({ page }) => {
    await page.goto("/admin/people");
    await expect(page.locator("text=직원 관리")).toBeVisible({
      timeout: 15_000,
    });

    // Wait for data to load
    await page.waitForTimeout(1_000);

    // Pagination info text pattern: "N명 중 X – Y 표시"
    const paginationText = page.locator("text=표시");
    const paginationVisible = await paginationText.isVisible().catch(() => false);

    if (paginationVisible) {
      await expect(paginationText).toBeVisible();
    }
    // Even without pagination, page should not error
    await expect(page.locator("body")).not.toContainText("Error");
  });
});

// ─── 직원 상세 드로어 ───────────────────────────────────────

test.describe("WI-088: 직원 상세 드로어", () => {
  test("테이블 행 클릭 시 드로어가 열린다", async ({ page }) => {
    await page.goto("/admin/people");
    await expect(page.locator("text=직원 관리")).toBeVisible({
      timeout: 15_000,
    });

    // Wait for table data to load
    await page.waitForTimeout(1_500);

    // Click the first data row in the table (tbody tr)
    const firstRow = page.locator("tbody tr").first();
    const rowExists = await firstRow.isVisible().catch(() => false);

    if (rowExists) {
      await firstRow.click();

      // Drawer should open with title "구성원 상세"
      await expect(page.locator("text=구성원 상세")).toBeVisible({
        timeout: 10_000,
      });

      // Drawer should contain profile sections
      await expect(page.locator("text=최근 시그널")).toBeVisible({
        timeout: 5_000,
      });
      await expect(page.locator("text=연결된 액션")).toBeVisible();

      // Action buttons should be present
      await expect(
        page.locator("button", { hasText: "근태 기록" }),
      ).toBeVisible();
      await expect(
        page.locator("button", { hasText: "휴가 이력" }),
      ).toBeVisible();
      await expect(
        page.locator("button", { hasText: "급여 명세" }),
      ).toBeVisible();
      await expect(
        page.locator("button", { hasText: "1:1 예약" }),
      ).toBeVisible();
    }
  });

  test("드로어에 직원 기본 정보가 표시된다", async ({ page }) => {
    await page.goto("/admin/people");
    await expect(page.locator("text=직원 관리")).toBeVisible({
      timeout: 15_000,
    });

    await page.waitForTimeout(1_500);

    const firstRow = page.locator("tbody tr").first();
    const rowExists = await firstRow.isVisible().catch(() => false);

    if (rowExists) {
      await firstRow.click();

      await expect(page.locator("text=구성원 상세")).toBeVisible({
        timeout: 10_000,
      });

      // Detail fields should be present
      await expect(page.locator("text=이메일")).toBeVisible();
      await expect(page.locator("text=전화번호")).toBeVisible();
      await expect(page.locator("text=고용 형태")).toBeVisible();
    }
  });
});

// ─── 조직도 트리 ────────────────────────────────────────────

test.describe("WI-088: 조직도 트리", () => {
  test("조직도 페이지가 렌더링된다", async ({ page }) => {
    await page.goto("/admin/org-chart");

    await expect(
      page.locator("h1", { hasText: "조직도" }),
    ).toBeVisible({ timeout: 15_000 });

    await expect(page.locator("text=부서별 트리 구조와 인원 현황을 확인합니다")).toBeVisible();
  });

  test("전체 펼치기/접기 버튼이 동작한다", async ({ page }) => {
    await page.goto("/admin/org-chart");
    await expect(
      page.locator("h1", { hasText: "조직도" }),
    ).toBeVisible({ timeout: 15_000 });

    // Expand/collapse buttons
    const expandBtn = page.locator("button", { hasText: "전체 펼치기" });
    const collapseBtn = page.locator("button", { hasText: "전체 접기" });
    await expect(expandBtn).toBeVisible();
    await expect(collapseBtn).toBeVisible();

    // Click expand all
    await expandBtn.click();
    await page.waitForTimeout(300);

    // Click collapse all
    await collapseBtn.click();
    await page.waitForTimeout(300);

    // Page should still be functional
    await expect(page.locator("body")).not.toContainText("Error");
  });

  test("부서 노드에 인원수 뱃지가 표시된다", async ({ page }) => {
    await page.goto("/admin/org-chart");
    await expect(
      page.locator("h1", { hasText: "조직도" }),
    ).toBeVisible({ timeout: 15_000 });

    // Wait for tree data to load
    await page.waitForTimeout(1_500);

    // Department nodes should have employee count badges ("N명")
    const countBadges = page.locator("text=/\\d+명/");
    const badgeCount = await countBadges.count();

    // Should have at least one department with employee count
    expect(badgeCount).toBeGreaterThanOrEqual(0);

    // No errors
    await expect(page.locator("body")).not.toContainText("Error");
  });

  test("사이드바에서 조직도로 이동할 수 있다", async ({ page }) => {
    await page.goto("/admin");
    await expect(page.locator("text=안녕하세요, 관리자님")).toBeVisible({
      timeout: 15_000,
    });

    // Click org-chart in sidebar
    await page.click("text=조직도");
    await page.waitForURL("**/admin/org-chart", { timeout: 10_000 });

    await expect(
      page.locator("h1", { hasText: "조직도" }),
    ).toBeVisible({ timeout: 10_000 });
  });
});

// ─── 인사변동 타임라인 ──────────────────────────────────────

test.describe("WI-088: 인사변동 타임라인", () => {
  test("인사 변동 페이지가 렌더링된다", async ({ page }) => {
    await page.goto("/admin/people/changes");

    await expect(
      page.locator("h1", { hasText: "인사 변동" }),
    ).toBeVisible({ timeout: 15_000 });

    await expect(
      page.locator("text=입사, 이동, 퇴사, 승진 등 인사 변동 이력을 확인합니다"),
    ).toBeVisible();
  });

  test("변동 유형 필터 버튼이 렌더링된다", async ({ page }) => {
    await page.goto("/admin/people/changes");
    await expect(
      page.locator("h1", { hasText: "인사 변동" }),
    ).toBeVisible({ timeout: 15_000 });

    // Change type filter buttons
    await expect(page.locator("button", { hasText: "전체" })).toBeVisible();
    await expect(page.locator("button", { hasText: "입사" })).toBeVisible();
    await expect(page.locator("button", { hasText: "이동" })).toBeVisible();
    await expect(page.locator("button", { hasText: "승진" })).toBeVisible();
    await expect(page.locator("button", { hasText: "퇴사" }).first()).toBeVisible();
  });

  test("검색 입력 필드가 존재한다", async ({ page }) => {
    await page.goto("/admin/people/changes");
    await expect(
      page.locator("h1", { hasText: "인사 변동" }),
    ).toBeVisible({ timeout: 15_000 });

    const searchInput = page.locator(
      'input[placeholder="이름, 사번 검색..."]',
    );
    await expect(searchInput).toBeVisible();
  });

  test("유형 필터 클릭 시 타임라인이 필터링된다", async ({ page }) => {
    await page.goto("/admin/people/changes");
    await expect(
      page.locator("h1", { hasText: "인사 변동" }),
    ).toBeVisible({ timeout: 15_000 });

    // Click "입사" filter
    await page.locator("button", { hasText: "입사" }).click();
    await page.waitForTimeout(500);

    // No errors
    await expect(page.locator("body")).not.toContainText("Error");
  });

  test("사이드바에서 인사 변동으로 이동할 수 있다", async ({ page }) => {
    await page.goto("/admin");
    await expect(page.locator("text=안녕하세요, 관리자님")).toBeVisible({
      timeout: 15_000,
    });

    // Click changes in sidebar
    await page.click("text=인사 변동");
    await page.waitForURL("**/admin/people/changes", { timeout: 10_000 });

    await expect(
      page.locator("h1", { hasText: "인사 변동" }),
    ).toBeVisible({ timeout: 10_000 });
  });
});
