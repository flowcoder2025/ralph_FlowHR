import { test, expect } from "@playwright/test";

const ADMIN_PAGES = [
  { url: "/admin", h1: "안녕하세요, 관리자님" },
  { url: "/admin/people", h1: "직원 관리" },
  { url: "/admin/org-chart", h1: "조직도" },
  { url: "/admin/people/changes", h1: "인사 변동" },
  { url: "/admin/attendance", h1: "근태 관리" },
  { url: "/admin/leave", h1: "휴가 관리" },
  { url: "/admin/workflow", h1: "결재 관리" },
  { url: "/admin/documents", h1: "문서 관리" },
  { url: "/admin/payroll", h1: "급여 관리" },
  { url: "/admin/performance", h1: "성과 관리" },
  { url: "/admin/recruiting", h1: "채용 관리" },
  { url: "/admin/reports", h1: "리포트 센터" },
  { url: "/admin/settings", h1: "설정" },
];

for (const { url, h1 } of ADMIN_PAGES) {
  test(`${url} 페이지 로드 → H1: "${h1}"`, async ({ page }) => {
    await page.goto(url, { waitUntil: "networkidle" });
    await expect(page.locator("h1")).toContainText(h1, { timeout: 15_000 });
  });
}
