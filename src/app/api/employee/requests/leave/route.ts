import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

// ─── POST: 휴가 신청 ───────────────────────────────────
export async function POST(request: NextRequest) {
  const token = await getToken({ req: request });
  if (!token || !token.tenantId || !token.employeeId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tenantId = token.tenantId as string;
  const employeeId = token.employeeId as string;

  const body = await request.json();
  const { type, startDate, endDate, reason } = body;

  if (!type || !startDate || !endDate) {
    return NextResponse.json(
      { error: "type, startDate, endDate는 필수입니다" },
      { status: 400 },
    );
  }

  // 해당 tenant의 휴가 정책 조회
  const policy = await prisma.leavePolicy.findUnique({
    where: { tenantId_type: { tenantId, type } },
  });

  if (!policy || !policy.isActive) {
    return NextResponse.json(
      { error: "유효하지 않은 휴가 유형입니다" },
      { status: 400 },
    );
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (end < start) {
    return NextResponse.json(
      { error: "종료일은 시작일 이후여야 합니다" },
      { status: 400 },
    );
  }

  // 일수 계산 (단순 계산: 시작일~종료일)
  const diffTime = end.getTime() - start.getTime();
  const days = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);
  const adjustedDays = type === "HALF_DAY" ? 0.5 : days;

  // 잔여 휴가 확인
  const balance = await prisma.leaveBalance.findFirst({
    where: {
      tenantId,
      employeeId,
      policyId: policy.id,
      year: start.getFullYear(),
    },
  });

  if (balance) {
    const remaining = balance.totalDays - balance.usedDays - balance.pendingDays;
    if (remaining < adjustedDays) {
      return NextResponse.json(
        { error: "잔여 휴가가 부족합니다" },
        { status: 400 },
      );
    }
  }

  // 트랜잭션: 휴가 신청 + 대기 일수 증가
  const leaveRequest = await prisma.$transaction(async (tx) => {
    const created = await tx.leaveRequest.create({
      data: {
        tenantId,
        employeeId,
        policyId: policy.id,
        startDate: start,
        endDate: end,
        days: adjustedDays,
        reason: reason || null,
        status: policy.requiresApproval ? "PENDING" : "APPROVED",
      },
    });

    if (balance) {
      if (policy.requiresApproval) {
        await tx.leaveBalance.update({
          where: { id: balance.id },
          data: { pendingDays: { increment: adjustedDays } },
        });
      } else {
        await tx.leaveBalance.update({
          where: { id: balance.id },
          data: { usedDays: { increment: adjustedDays } },
        });
      }
    }

    return created;
  });

  return NextResponse.json({ data: leaveRequest }, { status: 201 });
}
