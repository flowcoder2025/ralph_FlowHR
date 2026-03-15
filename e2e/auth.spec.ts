import { test, expect } from "@playwright/test";

test.describe("로그인 플로우", () => {
  test("로그인 페이지 렌더링", async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto("/login", { waitUntil: "networkidle" });
    await page.waitForSelector('input[id="email"]', { timeout: 15_000 });
    await expect(page.locator("h1")).toContainText("로그인");
    await expect(page.locator('input[id="email"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    await ctx.close();
  });

  test("잘못된 자격 증명 → 에러 메시지", async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto("/login", { waitUntil: "networkidle" });
    await page.waitForSelector('input[id="email"]', { timeout: 15_000 });
    await page.fill('input[id="email"]', "wrong@example.com");
    await page.fill('input[id="password"]', "wrongpassword");
    await page.click('button[type="submit"]');
    await expect(page.locator("text=올바르지 않습니다")).toBeVisible({ timeout: 10_000 });
    await ctx.close();
  });

  test("Admin 로그인 → /admin 리다이렉트", async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto("/login?callbackUrl=/admin", { waitUntil: "networkidle" });
    await page.waitForSelector('input[id="email"]', { timeout: 15_000 });
    await page.fill('input[id="email"]', "admin@acme.example.com");
    await page.fill('input[id="password"]', "demo1234!");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/admin/, { timeout: 15_000 });
    await ctx.close();
  });

  test("Employee 로그인 → /employee 리다이렉트", async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto("/login?callbackUrl=/employee/schedule", { waitUntil: "networkidle" });
    await page.waitForSelector('input[id="email"]', { timeout: 15_000 });
    await page.fill('input[id="email"]', "employee@acme.example.com");
    await page.fill('input[id="password"]', "demo1234!");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/employee/, { timeout: 15_000 });
    await ctx.close();
  });

  test("Operator 로그인 → /platform 리다이렉트", async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto("/login?callbackUrl=/platform", { waitUntil: "networkidle" });
    await page.waitForSelector('input[id="email"]', { timeout: 15_000 });
    await page.fill('input[id="email"]', "operator@flowhr.io");
    await page.fill('input[id="password"]', "demo1234!");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/platform/, { timeout: 15_000 });
    await ctx.close();
  });
});

test.describe("접근 권한 — 미인증 리다이렉트", () => {
  test("미인증 → /admin 접근 시 /login 리다이렉트", async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
    await ctx.close();
  });

  test("미인증 → /employee 접근 시 /login 리다이렉트", async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto("/employee/schedule");
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
    await ctx.close();
  });

  test("미인증 → /platform 접근 시 /login 리다이렉트", async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto("/platform");
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
    await ctx.close();
  });
});
