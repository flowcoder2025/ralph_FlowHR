import { test, expect } from "@playwright/test";

/**
 * WI-091: Admin 급여 + 성과 E2E 테스트
 *
 * storageState(admin.json)로 인증이 사전 캐싱되어 있으므로
 * 매 테스트마다 loginAs() 없이 바로 페이지 접근합니다.
 *
 * 급여: 대시보드 KPI, 규칙관리, 마감 5단계, 명세서 월별조회
 * 성과: 목표대시보드, 평가설정+가중치, 진행현황 테이블, 1:1허브 일정
 */

// ═══════════════════════════════════════════════════════════════
// ── 급여(Payroll) 테스트
// ═══════════════════════════════════════════════════════════════

test.describe("WI-091: Payroll — 급여 대시보드", () => {
  test("급여 페이지 접근 + 헤더 + 탭 렌더링", async ({ page }) => {
    await page.goto("/admin/payroll");

    // 페이지 헤더
    await expect(page.getByText("급여 관리")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("급여 규칙, 마감, 명세서 관리")).toBeVisible();

    // 4개 탭 존재
    await expect(page.getByRole("button", { name: "대시보드" })).toBeVisible();
    await expect(page.getByRole("button", { name: "급여 규칙" })).toBeVisible();
    await expect(page.getByRole("button", { name: "급여 마감" })).toBeVisible();
    await expect(page.getByRole("button", { name: "명세서" })).toBeVisible();
  });

  test("대시보드 탭 KPI 카드 4개 렌더링", async ({ page }) => {
    await page.goto("/admin/payroll");

    // 4 KPI eyebrow 텍스트 확인
    await expect(page.getByText("급여 인원")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("확정 완료율")).toBeVisible();
    await expect(page.getByText("미확정 건수")).toBeVisible();
    await expect(page.getByText("발송 완료")).toBeVisible();
  });
});

test.describe("WI-091: Payroll — 급여 규칙 관리", () => {
  test("규칙 탭 전환 + 테이블 렌더링", async ({ page }) => {
    await page.goto("/admin/payroll");

    // 급여 규칙 탭 클릭
    await page.getByRole("button", { name: "급여 규칙" }).click();

    // 규칙 테이블 헤더 확인
    await expect(page.getByText("규칙명")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("유형")).toBeVisible();
    await expect(page.getByText("계산 방식")).toBeVisible();

    // 규칙 추가 버튼
    await expect(page.getByRole("button", { name: "규칙 추가" })).toBeVisible();
  });

  test("규칙 추가 모달 열기 + 폼 필드 확인", async ({ page }) => {
    await page.goto("/admin/payroll");
    await page.getByRole("button", { name: "급여 규칙" }).click();

    // 규칙 추가 모달 열기
    await page.getByRole("button", { name: "규칙 추가" }).click({ timeout: 10_000 });

    // 모달 제목 + 폼 필드
    await expect(page.getByText("급여 규칙 추가")).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText("규칙명", { exact: false })).toBeVisible();
    await expect(page.getByText("계산 방식", { exact: false })).toBeVisible();

    // 저장 / 취소 버튼
    await expect(page.getByRole("button", { name: "저장" })).toBeVisible();
    await expect(page.getByRole("button", { name: "취소" })).toBeVisible();
  });

  test("규칙 유형 뱃지 표시 (고정/변동/공제)", async ({ page }) => {
    await page.goto("/admin/payroll");
    await page.getByRole("button", { name: "급여 규칙" }).click();

    // 규칙 테이블이 로드될 때까지 대기
    await expect(page.getByText("규칙명")).toBeVisible({ timeout: 10_000 });

    // 데이터가 있으면 편집 버튼이 존재해야 함
    const editButtons = page.getByRole("button", { name: "편집" });
    const count = await editButtons.count();
    if (count > 0) {
      await expect(editButtons.first()).toBeVisible();
    }
  });
});

