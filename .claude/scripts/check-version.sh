#!/bin/bash
# SessionStart hook — Claude Code 버전 체크
# 현재 버전과 마지막 확인 버전을 비교하여 업데이트 필요 시 알림

VERSION_FILE=".claude/last-known-version.txt"
CURRENT_VERSION=$(claude --version 2>/dev/null | head -1)

if [ -z "$CURRENT_VERSION" ]; then
  exit 0
fi

# 마지막 확인 버전 읽기
LAST_VERSION=""
if [ -f "$VERSION_FILE" ]; then
  LAST_VERSION=$(cat "$VERSION_FILE" 2>/dev/null)
fi

# 버전이 다르면 업데이트 알림
if [ "$CURRENT_VERSION" != "$LAST_VERSION" ]; then
  # 현재 버전 저장
  echo "$CURRENT_VERSION" > "$VERSION_FILE"

  if [ -n "$LAST_VERSION" ]; then
    echo "{\"systemMessage\": \"⚠️ Claude Code 업데이트 감지: $LAST_VERSION → $CURRENT_VERSION. .claude/memory/rag/12-claude-code-changelog.md 를 업데이트하세요. 공식 체인지로그: https://code.claude.com/docs/en/changelog\"}"
  else
    echo "{\"systemMessage\": \"Claude Code 버전: $CURRENT_VERSION (최초 기록)\"}"
  fi
fi

exit 0
