import type { Page, Locator } from "@playwright/test";

/**
 * EmployeeHomePage — 직원 홈 Page Object
 */
export class EmployeeHomePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto("/employee");
  }

  sidebarLink(name: string) {
    return this.page.locator(`text=${name}`);
  }
}
