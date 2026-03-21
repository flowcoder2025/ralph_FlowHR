---
name: session-timeline
description: 전체 세션 타임라인 (2026-03-13 ~ 2026-03-22, S37 반영)
type: reference
---

# 세션 타임라인

| 세션 | 날짜 | 핵심 작업 |
|------|------|-----------|
| S01~S18 | 03-13 | Phase 1~17 완료 (78 WI) |
| S19~S23 | 03-13~14 | E2E + Ralph Loop v2 + 디버깅 |
| S24 | 03-16 | Phase 18~20 (WI-079~125) |
| S25 | 03-16~17 | PR #148~158 (UTC, GPS, 보안, UX) |
| S26 | 03-17 | PR #159~165 (다크모드, 복합기능, 접근제어, 테스트, 직급) |
| S27 | 03-17~20 | PR #166~174 (정정신청, 문서발송, GPS지도, PWA, 모바일UI, 포괄임금) |
| S29 | 03-21 | PR #185~198 (코워크 시스템 + knowledge 재설계 + 글로벌 통합 + hook 강제 + DocOps 강제 + discussions + 정리) |
| S30 | 03-21 | 코워크 첫 실전 테스트 3회 + DocOps 자율화 정책 + 전 에이전트 Opus 통일 + discussions 작성 정책 |

## S26 PR 이력 (18개)
| PR | 내용 |
|----|------|
| #148~149 | UTC 날짜 통일 + seed userId + gitignore |
| #150 | GPS 출퇴근 위치 검증 |
| #151 | 커스텀 리포트 + 결제 설정 |
| #152~154 | Employee 버그 + KST + Intl timezone |
| #155 | 하드코딩 전수 제거 + constants |
| #156 | 보안 강화 (rate limit, Zod, CSRF) |
| #157 | 종합 개선 (정정 승인, 계정 생성, 알림, 서명, CSV, Toast) |
| #158 | UX 마무리 (스켈레톤, 브레드크럼, 터치, alert) |
| #159 | 다크모드 + 폼 검증 + 결재 + 가이드 |
| #160 | Admin timezone 전수 |
| #161 | 복합기능 8건 (GPS 판정, 정정, 알림, 대시보드) |
| #162 | seed KST + API 접근 제어 (RBAC) |
| #163 | Platform 4페이지 + API 3건 |
| #164 | 부서 선택 + EARLY_LEAVE + 조퇴 Badge |
| #165 | 근태 KPI + 휴가 검증 + 승인 수정 + 직급 관리 |

## S27 PR 이력 (9개)
| PR | 내용 |
|----|------|
| #166 | 정정신청 키 불일치 수정 + 예외승인 인증 호환 |
| #167 | 문서발송 무한루프 해소 + Admin발송 fallback + timezone localTimeToUTC |
| #168 | GPS null 표시 수정 (undefined→null 체크) |
| #169 | GPS 지도 뷰어 (Leaflet) + 상태 판정 상수화 + Employee GPS 컬럼 |
| #170 | PWA (manifest, sw, offline) + Employee 모바일 반응형 (하단 네비) |
| #171 | Admin+Platform 모바일 반응형 (h1, 탭, 테이블 스크롤) |
| #172 | Admin+Platform 하단 네비 드롭다운 (햄버거 제거 → 카테고리 방식) |
| #173 | 모바일 하단 네비 로그아웃 버튼 (Employee/Admin/Platform) |
| #174 | 포괄임금 계산 (SalaryHistory 모델, payroll-calc, 3개 API) |

## Playwright 실테스트: 15건 Cross-Role 플로우 검증 완료

## S28 PR 이력 (03-20~21, PR #175~184)
| PR | WI | 내용 |
|----|-----|------|
| #175 | WI-151 | 직원 상세 드로어 SSOT 허브 재구현 |
| #176 | WI-152 | Employee 문서 + Platform 모니터링 SSOT 수정 |
| #177 | WI-153 | 4대보험 신고 및 관리 |
| #178 | WI-153-1 | 급여 계산에 4대보험 공제 연동 |
| #179 | WI-154 | 급여 시스템 DB 스키마 확장 |
| #180 | WI-155 | 급여 계산 엔진 + 세금 + 퇴직금 + 지원금 매칭 |
| #181 | WI-156 | 임금설정 + 급여계산 + 퇴직금 API 확장 |
| #182 | WI-157 | Admin 급여관리 UI 7탭 분할 |
| #183 | WI-158 | Employee 급여명세서 + 드로어 급여탭 확장 |
| #184 | WI-159 | 근로계약서 + 고용지원금 매칭 |

### S28 추가 작업
- Hook 검증 시스템 구축 (요구사항 보호 + 커밋 검증)
- Claude Code 체인지로그 RAG 생성 (글로벌)
- 코워크 검증 시스템 설계

