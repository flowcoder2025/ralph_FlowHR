---
name: crud-business-logic
description: CRUD/비즈니스 로직 구현 히스토리, 누락 항목, alert→API 교체 전수 결과
type: reference
---

# CRUD / 비즈니스 로직

## 근본 원인
PRD→fix_plan 변환 시 수용 기준을 "렌더링 확인" 수준으로 낮게 잡아서
CUD(Create/Update/Delete)가 명시적으로 빠짐. Phase 19에서 전수 구현.

## Phase 19: 비즈니스 로직 구현 (WI-100~114)
| WI | 대상 | 내용 |
|----|------|------|
| WI-100 | Admin 대시보드 | 내보내기, 빠른등록, 전체보기, 상세 라우팅 |
| WI-101 | 근태 기록 | 수정 모달 + PATCH API |
| WI-102 | 문서 | 일괄 발송 + 내보내기 |
| WI-103 | 급여 명세서 | 일괄 발송 + 내보내기 + PDF |
| WI-104 | 성과 | 리마인더 + 상세 + 1:1 예약 |
| WI-105 | 채용 | 파이프라인 이동 + 온보딩 체크 |
| WI-106 | 리포트 | 내보내기 CSV/PDF |
| WI-107 | 설정 | 알림 편집/추가 + 외부 연동 |
| WI-108 | 감사 로그 | 내보내기 |
| WI-109 | 직원 문서 | 다운로드/인쇄/거부 |
| WI-110 | 직원 보관함 | PDF 다운로드 |
| WI-111 | 휴가 신청 | 임시저장 버그 수정 |

## CRUD 전수 구현 (PR #136)
15개 API 신규/확장 + UI alert→실제 API 호출 교체

### 구현된 CRUD
| 도메인 | C | R | U | D |
|--------|---|---|---|---|
| Employees | O | O | O | O |
| Attendance Records | O | O | O | - |
| Attendance Shifts | O | O | O | - |
| Leave Requests | O(신청) | O | O(상태) | - |
| Employee 출퇴근 | O(체크인/아웃) | O | - | - |
| Employee 정정 | O | O | - | - |
| Performance Goals | O | O | O | - |
| Performance 1:1 | O | O | - | - |
| Platform Tenants | O | O | - | - |
| Notifications | O(전체) | - | - | - |
| Workflow Templates | O | O | O | - |
| Document Templates | O | O | - | - |
| 채용 공고 | O | O | O | - |

## 전수 스캔 최종 결과
- 전체 화면 버튼: **0개 미동작** (Link 감싸진 1개 제외)
- 남은 의도적 placeholder: "커스텀 리포트", "결제 설정" 2개만
- E2E: 31 tests passed

## 직원 CRUD UI (WI-118)
- 직원 등록 모달 + 수정/퇴사 기능 추가
- 페이지 헤더에 "직원 등록" 버튼
- 드로어에 "수정"/"삭제" 버튼

## S28 CRUD 추가 (2026-03-21)

### 급여 시스템
- WageConfig CRUD (직원별 임금체계 설정)
- SalaryHistory CRUD (급여 이력 추적)
- PayrollCalculation (5가지 wageType별 계산)
- SeveranceCalculation CRUD (퇴직금 시뮬레이션/확정/지급)

### 보험
- InsuranceRateConfig CRUD (연도별 요율)
- InsuranceContribution (월별 보험료 산출)

### 계약서
- EmploymentContract CRUD (생성/수정/서명)
- 자동 계약번호 (CT-YYYY-NNN)
- 양측 전자서명 (employee/employer)

### 지원금
- SubsidyProgram CRUD (프로그램 관리)
- SubsidyMatch (자동 매칭/상태 관리)
