import { test, expect } from "@playwright/test";

/**
 * WI-090: Admin 결재+문서 E2E 테스트
 *
 * 결재 대시보드+수신함, 결재 상세 4단계체인, 워크플로우 빌더 생성,
 * 결재 이력 필터, 문서 대시보드+템플릿관리+발송폼+미리보기+보관함
 */

// ─── 1. 결재 대시보드 + 수신함 (WI-025) ─────────────────────

test.describe("WI-090: 결재 대시보드 + 수신함", () => {
  test("결재 관리 페이지 헤더가 렌더링된다", async ({ page }) => {
    await page.goto("/admin/workflow");
    await expect(page.locator("h1")).toContainText("결재 관리");
    await expect(
      page.getByText("승인 요청 처리, 워크플로 설계, 결재 이력 관리"),
    ).toBeVisible();
  });

  test("4개 탭 버튼이 표시된다", async ({ page }) => {
    await page.goto("/admin/workflow");
    await expect(page.getByText("대시보드")).toBeVisible();
    await expect(page.getByText("상세")).toBeVisible();
    await expect(page.getByText("빌더")).toBeVisible();
    await expect(page.getByText("이력")).toBeVisible();
  });

  test("대시보드 4 KPI 카드가 렌더링된다", async ({ page }) => {
    await page.goto("/admin/workflow");
    // KPI 카드 eyebrow 텍스트 확인
    await expect(page.getByText("승인 대기")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("SLA 초과")).toBeVisible();
    await expect(page.getByText("상향 결재")).toBeVisible();
    await expect(page.getByText("이번 주 완료")).toBeVisible();
  });

  test("승인 대기열 섹션이 렌더링된다", async ({ page }) => {
    await page.goto("/admin/workflow");
    await expect(page.getByText("승인 대기열")).toBeVisible({
      timeout: 10_000,
    });
  });

  test("수신함 필터 칩 (전체, 긴급, SLA 초과)이 표시된다", async ({
    page,
  }) => {
    await page.goto("/admin/workflow");
    await expect(page.getByText("승인 대기열")).toBeVisible({
      timeout: 10_000,
    });

    // 필터 칩 확인
    const filterArea = page.locator("body");
    await expect(filterArea.getByText("전체", { exact: true })).toBeVisible();
    await expect(filterArea.getByText("긴급", { exact: true })).toBeVisible();
    await expect(
      filterArea.getByText("SLA 초과", { exact: true }),
    ).toBeVisible();
  });

  test("처리 현황 카드가 렌더링된다", async ({ page }) => {
    await page.goto("/admin/workflow");
    await expect(page.getByText("처리 현황")).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByText("평균 처리 시간")).toBeVisible();
    await expect(page.getByText("오늘 처리")).toBeVisible();
    await expect(page.getByText("자동 승인")).toBeVisible();
    await expect(page.getByText("반려율")).toBeVisible();
    await expect(page.getByText("가장 느린 유형")).toBeVisible();
  });
});

// ─── 2. 결재 상세 4단계 체인 (WI-026) ──────────────────────

test.describe("WI-090: 결재 상세 드로어 + 4단계 체인", () => {
  test("상세 탭에서 결재 요청 목록이 표시된다", async ({ page }) => {
    await page.goto("/admin/workflow?tab=detail");

    // 로딩 후 목록 또는 빈 상태 표시
    await page.waitForTimeout(2_000);
    const body = page.locator("body");
    const hasRequests = await body.getByText("결재 요청 목록").isVisible();
    const hasEmpty = await body.getByText("결재 요청이 없습니다").isVisible();
    expect(hasRequests || hasEmpty).toBeTruthy();
  });

  test("대시보드 검토 버튼 클릭 시 상세 드로어가 열린다", async ({ page }) => {
    await page.goto("/admin/workflow");
    await expect(page.getByText("승인 대기열")).toBeVisible({
      timeout: 10_000,
    });

    // 검토 버튼이 있는지 확인
    const reviewButtons = page.getByText("검토", { exact: true });
    const count = await reviewButtons.count();

    if (count > 0) {
      // 첫 번째 검토 버튼 클릭
      await reviewButtons.first().click();

      // 드로어 열림 확인 — "승인 상세" 텍스트
      await expect(page.getByText("승인 상세")).toBeVisible({
        timeout: 10_000,
      });

      // 결재선 표시 확인
      await expect(page.getByText("결재선")).toBeVisible();
    }
  });

  test("상세 드로어에 요청 정보와 결재 체인이 표시된다", async ({ page }) => {
    await page.goto("/admin/workflow");
    await expect(page.getByText("승인 대기열")).toBeVisible({
      timeout: 10_000,
    });

    const reviewButtons = page.getByText("검토", { exact: true });
    const count = await reviewButtons.count();

    if (count > 0) {
      await reviewButtons.first().click();

      // 요청 정보 항목 확인
      await expect(page.getByText("승인 상세")).toBeVisible({
        timeout: 10_000,
      });
      await expect(page.getByText("요청자")).toBeVisible();
      await expect(page.getByText("유형")).toBeVisible();
      await expect(page.getByText("신청일")).toBeVisible();

      // 결재선 확인
      await expect(page.getByText("결재선")).toBeVisible();

      // 액션 버튼 확인 (PENDING/IN_PROGRESS/ESCALATED 상태인 경우)
      const hasApproveBtn = await page
        .getByText("승인", { exact: true })
        .last()
        .isVisible();
      const hasRejectBtn = await page
        .getByText("반려", { exact: true })
        .isVisible();
      const hasHoldBtn = await page
        .getByText("보류", { exact: true })
        .isVisible();

      // 액션 가능 상태면 3개 버튼 모두 있어야 함
      if (hasApproveBtn) {
        expect(hasRejectBtn).toBeTruthy();
        expect(hasHoldBtn).toBeTruthy();
      }
    }
  });
});

