import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { calculateInsurance, DEFAULT_INSURANCE_RATES } from "@/lib/insurance-calc";
import type { InsuranceRates } from "@/lib/insurance-calc";

// ─── POST: 월간 4대보험 산출 ────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request });
    if (!token || !token.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = token.tenantId as string;
    const body = await request.json();
    const { year, month } = body;

    if (!year || !month) {
      return NextResponse.json(
        { error: "year, month는 필수입니다" },
        { status: 400 },
      );
    }

    const targetYear = Number(year);
    const targetMonth = Number(month);

    if (targetMonth < 1 || targetMonth > 12) {
      return NextResponse.json(
        { error: "month는 1~12 사이여야 합니다" },
        { status: 400 },
      );
    }

    // 요율 설정 조회
    const rateConfig = await prisma.insuranceRateConfig.findUnique({
      where: { tenantId_year: { tenantId, year: targetYear } },
    });

    const rates: InsuranceRates = rateConfig
      ? {
          pensionRate: rateConfig.pensionRate,
          healthRate: rateConfig.healthRate,
          ltcRate: rateConfig.ltcRate,
          employmentRate: rateConfig.employmentRate,
          injuryRate: rateConfig.injuryRate,
        }
      : DEFAULT_INSURANCE_RATES;

    // 대상 직원 목록 (ACTIVE 상태)
    const employees = await prisma.employee.findMany({
      where: { tenantId, status: "ACTIVE" },
      select: { id: true, name: true },
    });

    if (employees.length === 0) {
      return NextResponse.json(
        { error: "계산할 대상 직원이 없습니다" },
        { status: 404 },
      );
    }

    const monthEnd = new Date(targetYear, targetMonth, 0, 23, 59, 59);

    const results: {
      employeeId: string;
      employeeName: string;
      grossSalary: number;
      totalEmployee: number;
      totalEmployer: number;
    }[] = [];

    for (const emp of employees) {
      // 해당 직원의 최신 급여 이력
      const latestSalary = await prisma.salaryHistory.findFirst({
        where: {
          tenantId,
          employeeId: emp.id,
          effectiveDate: { lte: monthEnd },
        },
        orderBy: { effectiveDate: "desc" },
      });

      if (!latestSalary) {
        continue;
      }

      const grossSalary = latestSalary.baseSalary;
      const breakdown = calculateInsurance(grossSalary, rates);

      // InsuranceContribution upsert
      await prisma.insuranceContribution.upsert({
        where: {
          tenantId_employeeId_year_month: {
            tenantId,
            employeeId: emp.id,
            year: targetYear,
            month: targetMonth,
          },
        },
        create: {
          tenantId,
          employeeId: emp.id,
          year: targetYear,
          month: targetMonth,
          grossSalary: breakdown.grossSalary,
          pensionEmployee: breakdown.pension.employee,
          pensionEmployer: breakdown.pension.employer,
          healthEmployee: breakdown.health.employee,
          healthEmployer: breakdown.health.employer,
          ltcEmployee: breakdown.ltc.employee,
          ltcEmployer: breakdown.ltc.employer,
          employmentEmployee: breakdown.employment.employee,
          employmentEmployer: breakdown.employment.employer,
          injuryEmployer: breakdown.injury.employer,
          totalEmployee: breakdown.totalEmployee,
          totalEmployer: breakdown.totalEmployer,
          status: "CALCULATED",
        },
        update: {
          grossSalary: breakdown.grossSalary,
          pensionEmployee: breakdown.pension.employee,
          pensionEmployer: breakdown.pension.employer,
          healthEmployee: breakdown.health.employee,
          healthEmployer: breakdown.health.employer,
          ltcEmployee: breakdown.ltc.employee,
          ltcEmployer: breakdown.ltc.employer,
          employmentEmployee: breakdown.employment.employee,
          employmentEmployer: breakdown.employment.employer,
          injuryEmployer: breakdown.injury.employer,
          totalEmployee: breakdown.totalEmployee,
          totalEmployer: breakdown.totalEmployer,
          status: "CALCULATED",
        },
      });

      results.push({
        employeeId: emp.id,
        employeeName: emp.name,
        grossSalary: breakdown.grossSalary,
        totalEmployee: breakdown.totalEmployee,
        totalEmployer: breakdown.totalEmployer,
      });
    }

    const summaryTotalEmployee = results.reduce((sum, r) => sum + r.totalEmployee, 0);
    const summaryTotalEmployer = results.reduce((sum, r) => sum + r.totalEmployer, 0);

    return NextResponse.json({
      data: {
        processed: results.length,
        year: targetYear,
        month: targetMonth,
        totalEmployee: summaryTotalEmployee,
        totalEmployer: summaryTotalEmployer,
        results,
      },
    });
  } catch (error) {
    console.error("[insurance/calculate POST] Error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 },
    );
  }
}
