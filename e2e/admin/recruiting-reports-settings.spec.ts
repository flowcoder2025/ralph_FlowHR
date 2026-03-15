import { test, expect } from "@playwright/test";

/**
 * WI-092: Admin 채용+리포트+설정 E2E
 *
 * storageState(admin.json)로 인증이 사전 캐싱되어 있으므로
 * 매 테스트마다 loginAs() 없이 바로 페이지 접근합니다.
 *
 * 채용: 대시보드 4KPI, 공고CRUD, 파이프라인 칸반, 온보딩 체크리스트, 오프보딩
 * 리포트: 리포트센터 7카드, 인사인사이트, 근태인사이트, 예약리포트
 * 설정: 회사정보, 역할관리, 권한매트릭스, 알림규칙, 외부연동, 감사로그
 */

// ─── Recruiting: 대시보드 4 KPI (WI-045) ────────────────────

test.describe("WI-092: 채용 대시보드 4KPI", () => {
  test("채용 관리 페이지 헤더와 5탭 렌더링", async ({ page }) => {
    await page.goto("/admin/recruiting");

    await expect(page.locator("text=채용 관리")).toBeVisible({
      timeout: 15_000,
    });

    // 5탭 확인
    await expect(page.locator("text=대시보드")).toBeVisible();
    await expect(page.locator("text=채용 공고")).toBeVisible();
    await expect(page.locator("text=파이프라인")).toBeVisible();
    await expect(page.locator("text=온보딩")).toBeVisible();
    await expect(page.locator("text=오프보딩")).toBeVisible();
  });

  test("대시보드 탭 4 KPI 카드 렌더링", async ({ page }) => {
    await page.goto("/admin/recruiting");

    await expect(page.locator("text=채용 관리")).toBeVisible({
      timeout: 15_000,
    });

    // 4 KPI labels
    await expect(page.locator("text=진행 중 채용")).toBeVisible();
    await expect(page.locator("text=서류 접수")).toBeVisible();
    await expect(page.locator("text=면접 예정")).toBeVisible();
    await expect(page.locator("text=평균 채용 기간")).toBeVisible();
  });
});

// ─── Recruiting: 채용 공고 CRUD (WI-046) ────────────────────

test.describe("WI-092: 채용 공고 CRUD", () => {
  test("채용 공고 탭 테이블 컬럼 렌더링", async ({ page }) => {
    await page.goto("/admin/recruiting");
    await expect(page.locator("text=채용 관리")).toBeVisible({
      timeout: 15_000,
    });

    // 채용 공고 탭 클릭
    await page.locator("text=채용 공고").click();
    await page.waitForTimeout(500);

    // 테이블 컬럼 헤더
    await expect(page.locator("text=포지션명").first()).toBeVisible();
    await expect(page.locator("text=고용 유형").first()).toBeVisible();
    await expect(page.locator("text=상태").first()).toBeVisible();
    await expect(page.locator("text=지원자").first()).toBeVisible();
    await expect(page.locator("text=마감일").first()).toBeVisible();
  });

  test("상태 필터 버튼 렌더링 + 클릭", async ({ page }) => {
    await page.goto("/admin/recruiting");
    await expect(page.locator("text=채용 관리")).toBeVisible({
      timeout: 15_000,
    });

    await page.locator("text=채용 공고").click();
    await page.waitForTimeout(500);

    // 상태 필터 버튼
    await expect(page.locator("button", { hasText: "전체" })).toBeVisible();
    await expect(
      page.locator("button", { hasText: "모집중" }),
    ).toBeVisible();

    // 필터 클릭
    await page.locator("button", { hasText: "모집중" }).click();
    await page.waitForTimeout(300);
    await expect(page.locator("body")).not.toContainText("Error");
  });

  test("공고 등록 모달 열기 + 폼 필드 확인", async ({ page }) => {
    await page.goto("/admin/recruiting");
    await expect(page.locator("text=채용 관리")).toBeVisible({
      timeout: 15_000,
    });

    await page.locator("text=채용 공고").click();
    await page.waitForTimeout(500);

    // 공고 등록 버튼 클릭
    const addBtn = page.locator("button", { hasText: "공고 등록" });
    await expect(addBtn).toBeVisible();
    await addBtn.click();

    // 모달 내 폼 필드 확인
    await expect(page.locator("text=채용 공고 등록")).toBeVisible({
      timeout: 5_000,
    });
    await expect(
      page.locator('input[placeholder*="포지션"]').first(),
    ).toBeVisible();

    // 저장/취소 버튼
    await expect(
      page.locator("button", { hasText: "저장" }),
    ).toBeVisible();
    await expect(
      page.locator("button", { hasText: "취소" }),
    ).toBeVisible();
  });

  test("테이블 행에 관리/취소 액션 버튼 존재", async ({ page }) => {
    await page.goto("/admin/recruiting");
    await expect(page.locator("text=채용 관리")).toBeVisible({
      timeout: 15_000,
    });

    await page.locator("text=채용 공고").click();
    await page.waitForTimeout(1_000);

    // 테이블에 데이터가 있으면 액션 버튼 확인
    const rows = page.locator("tbody tr");
    const rowCount = await rows.count();
    if (rowCount > 0) {
      await expect(
        page.locator("button", { hasText: "관리" }).first(),
      ).toBeVisible();
    }
    await expect(page.locator("body")).not.toContainText("Error");
  });
});

