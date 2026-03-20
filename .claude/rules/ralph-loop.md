# Ralph Loop 운영 규칙

## 실행
- 새 터미널에서 실행: `bash .ralph/scripts/launch-loop.sh`
- Claude Code 세션 안에서 직접 실행 금지 (claude -p 중첩 불가)
- 루프 시작 전 uncommitted changes 있으면 에러

## 반복 규칙
- 1회 반복 = 1개 WI만 처리
- fix_plan.md는 워커가 수정하지 않음 (외부 루프가 종료 시 일괄 동기화)
- ralph.sh 직접 생성/수정 금지 (템플릿에서 복사된 것만 사용)

## 구현 규칙
- 구현 전 반드시 기존 코드를 먼저 읽을 것
- 플레이스홀더, TODO, stub 코드 절대 금지
- 검증 순서: lint → build → test
- 검증 실패 시 최대 3회 재시도, 3회 실패 시 guardrails.md에 기록

## PR 머지
- `gh pr merge --auto --squash` 사용 금지
- 반드시 `bash .ralph/scripts/enqueue-pr.sh <PR번호>` 사용

## 상태 관리
- completed_wis.txt가 SSOT (수동 수정 금지)
- .ralph/ 디렉토리의 파일을 절대 삭제하지 않음
- guardrails.md 규칙 절대 위반하지 않음
