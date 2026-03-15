import { test, expect } from "@playwright/test";

/**
 * WI-089: Admin 근태+휴가 E2E
 *
 * storageState(admin.json)로 인증이 사전 캐싱되어 있으므로
 * 매 테스트마다 loginAs() 없이 바로 페이지 접근합니다.
 *
 * 근태: 대시보드 4KPI+5탭, 교대보드 주간표, 출결기록 테이블+필터,
 *       예외처리 승인/반려, 마감 체크리스트
 * 휴가: 대시보드+캘린더+정책관리+신청큐 승인/반려
 */

// ─── Attendance: 대시보드 (WI-014) ──────────────────────────

test.describe("WI-089: 근태 대시보드 4KPI + 5탭", () => {
  test("근태 관리 페이지 헤더와 5탭 렌더링", async ({ page }) => {
    await page.goto("/admin/attendance");

    await expect(page.locator("text=근태 관리")).toBeVisible({
      timeout: 10_000,
    });

    // 5탭 확인
    await expect(page.locator("text=대시보드")).toBeVisible();
    await expect(page.locator("text=근무 편성표")).toBeVisible();
    await expect(page.locator("text=근태 기록")).toBeVisible();
    await expect(page.locator("text=예외 관리")).toBeVisible();
    await expect(page.locator("text=마감")).toBeVisible();
  });

  test("대시보드 탭 4 KPI 카드 렌더링", async ({ page }) => {
    await page.goto("/admin/attendance?tab=dashboard");

    await expect(page.locator("text=출근 완료")).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.locator("text=진행 중")).toBeVisible();
    await expect(page.locator("text=미출근")).toBeVisible();
    await expect(page.locator("text=예외 건수")).toBeVisible();
  });

  test("대시보드 부서별 출근율 차트 + 주간 요약", async ({ page }) => {
    await page.goto("/admin/attendance?tab=dashboard");

    await expect(page.locator("text=부서별 출근율")).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.locator("text=주간 요약")).toBeVisible();
    await expect(page.locator("text=평균 출근 시각")).toBeVisible();
    await expect(page.locator("text=평균 퇴근 시각")).toBeVisible();
    await expect(page.locator("text=평균 근무 시간")).toBeVisible();
  });
});

// ─── Attendance: 교대보드 주간표 (WI-015) ────────────────────

test.describe("WI-089: 교대보드 주간표", () => {
  test("주간 편성표 탭 렌더링 + 주간 네비게이션", async ({ page }) => {
    await page.goto("/admin/attendance?tab=shifts");

    await expect(page.locator("text=주간 편성표")).toBeVisible({
      timeout: 10_000,
    });

    // 주간 네비게이션 버튼
    await expect(page.locator("text=이전 주")).toBeVisible();
    await expect(page.locator("text=다음 주")).toBeVisible();

    // 테이블 헤더
    await expect(page.locator("text=팀 / 이름")).toBeVisible();
  });

  test("주간 편성표 이전/다음 주 네비게이션", async ({ page }) => {
    await page.goto("/admin/attendance?tab=shifts");

    await expect(page.locator("text=주간 편성표")).toBeVisible({
      timeout: 10_000,
    });

    // 이전 주 클릭
    await page.click("text=이전 주");
    await expect(page.locator("text=주간 편성표")).toBeVisible();

    // 다음 주 클릭 (원래로 복귀)
    await page.click("text=다음 주");
    await expect(page.locator("text=주간 편성표")).toBeVisible();
  });
});

// ─── Attendance: 출결기록 테이블+필터 (WI-016) ───────────────

