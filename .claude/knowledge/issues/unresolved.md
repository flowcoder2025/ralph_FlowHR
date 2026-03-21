---
name: unresolved-issues
description: 남은 작업 — 2026-03-21 기준 (PR #198까지 반영, S29 완료)
type: reference
---

# 남은 작업

## 급여/인사 시스템 (WI-154~160)
| WI | 내용 | 상태 |
|----|------|------|
| WI-154 | DB 스키마 확장 | ✅ PR #179 |
| WI-155 | 계산 엔진 + 세금 | ✅ PR #180 |
| WI-156 | API 확장 | ✅ PR #181 |
| WI-157 | Admin UI 7탭 | ✅ PR #182 |
| WI-158 | Employee 급여명세서 | ✅ PR #183 |
| WI-159 | 근로계약서 + 지원금 | ⚠️ PR #184 (외부 API 미구현) |
| WI-160 | 코워크 시스템 구축 + 통합 검증 | ✅ PR #185~198 (코워크 구축 완료, 실전 검증 미완) |

## 외부 API 연동 미구현
- 고용지원금: 사용자 결정 "외부 API 연동(고용24 등)"
- 현재: 내부 매칭 엔진만 구현, 실제 외부 API 호출 없음
- hook 검증에서 차단 확인됨

## Hook 검증 시스템 — ✅ 구축 완료
- ✅ 요구사항 파일 수정 차단 (PreToolUse Write/Edit/MultiEdit)
- ✅ git commit 시 패턴 검증 (PreToolUse Bash)
- ✅ delegate mode 강제 (PreToolUse Write/Edit/MultiEdit)
- ✅ plan approval 강제 (PreToolUse Write/Edit/MultiEdit)
- ✅ TaskCompleted 검증 (태스크 완료 시 품질 게이트)
- ✅ TeammateIdle 검증 (팀원 유휴 시 품질 확인)
- ✅ Stop hook (knowledge 동기화 제안)
- ✅ 글로벌 버전 체크 (check-version.sh)

## 코워크 검증 시스템 — ✅ 구축 완료 (PR #185~198)
- ✅ Agent Teams 활성화
- ✅ 에이전트 7개 정의 (lead-workflow, spawn-template, guardian, verifier, judge, tester, docops)
- ✅ Hook 8종 연결
- ✅ 스크립트 8개 구현
- ✅ Windows 경로 호환 (delegate mode hook)
- ✅ DocOps 자동 실행 강제 (PR #198)
- ✅ discussions/ 카테고리 추가
- ✅ 정리 완료 (구 RAG 삭제, 테스트 브랜치, 글로벌 MEMORY)
- 미검증: 실전 코워크 워크플로우 (첫 실전 대기 중)

## knowledge 시스템 — ✅ 재설계 완료 (PR #190, #198)
- ✅ RAG 12파일 → knowledge/ 7카테고리 16파일 (discussions/ 추가)
- ✅ index.md 주제별 매핑 + 코워크 팀원별 기본 로드
- ✅ rag-context.md 업데이트

## 글로벌 시스템 통합 — ✅ 재편 완료 (PR #192)
- ✅ CLAUDE.md 슬림화
- ✅ auto memory 인덱스 개편

## 기타
- console.error 정리 (프로덕션 배포 전)
- 코워크 첫 실전 검증 필요 (WI-161+ 기능 작업에서)
- Tester → completion gate 연동 미구현
