import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

// ─── POST: 부서 생성 ──────────────────────────────────
export async function POST(request: NextRequest) {
  try {
  const token = await getToken({ req: request });
  if (!token || !token.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tenantId = token.tenantId as string;
  const body = await request.json();
  const { name, code, description, parentId, managerId } = body;

  if (!name || !code) {
    return NextResponse.json({ error: "name, code는 필수입니다" }, { status: 400 });
  }

  const existing = await prisma.department.findFirst({
    where: { tenantId, code },
  });
  if (existing) {
    return NextResponse.json({ error: "이미 존재하는 부서 코드입니다" }, { status: 409 });
  }

  const dept = await prisma.department.create({
    data: {
      tenantId,
      name,
      code,
      description: description || null,
      parentId: parentId || null,
      managerId: managerId || null,
    },
  });

  return NextResponse.json({ data: dept }, { status: 201 });
  } catch (error) {
    console.error("[departments POST] Error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// ─── PATCH: 부서 수정 ──────────────────────────────────
export async function PATCH(request: NextRequest) {
  try {
  const token = await getToken({ req: request });
  if (!token || !token.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tenantId = token.tenantId as string;
  const body = await request.json();
  const { id, name, code, description, parentId, managerId } = body;

  if (!id) {
    return NextResponse.json({ error: "id는 필수입니다" }, { status: 400 });
  }

  const dept = await prisma.department.findFirst({
    where: { id, tenantId },
  });
  if (!dept) {
    return NextResponse.json({ error: "부서를 찾을 수 없습니다" }, { status: 404 });
  }

  // 자기 자신을 상위 부서로 설정 방지
  if (parentId === id) {
    return NextResponse.json({ error: "자기 자신을 상위 부서로 설정할 수 없습니다" }, { status: 400 });
  }

  const updated = await prisma.department.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(code !== undefined && { code }),
      ...(description !== undefined && { description }),
      ...(parentId !== undefined && { parentId: parentId || null }),
      ...(managerId !== undefined && { managerId: managerId || null }),
    },
  });

  return NextResponse.json({ data: updated });
  } catch (error) {
    console.error("[departments PATCH] Error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// ─── DELETE: 부서 삭제 ──────────────────────────────────
export async function DELETE(request: NextRequest) {
  try {
  const token = await getToken({ req: request });
  if (!token || !token.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tenantId = token.tenantId as string;
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id는 필수입니다" }, { status: 400 });
  }

  const dept = await prisma.department.findFirst({
    where: { id, tenantId },
    include: { _count: { select: { employees: true, children: true } } },
  });

  if (!dept) {
    return NextResponse.json({ error: "부서를 찾을 수 없습니다" }, { status: 404 });
  }

  if (dept._count.employees > 0) {
    return NextResponse.json({ error: `소속 직원이 ${dept._count.employees}명 있어 삭제할 수 없습니다. 먼저 직원을 이동해주세요.` }, { status: 409 });
  }

  if (dept._count.children > 0) {
    return NextResponse.json({ error: `하위 부서가 ${dept._count.children}개 있어 삭제할 수 없습니다. 먼저 하위 부서를 이동/삭제해주세요.` }, { status: 409 });
  }

  await prisma.department.delete({ where: { id } });

  return NextResponse.json({ data: { id } });
  } catch (error) {
    console.error("[departments DELETE] Error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
