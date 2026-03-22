import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
  const token = await getToken({ req: request });
  if (!token || !token.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const employee = await prisma.employee.findFirst({
    where: {
      id: params.id,
      tenantId: token.tenantId,
    },
    include: {
      department: {
        select: { id: true, name: true, manager: { select: { id: true, name: true } } },
      },
      position: { select: { id: true, name: true, level: true } },
      changes: {
        orderBy: { effectiveDate: "desc" },
        take: 5,
        include: {
          fromDepartment: { select: { name: true } },
          toDepartment: { select: { name: true } },
          fromPosition: { select: { name: true } },
          toPosition: { select: { name: true } },
        },
      },
    },
  });

  if (!employee) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ data: employee });
  } catch (error) {
    console.error("[employees/[id] GET] Error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// ─── PATCH: 직원 정보 수정 ──────────────────────────────
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
  const token = await getToken({ req: request });
  if (!token || !token.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const employee = await prisma.employee.findFirst({
    where: { id: params.id, tenantId: token.tenantId },
  });

  if (!employee) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json();
  const allowedFields = [
    "name", "email", "phone", "departmentId", "positionId",
    "employeeNumber", "hireDate", "resignDate", "birthDate", "gender", "disabilityStatus", "status", "type",
  ];
  const data: Record<string, unknown> = {};

  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      if (field === "hireDate" || field === "resignDate" || field === "birthDate") {
        data[field] = body[field] ? new Date(body[field]) : null;
      } else {
        data[field] = body[field];
      }
    }
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json(
      { error: "수정할 필드가 없습니다" },
      { status: 400 },
    );
  }

  const updated = await prisma.employee.update({
    where: { id: params.id },
    data,
    include: {
      department: { select: { id: true, name: true } },
      position: { select: { id: true, name: true, level: true } },
    },
  });

  return NextResponse.json({ data: updated });
  } catch (error) {
    console.error("[employees/[id] PATCH] Error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// ─── DELETE: 직원 소프트 삭제 (퇴직 처리) ──────────────
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
  const token = await getToken({ req: request });
  if (!token || !token.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const employee = await prisma.employee.findFirst({
    where: { id: params.id, tenantId: token.tenantId },
  });

  if (!employee) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (employee.status === "RESIGNED") {
    return NextResponse.json(
      { error: "이미 퇴직 처리된 직원입니다" },
      { status: 400 },
    );
  }

  const updated = await prisma.employee.update({
    where: { id: params.id },
    data: {
      status: "RESIGNED",
      resignDate: new Date(),
    },
  });

  return NextResponse.json({ data: updated });
  } catch (error) {
    console.error("[employees/[id] DELETE] Error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