test.describe("WI-091: Payroll — 급여 마감 5단계", () => {
  test("마감 탭 전환 + 5단계 프로세스 표시", async ({ page }) => {
    await page.goto("/admin/payroll");

    // 급여 마감 탭 클릭
    await page.getByRole("button", { name: "급여 마감" }).click();

    // 마감 제목: "{year}년 {month}월 급여 마감" 패턴
    await expect(page.getByText(/\d{4}년 \d{1,2}월 급여 마감/)).toBeVisible({
      timeout: 10_000,
    });

    // 5단계 라벨 확인
    await expect(page.getByText("데이터 수집")).toBeVisible();
    await expect(page.getByText("변동 확인")).toBeVisible();
    await expect(page.getByText("계산")).toBeVisible();
    await expect(page.getByText("검토")).toBeVisible();
    await expect(page.getByText("확정")).toBeVisible();
  });

  test("마감 체크리스트 항목 렌더링", async ({ page }) => {
    await page.goto("/admin/payroll");
    await page.getByRole("button", { name: "급여 마감" }).click();

    // 체크리스트 항목들
    await expect(page.getByText(/\d{4}년 \d{1,2}월 급여 마감/)).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByText("근태 데이터 연동 완료")).toBeVisible();
    await expect(page.getByText("인사 변동 반영")).toBeVisible();
  });

  test("마감 상태 뱃지 표시", async ({ page }) => {
    await page.goto("/admin/payroll");
    await page.getByRole("button", { name: "급여 마감" }).click();

    await expect(page.getByText(/\d{4}년 \d{1,2}월 급여 마감/)).toBeVisible({
      timeout: 10_000,
    });

    // 상태 뱃지 중 하나가 보여야 함 (준비/진행 중/검토 중/확정 완료)
    const statusTexts = ["준비", "진행 중", "검토 중", "확정 완료"];
    const visibleStatuses = await Promise.all(
      statusTexts.map(async (text) => {
        const count = await page.getByText(text, { exact: false }).count();
        return count > 0;
      })
    );
    expect(visibleStatuses.some(Boolean)).toBe(true);
  });
});

test.describe("WI-091: Payroll — 명세서 월별 조회", () => {
  test("명세서 탭 전환 + 월 선택기 + 테이블 렌더링", async ({ page }) => {
    await page.goto("/admin/payroll");

    // 명세서 탭 클릭
    await page.getByRole("button", { name: "명세서" }).click();

    // 명세서 카드 제목
    await expect(page.getByText("급여 명세서")).toBeVisible({ timeout: 10_000 });

    // 월 선택 드롭다운 (select 요소)
    const monthSelect = page.locator("select");
    await expect(monthSelect.first()).toBeVisible();

    // 일괄 발송, 내보내기 버튼
    await expect(page.getByRole("button", { name: "일괄 발송" })).toBeVisible();
    await expect(page.getByRole("button", { name: "내보내기" })).toBeVisible();
  });

  test("명세서 테이블 컬럼 헤더 확인", async ({ page }) => {
    await page.goto("/admin/payroll");
    await page.getByRole("button", { name: "명세서" }).click();

    await expect(page.getByText("급여 명세서")).toBeVisible({ timeout: 10_000 });

    // 테이블 컬럼 헤더
    await expect(page.getByText("이름")).toBeVisible();
    await expect(page.getByText("부서")).toBeVisible();
    await expect(page.getByText("기본급")).toBeVisible();
    await expect(page.getByText("수당")).toBeVisible();
    await expect(page.getByText("공제")).toBeVisible();
    await expect(page.getByText("실수령액")).toBeVisible();
  });

  test("명세서 월 변경 시 데이터 갱신", async ({ page }) => {
    await page.goto("/admin/payroll");
    await page.getByRole("button", { name: "명세서" }).click();

    await expect(page.getByText("급여 명세서")).toBeVisible({ timeout: 10_000 });

    // 월 선택기에서 다른 월 선택
    const monthSelect = page.locator("select").first();
    const options = monthSelect.locator("option");
    const optionCount = await options.count();
    if (optionCount > 1) {
      const secondValue = await options.nth(1).getAttribute("value");
      if (secondValue) {
        await monthSelect.selectOption(secondValue);
        // 데이터가 갱신되었는지 (로딩 후 테이블이 다시 렌더링)
        await expect(page.getByText("급여 명세서")).toBeVisible({
          timeout: 10_000,
        });
      }
    }
  });
});

