import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

// ─── GET: 급여 상세 조회 ───────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request });
    if (!token || !token.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = token.tenantId as string;
    const { searchParams } = request.nextUrl;
    const employeeId = searchParams.get("employeeId");
    const yearParam = searchParams.get("year");
    const monthParam = searchParams.get("month");

    if (!employeeId || !yearParam || !monthParam) {
      return NextResponse.json(
        { error: "employeeId, year, month는 필수입니다" },
        { status: 400 },
      );
    }

    const year = Number(yearParam);
    const month = Number(monthParam);

    // 직원 정보
    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, tenantId },
      select: {
        id: true,
        name: true,
        employeeNumber: true,
        department: { select: { name: true } },
        position: { select: { name: true } },
      },
    });

    if (!employee) {
      return NextResponse.json(
        { error: "해당 직원을 찾을 수 없습니다" },
        { status: 404 },
      );
    }

    // 월 기간 범위
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0, 23, 59, 59);

    // 최신 급여 이력
    const latestSalary = await prisma.salaryHistory.findFirst({
      where: {
        tenantId,
        employeeId,
        effectiveDate: { lte: monthEnd },
      },
      orderBy: { effectiveDate: "desc" },
    });

    // PayrollRun + Payslip 조회
    const payrollRun = await prisma.payrollRun.findUnique({
      where: { tenantId_year_month: { tenantId, year, month } },
    });

    let payslip = null;
    if (payrollRun) {
      payslip = await prisma.payslip.findUnique({
        where: {
          payrollRunId_employeeId: {
            payrollRunId: payrollRun.id,
            employeeId,
          },
        },
      });
    }

    // 해당 월 근태 요약
    const attendanceRecords = await prisma.attendanceRecord.findMany({
      where: {
        tenantId,
        employeeId,
        date: { gte: monthStart, lte: monthEnd },
      },
      select: {
        date: true,
        status: true,
        workMinutes: true,
        overtime: true,
        checkIn: true,
        checkOut: true,
      },
    });

    const totalWorkDays = attendanceRecords.length;
    const totalWorkMinutes = attendanceRecords.reduce(
      (sum, r) => sum + (r.workMinutes ?? 0),
      0,
    );
    const totalOvertimeMinutes = attendanceRecords.reduce(
      (sum, r) => sum + (r.overtime ?? 0),
      0,
    );
    const presentDays = attendanceRecords.filter((r) => r.status === "PRESENT").length;
    const lateDays = attendanceRecords.filter((r) => r.status === "LATE").length;
    const absentDays = attendanceRecords.filter((r) => r.status === "ABSENT").length;

    return NextResponse.json({
      data: {
        employee: {
          id: employee.id,
          name: employee.name,
          employeeNumber: employee.employeeNumber,
          department: employee.department?.name ?? null,
          position: employee.position?.name ?? null,
        },
        salary: latestSalary
          ? {
              baseSalary: latestSalary.baseSalary,
              effectiveDate: latestSalary.effectiveDate.toISOString(),
            }
          : null,
        breakdown: payslip
          ? {
              baseSalary: payslip.baseSalary,
              allowances: payslip.allowances,
              deductions: payslip.deductions,
              netAmount: payslip.netAmount,
              detail: payslip.breakdown,
              status: payslip.status,
            }
          : null,
        attendanceSummary: {
          year,
          month,
          totalWorkDays,
          totalWorkHours: Math.round((totalWorkMinutes / 60) * 10) / 10,
          totalOvertimeHours: Math.round((totalOvertimeMinutes / 60) * 10) / 10,
          presentDays,
          lateDays,
          absentDays,
        },
      },
    });
  } catch (error) {
    console.error("[payroll/wage-detail GET] Error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 },
    );
  }
}
