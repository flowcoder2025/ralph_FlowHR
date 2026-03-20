#!/bin/bash
# Stop hook — 세션 종료 시 knowledge/ 업데이트 안내
# Stop hook은 차단 불가 → 안내만 제공
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

# 단독 모드: 변경사항 확인
CHANGED=$(git diff --name-only 2>/dev/null | grep "^src/" | wc -l)

if [ "$CHANGED" -gt 0 ]; then
  echo "[DocOps] src/ 변경 ${CHANGED}개 감지. knowledge/ 업데이트가 필요합니다." >&2
  echo "다음 세션에서 knowledge/state.md와 관련 파일을 업데이트하세요." >&2
fi

exit 0
