/**
 * 4대보험 계산 유틸리티
 *
 * 한국 사회보험 기준 계산:
 * - 국민연금: 급여 x pensionRate (노사 각 4.5%)
 * - 건강보험: 급여 x healthRate (노사 각 3.545%)
 * - 장기요양보험: 건강보험료 x ltcRate (노사 각 12.81%)
 * - 고용보험: 급여 x employmentRate (노사 각 0.9%)
 * - 산재보험: 급여 x injuryRate (사업주 전액 부담, 0.7%)
 *
 * 모든 금액은 원 단위 반올림 (Math.round)
 */

// ─── Types ──────────────────────────────────────────────

export interface InsuranceRates {
  pensionRate: number;
  healthRate: number;
  ltcRate: number;
  employmentRate: number;
  injuryRate: number;
}

export interface InsuranceBreakdown {
  grossSalary: number;
  pension: { employee: number; employer: number };
  health: { employee: number; employer: number };
  ltc: { employee: number; employer: number };
  employment: { employee: number; employer: number };
  injury: { employer: number };
  totalEmployee: number;
  totalEmployer: number;
  totalCost: number;
}

// ─── Default Rates ──────────────────────────────────────

export const DEFAULT_INSURANCE_RATES: InsuranceRates = {
  pensionRate: 0.045,
  healthRate: 0.03545,
  ltcRate: 0.1281,
  employmentRate: 0.009,
  injuryRate: 0.007,
};

// ─── Functions ──────────────────────────────────────────

/**
 * 4대보험 산출
 *
 * @param grossSalary - 월 총 급여 (과세 기준)
 * @param rates - 보험 요율 설정
 * @returns InsuranceBreakdown - 항목별 보험료 내역
 */
export function calculateInsurance(
  grossSalary: number,
  rates: InsuranceRates,
): InsuranceBreakdown {
  if (grossSalary <= 0) {
    return {
      grossSalary: 0,
      pension: { employee: 0, employer: 0 },
      health: { employee: 0, employer: 0 },
      ltc: { employee: 0, employer: 0 },
      employment: { employee: 0, employer: 0 },
      injury: { employer: 0 },
      totalEmployee: 0,
      totalEmployer: 0,
      totalCost: 0,
    };
  }

  // 국민연금: 급여 x pensionRate (노사 각 동일)
  const pensionEmployee = Math.round(grossSalary * rates.pensionRate);
  const pensionEmployer = Math.round(grossSalary * rates.pensionRate);

  // 건강보험: 급여 x healthRate (노사 각 동일)
  const healthEmployee = Math.round(grossSalary * rates.healthRate);
  const healthEmployer = Math.round(grossSalary * rates.healthRate);

  // 장기요양보험: 건강보험료 x ltcRate (노사 각 동일)
  const healthPremium = grossSalary * rates.healthRate;
  const ltcEmployee = Math.round(healthPremium * rates.ltcRate);
  const ltcEmployer = Math.round(healthPremium * rates.ltcRate);

  // 고용보험: 급여 x employmentRate (노사 각 동일)
  const employmentEmployee = Math.round(grossSalary * rates.employmentRate);
  const employmentEmployer = Math.round(grossSalary * rates.employmentRate);

  // 산재보험: 급여 x injuryRate (사업주 전액)
  const injuryEmployer = Math.round(grossSalary * rates.injuryRate);

  // 합계
  const totalEmployee = pensionEmployee + healthEmployee + ltcEmployee + employmentEmployee;
  const totalEmployer = pensionEmployer + healthEmployer + ltcEmployer + employmentEmployer + injuryEmployer;
  const totalCost = totalEmployee + totalEmployer;

  return {
    grossSalary,
    pension: { employee: pensionEmployee, employer: pensionEmployer },
    health: { employee: healthEmployee, employer: healthEmployer },
    ltc: { employee: ltcEmployee, employer: ltcEmployer },
    employment: { employee: employmentEmployee, employer: employmentEmployer },
    injury: { employer: injuryEmployer },
    totalEmployee,
    totalEmployer,
    totalCost,
  };
}