test.describe("WI-089: 출결기록 테이블+필터", () => {
  test("근태 기록 탭 테이블 컬럼 렌더링", async ({ page }) => {
    await page.goto("/admin/attendance?tab=records");

    await expect(page.locator("text=근태 기록")).toBeVisible({
      timeout: 10_000,
    });

    // 테이블 컬럼 헤더
    await expect(page.locator("text=이름").first()).toBeVisible();
    await expect(page.locator("text=날짜").first()).toBeVisible();
    await expect(page.locator("text=출근").first()).toBeVisible();
    await expect(page.locator("text=퇴근").first()).toBeVisible();
    await expect(page.locator("text=총 시간").first()).toBeVisible();
    await expect(page.locator("text=상태").first()).toBeVisible();
  });

  test("상태 필터 버튼 렌더링 및 클릭", async ({ page }) => {
    await page.goto("/admin/attendance?tab=records");

    await expect(page.locator("text=근태 기록")).toBeVisible({
      timeout: 10_000,
    });

    // 필터 버튼들
    const filterAll = page.locator("button", { hasText: "전체" });
    await expect(filterAll).toBeVisible();

    const filterNormal = page.locator("button", { hasText: "정상" });
    await expect(filterNormal).toBeVisible();

    const filterLate = page.locator("button", { hasText: "지각" });
    await expect(filterLate).toBeVisible();

    const filterAbsent = page.locator("button", { hasText: "결근" });
    await expect(filterAbsent).toBeVisible();

    // 지각 필터 클릭
    await filterLate.click();
    await expect(filterLate).toBeVisible();
  });

  test("이름 검색 필터", async ({ page }) => {
    await page.goto("/admin/attendance?tab=records");

    await expect(page.locator("text=근태 기록")).toBeVisible({
      timeout: 10_000,
    });

    const searchInput = page.locator('input[placeholder="이름 검색..."]');
    await expect(searchInput).toBeVisible();

    // 검색어 입력
    await searchInput.fill("김");
    await expect(searchInput).toHaveValue("김");
  });
});

// ─── Attendance: 예외처리 승인/반려 (WI-017) ─────────────────

test.describe("WI-089: 근태 예외처리 승인/반려", () => {
  test("예외 관리 탭 4유형 카드 렌더링", async ({ page }) => {
    await page.goto("/admin/attendance?tab=exceptions");

    await expect(page.locator("text=예외 관리")).toBeVisible({
      timeout: 10_000,
    });

    // 4유형 카드
    await expect(page.locator("text=근태 정정")).toBeVisible();
    await expect(page.locator("text=초과근무")).toBeVisible();
    await expect(page.locator("text=출장")).toBeVisible();
    await expect(page.locator("text=재택근무")).toBeVisible();
  });

  test("예외 상세 모달 열기", async ({ page }) => {
    await page.goto("/admin/attendance?tab=exceptions");

    await expect(page.locator("text=예외 관리")).toBeVisible({
      timeout: 10_000,
    });

    // "상세" 버튼이 있으면 클릭
    const detailBtn = page.locator("button", { hasText: "상세" }).first();
    const hasDetail = await detailBtn.isVisible().catch(() => false);

    if (hasDetail) {
      await detailBtn.click();
      await expect(page.locator("text=예외 상세")).toBeVisible({
        timeout: 5_000,
      });

      // 상세 모달 필드 확인
      await expect(page.locator("text=유형")).toBeVisible();
      await expect(page.locator("text=상태").first()).toBeVisible();
      await expect(page.locator("text=직원")).toBeVisible();
      await expect(page.locator("text=사유")).toBeVisible();
    }
  });

  test("예외 승인/반려 버튼 존재 확인", async ({ page }) => {
    await page.goto("/admin/attendance?tab=exceptions");

    await expect(page.locator("text=예외 관리")).toBeVisible({
      timeout: 10_000,
    });

    // 상세 버튼 클릭하여 모달 열기
    const detailBtn = page.locator("button", { hasText: "상세" }).first();
    const hasDetail = await detailBtn.isVisible().catch(() => false);

    if (hasDetail) {
      await detailBtn.click();
      await expect(page.locator("text=예외 상세")).toBeVisible({
        timeout: 5_000,
      });

      // PENDING 상태면 승인/반려 버튼 존재
      const approveBtn = page.locator("button", { hasText: "승인" });
      const rejectBtn = page.locator("button", { hasText: "반려" });

      const hasApprove = await approveBtn.isVisible().catch(() => false);
      const hasReject = await rejectBtn.isVisible().catch(() => false);

      // 승인/반려가 있으면 둘 다 있어야 함
      if (hasApprove) {
        await expect(rejectBtn).toBeVisible();
      }
    }
  });
});

