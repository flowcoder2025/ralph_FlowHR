import type { Page, Locator } from "@playwright/test";

/**
 * AdminDashboardPage — 관리자 대시보드 Page Object
 */
export class AdminDashboardPage {
  readonly page: Page;
  readonly greeting: Locator;
  readonly todayQueue: Locator;
  readonly orgSnapshot: Locator;
  readonly approvalFunnel: Locator;
  readonly exceptionMonitor: Locator;
  readonly documentStatus: Locator;
  readonly payrollStatus: Locator;

  constructor(page: Page) {
    this.page = page;
    this.greeting = page.locator("text=안녕하세요, 관리자님");
    this.todayQueue = page.locator("text=오늘의 대기열");
    this.orgSnapshot = page.locator("text=조직 스냅샷");
    this.approvalFunnel = page.locator("text=승인 퍼널");
    this.exceptionMonitor = page.locator("text=예외 모니터");
    this.documentStatus = page.locator("text=문서 현황");
    this.payrollStatus = page.locator("text=급여 현황");
  }

  async goto() {
    await this.page.goto("/admin");
  }

  kpiCard(label: string) {
    return this.page.locator(`text=${label}`);
  }

  sidebarLink(name: string) {
    return this.page.locator(`text=${name}`);
  }
}
