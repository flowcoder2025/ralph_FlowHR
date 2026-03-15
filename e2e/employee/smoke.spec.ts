import { test, expect } from "@playwright/test";

const EMPLOYEE_PAGES = [
  { url: "/employee/requests", h1: "요청" },
  { url: "/employee/documents", h1: "문서 · 서명" },
  { url: "/employee/profile", h1: "내 정보" },
];

for (const { url, h1 } of EMPLOYEE_PAGES) {
  test(`${url} 페이지 로드 → H1: "${h1}"`, async ({ page }) => {
    await page.goto(url, { waitUntil: "networkidle" });
    await expect(page.locator("h1")).toContainText(h1, { timeout: 15_000 });
  });
}

test("/employee/schedule 페이지 로드", async ({ page }) => {
  await page.goto("/employee/schedule", { waitUntil: "networkidle" });
  await expect(page).not.toHaveURL(/\/login/);
});
