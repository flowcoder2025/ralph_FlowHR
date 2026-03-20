import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

// ─── GET: 급여명세서 상세 조회 ────────────────────────────
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const token = await getToken({ req: request });
    if (!token || !token.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = token.tenantId as string;

    const employee = await prisma.employee.findFirst({
      where: { userId: token.id, tenantId },
      select: { id: true },
    });

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    const { id } = await params;

    const payslip = await prisma.payslip.findFirst({
      where: {
        id,
        employeeId: employee.id,
        tenantId,
      },
      include: {
        payrollRun: {
          select: { year: true, month: true },
        },
      },
    });

    if (!payslip) {
      return NextResponse.json(
        { error: "급여명세서를 찾을 수 없습니다" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      data: {
        id: payslip.id,
        year: payslip.payrollRun.year,
        month: payslip.payrollRun.month,
        baseSalary: payslip.baseSalary,
        allowances: payslip.allowances,
        deductions: payslip.deductions,
        netAmount: payslip.netAmount,
        breakdown: payslip.breakdown,
        status: payslip.status,
        sentAt: payslip.sentAt?.toISOString() ?? null,
        viewedAt: payslip.viewedAt?.toISOString() ?? null,
        createdAt: payslip.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("[employee/payslips/[id] GET] Error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 },
    );
  }
}

// ─── POST: 재발행 요청 ───────────────────────────────────
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const token = await getToken({ req: request });
    if (!token || !token.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = token.tenantId as string;

    const employee = await prisma.employee.findFirst({
      where: { userId: token.id, tenantId },
      select: { id: true },
    });

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    const { id } = await params;

    const payslip = await prisma.payslip.findFirst({
      where: {
        id,
        employeeId: employee.id,
        tenantId,
      },
    });

    if (!payslip) {
      return NextResponse.json(
        { error: "급여명세서를 찾을 수 없습니다" },
        { status: 404 },
      );
    }

    if (payslip.status === "REISSUE_REQUESTED") {
      return NextResponse.json(
        { error: "이미 재발행 요청이 진행 중입니다" },
        { status: 400 },
      );
    }

    const updated = await prisma.payslip.update({
      where: { id },
      data: { status: "REISSUE_REQUESTED" },
    });

    return NextResponse.json({
      data: {
        id: updated.id,
        status: updated.status,
      },
    });
  } catch (error) {
    console.error("[employee/payslips/[id] POST] Error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 },
    );
  }
}
