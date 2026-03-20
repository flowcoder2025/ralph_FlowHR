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
.claude/requirements/        → 사용자 요구사항 (수정 불가)
.claude/verification/        → 검증 결과 (로컬)
.claude/plans/               → 계획 승인 (로컬)
.ralph/                      → Ralph Loop 설정
.github/                     → CI/CD 워크플로우
```

## 코워크 시스템
이 프로젝트는 Agent Teams + Hook으로 구현 품질을 강제합니다.

### 팀 구조
- **리드**: 조율만 (delegate mode — src/ 수정 불가)
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

### Knowledge 시스템
- `.claude/knowledge/index.md` — 주제별 로드 매핑
- 작업 시 주제에 맞는 knowledge 파일 자동 로드
- DocOps 에이전트가 자동 업데이트
