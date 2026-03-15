import type { Page, Locator } from "@playwright/test";

/**
 * EmployeeDocumentsPage — 직원 문서 Page Object
 */
export class EmployeeDocumentsPage {
  readonly page: Page;
  readonly signQueue: Locator;
  readonly archive: Locator;
  readonly documentViewer: Locator;
  readonly signArea: Locator;
  readonly signCompleteButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.signQueue = page.locator("text=서명 대기함");
    this.archive = page.locator("text=문서 보관함");
    this.documentViewer = page.locator("text=문서 뷰어");
    this.signArea = page.locator("text=여기에 서명");
    this.signCompleteButton = page.locator("button", { hasText: "서명 완료" });
  }

  async goto() {
    await this.page.goto("/employee/documents");
  }

  signButton() {
    return this.page.locator("button", { hasText: "서명하기" }).first();
  }

  filterButton(label: string) {
    return this.page.locator("button", { hasText: label });
  }
}
