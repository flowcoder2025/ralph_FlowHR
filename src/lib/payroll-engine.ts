/**
 * 급여 계산 엔진 (Universal Wage Calculator)
 *
 * 임금 유형별 통합 급여 계산:
 * - COMPREHENSIVE: 포괄임금 (약정 초과분만 추가 수당)
 * - STANDARD: 월급제 (실제 근무시간 전체 수당)
 * - HOURLY: 시급제 (시급 × 실근무시간)
 * - DAILY: 일급제 (일급 × 실근무일수)
 * - ANNUAL: 연봉제 (연봉 / 12 + 수당)
 */

import {
  MONTHLY_WORK_HOURS,
  OVERTIME_PAY_RATE,
  NIGHT_SHIFT_PAY_RATE,
  HOLIDAY_PAY_RATE_NORMAL,
  HOLIDAY_PAY_RATE_EXTENDED,
  HOLIDAY_BASE_HOURS,
  DAILY_WORK_HOURS,
} from "@/lib/constants";

// ─── Types ──────────────────────────────────────────────

export interface PayrollInput {
  wageType: "COMPREHENSIVE" | "STANDARD" | "HOURLY" | "DAILY" | "ANNUAL";
  baseSalary: number;
  annualSalary?: number;
  hourlyRate?: number;
  contractedOTHours?: number;
  contractedNSHours?: number;
  contractedHDHours?: number;
  actualOTHours: number;
  actualNSHours: number;
  actualHDHours: number;
  actualWorkDays?: number;
  actualWorkMinutes?: number;
  fixedAllowances: { name: string; amount: number; taxable: boolean }[];
  nonTaxableAllowances: {
    name: string;
    amount: number;
    monthlyLimit: number;
  }[];
}

export interface ComprehensiveDetail {
  contractedOTPay: number;
  contractedNSPay: number;
  contractedHDPay: number;
  excessOTHours: number;
  excessOTPay: number;
  excessNSHours: number;
  excessNSPay: number;
  excessHDHours: number;
  excessHDPay: number;
}

export interface PayrollEarnings {
  basePay: number;
  overtimePay: number;
  nightPay: number;
  holidayPay: number;
  fixedAllowances: { name: string; amount: number }[];
  nonTaxableAllowances: { name: string; amount: number }[];
  totalTaxable: number;
  totalNonTaxable: number;
  grossPay: number;
}

export interface PayrollResult {
  wageType: string;
  hourlyRate: number;
  earnings: PayrollEarnings;
  comprehensiveDetail?: ComprehensiveDetail;
}

// ─── Internal Helpers ───────────────────────────────────

/**
 * 휴일근무수당 계산 (8시간 기준 분리)
 */
function computeHolidayPay(hourlyRate: number, hours: number): number {
  if (hours <= 0) return 0;
  const baseHours = Math.min(hours, HOLIDAY_BASE_HOURS);
  const extendedHours = Math.max(0, hours - HOLIDAY_BASE_HOURS);
  return Math.round(
    hourlyRate * HOLIDAY_PAY_RATE_NORMAL * baseHours +
      hourlyRate * HOLIDAY_PAY_RATE_EXTENDED * extendedHours,
  );
}

/**
 * 고정수당 합산 (과세 대상만)
 */
function sumTaxableAllowances(
  allowances: { name: string; amount: number; taxable: boolean }[],
): number {
  return allowances
    .filter((a) => a.taxable)
    .reduce((sum, a) => sum + a.amount, 0);
}

/**
 * 비과세수당 합산 (월 한도 적용)
 */
function computeNonTaxable(
  allowances: { name: string; amount: number; monthlyLimit: number }[],
): { items: { name: string; amount: number }[]; total: number } {
  const items = allowances.map((a) => ({
    name: a.name,
    amount: Math.min(a.amount, a.monthlyLimit),
  }));
  const total = items.reduce((sum, a) => sum + a.amount, 0);
  return { items, total };
}

// ─── Main Calculator ────────────────────────────────────

/**
 * 급여 계산 (모든 임금 유형 통합)
 *
 * @param input - 급여 계산 입력값
 * @returns PayrollResult - 항목별 급여 내역
 */
