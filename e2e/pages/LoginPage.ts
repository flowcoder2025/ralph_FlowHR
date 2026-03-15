import type { Page, Locator } from "@playwright/test";

/**
 * LoginPage — 로그인 페이지 Page Object
 */
export class LoginPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;
  readonly demoSection: Locator;
  readonly googleSSOButton: Locator;
  readonly microsoftSSOButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.locator("h1");
    this.emailInput = page.locator('input[id="email"]');
    this.passwordInput = page.locator('input[id="password"]');
    this.submitButton = page.locator('button[type="submit"]');
    this.errorMessage = page.locator(
      "text=이메일 또는 비밀번호가 올바르지 않습니다",
    );
    this.demoSection = page.locator("text=데모 빠른 접근");
    this.googleSSOButton = page.getByText("Google 계정으로 로그인");
    this.microsoftSSOButton = page.getByText("Microsoft 계정으로 로그인");
  }

  async goto() {
    await this.page.goto("/login");
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  demoButton(role: "admin" | "employee" | "operator") {
    const labels = {
      admin: "Tenant Admin으로 로그인",
      employee: "Tenant Employee로 로그인",
      operator: "Platform Operator로 로그인",
    };
    return this.page.getByText(labels[role]);
  }
}
