import { test, expect } from "@playwright/test";

const PLATFORM_PAGES = [
  { url: "/platform", h1: "플랫폼 운영 콘솔" },
  { url: "/platform/tenants", h1: "테넌트 관리" },
  { url: "/platform/billing", h1: "플랜 & 빌링" },
];

for (const { url, h1 } of PLATFORM_PAGES) {
  test(`${url} 페이지 로드 → H1: "${h1}"`, async ({ page }) => {
    await page.goto(url, { waitUntil: "networkidle" });
    await expect(page.locator("h1")).toContainText(h1, { timeout: 15_000 });
  });
}
