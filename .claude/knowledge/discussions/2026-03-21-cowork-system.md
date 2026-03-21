---
name: cowork-system-discussion
description: S29 코워크 검증 시스템 구축 과정 전체 논의 기록
date: 2026-03-21
session: S29
---

# 코워크 검증 시스템 구축 논의 (S29, 2026-03-21)

## 사용자 확정 원칙

7개 시스템(Hook/코워크/CI/Rules/Auto memory/Knowledge/CLAUDE.md) **전부 강제 유지**:
- 하나라도 풀면 안 됨 -- "강제되던 이유가 있는데 강제를 풀면 안 되는 거 아냐?"
- "축소"가 아니라 "통합 재편" -- 역할 경계를 명확히 하되 강제는 유지
- hook = 결과물 게이트, auto memory = 사고 방식 강제, knowledge = 정보 강제
- DocOps는 수동이 아니라 **자동으로 매 작업마다** 돌아야 함
- 수동으로 knowledge/ 직접 수정 금지 -- 반드시 DocOps를 spawn

## 방향 전환 이력

1. **이전 세션(S28)**: hook으로 검증 시도
   - Stop + agent 조합 → 대화 차단
   - PreToolUse + agent → 에러
   - prompt 파일 못 읽음
   - grep 패턴 한계
   - 자가 검증 실패
   → 단독 hook으로는 충분한 검증 불가능

2. **사용자가 코워크 제안** → 확정
   - hook은 게이트로, 코워크는 실행 엔진으로 역할 분리

3. **이번 세션 초반**: 코워크 + hook 조합으로 구축
   - Agent Teams 활성화 + settings.json 구성
   - 에이전트 7개 정의
   - Hook 6종 연결

4. **단순 이식이 아니라 전면 재설계**
   - RAG 12파일 → knowledge/ 7카테고리 15파일
   - CLAUDE.md 슬림화 (규칙을 rules/ + hooks로 이관)
   - auto memory 인덱스 개편

5. **DocOps가 안 돌아서 Stop hook에 걸림**
   - Stop hook 강화 + DocOps 필수화
   - lead-workflow hook 강제 (src/ 커밋 시 팀 필수)

6. **discussions/ 추가**
   - 대화 맥락 보존 필요성 인식
   - decisions/는 "뭘 결정했는지", discussions/는 "어떤 과정을 거쳤는지"

## 사용자 피드백 패턴 (반복되는 지적)

| 피드백 | 의미 | 대응 |
|--------|------|------|
| "빠른 결과를 위해 누락시킨 건 없어?" | 속도 우선 경계 | 완전 구현 원칙 강화 |
| "형식적인 테스트 말고 실질적인 테스트해야 해" | 진짜 동작 확인 | Tester 에이전트 + 실제 브라우저 테스트 |
| "테스트 없이 PR 올리면 안 돼" | 검증 후 PR | 커밋 검증 hook + Verifier 에이전트 |
| "강제되던 이유가 있는데 강제를 풀면 안 되는 거 아냐?" | 강제 유지 | 7개 시스템 전부 강제 |
| "docops가 계속 안 도는 거 같은데" | DocOps 자동 실행 강제 | Stop hook + lead-workflow 내 DocOps 필수 |
| "설계 대비 누락 확인도 종합해줘" | 전수 조사 요구 | 자체 점검 체크리스트 강화 |
| "내가 묻지 않아도 피드백 장치로 놓치는 부분 커버되면 좋겠다" | 자체 점검 강화 | hook + 에이전트 자동 실행 |

## PR 이력 (14개)

| PR | 핵심 변경 |
|----|----------|
| #185 | 코워크 시스템 구축 (Agent Teams + settings.json) |
| #186 | Hook 버그 4건 수정 |
| #187 | 누락 6건 해결 |
| #188 | Delegate mode Windows 경로 호환 |
| #189 | Plan approval hook + spawn 템플릿 업데이트 |
| #190 | Knowledge 시스템 재설계 (RAG 12개 → 7카테고리) |
| #191 | 리드 워크플로우 5단계 정의 |
| #192 | 글로벌 시스템 통합 재편 |
| #193 | DocOps gap 3건 수정 |
| #194 | Main 직접 커밋 차단 hook |
| #195 | 누락 항목 일괄 수정 |
| #196 | Lead-workflow hook 강제 |
| #197 | 정리 (구 RAG, 테스트 브랜치, 글로벌 MEMORY) |
| #198 | DocOps 자동 실행 강제 |

## 열려 있는 질문 / 미결 사항

- 코워크 시스템 **첫 실전 검증 미완료** -- 실제 기능 작업(WI-161+)에서 전체 플로우 테스트 필요
- Tester → completion gate 연동 아직 미구현
- WI-159 외부 API 연동 (고용24 등) 결정 보류 중
- end-to-end 전체 플로우 테스트 미실행
