import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import type { DocumentStatus } from "@prisma/client";

const ALLOWED_STATUS_TRANSITIONS: Record<string, DocumentStatus[]> = {
  SENT: ["VIEWED", "SIGNED", "CANCELLED"],
  VIEWED: ["SIGNED", "CANCELLED"],
};

// ─── PATCH: 문서 상태 업데이트 (서명/거부 등) ─────────────
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const token = await getToken({ req: request });
    if (!token || !token.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const employee = await prisma.employee.findFirst({
      where: {
        userId: token.id,
        tenantId: token.tenantId,
      },
    });

    if (!employee) {
      return NextResponse.json(
        { error: "직원 정보를 찾을 수 없습니다" },
        { status: 404 },
      );
    }

    const { id } = await params;

    const document = await prisma.document.findFirst({
      where: {
        id,
        recipientId: employee.id,
        tenantId: token.tenantId as string,
      },
    });

    if (!document) {
      return NextResponse.json(
        { error: "문서를 찾을 수 없습니다" },
        { status: 404 },
      );
    }

    const body = await request.json();
    const newStatus = body.status as string;

    if (!newStatus) {
      return NextResponse.json(
        { error: "상태값이 필요합니다" },
        { status: 400 },
      );
    }

    // REJECTED는 CANCELLED로 매핑
    const mappedStatus: DocumentStatus =
      newStatus === "REJECTED" ? "CANCELLED" : (newStatus as DocumentStatus);

    const allowedTransitions = ALLOWED_STATUS_TRANSITIONS[document.status] ?? [];
    if (!allowedTransitions.includes(mappedStatus)) {
      return NextResponse.json(
        { error: "허용되지 않는 상태 변경입니다" },
        { status: 400 },
      );
    }

    const updateData: Record<string, unknown> = {
      status: mappedStatus,
    };

    if (mappedStatus === "SIGNED") {
      updateData.completedAt = new Date();
    }

    if (mappedStatus === "VIEWED") {
      updateData.viewedAt = new Date();
    }

    const updated = await prisma.document.update({
      where: { id },
      data: updateData,
    });

    // 서명 시 Signature 레코드 생성
    if (mappedStatus === "SIGNED") {
      await prisma.signature.create({
        data: {
          tenantId: token.tenantId as string,
          documentId: id,
          signerId: employee.id,
          signatureData: body.signatureData ?? "electronic-signature",
          ipAddress:
            request.headers.get("x-forwarded-for") ??
            request.headers.get("x-real-ip") ??
            null,
        },
      });
    }

    return NextResponse.json({
      data: {
        id: updated.id,
        status: updated.status,
        completedAt: updated.completedAt?.toISOString() ?? null,
      },
    });
  } catch (error) {
    console.error("[employee/documents/[id] PATCH] Error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 },
    );
  }
}