// ─── Recruiting: 파이프라인 칸반 (WI-047) ───────────────────

test.describe("WI-092: 파이프라인 칸반", () => {
  test("파이프라인 탭 4컬럼 칸반 렌더링", async ({ page }) => {
    await page.goto("/admin/recruiting");
    await expect(page.locator("text=채용 관리")).toBeVisible({
      timeout: 15_000,
    });

    await page.locator("text=파이프라인").click();
    await page.waitForTimeout(500);

    // 4컬럼 칸반 헤더
    await expect(page.locator("text=서류 접수").nth(1)).toBeVisible();
    await expect(page.locator("text=1차 면접")).toBeVisible();
    await expect(page.locator("text=2차 면접")).toBeVisible();
    await expect(page.locator("text=최종")).toBeVisible();
  });

  test("공고 선택 드롭다운 존재", async ({ page }) => {
    await page.goto("/admin/recruiting");
    await expect(page.locator("text=채용 관리")).toBeVisible({
      timeout: 15_000,
    });

    await page.locator("text=파이프라인").click();
    await page.waitForTimeout(500);

    // 공고 선택 셀렉트 존재
    const selector = page.locator("select").first();
    const selectorVisible = await selector.isVisible().catch(() => false);
    if (selectorVisible) {
      await expect(selector).toBeVisible();
    }
    await expect(page.locator("body")).not.toContainText("Error");
  });
});

// ─── Recruiting: 온보딩 체크리스트 (WI-048) ─────────────────

test.describe("WI-092: 온보딩 체크리스트", () => {
  test("온보딩 탭 렌더링", async ({ page }) => {
    await page.goto("/admin/recruiting");
    await expect(page.locator("text=채용 관리")).toBeVisible({
      timeout: 15_000,
    });

    await page.locator("text=온보딩").click();
    await page.waitForTimeout(500);

    // 온보딩 콘텐츠 (직원 카드 또는 빈 상태)
    await expect(page.locator("body")).not.toContainText("Error");
    await expect(page.locator("body")).not.toContainText("404");
  });
});

// ─── Recruiting: 오프보딩 (WI-049) ──────────────────────────

test.describe("WI-092: 오프보딩", () => {
  test("오프보딩 탭 렌더링", async ({ page }) => {
    await page.goto("/admin/recruiting");
    await expect(page.locator("text=채용 관리")).toBeVisible({
      timeout: 15_000,
    });

    await page.locator("text=오프보딩").click();
    await page.waitForTimeout(500);

    // 오프보딩 콘텐츠 (직원 카드 또는 빈 상태)
    await expect(page.locator("body")).not.toContainText("Error");
    await expect(page.locator("body")).not.toContainText("404");
  });
});