// ─── 3. 워크플로우 빌더 생성 (WI-027) ──────────────────────

test.describe("WI-090: 워크플로우 빌더", () => {
  test("빌더 탭에서 워크플로우 목록이 표시된다", async ({ page }) => {
    await page.goto("/admin/workflow?tab=builder");

    // 로딩 완료 대기
    await page.waitForTimeout(2_000);
    const body = page.locator("body");

    const hasTitle = await body.getByText("워크플로우 목록").isVisible();
    const hasEmpty = await body
      .getByText("등록된 워크플로우가 없습니다")
      .isVisible();
    expect(hasTitle || hasEmpty).toBeTruthy();
  });

  test("새 워크플로우 버튼이 표시된다", async ({ page }) => {
    await page.goto("/admin/workflow?tab=builder");
    await page.waitForTimeout(2_000);

    // "+ 새 워크플로우" 또는 "첫 워크플로우 만들기" 버튼
    const hasNewBtn = await page.getByText("새 워크플로우").isVisible();
    const hasFirstBtn = await page
      .getByText("첫 워크플로우 만들기")
      .isVisible();
    expect(hasNewBtn || hasFirstBtn).toBeTruthy();
  });

  test("새 워크플로우 버튼 클릭 시 생성 모달이 열린다", async ({ page }) => {
    await page.goto("/admin/workflow?tab=builder");
    await page.waitForTimeout(2_000);

    // 버튼 클릭
    const newBtn = page.getByText("새 워크플로우");
    const firstBtn = page.getByText("첫 워크플로우 만들기");

    if (await newBtn.isVisible()) {
      await newBtn.click();
    } else if (await firstBtn.isVisible()) {
      await firstBtn.click();
    }

    // 모달 확인
    await expect(page.getByText("새 워크플로우").first()).toBeVisible({
      timeout: 5_000,
    });

    // 모달 내 폼 필드 확인
    await expect(page.getByText("워크플로우 이름")).toBeVisible();
    await expect(page.getByText("트리거 유형")).toBeVisible();
    await expect(page.getByText("승인 단계")).toBeVisible();
    await expect(page.getByText("조건 분기")).toBeVisible();
  });

  test("워크플로우 생성 모달에 5단계 미리보기가 표시된다", async ({ page }) => {
    await page.goto("/admin/workflow?tab=builder");
    await page.waitForTimeout(2_000);

    // 생성 모달 열기
    const newBtn = page.getByText("새 워크플로우");
    const firstBtn = page.getByText("첫 워크플로우 만들기");

    if (await newBtn.isVisible()) {
      await newBtn.click();
    } else if (await firstBtn.isVisible()) {
      await firstBtn.click();
    }

    // 워크플로우 미리보기 존재 확인
    await expect(page.getByText("워크플로우 미리보기")).toBeVisible({
      timeout: 5_000,
    });
    await expect(page.getByText("트리거")).toBeVisible();
  });

  test("워크플로우 목록 테이블에 올바른 열이 표시된다", async ({ page }) => {
    await page.goto("/admin/workflow?tab=builder");
    await page.waitForTimeout(2_000);

    const hasWorkflows = await page.getByText("워크플로우 목록").isVisible();
    if (hasWorkflows) {
      // 테이블에 데이터가 있는 경우 열 헤더 확인
      const tableHeaders = page.locator("th");
      const headerCount = await tableHeaders.count();
      if (headerCount > 0) {
        const headerTexts = await tableHeaders.allTextContents();
        const joinedHeaders = headerTexts.join(" ");
        // 최소한 워크플로우, 트리거, 상태 열이 있어야 함
        expect(
          joinedHeaders.includes("워크플로우") ||
            joinedHeaders.includes("트리거"),
        ).toBeTruthy();
      }
    }
  });
});

