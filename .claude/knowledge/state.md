# 프로젝트 현재 상태

## 마지막 업데이트: 2026-03-22 (S37)

### 진행 현황
- PR #148~225 (78개 PR)
- S29~S30: 코워크 검증 시스템 완전 구축 (PR #185~204)
  - 7개 시스템 통합 아키텍처 확정 (Hook/코워크/CI/Rules/Auto memory/Knowledge/CLAUDE.md)
  - 코워크 실전 테스트 5회 (Guardian/Implementer/Verifier/Judge/Tester/DocOps 전원 확인)
  - DocOps 자율 정책 확립 (session JSONL 직접 읽기, 리드 의존 제거)
  - discussions/ 카테고리 추가 (대화 맥락 보존)
  - knowledge/ 재설계 완료 (RAG 12개 → 7카테고리)
  - 글로벌 시스템 통합 재편 (CLAUDE.md 슬림화, rules 통합)
- S31: WI-161 verify-on-commit.sh hook 강화 — 완료 (PR #205)
- S32: knowledge/ 동기화 (DocOps) — 완료 (PR #206)
- S33: WI-163 Stop hook 미커밋 파일 차단 + process.md 세션 규칙 — 완료 (PR #207)
- S33: WI-164 knowledge 동기화 — 완료 (PR #208)
- S34: WI-165 Guardian 파일 숙지 크로스체킹 Step 추가 — 완료 (PR #209)
- S34: WI-166 knowledge 동기화 — 완료 (PR #210)
- S35: WI-167 세션 단위 팀 운영 + Tester completion gate 연동 — 완료 (PR #211)
- S35: WI-167 knowledge 동기화 — 완료 (PR #212)
- S36: WI-169 리드 전체 파일 수정 차단 + 역할별 권한 제한 — 완료 (PR #214)
  - delegate mode 확장: 리드가 src/ 뿐만 아니라 모든 파일 수정 불가
  - 팀원 역할별 권한 제한: guardian/judge 읽기전용, verifier/tester verification만, docops src/ 차단, implementer 제한없음
  - lead-workflow.md: requirements 작성을 DocOps에게 위임
  - CLAUDE.md 행동 금지 항목에 "리드의 직접 파일 수정" 추가
- S36: WI-170 DocOps 커밋 타이밍 규칙 + knowledge 동기화 — 완료 (PR #216)
  - docops-agent.md Git 규칙 + requirements 쓰기 권한 추가
- S36: WI-171 팀 멤버 전원 상시 필수 — 완료 (PR #217)
  - lead-workflow.md Phase 3: Guardian+DocOps만 즉시 spawn → 전원(6명) 즉시 spawn
  - verify-on-commit.sh: Guardian+DocOps 필수 → 전원(Guardian, DocOps, Implementer, Verifier, Tester, Judge) 필수
  - src/ 변경 여부와 무관하게 모든 커밋에 6명 전원이 있어야 함
- S36: WI-173 Phase 5 DocOps 커밋 후 enqueue 순서 강제 — 완료 PR #219
  - lead-workflow.md Phase 5: DocOps 커밋+push → PR 생성 → enqueue 순서 명시
  - enqueue 전에 DocOps 커밋이 반드시 push되어야 함 (머지큐 진입 후 브랜치 수정 불가)
- S37: WI-174 DocOps PR 상태 자동 갱신 — 완료 (PR #220)
  - docops-agent.md: PR 상태 자동 갱신 정책 추가
  - hook 스크립트 변경 시도 후 원복
- S37: WI-175 프로젝트 permissions Write/Edit allow 추가 — 완료 (PR #221)
  - .claude/settings.json: permissions.allow에 Write/Edit 추가 (팀원 도구 승인 자동화)
- S37: WI-176 커밋 구조 변경 + Guardian 상시 감시 강제 — 완료 (PR #223)
  - lead-workflow.md: Implementer는 코드 수정만, 커밋은 DocOps가 전체 변경사항을 한 번에 처리
  - verify-teammate-idle.sh: Guardian idle 차단 (상시 감시 역할이므로 idle 불가)
- S37: WI-177 에이전트별 git user.name 설정 — 완료 (PR #224)
  - docops/spawn-template/tester/verifier 4개 에이전트에 역할별 git user.name 추가
- S37: WI-178 머지 브랜치 커밋 차단 hook — 완료 (PR #225)
  - verify-on-commit.sh: 머지된 PR 브랜치에서 추가 커밋 시 즉시 차단
- S37: WI-179 DocOps만 커밋 가능 hook — PR 오픈
  - verify-on-commit.sh: 팀 활성 시 DocOps 외 에이전트 커밋 차단

### 미완료 항목 (상세)

#### 높음
1. **end-to-end 전체 플로우 테스트** — 5단계 워크플로우를 실제 기능으로 처음부터 끝까지 실행
2. **SessionStart hook 검증** — 오토컴팩트/clear 양쪽에서 knowledge 주입 정상 동작 검증 필요
3. **WI-159 외부 API 연동** — 고용지원금 외부 API(고용24 등), hook에서 차단 확인됨
4. **코워크 항상 활성화 전환** — rules 강제주입이 유저 메시지로 취급되어 작업 압박 시 무시됨 → 코워크 항상 활성화로 첫 커밋에서 차단 필요

#### 중간
5. **TaskCompleted hook build false positive** — Next.js dynamic route 메시지 오탐 (미해결)
6. **다중 Implementer 병렬 테스트** — 파일 충돌 방지 미검증
7. **SSOT 흐름 실검증** — Admin→Employee 데이터 흐름

#### 낮음
8. console.error 정리 (프로덕션 배포 전)
9. 다른 프로젝트 코워크 주입 템플릿
10. mem 스킬 legacy 전환 반영

### 다음 작업 (우선순위: 시스템 → 기존 버그 → 신규 기능)

#### 1순위: 시스템/인프라 (도구 완성)
- 코워크 항상 활성화 전환 (rules 무시 방지 — 첫 커밋에서 차단)
- SessionStart hook 검증 (오토컴팩트+clear 양쪽 커버 확인)
- end-to-end 전체 플로우 테스트 (5단계 처음부터 끝까지)

#### 2순위: 기존 버그
- TaskCompleted hook build false positive 수정
- console.error 정리

#### 3순위: 신규 기능
- WI-159 외부 API 연동 (고용지원금)

### 핵심 원칙 (다음 세션 필독)
- 7개 시스템 전부 강제 유지 — 하나도 풀면 안 됨
- 코워크+훅 조합으로 해결 — 코워크만으로 해결 X
- DocOps는 매 작업마다 자동 실행 — 수동 knowledge/ 수정 금지
- 사용자가 묻기 전에 gap을 스스로 찾아서 보고
- 형식적 테스트 금지 — 실질적 동작 확인 필수
- discussions/ 파일 참조 — 이전 세션 논의 맥락 확인
- WI 번호 분리 — 다른 작업은 다른 번호 (hook으로 강제 차단)
- hook 설계 시 구멍 금지 — 임계값/조건을 느슨하게 두지 말 것 (사용자 강력 지적)
- 코워크 마무리 우선 — 기능 작업보다 코워크(인프라) 완성이 먼저
- rules 강제주입은 유저 메시지 취급 — 작업 압박 시 무시될 수 있으므로 코워크+hook으로 보완 필수
- 작업 전 파일 숙지 검증 — Guardian이 리드의 파일 읽기 여부를 크로스체킹
- 팀은 세션 단위 운영 — 태스크마다 생성/해체하지 않고 세션 내내 상시 가동, 전원(6명) 즉시 spawn
- Tester 결과 파일은 verification/{task_id}-test.md에 작성 — hook이 자동 확인
- 리드는 모든 파일 수정 불가 (delegate mode 확장) — 팀원에게 위임 필수
- 팀원 역할별 권한 제한 — guardian/judge 읽기전용, verifier/tester verification만, docops src/ 차단
- 팀원 워크플로우 위반 거부 시 사용자에게 즉시 보고 — 우회하거나 다른 팀원에게 재할당 금지
- DocOps 커밋 타이밍 — PR push 전에 커밋, 머지 후 같은 브랜치에 추가 커밋 금지
- DocOps PR 상태 자동 갱신 — 세션 시작 시 "PR 오픈" 항목을 git log 기준으로 실제 상태 갱신
- DocOps가 유일한 커밋 주체 — Implementer는 코드 수정만, 커밋+push+PR은 DocOps가 처리
- Guardian 상시 감시 — idle hook에서 즉시 차단, 세션 내내 리드 행동 감시
- 머지된 브랜치 커밋 차단 — PR 머지 후 같은 브랜치에 커밋하면 hook이 즉시 차단
