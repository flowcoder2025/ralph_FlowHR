#!/bin/bash
# Stop hook — 세션 종료 시 knowledge/ 업데이트 확인
# exit 2 = 세션 종료 차단 + 피드백 (DocOps 실행 요구)
# 코워크 모드에서는 DocOps 팀원이 담당하므로 스킵

export LANG=en_US.UTF-8

# 프로젝트 루트 탐지
PROJECT_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
KNOWLEDGE_DIR="$PROJECT_ROOT/.claude/knowledge"

if [ ! -d "$KNOWLEDGE_DIR" ]; then
  exit 0
fi

# 코워크 팀이 활성화되어 있으면 DocOps가 담당 → 스킵
TEAM_DIR="$HOME/.claude/teams"
ACTIVE_TEAM=$(ls "$TEAM_DIR" 2>/dev/null | head -1)

if [ -n "$ACTIVE_TEAM" ]; then
  exit 0
fi

# 단독 모드: 커밋된 변경이 있는지 확인
STATE_FILE="$KNOWLEDGE_DIR/state.md"
if [ ! -f "$STATE_FILE" ]; then
  exit 0
fi

# state.md의 마지막 수정 시각과 최근 커밋 시각 비교
STATE_MOD=$(stat -c %Y "$STATE_FILE" 2>/dev/null || stat -f %m "$STATE_FILE" 2>/dev/null || echo 0)
LATEST_COMMIT=$(git log -1 --format=%ct 2>/dev/null || echo 0)

DIFF_SEC=$((LATEST_COMMIT - STATE_MOD))

# 최근 커밋이 state.md보다 새로우면 → knowledge/ 미업데이트
if [ "$DIFF_SEC" -gt 300 ]; then
  echo "❌ [DocOps] knowledge/가 최신 커밋보다 오래됐습니다 (${DIFF_SEC}초 차이)." >&2
  echo "" >&2
  echo "세션을 종료하기 전에 다음을 수행하세요:" >&2
  echo "1. DocOps 에이전트를 spawn하세요 (수동 업데이트 금지)" >&2
  echo "2. DocOps가 knowledge/ 파일을 업데이트하게 하세요" >&2
  echo "3. DocOps 작업 완료 후 세션을 종료하세요" >&2
  echo "" >&2
  echo "DocOps spawn 방법:" >&2
  echo "  TeamCreate → TaskCreate(DocOps 업데이트) → Agent spawn(docops)" >&2
  echo "  spawn-template.md의 DocOps 예시 참조" >&2
  exit 2
fi

exit 0
