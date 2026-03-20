import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

// ─── GET: 내 급여명세서 목록 조회 ─────────────────────────
export async function GET(request: NextRequest) {
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

    const { searchParams } = request.nextUrl;
    const yearParam = searchParams.get("year");
    const monthParam = searchParams.get("month");
    const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
    const pageSize = Math.min(50, Math.max(1, Number(searchParams.get("pageSize") ?? "10")));

    const now = new Date();
    const year = yearParam ? Number(yearParam) : now.getFullYear();

    // Find payroll runs for the given year (and optional month)
    const runWhere: Record<string, unknown> = { tenantId, year };
    if (monthParam) {
      runWhere.month = Number(monthParam);
    }

    const payrollRuns = await prisma.payrollRun.findMany({
      where: runWhere,
      select: { id: true, year: true, month: true },
      orderBy: [{ year: "desc" }, { month: "desc" }],
    });

    if (payrollRuns.length === 0) {
      return NextResponse.json({
        data: [],
        pagination: { page, pageSize, total: 0, totalPages: 0 },
        year,
        month: monthParam ? Number(monthParam) : null,
      });
    }

    const runIds = payrollRuns.map((r) => r.id);

    const where = {
      tenantId,
      employeeId: employee.id,
      payrollRunId: { in: runIds },
    };

    const [payslips, total] = await Promise.all([
      prisma.payslip.findMany({
        where,
        include: {
          payrollRun: {
            select: { year: true, month: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.payslip.count({ where }),
    ]);

    const data = payslips.map((p) => ({
      id: p.id,
      year: p.payrollRun.year,
      month: p.payrollRun.month,
      baseSalary: p.baseSalary,
      allowances: p.allowances,
      deductions: p.deductions,
      netAmount: p.netAmount,
      breakdown: p.breakdown,
      status: p.status,
      sentAt: p.sentAt?.toISOString() ?? null,
      viewedAt: p.viewedAt?.toISOString() ?? null,
      createdAt: p.createdAt.toISOString(),
    }));

    return NextResponse.json({
      data,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
      year,
      month: monthParam ? Number(monthParam) : null,
    });
  } catch (error) {
    console.error("[employee/payslips GET] Error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 },
    );
  }
}
