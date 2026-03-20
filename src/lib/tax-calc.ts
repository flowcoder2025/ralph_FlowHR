/**
 * 소득세 계산 유틸리티
 *
 * 한국 간이세액표 기반:
 * - 월 과세소득 구간별 세율 적용
 * - 부양가족 수에 따른 공제
 * - 지방소득세 = 소득세 × 10%
 */

import { LOCAL_TAX_RATE, DEFAULT_DEPENDENTS } from "@/lib/constants";

// ─── Types ──────────────────────────────────────────────

interface TaxBracket {
  min: number;
  max: number;
  rate: number;
  base: number;
}

// ─── 간이세액표 (월 과세소득 기준, 부양가족 1인) ────────

const TAX_BRACKETS: TaxBracket[] = [
  { min: 0, max: 1060000, rate: 0, base: 0 },
  { min: 1060000, max: 1500000, rate: 0.06, base: 0 },
  { min: 1500000, max: 3000000, rate: 0.15, base: 26400 },
  { min: 3000000, max: 4500000, rate: 0.24, base: 251400 },
  { min: 4500000, max: 7000000, rate: 0.35, base: 611400 },
  { min: 7000000, max: 10000000, rate: 0.38, base: 1486400 },
  { min: 10000000, max: Infinity, rate: 0.4, base: 2626400 },
];

/**
 * 부양가족 추가 공제액 (구간별)
 * 부양가족 2인부터 1인당 공제
 */
const DEPENDENT_DEDUCTION_BY_BRACKET: { min: number; deduction: number }[] = [
  { min: 0, deduction: 0 },
  { min: 1060000, deduction: 10000 },
  { min: 1500000, deduction: 15000 },
  { min: 3000000, deduction: 20000 },
  { min: 4500000, deduction: 30000 },
  { min: 7000000, deduction: 40000 },
  { min: 10000000, deduction: 50000 },
];

// ─── Functions ──────────────────────────────────────────

/**
 * 구간별 부양가족 공제액 조회
 */
function getDependentDeduction(monthlyTaxable: number): number {
  let deduction = 0;
  for (const bracket of DEPENDENT_DEDUCTION_BY_BRACKET) {
    if (monthlyTaxable >= bracket.min) {
      deduction = bracket.deduction;
    }
  }
  return deduction;
}

/**
 * 소득세 계산 (간이세액표 기준)
 *
 * @param monthlyTaxable - 월 과세소득
 * @param dependents - 부양가족 수 (본인 포함, 기본 1)
 * @returns 소득세 (원 단위, 반올림)
 */
export function calculateIncomeTax(
  monthlyTaxable: number,
  dependents: number = DEFAULT_DEPENDENTS,
): number {
  if (monthlyTaxable <= 0) return 0;

  // 해당 구간 찾기
  let tax = 0;
  for (const bracket of TAX_BRACKETS) {
    if (monthlyTaxable > bracket.min && monthlyTaxable <= bracket.max) {
      tax = bracket.base + (monthlyTaxable - bracket.min) * bracket.rate;
      break;
    }
    if (bracket.max === Infinity && monthlyTaxable > bracket.min) {
      tax = bracket.base + (monthlyTaxable - bracket.min) * bracket.rate;
      break;
    }
  }

  // 부양가족 공제 (본인 1인 제외, 추가 부양가족 1인당 공제)
  const extraDependents = Math.max(0, dependents - 1);
  const deductionPerPerson = getDependentDeduction(monthlyTaxable);
  const dependentDeduction = extraDependents * deductionPerPerson;

  tax = Math.max(0, tax - dependentDeduction);

  return Math.round(tax);
}

/**
 * 지방소득세 계산
 * 지방소득세 = 소득세 × 10%
 *
 * @param incomeTax - 소득세액
 * @returns 지방소득세 (원 단위, 반올림)
 */
export function calculateLocalIncomeTax(incomeTax: number): number {
  if (incomeTax <= 0) return 0;
  return Math.round(incomeTax * LOCAL_TAX_RATE);
}