export function calculatePayroll(input: PayrollInput): PayrollResult {
  const {
    wageType,
    baseSalary,
    annualSalary,
    actualOTHours,
    actualNSHours,
    actualHDHours,
    actualWorkDays,
    actualWorkMinutes,
    fixedAllowances,
    nonTaxableAllowances,
    contractedOTHours = 0,
    contractedNSHours = 0,
    contractedHDHours = 0,
  } = input;

  let basePay = 0;
  let hourlyRate = 0;
  let overtimePay = 0;
  let nightPay = 0;
  let holidayPay = 0;
  let comprehensiveDetail: ComprehensiveDetail | undefined;

  switch (wageType) {
    case "COMPREHENSIVE": {
      hourlyRate = Math.round(baseSalary / MONTHLY_WORK_HOURS);
      basePay = baseSalary;

      // 약정 포함분 (baseSalary에 이미 포함, 내역 표시용)
      const contractedOTPay = Math.round(
        hourlyRate * OVERTIME_PAY_RATE * contractedOTHours,
      );
      const contractedNSPay = Math.round(
        hourlyRate * NIGHT_SHIFT_PAY_RATE * contractedNSHours,
      );
      const contractedHDPay = computeHolidayPay(hourlyRate, contractedHDHours);

      // 초과분만 추가 수당
      const excessOTHours = Math.max(0, actualOTHours - contractedOTHours);
      const excessNSHours = Math.max(0, actualNSHours - contractedNSHours);
      const excessHDHours = Math.max(0, actualHDHours - contractedHDHours);

      const excessOTPay = Math.round(
        hourlyRate * OVERTIME_PAY_RATE * excessOTHours,
      );
      const excessNSPay = Math.round(
        hourlyRate * NIGHT_SHIFT_PAY_RATE * excessNSHours,
      );
      const excessHDPay = computeHolidayPay(hourlyRate, excessHDHours);

      overtimePay = excessOTPay;
      nightPay = excessNSPay;
      holidayPay = excessHDPay;

      comprehensiveDetail = {
        contractedOTPay,
        contractedNSPay,
        contractedHDPay,
        excessOTHours,
        excessOTPay,
        excessNSHours,
        excessNSPay,
        excessHDHours,
        excessHDPay,
      };
      break;
    }

    case "STANDARD": {
      hourlyRate = Math.round(baseSalary / MONTHLY_WORK_HOURS);
      basePay = baseSalary;
      overtimePay = Math.round(
        hourlyRate * OVERTIME_PAY_RATE * actualOTHours,
      );
      nightPay = Math.round(
        hourlyRate * NIGHT_SHIFT_PAY_RATE * actualNSHours,
      );
      holidayPay = computeHolidayPay(hourlyRate, actualHDHours);
      break;
    }

    case "HOURLY": {
      hourlyRate = input.hourlyRate ?? 0;
      const workedHours = (actualWorkMinutes ?? 0) / 60;
      basePay = Math.round(hourlyRate * workedHours);
      overtimePay = Math.round(
        hourlyRate * OVERTIME_PAY_RATE * actualOTHours,
      );
      nightPay = Math.round(
        hourlyRate * NIGHT_SHIFT_PAY_RATE * actualNSHours,
      );
      holidayPay = computeHolidayPay(hourlyRate, actualHDHours);
      break;
    }

    case "DAILY": {
      hourlyRate = Math.round(baseSalary / DAILY_WORK_HOURS);
      basePay = Math.round(baseSalary * (actualWorkDays ?? 0));
      overtimePay = Math.round(
        hourlyRate * OVERTIME_PAY_RATE * actualOTHours,
      );
      nightPay = Math.round(
        hourlyRate * NIGHT_SHIFT_PAY_RATE * actualNSHours,
      );
      holidayPay = computeHolidayPay(hourlyRate, actualHDHours);
      break;
    }

    case "ANNUAL": {
      const monthly = (annualSalary ?? 0) / 12;
      basePay = Math.round(monthly);
      hourlyRate = Math.round(monthly / MONTHLY_WORK_HOURS);
      overtimePay = Math.round(
        hourlyRate * OVERTIME_PAY_RATE * actualOTHours,
      );
      nightPay = Math.round(
        hourlyRate * NIGHT_SHIFT_PAY_RATE * actualNSHours,
      );
      holidayPay = computeHolidayPay(hourlyRate, actualHDHours);
      break;
    }
  }

  // 고정수당
  const fixedAllowanceItems = fixedAllowances.map((a) => ({
    name: a.name,
    amount: a.amount,
  }));
  const taxableAllowances = sumTaxableAllowances(fixedAllowances);

  // 비과세수당
  const nonTax = computeNonTaxable(nonTaxableAllowances);

  const totalTaxable =
    basePay + overtimePay + nightPay + holidayPay + taxableAllowances;
  const totalNonTaxable = nonTax.total;
  const grossPay = totalTaxable + totalNonTaxable;

  return {
    wageType,
    hourlyRate,
    earnings: {
      basePay,
      overtimePay,
      nightPay,
      holidayPay,
      fixedAllowances: fixedAllowanceItems,
      nonTaxableAllowances: nonTax.items,
      totalTaxable,
      totalNonTaxable,
      grossPay,
    },
    ...(comprehensiveDetail ? { comprehensiveDetail } : {}),
  };
}
