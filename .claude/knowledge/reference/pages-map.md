---
name: pages-api-map
description: 전체 페이지 맵 — 2026-03-20 업데이트 (PWA + GPS지도 + 포괄임금)
type: reference
---

# 페이지 맵 (33개)

## Admin (17개)
/admin, /admin/people, /admin/org-chart, /admin/people/changes,
/admin/attendance, /admin/leave, /admin/workflow, /admin/documents,
/admin/payroll, /admin/performance, /admin/recruiting,
/admin/reports, /admin/reports/custom, /admin/reports/people,
/admin/reports/attendance, /admin/reports/scheduled, /admin/settings

## Employee (6개)
/employee, /employee/schedule, /employee/requests,
/employee/inbox, /employee/documents, /employee/profile

## Platform (7개)
/platform, /platform/tenants, /platform/billing,
/platform/support, /platform/monitoring, /platform/audit, /platform/settings

## Public (3개)
/, /login, /demo

## UI 컴포넌트 (주요)
Skeleton, SkeletonCard, SkeletonTable, Breadcrumb,
Toast (ToastProvider), ThemeToggle, Modal, Drawer,
DataTable, KPICard, Badge, Button, Input, Select

## PR #166~174 신규 컴포넌트

| 컴포넌트 | PR | 설명 |
|----------|-----|------|
| GpsMapModal.tsx | #169 | GPS 지도 뷰어 (Leaflet + OpenStreetMap) — RecordsTab 위치 Badge 클릭 시 지도 모달 |
| ServiceWorkerRegistration.tsx | #170 | PWA Service Worker 등록/업데이트 관리 |
| Employee 하단 네비게이션 | #170 | 6개 아이콘 하단 바 |
| Admin 하단 네비 드롭다운 | #172 | 대시보드/인사관리(5)/운영(5)/시스템(2) 카테고리 |
| Platform 하단 네비 드롭다운 | #172 | 대시보드/운영(2)/지원(2)/시스템(2) 카테고리 |
| payroll-calc.ts | #174 | 통상시급/연장/야간/휴일 계산 유틸리티 |

## PR #169 Employee schedule 변경
- GPS 위치 컬럼 추가
- 지도 모달 연동 (위치 Badge 클릭)

## PR #170 PWA 정적 파일
- manifest.json, sw.js, offline.html, 앱 아이콘

## PR #174 포괄임금 관련
- SalaryHistory 모델 (Prisma)
- 직원 등록 폼에 기본급 필드 추가

## 외부 라이브러리 추가
- react-leaflet v4 (React 18 호환) — PR #169

## S28 페이지 추가 (2026-03-21)

### Admin
- /admin/insurance — 4대보험 관리 (3탭: 대시보드/요율/월별상세)
- /admin/contracts — 근로계약서 (2탭: 목록/작성)
- /admin/payroll 7탭 분할: 대시보드|임금설정|급여계산|규칙|마감|명세서|퇴직금+지원금

### Employee
- /employee/payslips — 급여명세서 (월별 상세 뷰)
- Employee 하단 네비에 "급여" 메뉴 추가

### 컴포넌트
- payroll-engine.ts (5가지 wageType 계산)
- tax-calc.ts (간이세액표 + 지방소득세)
- severance-calc.ts (퇴직금 계산)
- subsidy-matcher.ts (지원금 매칭)
- insurance-calc.ts (4대보험 계산)
