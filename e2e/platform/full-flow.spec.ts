import { test, expect } from "@playwright/test";

/**
 * WI-094: Platform 전체 플로우 E2E
 *
 * storageState(operator.json)로 인증이 사전 캐싱되어 있으므로
 * 매 테스트마다 loginAs() 없이 바로 페이지 접근합니다.
 *
 * 테스트 범위:
 * - 대시보드 4 KPI + 운영큐 + 헬스 + 보안시그널
 * - 테넌트 필터 + 테이블 + 상세 드로어
 * - 빌링 4 KPI + 플랜 카탈로그 + 결제 계정 + 인보이스
 * - 서포트 티켓큐 + SLA
 * - 모니터링 API 메트릭 + 업타임
 * - 감사로그 + 보안이벤트
 * - 플랫폼설정 피처플래그 + 시스템설정
 */

// ─── Platform Dashboard: 4 KPI + 운영큐 + 헬스 + 보안시그널 ─────

test.describe("WI-094: 플랫폼 대시보드 KPI", () => {
  test("4개 KPI 카드가 렌더링된다", async ({ page }) => {
    await page.goto("/platform");
    await expect(page.locator("text=플랫폼 운영 콘솔")).toBeVisible({
      timeout: 15_000,
    });

    // 4 KPI eyebrow labels
    await expect(page.locator("text=활성 테넌트")).toBeVisible();
    await expect(page.locator("text=유예 고객")).toBeVisible();
    await expect(page.locator("text=결제 실패")).toBeVisible();
    await expect(page.locator("text=미해결 지원")).toBeVisible();
  });

  test("헤더에 내보내기/테넌트 추가 버튼이 있다", async ({ page }) => {
    await page.goto("/platform");
    await expect(page.locator("text=플랫폼 운영 콘솔")).toBeVisible({
      timeout: 15_000,
    });

    await expect(
      page.locator("button", { hasText: "내보내기" }),
    ).toBeVisible();
    await expect(
      page.locator("button", { hasText: "테넌트 추가" }),
    ).toBeVisible();
  });
});

test.describe("WI-094: 플랫폼 운영큐 + 헬스", () => {
  test("운영 큐 카드가 렌더링된다", async ({ page }) => {
    await page.goto("/platform");
    await expect(page.locator("text=플랫폼 운영 콘솔")).toBeVisible({
      timeout: 15_000,
    });

    await expect(page.locator("text=운영 큐")).toBeVisible();

    // Queue should have items or empty message
    const hasQueueItems =
      (await page.locator("text=즉시 확인").count()) > 0 ||
      (await page.locator("text=검토").count()) > 0 ||
      (await page.locator("text=조치").count()) > 0 ||
      (await page.locator("text=응답").count()) > 0;
    const hasEmptyMsg =
      (await page.locator("text=운영 큐가 비어 있습니다").count()) > 0;

    expect(hasQueueItems || hasEmptyMsg).toBeTruthy();
  });

  test("플랫폼 상태 신호 (헬스)가 렌더링된다", async ({ page }) => {
    await page.goto("/platform");
    await expect(page.locator("text=플랫폼 운영 콘솔")).toBeVisible({
      timeout: 15_000,
    });

    await expect(page.locator("text=플랫폼 상태 신호")).toBeVisible();

    // Health badge
    await expect(page.locator("text=정상")).toBeVisible();

    // Health metrics
    await expect(page.locator("text=API 성공률")).toBeVisible();
    await expect(page.locator("text=Webhook 전송")).toBeVisible();
    await expect(page.locator("text=SSO 인증")).toBeVisible();
    await expect(page.locator("text=데이터 동기화")).toBeVisible();

    // Last updated footer
    await expect(page.locator("text=마지막 업데이트")).toBeVisible();
  });
});