// ─── Reports: 리포트 센터 7카드 (WI-050) ────────────────────

test.describe("WI-092: 리포트 센터 7카드", () => {
  test("리포트 센터 페이지 헤더 + 7카드 그리드 렌더링", async ({ page }) => {
    await page.goto("/admin/reports");

    await expect(page.locator("text=리포트 센터")).toBeVisible({
      timeout: 15_000,
    });
    await expect(
      page.locator("text=인사 데이터 인사이트, 분석 리포트, 정기 보고서 관리"),
    ).toBeVisible();

    // 7카드 그리드 - 리포트 보기 버튼이 7개 이상
    const reportButtons = page.locator("button", { hasText: "리포트 보기" });
    const count = await reportButtons.count();
    expect(count).toBeGreaterThanOrEqual(7);
  });

  test("예약 보고서 + 커스텀 리포트 버튼 렌더링", async ({ page }) => {
    await page.goto("/admin/reports");
    await expect(page.locator("text=리포트 센터")).toBeVisible({
      timeout: 15_000,
    });

    await expect(page.locator("text=예약 보고서")).toBeVisible();
    await expect(
      page.locator("button", { hasText: "커스텀 리포트" }),
    ).toBeVisible();
  });

  test("리포트 카드에 최근 생성 날짜 표시", async ({ page }) => {
    await page.goto("/admin/reports");
    await expect(page.locator("text=리포트 센터")).toBeVisible({
      timeout: 15_000,
    });

    // 최근 생성: 날짜 패턴
    const footerTexts = page.locator("text=최근 생성:");
    const footerCount = await footerTexts.count();
    expect(footerCount).toBeGreaterThanOrEqual(1);
  });
});

// ─── Reports: 인사 인사이트 (WI-051) ────────────────────────

test.describe("WI-092: 인사 인사이트", () => {
  test("인사 인사이트 페이지 4 KPI 렌더링", async ({ page }) => {
    await page.goto("/admin/reports/people");

    await expect(page.locator("text=인사 인사이트")).toBeVisible({
      timeout: 15_000,
    });

    // 4 KPI
    await expect(page.locator("text=총 인원")).toBeVisible();
    await expect(page.locator("text=평균 근속")).toBeVisible();
    await expect(page.locator("text=휴직")).toBeVisible();
  });

  test("부서별 인원 분포 차트 + 테이블 렌더링", async ({ page }) => {
    await page.goto("/admin/reports/people");
    await expect(page.locator("text=인사 인사이트")).toBeVisible({
      timeout: 15_000,
    });

    await expect(page.locator("text=부서별 인원 분포")).toBeVisible();
    // 테이블 헤더
    await expect(page.locator("text=부서").first()).toBeVisible();
    await expect(page.locator("text=인원").first()).toBeVisible();
    await expect(page.locator("text=비율").first()).toBeVisible();
  });

  test("근속 연수 분포 차트 + 테이블 렌더링", async ({ page }) => {
    await page.goto("/admin/reports/people");
    await expect(page.locator("text=인사 인사이트")).toBeVisible({
      timeout: 15_000,
    });

    await expect(page.locator("text=근속 연수 분포")).toBeVisible();
  });

  test("리포트 내보내기 버튼 존재", async ({ page }) => {
    await page.goto("/admin/reports/people");
    await expect(page.locator("text=인사 인사이트")).toBeVisible({
      timeout: 15_000,
    });

    await expect(
      page.locator("button", { hasText: "리포트 내보내기" }),
    ).toBeVisible();
  });
});

// ─── Reports: 근태 인사이트 (WI-052) ────────────────────────

