import type { Page, Locator } from "@playwright/test";

/**
 * TenantsPage — 테넌트 관리 Page Object
 */
export class TenantsPage {
  readonly page: Page;
  readonly pageTitle: Locator;
  readonly searchInput: Locator;
  readonly drawerTitle: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageTitle = page.locator("text=테넌트 관리");
    this.searchInput = page.locator(
      'input[placeholder="회사명, 도메인으로 검색..."]',
    );
    this.drawerTitle = page.locator("text=테넌트 상세");
  }

  async goto() {
    await this.page.goto("/platform/tenants");
  }

  filterChip(label: string) {
    return this.page.locator("button", { hasText: label });
  }

  firstRow() {
    return this.page.locator("tbody tr").first();
  }
}
