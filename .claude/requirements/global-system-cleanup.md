# 글로벌 시스템 통합 재편 요구사항

## 배경
기존 8층 시스템(RAG, MEMORY, daily log, specs, rag-context, session JSONL, mem 스킬, auto memory)을
7개 시스템의 통합 아키텍처로 재편한다.

모든 시스템은 강제 역할을 유지한다. 강제를 풀지 않는다.
중복만 제거하고, 각 시스템의 역할 경계를 명확히 한다.
DocOps 에이전트(코워크 팀원)가 시스템 간 동기화를 자동 담당한다.

## 7개 시스템 역할 정의

| 시스템 | 강제하는 것 | 고유 역할 |
|--------|-----------|----------|
| Hook | 결과물 게이트 | 기계적 강제 (차단/허용) |
| 코워크 | 구조적 분리 + DocOps 동기화 | 역할 분리 + 지속 가능성 |
| CI | 빌드/테스트/커밋 형식 | 배포 게이트 |
| Rules | 프로세스 순서, 코드 아키텍처 | 절차 강제 |
| Auto memory | 사고 방식, 행동 패턴 | 인지 강제 |
| Knowledge | 맥락 기반 판단 | 정보 강제 |
| CLAUDE.md | 시스템 전체 구조 인지 | 인식 강제 |

## 요구사항

### 1. 글로벌 CLAUDE.md 재편
- 메모리 시스템 v3 → knowledge/ 시스템 안내로 전환 (조건부: "코워크 시스템이 설치된 프로젝트에서는")
- 커밋 규칙 → CI 참조로 전환 (wi-global.md에 원천 유지)
- ComfyUI 실험 규칙 → 해당 프로젝트 전용으로 이동
- 다른 프로젝트에도 코워크 시스템 주입 예정 → 글로벌 안내는 범용적으로 작성
- 코워크 시스템 + 7개 시스템 구조 안내 추가
- 역할: "이 시스템이 어떻게 구성되어 있는지" 인식 강제

### 2. 글로벌 rules 통합 재편
- wi-global.md:
  - CI로 강제되는 항목 → "CI가 강제함" 명시 (규칙 자체는 유지, 중복 설명 제거)
  - hook으로 강제되는 항목 → "hook이 강제함" 명시
  - 코워크에서 담당하는 항목 → "코워크가 강제함" 명시
  - wi-global.md 고유 역할: 프로젝트 공통 규칙의 원천 + 강제 수단 참조
- wi-ralph-loop.md → 프로젝트 rules/ralph-loop.md로 통합 이관
- wi-utf8.md: 유지 (글로벌 공통)

### 3. auto memory 역할 명확화
- 모든 feedback 강제 유지 (제거/축소 없음)
- 역할 명확화: "hook이 결과를 잡지만, auto memory가 사고 방식을 교정"
  - feedback_speed_over_faithfulness: 유지 (인지 강제)
  - feedback_implementation_principle: 유지 (인지 강제)
  - feedback_merge_queue: 유지 (행동 강제)
  - feedback_branch_first: 유지 (행동 강제)
  - feedback_new_terminal: 유지 (행동 강제)
- project_e2e_status → knowledge/state.md로 역할 이관 (유일한 중복 제거)
- MEMORY.md 인덱스 → knowledge/ 체계 반영으로 업데이트

### 4. mem 스킬 → DocOps 자동 전환
- mem:save/load/resume/note 스킬은 수동 관리 → DocOps 에이전트가 자동 담당
- 코워크 모드: DocOps 팀원이 태스크 완료/세션 종료 시 자동 업데이트
- 단독 모드: Stop hook이 knowledge/ 업데이트 담당
- mem 스킬은 legacy로 유지하되, 코워크 환경에서는 DocOps가 우선

### 5. 글로벌 Lessons Learned 통합
- 글로벌 MEMORY.md의 "Lessons Learned" 30개+ → knowledge/lessons/에 통합
- 프로젝트 공통 교훈은 knowledge/lessons/global.md로 관리
- 프로젝트별 교훈은 knowledge/lessons/{주제}.md로 관리
- auto memory의 글로벌 교훈과 중복되지 않도록 역할 분리:
  - auto memory: 사고 방식 강제 (행동 규칙)
  - knowledge/lessons/: 구체적 기술 교훈 (참조 지식)

### 6. 세션 경계 맥락 복원
- **새 세션 시작**: SessionStart hook → knowledge/state.md를 systemMessage로 주입
  - 현재 상태 + 다음 작업이 자동으로 컨텍스트에 들어옴
  - mem:load 수동 실행 불필요
- **오토컴팩트**: PostCompact hook → knowledge/state.md를 additionalContext로 주입
  - 같은 세션 내 컨텍스트 압축 시 맥락 자동 복원
  - session JSONL 파싱 불필요 (knowledge/가 최신이면)
- **session JSONL**: knowledge/state.md가 최신이면 파싱 불필요
  - state.md가 stale일 경우의 fallback으로 JSONL 파싱 유지 (legacy)

### 7. 단독 모드 knowledge/ 동기화
- 코워크에서는 DocOps 팀원이 knowledge/ 업데이트 담당
- 단독 모드에서는 DocOps가 없음 → Stop hook으로 knowledge/ 업데이트 강제
- Stop hook: 세션 종료 시 변경사항을 감지하고 knowledge/ 반영 여부 확인
- 코워크/단독 어느 모드에서든 knowledge/가 최신 상태 유지

## 검증 기준
- 7개 시스템의 역할이 중복 없이 명확한가
- 각 시스템의 강제가 유지되는가 (하나도 풀리지 않았는가)
- 글로벌 CLAUDE.md가 시스템 구조를 정확하게 안내하는가
- wi-global.md가 강제 수단(CI/hook/코워크)과 명확히 연결되는가
- DocOps 에이전트가 시스템 간 동기화를 자동 담당하는 구조인가
- 정리 후에도 다음 세션에서 맥락 복원이 정상 동작하는가