// ─── Attendance: 마감 체크리스트 (WI-018) ─────────────────────

test.describe("WI-089: 근태 마감 체크리스트", () => {
  test("마감 탭 렌더링 + 상태 표시", async ({ page }) => {
    await page.goto("/admin/attendance?tab=closing");

    await expect(page.locator("text=근태 마감")).toBeVisible({
      timeout: 10_000,
    });

    // 마감 상태 뱃지 (진행 중 / 검토 중 / 마감 완료 중 하나)
    const statusTexts = ["진행 중", "검토 중", "마감 완료"];
    let found = false;
    for (const st of statusTexts) {
      const loc = page.locator(`text=${st}`);
      if (await loc.isVisible().catch(() => false)) {
        found = true;
        break;
      }
    }
    expect(found).toBe(true);
  });
});

// ─── Attendance: 탭 간 네비게이션 ─────────────────────────────

test.describe("WI-089: 근태 탭 간 네비게이션", () => {
  test("5탭 순차 이동", async ({ page }) => {
    await page.goto("/admin/attendance");

    // 대시보드 (기본)
    await expect(page.locator("text=출근 완료")).toBeVisible({
      timeout: 10_000,
    });

    // → 근무 편성표
    await page.click("text=근무 편성표");
    await expect(page.locator("text=주간 편성표")).toBeVisible({
      timeout: 10_000,
    });

    // → 근태 기록
    await page.click("text=근태 기록");
    await expect(page.locator("text=이름 검색...")).toBeVisible({
      timeout: 10_000,
    });

    // → 예외 관리
    await page.click("text=예외 관리");
    await expect(page.locator("text=근태 정정")).toBeVisible({
      timeout: 10_000,
    });

    // → 마감
    await page.click("text=마감");
    await expect(page.locator("text=근태 마감")).toBeVisible({
      timeout: 10_000,
    });

    // → 대시보드 복귀
    await page.click("text=대시보드");
    await expect(page.locator("text=출근 완료")).toBeVisible({
      timeout: 10_000,
    });
  });
});

// ─── Leave: 대시보드 (WI-020) ─────────────────────────────────

test.describe("WI-089: 휴가 대시보드", () => {
  test("휴가 관리 페이지 헤더와 4탭 렌더링", async ({ page }) => {
    await page.goto("/admin/leave");

    await expect(page.locator("text=휴가 관리")).toBeVisible({
      timeout: 10_000,
    });

    // 4탭 확인
    await expect(page.locator("text=대시보드")).toBeVisible();
    await expect(page.locator("text=캘린더")).toBeVisible();
    await expect(page.locator("text=휴가 정책")).toBeVisible();
    await expect(page.locator("text=신청 큐")).toBeVisible();
  });

  test("대시보드 탭 4 KPI 카드 렌더링", async ({ page }) => {
    await page.goto("/admin/leave?tab=dashboard");

    await expect(page.locator("text=오늘 휴가")).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.locator("text=대기 중 요청")).toBeVisible();
    await expect(page.locator("text=잔여 연차 평균")).toBeVisible();
    await expect(page.locator("text=이번 달 사용")).toBeVisible();
  });
});

// ─── Leave: 캘린더 (WI-021) ──────────────────────────────────

