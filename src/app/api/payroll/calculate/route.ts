import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { calculatePayroll } from "@/lib/payroll-engine";
import type { PayrollInput } from "@/lib/payroll-engine";
import { calculateIncomeTax, calculateLocalIncomeTax } from "@/lib/tax-calc";
import { calculateInsurance, DEFAULT_INSURANCE_RATES } from "@/lib/insurance-calc";
import type { InsuranceBreakdown } from "@/lib/insurance-calc";
import type { Prisma } from "@prisma/client";

// ─── POST: 월간 급여 계산 (통합 엔진) ──────────────────
export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request });
    if (!token || !token.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = token.tenantId as string;
    const body = await request.json();
    const { year, month, employeeId } = body;

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

    // 대상 직원 목록
    const employeeWhere = {
      tenantId,
      status: "ACTIVE" as const,
      ...(employeeId ? { id: employeeId } : {}),
    };

    const employees = await prisma.employee.findMany({
      where: employeeWhere,
      select: { id: true, name: true },
    });

    if (employees.length === 0) {
      return NextResponse.json(
        { error: "계산할 대상 직원이 없습니다" },
        { status: 404 },
      );
    }

    // 월 기간 범위
    const monthStart = new Date(targetYear, targetMonth - 1, 1);
    const monthEnd = new Date(targetYear, targetMonth, 0, 23, 59, 59);

    // PayrollRun 조회 또는 생성
    let payrollRun = await prisma.payrollRun.findUnique({
      where: { tenantId_year_month: { tenantId, year: targetYear, month: targetMonth } },
    });

    if (!payrollRun) {
      payrollRun = await prisma.payrollRun.create({
        data: {
          tenantId,
          year: targetYear,
          month: targetMonth,
          status: "DRAFT",
          currentStep: 1,
          totalEmployees: employees.length,
        },
      });
    }

    // 보험 요율 조회
    const rateConfig = await prisma.insuranceRateConfig.findFirst({
      where: { tenantId, year: targetYear, isActive: true },
    });
    const insuranceRates = rateConfig
      ? {
          pensionRate: rateConfig.pensionRate,
          healthRate: rateConfig.healthRate,
          ltcRate: rateConfig.ltcRate,
          employmentRate: rateConfig.employmentRate,
          injuryRate: rateConfig.injuryRate,
        }
      : DEFAULT_INSURANCE_RATES;

    const results: { employeeId: string; employeeName: string; breakdown: Record<string, unknown> }[] = [];

    for (const emp of employees) {
      // 1. WageConfig 조회 (fallback: SalaryHistory → STANDARD)
      const wageConfig = await prisma.wageConfig.findUnique({
        where: { employeeId: emp.id },
      });

      let wageType: PayrollInput["wageType"] = "STANDARD";
      let baseSalary = 0;
      let contractedOTHours = 0;
      let contractedNSHours = 0;
      let contractedHDHours = 0;
      let hourlyRate: number | undefined;
      let annualSalary: number | undefined;
      let fixedAllowances: { name: string; amount: number; taxable: boolean }[] = [];
      let nonTaxableAllowances: { name: string; amount: number; monthlyLimit: number }[] = [];

      if (wageConfig && wageConfig.tenantId === tenantId) {
        wageType = wageConfig.wageType as PayrollInput["wageType"];
        baseSalary = wageConfig.baseSalary;
        contractedOTHours = wageConfig.contractedOTHours;
        contractedNSHours = wageConfig.contractedNSHours;
        contractedHDHours = wageConfig.contractedHDHours;
        hourlyRate = wageConfig.hourlyRate ?? undefined;
        annualSalary = wageConfig.annualSalary ?? undefined;
        fixedAllowances = (wageConfig.fixedAllowances as { name: string; amount: number; taxable: boolean }[]) ?? [];
        nonTaxableAllowances = (wageConfig.nonTaxableAllowances as { name: string; amount: number; monthlyLimit: number }[]) ?? [];
      } else {
        // Fallback: SalaryHistory
        const latestSalary = await prisma.salaryHistory.findFirst({
          where: {
            tenantId,
            employeeId: emp.id,
            effectiveDate: { lte: monthEnd },
          },
          orderBy: { effectiveDate: "desc" },
        });

        if (!latestSalary) {
          continue; // 급여 정보 없으면 건너뜀
        }

        baseSalary = latestSalary.baseSalary;
      }

      // 2. 해당 월 출퇴근 기록에서 근무시간 집계
      const attendanceRecords = await prisma.attendanceRecord.findMany({
        where: {
          tenantId,
          employeeId: emp.id,
          date: { gte: monthStart, lte: monthEnd },
        },
        select: {
          overtime: true,
          checkIn: true,
          checkOut: true,
          workMinutes: true,
        },
      });

      // 연장근무시간 합산 (분 → 시간)
      const totalOvertimeMinutes = attendanceRecords.reduce(
        (sum, r) => sum + (r.overtime ?? 0),
        0,
      );
      const actualOTHours = totalOvertimeMinutes / 60;

      // 야간근무시간 계산 (22:00~06:00 사이 근무)
      let nightMinutes = 0;
      for (const rec of attendanceRecords) {
        if (rec.checkIn && rec.checkOut) {
          nightMinutes += calculateNightMinutes(rec.checkIn, rec.checkOut);
        }
      }
      const actualNSHours = nightMinutes / 60;

      // 휴일근무는 현재 attendance 모델에 별도 필드가 없으므로 0 처리
      const actualHDHours = 0;

      // 실근무일수
      const actualWorkDays = attendanceRecords.length;

      // 실근무분
      const actualWorkMinutes = attendanceRecords.reduce(
        (sum, r) => sum + (r.workMinutes ?? 0),
        0,
      );

      // 3. 급여 계산 (payroll-engine)
      const payrollResult = calculatePayroll({
        wageType,
        baseSalary,
        annualSalary,
        hourlyRate,
        contractedOTHours,
        contractedNSHours,
        contractedHDHours,
        actualOTHours,
        actualNSHours,
        actualHDHours,
        actualWorkDays,
        actualWorkMinutes,
        fixedAllowances,
        nonTaxableAllowances,
      });

      // 4. 소득세 계산 (과세분 기준)
      const incomeTax = calculateIncomeTax(payrollResult.earnings.totalTaxable);
      const localIncomeTax = calculateLocalIncomeTax(incomeTax);

      // 5. 4대보험 계산 (과세분 기준 — 비과세 제외!)
      const insurance: InsuranceBreakdown = calculateInsurance(
        payrollResult.earnings.totalTaxable,
        insuranceRates,
      );

      // 6. 공제 합계 및 실수령액
      const totalDeductions = insurance.totalEmployee + incomeTax + localIncomeTax;
      const netPay = payrollResult.earnings.grossPay - totalDeductions;

      const fullBreakdown = {
        wageType: payrollResult.wageType,
        hourlyRate: payrollResult.hourlyRate,
        earnings: payrollResult.earnings,
        ...(payrollResult.comprehensiveDetail ? { comprehensiveDetail: payrollResult.comprehensiveDetail } : {}),
        tax: {
          incomeTax,
          localIncomeTax,
          totalTax: incomeTax + localIncomeTax,
        },
        deductions: {
          pension: insurance.pension.employee,
          health: insurance.health.employee,
          longTermCare: insurance.ltc.employee,
          employment: insurance.employment.employee,
          incomeTax,
          localIncomeTax,
          totalDeductions,
        },
        insurance,
        netPay,
      };

      // 7. Payslip upsert
      await prisma.payslip.upsert({
        where: {
          payrollRunId_employeeId: {
            payrollRunId: payrollRun.id,
            employeeId: emp.id,
          },
        },
        create: {
          tenantId,
          payrollRunId: payrollRun.id,
          employeeId: emp.id,
          baseSalary: payrollResult.earnings.basePay,
          allowances: payrollResult.earnings.grossPay - payrollResult.earnings.basePay,
          deductions: totalDeductions,
          netAmount: netPay,
          breakdown: JSON.parse(JSON.stringify(fullBreakdown)) as Prisma.InputJsonValue,
          status: "DRAFT",
        },
        update: {
          baseSalary: payrollResult.earnings.basePay,
          allowances: payrollResult.earnings.grossPay - payrollResult.earnings.basePay,
          deductions: totalDeductions,
          netAmount: netPay,
          breakdown: JSON.parse(JSON.stringify(fullBreakdown)) as Prisma.InputJsonValue,
        },
      });

      // 8. InsuranceContribution upsert
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
          grossSalary: payrollResult.earnings.totalTaxable,
          pensionEmployee: insurance.pension.employee,
          pensionEmployer: insurance.pension.employer,
          healthEmployee: insurance.health.employee,
          healthEmployer: insurance.health.employer,
          ltcEmployee: insurance.ltc.employee,
          ltcEmployer: insurance.ltc.employer,
          employmentEmployee: insurance.employment.employee,
          employmentEmployer: insurance.employment.employer,
          injuryEmployer: insurance.injury.employer,
          totalEmployee: insurance.totalEmployee,
          totalEmployer: insurance.totalEmployer,
          status: "CALCULATED",
        },
        update: {
          grossSalary: payrollResult.earnings.totalTaxable,
          pensionEmployee: insurance.pension.employee,
          pensionEmployer: insurance.pension.employer,
          healthEmployee: insurance.health.employee,
          healthEmployer: insurance.health.employer,
          ltcEmployee: insurance.ltc.employee,
          ltcEmployer: insurance.ltc.employer,
          employmentEmployee: insurance.employment.employee,
          employmentEmployer: insurance.employment.employer,
          injuryEmployer: insurance.injury.employer,
          totalEmployee: insurance.totalEmployee,
          totalEmployer: insurance.totalEmployer,
          status: "CALCULATED",
        },
      });

      results.push({
        employeeId: emp.id,
        employeeName: emp.name,
        breakdown: fullBreakdown,
      });
    }

    // PayrollRun 총 금액 업데이트
    const totalAmount = results.reduce(
      (sum, r) => sum + ((r.breakdown.netPay as number) ?? 0),
      0,
    );
    const totalGross = results.reduce(
      (sum, r) => {
        const earnings = r.breakdown.earnings as { grossPay?: number } | undefined;
        return sum + (earnings?.grossPay ?? 0);
      },
      0,
    );

    await prisma.payrollRun.update({
      where: { id: payrollRun.id },
      data: {
        totalAmount: totalGross,
        totalEmployees: results.length,
      },
    });

    return NextResponse.json({
      data: {
        processed: results.length,
        year: targetYear,
        month: targetMonth,
        totalGross,
        totalNetPay: totalAmount,
        results: results.map((r) => ({
          employeeId: r.employeeId,
          employeeName: r.employeeName,
          breakdown: r.breakdown,
        })),
      },
    });
  } catch (error) {
    console.error("[payroll/calculate POST] Error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 },
    );
  }
}