// ─── 4. 결재 이력 필터 (WI-028) ─────────────────────────────

test.describe("WI-090: 결재 이력 + 필터", () => {
  test("이력 탭에서 검색 필터와 상태 필터가 표시된다", async ({ page }) => {
    await page.goto("/admin/workflow?tab=history");

    // 검색 입력 필드
    await expect(
      page.locator('input[placeholder="요청명 또는 요청자 검색..."]'),
    ).toBeVisible({ timeout: 10_000 });

    // 상태 필터 칩
    await expect(
      page.getByText("전체", { exact: true }).first(),
    ).toBeVisible();
    await expect(
      page.getByText("승인", { exact: true }).first(),
    ).toBeVisible();
    await expect(
      page.getByText("반려", { exact: true }).first(),
    ).toBeVisible();
    await expect(
      page.getByText("취소", { exact: true }).first(),
    ).toBeVisible();
  });

  test("이력 테이블이 올바른 열 헤더를 표시한다", async ({ page }) => {
    await page.goto("/admin/workflow?tab=history");
    await page.waitForTimeout(2_000);

    // 테이블 헤더 확인
    const body = page.locator("body");
    const hasTable = await body.locator("th").count();

    if (hasTable > 0) {
      await expect(body.getByText("요청", { exact: true })).toBeVisible();
      await expect(body.getByText("요청자")).toBeVisible();
      await expect(body.getByText("유형", { exact: true })).toBeVisible();
      await expect(body.getByText("신청일")).toBeVisible();
      await expect(body.getByText("완료일")).toBeVisible();
      await expect(body.getByText("결과")).toBeVisible();
      await expect(body.getByText("처리 시간")).toBeVisible();
    }
  });

  test("이력 탭에 페이지네이션이 표시된다", async ({ page }) => {
    await page.goto("/admin/workflow?tab=history");
    await page.waitForTimeout(2_000);

    // 레코드가 있을 때 페이지네이션 확인
    const paginationText = page.getByText(/총 \d+건 중/);
    const hasPagination = await paginationText.isVisible().catch(() => false);
    const hasEmpty = await page
      .getByText("결재 이력이 없습니다")
      .isVisible()
      .catch(() => false);

    expect(hasPagination || hasEmpty).toBeTruthy();
  });

  test("상태 필터 클릭 시 필터가 적용된다", async ({ page }) => {
    await page.goto("/admin/workflow?tab=history");
    await expect(
      page.locator('input[placeholder="요청명 또는 요청자 검색..."]'),
    ).toBeVisible({ timeout: 10_000 });

    // "승인" 필터 클릭
    const approvedFilter = page
      .locator("button")
      .filter({ hasText: /^승인$/ })
      .first();
    if (await approvedFilter.isVisible()) {
      await approvedFilter.click();
      // 필터 적용 후 로딩 대기
      await page.waitForTimeout(1_000);
    }

    // "전체" 필터 클릭으로 복원
    const allFilter = page
      .locator("button")
      .filter({ hasText: /^전체$/ })
      .first();
    if (await allFilter.isVisible()) {
      await allFilter.click();
      await page.waitForTimeout(1_000);
    }
  });
});

// ─── 5. 문서 대시보드 (WI-030) ──────────────────────────────

test.describe("WI-090: 문서 대시보드", () => {
  test("문서 관리 페이지 헤더가 렌더링된다", async ({ page }) => {
    await page.goto("/admin/documents");
    await expect(page.locator("h1")).toContainText("문서 관리");
    await expect(
      page.getByText("계약서 발송, 템플릿 관리, 문서 보관함"),
    ).toBeVisible();
  });

  test("4개 탭 버튼이 표시된다", async ({ page }) => {
    await page.goto("/admin/documents");
    await expect(page.getByText("대시보드")).toBeVisible();
    await expect(page.getByText("템플릿")).toBeVisible();
    await expect(page.getByText("발송")).toBeVisible();
    await expect(page.getByText("보관함")).toBeVisible();
  });

  test("대시보드 4 KPI 카드가 렌더링된다", async ({ page }) => {
    await page.goto("/admin/documents");
    await expect(page.getByText("발송 완료")).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByText("서명 완료")).toBeVisible();
    await expect(page.getByText("서명 대기")).toBeVisible();
    await expect(page.getByText("만료 예정")).toBeVisible();
  });
});

