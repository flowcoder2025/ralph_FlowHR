# 리드 워크플로우

사용자가 작업을 요청하면 리드(오퍼레이터)는 반드시 이 플로우를 순서대로 밟는다.
단계를 건너뛰거나 축소하지 않는다.

## Phase 1: 요구사항 확정

1. 사용자의 요청을 분석하여 요구사항을 정리한다
2. `.claude/requirements/{작업명}.md` 파일로 저장한다
3. 파일 내용:
   - 요구사항 (번호 매긴 목록)
   - 사용자 결정사항 (대화에서 확인된 것)
   - 검증 기준 (어떻게 확인할 것인가)
4. **사용자에게 보여주고 승인을 받는다** — 승인 전 다음 단계 진행 금지

## Phase 2: 설계

1. 요구사항 기반으로 구현 설계를 작성한다
   - 변경/생성할 파일 목록
   - API 엔드포인트 설계
   - DB 스키마 변경 (있으면)
   - SSOT 데이터 흐름 (Admin → Employee)
2. `.claude/knowledge/decisions/` 에 설계 결정 기록
3. **사용자에게 설계를 보여주고 승인을 받는다** — 승인 전 다음 단계 진행 금지

## Phase 3: 팀 구성

1. 태스크 분해 (의존성 포함)
   - Guardian 태스크: 요구사항 vs 태스크 대조
   - Implementer 태스크(들): 구현 단위별
   - Verifier 태스크(들): 구현 태스크에 의존
   - Tester 태스크: 전체 구현 완료 후
   - DocOps 태스크: 모든 작업 완료 후
2. 팀 생성 (TeamCreate)
3. `.claude/agents/spawn-template.md`에 따라 팀원 spawn
   - 각 팀원에게 역할별 knowledge 슬라이스 전달
   - 요구사항 파일 경로 전달
   - Implementer는 plan approval 포함

## Phase 4: 실행 + 감시

1. Guardian 결과 확인 — 누락 있으면 태스크 수정
2. Implementer plan 승인 — `.claude/plans/{task_id}.md`에 APPROVED
3. 구현 진행 감시 — 필요 시 팀원에게 메시지
4. Verifier 결과 확인 — FAIL이면 Implementer에게 수정 지시
5. Tester 결과 확인 — 실패하면 Implementer에게 수정 지시
6. 전체 PASS까지 반복

## Phase 5: 마무리

1. DocOps 팀원에게 knowledge/ 업데이트 지시
2. 테스트 파일/verification/plans 정리
3. 커밋 + PR 생성 + enqueue
4. **사용자에게 완료 보고**:
   - 구현된 기능 요약
   - PR 번호 + 링크
   - 검증 결과 (Guardian/Verifier/Tester)
   - 다음 작업 제안
5. 팀 shutdown + cleanup
