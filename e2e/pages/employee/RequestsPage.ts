import type { Page, Locator } from "@playwright/test";

/**
 * RequestsPage — 직원 요청 Page Object
 */
export class RequestsPage {
  readonly page: Page;
  readonly pageTitle: Locator;
  readonly newRequestSection: Locator;
  readonly historySection: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageTitle = page.locator("h1", { hasText: "요청" });
    this.newRequestSection = page.locator("text=새 요청");
    this.historySection = page.locator("text=나의 요청 이력");
  }

  async goto() {
    await this.page.goto("/employee/requests");
  }

  requestCard(name: string) {
    return this.page.locator("button", { hasText: name }).first();
  }

  filterButton(label: string) {
    return this.page.locator("button", { hasText: label });
  }
}