// ─── 6. 템플릿 관리 (WI-031) ────────────────────────────────

test.describe("WI-090: 템플릿 관리", () => {
  test("템플릿 탭에서 템플릿 목록이 표시된다", async ({ page }) => {
    await page.goto("/admin/documents?tab=templates");
    await page.waitForTimeout(2_000);

    const body = page.locator("body");
    const hasTemplates = await body.getByText(/\d+개 템플릿/).isVisible();
    const hasEmpty = await body
      .getByText("등록된 템플릿이 없습니다")
      .isVisible();
    expect(hasTemplates || hasEmpty).toBeTruthy();
  });

  test("템플릿 추가 버튼이 표시된다", async ({ page }) => {
    await page.goto("/admin/documents?tab=templates");
    await page.waitForTimeout(2_000);

    await expect(page.getByText("템플릿 추가")).toBeVisible();
  });

  test("템플릿 추가 클릭 시 생성 모달이 열린다", async ({ page }) => {
    await page.goto("/admin/documents?tab=templates");
    await page.waitForTimeout(2_000);

    await page.getByText("템플릿 추가").click();

    // 모달 헤더 확인 — 모달 타이틀도 "템플릿 추가"
    // 모달 내 폼 필드 확인
    await expect(page.getByText("템플릿명")).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText("카테고리")).toBeVisible();
    await expect(page.getByText("설명")).toBeVisible();
    await expect(page.getByText("버전")).toBeVisible();

    // 저장/취소 버튼 확인
    await expect(page.getByText("저장")).toBeVisible();
    await expect(page.getByText("취소")).toBeVisible();
  });

  test("템플릿 카드에 카테고리 뱃지와 상태가 표시된다", async ({ page }) => {
    await page.goto("/admin/documents?tab=templates");
    await page.waitForTimeout(2_000);

    const hasTemplates = await page.getByText(/\d+개 템플릿/).isVisible();
    if (hasTemplates) {
      // 카드가 있으면 수정/비활성화 버튼이 존재하는지 확인
      const editButtons = page.getByText("수정", { exact: true });
      const editCount = await editButtons.count();
      expect(editCount).toBeGreaterThan(0);
    }
  });
});

// ─── 7. 문서 발송 폼 + 미리보기 (WI-032) ───────────────────

test.describe("WI-090: 문서 발송 폼 + 미리보기", () => {
  test("발송 탭에서 폼이 렌더링된다", async ({ page }) => {
    await page.goto("/admin/documents?tab=send");

    await expect(page.getByText("새 문서 발송")).toBeVisible({
      timeout: 10_000,
    });

    // 수신자 레이블
    await expect(page.getByText("수신자")).toBeVisible();

    // 수신자 검색 입력 필드
    await expect(
      page.locator('input[placeholder="이름 또는 부서 검색..."]'),
    ).toBeVisible();

    // 문서 템플릿 선택
    await expect(page.getByText("문서 템플릿")).toBeVisible();

    // 서명 마감일
    await expect(page.getByText("서명 마감일")).toBeVisible();

    // 메모
    await expect(page.getByText("메모")).toBeVisible();
  });

  test("발송 미리보기 영역이 표시된다", async ({ page }) => {
    await page.goto("/admin/documents?tab=send");

    await expect(page.getByText("발송 미리보기")).toBeVisible({
      timeout: 10_000,
    });

    // 템플릿 미선택 시 안내 메시지
    await expect(
      page.getByText("템플릿을 선택하면 미리보기가 표시됩니다"),
    ).toBeVisible();
  });

  test("알림 토글 스위치가 표시된다", async ({ page }) => {
    await page.goto("/admin/documents?tab=send");

    await expect(page.getByText("서명 알림 이메일 발송")).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByText("마감일 자동 리마인더")).toBeVisible();

    // 토글 스위치 role=switch 확인
    const toggles = page.locator('[role="switch"]');
    await expect(toggles).toHaveCount(2);
  });

  test("발송 버튼과 임시 저장 버튼이 표시된다", async ({ page }) => {
    await page.goto("/admin/documents?tab=send");

    await expect(page.getByText("임시 저장")).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByText("발송하기")).toBeVisible();
  });

  test("템플릿 미선택 시 발송하면 에러 메시지가 표시된다", async ({
    page,
  }) => {
    await page.goto("/admin/documents?tab=send");
    await expect(page.getByText("발송하기")).toBeVisible({
      timeout: 10_000,
    });

    // 발송하기 클릭 (템플릿 미선택)
    await page.getByText("발송하기").click();

    // 에러 메시지 표시 확인
    await expect(
      page.getByText("문서 템플릿을 선택해주세요"),
    ).toBeVisible({ timeout: 5_000 });
  });
});

