import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

// ─── PATCH: 퇴직금 상태 변경 ───────────────────────────
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const token = await getToken({ req: request });
    if (!token || !token.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = token.tenantId as string;
    const { id } = await params;
    const body = await request.json();
    const { status, note } = body as { status?: string; note?: string };

    if (!status || !["CONFIRMED", "PAID"].includes(status)) {
      return NextResponse.json(
        { error: "status는 CONFIRMED 또는 PAID만 가능합니다" },
        { status: 400 },
      );
    }

    const existing = await prisma.severanceCalculation.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "퇴직금 산출 내역을 찾을 수 없습니다" },
        { status: 404 },
      );
    }

    const updateData: Record<string, unknown> = { status };
    if (note !== undefined) updateData.note = note;

    if (status === "CONFIRMED") {
      updateData.confirmedBy = (token.employeeNumber as string) ?? null;
      updateData.confirmedAt = new Date();
    }

    if (status === "PAID") {
      updateData.paidAt = new Date();
    }

    const updated = await prisma.severanceCalculation.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      data: {
        id: updated.id,
        employeeId: updated.employeeId,
        startDate: updated.startDate.toISOString(),
        endDate: updated.endDate.toISOString(),
        totalServiceDays: updated.totalServiceDays,
        totalServiceYears: updated.totalServiceYears,
        avgDailySalary: updated.avgDailySalary,
        last3MonthsTotal: updated.last3MonthsTotal,
        last3MonthsDays: updated.last3MonthsDays,
        severanceAmount: updated.severanceAmount,
        status: updated.status,
        note: updated.note,
        confirmedBy: updated.confirmedBy,
        confirmedAt: updated.confirmedAt?.toISOString() ?? null,
        paidAt: updated.paidAt?.toISOString() ?? null,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("[payroll/severance/[id] PATCH] Error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 },
    );
  }
}
