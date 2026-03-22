# 프로젝트 현재 상태

## 마지막 업데이트: 2026-03-22 (S38)

### 진행 현황
- PR #148~226 (79개 PR)
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
- S37: WI-179 DocOps만 커밋 가능 hook — 완료 (PR #226)
  - verify-on-commit.sh: 팀 활성 시 DocOps 외 에이전트 커밋 차단
- S38: WI-183 TaskCompleted hook build false positive 제거 — 완료
- S38: WI-184 보조금24 API 연동 — 완료 (gov24-client + sync API + 직원 기본정보 수집)
- S38: WI-190 조직도 ↔ 직원관리 양방향 CRUD — 완료
  - 조직도: 부서 클릭→직원 목록, 매니저 설정, 하위부서 생성
  - 직원관리: 부서→조직도 링크, 직책 라벨 수정
  - Guardian 데이터 흐름 추적 체크리스트 추가
- S38: WI-191 기본급 SSOT 트랜잭션 통합 — 완료
  - 기본급 저장 시 단일 트랜잭션으로 통합 (employees + wage_configs 동시 업데이트)
  - TeammateIdle hook에서 lint/build 블록 제거 (Node 24 호환 문제 대응, test만 유지)
  - verify-task-completion.sh build 스크립트 수정
- S38: WI-192 API 응답 필드명 일관성 통일 — 완료
  - 4개 API 엔드포인트 응답 형식을 {data: ...} 구조로 통일
  - leave/policies, payroll/payslips, payroll/rules, recruiting/applications
- S38: WI-193 PDF 다운로드 + 문서 뷰어 구현 — 완료
  - employee/documents: PDF 다운로드 + 인라인 뷰어
  - employee/payslips: PDF 다운로드 + 인라인 뷰어
  - employee/documents API: Content-Disposition 헤더 추가
- S38: WI-194 네비게이션 연결 — 완료
  - KPI 카드 클릭→상세 페이지 이동 (admin 대시보드)
  - 조직도 직원 클릭→직원관리 페이지 이동
  - 보험 탭 월별 상세 링크 추가

### 미완료 항목 (상세)

#### 높음
1. ~~**WI-181 코워크 자동 활성화**~~ — 사용자 제외 결정 (커밋 게이트로 충분)
2. ~~**WI-182 SessionStart hook 검증**~~ — S38 검증 완료 (스크립트 수동 실행으로 정상 동작 확인)
3. ~~**WI-183 TaskCompleted hook build false positive 수정**~~ — S38 완료 (lint/build/test 블록 제거)
4. ~~**WI-184 외부 API 연동 — 고용지원금**~~ — S38 완료 (보조금24 API 연동, gov24-client + sync API + UI 버튼)

#### 보류
5. **다중 Implementer 병렬 테스트** — 파일 충돌 방지 미검증 (보류)
6. **SSOT 흐름 실검증** — 보류 (S38 사용자 지적으로 부분 해결, 리드 선제 검증 실패)
7. **console.error 정리** — 보류 (프로덕션 배포 전)
8. **다른 프로젝트 코워크 주입 템플릿** — 보류
9. **mem 스킬 legacy 전환 반영** — 보류

### 다음 작업 (우선순위)

#### S38 완료
- ~~코워크 실전 테스트~~ — S38 e2e 전체 플로우 테스트 완료 (WI-184 + WI-190)
- ~~e2e 전체 플로우 테스트~~ — S38 완료 (5단계 워크플로우 실제 기능 PRD로 실행)

#### 보류 항목
- 다중 Implementer 병렬 테스트, SSOT 흐름 실검증, console.error 정리, 코워크 주입 템플릿, mem legacy 전환

#### 인프라 변경
- merge queue: SQUASH → MERGE 방식으로 변경

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
- 세션 합의 작업 우선 — 사용자가 세션에서 명시적으로 합의한 다음 작업은 자동 정렬보다 우선
