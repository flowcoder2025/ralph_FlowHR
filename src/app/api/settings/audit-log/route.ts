import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import type { Prisma, PlatformAuditAction, PlatformAuditResult } from "@prisma/client";

const VALID_ACTIONS: PlatformAuditAction[] = [
  "LOGIN",
  "LOGOUT",
  "TENANT_CREATE",
  "TENANT_UPDATE",
  "TENANT_SUSPEND",
  "PLAN_CHANGE",
  "SETTING_CHANGE",
  "SECURITY_EVENT",
  "SUPPORT_ACTION",
];

const VALID_RESULTS: PlatformAuditResult[] = ["SUCCESS", "FAILURE"];

// ─── GET: 감사 로그 목록 조회 ────────────────────────────
export async function GET(request: NextRequest) {
  try {
  const token = await getToken({ req: request });
  if (!token || !token.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tenantId = token.tenantId as string;
  const { searchParams } = request.nextUrl;

  const search = searchParams.get("search") ?? "";
  const action = searchParams.get("action") ?? "";
  const result = searchParams.get("result") ?? "";
  const startDate = searchParams.get("startDate") ?? "";
  const endDate = searchParams.get("endDate") ?? "";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const pageSize = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get("pageSize") ?? "20", 10)),
  );

  const where: Prisma.PlatformAuditLogWhereInput = { tenantId };

  if (search) {
    where.OR = [
      { operatorName: { contains: search, mode: "insensitive" } },
      { target: { contains: search, mode: "insensitive" } },
    ];
  }

  if (action && VALID_ACTIONS.includes(action as PlatformAuditAction)) {
    where.action = action as PlatformAuditAction;
  }

  if (result && VALID_RESULTS.includes(result as PlatformAuditResult)) {
    where.result = result as PlatformAuditResult;
  }

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) {
      where.createdAt.gte = new Date(startDate);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      where.createdAt.lte = end;
    }
  }

  const [logs, total] = await Promise.all([
    prisma.platformAuditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.platformAuditLog.count({ where }),
  ]);

  const data = logs.map((log) => ({
    id: log.id,
    operatorName: log.operatorName,
    operatorRole: log.operatorRole,
    action: log.action,
    target: log.target,
    ipAddress: log.ipAddress,
    result: log.result,
    details: log.details,
    createdAt: log.createdAt.toISOString(),
  }));

  return NextResponse.json({
    data,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  });
  } catch (error) {
    console.error("[settings/audit-log GET] Error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
