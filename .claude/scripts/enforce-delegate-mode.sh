#!/bin/bash
# Delegate Mode 강제 — 팀 활성 시 리드의 소스 코드 수정 차단
# PreToolUse(Write|Edit|MultiEdit) hook
#
# 팀이 활성화된 상태에서 리드(lead)가 직접 src/ 코드를 수정하려 하면 차단.
# 팀원(agent_id 존재)은 차단하지 않음.
# .claude/, CLAUDE.md 등 설정 파일은 리드도 수정 가능.

INPUT=$(cat)

# 팀이 활성화되어 있는지 확인
TEAM_DIR="$HOME/.claude/teams"
ACTIVE_TEAM=$(ls "$TEAM_DIR" 2>/dev/null | head -1)

if [ -z "$ACTIVE_TEAM" ]; then
  # 팀 없음 → 제한 없음
  exit 0
fi

# 팀원인지 확인 (agent_id가 있으면 팀원)
AGENT_ID=$(echo "$INPUT" | jq -r '.agent_id // ""' 2>/dev/null)

if [ -n "$AGENT_ID" ]; then
  # 팀원 → 제한 없음
  exit 0
fi

# 리드가 수정하려는 파일 경로 확인
FILE=$(echo "$INPUT" | jq -r '.tool_input.file_path // .tool_input.path // ""' 2>/dev/null)

if echo "$FILE" | grep -qi "[/\\\\]src[/\\\\]"; then
  echo "❌ [Delegate Mode] 팀이 활성화된 상태에서 리드는 소스 코드를 직접 수정할 수 없습니다." >&2
  echo "수정 대상: $FILE" >&2
  echo "팀원에게 위임하세요." >&2
  exit 2
fi

# src/ 외의 파일 (.claude/, CLAUDE.md, .gitignore 등)은 허용
exit 0