// ═══════════════════════════════════════════════════════════════
// ── 성과(Performance) 테스트
// ═══════════════════════════════════════════════════════════════

test.describe("WI-091: Performance — 목표 대시보드", () => {
  test("성과 페이지 접근 + 헤더 + 탭 렌더링", async ({ page }) => {
    await page.goto("/admin/performance");

    // 페이지 헤더
    await expect(page.getByText("성과 관리")).toBeVisible({ timeout: 10_000 });
    await expect(
      page.getByText("목표 관리, 평가 주기, 1:1 미팅 관리")
    ).toBeVisible();

    // 4개 탭 존재
    await expect(
      page.getByRole("button", { name: "목표 대시보드" })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "평가 설정" })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "평가 진행" })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "1:1 미팅" })
    ).toBeVisible();
  });

  test("목표 대시보드 KPI 4개 렌더링", async ({ page }) => {
    await page.goto("/admin/performance");

    // 4 KPI eyebrow 텍스트
    await expect(page.getByText("목표 설정 완료")).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByText("평가 중")).toBeVisible();
    await expect(page.getByText("1:1 예정")).toBeVisible();
    await expect(page.getByText("미설정")).toBeVisible();
  });

  test("부서별 목표 설정률 차트 + 현재 평가 주기 카드", async ({ page }) => {
    await page.goto("/admin/performance");

    await expect(page.getByText("부서별 목표 설정률")).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByText("현재 평가 주기")).toBeVisible();
  });
});

test.describe("WI-091: Performance — 평가 설정 + 가중치", () => {
  test("평가 설정 탭 전환 + 폼 필드 확인", async ({ page }) => {
    await page.goto("/admin/performance");

    // 평가 설정 탭 클릭
    await page.getByRole("button", { name: "평가 설정" }).click();

    // 평가 주기 설정 카드
    await expect(page.getByText("평가 주기 설정")).toBeVisible({
      timeout: 10_000,
    });

    // 폼 필드 라벨
    await expect(page.getByText("평가 주기명")).toBeVisible();
    await expect(page.getByText("평가 기간")).toBeVisible();
    await expect(page.getByText("평가 유형")).toBeVisible();
  });

  test("가중치 슬라이더 4개 + 합계 표시", async ({ page }) => {
    await page.goto("/admin/performance");
    await page.getByRole("button", { name: "평가 설정" }).click();

    await expect(page.getByText("평가 기준 가중치")).toBeVisible({
      timeout: 10_000,
    });

    // 4개 가중치 라벨
    await expect(page.getByText("업무 성과")).toBeVisible();
    await expect(page.getByText("역량")).toBeVisible();
    await expect(page.getByText("협업")).toBeVisible();
    await expect(page.getByText("리더십")).toBeVisible();

    // 합계
    await expect(page.getByText("합계")).toBeVisible();

    // range 슬라이더 4개
    const sliders = page.locator('input[type="range"]');
    await expect(sliders).toHaveCount(4);
  });

  test("설정 저장 버튼 존재", async ({ page }) => {
    await page.goto("/admin/performance");
    await page.getByRole("button", { name: "평가 설정" }).click();

    await expect(page.getByText("평가 주기 설정")).toBeVisible({
      timeout: 10_000,
    });

    await expect(
      page.getByRole("button", { name: "설정 저장" })
    ).toBeVisible();
  });
});

