/**
 * UTC 기반 날짜 유틸리티
 *
 * Prisma DateTime 필드는 UTC로 저장됨.
 * 서버 환경(Vercel=UTC, 로컬=KST)에 관계없이 동일한 결과를 보장하기 위해
 * 모든 "오늘 자정" 기준 계산을 UTC로 통일.
 */

/** UTC 기준 오늘 자정 (00:00:00.000Z) */
export function utcToday(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

/** UTC 기준 내일 자정 (오늘 + 1일 00:00:00.000Z) */
export function utcTomorrow(): Date {
  const t = utcToday();
  t.setUTCDate(t.getUTCDate() + 1);
  return t;
}

/** UTC 기준 어제 자정 */
export function utcYesterday(): Date {
  const t = utcToday();
  t.setUTCDate(t.getUTCDate() - 1);
  return t;
}

/** UTC 기준 N일 전/후 자정 (offset: 음수=과거, 양수=미래) */
export function utcDaysOffset(offset: number): Date {
  const t = utcToday();
  t.setUTCDate(t.getUTCDate() + offset);
  return t;
}

/** UTC 기준 이번 주 월요일 자정 */
export function utcMonday(): Date {
  const t = utcToday();
  const day = t.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  t.setUTCDate(t.getUTCDate() + diff);
  return t;
}

/** UTC 기준 이번 달 1일 자정 */
export function utcMonthStart(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

/** UTC 기준 지난 달 1일 자정 */
export function utcLastMonthStart(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
}

/** UTC 기준 지난 달 마지막 날 23:59:59.999 */
export function utcLastMonthEnd(): Date {
  const now = new Date();
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0));
  d.setUTCHours(23, 59, 59, 999);
  return d;
}

/** UTC 기준 오늘 끝 (23:59:59.999Z) */
export function utcTodayEnd(): Date {
  const t = utcToday();
  t.setUTCHours(23, 59, 59, 999);
  return t;
}

/** UTC 기준 두 날짜가 같은 날인지 비교 */
export function isSameUTCDay(a: Date, b: Date): boolean {
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  );
}

/** Tenant timezone 기반 시각 포맷 (HH:MM) — 서버 환경 무관 */
export function formatTimeWithTz(date: Date | null | undefined, timezone = "Asia/Seoul"): string | null {
  if (!date) return null;
  const parts = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: timezone,
  }).formatToParts(date);
  const h = parts.find((p) => p.type === "hour")?.value ?? "00";
  const m = parts.find((p) => p.type === "minute")?.value ?? "00";
  return `${h}:${m}`;
}

/** Tenant timezone 기반 날짜 포맷 (YYYY. MM. DD.) — 서버 환경 무관 */
export function formatDateWithTz(date: Date | null | undefined, timezone = "Asia/Seoul"): string | null {
  if (!date) return null;
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: timezone,
  }).format(date);
}
