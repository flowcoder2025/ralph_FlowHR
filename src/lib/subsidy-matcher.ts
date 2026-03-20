/**
 * 고용 보조금 매칭 엔진
 *
 * 직원 정보와 보조금 기준을 비교하여 수급 자격을 판정:
 * - 연령 범위 확인
 * - 고용 유형 확인
 * - 근속 기간 확인
 * - 장애 여부 확인
 * - 점수 산출 (충족 기준 / 전체 기준 × 100)
 */

// ─── Types ──────────────────────────────────────────────

export interface MatchInput {
  employee: {
    birthDate: Date | null;
    hireDate: Date;
    employmentType: string;
    disabilityStatus: boolean;
  };
  criteria: {
    ageMin?: number;
    ageMax?: number;
    employmentTypes?: string[];
    minEmployeePeriodDays?: number;
    maxEmployeePeriodDays?: number;
    disabilityRequired?: boolean;
  };
}

export interface CriterionResult {
  criterion: string;
  met: boolean;
  detail: string;
}

export interface MatchResult {
  eligible: boolean;
  score: number;
  details: CriterionResult[];
}

// ─── Internal Helpers ───────────────────────────────────

/**
 * 만 나이 계산 (기준일 기준)
 */
function calculateAge(birthDate: Date, referenceDate: Date): number {
  let age = referenceDate.getFullYear() - birthDate.getFullYear();
  const monthDiff = referenceDate.getMonth() - birthDate.getMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && referenceDate.getDate() < birthDate.getDate())
  ) {
    age--;
  }
  return age;
}

/**
 * 두 날짜 사이의 일수 계산
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

// ─── Main Matcher ───────────────────────────────────────

/**
 * 보조금 수급 자격 매칭
 *
 * @param input - 직원 정보 + 보조금 기준
 * @returns MatchResult - 자격 여부, 점수, 상세 판정
 */
export function matchSubsidy(input: MatchInput): MatchResult {
  const { employee, criteria } = input;
  const details: CriterionResult[] = [];
  const today = new Date();

  // 연령 하한 확인
  if (criteria.ageMin !== undefined) {
    if (employee.birthDate === null) {
      details.push({
        criterion: "최소 연령",
        met: false,
        detail: "생년월일 정보 없음",
      });
    } else {
      const age = calculateAge(employee.birthDate, today);
      const met = age >= criteria.ageMin;
      details.push({
        criterion: "최소 연령",
        met,
        detail: `만 ${age}세 (기준: ${criteria.ageMin}세 이상)`,
      });
    }
  }

  // 연령 상한 확인
  if (criteria.ageMax !== undefined) {
    if (employee.birthDate === null) {
      details.push({
        criterion: "최대 연령",
        met: false,
        detail: "생년월일 정보 없음",
      });
    } else {
      const age = calculateAge(employee.birthDate, today);
      const met = age <= criteria.ageMax;
      details.push({
        criterion: "최대 연령",
        met,
        detail: `만 ${age}세 (기준: ${criteria.ageMax}세 이하)`,
      });
    }
  }

  // 고용 유형 확인
  if (
    criteria.employmentTypes !== undefined &&
    criteria.employmentTypes.length > 0
  ) {
    const met = criteria.employmentTypes.includes(employee.employmentType);
    details.push({
      criterion: "고용 유형",
      met,
      detail: `${employee.employmentType} (허용: ${criteria.employmentTypes.join(", ")})`,
    });
  }

  // 최소 근속 기간 확인
  if (criteria.minEmployeePeriodDays !== undefined) {
    const employedDays = daysBetween(employee.hireDate, today);
    const met = employedDays >= criteria.minEmployeePeriodDays;
    details.push({
      criterion: "최소 근속일수",
      met,
      detail: `${employedDays}일 (기준: ${criteria.minEmployeePeriodDays}일 이상)`,
    });
  }

  // 최대 근속 기간 확인
  if (criteria.maxEmployeePeriodDays !== undefined) {
    const employedDays = daysBetween(employee.hireDate, today);
    const met = employedDays <= criteria.maxEmployeePeriodDays;
    details.push({
      criterion: "최대 근속일수",
      met,
      detail: `${employedDays}일 (기준: ${criteria.maxEmployeePeriodDays}일 이하)`,
    });
  }

  // 장애 여부 확인
  if (criteria.disabilityRequired === true) {
    const met = employee.disabilityStatus;
    details.push({
      criterion: "장애 여부",
      met,
      detail: met ? "장애인 등록 확인" : "장애인 등록 미확인",
    });
  }

  // 점수 계산
  const totalCriteria = details.length;
  const metCriteria = details.filter((d) => d.met).length;
  const score =
    totalCriteria > 0 ? Math.round((metCriteria / totalCriteria) * 100) : 100;
  const eligible = totalCriteria > 0 ? metCriteria === totalCriteria : true;

  return {
    eligible,
    score,
    details,
  };
}
