import type { Page, Locator } from "@playwright/test";

/**
 * AttendancePage — 근태 관리 Page Object
 */
export class AttendancePage {
  readonly page: Page;
  readonly pageTitle: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageTitle = page.locator("text=근태 관리");
  }

  async goto(tab?: string) {
    const url = tab ? `/admin/attendance?tab=${tab}` : "/admin/attendance";
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

  searchInput(placeholder: string) {
    return this.page.locator(`input[placeholder="${placeholder}"]`);
  }
}
