import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { calculateSeverance } from "@/lib/severance-calc";

// ─── POST: 퇴직금 산출 ─────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request });
    if (!token || !token.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = token.tenantId as string;
    const body = await request.json();
    const { employeeId, resignDate } = body;

    if (!employeeId || !resignDate) {
      return NextResponse.json(
        { error: "employeeId, resignDate는 필수입니다" },
        { status: 400 },
      );
    }

    // 직원 조회
    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, tenantId },
      select: { id: true, name: true, hireDate: true },
    });

    if (!employee) {
      return NextResponse.json(
        { error: "해당 직원을 찾을 수 없습니다" },
        { status: 404 },
      );
    }

    const resignDateObj = new Date(resignDate);

    // 퇴직일 기준 최근 3개월 Payslip 조회
    const resignYear = resignDateObj.getFullYear();
    const resignMonth = resignDateObj.getMonth() + 1; // 1-indexed

    const last3MonthsPayslips: { grossPay: number; daysInMonth: number }[] = [];

    for (let i = 1; i <= 3; i++) {
      let targetMonth = resignMonth - i;
      let targetYear = resignYear;
      if (targetMonth <= 0) {
        targetMonth += 12;
        targetYear -= 1;
      }

      const payrollRun = await prisma.payrollRun.findUnique({
        where: {
          tenantId_year_month: {
            tenantId,
            year: targetYear,
            month: targetMonth,
          },
        },
      });

      if (payrollRun) {
        const payslip = await prisma.payslip.findUnique({
          where: {
            payrollRunId_employeeId: {
              payrollRunId: payrollRun.id,
              employeeId,
            },
          },
        });

        if (payslip) {
          // grossPay = baseSalary + allowances
          const grossPay = payslip.baseSalary + payslip.allowances;
          const daysInMonth = new Date(targetYear, targetMonth, 0).getDate();
          last3MonthsPayslips.push({ grossPay, daysInMonth });
        }
      }
    }

    if (last3MonthsPayslips.length === 0) {
      return NextResponse.json(
        { error: "최근 3개월 급여 데이터가 없습니다" },
        { status: 400 },
      );
    }

    // 퇴직금 계산
    const result = calculateSeverance({
      hireDate: employee.hireDate,
      resignDate: resignDateObj,
      last3MonthsPayslips,
    });

    // SeveranceCalculation 레코드 생성
    const calculation = await prisma.severanceCalculation.create({
      data: {
        tenantId,
        employeeId,
        startDate: employee.hireDate,
        endDate: resignDateObj,
        totalServiceDays: result.totalServiceDays,
        totalServiceYears: result.totalServiceYears,
        avgDailySalary: result.avgDailySalary,
        last3MonthsTotal: result.last3MonthsTotal,
        last3MonthsDays: result.last3MonthsDays,
        severanceAmount: result.severanceAmount,
        status: "ESTIMATED",
        calculatedBy: (token.employeeNumber as string) ?? null,
      },
    });

    return NextResponse.json({
      data: {
        id: calculation.id,
        employeeId: calculation.employeeId,
        employeeName: employee.name,
        eligible: result.eligible,
        startDate: calculation.startDate.toISOString(),
        endDate: calculation.endDate.toISOString(),
        totalServiceDays: result.totalServiceDays,
        totalServiceYears: result.totalServiceYears,
        avgDailySalary: result.avgDailySalary,
        last3MonthsTotal: result.last3MonthsTotal,
        last3MonthsDays: result.last3MonthsDays,
        severanceAmount: result.severanceAmount,
        status: calculation.status,
        createdAt: calculation.createdAt.toISOString(),
      },
    }, { status: 201 });
  } catch (error) {
    console.error("[payroll/severance/calculate POST] Error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 },
    );
  }
}
