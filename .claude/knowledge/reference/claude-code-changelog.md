---
name: claude-code-changelog
description: Claude Code 공식 체인지로그 (v2.1.0~2.1.80) — hooks, agents, teams, permissions 전체 이력
type: reference
---

# Claude Code 체인지로그 (2026-03-21 기준)

## 최신 버전: 2.1.80 (2026-03-19)

### Hook 관련 전체 이력

| 버전 | 날짜 | Hook 변경사항 |
|------|------|-------------|
| 2.1.80 | 03-19 | effort 프론트매터, MCP channels |
| 2.1.79 | 03-18 | `SessionEnd` hook 추가 |
| 2.1.78 | 03-17 | `StopFailure` hook 추가, Stop hooks 무한 루프 수정 |
| 2.1.76 | 03-14 | `Elicitation`, `ElicitationResult`, `PostCompact` hook 추가 |
| 2.1.75 | 03-13 | Hook source visibility (settings/plugin/skill) |
| 2.1.70 | 03-06 | `InstructionsLoaded` hook, agent_id/agent_type/worktree 메타데이터 |
| 2.1.63 | 02-28 | HTTP hooks (type: "http") 추가 |
| 2.1.50 | 02-20 | `WorktreeCreate`, `WorktreeRemove` hook 추가 |
| 2.1.47 | 02-18 | `last_assistant_message` Stop/SubagentStop 입력에 추가 |
| 2.1.33 | 02-06 | `TeammateIdle`, `TaskCompleted` hook 추가 |
| 2.1.10 | 01-17 | `Setup` hook 추가 |
| 2.1.9 | 01-16 | PreToolUse hooks `additionalContext` 반환 지원 |

### Hook 타입별 지원 이벤트 (확인된 것)

| 이벤트 | command | prompt | agent | http |
|--------|---------|--------|-------|------|
| PreToolUse | ✅ | ✅ | ❌ 에러* | ✅ |
| PostToolUse | ✅ | ✅ | ✅ | ✅ |
| Stop | ✅ | ✅ | ✅ (공식 예시) | ? |
| SessionStart | ✅ only | ❌ | ❌ | ❌ |
| TeammateIdle | ✅ | ? | ? | ? |
| TaskCompleted | ✅ | ? | ? | ? |

*PreToolUse에서 agent 타입: 공식 문서에는 지원이라 하나, 실제 테스트에서 에러 발생 (2026-03-21 확인)

### Agent Teams 이력

| 버전 | 날짜 | 변경사항 |
|------|------|---------|
| 2.1.80 | 03-19 | rate_limits 필드 추가 |
| 2.1.53 | 02-25 | Ctrl+F bulk agent kill |
| 2.1.50 | 02-20 | worktree 격리, background agents |
| 2.1.49 | 02-19 | --worktree 플래그, agent background: true |
| 2.1.47 | 02-18 | Agent Teams research preview |
| 2.1.33 | 02-06 | TeammateIdle, TaskCompleted hook |
| 2.1.32 | 02-05 | Agent Teams 최초 도입 (research preview) |

### Agent Teams 활성화
```json
{ "env": { "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1" } }
```

### Agent Teams 구조
- Team lead: 조율만 (delegate mode)
- Teammates: 독립 세션, 병렬 실행
- Task list: 공유, dependency tracking
- Mailbox: 에이전트 간 메시징
- TeammateIdle hook: 대기 시 exit 2로 피드백
- TaskCompleted hook: 완료 시 exit 2로 거부 가능

### Subagent 관련

| 버전 | 날짜 | 변경사항 |
|------|------|---------|
| 2.1.76 | 03-14 | deferred tools compaction 후 스키마 손실 수정 |
| 2.1.50 | 02-20 | isolation: "worktree" 지원 |
| 2.1.49 | 02-19 | SendMessage로 중단된 agent 재개 |
| 2.1.32 | 02-05 | subagent 모델 레거시 문자열 지원 |

### Permission 보안 변경

| 버전 | 날짜 | 변경사항 |
|------|------|---------|
| 2.1.77 | 03-17 | PreToolUse hook "allow" 반환 시 deny 규칙 우회 수정 |
| 2.1.74 | 03-12 | managed ask 규칙이 user allow로 우회 수정 |
| 2.1.38 | 02-10 | .claude/skills 쓰기 차단 |
| 2.1.34 | 02-06 | excluded commands bypass 수정 |
| 2.1.7 | 01-14 | wildcard rules shell operators 보안 강화 |

### Async Hooks
- command 타입만 지원
- `"async": true` — 백그라운드 실행, 차단 불가
- `"asyncRewake": true` — 백그라운드 + exit 2 시 모델 깨움
- prompt/agent 타입은 async 미지원

### Stop Hook 반환 형식
- command: `{"decision": "block", "reason": "..."}` 또는 exit 2
- prompt: `{"ok": false, "reason": "..."}`
- agent: `{"ok": false, "reason": "..."}` (공식 예시 있음)

### 주요 버그/제한사항
- Stop hooks 무한 루프: `stop_hook_active` 체크 필수 (2.1.78 수정)
- PreToolUse agent 타입: 에러 발생 (실테스트 확인)
- async hooks: 차단 불가 (side-effect only)
- Agent Teams: experimental, 세션 복구 제한

## 참조 URL
- 공식 체인지로그: https://code.claude.com/docs/en/changelog
- GitHub releases: https://github.com/anthropics/claude-code/releases
- Hooks 레퍼런스: https://code.claude.com/docs/en/hooks
- Hooks 가이드: https://code.claude.com/docs/en/hooks-guide
- Agent Teams: https://code.claude.com/docs/en/agent-teams
