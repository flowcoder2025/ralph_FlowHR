---
name: api-design-standards
description: API 설계 표준 + 전체 경로 맵 — 2026-03-20 업데이트
type: reference
---

# API 설계

## 표준 응답 형식
- 목록: `{ data: [], total, page, pageSize }` 또는 `{ data: [], pagination }`
- 단건: `{ data: {} }`
- 대시보드: `{ data: { kpi, ... } }` (WI-138에서 래핑 추가)
- 에러: `{ error: "메시지" }`

## 보안
- 모든 API: getToken + tenantId 검증
- Platform API: PLATFORM_OPERATOR role 검증
- Admin API: ADMIN_ROLES (middleware RBAC)
- rate limit: 로그인 15분당 10회
- Zod 입력 검증, SameSite cookie, 보안 헤더

## API 경로 맵 (2026-03-20)

### Admin 전용
| 경로 | 메서드 | 설명 |
|------|--------|------|
| /api/admin/dashboard | GET | 대시보드 KPI |
| /api/admin/reports/custom | GET/POST | 커스텀 리포트 |
| /api/employees | GET/POST/PATCH/DELETE | 직원 CRUD (+User 자동생성) |
| /api/attendance/records | GET/PATCH | 근태 기록 (+GPS 표시) |
| /api/attendance/exceptions | GET/PATCH | 정정 승인/반려 (+출결 자동반영) |
| /api/attendance/dashboard | GET | 근태 대시보드 |
| /api/leave/requests | GET/PATCH | 휴가 승인/반려 (+알림 생성) |
| /api/documents/send | POST | 문서 발송 (+알림 생성) |
| /api/approval/requests | GET/POST/PATCH | 일반 결재 |
| /api/export | POST | CSV 내보내기 |
| /api/settings/company | GET/PATCH | 회사 설정 (+GPS) |
| /api/performance/goals | GET/POST/PATCH | 성과 목표 |
| /api/payroll/salary-history | GET/POST | 급여 이력 관리 (SalaryHistory 모델) |
| /api/payroll/calculate | GET/POST | 포괄임금 계산 (통상시급/연장/야간/휴일) |
| /api/payroll/wage-detail | GET | 임금 상세 조회 |

### Employee 전용
| 경로 | 메서드 | 설명 |
|------|--------|------|
| /api/employee/schedule | GET | 일정+출결 이력 |
| /api/employee/schedule/checkin | POST/PATCH | 출퇴근 (+GPS +상태판별) |
| /api/employee/profile | GET/PATCH | 프로필 |
| /api/employee/notifications | GET/PATCH | 알림 |
| /api/employee/documents | GET | 수신 문서 |
| /api/employee/requests/leave | POST | 휴가 신청 |
| /api/employee/requests/correction | POST | 정정 신청 |
| /api/documents/sign | PATCH | 문서 서명 |

### Platform 전용
| 경로 | 메서드 | 설명 |
|------|--------|------|
| /api/platform/dashboard | GET | 플랫폼 대시보드 |
| /api/platform/tenants | GET/POST | 테넌트 관리 |
| /api/platform/billing | GET | 빌링 |
| /api/platform/billing/settings | PATCH | 결제 설정 |
| /api/platform/support | GET | 지원 티켓 |
| /api/platform/audit | GET | 감사 로그 |

## API 변경 이력 (PR #166~174)

### 정정신청 (PR #166)
- correction API: `targetDate`/`date` 둘 다 수용 (키 불일치 해소)
- exceptions PATCH: `employeeNumber` 체크 제거 (Admin 호환)

### 문서발송 (PR #167)
- documents/send API: Admin Employee 없을 때 fallback 처리
- exceptions PATCH: `localTimeToUTC` 함수 추가 (Intl 기반 KST→UTC)

### 회사설정 (PR #168)
- settings/company API: `!== undefined` → `!= null` (GPS null 방어)

### 포괄임금 (PR #174)
- SalaryHistory 모델 신규
- `payroll-calc.ts`: 통상시급/연장/야간/휴일 계산 유틸리티
- 직원 등록 폼에 기본급 필드 추가

## WI-154~159 API 추가 (2026-03-20~21)

### 급여 시스템
| 경로 | 메서드 | 설명 |
|------|--------|------|
| /api/payroll/wage-config | GET/POST | 임금체계 설정 CRUD |
| /api/payroll/wage-config/[id] | GET/PATCH | 임금설정 상세/수정 |
| /api/payroll/calculate | POST | 월별 급여 계산 (5가지 wageType, 세금+보험 통합) |
| /api/payroll/salary-history | GET/POST | 급여 이력 |
| /api/payroll/wage-detail | GET | 개인 급여 상세 |
| /api/payroll/severance/calculate | POST | 퇴직금 시뮬레이션 |
| /api/payroll/severance | GET | 퇴직금 이력 |
| /api/payroll/severance/[id] | PATCH | 퇴직금 상태 변경 |
| /api/employee/payslips | GET | Employee 본인 명세서 |
| /api/employee/payslips/[id] | GET/POST | 명세서 상세/재발행 |

### 보험
| /api/insurance/rates | GET/PUT | 4대보험 요율 |
| /api/insurance/calculate | POST | 월별 보험료 산출 |
| /api/insurance/contributions | GET | 보험료 내역 |

### 계약서
| /api/contracts | GET/POST | 근로계약서 목록/생성 |
| /api/contracts/[id] | GET/PATCH | 계약서 상세/수정 |
| /api/contracts/[id]/sign | POST | 전자서명 |

### 지원금
| /api/subsidies/programs | GET/POST | 프로그램 CRUD |
| /api/subsidies/programs/[id] | PATCH/DELETE | 프로그램 수정/삭제 |
| /api/subsidies/match | POST | 전체 직원 자동 매칭 |
| /api/subsidies/matches | GET | 매칭 결과 |
| /api/subsidies/matches/[id] | PATCH | 매칭 상태 변경 |
