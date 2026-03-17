import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

// ─── PATCH: 문서 서명 처리 ──────────────────────────────
export async function PATCH(request: NextRequest) {
  try {
  const token = await getToken({ req: request });
  if (!token || !token.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tenantId = token.tenantId as string;

  const employee = await prisma.employee.findFirst({
    where: { userId: token.id as string, tenantId },
  });
  if (!employee) {
    return NextResponse.json({ error: "Employee not found" }, { status: 404 });
  }

  const body = await request.json();
  const { documentId, signatureData } = body as {
    documentId: string;
    signatureData?: string;
  };

  if (!documentId) {
    return NextResponse.json(
      { error: "documentId가 필요합니다" },
      { status: 400 },
    );
  }

  // 문서 조회 (수신자 본인 확인)
  const document = await prisma.document.findFirst({
    where: { id: documentId, tenantId, recipientId: employee.id },
  });

  if (!document) {
    return NextResponse.json(
      { error: "문서를 찾을 수 없습니다" },
      { status: 404 },
    );
  }

  if (document.status === "SIGNED") {
    return NextResponse.json(
      { error: "이미 서명된 문서입니다" },
      { status: 409 },
    );
  }

  if (document.status === "EXPIRED" || document.status === "CANCELLED") {
    return NextResponse.json(
      { error: "만료 또는 취소된 문서는 서명할 수 없습니다" },
      { status: 400 },
    );
  }

  const now = new Date();

  // 트랜잭션: 문서 상태 업데이트 + 서명 기록 저장
  const [updated] = await prisma.$transaction(async (tx) => {
    const updatedDoc = await tx.document.update({
      where: { id: documentId },
      data: {
        status: "SIGNED",
        viewedAt: document.viewedAt ?? now,
        completedAt: now,
      },
    });

    // 서명 데이터 저장 (signatureData가 있으면)
    if (signatureData) {
      await tx.signature.upsert({
        where: {
          documentId_signerId: {
            documentId,
            signerId: employee.id,
          },
        },
        update: {
          signatureData,
          signedAt: now,
        },
        create: {
          tenantId,
          documentId,
          signerId: employee.id,
          signatureData,
          signedAt: now,
        },
      });
    }

    return [updatedDoc];
  });

  return NextResponse.json({
    id: updated.id,
    status: updated.status,
    viewedAt: updated.viewedAt?.toISOString() ?? null,
    completedAt: updated.completedAt?.toISOString() ?? null,
    message: "서명이 완료되었습니다",
  });
  } catch (error) {
    console.error("[documents/sign PATCH] Error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