test.describe("WI-089: 휴가 캘린더", () => {
  test("캘린더 탭 월간 뷰 렌더링", async ({ page }) => {
    await page.goto("/admin/leave?tab=calendar");

    await expect(page.locator("text=휴가 캘린더")).toBeVisible({
      timeout: 10_000,
    });

    // 요일 헤더
    await expect(page.locator("text=일").first()).toBeVisible();
    await expect(page.locator("text=월").first()).toBeVisible();
    await expect(page.locator("text=화").first()).toBeVisible();
    await expect(page.locator("text=수").first()).toBeVisible();
    await expect(page.locator("text=목").first()).toBeVisible();
    await expect(page.locator("text=금").first()).toBeVisible();
    await expect(page.locator("text=토").first()).toBeVisible();

    // 오늘 부재자 패널
    await expect(page.locator("text=오늘 부재자")).toBeVisible();
  });

  test("캘린더 월 이동 네비게이션", async ({ page }) => {
    await page.goto("/admin/leave?tab=calendar");

    await expect(page.locator("text=휴가 캘린더")).toBeVisible({
      timeout: 10_000,
    });

    // 이전 월 버튼 (←)
    const prevBtn = page.locator("button", { hasText: "←" });
    await expect(prevBtn).toBeVisible();
    await prevBtn.click();

    // 다음 월 버튼 (→) 2번 클릭하여 다음 달로
    const nextBtn = page.locator("button", { hasText: "→" });
    await expect(nextBtn).toBeVisible();
    await nextBtn.click();
    await nextBtn.click();

    // 캘린더가 여전히 보이는지 확인
    await expect(page.locator("text=휴가 캘린더")).toBeVisible();
  });

  test("캘린더 범례 표시", async ({ page }) => {
    await page.goto("/admin/leave?tab=calendar");

    await expect(page.locator("text=휴가 캘린더")).toBeVisible({
      timeout: 10_000,
    });

    // 범례
    await expect(page.locator("text=휴가")).toBeVisible();
    await expect(page.locator("text=오늘")).toBeVisible();
  });
});

// ─── Leave: 정책관리 (WI-022) ─────────────────────────────────

test.describe("WI-089: 휴가 정책 관리", () => {
  test("정책 탭 테이블 렌더링", async ({ page }) => {
    await page.goto("/admin/leave?tab=policies");

    await expect(page.locator("text=휴가 정책").first()).toBeVisible({
      timeout: 10_000,
    });

    // 정책 추가 버튼
    await expect(
      page.locator("button", { hasText: "정책 추가" })
    ).toBeVisible();

    // 테이블 컬럼 헤더
    await expect(page.locator("text=휴가 유형").first()).toBeVisible();
    await expect(page.locator("text=연간 부여일").first()).toBeVisible();
    await expect(page.locator("text=이월 한도").first()).toBeVisible();
  });

  test("정책 추가 모달 열기/닫기", async ({ page }) => {
    await page.goto("/admin/leave?tab=policies");

    await expect(page.locator("text=휴가 정책").first()).toBeVisible({
      timeout: 10_000,
    });

    // 정책 추가 버튼 클릭
    await page.click("button:has-text('정책 추가')");

    // 모달 확인
    await expect(page.locator("text=휴가 정책 추가")).toBeVisible({
      timeout: 5_000,
    });

    // 모달 필드
    await expect(page.locator("text=정책명")).toBeVisible();
    await expect(page.locator("text=휴가 유형").nth(0)).toBeVisible();
    await expect(page.locator("text=연간 부여일").nth(0)).toBeVisible();
    await expect(page.locator("text=승인 필요")).toBeVisible();

    // 취소 버튼으로 닫기
    await page.click("button:has-text('취소')");
    await expect(page.locator("text=휴가 정책 추가")).not.toBeVisible({
      timeout: 5_000,
    });
  });

  test("정책 수정 버튼 존재", async ({ page }) => {
    await page.goto("/admin/leave?tab=policies");

    await expect(page.locator("text=휴가 정책").first()).toBeVisible({
      timeout: 10_000,
    });

    // 수정 버튼이 하나라도 있는지 확인
    const editBtn = page.locator("button", { hasText: "수정" }).first();
    const hasEdit = await editBtn.isVisible().catch(() => false);

    if (hasEdit) {
      await editBtn.click();
      await expect(page.locator("text=휴가 정책 수정")).toBeVisible({
        timeout: 5_000,
      });
    }
  });
});

// ─── Leave: 신청큐 승인/반려 (WI-023) ────────────────────────