## S29 PR 이력 (03-21, PR #185~198, 14개)
| PR | WI | 내용 |
|----|-----|------|
| #185 | WI-160 | 코워크 검증 시스템 구축 (Agent Teams + settings.json) |
| #186 | WI-160 | 코워크 hook 버그 4건 수정 + guardian 에이전트 정의 |
| #187 | WI-160 | 코워크 누락 항목 6건 해결 |
| #188 | WI-160 | delegate mode hook Windows 경로 호환 |
| #189 | WI-160 | plan approval hook + spawn 템플릿 업데이트 |
| #190 | WI-160 | knowledge 시스템 전면 재설계 (RAG 12개 → 7카테고리) |
| #191 | WI-160 | 리드 워크플로우 5단계 정의 |
| #192 | WI-160 | 글로벌 시스템 통합 재편 (CLAUDE.md 슬림화, auto memory 개편) |
| #193 | WI-160 | DocOps gap 3건 수정 (main 커밋 금지, stale 체크, 자체 점검) |
| #194 | WI-160 | main/master 브랜치 직접 커밋 차단 hook |
| #195 | WI-160 | 누락 항목 일괄 수정 (체크리스트, spawn 예시, Judge 기준, requirements 범위) |
| #196 | WI-160 | lead-workflow hook 강제 (src/ 팀 필수) + Stop hook 강화 |
| #197 | WI-160 | 정리 (구 RAG 삭제, 테스트 브랜치, 글로벌 MEMORY Lessons) |
| #198 | WI-160 | DocOps 자동 실행 강제 |

