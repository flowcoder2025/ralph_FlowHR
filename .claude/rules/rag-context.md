# RAG Context Management Rules

이 프로젝트에는 세션 JSONL에서 추출한 주제별 RAG 참조 문서가 있습니다.
위치: `.claude/memory/rag/`

## 1. 세션 시작 시 자동 로드

작업 시작 전 **반드시** 다음을 수행:

1. `.claude/memory/MEMORY.md` 읽기 (RAG 인덱스 확인)
2. 작업 주제에 해당하는 RAG 파일 로드

### 주제-파일 매핑

| 작업 주제 | 로드할 RAG 파일 |
|-----------|----------------|
| 인프라/배포/CI | `01-infra.md` |
| 인증/로그인/세션/JWT | `02-auth.md` |
| API 생성/수정 | `03-api-design.md` |
| CRUD/비즈니스 로직 | `04-crud-business.md` |
| 데이터 불일치/0건/날짜 | `05-ssot-issues.md` |
| E2E/Playwright/테스트 | `06-e2e-testing.md` |
| 파일 분할/리팩토링 | `07-tab-refactor.md` |
| 미해결 이슈 작업 | `08-unresolved.md` |
| 성능/최적화 | `09-performance.md` |
| 페이지/라우트 추가 | `10-pages-map.md` |
| 설계 판단/전략 변경 | `11-decisions-log.md` |
| 전체 맥락 파악 | `00-timeline.md` |
| Claude Code 기능/hook/agent | `12-claude-code-changelog.md` |

**복수 해당 시 전부 로드**.

## 2. 실시간 업데이트 트리거

| 이벤트 | 업데이트 파일 |
|--------|-------------|
| 새 API 생성/수정 | `03-api-design.md` |
| 새 페이지 생성 | `10-pages-map.md` |
| 이슈 해결 | `08-unresolved.md` |
| 아키텍처/전략 결정 | `11-decisions-log.md` |
| 성능 개선 | `09-performance.md` |
| 인프라 변경 | `01-infra.md` |
| PR 머지 완료 | `00-timeline.md` |

## 3. /mem:save 시 RAG 동기화

세션 중 발생한 변경사항이 RAG에 반영되었는지 검증 → 미반영 시 즉시 반영.
