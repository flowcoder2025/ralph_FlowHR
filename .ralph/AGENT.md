# ralph_FlowHR - Agent Commands

## 프로젝트 타입
TypeScript (Node.js 20) - Next.js 14 App Router

## 기술 스택
- **프레임워크**: Next.js 14+ (App Router)
- **언어**: TypeScript (strict mode)
- **DB**: PostgreSQL + Prisma ORM
- **인증**: NextAuth.js
- **스타일링**: Tailwind CSS
- **테스트**: Vitest (유닛) + Playwright (E2E)
- **검증**: Zod
- **폼**: React Hook Form
- **차트**: Recharts
- **날짜**: date-fns

## 명령어

### 의존성 설치
```bash
npm ci
```

### Lint
```bash
npm run lint
```

### Build
```bash
npm run build
```

### 유닛 테스트
```bash
npm test
```

### E2E 테스트
```bash
npx playwright test
```

### DB 마이그레이션
```bash
npx prisma migrate dev
```

### DB 시드
```bash
npx prisma db seed
```

### Prisma 클라이언트 생성
```bash
npx prisma generate
```

### 전체 검증 (순서대로)
```bash
npm run lint && npm run build && npm test
```

## 아키텍처 규칙
- 모듈 구조: `src/modules/{domain}/index.ts` (Public) + `internal/` (Private)
- 외부에서 `internal/` 직접 import 금지
- 같은 UI/로직 2회 이상 → 컴포넌트 분리 (shared/)
- 하드코딩 금지 → constants/ 또는 환경변수
- UTF-8 (BOM 없음) 필수

## 와이어프레임 참조
원본 와이어프레임: `C:\Team-jane\FlowHR_V2\flowhr-ui\`
- admin/: 관리자 11개 화면
- employee/: 직원 6개 화면
- platform/: 플랫폼 콘솔
- css/design-system.css: 디자인 토큰
