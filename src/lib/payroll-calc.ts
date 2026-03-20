/**
 * 포괄임금 계산 유틸리티
 *
 * 한국 근로기준법 기반 계산:
 * - 통상시급 = baseSalary / 209
 * - 연장근무 = 통상시급 x 1.5 x hours (주 40시간 초과)
 * - 야간근무 = 통상시급 x 0.5 x hours (22:00~06:00, 추가 가산)
 * - 휴일근무 = 통상시급 x 1.5 x hours (8h 이하) + 통상시급 x 2.0 x hours (8h 초과)
 */

import {
  MONTHLY_WORK_HOURS,
  OVERTIME_PAY_RATE,
  NIGHT_SHIFT_PAY_RATE,
  HOLIDAY_PAY_RATE_NORMAL,
  HOLIDAY_PAY_RATE_EXTENDED,
  HOLIDAY_BASE_HOURS,
} from "@/lib/constants";

// ─── Types ──────────────────────────────────────────────

export interface WageBreakdown {
  baseSalary: number;
  hourlyRate: number;
  overtimeHours: number;
  overtimePay: number;
  nightHours: number;
  nightPay: number;
  holidayHours: number;
  holidayPay: number;
  totalAllowances: number;
  additionalAllowances: number;
  grossPay: number;
}

export interface CalculateTotalWageParams {
  baseSalary: number;
  overtimeHours: number;
  nightHours: number;
  holidayHours: number;
  allowances?: number;
}

// ─── Functions ──────────────────────────────────────────

/**
 * 통상시급 계산
 * 통상시급 = 월 기본급 / 209시간
 */
export function calculateHourlyRate(baseSalary: number): number {
  if (baseSalary <= 0) return 0;
  return Math.round(baseSalary / MONTHLY_WORK_HOURS);
}

/**
 * 연장근무수당 계산
 * 연장근무수당 = 통상시급 x 1.5 x 연장근무시간
 */
export function calculateOvertimePay(hourlyRate: number, hours: number): number {
  if (hourlyRate <= 0 || hours <= 0) return 0;
  return Math.round(hourlyRate * OVERTIME_PAY_RATE * hours);
}

/**
 * 야간근무수당 계산 (22:00~06:00 추가 가산)
 * 야간근무수당 = 통상시급 x 0.5 x 야간근무시간
 */
export function calculateNightShiftPay(hourlyRate: number, hours: number): number {
  if (hourlyRate <= 0 || hours <= 0) return 0;
  return Math.round(hourlyRate * NIGHT_SHIFT_PAY_RATE * hours);
}

/**
 * 휴일근무수당 계산
 * 8시간 이하: 통상시급 x 1.5 x hours
 * 8시간 초과: 통상시급 x 2.0 x (hours - 8)
 */
export function calculateHolidayPay(hourlyRate: number, hours: number): number {
  if (hourlyRate <= 0 || hours <= 0) return 0;

  const baseHours = Math.min(hours, HOLIDAY_BASE_HOURS);
  const extendedHours = Math.max(0, hours - HOLIDAY_BASE_HOURS);

  const basePay = Math.round(hourlyRate * HOLIDAY_PAY_RATE_NORMAL * baseHours);
  const extendedPay = Math.round(hourlyRate * HOLIDAY_PAY_RATE_EXTENDED * extendedHours);

  return basePay + extendedPay;
}

/**
 * 총 급여 계산 (포괄임금)
 * 기본급 + 연장수당 + 야간수당 + 휴일수당 + 기타수당
 */
export function calculateTotalWage(params: CalculateTotalWageParams): WageBreakdown {
  const { baseSalary, overtimeHours, nightHours, holidayHours, allowances = 0 } = params;

  const hourlyRate = calculateHourlyRate(baseSalary);
  const overtimePay = calculateOvertimePay(hourlyRate, overtimeHours);
  const nightPay = calculateNightShiftPay(hourlyRate, nightHours);
  const holidayPay = calculateHolidayPay(hourlyRate, holidayHours);

  const totalAllowances = overtimePay + nightPay + holidayPay + allowances;
  const grossPay = baseSalary + totalAllowances;

  return {
    baseSalary,
    hourlyRate,
    overtimeHours,
    overtimePay,
    nightHours,
    nightPay,
    holidayHours,
    holidayPay,
    totalAllowances,
    additionalAllowances: allowances,
    grossPay,
  };
}