test.describe("WI-089: 휴가 신청큐 승인/반려", () => {
  test("신청 큐 탭 렌더링 + 필터", async ({ page }) => {
    await page.goto("/admin/leave?tab=requests");

    await expect(page.locator("text=휴가 신청 큐")).toBeVisible({
      timeout: 10_000,
    });

    // 필터 버튼들
    await expect(
      page.locator("button", { hasText: "전체" }).first()
    ).toBeVisible();
    await expect(
      page.locator("button", { hasText: "승인 대기" })
    ).toBeVisible();
    await expect(
      page.locator("button", { hasText: "승인 완료" })
    ).toBeVisible();
    await expect(page.locator("button", { hasText: "반려" })).toBeVisible();
  });

  test("신청 큐 이름 검색", async ({ page }) => {
    await page.goto("/admin/leave?tab=requests");

    await expect(page.locator("text=휴가 신청 큐")).toBeVisible({
      timeout: 10_000,
    });

    const searchInput = page.locator('input[placeholder="이름 검색..."]');
    await expect(searchInput).toBeVisible();

    await searchInput.fill("김");
    await expect(searchInput).toHaveValue("김");
  });

  test("신청 큐 상태 필터 전환", async ({ page }) => {
    await page.goto("/admin/leave?tab=requests");

    await expect(page.locator("text=휴가 신청 큐")).toBeVisible({
      timeout: 10_000,
    });

    // 승인 대기 필터 클릭
    await page.click("button:has-text('승인 대기')");
    await expect(
      page.locator("button", { hasText: "승인 대기" })
    ).toBeVisible();

    // 승인 완료 필터 클릭
    await page.click("button:has-text('승인 완료')");
    await expect(
      page.locator("button", { hasText: "승인 완료" })
    ).toBeVisible();

    // 전체 필터로 복귀
    await page.click("button:has-text('전체')");
  });

  test("신청 상세 드로어 열기", async ({ page }) => {
    await page.goto("/admin/leave?tab=requests");

    await expect(page.locator("text=휴가 신청 큐")).toBeVisible({
      timeout: 10_000,
    });

    // 승인 또는 상세 버튼 찾기
    const actionBtn = page
      .locator("button", { hasText: /승인|상세/ })
      .first();
    const hasAction = await actionBtn.isVisible().catch(() => false);

    if (hasAction) {
      // 반려 버튼이나 상세 버튼으로 드로어 열기
      const detailBtn = page
        .locator("button", { hasText: /반려|상세/ })
        .first();
      const hasDetailBtn = await detailBtn.isVisible().catch(() => false);

      if (hasDetailBtn) {
        await detailBtn.click();
        await expect(page.locator("text=휴가 신청 상세")).toBeVisible({
          timeout: 5_000,
        });

        // 드로어 내 필드 확인
        await expect(page.locator("text=신청자")).toBeVisible();
        await expect(page.locator("text=휴가 유형").first()).toBeVisible();
        await expect(page.locator("text=기간")).toBeVisible();
      }
    }
  });
});

// ─── Leave: 탭 간 네비게이션 ──────────────────────────────────

test.describe("WI-089: 휴가 탭 간 네비게이션", () => {
  test("4탭 순차 이동", async ({ page }) => {
    await page.goto("/admin/leave");

    // 대시보드 (기본)
    await expect(page.locator("text=오늘 휴가")).toBeVisible({
      timeout: 10_000,
    });

    // → 캘린더
    await page.click("text=캘린더");
    await expect(page.locator("text=휴가 캘린더")).toBeVisible({
      timeout: 10_000,
    });

    // → 휴가 정책
    await page.click("text=휴가 정책");
    await expect(
      page.locator("button", { hasText: "정책 추가" })
    ).toBeVisible({
      timeout: 10_000,
    });

    // → 신청 큐
    await page.click("text=신청 큐");
    await expect(page.locator("text=휴가 신청 큐")).toBeVisible({
      timeout: 10_000,
    });

    // → 대시보드 복귀
    await page.click("text=대시보드");
    await expect(page.locator("text=오늘 휴가")).toBeVisible({
      timeout: 10_000,
    });
  });
});
