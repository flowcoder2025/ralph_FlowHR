import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import type { Prisma, GoalStatus } from "@prisma/client";

const VALID_STATUSES: GoalStatus[] = [
  "NOT_STARTED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
];

// ─── GET: 목표 목록 조회 ────────────────────────────────
export async function GET(request: NextRequest) {
  try {
  const token = await getToken({ req: request });
  if (!token || !token.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tenantId = token.tenantId as string;
  const { searchParams } = request.nextUrl;

  const cycleId = searchParams.get("cycleId") ?? "";
  const employeeId = searchParams.get("employeeId") ?? "";
  const status = searchParams.get("status") ?? "";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const pageSize = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get("pageSize") ?? "20", 10)),
  );

  const where: Prisma.GoalWhereInput = { tenantId };

  if (cycleId) {
    where.cycleId = cycleId;
  }

  if (employeeId) {
    where.employeeId = employeeId;
  }

  if (status && VALID_STATUSES.includes(status as GoalStatus)) {
    where.status = status as GoalStatus;
  }

  const [goals, total] = await Promise.all([
    prisma.goal.findMany({
      where,
      include: {
        employee: { select: { id: true, name: true } },
        cycle: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.goal.count({ where }),
  ]);

  return NextResponse.json({
    data: goals,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  });
  } catch (error) {
    console.error("[performance/goals GET] Error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// ─── POST: 목표 생성 ───────────────────────────────────
export async function POST(request: NextRequest) {
  try {
  const token = await getToken({ req: request });
  if (!token || !token.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tenantId = token.tenantId as string;

  const body = await request.json();
  const { employeeId, cycleId, title, description, weight, dueDate } = body;

  if (!employeeId || !cycleId || !title) {
    return NextResponse.json(
      { error: "employeeId, cycleId, title은 필수입니다" },
      { status: 400 },
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

  // 평가 주기 존재 확인
  const cycle = await prisma.evalCycle.findFirst({
    where: { id: cycleId, tenantId },
  });

  if (!cycle) {
    return NextResponse.json(
      { error: "해당 평가 주기를 찾을 수 없습니다" },
      { status: 404 },
    );
  }

  const goal = await prisma.goal.create({
    data: {
      tenantId,
      employeeId,
      cycleId,
      title,
      description: description || null,
      weight: weight ? Number(weight) : 1.0,
      dueDate: dueDate ? new Date(dueDate) : null,
    },
    include: {
      employee: { select: { id: true, name: true } },
      cycle: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({ data: goal }, { status: 201 });
  } catch (error) {
    console.error("[performance/goals POST] Error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// ─── PATCH: 목표 진행률/상태 수정 ───────────────────────
export async function PATCH(request: NextRequest) {
  try {
  const token = await getToken({ req: request });
  if (!token || !token.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tenantId = token.tenantId as string;

  const body = await request.json();
  const { id, progress, status, title, description, weight, dueDate } = body;

  if (!id) {
    return NextResponse.json(
      { error: "id는 필수입니다" },
      { status: 400 },
    );
  }

  const goal = await prisma.goal.findFirst({
    where: { id, tenantId },
  });

  if (!goal) {
    return NextResponse.json(
      { error: "해당 목표를 찾을 수 없습니다" },
      { status: 404 },
    );
  }

  const data: Record<string, unknown> = {};

  if (progress !== undefined) {
    data.progress = Math.min(100, Math.max(0, Number(progress)));
  }

  if (status && VALID_STATUSES.includes(status)) {
    data.status = status;
  }

  if (title !== undefined) {
    data.title = title;
  }

  if (description !== undefined) {
    data.description = description;
  }

  if (weight !== undefined) {
    data.weight = Number(weight);
  }

  if (dueDate !== undefined) {
    data.dueDate = dueDate ? new Date(dueDate) : null;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json(
      { error: "수정할 필드가 없습니다" },
      { status: 400 },
    );
  }

  const updated = await prisma.goal.update({
    where: { id },
    data,
    include: {
      employee: { select: { id: true, name: true } },
      cycle: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({ data: updated });
  } catch (error) {
    console.error("[performance/goals PATCH] Error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
