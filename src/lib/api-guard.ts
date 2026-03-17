import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

interface TokenResult {
  id: string;
  role: string;
  tenantId: string;
  tenantSlug?: string;
}

/**
 * API route 인증 + role 검증 공통 유틸
 * 실패 시 NextResponse 반환, 성공 시 token 반환
 */
export async function requireAuth(
  request: NextRequest,
  options?: { roles?: string[]; requireTenant?: boolean },
): Promise<{ token: TokenResult } | { error: NextResponse }> {
  const token = await getToken({ req: request });

  if (!token) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  // role 검증
  if (options?.roles && options.roles.length > 0) {
    const userRole = token.role as string | undefined;
    if (!userRole || !options.roles.includes(userRole)) {
      return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
    }
  }

  // tenant 검증
  if (options?.requireTenant !== false && !token.tenantId) {
    // Platform API는 requireTenant: false로 호출
  }

  return {
    token: {
      id: token.id as string,
      role: (token.role as string) ?? "",
      tenantId: (token.tenantId as string) ?? "",
      tenantSlug: (token.tenantSlug as string) ?? "",
    },
  };
}

/**
 * 간단한 인메모리 rate limiter (Vercel 서버리스 환경용)
 * 프로덕션에서는 Upstash Redis 등 외부 저장소 권장
 */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number,
): { allowed: boolean; remaining: number; retryAfterMs?: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  if (entry.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: entry.resetAt - now,
    };
  }

  entry.count++;
  return { allowed: true, remaining: maxRequests - entry.count };
}

// 오래된 항목 정리 (메모리 누수 방지)
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    const keys = Array.from(rateLimitMap.keys());
    for (const key of keys) {
      const entry = rateLimitMap.get(key);
      if (entry && now > entry.resetAt) rateLimitMap.delete(key);
    }
  }, 60_000);
}
