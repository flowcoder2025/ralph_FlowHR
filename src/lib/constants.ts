/**
 * 프로젝트 공통 상수
 * 하드코딩 방지 — 모든 매직 넘버/기본값은 여기서 관리
 */

// ─── 시간대 ──────────────────────────────────────────
export const DEFAULT_TIMEZONE = "Asia/Seoul";

// ─── 근무시간 ────────────────────────────────────────
export const DEFAULT_WORK_START_TIME = "09:00";
export const DEFAULT_WORK_END_TIME = "18:00";

// ─── 출퇴근 정책 ────────────────────────────────────
/** 조기퇴근 판별 기준 (퇴근 시간 N분 전 퇴근 시 EARLY_LEAVE) */
export const EARLY_LEAVE_THRESHOLD_MINUTES = 30;

/** 최소 근무시간 (분) — 미만이면 HALF_DAY 처리 */
export const MINIMUM_WORK_MINUTES = 30;

/** GPS 허용 반경 기본값 (미터) */
export const DEFAULT_GPS_RADIUS = 500;

// ─── 근로시간 ────────────────────────────────────────
/** 주간 초과근무 임박 기준 (분 단위, 48시간) */
export const OVERTIME_LIMIT_MINUTES = 48 * 60; // 2880

/** SLA 초과 기준 (시간) */
export const SLA_OVERDUE_HOURS = 48;

// ─── 조회 기간 ───────────────────────────────────────
/** 출결 이력 기본 조회 기간 (일) */
export const HISTORY_LOOKBACK_DAYS = 13;

/** 문서 만료 임박 기준 (일) */
export const EXPIRING_WINDOW_DAYS = 7;

/** 리포트 근태 트렌드 조회 기간 (주) */
export const REPORT_LOOKBACK_WEEKS = 8;

// ─── 페이지네이션 ────────────────────────────────────
export const DEFAULT_PAGE_SIZE = 10;

// ─── SLA ─────────────────────────────────────────────
/** 승인 요청 SLA 초과 기준 (일) */
export const APPROVAL_SLA_DAYS = 3;
