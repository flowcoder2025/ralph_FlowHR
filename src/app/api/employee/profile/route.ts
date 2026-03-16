import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
  const token = await getToken({ req: request });
  if (!token || !token.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const employee = await prisma.employee.findFirst({
    where: {
      userId: token.id,
      tenantId: token.tenantId,
    },
    include: {
      department: { select: { name: true } },
      position: { select: { name: true } },
    },
  });

  if (!employee) {
    return NextResponse.json({ error: "Employee not found" }, { status: 404 });
  }

  const currentYear = new Date().getFullYear();

  const [leaveBalances, goals, evaluations, oneOnOnes] = await Promise.all([
    prisma.leaveBalance.findMany({
      where: {
        employeeId: employee.id,
        tenantId: token.tenantId,
        year: currentYear,
      },
      include: { policy: { select: { name: true, type: true } } },
      orderBy: { policy: { type: "asc" } },
    }),
    prisma.goal.findMany({
      where: {
        employeeId: employee.id,
        tenantId: token.tenantId,
      },
      orderBy: { dueDate: "asc" },
    }),
    prisma.evaluation.findMany({
      where: {
        employeeId: employee.id,
        tenantId: token.tenantId,
      },
      include: { cycle: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 1,
    }),
    prisma.oneOnOne.findMany({
      where: {
        employeeId: employee.id,
        tenantId: token.tenantId,
      },
      include: { manager: { select: { name: true } } },
      orderBy: { scheduledAt: "desc" },
      take: 5,
    }),
  ]);

  return NextResponse.json({
    data: {
      profile: {
        name: employee.name,
        employeeNumber: employee.employeeNumber,
        email: employee.email,
        phone: employee.phone ?? "",
        department: employee.department?.name ?? "",
        position: employee.position?.name ?? "",
        hireDate: employee.hireDate.toISOString(),
        status: employee.status,
        type: employee.type,
        avatar: employee.name.slice(0, 1),
      },
      leaveBalances: leaveBalances.map((b) => ({
        type: b.policy.type,
        label: b.policy.name,
        total: b.totalDays,
        used: b.usedDays,
        pending: b.pendingDays,
      })),
      goals: goals.map((g) => ({
        id: g.id,
        title: g.title,
        progress: g.progress,
        status: g.status,
        dueDate: g.dueDate?.toISOString() ?? "",
      })),
      evaluation:
        evaluations.length > 0
          ? {
              cycleName: evaluations[0].cycle.name,
              selfScore: evaluations[0].selfScore,
              managerScore: evaluations[0].managerScore,
              finalScore: evaluations[0].finalScore,
              status: evaluations[0].status,
            }
          : null,
      oneOnOnes: oneOnOnes.map((o) => ({
        id: o.id,
        managerName: o.manager.name,
        scheduledAt: o.scheduledAt.toISOString(),
        duration: o.duration,
        status: o.status,
        agenda: o.agenda,
      })),
    },
  });
  } catch (error) {
    console.error("[employee/profile GET] Error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// ─── PATCH: 프로필 수정 ─────────────────────────────────
export async function PATCH(request: NextRequest) {
  try {
  const token = await getToken({ req: request });
  if (!token || !token.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const employee = await prisma.employee.findFirst({
    where: {
      userId: token.id,
      tenantId: token.tenantId,
    },
  });

  if (!employee) {
    return NextResponse.json({ error: "Employee not found" }, { status: 404 });
  }

  const body = await request.json();
  const allowedFields = ["phone", "email"];
  const data: Record<string, unknown> = {};

  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      data[field] = body[field];
    }
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json(
      { error: "수정할 필드가 없습니다" },
      { status: 400 },
    );
  }

  const updated = await prisma.employee.update({
    where: { id: employee.id },
    data,
    include: {
      department: { select: { name: true } },
      position: { select: { name: true } },
    },
  });

  return NextResponse.json({
    data: {
      name: updated.name,
      employeeNumber: updated.employeeNumber,
      email: updated.email,
      phone: updated.phone ?? "",
      department: updated.department?.name ?? "",
      position: updated.position?.name ?? "",
    },
  });
  } catch (error) {
    console.error("[employee/profile PATCH] Error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
