/**
 * RBAC (Role-Based Access Control) configuration.
 *
 * Route groups and the roles allowed to access each group.
 * The middleware uses these definitions to guard routes.
 */

export const ROLES = {
  PLATFORM_OPERATOR: "PLATFORM_OPERATOR",
  SUPER_ADMIN: "SUPER_ADMIN",
  HR_ADMIN: "HR_ADMIN",
  MANAGER: "MANAGER",
  EMPLOYEE: "EMPLOYEE",
} as const;

export type RoleName = (typeof ROLES)[keyof typeof ROLES];

/** Roles that belong to a tenant (i.e. NOT platform-level). */
export const TENANT_ROLES: readonly RoleName[] = [
  ROLES.SUPER_ADMIN,
  ROLES.HR_ADMIN,
  ROLES.MANAGER,
  ROLES.EMPLOYEE,
];

/** Tenant roles that can access admin pages. */
export const ADMIN_ROLES: readonly RoleName[] = [
  ROLES.SUPER_ADMIN,
  ROLES.HR_ADMIN,
  ROLES.MANAGER,
];

/**
 * Route-prefix → allowed-roles mapping.
 * Order matters: the first matching prefix wins.
 */
export const ROUTE_ROLE_MAP: { prefix: string; roles: readonly RoleName[] }[] =
  [
    // 페이지
    { prefix: "/platform", roles: [ROLES.PLATFORM_OPERATOR] },
    { prefix: "/admin", roles: ADMIN_ROLES },
    { prefix: "/employee", roles: TENANT_ROLES },
    // API (Employee API는 Employee 포함 전체 tenant role 허용)
    { prefix: "/api/platform", roles: [ROLES.PLATFORM_OPERATOR] },
    { prefix: "/api/admin", roles: ADMIN_ROLES },
    { prefix: "/api/employees", roles: ADMIN_ROLES },
    { prefix: "/api/employee-changes", roles: ADMIN_ROLES },
    { prefix: "/api/employee", roles: TENANT_ROLES },
    // Admin 전용 API
    { prefix: "/api/attendance", roles: ADMIN_ROLES },
    { prefix: "/api/leave", roles: ADMIN_ROLES },
    { prefix: "/api/departments", roles: ADMIN_ROLES },
    { prefix: "/api/positions", roles: ADMIN_ROLES },
    { prefix: "/api/documents/sign", roles: TENANT_ROLES },
    { prefix: "/api/documents", roles: ADMIN_ROLES },
    { prefix: "/api/payroll", roles: ADMIN_ROLES },
    { prefix: "/api/performance", roles: ADMIN_ROLES },
    { prefix: "/api/recruiting", roles: ADMIN_ROLES },
    { prefix: "/api/reports", roles: ADMIN_ROLES },
    { prefix: "/api/settings", roles: ADMIN_ROLES },
    { prefix: "/api/workflow", roles: ADMIN_ROLES },
    { prefix: "/api/approval", roles: ADMIN_ROLES },
    { prefix: "/api/export", roles: ADMIN_ROLES },
  ];

/** Routes that anyone (including unauthenticated users) can access. */
export const PUBLIC_ROUTES: string[] = [
  "/",
  "/login",
  "/api/auth",
  "/landing",
  "/forbidden",
];

/**
 * Check whether a given role name is allowed for a specific pathname.
 * Returns `true` if allowed, `false` if explicitly denied,
 * or `null` if no rule matched (treat as allowed).
 */
export function isRoleAllowed(
  pathname: string,
  role: string | null | undefined,
): boolean | null {
  for (const rule of ROUTE_ROLE_MAP) {
    if (pathname.startsWith(rule.prefix)) {
      if (!role) return false;
      return (rule.roles as readonly string[]).includes(role);
    }
  }
  return null; // no rule matched → no restriction
}

/**
 * Return the default redirect path after login, based on the user's role.
 */
export function getDefaultRedirect(role: string | null | undefined): string {
  switch (role) {
    case ROLES.PLATFORM_OPERATOR:
      return "/platform";
    case ROLES.SUPER_ADMIN:
    case ROLES.HR_ADMIN:
    case ROLES.MANAGER:
      return "/admin";
    case ROLES.EMPLOYEE:
      return "/employee";
    default:
      return "/";
  }
}
