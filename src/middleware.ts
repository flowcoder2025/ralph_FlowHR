import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { isRoleAllowed, PUBLIC_ROUTES } from "./lib/rbac";

// ─── 간단한 인메모리 rate limiter (로그인 보호) ──────
const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const LOGIN_RATE_LIMIT = 10; // 최대 시도 횟수
const LOGIN_RATE_WINDOW = 15 * 60 * 1000; // 15분

function checkLoginRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = loginAttempts.get(ip);
  if (!entry || now > entry.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + LOGIN_RATE_WINDOW });
    return true;
  }
  if (entry.count >= LOGIN_RATE_LIMIT) return false;
  entry.count++;
  return true;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rate limit: 로그인 POST 요청 제한
  if (pathname.startsWith("/api/auth") && request.method === "POST") {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (!checkLoginRateLimit(ip)) {
      return NextResponse.json(
        { error: "너무 많은 로그인 시도입니다. 15분 후 다시 시도해주세요." },
        { status: 429 },
      );
    }
  }

  // Allow public routes (exact match or prefix match for /api/auth)
  if (PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(route + "/"))) {
    return NextResponse.next();
  }

  // Allow static assets and Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Check authentication via JWT token
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Check role-based access
  const allowed = isRoleAllowed(pathname, token.role);

  if (allowed === false) {
    // User is authenticated but lacks the required role → 403 page
    const forbiddenUrl = new URL("/forbidden", request.url);
    return NextResponse.redirect(forbiddenUrl);
  }

  // Add user info headers for server components (optional convenience)
  const response = NextResponse.next();
  response.headers.set("x-user-id", token.id);
  if (token.role) response.headers.set("x-user-role", token.role);
  if (token.tenantId) response.headers.set("x-tenant-id", token.tenantId);

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (static files)
     * - _next/image (image optimisation)
     * - favicon.ico
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
