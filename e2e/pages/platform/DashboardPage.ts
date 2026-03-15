import type { Page, Locator } from "@playwright/test";

/**
 * PlatformDashboardPage — 플랫폼 대시보드 Page Object
 */
export class PlatformDashboardPage {
  readonly page: Page;
  readonly pageTitle: Locator;
  readonly operationsQueue: Locator;
  readonly healthSignals: Locator;
  readonly securitySignals: Locator;
  readonly recentChanges: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageTitle = page.locator("text=플랫폼 운영 콘솔");
    this.operationsQueue = page.locator("text=운영 큐");
    this.healthSignals = page.locator("text=플랫폼 상태 신호");
    this.securitySignals = page.locator("text=보안 신호");
    this.recentChanges = page.locator("text=최근 테넌트 변경");
  }

  async goto() {
    await this.page.goto("/platform");
  }

  kpiCard(label: string) {
    return this.page.locator(`text=${label}`);
  }

  sidebarLink(name: string) {
    return this.page.locator(`text=${name}`);
  }
}
