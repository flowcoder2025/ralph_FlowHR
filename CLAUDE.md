# ralph_FlowHR

## 프로젝트 정보
- **이름**: ralph_FlowHR
- **타입**: TypeScript (Node.js 20)
- **설명**: ralph_FlowHR 프로젝트

## 빌드/테스트
```bash
npm ci          # 의존성 설치
npm run lint    # 린트
npm run build   # 빌드
npm test        # 테스트
```

## 구조
```
src/                    → 소스 코드
dist/                   → 빌드 출력
docs/                   → 문서 계층구조 (L0~L4)
.ralph/                 → Ralph Loop 설정
.github/                → CI/CD 워크플로우
.claude/rules/          → 프로젝트 규칙
.claude/memory/rag/     → RAG 참조 문서 (세션 히스토리 기반, 12개 파일)
```

## 규칙
- 글로벌 규칙: `~/.claude/rules/wi-*.md` 자동 적용
- 프로젝트 규칙: `.claude/rules/project.md`
- **RAG 규칙: `.claude/rules/rag-context.md`** — 작업 시 관련 RAG 자동 로드 + 실시간 업데이트
- 커밋: `WI-[type] 한글 작업명` 형식
- main 직접 push 금지 → PR 필수

## 개발 프로세스 (반드시 준수)
1. **브랜치 먼저**: git 추적 파일 변경 시 무조건 브랜치 생성 후 작업 (.gitignore, 설정 파일 포함 — 예외 없음)
2. **커밋 전 확인**: `git status`로 빠진 파일 없는지 확인 (관련 변경 전부 포함)
3. **로컬 검증**: `npm run lint && npm run build && npm test` 전부 통과 후 push
4. **PR → enqueue**: `gh pr create` → `bash .ralph/scripts/enqueue-pr.sh <PR번호>` (`--auto --squash` 사용 금지)
5. **머지 확인 후 다음**: PR 머지 완료 확인 → `git checkout main && git pull` → 그 다음 브랜치 생성
6. **순서 준수**: 이전 PR 머지 전에 다음 브랜치 작업하면 충돌 발생
7. **짜잘한 변경 단독 PR 금지**: .gitignore, CLAUDE.md, rules 등 설정 변경은 다음 기능 작업 브랜치에 함께 포함 — 설정만으로 PR 만들지 않음
8. **PR push 후 즉시 다음 브랜치로 이동**: main에서 reset --hard 하면 uncommitted 변경 유실 — PR push 직후 main pull → 다음 브랜치 생성

## 구현 원칙 (모든 작업에 적용)
1. **코드 숙지 먼저**: 수정 대상 + 관련 파일을 전문 읽고 기존 패턴/로직 파악 후 작업
2. **영향도 평가**: 변경이 영향을 미치는 모든 파일/API/페이지를 사전에 파악
3. **전수 조사**: 동일 패턴이 다른 곳에도 있는지 grep/glob으로 전수 검색 — 일부만 고치면 불일치 발생
4. **사이드이펙트 사전 분석**: 변경으로 인해 깨질 수 있는 기존 기능을 미리 식별
5. **장점 상쇄 없는 해결**: 한쪽을 고치면서 다른 쪽이 깨지는 해결책 금지 — 양쪽 모두 유지되는 방안 채택
6. **검증 후 커밋**: lint → build → test 통과 확인 후에만 커밋
