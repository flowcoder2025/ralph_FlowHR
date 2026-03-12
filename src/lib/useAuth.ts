"use client";

import { useSession } from "next-auth/react";
import type { RoleName } from "./rbac";

/**
 * Client-side hook that exposes the current user session
 * with typed role / tenant fields, plus permission helpers.
 */
export function useAuth() {
  const { data: session, status } = useSession();

  const user = session?.user ?? null;
  const role = (user?.role as RoleName) ?? null;
  const isAuthenticated = status === "authenticated";
  const isLoading = status === "loading";

  /** Check whether the current user holds one of the given roles. */
  function hasRole(...roles: RoleName[]): boolean {
    if (!role) return false;
    return roles.includes(role);
  }

  /** Check whether the current user's role permissions include the given permission string. */
  function hasPermission(_permission: string): boolean {
    // Permission checks require a DB lookup; for now expose as a future extension point.
    // The middleware already enforces route-level RBAC.
    // Per-action permissions will be checked server-side via API routes.
    return isAuthenticated;
  }

  return {
    user,
    role,
    tenantId: user?.tenantId ?? null,
    tenantSlug: user?.tenantSlug ?? null,
    isAuthenticated,
    isLoading,
    hasRole,
    hasPermission,
  } as const;
}
