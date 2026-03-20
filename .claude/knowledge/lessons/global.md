# 글로벌 교훈 (프로젝트 공통)

## 개발 프로세스
- 새 파일 생성 후 다른 파일에서 import 시, 반드시 함께 커밋 (Vercel 빌드 실패 방지)
- Vercel Hobby 플랜은 cron 하루 1회 제한
- Windows Prisma DLL lock 시 `npx next build`로 우회 가능
- 긴급 수정이라도 개발 프로세스 예외 없음 (브랜치→CI→PR→머지)

## 인증/외부 서비스
- NextAuth v5 JWT는 JWE(암호화)라 직접 디코딩 어려움 → jose 별도 토큰 발급
- Supabase direct URL이 IPv6만 반환 → session pooler URL(:5432) 사용
- Meta OAuth scope는 앱에 등록된 권한과 정확히 일치해야 함

## 에이전트/자동화
- 멀티에이전트 팀 구조 정의 후 실제 작업 시 페르소나 안 읽는 실수 → 강제 체크리스트 필수
- 추측성 답변/작업 절대 금지 — 확인 후 사실만 전달
- 기능 구현 후 반드시 테스트 3단계 (단위 테스트 → npm test → 페이지 응답)

## Playwright/E2E
- Playwright 병렬 실행 + 공유 인증 유저 → workers: 1 + global-setup/teardown
- Supabase SSR Server Action 내 supabase.auth.getUser()는 Playwright에서 null 반환

## 배포/인프라
- Vercel CLI 프로젝트 링크: 디렉토리명 대문자면 --project=소문자이름 명시
- Vercel env vars에 \n 주입 주의 → printf 사용 필수
- docker-compose v1 (OCI): docker compose v2 안 됨
- Trigger.dev: Prisma binaryTargets + lazy init + SDK/CLI 메이저 버전 일치
