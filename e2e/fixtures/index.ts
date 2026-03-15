import { test as base } from "@playwright/test";
import {
  LoginPage,
  AdminDashboardPage,
  PeoplePage,
  AttendancePage,
  LeavePage,
  EmployeeHomePage,
  SchedulePage,
  RequestsPage,
  EmployeeDocumentsPage,
  ProfilePage,
  PlatformDashboardPage,
  TenantsPage,
  BillingPage,
} from "../pages";

/**
 * Combined Fixtures — 도메인별 Page Object를 fixture로 제공
 *
 * 사용 예:
 *   import { test, expect } from "../fixtures";
 *   test("대시보드 렌더링", async ({ adminDashboard }) => { ... });
 */

type Fixtures = {
  loginPage: LoginPage;
  adminDashboard: AdminDashboardPage;
  peoplePage: PeoplePage;
  attendancePage: AttendancePage;
  leavePage: LeavePage;
  employeeHome: EmployeeHomePage;
  schedulePage: SchedulePage;
  requestsPage: RequestsPage;
  employeeDocuments: EmployeeDocumentsPage;
  profilePage: ProfilePage;
  platformDashboard: PlatformDashboardPage;
  tenantsPage: TenantsPage;
  billingPage: BillingPage;
};

export const test = base.extend<Fixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  adminDashboard: async ({ page }, use) => {
    await use(new AdminDashboardPage(page));
  },
  peoplePage: async ({ page }, use) => {
    await use(new PeoplePage(page));
  },
  attendancePage: async ({ page }, use) => {
    await use(new AttendancePage(page));
  },
  leavePage: async ({ page }, use) => {
    await use(new LeavePage(page));
  },
  employeeHome: async ({ page }, use) => {
    await use(new EmployeeHomePage(page));
  },
  schedulePage: async ({ page }, use) => {
    await use(new SchedulePage(page));
  },
  requestsPage: async ({ page }, use) => {
    await use(new RequestsPage(page));
  },
  employeeDocuments: async ({ page }, use) => {
    await use(new EmployeeDocumentsPage(page));
  },
  profilePage: async ({ page }, use) => {
    await use(new ProfilePage(page));
  },
  platformDashboard: async ({ page }, use) => {
    await use(new PlatformDashboardPage(page));
  },
  tenantsPage: async ({ page }, use) => {
    await use(new TenantsPage(page));
  },
  billingPage: async ({ page }, use) => {
    await use(new BillingPage(page));
  },
});

export { expect } from "@playwright/test";