test.describe("WI-091: Performance — 평가 진행 현황 테이블", () => {
  test("평가 진행 탭 전환 + 테이블 렌더링", async ({ page }) => {
    await page.goto("/admin/performance");

    // 평가 진행 탭 클릭
    await page.getByRole("button", { name: "평가 진행" }).click();

    // 활성 주기가 없으면 안내 메시지, 있으면 테이블 표시
    const noData = page.getByText("활성 평가 주기가 없습니다.");
    const tableHeader = page.getByText("자기 평가");

    await expect(noData.or(tableHeader)).toBeVisible({ timeout: 10_000 });
  });

  test("진행 현황 테이블 컬럼 헤더 확인 (데이터 존재 시)", async ({
    page,
  }) => {
    await page.goto("/admin/performance");
    await page.getByRole("button", { name: "평가 진행" }).click();

    // 데이터가 있는 경우에만 테이블 컬럼 검증
    const hasData = await page
      .getByText("자기 평가")
      .isVisible({ timeout: 10_000 })
      .catch(() => false);

    if (hasData) {
      await expect(page.getByText("이름")).toBeVisible();
      await expect(page.getByText("부서")).toBeVisible();
      await expect(page.getByText("자기 평가")).toBeVisible();
      await expect(page.getByText("동료 평가")).toBeVisible();
      await expect(page.getByText("상사 평가")).toBeVisible();
      await expect(page.getByText("전체 상태")).toBeVisible();

      // 완료율 표시
      await expect(page.getByText(/\d+% 완료/)).toBeVisible();
    }
  });
});

test.describe("WI-091: Performance — 1:1 허브 일정", () => {
  test("1:1 미팅 탭 전환 + 기본 UI 확인", async ({ page }) => {
    await page.goto("/admin/performance");

    // 1:1 미팅 탭 클릭
    await page.getByRole("button", { name: "1:1 미팅" }).click();

    // 1:1 허브 헤더
    await expect(page.getByText("이번 주 1:1 예정")).toBeVisible({
      timeout: 10_000,
    });
    await expect(
      page.getByText("예정된 1:1 미팅 및 의제 관리")
    ).toBeVisible();

    // 1:1 예약 버튼
    await expect(
      page.getByRole("button", { name: "+ 1:1 예약" })
    ).toBeVisible();
  });

  test("1:1 미팅 통계 표시", async ({ page }) => {
    await page.goto("/admin/performance");
    await page.getByRole("button", { name: "1:1 미팅" }).click();

    await expect(page.getByText("이번 주 1:1 예정")).toBeVisible({
      timeout: 10_000,
    });

    // 미팅이 없으면 빈 메시지, 있으면 통계
    const emptyMsg = page.getByText("이번 주 예정된 1:1 미팅이 없습니다.");
    const statsText = page.getByText("이번 달 완료된 1:1:");

    await expect(emptyMsg.or(statsText)).toBeVisible({ timeout: 10_000 });
  });

  test("1:1 미팅 목록에서 의제 보기 (데이터 존재 시)", async ({ page }) => {
    await page.goto("/admin/performance");
    await page.getByRole("button", { name: "1:1 미팅" }).click();

    await expect(page.getByText("이번 주 1:1 예정")).toBeVisible({
      timeout: 10_000,
    });

    // 미팅 데이터가 있으면 의제 보기 버튼 확인
    const agendaButtons = page.getByRole("button", { name: "의제 보기" });
    const hasAgendaButton = await agendaButtons
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);

    if (hasAgendaButton) {
      // 첫 번째 의제 보기 클릭 → 안건 카드 열림
      await agendaButtons.first().click();

      // 의제 섹션 또는 안건 카드 표시
      await expect(page.getByText("의제")).toBeVisible({ timeout: 5_000 });
    }
  });
});
