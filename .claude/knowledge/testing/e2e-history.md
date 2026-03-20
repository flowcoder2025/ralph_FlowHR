---
name: e2e-testing-history
description: E2E 테스트 히스토리 — Playwright 설정, 실패 패턴, 해결책
type: reference
---

# E2E 테스트

## 현재 상태
- 31 tests passed (로컬)
- CI에서는 제거됨 (로컬 대화형 실행)
- 91 unit tests passed

## 구조
- Playwright + storageState (3역할: Admin, Employee, Operator)
- globalSetup: DB seed + 인증 캐싱
- POM 패턴 (Page Object Model)
- no-auth project: 미인증 리다이렉트 테스트 분리

## 해결된 이슈들

### 1. NEXTAUTH_URL 불일치
- `.env`에 `NEXTAUTH_URL=http://localhost:3000`인데 서버는 3001
- Playwright도 3001을 보는데 callbackUrl이 3000으로 설정됨
- 해결: dotenv 로드 + baseURL 통일

### 2. seed FK 에러
- globalSetup에서 cleanup→seed 순서 문제
- 해결: 트랜잭션으로 감싸거나 FK 순서 보장

### 3. cold start 실패
- auth.setup이 서버 미시작 상태에서 실행
- 해결: globalSetup에서 서버 워밍업 추가 (PR #135)

### 4. storageState 간섭
- 미인증 테스트에 인증 project의 storageState가 적용됨
- 해결: `no-auth` project로 분리

### 5. Employee callbackUrl
- `/employee`가 404 (페이지 없음)
- 해결: callbackUrl을 `/employee/schedule`로 변경 → 이후 WI-122에서 `/employee` 홈 생성

### 6. seed 평문 비밀번호
- bcrypt hash 대신 평문 저장 → 로그인 실패
- 해결: seed에서 bcrypt hash 사용

## 테스트 커버리지
- Admin: 대시보드, People, 근태, 휴가, 결재, 문서, 급여, 성과, 채용, 리포트, 설정
- Employee: 홈, 스케줄, 신청, 문서, 프로필
- Platform: 대시보드, 테넌트, 빌링
- Cross-Role: Employee 신청 → Admin 승인 → Employee 알림
- Permission: 3역할 접근 경계 + 미인증 리다이렉트
