import type { Page, Locator } from "@playwright/test";

/**
 * LeavePage — 휴가 관리 Page Object
 */
export class LeavePage {
  readonly page: Page;
  readonly pageTitle: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageTitle = page.locator("text=휴가 관리");
  }

  async goto(tab?: string) {
    const url = tab ? `/admin/leave?tab=${tab}` : "/admin/leave";
    await this.page.goto(url);
  }

  tab(name: string) {
    return this.page.locator(`text=${name}`);
  }

  kpiCard(label: string) {
    return this.page.locator(`text=${label}`);
  }

  filterButton(label: string) {
    return this.page.locator("button", { hasText: label });
  }
}
