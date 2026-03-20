import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// ─── PATCH: 지원금 프로그램 수정 ─────────────────────────
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const token = await getToken({ req: request });
    if (!token || !token.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = token.tenantId as string;
    const { id } = await context.params;

    const existing = await prisma.subsidyProgram.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "프로그램을 찾을 수 없습니다" },
        { status: 404 },
      );
    }

    const body = await request.json();
    const updateData: Record<string, unknown> = {};

    if (body.name !== undefined) updateData.name = body.name;
    if (body.provider !== undefined) updateData.provider = body.provider;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.description !== undefined) updateData.description = body.description ?? null;
    if (body.eligibilityCriteria !== undefined) updateData.eligibilityCriteria = body.eligibilityCriteria;
    if (body.monthlyAmount !== undefined) updateData.monthlyAmount = Number(body.monthlyAmount);
    if (body.maxDurationMonths !== undefined) updateData.maxDurationMonths = Number(body.maxDurationMonths);
    if (body.totalMaxAmount !== undefined) updateData.totalMaxAmount = body.totalMaxAmount ? Number(body.totalMaxAmount) : null;
    if (body.applicationStart !== undefined) updateData.applicationStart = body.applicationStart ? new Date(body.applicationStart) : null;
    if (body.applicationEnd !== undefined) updateData.applicationEnd = body.applicationEnd ? new Date(body.applicationEnd) : null;

    const updated = await prisma.subsidyProgram.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      data: {
        id: updated.id,
        name: updated.name,
        provider: updated.provider,
        category: updated.category,
        monthlyAmount: updated.monthlyAmount,
        maxDurationMonths: updated.maxDurationMonths,
        isActive: updated.isActive,
        updatedAt: updated.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("[subsidies/programs/[id] PATCH] Error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 },
    );
  }
}

// ─── DELETE: 지원금 프로그램 비활성화 ────────────────────
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const token = await getToken({ req: request });
    if (!token || !token.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = token.tenantId as string;
    const { id } = await context.params;

    const existing = await prisma.subsidyProgram.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "프로그램을 찾을 수 없습니다" },
        { status: 404 },
      );
    }

    await prisma.subsidyProgram.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ data: { id, isActive: false } });
  } catch (error) {
    console.error("[subsidies/programs/[id] DELETE] Error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 },
    );
  }
}
