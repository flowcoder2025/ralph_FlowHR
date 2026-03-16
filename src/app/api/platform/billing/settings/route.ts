import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

// PATCH: 결제 설정 수정 (플랜 변경, 결제수단 변경)
export async function PATCH(request: NextRequest) {
  try {
    const token = await getToken({ req: request });
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { billingAccountId, planId, paymentMethod } = body as {
      billingAccountId: string;
      planId?: string;
      paymentMethod?: string;
    };

    if (!billingAccountId) {
      return NextResponse.json({ error: "billingAccountId는 필수입니다" }, { status: 400 });
    }

    const account = await prisma.billingAccount.findUnique({
      where: { id: billingAccountId },
      include: { plan: true },
    });

    if (!account) {
      return NextResponse.json({ error: "결제 계정을 찾을 수 없습니다" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};

    // 플랜 변경
    if (planId && planId !== account.planId) {
      const newPlan = await prisma.plan.findUnique({ where: { id: planId } });
      if (!newPlan) {
        return NextResponse.json({ error: "플랜을 찾을 수 없습니다" }, { status: 404 });
      }
      updateData.planId = planId;
      // 좌석 수 = 해당 테넌트의 활성 직원 수
      const seatCount = await prisma.employee.count({
        where: { tenantId: account.tenantId, status: "ACTIVE" },
      });
      updateData.monthlyAmount = newPlan.pricePerSeat * Math.max(seatCount, 1);
    }

    // 결제수단 변경
    if (paymentMethod !== undefined) {
      updateData.paymentMethod = paymentMethod;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ data: account });
    }

    const updated = await prisma.billingAccount.update({
      where: { id: billingAccountId },
      data: updateData,
      include: { plan: true },
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error("[platform/billing/settings PATCH] Error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다" }, { status: 500 });
  }
}
