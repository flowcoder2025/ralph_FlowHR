import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { calculateTotalWage } from "@/lib/payroll-calc";
import { calculateInsurance, DEFAULT_INSURANCE_RATES } from "@/lib/insurance-calc";
import type { InsuranceBreakdown } from "@/lib/insurance-calc";
import type { Prisma } from "@prisma/client";

// ─── POST: 월간 급여 계산 ──────────────────────────────
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

    const results: { employeeId: string; employeeName: string; breakdown: Record<string, unknown> }[] = [];

    for (const emp of employees) {
      // 1. 해당 직원의 최신 급여 이력 (effectiveDate 기준)
      const latestSalary = await prisma.salaryHistory.findFirst({
        where: {
          tenantId,
          employeeId: emp.id,
          effectiveDate: { lte: monthEnd },
        },
        orderBy: { effectiveDate: "desc" },
      });

      if (!latestSalary) {
        // 급여 이력이 없으면 건너뜀
        continue;
      }

      // 2. 해당 월 출퇴근 기록에서 초과근무 시간 합산
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
        },
      });

      // 연장근무시간 합산 (분 → 시간)
      const totalOvertimeMinutes = attendanceRecords.reduce(
        (sum, r) => sum + (r.overtime ?? 0),
        0,
      );
      const overtimeHours = totalOvertimeMinutes / 60;

      // 야간근무시간 계산 (22:00~06:00 사이 근무)
      let nightMinutes = 0;
      for (const rec of attendanceRecords) {
        if (rec.checkIn && rec.checkOut) {
          nightMinutes += calculateNightMinutes(rec.checkIn, rec.checkOut);
        }
      }
      const nightHours = nightMinutes / 60;

      // 휴일근무는 현재 attendance 모델에 별도 필드가 없으므로 0 처리
      // 향후 AttendanceRecord에 isHoliday 필드 추가 시 계산 가능
      const holidayHours = 0;

      // 3. 급여 계산
      const breakdown = calculateTotalWage({
        baseSalary: latestSalary.baseSalary,
        overtimeHours,
        nightHours,
        holidayHours,
      });

      // 4. 4대보험 공제 계산
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

      const insurance: InsuranceBreakdown = calculateInsurance(breakdown.grossPay, insuranceRates);
      const totalDeductions = insurance.totalEmployee;
      const netAmount = breakdown.grossPay - totalDeductions;

      const fullBreakdown = {
        ...breakdown,
        deductions: {
          pension: insurance.pension.employee,
          health: insurance.health.employee,
          longTermCare: insurance.ltc.employee,
          employment: insurance.employment.employee,
          totalDeductions,
        },
        insurance,
        netAmount,
      };

      // 5. Payslip 생성 또는 업데이트
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
          baseSalary: breakdown.baseSalary,
          allowances: breakdown.totalAllowances,
          deductions: totalDeductions,
          netAmount,
          breakdown: JSON.parse(JSON.stringify(fullBreakdown)) as Prisma.InputJsonValue,
          status: "DRAFT",
        },
        update: {
          baseSalary: breakdown.baseSalary,
          allowances: breakdown.totalAllowances,
          deductions: totalDeductions,
          netAmount,
          breakdown: JSON.parse(JSON.stringify(fullBreakdown)) as Prisma.InputJsonValue,
        },
      });

      results.push({
        employeeId: emp.id,
        employeeName: emp.name,
        breakdown: fullBreakdown,
      });
    }

    // PayrollRun 총 금액 업데이트
    const totalAmount = results.reduce((sum, r) => sum + ((r.breakdown.grossPay as number) ?? 0), 0);
    await prisma.payrollRun.update({
      where: { id: payrollRun.id },
      data: {
        totalAmount,
        totalEmployees: results.length,
      },
    });

    return NextResponse.json({
      data: {
        processed: results.length,
        year: targetYear,
        month: targetMonth,
        totalAmount,
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