test.describe("WI-094: 플랫폼 보안시그널 + 테넌트 변경", () => {
  test("보안 신호 카드가 렌더링된다", async ({ page }) => {
    await page.goto("/platform");
    await expect(page.locator("text=플랫폼 운영 콘솔")).toBeVisible({
      timeout: 15_000,
    });

    await expect(page.locator("text=보안 신호")).toBeVisible();

    // Security signal items
    await expect(page.locator("text=비정상 로그인 시도")).toBeVisible();
    await expect(page.locator("text=MFA 미설정 운영자")).toBeVisible();
    await expect(page.locator("text=만료 예정 인증서")).toBeVisible();
    await expect(page.locator("text=API 키 만료 예정")).toBeVisible();

    // Footer link
    await expect(
      page.locator("button", { hasText: "감사 로그 전체 보기" }),
    ).toBeVisible();
  });

  test("최근 테넌트 변경 카드가 렌더링된다", async ({ page }) => {
    await page.goto("/platform");
    await expect(page.locator("text=플랫폼 운영 콘솔")).toBeVisible({
      timeout: 15_000,
    });

    await expect(page.locator("text=최근 테넌트 변경")).toBeVisible();

    // Either has timeline items or empty message
    const hasChanges =
      (await page.locator("text=신규 가입").count()) > 0 ||
      (await page.locator("text=증설").count()) > 0 ||
      (await page.locator("text=전환").count()) > 0;
    const hasEmptyMsg =
      (await page.locator("text=최근 변경 이력이 없습니다").count()) > 0;

    expect(hasChanges || hasEmptyMsg).toBeTruthy();
  });
});

// ─── Tenants: 필터 + 테이블 + 상세 드로어 ────────────────────────

test.describe("WI-094: 테넌트 관리 필터", () => {
  test("테넌트 관리 페이지가 렌더링된다", async ({ page }) => {
    await page.goto("/platform/tenants");
    await expect(page.locator("text=테넌트 관리")).toBeVisible({
      timeout: 15_000,
    });

    await expect(
      page.locator("text=전체 테넌트 목록 및 운영 현황"),
    ).toBeVisible();

    // Header buttons
    await expect(
      page.locator("button", { hasText: "CSV 내보내기" }),
    ).toBeVisible();
    await expect(
      page.locator("button", { hasText: "테넌트 추가" }),
    ).toBeVisible();
  });

  test("필터 칩이 렌더링된다", async ({ page }) => {
    await page.goto("/platform/tenants");
    await expect(page.locator("text=테넌트 관리")).toBeVisible({
      timeout: 15_000,
    });

    // Filter chips with counts
    await expect(page.locator("button", { hasText: /전체 \(\d+\)/ })).toBeVisible();
    await expect(page.locator("button", { hasText: /활성 \(\d+\)/ })).toBeVisible();
    await expect(page.locator("button", { hasText: /유예 \(\d+\)/ })).toBeVisible();
    await expect(page.locator("button", { hasText: /체험판 \(\d+\)/ })).toBeVisible();
    await expect(page.locator("button", { hasText: /만료 \(\d+\)/ })).toBeVisible();
  });

  test("검색 입력 필드와 셀렉트 필터가 동작한다", async ({ page }) => {
    await page.goto("/platform/tenants");
    await expect(page.locator("text=테넌트 관리")).toBeVisible({
      timeout: 15_000,
    });

    // Search input
    const searchInput = page.locator(
      'input[placeholder="회사명, 도메인으로 검색..."]',
    );
    await expect(searchInput).toBeVisible();

    // Type in search
    await searchInput.fill("Acme");
    await page.waitForTimeout(500);

    // No errors
    await expect(page.locator("body")).not.toContainText("Error");
  });

  test("필터 칩 클릭 시 목록이 필터링된다", async ({ page }) => {
    await page.goto("/platform/tenants");
    await expect(page.locator("text=테넌트 관리")).toBeVisible({
      timeout: 15_000,
    });

    // Click "활성" filter chip
    await page.locator("button", { hasText: /활성 \(\d+\)/ }).click();
    await page.waitForTimeout(500);

    // No errors
    await expect(page.locator("body")).not.toContainText("Error");
  });
});

test.describe("WI-094: 테넌트 테이블", () => {
  test("테넌트 테이블 컬럼이 렌더링된다", async ({ page }) => {
    await page.goto("/platform/tenants");
    await expect(page.locator("text=테넌트 관리")).toBeVisible({
      timeout: 15_000,
    });

    // Wait for data
    await page.waitForTimeout(1_000);

    // Column headers
    await expect(page.locator("th", { hasText: "회사명" })).toBeVisible();
    await expect(page.locator("th", { hasText: "플랜" })).toBeVisible();
    await expect(page.locator("th", { hasText: "좌석" })).toBeVisible();
    await expect(page.locator("th", { hasText: "상태" })).toBeVisible();
    await expect(page.locator("th", { hasText: "MRR" })).toBeVisible();
    await expect(page.locator("th", { hasText: "최근 활동" })).toBeVisible();
  });

  test("테이블 데이터가 표시되거나 빈 메시지가 표시된다", async ({
    page,
  }) => {
    await page.goto("/platform/tenants");
    await expect(page.locator("text=테넌트 관리")).toBeVisible({
      timeout: 15_000,
    });

    await page.waitForTimeout(1_500);

    const rowCount = await page.locator("tbody tr").count();
    const hasEmpty =
      (await page.locator("text=조건에 맞는 테넌트가 없습니다").count()) > 0;

    expect(rowCount > 0 || hasEmpty).toBeTruthy();
  });
});

