# 개발 프로세스

## 세션 시작 시
- SessionStart hook이 knowledge/state.md + discussions/ + issues/를 자동 주입한다
- **주입된 내용을 무시하고 파일을 다시 읽으러 가지 않는다**
- "이어서 진행해" 요청 시:
  1. 주입된 핵심 원칙을 먼저 확인
  2. 다음 작업 1순위부터 **묻지 않고 바로 시작**
  3. discussions/를 참조하여 이전 논의 맥락 반영

## 리드 워크플로우 (필수)
사용자가 작업을 요청하면 `.claude/agents/lead-workflow.md`의 5단계를 반드시 순서대로 밟는다:
1. 요구사항 확정 → requirements 저장 → **사용자 승인**
2. 설계 → decisions 기록 → **사용자 승인**
3. 팀 구성 → 태스크 분해 → spawn
4. 실행 + 감시 (Guardian/Verifier/Tester 결과 확인)
5. 마무리 → DocOps → PR → **완료 보고**

**단계를 건너뛰거나 축소하지 않는다. 승인 단계를 생략하지 않는다.**

## 코워크 모드 (팀 활성 시)
팀이 활성화되면 다음이 hook으로 자동 강제됩니다:
- Delegate mode: 리드는 src/ 직접 수정 불가
- Plan approval: 구현 팀원은 계획 승인 전 src/ 수정 불가
- TaskCompleted: 검증 팀원 PASS 없이 태스크 완료 불가
- TeammateIdle: lint/build/test 미통과 시 idle 불가
- 요구사항 보호: .claude/requirements/ 수정 불가
- 커밋 검증: 회피 표현, 껍데기 패턴, SSOT 미연결 차단

## 단독 모드 (팀 없을 때)
1. 브랜치 먼저 생성 후 작업 (예외 없음)
2. 커밋 전 `git status`로 빠진 파일 확인
3. `npm run lint && npm run build && npm test` 통과 후 push
4. `gh pr create` → `bash .ralph/scripts/enqueue-pr.sh <PR번호>`
5. PR 머지 확인 → `git checkout main && git pull` → 다음 브랜치

## 커밋 형식
- `WI-NNN-[type] 한글 작업명` (CI check-commits로 강제)
- 허용 타입: feat, fix, docs, style, refactor, test, chore, perf, ci, revert

## 브랜치 형식
- feat: `feature/WI-NNN-feat-작업명-kebab`
- fix: `fix/WI-NNN-fix-작업명-kebab`
- chore/docs/refactor 등 동일 패턴

## Knowledge 시스템
- 작업 시 `.claude/knowledge/index.md`의 주제-파일 매핑에 따라 관련 knowledge 로드
- 작업 중 변경사항은 DocOps 에이전트가 자동 업데이트
