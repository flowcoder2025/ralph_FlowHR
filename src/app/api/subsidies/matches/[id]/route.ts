import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// ─── PATCH: 매칭 상태 업데이트 ──────────────────────────
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const token = await getToken({ req: request });
    if (!token || !token.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = token.tenantId as string;
    const { id } = await context.params;

    const existing = await prisma.subsidyMatch.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "매칭 레코드를 찾을 수 없습니다" },
        { status: 404 },
      );
    }

    const body = await request.json();
    const { status, note } = body;

    const validStatuses = ["APPLIED", "APPROVED", "REJECTED", "RECEIVING"];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `유효하지 않은 상태입니다. 허용: ${validStatuses.join(", ")}` },
        { status: 400 },
      );
    }

    const updateData: Record<string, unknown> = {};

    if (status) {
      updateData.status = status;

      if (status === "APPLIED") {
        updateData.appliedAt = new Date();
      } else if (status === "APPROVED") {
        updateData.approvedAt = new Date();
      } else if (status === "REJECTED") {
        updateData.rejectedAt = new Date();
      } else if (status === "RECEIVING") {
        updateData.receivingStartDate = new Date();
      }
    }

    if (note !== undefined) {
      updateData.note = note ?? null;
    }

    const updated = await prisma.subsidyMatch.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      data: {
        id: updated.id,
        status: updated.status,
        note: updated.note,
        appliedAt: updated.appliedAt?.toISOString() ?? null,
        approvedAt: updated.approvedAt?.toISOString() ?? null,
        updatedAt: updated.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("[subsidies/matches/[id] PATCH] Error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 },
    );
  }
}
