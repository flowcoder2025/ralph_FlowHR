import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// ─── POST: 계약서 서명 ──────────────────────────────────
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const token = await getToken({ req: request });
    if (!token || !token.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = token.tenantId as string;
    const { id } = await context.params;

    const contract = await prisma.employmentContract.findFirst({
      where: { id, tenantId },
      include: {
        employee: {
          select: { id: true, name: true },
        },
      },
    });

    if (!contract) {
      return NextResponse.json(
        { error: "계약서를 찾을 수 없습니다" },
        { status: 404 },
      );
    }

    if (contract.status !== "PENDING_SIGN") {
      return NextResponse.json(
        { error: "서명 대기 상태의 계약서만 서명할 수 있습니다" },
        { status: 400 },
      );
    }

    const body = await request.json();
    const { signer } = body;

    if (!signer || !["employee", "employer"].includes(signer)) {
      return NextResponse.json(
        { error: "signer는 'employee' 또는 'employer'여야 합니다" },
        { status: 400 },
      );
    }

    const updateData: Record<string, unknown> = {};

    if (signer === "employee") {
      if (contract.signedByEmployee) {
        return NextResponse.json(
          { error: "직원이 이미 서명하였습니다" },
          { status: 400 },
        );
      }
      updateData.signedByEmployee = true;
    } else {
      if (contract.signedByEmployer) {
        return NextResponse.json(
          { error: "사업주가 이미 서명하였습니다" },
          { status: 400 },
        );
      }
      updateData.signedByEmployer = true;
    }

    // 양쪽 모두 서명 완료 시 SIGNED 상태로 전환
    const willBothSigned =
      (signer === "employee" && contract.signedByEmployer) ||
      (signer === "employer" && contract.signedByEmployee);

    if (willBothSigned) {
      updateData.status = "SIGNED";
      updateData.signedAt = new Date();
    }

    const updated = await prisma.employmentContract.update({
      where: { id },
      data: updateData,
    });

    // 상대방에게 알림 생성
    const notifTitle = signer === "employee"
      ? `${contract.employee.name}님이 근로계약서에 서명했습니다`
      : `사업주가 근로계약서(${contract.contractNumber})에 서명했습니다`;

    const notifMessage = willBothSigned
      ? `근로계약서(${contract.contractNumber}) 서명이 완료되었습니다.`
      : `근로계약서(${contract.contractNumber}) 서명이 진행 중입니다. 상대방의 서명을 대기 중입니다.`;

    // 직원에게 알림 (사업주 서명 시)
    if (signer === "employer") {
      await prisma.notification.create({
        data: {
          tenantId,
          employeeId: contract.employeeId,
          type: "DOCUMENT",
          title: notifTitle,
          message: notifMessage,
        },
      });
    }

    return NextResponse.json({
      data: {
        id: updated.id,
        contractNumber: updated.contractNumber,
        status: updated.status,
        signedByEmployee: updated.signedByEmployee,
        signedByEmployer: updated.signedByEmployer,
        signedAt: updated.signedAt?.toISOString() ?? null,
      },
    });
  } catch (error) {
    console.error("[contracts/[id]/sign POST] Error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 },
    );
  }
}
