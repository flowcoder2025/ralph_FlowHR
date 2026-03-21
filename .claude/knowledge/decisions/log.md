---
name: key-decisions
description: 프로젝트 주요 의사결정 로그 — 2026-03-22 S37 업데이트
type: reference
---

# 주요 의사결정 로그

## 아키텍처 결정 (이전 세션)
- API 응답 `{data}` 래핑 표준화 (WI-117, WI-138)
- token.employeeId 폐기 → userId 기반 (WI-116)
- UTC 날짜 통일 + Intl.DateTimeFormat timezone (WI-126, WI-131)
- GPS 출퇴근 지오펜스 (WI-127)
- 하드코딩 제거 → constants.ts (WI-132)
- 보안 강화: rate limit, Zod, CSRF, 보안 헤더 (WI-133)
- 직원 등록 → User 자동 생성 (WI-134)

## 현재 세션 결정

### 복합기능 전수 수정 (WI-138)
- 최소 근무시간 < 30분 → HALF_DAY
- GPS 판정값 저장 (IN_OFFICE/OUT_OF_OFFICE/NO_GPS)
- 정정 승인 시 checkIn/Out 실제 반영
- 승인/반려/발송 시 Notification 자동 생성
- 대시보드 응답 {data} 래핑

### API 접근 제어 (WI-139)
- ROUTE_ROLE_MAP에 API 20개 prefix 추가
- Employee → Admin API 403 차단
- 미들웨어에서 API 거부 시 JSON 403 반환 (redirect 대신)
- prefix 순서: /api/employees > /api/employee (충돌 방지)

### seed 시간 수정 (WI-139)
- KST→UTC 정확 변환 (-9h)
- KST 08:55 → UTC 23:55 (전날)

### Platform 미구현 페이지 (WI-140)
- support, monitoring, audit, settings 4개 페이지 신규
- support/audit API 신규
- employee/documents API 신규

### Playwright 실테스트 발견 (WI-141)
- 직원 등록 폼에 부서 선택 드롭다운 추가
- EARLY_LEAVE → "early_leave" 매핑 + 조퇴 Badge
- **직급 관리 UI 미구현** (신규 발견)

## 교훈
- 테스트는 페이지 로드가 아니라 **실제 CRUD 데이터 흐름**을 확인해야 함
- seed 데이터로 테스트하면 실제 동작을 검증 못함
- DB 초기화 후 직접 데이터 생성하며 테스트해야 진짜 문제가 드러남
- Playwright MCP로 직접 브라우저 조작이 가장 정확한 테스트

---

## PR #166~174 의사결정 (2026-03-17~20)

### 정정신청 키 호환 (PR #166)
- correction API에서 `targetDate`/`date` 둘 다 수용 → 프론트-백 키 불일치 해소
- exceptions PATCH에서 `employeeNumber` 체크 제거 → Admin 역할 호환

### 무한 렌더링 해결 전략 (PR #167)
- SendTab의 `useCallback` 의존성 루프 → `useRef`로 교체 (안정적 참조)
- Admin이 Employee 없을 때 문서발송 → fallback 처리 (에러 대신 기본값)
- timezone 변환: `localTimeToUTC` 함수 (Intl.DateTimeFormat 기반 KST→UTC)

### GPS null 방어 (PR #168)
- `!== undefined` → `!= null` (null과 undefined 동시 처리)
- `"null"` 문자열 방어 로직 추가

### GPS 지도 뷰어 도입 (PR #169)
- Leaflet + OpenStreetMap 채택 (무료, 별도 API 키 불필요)
- react-leaflet v4 (React 18 호환)
- 상태 판정 상수화: ABSENT_THRESHOLD(30분), HALF_DAY_UPPER(4시간), LATE_THRESHOLD(30분 유예)
- Employee schedule에 GPS 위치 컬럼 + 지도 모달 추가

### PWA 도입 (PR #170)
- manifest.json + sw.js + offline.html → 앱 설치 가능
- ServiceWorkerRegistration.tsx로 SW 라이프사이클 관리
- 오프라인 지원 (캐시 전략)