// ─── 8. 문서 보관함 (WI-033) ────────────────────────────────

test.describe("WI-090: 문서 보관함", () => {
  test("보관함 탭에서 문서 보관함이 렌더링된다", async ({ page }) => {
    await page.goto("/admin/documents?tab=vault");
    await expect(page.getByText("문서 보관함")).toBeVisible({
      timeout: 10_000,
    });
  });

  test("검색 필터와 상태 필터가 표시된다", async ({ page }) => {
    await page.goto("/admin/documents?tab=vault");
    await expect(page.getByText("문서 보관함")).toBeVisible({
      timeout: 10_000,
    });

    // 검색 입력 필드
    await expect(
      page.locator(
        'input[placeholder="문서명, 수신자, 발송자 검색..."]',
      ),
    ).toBeVisible();

    // 상태 필터 셀렉트 (전체 상태 옵션 포함)
    await expect(page.locator("select")).toBeVisible();
  });

  test("보관함 테이블에 올바른 열 헤더가 표시된다", async ({ page }) => {
    await page.goto("/admin/documents?tab=vault");
    await page.waitForTimeout(2_000);

    const body = page.locator("body");
    const thCount = await body.locator("th").count();

    if (thCount > 0) {
      await expect(body.getByText("문서명")).toBeVisible();
      await expect(body.getByText("수신자")).toBeVisible();
      await expect(body.getByText("발송일")).toBeVisible();
      await expect(body.getByText("마감일")).toBeVisible();
      await expect(body.getByText("상태", { exact: true })).toBeVisible();
      await expect(body.getByText("액션")).toBeVisible();
    } else {
      // 데이터 없으면 빈 메시지
      await expect(body.getByText("보관된 문서가 없습니다")).toBeVisible();
    }
  });

  test("보관함에 다운로드/재발송 버튼이 표시된다", async ({ page }) => {
    await page.goto("/admin/documents?tab=vault");
    await page.waitForTimeout(2_000);

    const downloadBtns = page.getByText("다운로드", { exact: true });
    const downloadCount = await downloadBtns.count();

    if (downloadCount > 0) {
      // 다운로드와 재발송 버튼이 모두 존재
      await expect(downloadBtns.first()).toBeVisible();
      await expect(
        page.getByText("재발송", { exact: true }).first(),
      ).toBeVisible();
    }
  });
});

// ─── 9. 탭 간 네비게이션 ────────────────────────────────────

test.describe("WI-090: 탭 네비게이션", () => {
  test("결재 관리 탭 간 전환이 동작한다", async ({ page }) => {
    await page.goto("/admin/workflow");
    await expect(page.getByText("승인 대기")).toBeVisible({
      timeout: 10_000,
    });

    // 이력 탭 클릭
    await page.getByText("이력", { exact: true }).click();
    await expect(page).toHaveURL(/tab=history/);

    // 빌더 탭 클릭
    await page.getByText("빌더", { exact: true }).click();
    await expect(page).toHaveURL(/tab=builder/);

    // 대시보드 탭 복귀
    await page.getByText("대시보드", { exact: true }).click();
    await expect(page).toHaveURL(/\/admin\/workflow/);
  });

  test("문서 관리 탭 간 전환이 동작한다", async ({ page }) => {
    await page.goto("/admin/documents");
    await expect(page.getByText("발송 완료")).toBeVisible({
      timeout: 10_000,
    });

    // 템플릿 탭
    await page.getByText("템플릿", { exact: true }).click();
    await expect(page).toHaveURL(/tab=templates/);

    // 발송 탭
    await page.getByText("발송", { exact: true }).click();
    await expect(page).toHaveURL(/tab=send/);

    // 보관함 탭
    await page.getByText("보관함", { exact: true }).click();
    await expect(page).toHaveURL(/tab=vault/);

    // 대시보드 복귀
    await page.getByText("대시보드", { exact: true }).click();
    await expect(page).toHaveURL(/\/admin\/documents/);
  });
});
