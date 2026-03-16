import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const token = await getToken({ req: request });
  if (!token || !token.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tenantId = token.tenantId as string;
  const now = new Date();

  // ── 이번 주 범위 계산 ─────────────────────────────────
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  // ── 이번 주 예정된 1:1 미팅 목록 ──────────────────────
  const meetings = await prisma.oneOnOne.findMany({
    where: {
      tenantId,
      status: "SCHEDULED",
      scheduledAt: { gte: weekStart, lt: weekEnd },
    },
    include: {
      manager: {
        select: { id: true, name: true },
      },
      employee: {
        select: { id: true, name: true },
      },
    },
    orderBy: { scheduledAt: "asc" },
  });

  // ── 이번 달 통계 ──────────────────────────────────────
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const completedThisMonth = await prisma.oneOnOne.count({
    where: {
      tenantId,
      status: "COMPLETED",
      scheduledAt: { gte: monthStart, lt: monthEnd },
    },
  });

  const cancelledThisMonth = await prisma.oneOnOne.count({
    where: {
      tenantId,
      status: "CANCELLED",
      scheduledAt: { gte: monthStart, lt: monthEnd },
    },
  });

  const items = meetings.map((m) => ({
    id: m.id,
    managerName: m.manager.name,
    employeeName: m.employee.name,
    scheduledAt: m.scheduledAt.toISOString(),
    duration: m.duration,
    agenda: m.agenda,
    notes: m.notes,
    status: m.status,
  }));

  return NextResponse.json({
    data: items,
    stats: {
      completedThisMonth,
      cancelledThisMonth,
    },
  });
}

// ─── POST: 1:1 미팅 생성 ───────────────────────────────
export async function POST(request: NextRequest) {
  const token = await getToken({ req: request });
  if (!token || !token.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tenantId = token.tenantId as string;

  const body = await request.json();
  const { managerId, employeeId, scheduledAt, duration, agenda } = body;

  if (!managerId || !employeeId || !scheduledAt) {
    return NextResponse.json(
      { error: "managerId, employeeId, scheduledAt은 필수입니다" },
      { status: 400 },
    );
  }

  // 매니저 존재 확인
  const manager = await prisma.employee.findFirst({
    where: { id: managerId, tenantId },
  });

  if (!manager) {
    return NextResponse.json(
      { error: "해당 매니저를 찾을 수 없습니다" },
      { status: 404 },
    );
  }

  // 직원 존재 확인
  const employee = await prisma.employee.findFirst({
    where: { id: employeeId, tenantId },
  });

  if (!employee) {
    return NextResponse.json(
      { error: "해당 직원을 찾을 수 없습니다" },
      { status: 404 },
    );
  }

  const meeting = await prisma.oneOnOne.create({
    data: {
      tenantId,
      managerId,
      employeeId,
      scheduledAt: new Date(scheduledAt),
      duration: duration ? Number(duration) : 30,
      agenda: agenda || null,
    },
    include: {
      manager: { select: { id: true, name: true } },
      employee: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({ data: meeting }, { status: 201 });
}
