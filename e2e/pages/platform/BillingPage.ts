import type { Page, Locator } from "@playwright/test";

/**
 * BillingPage — 플랜 & 빌링 Page Object
 */
export class BillingPage {
  readonly page: Page;
  readonly pageTitle: Locator;
  readonly planCatalog: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageTitle = page.locator("text=플랜 & 빌링").first();
    this.planCatalog = page.locator("text=플랜 카탈로그");
  }

  async goto() {
    await this.page.goto("/platform/billing");
  }

  kpiCard(label: string) {
    return this.page.locator(`text=${label}`);
  }

  tab(name: string) {
    return this.page.locator("button", { hasText: name });
  }
}
