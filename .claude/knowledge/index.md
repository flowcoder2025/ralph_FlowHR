# Knowledge Base Index

작업 주제에 따라 필요한 knowledge 파일을 로드합니다.

## 주제별 로드 매핑

| 작업 주제 | 로드할 파일 |
|-----------|-----------|
| 인프라/배포/CI | `reference/infra.md` |
| 인증/로그인/세션 | `reference/auth.md` |
| API 생성/수정 | `patterns/api-design.md` |
| CRUD/비즈니스 로직 | `patterns/crud-business.md` |
| 성능/최적화 | `patterns/performance.md` |
| 데이터 불일치/SSOT | `issues/ssot.md` |
| 미해결 이슈 | `issues/unresolved.md` |
| E2E/Playwright/테스트 | `testing/e2e-history.md` |
| 파일 분할/리팩토링 | `lessons/tab-refactor.md` |
| 페이지/라우트 추가 | `reference/pages-map.md` |
| 설계 판단/전략 변경 | `decisions/log.md` |
| 논의 과정/방향 전환 | `discussions/` (날짜별) |
| Claude Code 기능/hook | `reference/claude-code-changelog.md` |
| 전체 맥락 파악 | `history/timeline.md` |
| 현재 상태 확인 | `state.md` |

**복수 해당 시 전부 로드.**

## 코워크 팀원별 기본 로드

| 팀원 | 기본 로드 |
|------|----------|
| Guardian | `issues/unresolved.md`, `decisions/log.md` |
| Implementer | `patterns/api-design.md`, `patterns/crud-business.md`, `reference/pages-map.md` |
| Verifier | `issues/ssot.md`, `issues/unresolved.md`, `decisions/log.md` |
| Tester | `testing/e2e-history.md`, `reference/pages-map.md` |
| Judge | `issues/ssot.md`, `decisions/log.md`, `lessons/tab-refactor.md` |
| DocOps | `state.md`, `history/timeline.md`, `discussions/` |

## 업데이트 트리거

| 이벤트 | 업데이트 파일 |
|--------|-------------|
| 새 API 생성/수정 | `patterns/api-design.md` |
| 새 페이지 생성 | `reference/pages-map.md` |
| 이슈 해결 | `issues/unresolved.md` |
| 아키텍처/전략 결정 | `decisions/log.md` |
| 성능 개선 | `patterns/performance.md` |
| 인프라 변경 | `reference/infra.md` |
| 세션/작업 완료 | `state.md`, `history/timeline.md`, `discussions/` |
