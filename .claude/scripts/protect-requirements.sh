#!/bin/bash
# 사용자 원본 요구사항 파일 수정 차단
# PreToolUse hook에서 Write|Edit|MultiEdit 시 실행

INPUT=$(cat)

# jq로 file_path 추출 (jq 없으면 grep fallback)
if command -v jq &>/dev/null; then
  FILE=$(echo "$INPUT" | jq -r '.tool_input.file_path // .tool_input.path // ""' 2>/dev/null)
else
  FILE=$(echo "$INPUT" | grep -o '"file_path"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed 's/.*"file_path"[[:space:]]*:[[:space:]]*"//;s/"//')
  if [ -z "$FILE" ]; then
    FILE=$(echo "$INPUT" | grep -o '"path"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed 's/.*"path"[[:space:]]*:[[:space:]]*"//;s/"//')
  fi
fi

if echo "$FILE" | grep -q "\.claude/requirements/"; then
  echo "❌ 차단: 사용자 원본 요구사항 파일은 수정할 수 없습니다." >&2
  echo "파일: $FILE" >&2
  exit 2
fi

exit 0
