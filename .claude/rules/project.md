# ralph_FlowHR - Project Rules

## 프로젝트 정보
- **이름**: ralph_FlowHR
- **타입**: TypeScript (Node.js)
- **규칙 상속**: 글로벌 규칙 (`~/.claude/rules/wi-*.md`) 자동 적용

## 프로젝트 규칙 체크리스트 (필수)
작업 시작 전 다음 항목 확인:
- [ ] **경계 분리**: 변경 전 "이 코드의 경계는 무엇인가?" 정의
- [ ] **모듈화**: `module/index.ts` + `module/internal/` 구조 준수
- [ ] **캡슐화**: `index.ts`만 외부 노출, `internal/*` 직접 import 금지
- [ ] **컴포넌트 재사용**: 2회 이상 반복 → 분리
- [ ] **하드코딩 금지**: 상수는 `constants/`로 분리
- [ ] **UTF-8**: 모든 파일 UTF-8 (BOM 없음)

### 위반 시
**이 체크리스트를 확인하지 않고 작업 시작 시, 사용자에게 경고 후 체크리스트 확인**

---

## Architecture Flow (Core)

```
경계 분리(개념) → 모듈화(구조) → 캡슐화(접근제어)
```

### 1. 경계 분리 (Boundary)
- 변경 전 "이 코드의 경계는 무엇인가?" 먼저 정의
- 새 코드는 반드시 특정 경계에 소속

### 2. 모듈화 (Module)
- 경계 = 모듈 폴더
- 구조: `module/index.ts` + `module/internal/`

### 3. 캡슐화 (Encapsulation)
- `index.ts`만 외부 노출 (Public API)
- `internal/*` 외부 import 금지

```
moduleA/
  index.ts        # Public API
  internal/       # Private
```

---

## Code Quality Rules

### 컴포넌트 재사용 (Component Reuse)
- **같은 UI/로직이 2번 이상 나오면 컴포넌트로 분리**
- 기존 컴포넌트 확인 후 새로 만들기 (중복 생성 금지)
- 공통 컴포넌트는 `shared/` 또는 `common/` 모듈에 배치

### 하드코딩 금지 (No Hardcoding)
- **문자열, 숫자, URL 등 직접 코드에 박지 않기**
- 상수는 `constants/` 또는 설정 파일로 분리
- 환경별 값은 환경변수 사용

### UTF-8 인코딩 (Encoding)
- **모든 파일은 UTF-8 (BOM 없음) 저장**
- 파일 읽기/쓰기 시 `utf-8` 명시
- HTML은 `<meta charset="UTF-8">` 필수

---

## 프로젝트별 규칙
- TypeScript strict mode 사용
- ESLint + Prettier 코드 스타일 준수
- 모든 함수에 타입 명시 (no implicit any)
- import 경로는 상대경로 사용

## 빌드/테스트 명령
- lint: `npm run lint`
- build: `npm run build`
- test: `npm test`

## 디렉토리 구조
```
src/                    → 소스 코드
dist/                   → 빌드 출력
docs/                   → 문서 계층구조 (L0~L4)
.ralph/                 → Ralph Loop 설정
.github/                → CI/CD 워크플로우
.claude/memory/rag/     → RAG 참조 문서 (세션 히스토리 기반)
.claude/rules/          → 프로젝트 규칙 (rag-context.md 포함)
```

## RAG 컨텍스트
- 작업 시작 전 `.claude/rules/rag-context.md`의 주제-파일 매핑에 따라 관련 RAG 로드
- 작업 중 변경사항은 해당 RAG 파일에 즉시 반영