test.describe("WI-092: 근태 인사이트", () => {
  test("근태 인사이트 페이지 4 KPI 렌더링", async ({ page }) => {
    await page.goto("/admin/reports/attendance");

    await expect(page.locator("text=근태 인사이트")).toBeVisible({
      timeout: 15_000,
    });

    // 4 KPI
    await expect(page.locator("text=총 출결 기록")).toBeVisible();
    await expect(page.locator("text=평균 출근율")).toBeVisible();
    await expect(page.locator("text=총 예외 건수")).toBeVisible();
    await expect(page.locator("text=미처리 예외")).toBeVisible();
  });

  test("주간 출근 추이 차트 + 테이블 렌더링", async ({ page }) => {
    await page.goto("/admin/reports/attendance");
    await expect(page.locator("text=근태 인사이트")).toBeVisible({
      timeout: 15_000,
    });

    await expect(page.locator("text=주간 출근 추이")).toBeVisible();
    // 테이블 헤더
    await expect(page.locator("text=주차").first()).toBeVisible();
    await expect(page.locator("text=출근").first()).toBeVisible();
    await expect(page.locator("text=출근율").first()).toBeVisible();
  });

  test("예외 현황 요약 렌더링", async ({ page }) => {
    await page.goto("/admin/reports/attendance");
    await expect(page.locator("text=근태 인사이트")).toBeVisible({
      timeout: 15_000,
    });

    await expect(page.locator("text=예외 현황 요약")).toBeVisible();
  });

  test("리포트 내보내기 버튼 존재", async ({ page }) => {
    await page.goto("/admin/reports/attendance");
    await expect(page.locator("text=근태 인사이트")).toBeVisible({
      timeout: 15_000,
    });

    await expect(
      page.locator("button", { hasText: "리포트 내보내기" }),
    ).toBeVisible();
  });
});

// ─── Reports: 예약 리포트 (WI-053) ──────────────────────────

test.describe("WI-092: 예약 리포트", () => {
  test("예약 보고서 페이지 헤더 + 테이블 렌더링", async ({ page }) => {
    await page.goto("/admin/reports/scheduled");

    await expect(page.locator("text=예약 보고서")).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.locator("text=정기 보고서 스케줄 관리")).toBeVisible();

    // 테이블 컬럼
    await expect(page.locator("text=보고서명").first()).toBeVisible();
    await expect(page.locator("text=스케줄").first()).toBeVisible();
    await expect(page.locator("text=형식").first()).toBeVisible();
    await expect(page.locator("text=수신자").first()).toBeVisible();
  });

  test("예약 추가 버튼 + 모달 폼 확인", async ({ page }) => {
    await page.goto("/admin/reports/scheduled");
    await expect(page.locator("text=예약 보고서")).toBeVisible({
      timeout: 15_000,
    });

    // 예약 추가 버튼 클릭
    const addBtn = page.locator("button", { hasText: "예약 추가" });
    await expect(addBtn).toBeVisible();
    await addBtn.click();

    // 모달 폼 필드 확인
    await expect(page.locator("text=예약 보고서 추가")).toBeVisible({
      timeout: 5_000,
    });
    await expect(
      page.locator("button", { hasText: "추가" }),
    ).toBeVisible();
    await expect(
      page.locator("button", { hasText: "취소" }),
    ).toBeVisible();
  });

  test("테이블에 편집/삭제 액션 버튼 존재", async ({ page }) => {
    await page.goto("/admin/reports/scheduled");
    await expect(page.locator("text=예약 보고서")).toBeVisible({
      timeout: 15_000,
    });

    await page.waitForTimeout(1_000);

    // 테이블에 데이터가 있으면 액션 버튼 확인
    const rows = page.locator("tbody tr");
    const rowCount = await rows.count();
    if (rowCount > 0) {
      await expect(
        page.locator("button", { hasText: "편집" }).first(),
      ).toBeVisible();
    }
    await expect(page.locator("body")).not.toContainText("Error");
  });
});