// ─── Helper: 야간근무시간 계산 (22:00~06:00) ───────────
function calculateNightMinutes(checkIn: Date, checkOut: Date): number {
  let nightMinutes = 0;
  const startMs = checkIn.getTime();
  const endMs = checkOut.getTime();

  if (endMs <= startMs) return 0;

  // 하루 단위로 야간 시간대 겹침 계산
  const dayStart = new Date(checkIn);
  dayStart.setHours(0, 0, 0, 0);

  // 최대 2일 범위 (당일 + 다음날) 계산
  for (let d = 0; d < 2; d++) {
    const currentDay = new Date(dayStart);
    currentDay.setDate(currentDay.getDate() + d);

    // 야간 시간대 1: 당일 22:00 ~ 다음날 06:00
    const nightStart = new Date(currentDay);
    nightStart.setHours(22, 0, 0, 0);

    const nightEnd = new Date(currentDay);
    nightEnd.setDate(nightEnd.getDate() + 1);
    nightEnd.setHours(6, 0, 0, 0);

    // 근무시간과 야간시간대 겹침 계산
    const overlapStart = Math.max(startMs, nightStart.getTime());
    const overlapEnd = Math.min(endMs, nightEnd.getTime());

    if (overlapEnd > overlapStart) {
      nightMinutes += (overlapEnd - overlapStart) / (1000 * 60);
    }
  }

  return nightMinutes;
}