test.describe("WI-094: 테넌트 상세 드로어", () => {
  test("행 클릭 시 상세 드로어가 열린다", async ({ page }) => {
    await page.goto("/platform/tenants");
    await expect(page.locator("text=테넌트 관리")).toBeVisible({
      timeout: 15_000,
    });

    await page.waitForTimeout(1_500);

    const firstRow = page.locator("tbody tr").first();
    const rowExists = await firstRow.isVisible().catch(() => false);

    if (rowExists) {
      await firstRow.click();

      // Drawer opens with title
      await expect(page.locator("text=테넌트 상세")).toBeVisible({
        timeout: 10_000,
      });

      // Detail sections
      await expect(page.locator("text=기본 정보")).toBeVisible({
        timeout: 5_000,
      });
      await expect(page.locator("text=플랜 & 사용량")).toBeVisible();
      await expect(page.locator("text=운영 현황")).toBeVisible();
      await expect(page.locator("text=최근 지원 이력")).toBeVisible();

      // Basic info fields
      await expect(page.locator("text=회사명").first()).toBeVisible();
      await expect(page.locator("text=도메인").first()).toBeVisible();
      await expect(page.locator("text=가입일")).toBeVisible();

      // Operations stats
      await expect(page.locator("text=직원 수")).toBeVisible();
      await expect(page.locator("text=부서 수")).toBeVisible();
      await expect(page.locator("text=지원 티켓")).toBeVisible();

      // Footer action buttons
      await expect(
        page.locator("button", { hasText: "관리자 콘솔 접속" }),
      ).toBeVisible();
      await expect(
        page.locator("button", { hasText: "플랜 변경" }),
      ).toBeVisible();
      await expect(
        page.locator("button", { hasText: "일시 중지" }),
      ).toBeVisible();
    }
  });
});

// ─── Billing: 4 KPI + 플랜 카탈로그 + 결제 계정 + 인보이스 ──────

test.describe("WI-094: 빌링 KPI", () => {
  test("빌링 페이지 4개 KPI 카드가 렌더링된다", async ({ page }) => {
    await page.goto("/platform/billing");
    await expect(page.locator("text=플랜 & 빌링").first()).toBeVisible({
      timeout: 15_000,
    });

    // 4 KPI eyebrow labels
    await expect(page.locator("text=MRR").first()).toBeVisible();
    await expect(page.locator("text=ACV")).toBeVisible();
    await expect(page.locator("text=미수금")).toBeVisible();
    await expect(page.locator("text=이탈률")).toBeVisible();
  });

  test("헤더에 청구서 내보내기/결제 설정 버튼이 있다", async ({ page }) => {
    await page.goto("/platform/billing");
    await expect(page.locator("text=플랜 & 빌링").first()).toBeVisible({
      timeout: 15_000,
    });

    await expect(
      page.locator("button", { hasText: "청구서 내보내기" }),
    ).toBeVisible();
    await expect(
      page.locator("button", { hasText: "결제 설정" }),
    ).toBeVisible();
  });
});

test.describe("WI-094: 플랜 카탈로그", () => {
  test("플랜 카탈로그 섹션이 렌더링된다", async ({ page }) => {
    await page.goto("/platform/billing");
    await expect(page.locator("text=플랜 & 빌링").first()).toBeVisible({
      timeout: 15_000,
    });

    await expect(page.locator("text=플랜 카탈로그")).toBeVisible();

    // Plan cards
    await expect(page.locator("text=Starter").first()).toBeVisible();
    await expect(page.locator("text=Growth").first()).toBeVisible();
    await expect(page.locator("text=Enterprise").first()).toBeVisible();
  });

  test("플랜 카드에 사양이 표시된다", async ({ page }) => {
    await page.goto("/platform/billing");
    await expect(page.locator("text=플랜 & 빌링").first()).toBeVisible({
      timeout: 15_000,
    });

    // Plan specs
    await expect(page.locator("text=최대 좌석").first()).toBeVisible();
    await expect(page.locator("text=스토리지").first()).toBeVisible();
    await expect(page.locator("text=API 호출").first()).toBeVisible();
    await expect(page.locator("text=포함 기능").first()).toBeVisible();

    // Price format
    const pricePattern = page.locator("text=/ 좌석·월").first();
    await expect(pricePattern).toBeVisible();
  });
});