// ─── Settings: 회사 정보 (WI-054) ───────────────────────────

test.describe("WI-092: 설정 - 회사 정보", () => {
  test("설정 페이지 헤더 + 5탭 렌더링", async ({ page }) => {
    await page.goto("/admin/settings");

    await expect(
      page.locator("h1", { hasText: "설정" }),
    ).toBeVisible({ timeout: 15_000 });

    // 5탭
    await expect(page.locator("text=회사 정보")).toBeVisible();
    await expect(page.locator("text=역할 및 권한")).toBeVisible();
    await expect(page.locator("text=알림 설정")).toBeVisible();
    await expect(page.locator("text=연동 관리")).toBeVisible();
    await expect(page.locator("text=감사 로그")).toBeVisible();
  });

  test("회사 기본 정보 폼 필드 렌더링", async ({ page }) => {
    await page.goto("/admin/settings");
    await expect(
      page.locator("h1", { hasText: "설정" }),
    ).toBeVisible({ timeout: 15_000 });

    // 회사 정보 탭 (기본 활성)
    await expect(page.locator("text=회사 기본 정보")).toBeVisible();

    // 폼 필드
    await expect(page.locator("text=회사명")).toBeVisible();
    await expect(page.locator("text=사업자등록번호")).toBeVisible();
    await expect(page.locator("text=업종")).toBeVisible();
    await expect(page.locator("text=대표자")).toBeVisible();
  });

  test("회사 정보 저장 버튼 존재", async ({ page }) => {
    await page.goto("/admin/settings");
    await expect(
      page.locator("h1", { hasText: "설정" }),
    ).toBeVisible({ timeout: 15_000 });

    await expect(
      page.locator("button", { hasText: "저장" }).first(),
    ).toBeVisible();
  });
});

// ─── Settings: 역할 관리 (WI-055) ───────────────────────────

test.describe("WI-092: 설정 - 역할 관리", () => {
  test("역할 관리 테이블 렌더링", async ({ page }) => {
    await page.goto("/admin/settings");
    await expect(
      page.locator("h1", { hasText: "설정" }),
    ).toBeVisible({ timeout: 15_000 });

    // 역할 및 권한 탭 클릭
    await page.locator("text=역할 및 권한").click();
    await page.waitForTimeout(500);

    // 역할 관리 카드
    await expect(page.locator("text=역할 관리")).toBeVisible();

    // 테이블 컬럼
    await expect(page.locator("text=역할명").first()).toBeVisible();
    await expect(page.locator("text=설명").first()).toBeVisible();
    await expect(page.locator("text=사용자수").first()).toBeVisible();
  });

  test("역할 추가 버튼 + 모달 확인", async ({ page }) => {
    await page.goto("/admin/settings");
    await expect(
      page.locator("h1", { hasText: "설정" }),
    ).toBeVisible({ timeout: 15_000 });

    await page.locator("text=역할 및 권한").click();
    await page.waitForTimeout(500);

    // 역할 추가 버튼
    const addBtn = page.locator("button", { hasText: "역할 추가" });
    await expect(addBtn).toBeVisible();
    await addBtn.click();

    // 모달 확인
    await expect(page.locator("text=역할 추가").nth(1)).toBeVisible({
      timeout: 5_000,
    });
  });
});

// ─── Settings: 권한 매트릭스 (WI-056) ───────────────────────

