---
name: unresolved-issues
description: 남은 작업 — 2026-03-22 기준 (S34 반영, WI-165 Guardian 크로스체킹)
type: reference
---

# 남은 작업

## 급여/인사 시스템 (WI-154~161)
| WI | 내용 | 상태 |
|----|------|------|
| WI-154 | DB 스키마 확장 | 완료 PR #179 |
| WI-155 | 계산 엔진 + 세금 | 완료 PR #180 |
| WI-156 | API 확장 | 완료 PR #181 |
| WI-157 | Admin UI 7탭 | 완료 PR #182 |
| WI-158 | Employee 급여명세서 | 완료 PR #183 |
| WI-159 | 근로계약서 + 지원금 | 부분 완료 PR #184 (외부 API 미구현) |
| WI-160 | 코워크 시스템 구축 + 통합 검증 | 완료 PR #185~204 |
| WI-161 | verify-on-commit.sh hook 강화 | 완료 PR #205 (빈 팀 우회 방지 + WI 중복 차단 + CLAUDE.md 행동 가이드) |
| WI-162 | knowledge 동기화 | 완료 PR #206 |
| WI-163 | Stop hook 미커밋 파일 차단 + 세션 규칙 | 완료 PR #207 |
| WI-164 | knowledge 동기화 (S33) | 완료 PR #208 |
| WI-165 | Guardian 파일 숙지 크로스체킹 Step 추가 | 완료 PR #209 |

## 외부 API 연동 미구현
- 고용지원금: 사용자 결정 "외부 API 연동(고용24 등)"
- 현재: 내부 매칭 엔진만 구현, 실제 외부 API 호출 없음
- hook 검증에서 차단 확인됨

## Hook 검증 시스템 — 완료
- 요구사항 파일 수정 차단 (PreToolUse Write/Edit/MultiEdit)
- git commit 시 패턴 검증 (PreToolUse Bash)
- delegate mode 강제 (PreToolUse Write/Edit/MultiEdit)
- plan approval 강제 (PreToolUse Write/Edit/MultiEdit)
- TaskCompleted 검증 (태스크 완료 시 품질 게이트)
- TeammateIdle 검증 (팀원 유휴 시 품질 확인)
- Stop hook (knowledge 동기화 제안 + .claude/ 미커밋 파일 차단)
- 글로벌 버전 체크 (check-version.sh)
- WI 번호 중복 즉시 차단 (PR #205)
- 빈 팀 필수 멤버(Guardian/DocOps) 확인 (PR #205)
- Claude Code 버전 변경 감지 (check-version.sh)
- Guardian 파일 숙지 크로스체킹 (PR #209, Step 4 추가)

## 코워크 검증 시스템 — 완료 (PR #185~209)
- Agent Teams 활성화
- 에이전트 7개 정의 (lead-workflow, spawn-template, guardian, verifier, judge, tester, docops)
- Hook 8종 연결
- 스크립트 8개 구현
- Windows 경로 호환 (delegate mode hook)
- DocOps 자동 실행 강제 (PR #198)
- discussions/ 카테고리 추가
- 정리 완료 (구 RAG 삭제, 테스트 브랜치, 글로벌 MEMORY)
- 실전 코워크 워크플로우 테스트 3회 완료 (S30)
- CLAUDE.md 행동 가이드 추가 (PR #205)

## knowledge 시스템 — 완료 (PR #190, #198)
- RAG 12파일 → knowledge/ 7카테고리 16파일 (discussions/ 추가)
- index.md 주제별 매핑 + 코워크 팀원별 기본 로드
- rag-context.md 업데이트

## 글로벌 시스템 통합 — 완료 (PR #192)
- CLAUDE.md 슬림화
- auto memory 인덱스 개편

## 미완료 — 시스템/인프라 (높음)

### 코워크 항상 활성화 전환
- rules 강제주입이 유저 메시지로 취급되어 작업 압박 시 무시될 수 있음 (S34 발견)
- 사용자 확정: 코워크를 선택이 아닌 필수로, 첫 커밋에서 차단
- 구현 방법 미결: settings.json 변경? hook 추가? 항상 활성화 시 docs 전용 커밋도 full 팀 필요?

### end-to-end 전체 플로우 테스트
- 5단계 워크플로우를 실제 기능으로 처음부터 끝까지 실행
- 코워크 실전 테스트 3회 완료(S30)했으나 전체 흐름 검증은 미완

### Tester → completion gate 연동
- tester 결과가 TaskCompleted hook에 연결 안 됨
- Tester PASS/FAIL이 태스크 완료 게이트에 반영되지 않음

### SessionStart hook 검증
- 오토컴팩트와 /clear 양쪽에서 knowledge 주입이 정상 동작하는지 검증 필요
- S31 사용자 질문: "오토컴팩트든 그냥 컴팩트명령어 실행이든 다 커버되는거지?"

### TaskCompleted hook build false positive
- Next.js dynamic route 메시지를 실패로 오판
- S30에서 발견, 미수정

## 미완료 — 중간

### 다중 Implementer 병렬 테스트
- 여러 Implementer가 동시에 src/ 수정 시 파일 충돌 방지 미검증
- 코워크 아키텍처에서 병렬 구현 시나리오 테스트 필요

### SSOT 흐름 실검증
- Admin→Employee 데이터 흐름이 SSOT 원칙대로 동작하는지 실검증 필요
- 직원 상세 드로어(WI-151) SSOT 허브가 실제로 단일 출처 역할하는지 확인

## 미완료 — 낮음

### console.error 정리
- 프로덕션 배포 전 불필요한 console.error 제거

### 다른 프로젝트 코워크 주입 템플릿
- 현재 ralph_FlowHR 전용 → 범용 템플릿 필요
- .claude/ 하위 구조를 다른 프로젝트에 적용할 수 있도록

### mem 스킬 legacy 전환 반영
- mem:save/mem:load 수동 스킬 → knowledge/ 자동 체계로 전환
- S30 결정: DocOps 자동 관리로 일원화

## 기타
- DocOps Stop hook 간헐적 미동작 (사용자 지적: "docops가 계속 안도는거같은데") — PR #198에서 강제화, WI-163에서 미커밋 파일 차단 추가
- rules 강제주입 한계: .claude/rules/ 파일이 유저 메시지로 취급 → 작업 압박 시 무시 가능 (S34 발견, 코워크 항상 활성화로 대응 예정)
