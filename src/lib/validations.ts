import { z } from "zod";

// ─── 공통 ────────────────────────────────────────────
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
});

export const dateRangeSchema = z.object({
  startDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  endDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
}).refine((d) => new Date(d.endDate) >= new Date(d.startDate), {
  message: "종료일은 시작일 이후여야 합니다",
});

// ─── 직원 ────────────────────────────────────────────
export const createEmployeeSchema = z.object({
  name: z.string().min(1, "이름은 필수입니다").max(100),
  email: z.string().email("유효한 이메일을 입력해주세요"),
  employeeNumber: z.string().min(1, "사번은 필수입니다"),
  phone: z.string().optional(),
  departmentId: z.string().min(1, "부서는 필수입니다"),
  positionId: z.string().min(1, "직급은 필수입니다"),
  hireDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "날짜 형식: YYYY-MM-DD"),
  type: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT", "INTERN"]).default("FULL_TIME"),
});

// ─── 휴가 신청 ───────────────────────────────────────
export const leaveRequestSchema = z.object({
  policyId: z.string().min(1),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  days: z.coerce.number().positive("일수는 양수여야 합니다"),
  reason: z.string().optional(),
}).refine((d) => new Date(d.endDate) >= new Date(d.startDate), {
  message: "종료일은 시작일 이후여야 합니다",
});

// ─── 근태 정정 ───────────────────────────────────────
export const correctionSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "날짜 형식: YYYY-MM-DD"),
  reason: z.string().min(1, "사유는 필수입니다"),
  correctedCheckIn: z.string().optional(),
  correctedCheckOut: z.string().optional(),
});

// ─── GPS 체크인 ──────────────────────────────────────
export const gpsCheckinSchema = z.object({
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
}).optional();

// ─── 회사 설정 ───────────────────────────────────────
export const companySettingsSchema = z.object({
  companyName: z.string().max(200).optional(),
  name: z.string().max(200).optional(),
  businessNumber: z.string().max(50).optional(),
  industry: z.string().max(100).optional(),
  representative: z.string().max(100).optional(),
  fiscalYearStart: z.string().optional(),
  timezone: z.string().max(50).optional(),
  workStartTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  workEndTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  logoUrl: z.string().url().or(z.literal("")).optional(),
  officeLatitude: z.string().optional(),
  officeLongitude: z.string().optional(),
  allowedRadius: z.string().optional(),
});

// ─── 유틸 ────────────────────────────────────────────
/** Zod 검증 결과를 API 에러 응답으로 변환 */
export function formatZodError(error: z.ZodError): string {
  return error.issues.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ");
}
