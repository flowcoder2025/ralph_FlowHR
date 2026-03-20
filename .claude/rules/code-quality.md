# 코드 품질 규칙

## 아키텍처 플로우
```
경계 분리(개념) → 모듈화(구조) → 캡슐화(접근제어)
```

### 경계 분리
- 변경 전 "이 코드의 경계는 무엇인가?" 먼저 정의
- 새 코드는 반드시 특정 경계에 소속

### 모듈화
- 경계 = 모듈 폴더
- 구조: `module/index.ts` + `module/internal/`

### 캡슐화
- `index.ts`만 외부 노출 (Public API)
- `internal/*` 외부 import 금지

## 코드 규칙
- 같은 UI/로직 2회 이상 → 컴포넌트 분리
- 하드코딩 금지 → `constants/` 또는 설정 파일로 분리
- UTF-8 (BOM 없음), `encoding='utf-8'` 명시
- TypeScript strict mode, ESLint + Prettier 준수
- 모든 함수에 타입 명시, import는 상대경로
