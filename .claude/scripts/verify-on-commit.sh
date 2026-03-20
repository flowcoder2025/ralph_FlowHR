#!/bin/bash
# git commit 시 요구사항 검증
# PreToolUse(Bash) command hook

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // ""' 2>/dev/null)

# 1. git commit이 아니면 즉시 통과
if ! echo "$COMMAND" | grep -q "git commit"; then
  exit 0
fi

# 2. 요구사항 파일 확인
REQ_DIR=".claude/requirements"
REQ_FILES=$(find "$REQ_DIR" -name "*.md" 2>/dev/null)
if [ -z "$REQ_FILES" ]; then
  exit 0
fi

# 3. 요구사항 + git diff 수집
REQUIREMENTS=""
for f in $REQ_FILES; do
  REQUIREMENTS="$REQUIREMENTS\n=== $(basename $f) ===\n$(cat $f)\n"
done

DIFF=$(git diff --cached --stat 2>/dev/null)
# .claude/ 내부 파일(hook 스크립트, 에이전트 지침, 요구사항)은 검증 대상에서 제외
DIFF_CONTENT=$(git diff --cached -- ':!.claude/scripts/*' ':!.claude/agents/*' ':!.claude/requirements/*' 2>/dev/null | head -500)

echo "=== 요구사항 검증 시작 ===" >&2
echo "요구사항 파일: $(echo $REQ_FILES | wc -w)개" >&2
echo "변경 파일:" >&2
echo "$DIFF" >&2
echo "" >&2

# 4. 규칙 기반 체크
FAIL=0

# 4-1. 회피/하드코딩 패턴
MOCK_COUNT=$(echo "$DIFF_CONTENT" | grep -c "const mock\|const dummy\|const sample\|const fake\|TODO\|FIXME\|HACK" 2>/dev/null || true)
MOCK_COUNT=${MOCK_COUNT:-0}
DEFER_COUNT=$(echo "$DIFF_CONTENT" | grep -c "향후\|나중에\|Phase 2\|추후\|placeholder\|임시\|temporary\|skip" 2>/dev/null || true)
DEFER_COUNT=${DEFER_COUNT:-0}
if [ "$MOCK_COUNT" -gt 0 ] || [ "$DEFER_COUNT" -gt 0 ]; then
  echo "❌ 회피/하드코딩 패턴 감지 (mock:$MOCK_COUNT, 회피:$DEFER_COUNT)" >&2
  FAIL=1
fi

# 4-1b. 껍데기 구현 패턴
SHELL_COUNT=0
# 빈 함수 본문 (return만 있는 함수)
EMPTY_RETURN=$(echo "$DIFF_CONTENT" | grep -c "{ return; }\|{ return null; }\|{ return \[\]; }\|{ return {}; }\|=> {}" 2>/dev/null || true)
EMPTY_RETURN=${EMPTY_RETURN:-0}
# alert만 있는 onClick
ALERT_ONLY=$(echo "$DIFF_CONTENT" | grep -c "onClick.*alert(\|onClick.*console\.log(" 2>/dev/null || true)
ALERT_ONLY=${ALERT_ONLY:-0}
# 하드코딩 배열을 반환하는 API
HARDCODED_ARRAY=$(echo "$DIFF_CONTENT" | grep -c "NextResponse\.json.*\[.*{.*id:.*name:" 2>/dev/null || true)
HARDCODED_ARRAY=${HARDCODED_ARRAY:-0}
# 주석으로만 된 구현
COMMENT_ONLY=$(echo "$DIFF_CONTENT" | grep -c "// 구현 예정\|// 미구현\|// not implemented" 2>/dev/null || true)
COMMENT_ONLY=${COMMENT_ONLY:-0}
SHELL_COUNT=$((EMPTY_RETURN + ALERT_ONLY + HARDCODED_ARRAY + COMMENT_ONLY))
if [ "$SHELL_COUNT" -gt 0 ]; then
  echo "❌ 껍데기 구현 패턴 감지 (빈함수:$EMPTY_RETURN, alert:$ALERT_ONLY, 하드코딩응답:$HARDCODED_ARRAY, 미구현주석:$COMMENT_ONLY)" >&2
  FAIL=1
fi

# 4-2. 외부 API 연동 체크
if echo "$REQUIREMENTS" | grep -q "외부.*API\|API.*연동"; then
  FETCH_COUNT=$(echo "$DIFF_CONTENT" | grep -c "fetch(\|axios\.\|http\.get\|http\.post" 2>/dev/null || true)
  FETCH_COUNT=${FETCH_COUNT:-0}
  if [ "$FETCH_COUNT" -eq 0 ]; then
    # 기존 코드에 이미 있는지도 확인
    EXISTING_FETCH=$(git diff --cached --name-only 2>/dev/null | xargs grep -l "fetch(\|axios\." 2>/dev/null | head -1)
    if [ -z "$EXISTING_FETCH" ]; then
      echo "❌ 외부 API 연동 요구사항이 있으나 fetch/axios 호출이 없습니다" >&2
      FAIL=1
    fi
  fi
fi

# 4-3. SSOT 연결 체크 — 신규 API가 있는데 기존 연결 안 됨
NEW_API=$(git diff --cached --name-only 2>/dev/null | grep "src/app/api/" | head -1)
if [ -n "$NEW_API" ]; then
  # Employee API가 있는지 (Admin→Employee SSOT)
  HAS_EMPLOYEE_API=$(git diff --cached --name-only 2>/dev/null | grep "src/app/api/employee/" | head -1)
  ADMIN_ONLY=$(git diff --cached --name-only 2>/dev/null | grep "src/app/api/" | grep -v "employee" | head -1)
  if [ -n "$ADMIN_ONLY" ] && [ -z "$HAS_EMPLOYEE_API" ]; then
    echo "❌ Admin API 변경이 있으나 Employee API 연결이 없습니다 (SSOT)" >&2
    FAIL=1
  fi
fi

# 4-4. RAG 업데이트 체크
if [ -n "$NEW_API" ]; then
  RAG_UPDATED=$(git diff --cached --name-only 2>/dev/null | grep "\.claude/memory/rag/" | head -1)
  if [ -z "$RAG_UPDATED" ]; then
    echo "❌ API 변경이 있으나 RAG 파일이 업데이트되지 않았습니다" >&2
    FAIL=1
  fi
fi

# 5. 결과
if [ "$FAIL" -eq 1 ]; then
  echo "" >&2
  echo "=== 검증 실패: 커밋이 차단되었습니다 ===" >&2
  exit 2
fi

echo "✅ 검증 통과" >&2
exit 0