### 모바일 네비게이션 전략 (PR #170~173)
- Employee: 하단 네비게이션 바 6개 아이콘
- 햄버거 메뉴 제거 → 하단 네비 + 카테고리 드롭다운 (위로 펼침) 방식 채택
- Admin 카테고리: 대시보드 / 인사관리(5) / 운영(5) / 시스템(2)
- Platform 카테고리: 대시보드 / 운영(2) / 지원(2) / 시스템(2)
- 3개 역할 모두 하단 네비에 로그아웃 버튼 추가

### 포괄임금 모델 (PR #174)
- SalaryHistory 모델 신규 (Prisma)
- payroll-calc.ts: 통상시급 = 기본급 / 209시간, 연장 1.5배, 야간 0.5배, 휴일 1.5배
- 3개 API 신규: salary-history, calculate, wage-detail
- 직원 등록 폼에 기본급 필드 추가

## S28 의사결정 (2026-03-20~21)

| 결정 | 내용 | 사유 |
|------|------|------|
| SalaryHistory 별도 모델 | Employee에 baseSalary 안 넣고 이력 추적 | 급여 변동 이력 관리 |
| 5가지 임금체계 동시 지원 | COMPREHENSIVE/STANDARD/HOURLY/DAILY/ANNUAL | 범용 급여 시스템 |
| 소득세+지방소득세 포함 | 간이세액표 7구간 + 10% | 급여명세서 교부 요건 |
| 비과세 수당 분리 | 식대/교통비 20만 한도 | 과세분에만 세금+보험 적용 |
| 직원 상세 드로어 SSOT | 4탭(기본정보/근태/휴가/급여) 인라인 편집 | 허브 역할 |
| Hook 검증 시스템 | PreToolUse command hook (요구사항 보호 + 커밋 검증) | 속도>충실함 패턴 방지 |
| 코워크 검증 구조 | 리드(조율)+구현+검증+테스트 4팀원 | AI 판단 기반 검증 |
| Claude Code 체인지로그 RAG | 글로벌 + SessionStart 버전 체크 | 업데이트 추적 |

## S29 의사결정 (2026-03-21)

