import type { Page, Locator } from "@playwright/test";

/**
 * ProfilePage — 직원 프로필 Page Object
 */
export class ProfilePage {
  readonly page: Page;
  readonly pageTitle: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageTitle = page.locator("h1", { hasText: "내 정보" });
  }

  async goto() {
    await this.page.goto("/employee/profile");
  }

  tab(name: string) {
    return this.page.locator("button", { hasText: name });
  }
}