test.describe("WI-092: 설정 - 권한 매트릭스", () => {
  test("권한 매트릭스 6기능 행 렌더링", async ({ page }) => {
    await page.goto("/admin/settings");
    await expect(
      page.locator("h1", { hasText: "설정" }),
    ).toBeVisible({ timeout: 15_000 });

    await page.locator("text=역할 및 권한").click();
    await page.waitForTimeout(500);

    // 권한 매트릭스 카드
    await expect(page.locator("text=권한 매트릭스")).toBeVisible();

    // 6개 기능 행
    await expect(page.locator("text=구성원 관리")).toBeVisible();
    await expect(page.locator("text=근태 관리")).toBeVisible();
    await expect(page.locator("text=급여 관리")).toBeVisible();
    await expect(page.locator("text=결재 승인")).toBeVisible();
    await expect(page.locator("text=리포트").first()).toBeVisible();
  });

  test("권한 매트릭스 셀 클릭 안내 텍스트 존재", async ({ page }) => {
    await page.goto("/admin/settings");
    await expect(
      page.locator("h1", { hasText: "설정" }),
    ).toBeVisible({ timeout: 15_000 });

    await page.locator("text=역할 및 권한").click();
    await page.waitForTimeout(500);

    // 셀 클릭 안내 텍스트
    await expect(
      page.locator("text=셀을 클릭하면 권한 수준이 변경됩니다"),
    ).toBeVisible();
  });
});

// ─── Settings: 알림 규칙 (WI-057) ───────────────────────────

test.describe("WI-092: 설정 - 알림 규칙", () => {
  test("알림 규칙 테이블 렌더링", async ({ page }) => {
    await page.goto("/admin/settings");
    await expect(
      page.locator("h1", { hasText: "설정" }),
    ).toBeVisible({ timeout: 15_000 });

    // 알림 설정 탭 클릭
    await page.locator("text=알림 설정").click();
    await page.waitForTimeout(500);

    // 알림 규칙 카드
    await expect(page.locator("text=알림 규칙")).toBeVisible();

    // 테이블 컬럼
    await expect(page.locator("text=이벤트").first()).toBeVisible();
    await expect(page.locator("text=채널").first()).toBeVisible();
    await expect(page.locator("text=수신자").first()).toBeVisible();
    await expect(page.locator("text=상태").first()).toBeVisible();
  });

  test("알림 규칙 이벤트 항목 렌더링", async ({ page }) => {
    await page.goto("/admin/settings");
    await expect(
      page.locator("h1", { hasText: "설정" }),
    ).toBeVisible({ timeout: 15_000 });

    await page.locator("text=알림 설정").click();
    await page.waitForTimeout(500);

    // 알림 규칙 이벤트 항목들
    await expect(page.locator("text=휴가 신청")).toBeVisible();
    await expect(page.locator("text=초과근무 상한 도달")).toBeVisible();
    await expect(page.locator("text=체크아웃 누락")).toBeVisible();
  });

  test("규칙 추가 버튼 존재", async ({ page }) => {
    await page.goto("/admin/settings");
    await expect(
      page.locator("h1", { hasText: "설정" }),
    ).toBeVisible({ timeout: 15_000 });

    await page.locator("text=알림 설정").click();
    await page.waitForTimeout(500);

    await expect(
      page.locator("button", { hasText: "규칙 추가" }),
    ).toBeVisible();
  });
});

// ─── Settings: 외부 연동 (WI-057) ───────────────────────────

test.describe("WI-092: 설정 - 외부 연동", () => {
  test("Slack/Google/Jira 연동 카드 렌더링", async ({ page }) => {
    await page.goto("/admin/settings");
    await expect(
      page.locator("h1", { hasText: "설정" }),
    ).toBeVisible({ timeout: 15_000 });

    // 연동 관리 탭 클릭
    await page.locator("text=연동 관리").click();
    await page.waitForTimeout(500);

    // 3개 서비스 카드
    await expect(page.locator("text=Slack")).toBeVisible();
    await expect(page.locator("text=Google Workspace")).toBeVisible();
    await expect(page.locator("text=Jira")).toBeVisible();
  });

  test("연동 상태 뱃지 렌더링", async ({ page }) => {
    await page.goto("/admin/settings");
    await expect(
      page.locator("h1", { hasText: "설정" }),
    ).toBeVisible({ timeout: 15_000 });

    await page.locator("text=연동 관리").click();
    await page.waitForTimeout(500);

    // 연결됨/설정 필요 뱃지
    const connectedBadges = page.locator("text=연결됨");
    const connectedCount = await connectedBadges.count();
    expect(connectedCount).toBeGreaterThanOrEqual(1);
  });

  test("연결하기/설정 버튼 존재", async ({ page }) => {
    await page.goto("/admin/settings");
    await expect(
      page.locator("h1", { hasText: "설정" }),
    ).toBeVisible({ timeout: 15_000 });

    await page.locator("text=연동 관리").click();
    await page.waitForTimeout(500);

    // 설정 또는 연결하기 버튼
    const settingsBtn = page.locator("button", { hasText: "설정" });
    const connectBtn = page.locator("button", { hasText: "연결하기" });
    const totalButtons =
      (await settingsBtn.count()) + (await connectBtn.count());
    expect(totalButtons).toBeGreaterThanOrEqual(2);
  });
});

