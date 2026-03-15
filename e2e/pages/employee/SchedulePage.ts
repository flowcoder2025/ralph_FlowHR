import type { Page, Locator } from "@playwright/test";

/**
 * SchedulePage — 직원 일정/근태 Page Object
 */
export class SchedulePage {
  readonly page: Page;
  readonly pageTitle: Locator;
  readonly clockInButton: Locator;
  readonly clockOutButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageTitle = page.locator("text=일정 · 근태");
    this.clockInButton = page.locator("button", { hasText: "출근" });
    this.clockOutButton = page.locator("button", { hasText: "퇴근" });
  }

  async goto() {
    await this.page.goto("/employee/schedule");
  }

  section(name: string) {
    return this.page.locator(`text=${name}`);
  }

  filterButton(label: string) {
    return this.page.locator("button", { hasText: label });
  }
}
