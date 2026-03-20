/**
 * 퇴직금 계산 유틸리티
 *
 * 한국 근로자퇴직급여 보장법 기반:
 * - 1년 이상 근무 시 퇴직금 지급 대상
 * - 평균임금 = 최근 3개월 총 급여 / 최근 3개월 총 일수
 * - 퇴직금 = 평균임금 × 30 × (총 근무일수 / 365)
 */

import {
  MIN_SEVERANCE_DAYS,
  SEVERANCE_DAYS_PER_YEAR,
} from "@/lib/constants";

// ─── Types ──────────────────────────────────────────────

export interface SeveranceInput {
  hireDate: Date;
  resignDate: Date;
  last3MonthsPayslips: { grossPay: number; daysInMonth: number }[];
}

export interface SeveranceResult {
  eligible: boolean;
  totalServiceDays: number;
  totalServiceYears: number;
  last3MonthsTotal: number;
  last3MonthsDays: number;
  avgDailySalary: number;
  severanceAmount: number;
}

// ─── Functions ──────────────────────────────────────────

/**
 * 두 날짜 사이의 일수 계산 (퇴직일 - 입사일)
 */
function daysBetween(start: Date, end: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  const startUtc = Date.UTC(
    start.getFullYear(),
    start.getMonth(),
    start.getDate(),
  );
  const endUtc = Date.UTC(
    end.getFullYear(),
    end.getMonth(),
    end.getDate(),
  );
  return Math.floor((endUtc - startUtc) / msPerDay);
}

/**
 * 퇴직금 계산
 *
 * @param input - 퇴직금 계산 입력값
 * @returns SeveranceResult - 퇴직금 산출 내역
 */
export function calculateSeverance(input: SeveranceInput): SeveranceResult {
  const { hireDate, resignDate, last3MonthsPayslips } = input;

  const totalServiceDays = daysBetween(hireDate, resignDate);
  const totalServiceYears = totalServiceDays / 365;
  const eligible = totalServiceDays >= MIN_SEVERANCE_DAYS;

  const last3MonthsTotal = last3MonthsPayslips.reduce(
    (sum, p) => sum + p.grossPay,
    0,
  );
  const last3MonthsDays = last3MonthsPayslips.reduce(
    (sum, p) => sum + p.daysInMonth,
    0,
  );

  const avgDailySalary =
    last3MonthsDays > 0
      ? Math.round(last3MonthsTotal / last3MonthsDays)
      : 0;

  const severanceAmount = eligible
    ? Math.round(
        avgDailySalary * SEVERANCE_DAYS_PER_YEAR * (totalServiceDays / 365),
      )
    : 0;

  return {
    eligible,
    totalServiceDays,
    totalServiceYears: Math.round(totalServiceYears * 100) / 100,
    last3MonthsTotal,
    last3MonthsDays,
    avgDailySalary,
    severanceAmount,
  };
}