### S29 주요 성과
- 7개 시스템 통합 아키텍처 (Hook/코워크/CI/Rules/Auto memory/Knowledge/CLAUDE.md)
- Hook 8종: delegate mode, plan approval, TaskCompleted, TeammateIdle, 요구사항 보호, 커밋 검증(main 차단+팀 필수), Stop(knowledge stale), SessionStart/PostCompact(knowledge 주입)
- 에이전트 7개: Guardian, Verifier, Judge, Tester, DocOps, lead-workflow, spawn-template
- knowledge/ 체계: 7카테고리 15파일 + discussions/ (RAG 12개에서 마이그레이션)
- 글로벌 재편: CLAUDE.md 47줄, wi-global 강제 수단 명시, auto memory 역할 명확화
- lead-workflow 5단계 + 구체적 자체 점검 체크리스트
- lead-workflow hook 강제: src/ 커밋 시 팀 필수
- DocOps 자동 실행 강제 (PR #198)
- discussions/ 카테고리 추가 (대화 맥락 보존)

## S30 (03-21, 코워크 실전 테스트 + DocOps 자율화)

### 코워크 테스트 이력
| 테스트 | 팀원 동작 | 결과 |
|--------|----------|------|
| constants 추가 | Guardian→Implementer→Verifier | PASS (hook false positive으로 커밋 지연) |
| fail-flow 불완전 구현 검출 | Verifier FAIL→Implementer 수정→Verifier PASS | PASS |
| plan approval 테스트 | Implementer plan 제출→리드 승인→구현 | PASS |
| DocOps main 커밋 차단 | DocOps main commit 시도→hook 차단 확인 | PASS |
| Tester 브라우저 테스트 | 로그인+대시보드+메뉴 3건 | PASS |
| Judge 2차 검증 | fail-flow 코드 품질 검증 | PASS |

### 주요 변경
- DocOps 에이전트 자율화 (리드 의존 제거, session JSONL 직접 읽기)
- 전 에이전트 모델 Opus 통일
- discussions/ 작성 정책: session JSONL이 원천, 리드 요약에 의존하지 않음
- TaskCompleted hook build false positive 발견 (Next.js dynamic route 메시지를 실패로 오판)

## S31 (03-21, WI-161 hook 강화 — PR #205)

### 브랜치: fix/WI-161-fix-empty-team-bypass

### 주요 변경
- verify-on-commit.sh hook 강화 2건:
  1. **WI 번호 중복 차단 강화**: 임계값 10개 → 0개 (이미 머지된 WI 번호 재사용 즉시 차단), 경고(echo) → 차단(exit 2)
  2. **빈 팀 우회 방지**: 팀 config.json에서 Guardian/DocOps 필수 멤버 존재 확인, 없으면 커밋 차단
- CLAUDE.md 행동 가이드 추가 (개발 프로세스 + 행동 가이드라인 명시)
- Guardian이 WI-161 요구사항 검증 완료 (WI 번호 적절성 + 요구사항 커버 확인)

### 사용자 피드백
- WI 번호가 160으로 커밋되는 문제 지적 → WI 번호 분리 규칙 재강조
- hook 임계값 10개 설정에 강한 불만 → "설계할 때부터 구멍을 만들지 말 것"
- CLAUDE.md 내용 누락 여부 확인 요청 → 규칙 준수 강화
- "코워크 마무리가 기능 작업보다 먼저" → 범용적 논리 설계 필요
- "니가 규칙을 따를수밖에 없게 만드는게 최우선과제" → 기계적 강제 우선

## S32 (03-21, knowledge 동기화 — PR #206)

### 주요 변경
- DocOps: state.md ↔ issues/unresolved.md 동기화
  - WI-161 완료 반영 (PR #205 머지)
  - 미완료 항목 전수 반영 (SessionStart hook 검증, 다중 Implementer 병렬, SSOT 흐름 등)
  - CLAUDE.md 행동 가이드 추가 완료 반영

## S33 (03-21, WI-163 Stop hook 미커밋 파일 차단)

### 브랜치: fix/WI-163-fix-uncommitted-check

### 주요 변경
- **update-knowledge-on-stop.sh 강화**: .claude/ 하위 커밋 안 된 파일(modified + untracked) 감지 시 세션 종료 차단 (exit 2)
- **process.md 세션 시작 규칙 추가**: SessionStart hook 주입 내용 활용 규칙, "이어서 진행해" 시 묻지 않고 바로 시작
- **check-version.sh 신규**: Claude Code 버전 변경 감지 시 체인지로그 업데이트 알림
- **last-known-version.txt 신규**: 현재 Claude Code 버전 기록 (2.1.80)

## S34 (03-21~22, WI-164 knowledge 동기화 + WI-165 Guardian 크로스체킹)

### PR 이력
| PR | WI | 내용 |
|----|-----|------|
| #208 | WI-164 | S33 knowledge 동기화 (state.md + timeline + decisions + discussions + issues) |
| #209 | WI-165 | Guardian 파일 숙지 크로스체킹 Step 추가 |

### 주요 변경
- **Guardian 파일 숙지 크로스체킹**: guardian-agent.md에 Step 4 추가 — 리드가 작업 전 관련 파일을 실제로 읽었는지 검증
- **rules 강제주입 한계 발견**: rules 파일이 유저 메시지로 취급되어 작업 압박 시 무시될 수 있음
- **코워크 항상 활성화 방향 확정**: 사용자 확정 — 코워크를 선택이 아닌 필수로, 첫 커밋에서 차단

### 사용자 피드백
- rules 강제주입의 구조적 한계를 인식 → 코워크+hook으로 보완 필수
- 작업 전 파일 미숙지 상태에서 시작하는 문제 → Guardian 크로스체킹으로 해결
- "코워크가 항상 강제되어야하는거네" → 항상 활성화 전환 필요

## S35 (03-22, WI-167 세션 단위 팀 운영 + Tester gate 연동)

### 브랜치: feat/WI-167-feat-session-team-mode

### PR 이력
| PR | WI | 내용 |
|----|-----|------|
| #211 | WI-167 | 세션 단위 팀 운영 + Tester completion gate 연동 |

### 주요 변경
- **lead-workflow.md 세션 단위 팀 운영 전환**:
  - 기존: 태스크마다 팀 생성/해체
  - 변경: 세션 시작 시 팀 생성, Guardian + DocOps 즉시 spawn하여 상시 가동
  - 추가 팀원(Implementer/Verifier/Tester)은 필요 시 spawn
  - 세션 종료 시에만 팀 shutdown
- **tester-agent.md Tester 결과 파일 작성 Step 추가**:
  - Step 5 신규: `.claude/verification/{task_id}-test.md`에 TEST-PASS/TEST-FAIL 작성
  - TaskCompleted hook이 이 파일을 확인
- **verify-task-completion.sh Tester completion gate 연동**:
  - 1.5단계 추가: 팀에 tester가 있을 때 `{task_id}-test.md` 파일 확인
  - TEST-FAIL이면 태스크 완료 차단 (exit 2)
  - 파일 없으면 차단 (Tester가 작성해야 함)

### 사용자 피드백
- "니가 규칙을 따를수밖에 없게 만드는게 최우선과제" — 기계적 강제 우선
- "첫 커밋에서 차단시키면된다는 거잖아" — 코워크 항상 활성화 방향
- "작업전 파일을 다안읽고 시작한걸 검증하는 단계도있어야겠네" — Guardian 크로스체킹 (WI-165에서 구현)
- rules 강제주입이 유저 메시지 취급 → 코워크+hook으로 보완 필수 확정

## S36 (03-22, WI-169 delegate mode 확장 + WI-170 DocOps 커밋 타이밍)

### PR 이력
| PR | WI | 내용 |
|----|-----|------|
| #214 | WI-169 | 리드 전체 파일 수정 차단 + 역할별 권한 제한 (delegate mode 확장) |

### 주요 변경
- **delegate mode 전면 확장**: 리드가 팀 활성 시 모든 파일 수정 차단 (src/ 뿐만 아니라 requirements, settings, knowledge, CLAUDE.md 포함)
- **팀원 역할별 권한 제한** (enforce-delegate-mode.sh):
  - guardian, judge: Write/Edit 전부 차단 (읽기전용)
  - verifier, tester: .claude/verification/ 만 허용
  - docops: src/ 차단, .claude/ 및 기타 허용
  - implementer: 제한 없음
- **lead-workflow.md 변경**: requirements 파일 작성을 DocOps 팀원에게 지시하도록 변경
- **CLAUDE.md 행동 금지 항목 추가**: "리드의 직접 파일 수정"
- **DocOps 커밋 타이밍 규칙 추가** (WI-170): PR 머지 후 같은 브랜치에 추가 커밋 금지

### 사건: DocOps 위반 거부 사례
- 리드가 src/ 외 파일을 직접 수정하려 했으나 DocOps가 워크플로우 위반으로 거부
- 사용자 판단: "docops가 잘했네", "오히려 니가 위반인데도 불구하고 독옵스의 만류를 내게 보고하지않은게 잘못이지"
- 교훈: 팀원 거부 시 사용자에게 즉시 보고, 우회 금지

### 사건: DocOps 커밋 타이밍 사고
- PR #215가 머지되기 전에 DocOps가 같은 브랜치에서 knowledge 커밋 → PR squash 머지 시 knowledge 변경이 누락됨
- 원인: PR 머지 후 추가 커밋하면 squash merge에 포함되지 않음
- 대응: docops-agent.md에 커밋 타이밍 규칙 추가

### 사용자 피드백
- "src 외에도 팀생성없이 하면 금지인데 왜 커밋이된거지?" — delegate mode 구멍 발견
- "리드의 직접 커밋자체를 금지하고 요구사항 작성이나 설정변경하는건 독옵스에서 맡으면 되는거아닌가?" — 리드 완전 위임 방향
- "모든작업은 WI 할당해서 처리하는건데 이건 태스크로 잡혀야하는데?" — DocOps 작업도 WI+태스크 체계 준수

### WI-170 DocOps 커밋 타이밍 규칙 (PR #216)
- docops-agent.md: 커밋 타이밍 규칙 + requirements 쓰기 권한 추가
- knowledge/ S36 동기화

### WI-171 팀 멤버 전원 상시 필수 (PR #217)
- **lead-workflow.md Phase 3 전환**: Guardian+DocOps만 상시 → 전원(6명) 상시 spawn
- **verify-on-commit.sh 강화**: 필수 멤버 Guardian+DocOps → 전원(Guardian, DocOps, Implementer, Verifier, Tester, Judge)
- src/ 변경 여부와 무관하게 모든 커밋에 6명 전원 필수
- 누락 시 커밋 차단 + 누가 없는지 개별 안내

### WI-173 Phase 5 DocOps 커밋 후 enqueue 순서 강제
- **lead-workflow.md Phase 5 순서 변경**: DocOps knowledge 커밋+push → PR 생성 → enqueue
- enqueue 전에 DocOps 커밋이 반드시 push되어야 함 (머지큐 진입 후 브랜치 수정 불가)
- WI-172에서 발생한 머지큐 push 차단 사고 재발 방지

## S37 (03-22, WI-174/175/176)

### PR 이력
| PR | WI | 내용 |
|----|-----|------|
| #220 | WI-174 | DocOps PR 상태 자동 갱신 정책 (hook 원복) |
| #221 | WI-175 | 프로젝트 permissions Write/Edit allow 추가 |
| TBD | WI-176 | 커밋 구조 변경 + Guardian 상시 감시 강제 |

### WI-174 주요 변경 (PR #220, 머지 완료)
- **docops-agent.md PR 상태 자동 갱신 정책 추가**: 세션 시작 시 state.md/unresolved.md에서 "PR 오픈" 항목을 git log 기준으로 실제 상태 갱신
- **hook 스크립트 변경 시도 후 원복**: /dev/null→mktemp 시도했으나 build false positive 원인이 아닌 것으로 판명
- **WI-173 PR 오픈 → 완료 PR #219 갱신**: PR 상태 자동 갱신 정책의 첫 적용

### WI-175 주요 변경 (PR #221, 머지 완료)
- **.claude/settings.json permissions 추가**: Write/Edit 도구를 allow 목록에 추가 — 팀원이 파일 수정 시 매번 수동 승인 불필요

### WI-176 주요 변경 (PR 오픈)
- **lead-workflow.md 커밋 구조 변경**: Implementer는 코드 수정만, DocOps가 유일한 커밋 주체로 전체 변경사항을 한 번에 커밋+push+PR 생성
- **verify-teammate-idle.sh Guardian idle 차단**: Guardian은 상시 감시 역할이므로 idle 불가 (exit 2)