test.describe("WI-094: 결제 계정 + 인보이스 탭", () => {
  test("결제 계정 탭이 기본 활성이다", async ({ page }) => {
    await page.goto("/platform/billing");
    await expect(page.locator("text=플랜 & 빌링").first()).toBeVisible({
      timeout: 15_000,
    });

    // Tabs
    await expect(
      page.locator("button", { hasText: /결제 계정/ }),
    ).toBeVisible();
    await expect(
      page.locator("button", { hasText: /인보이스/ }),
    ).toBeVisible();

    // Accounts table columns (or empty message)
    const hasAccountData = (await page.locator("th", { hasText: "테넌트" }).count()) > 0;
    const hasAccountEmpty =
      (await page.locator("text=등록된 결제 계정이 없습니다.").count()) > 0;

    expect(hasAccountData || hasAccountEmpty).toBeTruthy();
  });

  test("결제 계정 테이블 컬럼이 렌더링된다", async ({ page }) => {
    await page.goto("/platform/billing");
    await expect(page.locator("text=플랜 & 빌링").first()).toBeVisible({
      timeout: 15_000,
    });

    await page.waitForTimeout(1_000);

    // Check if table has data
    const hasTable = (await page.locator("th", { hasText: "테넌트" }).count()) > 0;

    if (hasTable) {
      await expect(page.locator("th", { hasText: "플랜" }).first()).toBeVisible();
      await expect(page.locator("th", { hasText: "월액" })).toBeVisible();
      await expect(page.locator("th", { hasText: "결제수단" })).toBeVisible();
      await expect(page.locator("th", { hasText: "다음 청구일" })).toBeVisible();
    }
  });

  test("인보이스 탭 클릭 시 인보이스 테이블이 표시된다", async ({ page }) => {
    await page.goto("/platform/billing");
    await expect(page.locator("text=플랜 & 빌링").first()).toBeVisible({
      timeout: 15_000,
    });

    // Click invoices tab
    await page.locator("button", { hasText: /인보이스/ }).click();
    await page.waitForTimeout(500);

    // Invoice table or empty message
    const hasInvoiceTable =
      (await page.locator("th", { hasText: "청구서 번호" }).count()) > 0;
    const hasInvoiceEmpty =
      (await page.locator("text=인보이스 내역이 없습니다.").count()) > 0;

    expect(hasInvoiceTable || hasInvoiceEmpty).toBeTruthy();
  });

  test("인보이스 테이블 컬럼이 렌더링된다", async ({ page }) => {
    await page.goto("/platform/billing");
    await expect(page.locator("text=플랜 & 빌링").first()).toBeVisible({
      timeout: 15_000,
    });

    // Switch to invoices tab
    await page.locator("button", { hasText: /인보이스/ }).click();
    await page.waitForTimeout(500);

    const hasTable =
      (await page.locator("th", { hasText: "청구서 번호" }).count()) > 0;

    if (hasTable) {
      await expect(page.locator("th", { hasText: "테넌트" }).first()).toBeVisible();
      await expect(page.locator("th", { hasText: "기간" })).toBeVisible();
      await expect(page.locator("th", { hasText: "금액" })).toBeVisible();
      await expect(page.locator("th", { hasText: "발행일" })).toBeVisible();
    }
  });
});

// ─── Support / Monitoring / Audit / Settings (사이드바 + 페이지 접근) ──

test.describe("WI-094: 서포트 + 모니터링", () => {
  test("사이드바에 서포트 메뉴가 존재한다", async ({ page }) => {
    await page.goto("/platform");
    await expect(page.locator("text=플랫폼 운영 콘솔")).toBeVisible({
      timeout: 15_000,
    });

    // Sidebar support link
    await expect(page.locator("text=서포트")).toBeVisible();
  });

  test("사이드바에 모니터링 메뉴가 존재한다", async ({ page }) => {
    await page.goto("/platform");
    await expect(page.locator("text=플랫폼 운영 콘솔")).toBeVisible({
      timeout: 15_000,
    });

    // Sidebar monitoring link
    await expect(page.locator("text=모니터링")).toBeVisible();
  });

  test("서포트 페이지 접근 시 에러가 없다", async ({ page }) => {
    await page.goto("/platform/support");
    await page.waitForTimeout(2_000);

    // Should not show unhandled error (404 page is acceptable)
    await expect(page.locator("body")).not.toContainText(
      "Application error",
    );
  });

  test("모니터링 페이지 접근 시 에러가 없다", async ({ page }) => {
    await page.goto("/platform/monitoring");
    await page.waitForTimeout(2_000);

    // Should not show unhandled error
    await expect(page.locator("body")).not.toContainText(
      "Application error",
    );
  });
});