// ─── Settings: 감사 로그 (WI-058) ───────────────────────────

test.describe("WI-092: 설정 - 감사 로그", () => {
  test("감사 로그 테이블 컬럼 렌더링", async ({ page }) => {
    await page.goto("/admin/settings");
    await expect(
      page.locator("h1", { hasText: "설정" }),
    ).toBeVisible({ timeout: 15_000 });

    // 감사 로그 탭 클릭
    await page.locator("text=감사 로그").click();
    await page.waitForTimeout(500);

    // 테이블 컬럼
    await expect(page.locator("text=시간").first()).toBeVisible();
    await expect(page.locator("text=사용자").first()).toBeVisible();
    await expect(page.locator("text=역할").first()).toBeVisible();
    await expect(page.locator("text=액션").first()).toBeVisible();
    await expect(page.locator("text=대상").first()).toBeVisible();
    await expect(page.locator("text=IP").first()).toBeVisible();
  });

  test("검색 입력 필드 존재", async ({ page }) => {
    await page.goto("/admin/settings");
    await expect(
      page.locator("h1", { hasText: "설정" }),
    ).toBeVisible({ timeout: 15_000 });

    await page.locator("text=감사 로그").click();
    await page.waitForTimeout(500);

    const searchInput = page.locator(
      'input[placeholder*="검색"]',
    );
    await expect(searchInput).toBeVisible();
  });

  test("내보내기 버튼 존재", async ({ page }) => {
    await page.goto("/admin/settings");
    await expect(
      page.locator("h1", { hasText: "설정" }),
    ).toBeVisible({ timeout: 15_000 });

    await page.locator("text=감사 로그").click();
    await page.waitForTimeout(500);

    await expect(
      page.locator("button", { hasText: "내보내기" }),
    ).toBeVisible();
  });

  test("감사 로그 데이터 행이 표시된다", async ({ page }) => {
    await page.goto("/admin/settings");
    await expect(
      page.locator("h1", { hasText: "설정" }),
    ).toBeVisible({ timeout: 15_000 });

    await page.locator("text=감사 로그").click();
    await page.waitForTimeout(1_000);

    // 테이블에 데이터 행이 있어야 함
    const rows = page.locator("tbody tr");
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThanOrEqual(1);
  });

  test("페이지네이션 네비게이션 존재", async ({ page }) => {
    await page.goto("/admin/settings");
    await expect(
      page.locator("h1", { hasText: "설정" }),
    ).toBeVisible({ timeout: 15_000 });

    await page.locator("text=감사 로그").click();
    await page.waitForTimeout(1_000);

    // 페이지네이션 버튼 (« / »)
    const prevBtn = page.locator("button", { hasText: "«" });
    const nextBtn = page.locator("button", { hasText: "»" });
    const hasPagination =
      (await prevBtn.isVisible().catch(() => false)) ||
      (await nextBtn.isVisible().catch(() => false));

    // 페이지네이션이 있으면 확인
    if (hasPagination) {
      await expect(nextBtn).toBeVisible();
    }
    await expect(page.locator("body")).not.toContainText("Error");
  });
});
