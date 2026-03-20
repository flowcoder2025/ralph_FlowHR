#!/bin/bash
# Plan Approval 강제 — 계획 승인 없이 구현 시작 차단
# PreToolUse(Write|Edit|MultiEdit) hook
#
# 팀이 활성화된 상태에서 구현 팀원이 src/ 코드를 수정하려 할 때
# .claude/plans/{task_id}.md 승인 파일이 없으면 차단.
#
# 검증/감시/테스트 팀원과 리드는 이 체크를 스킵.

INPUT=$(cat)

# 팀이 활성화되어 있는지 확인
TEAM_DIR="$HOME/.claude/teams"
ACTIVE_TEAM=$(ls "$TEAM_DIR" 2>/dev/null | head -1)

if [ -z "$ACTIVE_TEAM" ]; then
  exit 0
fi

# 리드인지 확인 (agent_id 없으면 리드 → delegate mode hook이 처리)
AGENT_ID=$(echo "$INPUT" | jq -r '.agent_id // ""' 2>/dev/null)

if [ -z "$AGENT_ID" ]; then
  # 리드 → 이 hook은 팀원용, 리드는 delegate mode hook이 처리
  exit 0
fi

# 팀원 이름 확인 — 검증/감시/테스트 팀원은 스킵
AGENT_TYPE=$(echo "$INPUT" | jq -r '.agent_type // ""' 2>/dev/null)

case "$AGENT_TYPE" in
  *verifier*|*검증*|*judge*|*심사*|*tester*|*테스트*|*guardian*|*감시*)
    exit 0
    ;;
esac

# 수정 대상이 src/ 인지 확인
FILE=$(echo "$INPUT" | jq -r '.tool_input.file_path // .tool_input.path // ""' 2>/dev/null)

if ! echo "$FILE" | grep -qi "[/\\\\]src[/\\\\]"; then
  # src/ 외의 파일은 계획 없이도 수정 가능
  exit 0
fi

# 현재 진행 중인 태스크 ID 확인
# 태스크 디렉토리에서 이 에이전트가 owner인 in_progress 태스크를 찾음
TASK_DIR="$HOME/.claude/tasks/$ACTIVE_TEAM"
TASK_ID=""

if [ -d "$TASK_DIR" ]; then
  for f in "$TASK_DIR"/*.json; do
    [ -f "$f" ] || continue
    OWNER=$(jq -r '.owner // ""' "$f" 2>/dev/null)
    STATUS=$(jq -r '.status // ""' "$f" 2>/dev/null)
    if [ "$STATUS" = "in_progress" ]; then
      TASK_ID=$(jq -r '.id // ""' "$f" 2>/dev/null)
      break
    fi
  done
fi

if [ -z "$TASK_ID" ]; then
  # 태스크를 찾을 수 없으면 통과 (태스크 없이 작업하는 경우)
  exit 0
fi

# 계획 승인 파일 확인
PLAN_DIR=".claude/plans"
PLAN_FILE="$PLAN_DIR/$TASK_ID.md"

if [ ! -f "$PLAN_FILE" ]; then
  echo "❌ [Plan Approval] 구현 계획이 승인되지 않았습니다." >&2
  echo "" >&2
  echo "src/ 코드를 수정하기 전에:" >&2
  echo "1. 구현 계획을 리드에게 메시지로 보내세요" >&2
  echo "2. 리드가 승인하면 $PLAN_FILE 에 APPROVED가 작성됩니다" >&2
  echo "3. 그 후 구현을 시작하세요" >&2
  echo "" >&2
  echo "태스크 ID: $TASK_ID" >&2
  echo "수정 대상: $FILE" >&2
  exit 2
fi

# 승인 파일 내용 확인
RESULT=$(head -1 "$PLAN_FILE" | tr -d '[:space:]')

if [ "$RESULT" != "APPROVED" ]; then
  echo "❌ [Plan Approval] 계획이 아직 승인되지 않았습니다 (현재: $RESULT)" >&2
  exit 2
fi

echo "✅ 계획 승인 확인. 구현 진행." >&2
exit 0
