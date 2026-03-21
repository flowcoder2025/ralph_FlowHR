# ralph_FlowHR

## 프로젝트 정보
- **이름**: ralph_FlowHR
- **타입**: TypeScript (Node.js 20)

## 빌드/테스트
```bash
npm ci          # 의존성 설치
npm run lint    # 린트
npm run build   # 빌드
npm test        # 테스트
```

## 구조
```
src/                         → 소스 코드
dist/                        → 빌드 출력
.claude/knowledge/           → 프로젝트 지식 (index.md로 라우팅)
.claude/rules/               → 프로젝트 규칙
.claude/agents/              → 코워크 팀원 정의
.claude/scripts/             → hook 스크립트
.claude/requirements/        → 사용자 요구사항 (SSOT, 수정 불가)
.claude/verification/        → 검증 결과 (로컬)
.claude/plans/               → 계획 승인 (로컬)
.ralph/                      → Ralph Loop 설정
.github/                     → CI/CD 워크플로우
```

## 코워크 시스템
이 프로젝트는 Agent Teams + Hook으로 구현 품질을 강제합니다.

### 팀 구조
- **리드**: 조율만 (delegate mode — 모든 파일 수정 불가)
- **Guardian**: 태스크 분배 vs 요구사항 대조
- **Implementer**: 구현 (plan approval 필수)
- **Verifier**: 요구사항 대비 검증 + 승인 파일 작성
- **Judge**: 2차 재평가
- **Tester**: Playwright MCP CRUD 테스트
- **DocOps**: knowledge/ 자동 업데이트

### Hook 게이트 (자동 강제)
| Hook | 역할 |
|------|------|
| Delegate mode | 팀 활성 시 리드 src/ 수정 차단 |
| Plan approval | 구현 팀원 계획 승인 전 src/ 수정 차단 |
| TaskCompleted | 검증 팀원 PASS 없이 완료 차단 |
| TeammateIdle | lint/build/test 미통과 시 idle 차단 |
| 요구사항 보호 | .claude/requirements/ 수정 차단 |
| 커밋 검증 | 회피 표현, 껍데기 패턴, SSOT 미연결 차단 |
| 팀 구성원 필수 | Guardian + DocOps 없이 커밋 차단 |
| WI 번호 중복 | 같은 WI로 머지된 PR 있으면 차단 |
| main 직접 커밋 | main/master 브랜치 커밋 차단 |
| Stop knowledge | knowledge/ stale 시 세션 종료 차단 → DocOps spawn 요구 |

### Knowledge 시스템
- `.claude/knowledge/index.md` — 주제별 로드 매핑
- 작업 시 주제에 맞는 knowledge 파일 자동 로드
- DocOps 에이전트가 자동 업데이트

## 개발 프로세스

### 작업 시작 전
1. `.claude/agents/lead-workflow.md`의 5단계를 반드시 순서대로 밟는다
2. 새 WI 번호를 할당한다 (기존 WI와 다른 작업이면 반드시 새 번호)
3. `.claude/knowledge/state.md`와 `discussions/`를 읽어 현재 맥락을 파악한다

### 작업 중
1. **모든 커밋에 Guardian + DocOps 팀 필수** — src/ 변경은 full 팀
2. hook에 걸리기 전에 스스로 규칙을 따른다 — hook은 최후 방어선이지 가이드라인이 아니다
3. 설계 대비 구현 대조표를 수시로 확인한다
4. 사용자가 묻기 전에 gap을 스스로 찾아서 보고한다

### 작업 완료 시
1. DocOps를 spawn하여 knowledge/ 업데이트 (수동 수정 금지)
2. PR 생성 → enqueue-pr.sh (--auto --squash 금지)
3. 사용자에게 완료 보고

## 행동 금지 사항
- **빈 팀으로 hook 우회** — 팀원 없는 팀을 만들어 커밋 차단을 통과하지 않는다
- **임계값을 높게 설정하여 우회** — 규칙의 숫자를 느슨하게 잡아 구멍을 만들지 않는다
- **경고를 무시** — hook 경고가 뜨면 즉시 대응한다, 무시하고 진행하지 않는다
- **수동 knowledge/ 수정** — 반드시 DocOps를 spawn한다
- **같은 WI 번호 재사용** — 다른 작업은 다른 번호
- **형식적 테스트** — 실제 동작을 확인하는 실질적 테스트만 인정
- **속도를 위한 축소/누락** — 요구사항 전부를 충실히 이행한다
- **추측성 답변/작업** — 확인 후 사실만 전달한다
- **리드의 직접 파일 수정** — 모든 파일 수정은 팀원에게 위임 (requirements, settings, knowledge 포함)
