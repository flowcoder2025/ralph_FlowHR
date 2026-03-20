---
name: key-decisions
description: 프로젝트 주요 의사결정 로그 — 2026-03-21 업데이트
type: reference
---

# 주요 의사결정 로그

## 아키텍처 결정 (이전 세션)
- API 응답 `{data}` 래핑 표준화 (WI-117, WI-138)
- token.employeeId 폐기 → userId 기반 (WI-116)
- UTC 날짜 통일 + Intl.DateTimeFormat timezone (WI-126, WI-131)
- GPS 출퇴근 지오펜스 (WI-127)
- 하드코딩 제거 → constants.ts (WI-132)
- 보안 강화: rate limit, Zod, CSRF, 보안 헤더 (WI-133)
- 직원 등록 → User 자동 생성 (WI-134)

## 현재 세션 결정

### 복합기능 전수 수정 (WI-138)
- 최소 근무시간 < 30분 → HALF_DAY
- GPS 판정값 저장 (IN_OFFICE/OUT_OF_OFFICE/NO_GPS)
- 정정 승인 시 checkIn/Out 실제 반영
- 승인/반려/발송 시 Notification 자동 생성
- 대시보드 응답 {data} 래핑

### API 접근 제어 (WI-139)
- ROUTE_ROLE_MAP에 API 20개 prefix 추가
- Employee → Admin API 403 차단
- 미들웨어에서 API 거부 시 JSON 403 반환 (redirect 대신)
- prefix 순서: /api/employees > /api/employee (충돌 방지)

### seed 시간 수정 (WI-139)
- KST→UTC 정확 변환 (-9h)
- KST 08:55 → UTC 23:55 (전날)

### Platform 미구현 페이지 (WI-140)
- support, monitoring, audit, settings 4개 페이지 신규
- support/audit API 신규
- employee/documents API 신규

### Playwright 실테스트 발견 (WI-141)
- 직원 등록 폼에 부서 선택 드롭다운 추가
- EARLY_LEAVE → "early_leave" 매핑 + 조퇴 Badge
- **직급 관리 UI 미구현** (신규 발견)

## 교훈
- 테스트는 페이지 로드가 아니라 **실제 CRUD 데이터 흐름**을 확인해야 함
- seed 데이터로 테스트하면 실제 동작을 검증 못함
- DB 초기화 후 직접 데이터 생성하며 테스트해야 진짜 문제가 드러남
- Playwright MCP로 직접 브라우저 조작이 가장 정확한 테스트

---

## PR #166~174 의사결정 (2026-03-17~20)

### 정정신청 키 호환 (PR #166)
- correction API에서 `targetDate`/`date` 둘 다 수용 → 프론트-백 키 불일치 해소
- exceptions PATCH에서 `employeeNumber` 체크 제거 → Admin 역할 호환

### 무한 렌더링 해결 전략 (PR #167)
- SendTab의 `useCallback` 의존성 루프 → `useRef`로 교체 (안정적 참조)
- Admin이 Employee 없을 때 문서발송 → fallback 처리 (에러 대신 기본값)
- timezone 변환: `localTimeToUTC` 함수 (Intl.DateTimeFormat 기반 KST→UTC)

### GPS null 방어 (PR #168)
- `!== undefined` → `!= null` (null과 undefined 동시 처리)
- `"null"` 문자열 방어 로직 추가

### GPS 지도 뷰어 도입 (PR #169)
- Leaflet + OpenStreetMap 채택 (무료, 별도 API 키 불필요)
- react-leaflet v4 (React 18 호환)
- 상태 판정 상수화: ABSENT_THRESHOLD(30분), HALF_DAY_UPPER(4시간), LATE_THRESHOLD(30분 유예)
- Employee schedule에 GPS 위치 컬럼 + 지도 모달 추가

### PWA 도입 (PR #170)
- manifest.json + sw.js + offline.html → 앱 설치 가능
- ServiceWorkerRegistration.tsx로 SW 라이프사이클 관리
- 오프라인 지원 (캐시 전략)

### 모바일 네비게이션 전략 (PR #170~173)
- Employee: 하단 네비게이션 바 6개 아이콘
- 햄버거 메뉴 제거 → 하단 네비 + 카테고리 드롭다운 (위로 펼침) 방식 채택
- Admin 카테고리: 대시보드 / 인사관리(5) / 운영(5) / 시스템(2)
- Platform 카테고리: 대시보드 / 운영(2) / 지원(2) / 시스템(2)
- 3개 역할 모두 하단 네비에 로그아웃 버튼 추가

### 포괄임금 모델 (PR #174)
- SalaryHistory 모델 신규 (Prisma)
- payroll-calc.ts: 통상시급 = 기본급 / 209시간, 연장 1.5배, 야간 0.5배, 휴일 1.5배
- 3개 API 신규: salary-history, calculate, wage-detail
- 직원 등록 폼에 기본급 필드 추가

## S28 의사결정 (2026-03-20~21)

| 결정 | 내용 | 사유 |
|------|------|------|
| SalaryHistory 별도 모델 | Employee에 baseSalary 안 넣고 이력 추적 | 급여 변동 이력 관리 |
| 5가지 임금체계 동시 지원 | COMPREHENSIVE/STANDARD/HOURLY/DAILY/ANNUAL | 범용 급여 시스템 |
| 소득세+지방소득세 포함 | 간이세액표 7구간 + 10% | 급여명세서 교부 요건 |
| 비과세 수당 분리 | 식대/교통비 20만 한도 | 과세분에만 세금+보험 적용 |
| 직원 상세 드로어 SSOT | 4탭(기본정보/근태/휴가/급여) 인라인 편집 | 허브 역할 |
| Hook 검증 시스템 | PreToolUse command hook (요구사항 보호 + 커밋 검증) | 속도>충실함 패턴 방지 |
| 코워크 검증 구조 | 리드(조율)+구현+검증+테스트 4팀원 | AI 판단 기반 검증 |
| Claude Code 체인지로그 RAG | 글로벌 + SessionStart 버전 체크 | 업데이트 추적 |

## S29 의사결정 (2026-03-21)

| 결정 | 내용 | 사유 |
|------|------|------|
| 코워크 6+1 에이전트 체계 | Guardian/Verifier/Judge/Tester/DocOps + spawn-template | 역할 분리로 검증 품질 향상 |
| Hook 6종 강제 실행 | PreToolUse(3), TaskCompleted, TeammateIdle, Stop | 자동 품질 게이트 (수동 의존 제거) |
| delegate mode hook | 리드가 직접 구현하지 않고 팀원에게 위임 강제 | 역할 분리 원칙 준수 |
| plan approval hook | 구현 전 리드 승인 필수 | 설계→구현 분리, 무검토 구현 방지 |
| knowledge/ 재설계 | RAG 12파일 → 7카테고리 15파일 | 주제별 분류로 로드 효율화 + 중복 제거 |
| CLAUDE.md 슬림화 | 규칙을 rules/ + hooks로 이관, CLAUDE.md는 프로젝트 정보만 | 컨텍스트 소비 최소화 |
| auto memory 인덱스 개편 | RAG 참조를 knowledge/ 기반으로 재매핑 | 이중 관리 제거 |
| 리드 워크플로우 5단계 | 요구사항분석→팀원배정→진행관리→결과검증→보고 | 코워크 실행 표준화 |
| Stop hook으로 knowledge 동기화 | 3+ 소스파일 변경 시 DocOps 제안 | 문서 갱신 누락 방지 |
| Windows 경로 호환 | delegate mode hook에서 `\` → `/` 변환 | Git Bash 환경 호환 |
