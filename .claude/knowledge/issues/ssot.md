---
name: ssot-data-issues
description: SSOT 데이터 정합성 이슈 — KST/UTC, tenantId, GPS null, 정정 키, 상태 판정 (7건 해결됨)
type: reference
---

# SSOT / 데이터 정합성 이슈

## 이슈 1: Employee Schedule 데이터 0건 (해결됨 — PR #148)

### 근본 원인
1. `new Date(y, m, d)` = 로컬 타임존 자정 → Vercel(UTC)과 로컬(KST)에서 9시간 차이
2. seed의 출결도 로컬 타임존으로 생성 → API 조회 범위와 불일치
3. 8명 중 4명만 userId 연결 → Employee API에서 404

### 해결
- `src/lib/date-utils.ts` 생성: UTC 기반 날짜 유틸리티
- 14개 API 파일의 `new Date(); setHours(0,0,0,0)` → `utcToday()` 패턴으로 통일
- seed.ts: 출결 데이터 생성도 `Date.UTC()` + `setUTCHours()` 사용
- seed.ts: 8명 직원 전원 userId 할당 (기존 4명 → 8명)

---

## 이슈 2: SSOT Employee 이력 승인 상태 (해결됨 — PR #148)

### 근본 원인
- 이슈 1과 동일 (UTC 날짜 불일치)
- Admin/Employee 간 WHERE 조건 차이는 설계상 정상 (스코프 차이)

---

## 이슈 3: 대시보드 KPI 정합성 (해결됨 — PR #148)

### 근본 원인
- "승인필요" vs "결재대기" = 다른 테이블/조건에서 조회 (설계상 정상, 버그 아님)
- UTC 통일로 날짜 기반 KPI 수치 정확도 개선
- document.count 중복 쿼리 제거

---

## 이슈 4: tenantId 불일치 (해결됨 — WI-121)

- seed cleanup→재생성 시 tenant ID 변경
- 로그아웃 → 재로그인으로 해결
- WI-121: 세션 무효화 자동 감지 추가

---

## 이슈 5: 정정신청 키 불일치 (해결됨 — PR #166)

### 근본 원인
- correction API가 `targetDate` 키만 수용하지만 프론트에서 `date`로 전송하는 경우 존재
- exceptions PATCH에서 `employeeNumber` 체크가 Admin 호환되지 않음

### 해결
- correction API: `targetDate`/`date` 둘 다 수용하도록 수정
- exceptions PATCH: `employeeNumber` 체크 제거 (Admin 호환)

---

## 이슈 6: GPS null 표시 (해결됨 — PR #168)

### 근본 원인
- settings/company API에서 `!== undefined` 비교 사용 → `null` 값이 통과
- CompanyTab에서 `"null"` 문자열이 그대로 표시

### 해결
- settings/company API: `!== undefined` → `!= null` (null과 undefined 모두 처리)
- CompanyTab: `"null"` 문자열 방어 로직 추가

---

## 이슈 7: 상태 판정 기준 미정의 (해결됨 — PR #169)

### 근본 원인
- 출퇴근 상태 판정(결근/반차/조퇴/지각)에 명확한 기준이 없었음

### 해결
- 상태 판정 상수 정의: ABSENT_THRESHOLD(0~30분=결근), HALF_DAY_UPPER(30분~4시간=반차), 4시간~=조퇴
- LATE_THRESHOLD: 지각 30분 유예
- `constants.ts`에 상수 추가

## S28 SSOT 이슈 (2026-03-21)

| 이슈 | 해결 |
|------|------|
| Employee 문서 하드코딩 (PENDING_DOCS/ARCHIVED_DOCS) | PR #176 — API 연동으로 교체 |
| Platform 모니터링 가짜 메트릭 (generateMetrics) | PR #176 — DB 기반 API 생성 |
| 급여 계산 deductions: 0 하드코딩 | PR #178 — insurance-calc 연동 |
| 직원 상세 드로어 껍데기 | PR #175 — 4탭 인라인 편집 SSOT 허브 |
| 보험료 비과세 미분리 | PR #181 — 과세분에만 세금+보험 적용 |
