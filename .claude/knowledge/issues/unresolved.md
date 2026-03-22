---
name: unresolved-issues
description: 남은 작업 — 2026-03-22 기준 (S38 반영, WI-191 완료)
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
| WI-166 | knowledge 동기화 (S34) | 완료 PR #210 |
| WI-167 | 세션 단위 팀 운영 + Tester completion gate 연동 | 완료 PR #211 |
| WI-167 | knowledge 동기화 (S35) | 완료 PR #212 |
| WI-169 | 리드 전체 파일 수정 차단 + 역할별 권한 제한 | 완료 PR #214 |
| WI-170 | DocOps 커밋 타이밍 규칙 + knowledge 동기화 (S36) | 완료 PR #216 |
| WI-171 | 팀 멤버 전원 상시 필수 | 완료 PR #217 |
| WI-172 | knowledge 동기화 (S36 WI-170/171) | 완료 PR #218 |
| WI-173 | Phase 5 DocOps 커밋 후 enqueue 순서 강제 | 완료 PR #219 |
| WI-174 | DocOps PR 상태 자동 갱신 | 완료 PR #220 |
| WI-175 | 프로젝트 permissions Write/Edit allow 추가 | 완료 PR #221 |
| WI-176 | 커밋 구조 변경 + Guardian 상시 감시 강제 | 완료 PR #223 |
| WI-177 | 에이전트별 git user.name 설정 | 완료 PR #224 |
| WI-178 | 머지 브랜치 커밋 차단 hook | 완료 PR #225 |
| WI-179 | DocOps만 커밋 가능 hook | 완료 PR #226 |

## ~~외부 API 연동~~ → WI-184 S38 완료
- 보조금24 API(api.odcloud.kr) 연동 구현 완료
- gov24-client.ts + /api/subsidies/sync + SubsidyTab UI 버튼

## ~~WI-190 조직도 ↔ 직원관리 양방향 CRUD~~ — S38 완료
- 조직도: 부서 클릭→직원 목록, 매니저 설정, 하위부서 생성
- 직원관리: 부서→조직도 링크, 직책 라벨 수정
- Guardian 데이터 흐름 추적 체크리스트 추가
- 직원 기본정보 수집(생년월일/성별/장애여부) 추가

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

## 코워크 검증 시스템 — 완료 (PR #185~211)
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
- 세션 단위 팀 운영 전환 (PR #211) — Guardian+DocOps 상시 가동
- Tester completion gate 연동 (PR #211) — TEST-PASS/TEST-FAIL 파일로 hook 연결
- delegate mode 전면 확장 (PR #214) — 리드 모든 파일 수정 차단 + 팀원 역할별 권한 제한
- 리드 완전 위임 모델 — requirements 작성도 DocOps에게 지시
- DocOps 커밋 타이밍 규칙 (WI-170) — PR 머지 후 같은 브랜치 추가 커밋 금지
- 팀 멤버 전원 상시 필수 (WI-171) — 전원(6명) 상시 spawn + 모든 커밋에 전원 필수

## knowledge 시스템 — 완료 (PR #190, #198)
- RAG 12파일 → knowledge/ 7카테고리 16파일 (discussions/ 추가)
- index.md 주제별 매핑 + 코워크 팀원별 기본 로드
- rag-context.md 업데이트

## 글로벌 시스템 통합 — 완료 (PR #192)
- CLAUDE.md 슬림화
- auto memory 인덱스 개편

## 미완료 — 시스템/인프라 (높음)

### ~~WI-181 코워크 자동 활성화~~ — 사용자 제외 결정
- 커밋 게이트(verify-on-commit.sh)로 충분하다고 판단
- 별도 구현 불필요

### ~~WI-182 SessionStart hook 검증~~ — S38 검증 완료
- 스크립트 수동 실행으로 오토컴팩트/clear 양쪽 정상 동작 확인

### ~~WI-183 TaskCompleted hook build false positive 수정~~ — S38 완료
- verify-task-completion.sh에서 lint/build/test 블록 제거
- Next.js dynamic route 오탐 문제 해결

### ~~WI-184 외부 API 연동 — 고용지원금~~ — S38 완료
- 보조금24 API 연동 구현 (gov24-client.ts + /api/subsidies/sync)
- SubsidyTab에 "정부 프로그램 동기화" 버튼 추가
- 기존 매칭 엔진 연동 유지

### ~~end-to-end 전체 플로우 테스트~~ — S38 완료
- 5단계 워크플로우를 실제 기능 PRD로 end-to-end 실행 완료 (WI-184 + WI-190)

### ~~WI-191 기본급 SSOT 트랜잭션 통합~~ — S38 완료
- 기본급 저장 시 employees + wage_configs 단일 트랜잭션 통합
- TeammateIdle hook lint/build 블록 제거 (Node 24 호환, test만 유지)
- verify-task-completion.sh build 스크립트 수정

## 보류 항목

### 다중 Implementer 병렬 테스트 — 보류
- 여러 Implementer가 동시에 src/ 수정 시 파일 충돌 방지 미검증

### SSOT 흐름 실검증 — 보류
- S38 사용자 지적으로 부분 해결 (리드 선제 검증 실패)
- 직원 상세 드로어 SSOT 허브 단일 출처 확인 미완

### console.error 정리 — 보류
- 프로덕션 배포 전 불필요한 console.error 제거

### 다른 프로젝트 코워크 주입 템플릿 — 보류
- 현재 ralph_FlowHR 전용 → 범용 템플릿 필요

### mem 스킬 legacy 전환 반영 — 보류
- mem:save/mem:load → knowledge/ 자동 체계로 전환 완료, 정리만 남음

## 인프라 변경 (S38)
- merge queue: SQUASH → MERGE 방식으로 변경

## 기타
- DocOps Stop hook 간헐적 미동작 (사용자 지적: "docops가 계속 안도는거같은데") — PR #198에서 강제화, WI-163에서 미커밋 파일 차단 추가
- rules 강제주입 한계: .claude/rules/ 파일이 유저 메시지로 취급 → 작업 압박 시 무시 가능 (S34 발견, WI-181 코워크 자동 활성화로 대응 예정)
