import type { Page, Locator } from "@playwright/test";

/**
 * PeoplePage — 직원 관리 Page Object
 */
export class PeoplePage {
  readonly page: Page;
  readonly pageTitle: Locator;
  readonly searchInput: Locator;
  readonly tableBody: Locator;
  readonly drawerTitle: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageTitle = page.locator("text=직원 관리");
    this.searchInput = page.locator(
      'input[placeholder="이름, 부서, 직위 검색..."]',
    );
    this.tableBody = page.locator("tbody");
    this.drawerTitle = page.locator("text=구성원 상세");
  }

  async goto() {
    await this.page.goto("/admin/people");
  }

  async gotoOrgChart() {
    await this.page.goto("/admin/org-chart");
  }

  async gotoChanges() {
    await this.page.goto("/admin/people/changes");
  }

  statusFilter(status: string) {
    return this.page.locator("button", { hasText: status });
  }

  firstRow() {
    return this.page.locator("tbody tr").first();
  }
}
