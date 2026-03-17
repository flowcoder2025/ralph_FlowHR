# WI System + Claude Code 개발 프로세스 가이드

> ralph_FlowHR 프로젝트에서 실제 적용 중인 개발 프로세스입니다.
> Claude Code가 규칙을 자동으로 읽고 따르도록 설계되어 있습니다.

---

## 목차

1. [전체 구조](#1-전체-구조)
2. [규칙 계층](#2-규칙-계층)
3. [개발 플로우](#3-개발-플로우)
4. [커밋/브랜치/PR 규칙](#4-커밋브랜치pr-규칙)
5. [CI/CD 파이프라인](#5-cicd-파이프라인)
6. [RAG 컨텍스트 시스템](#6-rag-컨텍스트-시스템)
7. [Ralph Loop (자동화)](#7-ralph-loop-자동화)
8. [구현 원칙](#8-구현-원칙)
9. [메모리 시스템](#9-메모리-시스템)
10. [설정 파일 위치 요약](#10-설정-파일-위치-요약)

---

## 1. 전체 구조

```
프로젝트 루트/
├── CLAUDE.md                        ← Claude가 매 세션 시작 시 읽는 프로젝트 정보
├── .claude/
│   ├── rules/                       ← 프로젝트 규칙 (컨텍스트 압축과 무관하게 항상 적용)
│   │   ├── project.md               ← 아키텍처 체크리스트 + 코드 품질 규칙
│   │   ├── rag-context.md           ← RAG 자동 로드/업데이트 규칙
│   │   └── ralph-operations.md      ← Ralph Loop 운영 규칙
│   └── memory/
│       ├── MEMORY.md                ← 프로젝트 메모리 인덱스
│       ├── rag/                     ← 세션 히스토리 기반 RAG 참조 문서 (12개)
│       └── logs/                    ← 일일 로그
├── .ralph/
│   ├── PROMPT.md                    ← Ralph Loop 실행 프롬프트
│   ├── AGENT.md                     ← 빌드/테스트 명령 + 기술 스택
│   ├── fix_plan.md                  ← 작업 계획 (읽기 전용)
│   ├── guardrails.md                ← 실패 방지 규칙 (누적)
│   └── scripts/enqueue-pr.sh        ← merge queue 등록 스크립트
├── .github/
│   ├── workflows/ci.yml             ← lint → build → test
│   ├── workflows/commit-check.yml   ← 커밋 메시지 형식 검증
│   └── PULL_REQUEST_TEMPLATE.md     ← PR 양식
└── src/                             ← 소스 코드

글로벌 (사용자 홈):
~/.claude/
├── rules/
│   ├── wi-global.md                 ← 커밋/브랜치/PR/코드 규칙 (모든 프로젝트 적용)
│   ├── wi-ralph-loop.md             ← Ralph Loop 반복 규칙
│   └── wi-utf8.md                   ← UTF-8 인코딩 규칙 (Windows)
├── memory/MEMORY.md                 ← 글로벌 메모리 (교훈, 선호도)
└── CLAUDE.md                        ← 글로벌 설정 (메모리 시스템 v3.3)
```

---

## 2. 규칙 계층

충돌 시 상위가 우선합니다:

```
1순위: ~/.claude/rules/wi-*.md         ← 글로벌 (커밋, 브랜치, UTF-8)
2순위: {project}/.claude/rules/*.md    ← 프로젝트 (아키텍처, RAG)
3순위: .ralph/guardrails.md            ← 프로젝트 누적 규칙
4순위: CLAUDE.md                       ← 프로젝트 정보 참조
```

### 핵심: `.claude/rules/` 디렉토리

이 디렉토리의 파일은 **컨텍스트 압축(compaction)과 무관하게 항상 적용**됩니다.
Claude Code가 긴 대화에서 컨텍스트를 압축해도 rules는 유지됩니다.
따라서 반드시 지켜야 하는 규칙은 여기에 넣습니다.

---

## 3. 개발 플로우

```
main 동기화 → 브랜치 생성 → 코드 숙지 → 영향도 평가 → 전수 조사
→ 구현 → lint/build/test → 커밋 → push → PR → enqueue
→ CI 통과 → merge queue → 자동 머지 → Vercel 자동 배포
→ main pull → 다음 브랜치 생성
```

### 상세 단계

```bash
# 1. main 동기화
git checkout main && git pull origin main

# 2. 브랜치 생성 (git 추적 파일 변경 시 무조건 먼저)
git checkout -b feature/WI-NNN-feat-작업명-kebab

# 3. 구현 (구현 원칙 준수 — 8장 참조)

# 4. 로컬 검증 (3단계 전부 통과 필수)
npm run lint && npm run build && npm test

# 5. 커밋 (git status로 빠진 파일 확인)
git add {변경 파일들}
git commit -m "WI-NNN-feat 한글 작업명"

# 6. push + PR + merge queue 등록
git push origin feature/WI-NNN-feat-작업명-kebab
gh pr create --title "WI-NNN-feat 한글 작업명" --body "..."
bash .ralph/scripts/enqueue-pr.sh $(gh pr view --json number --jq '.number')

# 7. CI 통과 → 자동 머지 대기

# 8. 머지 확인 후 다음 작업
git checkout main && git pull origin main
# 다음 브랜치 생성...
```

### 금지 사항
- `gh pr merge --auto --squash` 사용 금지 (merge queue에서 무시됨)
- main에 직접 push 금지
- 이전 PR 머지 전에 다음 브랜치 작업 금지 (충돌 발생)
- .gitignore, CLAUDE.md 등 설정만으로 단독 PR 금지 (다음 작업에 함께 포함)

---

## 4. 커밋/브랜치/PR 규칙

### 커밋 메시지
```
WI-NNN-[type] 한글 작업명

# type 종류:
feat, fix, docs, style, refactor, test, chore, perf, ci, revert

# 예시:
WI-126-fix UTC 날짜 통일 + seed userId 전수 연결
WI-127-feat GPS 출퇴근 위치 검증 시스템

# 시스템 커밋 (번호 없이):
WI-chore PRD 업데이트
WI-docs README 작성
```

### 브랜치 네이밍
```
feature/WI-NNN-feat-작업명-kebab
fix/WI-NNN-fix-작업명-kebab
refactor/WI-NNN-refactor-작업명-kebab
chore/WI-NNN-chore-작업명-kebab
```

### 검증
- **로컬**: Git hook (`commit-msg`)이 커밋 메시지 형식 검증
- **CI**: `commit-check.yml`이 PR의 모든 커밋 메시지 검증
- **브랜치 보호**: `pre-push` hook이 main 직접 push 차단

---

## 5. CI/CD 파이프라인

### GitHub Actions (4개 체크)
```
PR 생성 / merge_group 트리거
├── ci.yml
│   ├── lint (npm run lint)
│   ├── build (npm run build) — lint 통과 후
│   └── test (npm test) — build 통과 후
└── commit-check.yml
    └── WI-NNN-[type] 커밋 메시지 형식 검증
```

### Merge Queue
- GitHub merge queue ruleset 활성
- Method: **SQUASH**
- 최소 대기: 1분
- CI 타임아웃: 10분
- **enqueue-pr.sh**가 GraphQL mutation으로 큐에 등록

### 자동 배포
- Vercel: main push 시 자동 배포
- 리전: 서울 (icn1)

---

## 6. RAG 컨텍스트 시스템

세션 간 맥락 유지를 위한 시스템입니다.
세션 JSONL에서 추출한 주제별 참조 문서가 `.claude/memory/rag/`에 저장됩니다.

### 파일 구조
```
.claude/memory/rag/
├── 00-timeline.md       ← 전체 세션 타임라인
├── 01-infra.md          ← 인프라/환경 (Supabase, Vercel, CI)
├── 02-auth.md           ← 인증/세션 (NextAuth, JWT, RBAC)
├── 03-api-design.md     ← API 설계 표준 + 경로 맵
├── 04-crud-business.md  ← CRUD/비즈니스 로직
├── 05-ssot-issues.md    ← 데이터 정합성 이슈
├── 06-e2e-testing.md    ← E2E 테스트 히스토리
├── 07-tab-refactor.md   ← 탭 분할 교훈
├── 08-unresolved.md     ← 미해결 이슈
├── 09-performance.md    ← 성능 최적화
├── 10-pages-map.md      ← 페이지 + API 맵핑
└── 11-decisions-log.md  ← 주요 의사결정 로그
```

### 동작 방식
1. **세션 시작**: 작업 주제에 맞는 RAG 파일 자동 로드
2. **작업 중**: 변경 발생 시 해당 RAG 파일 즉시 업데이트
3. **세션 종료**: `/mem:save` 시 RAG 동기화 검증

### 주제-파일 매핑
| 작업 주제 | RAG 파일 |
|-----------|----------|
| 인프라/배포 | 01-infra |
| 인증/세션 | 02-auth |
| API 작업 | 03-api-design |
| 날짜/데이터 이슈 | 05-ssot-issues |
| 성능 | 09-performance |

---

## 7. Ralph Loop (자동화)

PRD 기반으로 작업 항목(WI)을 자동 순차 처리하는 시스템입니다.

### 구조
```
.ralph/
├── fix_plan.md         ← 작업 목록 (- [ ] WI-NNN-type 작업명)
├── completed_wis.txt   ← 완료 추적 (SSOT)
├── PROMPT.md           ← 매 반복마다 Claude에 전달되는 프롬프트
├── AGENT.md            ← 빌드/테스트 명령 정의
├── guardrails.md       ← 실패 방지 규칙 (누적)
└── scripts/
    ├── ralph.sh        ← 루프 실행 스크립트
    ├── launch-loop.sh  ← 새 터미널에서 실행
    └── enqueue-pr.sh   ← merge queue 등록
```

### 실행 방식
```bash
# 새 터미널에서 실행 (Claude Code 세션 안에서 직접 실행 금지)
bash .ralph/scripts/launch-loop.sh
```

### 1회 반복 흐름
```
fix_plan.md에서 첫 - [ ] 항목 선택
→ main에서 브랜치 생성
→ TDD (테스트 → 구현 → 검증)
→ 커밋 → push → PR → enqueue
→ CI 통과 → 머지
→ RALPH_STATUS 출력 → 종료
→ 외부 루프가 다음 반복 시작
```

### 핵심 규칙
- **1회 = 1 WI만** (여러 WI 금지)
- fix_plan.md 직접 수정 금지
- completed_wis.txt 수동 조작 금지

---

## 8. 구현 원칙

모든 코드 작업에 적용되는 원칙입니다.

### 작업 시작 전 체크리스트
```
- [ ] 경계 분리: "이 코드의 경계는 무엇인가?" 정의
- [ ] 모듈화: module/index.ts + module/internal/ 구조 준수
- [ ] 캡슐화: index.ts만 외부 노출
- [ ] 컴포넌트 재사용: 2회 이상 반복 → 분리
- [ ] 하드코딩 금지: 상수는 constants/로 분리
- [ ] UTF-8: 모든 파일 UTF-8 (BOM 없음)
```

### 구현 순서
```
1. 코드 숙지     ← 수정 대상 + 관련 파일 전문 읽기
2. 영향도 평가   ← 변경이 영향을 미치는 모든 파일/API/페이지 파악
3. 전수 조사     ← 동일 패턴이 다른 곳에도 있는지 grep/glob 검색
4. 사이드이펙트  ← 깨질 수 있는 기존 기능 미리 식별
5. 구현          ← 장점 상쇄 없는 해결 (A 고치면서 B 깨는 거 금지)
6. 검증          ← lint → build → test 통과 후 커밋
```

### 코드 품질
- TypeScript strict mode
- ESLint + Prettier
- 모든 함수에 타입 명시
- 플레이스홀더/TODO/stub 코드 절대 금지
- OWASP Top 10 보안 취약점 금지

---

## 9. 메모리 시스템

### 구조
```
글로벌: ~/.claude/memory/MEMORY.md
  → 사용자 선호도, 교훈 (모든 프로젝트 적용)

프로젝트: {project}/.claude/memory/MEMORY.md
  → 프로젝트 결정사항, 아키텍처

Auto Memory: ~/.claude/projects/{encoded}/memory/
  → 세션 간 자동 저장 (feedback, project, reference)

Daily Log: {project}/.claude/memory/logs/YYYY-MM-DD.md
  → 당일만 유지 (이전일 삭제)
```

### 명령어
| 명령 | 설명 |
|------|------|
| `/mem:load` | 세션 시작 시 메모리 로드 |
| `/mem:save` | 세션 종료 시 저장 + DocOps 검증 |
| `/mem:resume` | 이전 작업 상태 복원 |
| `/mem:note` | 즉시 메모 기록 |

---

## 10. 설정 파일 위치 요약

| 파일 | 위치 | 역할 |
|------|------|------|
| `CLAUDE.md` | 프로젝트 루트 | 프로젝트 정보 + 개발 프로세스 + 구현 원칙 |
| `wi-global.md` | `~/.claude/rules/` | 커밋/브랜치/PR/코드 규칙 (글로벌) |
| `wi-ralph-loop.md` | `~/.claude/rules/` | Ralph Loop 반복 규칙 (글로벌) |
| `wi-utf8.md` | `~/.claude/rules/` | UTF-8 인코딩 규칙 (글로벌) |
| `project.md` | `.claude/rules/` | 아키텍처 체크리스트 + 코드 품질 |
| `rag-context.md` | `.claude/rules/` | RAG 자동 로드/업데이트 규칙 |
| `ralph-operations.md` | `.claude/rules/` | Ralph Loop 운영 규칙 |
| `PROMPT.md` | `.ralph/` | Ralph Loop 실행 프롬프트 |
| `AGENT.md` | `.ralph/` | 빌드/테스트 명령 + 기술 스택 |
| `fix_plan.md` | `.ralph/` | 작업 계획 (읽기 전용) |
| `guardrails.md` | `.ralph/` | 실패 방지 규칙 (누적) |
| `ci.yml` | `.github/workflows/` | lint → build → test |
| `commit-check.yml` | `.github/workflows/` | 커밋 메시지 형식 검증 |
| `commit-msg` | `.ralph/hooks/` | 로컬 커밋 메시지 검증 |
| `pre-push` | `.ralph/hooks/` | main 직접 push 차단 |
| `enqueue-pr.sh` | `.ralph/scripts/` | merge queue 등록 |

---

## Quick Start

### 1. 새 프로젝트에 WI System 적용

```bash
# 1. 글로벌 규칙 설치 (한 번만)
# ~/.claude/rules/ 에 wi-global.md, wi-ralph-loop.md, wi-utf8.md 배치

# 2. 프로젝트 초기화
/wi:init

# 3. PRD 생성 (대화형)
/wi:prd

# 4. 인프라 환경 구성
/wi:env

# 5. Ralph Loop 가동
/wi:start
```

### 2. 기존 프로젝트에서 작업 시작

```bash
# 1. 메모리 로드
/mem:load

# 2. 작업 시작 (규칙은 자동 적용)
# Claude가 CLAUDE.md + .claude/rules/ 를 자동으로 읽음

# 3. 세션 종료 시
/mem:save
```

---

*이 문서는 ralph_FlowHR 프로젝트 (2026-03-17 기준)에서 실제 적용 중인 프로세스입니다.*
