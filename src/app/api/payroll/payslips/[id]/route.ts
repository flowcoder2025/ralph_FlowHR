import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

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
  const { action } = body as { action: string };

  const payslip = await prisma.payslip.findFirst({
    where: { id, tenantId },
  });

  if (!payslip) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (action === "resend") {
    const updated = await prisma.payslip.update({
      where: { id },
      data: { status: "SENT", sentAt: new Date() },
    });
    return NextResponse.json({ data: updated });
  }

  if (action === "reissue") {
    const updated = await prisma.payslip.update({
      where: { id },
      data: { status: "SENT", sentAt: new Date() },
    });
    return NextResponse.json({ data: updated });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("[payroll/payslips/[id] PATCH] Error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
