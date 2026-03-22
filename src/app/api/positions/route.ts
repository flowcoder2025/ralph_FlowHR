import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

// ─── GET: 직급 목록 ──────────────────────────────────
export async function GET(request: NextRequest) {
  try {
  const token = await getToken({ req: request });
  if (!token || !token.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tenantId = token.tenantId as string;

  const positions = await prisma.position.findMany({
    where: { tenantId },
    orderBy: [{ sortOrder: "asc" }, { level: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      level: true,
      description: true,
      sortOrder: true,
      _count: { select: { employees: true } },
    },
  });

  const data = positions.map((p) => ({
    id: p.id,
    name: p.name,
    level: p.level,
    description: p.description,
    sortOrder: p.sortOrder,
    employeeCount: p._count.employees,
  }));

  return NextResponse.json({ data });
  } catch (error) {
    console.error("[positions GET] Error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// ─── POST: 직급 생성 ──────────────────────────────────
export async function POST(request: NextRequest) {
  try {
  const token = await getToken({ req: request });
  if (!token || !token.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tenantId = token.tenantId as string;
  const body = await request.json();
  const { name, level, description, sortOrder } = body;

  if (!name) {
    return NextResponse.json({ error: "name은 필수입니다" }, { status: 400 });
  }

  const existing = await prisma.position.findUnique({
    where: { tenantId_name: { tenantId, name } },
  });
  if (existing) {
    return NextResponse.json({ error: "이미 존재하는 직급명입니다" }, { status: 409 });
  }

  const position = await prisma.position.create({
    data: {
      tenantId,
      name,
      level: level ?? 1,
      description: description || null,
      sortOrder: sortOrder ?? 0,
    },
  });

  return NextResponse.json({ data: position }, { status: 201 });
  } catch (error) {
    console.error("[positions POST] Error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// ─── PATCH: 직급 수정 ──────────────────────────────────
export async function PATCH(request: NextRequest) {
  try {
  const token = await getToken({ req: request });
  if (!token || !token.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tenantId = token.tenantId as string;
  const body = await request.json();
  const { id, name, level, description, sortOrder } = body;

  if (!id) {
    return NextResponse.json({ error: "id는 필수입니다" }, { status: 400 });
  }

  const existing = await prisma.position.findFirst({
    where: { id, tenantId },
  });
  if (!existing) {
    return NextResponse.json({ error: "직급을 찾을 수 없습니다" }, { status: 404 });
  }

  const updateData: Record<string, unknown> = {};
  if (name !== undefined) updateData.name = name;
  if (level !== undefined) updateData.level = Number(level);
  if (description !== undefined) updateData.description = description || null;
  if (sortOrder !== undefined) updateData.sortOrder = Number(sortOrder);

  const updated = await prisma.position.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json({ data: updated });
  } catch (error) {
    console.error("[positions PATCH] Error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// ─── DELETE: 직급 삭제 ──────────────────────────────────
export async function DELETE(request: NextRequest) {
  try {
  const token = await getToken({ req: request });
  if (!token || !token.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tenantId = token.tenantId as string;
  const { searchParams } = request.nextUrl;
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id는 필수입니다" }, { status: 400 });
  }

  const existing = await prisma.position.findFirst({
    where: { id, tenantId },
  });
  if (!existing) {
    return NextResponse.json({ error: "직급을 찾을 수 없습니다" }, { status: 404 });
  }

  const employeeCount = await prisma.employee.count({
    where: { positionId: id, tenantId },
  });
  if (employeeCount > 0) {
    return NextResponse.json(
      { error: `해당 직급에 ${employeeCount}명의 직원이 있어 삭제할 수 없습니다` },
      { status: 409 },
    );
  }

  await prisma.position.delete({ where: { id } });

  return NextResponse.json({ data: { id } });
  } catch (error) {
    console.error("[positions DELETE] Error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