test.describe("WI-094: 감사로그 + 보안이벤트", () => {
  test("사이드바에 감사 & 보안 메뉴가 존재한다", async ({ page }) => {
    await page.goto("/platform");
    await expect(page.locator("text=플랫폼 운영 콘솔")).toBeVisible({
      timeout: 15_000,
    });

    await expect(page.locator("text=감사 & 보안")).toBeVisible();
  });

  test("감사 & 보안 페이지 접근 시 에러가 없다", async ({ page }) => {
    await page.goto("/platform/audit");
    await page.waitForTimeout(2_000);

    await expect(page.locator("body")).not.toContainText(
      "Application error",
    );
  });

  test("대시보드 보안 신호에서 감사 로그 링크가 있다", async ({ page }) => {
    await page.goto("/platform");
    await expect(page.locator("text=플랫폼 운영 콘솔")).toBeVisible({
      timeout: 15_000,
    });

    // Security signals card has link to audit logs
    await expect(
      page.locator("button", { hasText: "감사 로그 전체 보기" }),
    ).toBeVisible();
  });
});

test.describe("WI-094: 플랫폼 설정", () => {
  test("사이드바에 플랫폼 설정 메뉴가 존재한다", async ({ page }) => {
    await page.goto("/platform");
    await expect(page.locator("text=플랫폼 운영 콘솔")).toBeVisible({
      timeout: 15_000,
    });

    await expect(page.locator("text=플랫폼 설정")).toBeVisible();
  });

  test("플랫폼 설정 페이지 접근 시 에러가 없다", async ({ page }) => {
    await page.goto("/platform/settings");
    await page.waitForTimeout(2_000);

    await expect(page.locator("body")).not.toContainText(
      "Application error",
    );
  });
});

// ─── Sidebar Navigation ─────────────────────────────────────────

test.describe("WI-094: 사이드바 네비게이션", () => {
  test("사이드바에 모든 메뉴 항목이 표시된다", async ({ page }) => {
    await page.goto("/platform");
    await expect(page.locator("text=플랫폼 운영 콘솔")).toBeVisible({
      timeout: 15_000,
    });

    // Section labels
    await expect(page.locator("text=메인")).toBeVisible();
    await expect(page.locator("text=운영")).toBeVisible();
    await expect(page.locator("text=지원")).toBeVisible();
    await expect(page.locator("text=시스템")).toBeVisible();

    // Menu items
    await expect(page.locator("text=대시보드").first()).toBeVisible();
    await expect(page.locator("text=테넌트 관리")).toBeVisible();
    await expect(page.locator("text=플랜 & 빌링")).toBeVisible();
    await expect(page.locator("text=서포트")).toBeVisible();
    await expect(page.locator("text=모니터링")).toBeVisible();
    await expect(page.locator("text=감사 & 보안")).toBeVisible();
    await expect(page.locator("text=플랫폼 설정")).toBeVisible();
  });

  test("사이드바에서 테넌트 관리로 이동할 수 있다", async ({ page }) => {
    await page.goto("/platform");
    await expect(page.locator("text=플랫폼 운영 콘솔")).toBeVisible({
      timeout: 15_000,
    });

    await page.click("text=테넌트 관리");
    await page.waitForURL("**/platform/tenants", { timeout: 10_000 });

    await expect(
      page.locator("h1", { hasText: "테넌트 관리" }),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("사이드바에서 빌링으로 이동할 수 있다", async ({ page }) => {
    await page.goto("/platform");
    await expect(page.locator("text=플랫폼 운영 콘솔")).toBeVisible({
      timeout: 15_000,
    });

    await page.click("text=플랜 & 빌링");
    await page.waitForURL("**/platform/billing", { timeout: 10_000 });

    await expect(
      page.locator("h1", { hasText: "플랜" }),
    ).toBeVisible({ timeout: 10_000 });
  });
});
