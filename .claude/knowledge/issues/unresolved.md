---
name: unresolved-issues
description: 남은 작업 — 2026-03-21 기준 (PR #184까지 반영)
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
| WI-160 | 테스트 + 통합 검증 | ❌ 미시작 |

## 외부 API 연동 미구현
- 고용지원금: 사용자 결정 "외부 API 연동(고용24 등)"
- 현재: 내부 매칭 엔진만 구현, 실제 외부 API 호출 없음
- hook 검증에서 차단 확인됨

## Hook 검증 시스템
- ✅ 요구사항 파일 수정 차단 (PreToolUse Write)
- ✅ git commit 시 패턴 검증 (PreToolUse Bash)
- ✅ 글로벌 버전 체크 (SessionStart)
- ❌ AI 판단 검증 (코워크로 해결 예정)

## 코워크 검증 시스템
- 설계 완료, 구현 전
- 활성화: CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS
- 구조: 리드(delegate) + 구현 + 검증 + 테스트
- TeammateIdle + TaskCompleted hook으로 강제

## 기타
- console.error 정리 (프로덕션 배포 전)
- CLAUDE.md 규칙 축소 (hook으로 이관)
