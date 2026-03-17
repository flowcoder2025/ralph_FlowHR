import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

// ─── GET: 로그인한 직원의 알림 목록 ─────────────────────
export async function GET(request: NextRequest) {
  try {
  const token = await getToken({ req: request });
  if (!token || !token.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tenantId = token.tenantId as string;

  const employee = await prisma.employee.findFirst({
    where: { userId: token.id, tenantId },
  });
  if (!employee) {
    return NextResponse.json({ error: "Employee not found" }, { status: 404 });
  }

  const { searchParams } = request.nextUrl;
  const readFilter = searchParams.get("read");
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const pageSize = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get("pageSize") ?? "20", 10)),
  );

  const where: {
    tenantId: string;
    employeeId: string;
    read?: boolean;
  } = {
    tenantId,
    employeeId: employee.id,
  };

  if (readFilter === "true") {
    where.read = true;
  } else if (readFilter === "false") {
    where.read = false;
  }

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({
      where: { tenantId, employeeId: employee.id, read: false },
    }),
  ]);

  return NextResponse.json({
    data: notifications.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.message,
      read: n.read,
      createdAt: n.createdAt.toISOString(),
    })),
    unreadCount,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  });
  } catch (error) {
    console.error("[employee/notifications GET] Error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// ─── PATCH: 알림 읽음 처리 ─────────────────────────────
export async function PATCH(request: NextRequest) {
  try {
  const token = await getToken({ req: request });
  if (!token || !token.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tenantId = token.tenantId as string;

  const employee = await prisma.employee.findFirst({
    where: { userId: token.id, tenantId },
  });
  if (!employee) {
    return NextResponse.json({ error: "Employee not found" }, { status: 404 });
  }

  const body = await request.json();
  const { id, ids } = body as { id?: string; ids?: string[] };

  // 단건 또는 복수 처리
  const targetIds = ids ?? (id ? [id] : []);

  if (targetIds.length === 0) {
    return NextResponse.json(
      { error: "id 또는 ids가 필요합니다" },
      { status: 400 },
    );
  }

  const result = await prisma.notification.updateMany({
    where: {
      id: { in: targetIds },
      tenantId,
      employeeId: employee.id,
    },
    data: { read: true },
  });

  return NextResponse.json({
    updated: result.count,
  });
  } catch (error) {
    console.error("[employee/notifications PATCH] Error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
