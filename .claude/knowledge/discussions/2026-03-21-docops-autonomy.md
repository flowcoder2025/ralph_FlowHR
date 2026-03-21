---
name: docops-autonomy-discussion
description: S30 DocOps 자율화 + 코워크 실전 테스트 + mem/RAG 통합 논의
date: 2026-03-21
session: S30
---

# DocOps 자율화 + 코워크 실전 테스트 논의 (S30, 2026-03-21)

## 사용자 확정 원칙

### DocOps 자율 정책
- DocOps는 리드에게 "이번 세션의 핵심 논의를 알려주세요"라고 요청하지 않는다
- session JSONL, git log, git diff를 직접 읽고 판단한다
- 리드의 역할은 "knowledge/ 업데이트해주세요" 한 마디뿐

### mem/RAG 통합 방향
- 사용자 인식: mem 스킬(save/load), RAG, decisions, rag-context 등이 2중3중4중 보조장치로 중첩되어 왔음
- 방향: knowledge/ 체계로 일원화, DocOps가 자동 관리
- mem:save/load의 수동 세이브 역할을 DocOps가 매 작업마다 자동 커버
- 다른 프로젝트에도 동일한 코워크 시스템을 주입할 예정 → 조건부 안내로 적용

### 7개 시스템 강제 유지 (재확인)
- S29에서 확정한 원칙을 재확인: "강제되던 이유가 있는데 강제를 풀면 안 되는 거 아냐?"
- 코워크+훅 조합으로 해결 (코워크만으로 해결 X)

## 방향 전환 이력

1. **S29 DocOps 첫 실행**: 리드에게 "핵심 논의 요약"을 요청하는 방식
   - 문제: 리드 요약이 축약/누락될 수 있음
   - 사용자 피드백: "핵심 논의만 간단히라는건 맘에안드는데?"
   → DocOps가 session JSONL을 직접 읽는 자율 방식으로 전환

2. **DocOps main 직접 커밋 사고**
   - DocOps가 knowledge/ 업데이트 후 main에 직접 커밋 (규칙 위반)
   - 사용자: "메인 직접커밋은 금지아닌가?"
   - verify-on-commit.sh hook으로 차단 확인 → 재발 방지 완료

3. **코워크 테스트 순서**
   - 사용자: "예시로 테스트만 진행해 본 구현건들은 잠시 멈춰두고 근본부터 모두 해결한뒤에 작업 재개"
   - 근본 해결 우선 원칙 재확인

4. **TaskCompleted hook false positive**
   - Next.js dynamic route 메시지("Error: Dynamic server usage")가 build 실패로 오판됨
   - 실제로는 exit code 0 (정상)이지만 hook이 stderr 텍스트를 감지
   - 미해결: 수정 필요

## 사용자 피드백 패턴 (반복되는 지적)

| 피드백 | 의미 | 대응 |
|--------|------|------|
| "내가 코딩을 잘 모르는 입장이니" | 기술 상세보다 결과/영향 중심 보고 | 보고 시 what/why 중심 |
| "잘못된 진행을 하고있는거같은데? 개발프로세스 브리핑해봐" | 프로세스 위반 감지 | 프로세스 준수 자가 점검 |
| "설계대비 누락된것 확인해봐" | 누락 전수 조사 요구 | 설계 문서 대비 체크리스트 |
| "형식적인 테스트말고 실질적인 테스트를해야해" | 진짜 동작 확인 (S29부터 반복) | 실제 브라우저 테스트 필수 |
| "내게 단편적인 내용만 보고하지말고 전체를 생각해서 확실하게 검토하고 보고해야지" | 종합적 보고 요구 | 부분 보고 금지, 전체 맥락 포함 |
| "니가 생각했을때 더 좋은방법이있나?" | 능동적 제안 요구 | 피동적 수행 대신 대안 제시 |

## 코워크 실전 테스트 결과

### 확인된 것
- Guardian: 요구사항 분배 검증 정상 동작 (누락/축소/변형 감지)
- Implementer: 구현 + 커밋 정상
- Verifier: FAIL 판정 후 수정 요청 → 재검증 PASS 흐름 동작
- Judge: 2차 코드 품질 검증 동작
- Tester: 실제 브라우저(Playwright MCP) 테스트 동작
- DocOps: knowledge/ 업데이트 + 커밋 (main 커밋 차단 hook 동작 확인)

### 미해결
- TaskCompleted hook build false positive (Next.js dynamic route 메시지)
- Tester → completion gate 연동 미구현
- DocOps Stop hook이 간헐적으로 동작 안 함 (사용자: "docops가 계속 안도는거같은데")

## 열려 있는 질문

- 오토컴팩트 시 대화 맥락 유실 대비: DocOps가 커버 가능한지, 추가 장치 필요한지
- 마켓플레이스 플러그인 활용 가능성 (사용자 요청으로 조사 시작)
