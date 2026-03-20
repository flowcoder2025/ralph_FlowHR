---
name: auth-session-decisions
description: 인증/세션 관련 구현 히스토리와 이슈 (NextAuth, JWT, token, RBAC)
type: reference
---

# 인증/세션

## 구조
- NextAuth v4 + Prisma Adapter
- JWT 콜백: `token.id`, `token.role`, `token.tenantId`, `token.tenantSlug` 저장
- **token.employeeId는 존재하지 않음** → Employee API는 userId로 Employee 조회

## 핵심 이슈: token.employeeId 제거
- Employee API 5개 파일에 `token.employeeId` 참조 → 전부 401 에러
- 해결: userId 기반 조회로 전수 교체 (PR #137, #138)
- 관련 파일: employee/schedule, employee/requests, employee/profile, employee/documents

## 역할별 리다이렉트
- Admin → /admin
- Employee → /employee (홈 페이지 WI-122에서 생성)
- Platform Operator → /platform
- auth.setup callbackUrl도 역할별 설정 필요

## 세션 무효화 감지
- seed 후 tenantId 변경 시 기존 세션 무효
- 3개 레이아웃(Admin/Employee/Platform)에서 세션 유효성 체크 추가 (WI-121)
- 공통 API 래퍼 `api-client.ts`: 401 응답 시 자동 로그아웃

## 로그아웃
- 3개 레이아웃 Sidebar footer에 signOut 버튼 추가 (WI-116)
- `signOut({ callbackUrl: '/login' })`

## 데모 계정
| 역할 | 이메일 | 비밀번호 |
|------|--------|---------|
| Platform Operator | operator@flowhr.io | demo1234! |
| Admin | admin@acme.example.com | demo1234! |
| HR Manager | hr@acme.example.com | demo1234! |
| Manager | manager@acme.example.com | demo1234! |
| Employee | employee@acme.example.com | demo1234! |
