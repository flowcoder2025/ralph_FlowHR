#!/bin/bash
# Delegate Mode 강제 — 팀 활성 시 리드의 모든 파일 수정 차단 + 팀원 역할별 권한 제한
# PreToolUse(Write|Edit|MultiEdit) hook
#
# 리드(lead): 팀이 활성화된 상태에서 어떤 파일도 직접 수정할 수 없다.
# 팀원: 역할(agent_type)에 따라 허용 범위가 다르다.
#   - guardian, judge: Write/Edit 전부 차단
#   - verifier, tester: .claude/verification/ 만 허용
#   - docops: src/ 차단, .claude/ 및 기타 허용
#   - implementer: 제한 없음

INPUT=$(cat)

# 팀이 활성화되어 있는지 확인
TEAM_DIR="$HOME/.claude/teams"
ACTIVE_TEAM=$(ls "$TEAM_DIR" 2>/dev/null | head -1)

if [ -z "$ACTIVE_TEAM" ]; then
  # 팀 없음 → 제한 없음
  exit 0
fi

# 수정 대상 파일 경로
FILE=$(echo "$INPUT" | jq -r '.tool_input.file_path // .tool_input.path // ""' 2>/dev/null)

# 팀원인지 확인 (agent_id가 있으면 팀원)
AGENT_ID=$(echo "$INPUT" | jq -r '.agent_id // ""' 2>/dev/null)

if [ -z "$AGENT_ID" ]; then
  # 리드 → 모든 파일 수정 차단
  echo "❌ [Delegate Mode] 팀이 활성화된 상태에서 리드는 파일을 직접 수정할 수 없습니다." >&2
  echo "수정 대상: $FILE" >&2
  echo "팀원에게 위임하세요. (DocOps, Implementer 등)" >&2
  exit 2
fi

# --- 팀원 역할별 권한 제한 ---
AGENT_TYPE=$(echo "$INPUT" | jq -r '.agent_type // ""' 2>/dev/null | tr '[:upper:]' '[:lower:]')

# guardian, judge: Write/Edit 전부 차단
if echo "$AGENT_TYPE" | grep -qE "(guardian|judge)"; then
  echo "❌ [Delegate Mode] $AGENT_TYPE 역할은 파일을 수정할 수 없습니다." >&2
  echo "수정 대상: $FILE" >&2
  echo "읽기 전용 역할입니다." >&2
  exit 2
fi

# verifier, tester: .claude/verification/ 만 허용
if echo "$AGENT_TYPE" | grep -qE "(verifier|tester)"; then
  if echo "$FILE" | grep -qi "[/\\\\]\.claude[/\\\\]verification[/\\\\]"; then
    exit 0
  fi
  echo "❌ [Delegate Mode] $AGENT_TYPE 역할은 .claude/verification/ 만 수정할 수 있습니다." >&2
  echo "수정 대상: $FILE" >&2
  exit 2
fi

# docops: src/ 차단, 나머지 허용
if echo "$AGENT_TYPE" | grep -qE "docops"; then
  if echo "$FILE" | grep -qi "[/\\\\]src[/\\\\]"; then
    echo "❌ [Delegate Mode] DocOps 역할은 src/ 를 수정할 수 없습니다." >&2
    echo "수정 대상: $FILE" >&2
    exit 2
  fi
  exit 0
fi

# implementer 및 기타: 제한 없음
exit 0
