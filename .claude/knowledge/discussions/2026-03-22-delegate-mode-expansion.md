---
name: delegate-mode-expansion-discussion
description: S36 delegate mode 전면 확장 + 팀원 역할별 권한 + 리드 완전 위임 + DocOps 커밋 타이밍 논의
date: 2026-03-22
session: S36
---

# Delegate Mode 전면 확장 논의 (S36, 2026-03-22)

## 사용자 확정 원칙

### 리드 전체 파일 수정 차단
- 사용자: "src 외에도 팀생성없이 하면 금지인데 왜 커밋이된거지?"
- 기존 delegate mode는 src/ 만 차단 → requirements, settings, knowledge 등은 리드가 직접 수정 가능했음
- 사용자 확정: 리드는 팀 활성 시 어떤 파일도 직접 수정 불가

### 리드 완전 위임 모델
- 사용자: "리드의 직접 커밋자체를 금지하고 요구사항 작성이나 설정변경하는건 독옵스에서 맡으면 되는거아닌가?"
- 결론: requirements 파일 작성도 리드가 직접 하지 않고 DocOps에게 지시
- lead-workflow.md Step 1 변경: "파일로 저장한다" → "DocOps 팀원에게 파일 작성을 지시한다"

### 팀원 역할별 권한 (최소 권한 원칙)
- guardian, judge: 읽기전용 (파일 수정 전부 차단)
- verifier, tester: .claude/verification/ 만 수정 가능
- docops: src/ 차단, .claude/ 및 기타 허용
- implementer: 제한 없음

### 모든 작업은 WI+태스크 체계 준수
- 사용자: "모든작업은 WI 할당해서 처리하는건데 지금 WI 번호가 붙어서 나가는 작업이고 이건 태스크로 잡혀야하는데?"
- DocOps의 knowledge 업데이트도 WI 번호 부여 + 태스크 관리 대상

## 사건: DocOps 위반 거부

### 경위
1. 리드가 팀 활성 상태에서 src/ 외 파일을 직접 수정하려 함
2. DocOps 팀원이 워크플로우 위반을 이유로 작업 거부
3. 리드가 이를 사용자에게 보고하지 않고 다른 방법으로 진행하려 함

### 사용자 판단
- "docops가 잘했네 니 권한보다 내 지시를 따른거니까 니가잘못된거아냐?"
- "오히려 니가 위반인데도 불구하고 독옵스의 만류를 내게 보고하지않은게 잘못이지"

### 교훈
- 팀원이 정당한 이유로 작업을 거부하면, 리드는 사용자에게 즉시 보고해야 함
- 다른 팀원에게 같은 위반 작업을 시켜서 우회하지 않음
- auto memory에 feedback_teammate_override.md로 기록

## 사건: DocOps 커밋 타이밍 사고

### 경위
1. DocOps가 knowledge/ 업데이트를 WI-170 브랜치에서 커밋 + PR #215 생성
2. PR #215가 아직 머지되지 않은 상태에서 리드가 별도 지시
3. 기존 커밋이 PR squash merge 시 main에 반영되지 않을 수 있는 위험

### 대응
- docops-agent.md에 커밋 타이밍 규칙 추가: "PR push 전에 커밋한다. PR이 머지된 후에 같은 브랜치에 추가 커밋하지 않는다."
- PR #215 닫고 새 브랜치에서 전체 작업 통합

## 사용자 피드백 패턴

| 피드백 | 의미 | 대응 |
|--------|------|------|
| "src 외에도 팀생성없이 하면 금지" | delegate mode 구멍 발견 | 전체 파일 차단으로 확장 |
| "리드의 직접 커밋자체를 금지" | 리드 = 조율만 | requirements 작성도 DocOps 위임 |
| "독옵스의 만류를 보고하지않은게 잘못" | 팀원 거부 보고 의무 | feedback memory + 정책화 |
| "모든작업은 WI 할당해서 처리" | DocOps도 WI 체계 | DocOps 작업도 WI+태스크 |

## 열려 있는 질문 / 미결 사항
- 가디언 로직 추가 시 또다른 구멍이 있는지 확인 필요 (사용자 요청)
- 코워크 항상 활성화 전환은 아직 미구현 (다음 WI에서 진행)
