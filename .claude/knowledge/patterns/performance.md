---
name: performance-optimization
description: 성능 최적화 + 보안 강화 + PWA + 모바일 반응형 — 2026-03-20 업데이트
type: reference
---

# 성능 최적화

## 대시보드 병렬화 (WI-119)
- Before: 순차 쿼리 786ms → After: Promise.all 133ms (83% 개선)

## Vercel 리전 변경 (PR #145)
- Before: 미국(iad1) → After: 서울(icn1) — DB 왕복 200ms → 2-5ms

## 중복 쿼리 제거 (WI-132)
- Admin dashboard: document.count 중복 호출 제거

# 보안 강화 (WI-133)

| 항목 | Before | After |
|------|--------|-------|
| 평문 비밀번호 | dev fallback 존재 | 제거 (bcrypt only) |
| 로그인 brute force | 무제한 | 15분당 10회 rate limit |
| Platform API | 인증만 | + PLATFORM_OPERATOR role |
| 입력 검증 | 수동 체크 | Zod 스키마 |
| Cookie | 기본값 | SameSite=Lax + httpOnly + secure |
| 보안 헤더 | 없음 | nosniff + DENY + XSS + Referrer |

# UX 개선 (WI-134~135)

| 항목 | Before | After |
|------|--------|-------|
| 사용자 피드백 | alert() 10곳+ | Toast 전체 교체 |
| 로딩 상태 | "불러오는 중..." 텍스트 | Skeleton 로더 |
| 네비게이션 | 수동 텍스트 | Breadcrumb 컴포넌트 |
| 터치 타겟 | 28px | 40px (44px 준수) |
| 필수 필드 | 표시 없음 | Input/Select `*` 표시 |
| "준비 중" 버튼 | alert 7곳 | 실제 기능 3곳 + toast 4곳 |

# 렌더링 최적화 (PR #167)

## SendTab 무한 렌더링 해소
- Before: `useCallback` 의존성 문제로 무한 렌더링 루프 발생
- After: `useCallback` → `useRef`로 변경하여 안정적인 참조 유지
- 문서발송 탭에서 무한 API 호출 제거

# PWA (PR #170)

| 항목 | 내용 |
|------|------|
| manifest.json | 앱 이름, 아이콘, 테마 색상 정의 |
| sw.js | Service Worker — 오프라인 캐시 전략 |
| offline.html | 오프라인 fallback 페이지 |
| 앱 아이콘 | PWA 설치용 아이콘 세트 |
| ServiceWorkerRegistration.tsx | SW 등록/업데이트 관리 컴포넌트 |

# 모바일 반응형 (PR #170~173)

## Employee 모바일 (PR #170)
- 하단 네비게이션 바 (6개 아이콘)
- 테이블 가로 스크롤
- 터치 타겟 44px+

## Admin+Platform 모바일 (PR #171)
- h1 텍스트 반응형 크기
- 탭 가로 스크롤
- 테이블 가로 스크롤
- 로그인 페이지 모바일 최적화

## 하단 네비 드롭다운 (PR #172)
- 햄버거 메뉴 제거 → 하단 네비 + 카테고리 드롭다운 (위로 펼침)
- Admin: 대시보드 / 인사관리(5) / 운영(5) / 시스템(2)
- Platform: 대시보드 / 운영(2) / 지원(2) / 시스템(2)

## 로그아웃 버튼 (PR #173)
- Employee/Admin/Platform 3개 역할 모두 하단 네비에 로그아웃 추가
