---
name: infra-decisions
description: 인프라/환경 관련 의사결정과 이슈 (Supabase, Vercel, CI, merge queue)
type: reference
---

# 인프라/환경

## DB: Supabase Seoul (ap-northeast-2)
- Prisma directUrl + pgbouncer (session pooler 6543)
- `pgbouncer=true` 파라미터 필수 (누락 시 프로덕션 로그인 실패)
- seed 후 tenantId 변경 → 브라우저 쿠키 삭제 + 재로그인 필요
- DEALLOCATE ALL 오버헤드: 매 쿼리마다 실행됨 (pgbouncer 특성)
- 로컬→Supabase 서울 latency: 쿼리당 30~50ms

## 배포: Vercel Seoul (icn1)
- vercel.json `{ "regions": ["icn1"] }` 추가 (PR #145에서 머지)
- Before: 서버리스 함수 미국(iad1)에서 실행 → DB 왕복 ~200ms
- After: 서울→서울 = ~2-5ms
- Production URL: https://wi-test-lake.vercel.app
- Free plan rate limit: 하루 100회 배포

## CI/CD: GitHub Actions
- Workflow: lint → build → test (ci.yml)
- merge queue ruleset 활성 (SQUASH method)
- `min_entries_to_merge_wait_minutes: 1`, `check_response_timeout_minutes: 10`
- PR 머지: 반드시 `bash .ralph/scripts/enqueue-pr.sh <PR번호>` 사용
- `gh pr merge --auto --squash` 사용 금지 (autoMergeRequest: null로 남음)
- 브랜치 삭제: GitHub Actions 자동 (`delete_branch_on_merge: true`)

## Secrets (GitHub + Vercel 모두 등록)
- DATABASE_URL, DIRECT_URL, NEXTAUTH_SECRET, NEXTAUTH_URL

## 주요 이슈 이력
- force push 후 merge queue에서 빠짐 → 재 enqueue 필요
- enqueue-pr.sh fallback이 `--auto --squash` 실행하는 버그 → PR #146에서 스크립트 교체
- Vercel env vars에 `echo` 사용하면 trailing newline 포함 → `printf` 사용