| 결정 | 내용 | 사유 |
|------|------|------|
| 코워크 6+1 에이전트 체계 | Guardian/Verifier/Judge/Tester/DocOps + spawn-template | 역할 분리로 검증 품질 향상 |
| Hook 6종 강제 실행 | PreToolUse(3), TaskCompleted, TeammateIdle, Stop | 자동 품질 게이트 (수동 의존 제거) |
| delegate mode hook | 리드가 직접 구현하지 않고 팀원에게 위임 강제 | 역할 분리 원칙 준수 |
| plan approval hook | 구현 전 리드 승인 필수 | 설계→구현 분리, 무검토 구현 방지 |
| knowledge/ 재설계 | RAG 12파일 → 7카테고리 15파일 | 주제별 분류로 로드 효율화 + 중복 제거 |
| CLAUDE.md 슬림화 | 규칙을 rules/ + hooks로 이관, CLAUDE.md는 프로젝트 정보만 | 컨텍스트 소비 최소화 |
| auto memory 인덱스 개편 | RAG 참조를 knowledge/ 기반으로 재매핑 | 이중 관리 제거 |
| 리드 워크플로우 5단계 | 요구사항분석→팀원배정→진행관리→결과검증→보고 | 코워크 실행 표준화 |
| Stop hook으로 knowledge 동기화 | 3+ 소스파일 변경 시 DocOps 제안 | 문서 갱신 누락 방지 |
| Windows 경로 호환 | delegate mode hook에서 `\` → `/` 변환 | Git Bash 환경 호환 |
| DocOps 자동 실행 강제 | Stop hook에서 DocOps spawn 필수화 | DocOps가 안 돌아서 knowledge stale 반복 |
| discussions/ 카테고리 추가 | decisions/와 분리 -- 결정(what) vs 과정(how) | 대화 맥락 보존 (방향 전환 이력, 사용자 피드백 패턴 등) |
| 7개 시스템 전부 강제 유지 | 축소 아니라 통합 재편 -- 역할 경계 명확화하되 강제는 유지 | "강제되던 이유가 있다" -- 사용자 확정 원칙 |
| main 직접 커밋 차단 hook | PreToolUse Bash에서 main/master push/commit 차단 | 브랜치 규칙 위반 방지 |
| lead-workflow hook 강제 | src/ 커밋 시 팀 필수 (코워크 우회 방지) | 리드가 직접 구현하면 검증 누락 |

## S30 의사결정 (2026-03-21)

| 결정 | 내용 | 사유 |
|------|------|------|
| DocOps 자율 정책 | 리드가 내용을 전달하지 않음, DocOps가 소스(git log, session JSONL, knowledge/) 직접 읽기 | 리드 의존 시 누락/왜곡 발생, 원천 데이터 직접 접근이 정확 |
| 전 에이전트 Opus 통일 | settings.json의 모든 에이전트 모델을 Opus로 설정 | 검증 품질 향상 (Sonnet 대비 판단력 향상) |
| discussions/ JSONL 원천 정책 | session JSONL에서 user 메시지를 읽고 핵심 논의를 추출, 리드의 요약에 의존하지 않음 | 리드 요약은 축약/누락 위험, JSONL이 완전한 원천 |
| mem/RAG 통합 방향 | mem 스킬(수동 save/load)과 RAG 12파일을 knowledge/ 체계로 일원화, DocOps가 자동 관리 | 이중 관리 제거, 수동 의존 제거 |
| DocOps 코워크 내 순서 | 모든 태스크 완료 후 마지막에 실행, 리드는 "knowledge/ 업데이트해주세요"만 전달 | 역할 최소화, DocOps 자율 판단 극대화 |

## S31 의사결정 (2026-03-21)

| 결정 | 내용 | 사유 |
|------|------|------|
| WI 번호 중복 즉시 차단 | 임계값 10 → 0, 경고 → exit 2 차단 | 임계값이 느슨하면 규칙 우회 구멍 — 사용자 강력 지적 |
| 빈 팀 우회 차단 | config.json에서 Guardian+DocOps 필수 멤버 확인 | 팀만 활성화하고 멤버 없이 커밋하는 우회 방지 |
| hook 설계 무관용 원칙 | 임계값/조건을 느슨하게 두지 않음 | "설계할 때부터 구멍을 만들지 말 것" — 사용자 확정 |

## S33 의사결정 (2026-03-21)

| 결정 | 내용 | 사유 |
|------|------|------|
| Stop hook 미커밋 파일 차단 | .claude/ 하위 modified+untracked 파일이 있으면 세션 종료 차단 (exit 2) | 커밋 안 된 중요 설정/knowledge 파일이 다음 세션에서 유실되는 것 방지 |
| 세션 시작 규칙 명문화 | process.md에 SessionStart hook 주입 활용 규칙 추가 | "이어서 진행해" 시 파일을 다시 읽으러 가지 않고 주입 내용 즉시 활용 |
| Claude Code 버전 체크 자동화 | check-version.sh + last-known-version.txt로 버전 변경 감지 | 버전 업데이트 시 체인지로그 RAG 갱신 트리거 |

## S34 의사결정 (2026-03-21~22)

| 결정 | 내용 | 사유 |
|------|------|------|
| rules 강제주입 한계 인식 | .claude/rules/ 파일이 유저 메시지로 취급되어 작업 압박 시 무시됨 | 사용자 지적: "룰스가 강제주입되지만 유저 메시지로 취급되니 작업압박이 있으면 무시되는거네" |
| 코워크 항상 활성화 방향 | 코워크를 선택이 아닌 필수로, 단독 모드 제거 | rules만으로 강제 불가 → 코워크+hook 기계적 강제 필수. 사용자: "항상활성화로 변경시키는게 정답이네" |
| 첫 커밋 코워크 차단 | 코워크 없는 상태에서의 커밋을 hook으로 원천 차단 | 사용자: "첫 커밋에서 차단시키면된다는 거잖아" |
| Guardian 파일 숙지 크로스체킹 | Guardian에 Step 4 추가 — 리드가 관련 파일을 실제로 읽었는지 검증 | 사용자: "작업전 파일을 다안읽고 시작한걸 검증하는 단계도있어야겠네" |

## S35 의사결정 (2026-03-22)

| 결정 | 내용 | 사유 |
|------|------|------|
| 세션 단위 팀 운영 | 팀을 태스크마다 생성/해체하지 않고 세션 내내 유지. Guardian+DocOps 상시 가동 | 매번 팀 생성/해체 오버헤드 제거, Guardian/DocOps는 모든 작업에 필수이므로 상시 가동이 자연스러움 |
| Tester 결과 파일 표준화 | `.claude/verification/{task_id}-test.md`에 TEST-PASS/TEST-FAIL 작성 | TaskCompleted hook과 연동하기 위한 표준 포맷 필요 |
| Tester completion gate | verify-task-completion.sh에 1.5단계 추가 — tester 결과 확인 후 태스크 완료 허용 | 기존에 tester 결과가 hook에 연결 안 되던 gap 해소 (미완료 항목 #2 해결) |

## S36 의사결정 (2026-03-22)

| 결정 | 내용 | 사유 |
|------|------|------|
| delegate mode 전면 확장 | 리드가 src/ 뿐만 아니라 모든 파일 수정 불가 (팀 활성 시) | 사용자: "src 외에도 팀생성없이 하면 금지인데 왜 커밋이된거지?" — 기존 src/ 제한은 구멍 |
| 팀원 역할별 권한 제한 | guardian/judge 읽기전용, verifier/tester verification만, docops src/ 차단, implementer 제한없음 | 각 역할의 책임 범위에 맞는 최소 권한 원칙 적용 |
| 리드 완전 위임 모델 | requirements 작성도 DocOps에게 지시하도록 변경 | 사용자: "리드의 직접 커밋자체를 금지하고 요구사항 작성이나 설정변경하는건 독옵스에서 맡으면 되는거아닌가?" |
| 팀원 거부 보고 의무 | 팀원이 워크플로우 위반을 이유로 작업 거부 시 리드는 사용자에게 즉시 보고 | 사용자: "오히려 니가 위반인데도 불구하고 독옵스의 만류를 내게 보고하지않은게 잘못이지" |
| DocOps 작업도 WI+태스크 체계 준수 | DocOps의 knowledge 업데이트도 WI 번호 할당 + 태스크로 관리 | 사용자: "모든작업은 WI 할당해서 처리하는건데 이건 태스크로 잡혀야하는데?" |
| DocOps 커밋 타이밍 규칙 | PR push 전에 커밋, 머지 후 같은 브랜치에 추가 커밋 금지 | DocOps가 PR 머지 후 브랜치에 커밋하여 knowledge 변경이 main에 반영 안 된 사고 발생 |
| 팀 멤버 전원 상시 필수 | Guardian+DocOps만 상시 → 전원(6명) 상시 spawn, 모든 커밋에 전원 필수 | 부분 팀으로 커밋하면 검증 누락 발생 가능, src/ 변경 여부와 무관하게 전원 참여 |
| DocOps requirements 쓰기 권한 | DocOps가 .claude/requirements/ 파일도 작성 가능 | 리드 완전 위임 모델에서 requirements 파일 작성도 DocOps 담당 |
| Phase 5 DocOps 커밋 후 enqueue | DocOps 커밋+push → PR 생성 → enqueue 순서 강제 | 머지큐 진입 후 브랜치 수정 불가 — WI-172에서 push 차단 사고 발생하여 순서 명시 |

## S37 의사결정 (2026-03-22)

| 결정 | 내용 | 사유 |
|------|------|------|
| DocOps PR 상태 자동 갱신 | 세션 시작 시 "PR 오픈" 항목을 git log 기준으로 실제 상태 갱신 | state.md/unresolved.md에 "PR 오픈"으로 남아있는 항목이 실제로는 머지 완료인 경우가 반복 발생 |
| hook 변경 시도 후 원복 | /dev/null→mktemp 시도 후 원복 | build false positive 원인이 /dev/null이 아닌 것으로 판명 |
| 프로젝트 permissions allow | settings.json에 Write/Edit 도구 자동 허용 | 팀원이 파일 수정 시 매번 수동 승인 팝업 발생 → 작업 흐름 방해 |
