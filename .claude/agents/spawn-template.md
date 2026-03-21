# 팀원 Spawn 프롬프트 템플릿

리드가 팀원을 spawn할 때 반드시 포함해야 하는 항목입니다.
이 템플릿을 따르지 않으면 팀원이 컨텍스트 부족으로 품질이 떨어집니다.

## 필수 포함 항목

### 1. 역할 지정
```
당신은 {역할} 팀원입니다. .claude/agents/{역할}-agent.md 지침을 읽고 따르세요.
```

### 2. 요구사항 참조
```
반드시 .claude/requirements/ 디렉토리의 요구사항을 직접 읽으세요.
리드의 지시만 따르지 말고 요구사항 원본을 참조하세요.
요구사항이 SSOT입니다.
```

### 3. RAG 슬라이스 (역할별)
| 역할 | 읽어야 할 RAG |
|------|-------------|
| implementer | `03-api-design.md`, `04-crud-business.md`, `10-pages-map.md` |
| verifier | `05-ssot-issues.md`, `08-unresolved.md`, `11-decisions-log.md` |
| tester | `06-e2e-testing.md`, `10-pages-map.md` |
| guardian | `08-unresolved.md`, `11-decisions-log.md` |

```
.claude/knowledge/ 디렉토리에서 다음 파일을 읽고 참고하세요: {해당 RAG 파일 목록}
```

### 4. 태스크 지정
```
태스크 #{N}을 owner로 claim하고 시작하세요.
```

### 5. 커밋 규칙 (implementer만)
```
논리적 단위마다 즉시 커밋하세요.
커밋 형식: WI-{NNN}-{type} 한글 작업명
```

### 6. 완료 후 행동
```
구현 완료 후 verifier 팀원에게 메시지로 검증 요청하세요.
```
또는
```
검증 완료 후 .claude/verification/{task_id}.md에 PASS/FAIL 작성하세요.
```

### 7. Plan Approval (implementer만)
```
구현 전에 반드시 계획을 리드에게 메시지로 보내세요.
리드가 승인하면 .claude/plans/{task_id}.md에 APPROVED가 작성됩니다.
승인 전에 src/ 코드를 수정하면 hook이 차단합니다.
```

## 예시: implementer spawn

```
당신은 구현 팀원입니다.

태스크 #2: {태스크 설명}

반드시 지켜야 할 것:
- .claude/requirements/{파일}.md를 직접 읽고 요구사항을 확인하세요
- .claude/knowledge/03-api-design.md, 04-crud-business.md를 읽고 기존 패턴을 따르세요
- 구현 전에 계획을 리드에게 메시지로 보내세요 (승인 전 src/ 수정 불가)
- 기존 코드 구조를 깨뜨리지 마세요
- 구현 완료 후 verifier 팀원에게 메시지로 검증 요청하세요
- 커밋 시 `git -c user.name="Implementer" commit -m "..."` 사용
- 논리적 단위마다 즉시 커밋하세요
- 태스크 #2를 owner로 claim하고 시작하세요
```

## 예시: docops spawn

```
당신은 DocOps 팀원입니다. .claude/agents/docops-agent.md 지침을 읽고 따르세요.

태스크 #{N}: 이번 작업의 knowledge/ 업데이트

반드시 지켜야 할 것:
- .claude/knowledge/index.md의 업데이트 트리거를 참고하세요
- state.md, history/timeline.md, decisions/log.md, issues/unresolved.md 업데이트
- 현재 작업 브랜치에서 커밋하세요 (main 직접 커밋 금지)
- 커밋 형식: WI-{NNN}-docs knowledge 업데이트
- 완료 후 리드에게 업데이트 요약 보고
- 태스크 #{N}을 owner로 claim하고 시작하세요
```
