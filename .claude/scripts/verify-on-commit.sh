#!/bin/bash
# git commit 시 요구사항 검증
# PreToolUse(Bash) command hook

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // ""' 2>/dev/null)

# 1. git commit이 아니면 즉시 통과
if ! echo "$COMMAND" | grep -q "git commit"; then
  exit 0
fi

# 1-1. main/master 브랜치 직접 커밋 차단
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)
if [ "$CURRENT_BRANCH" = "main" ] || [ "$CURRENT_BRANCH" = "master" ]; then
  echo "❌ main/master 브랜치에 직접 커밋할 수 없습니다." >&2
  echo "브랜치를 생성한 후 작업하세요." >&2
  echo "현재 브랜치: $CURRENT_BRANCH" >&2
  exit 2
fi

# 1-1b. 머지된 PR 브랜치에서 커밋 차단
MERGED_PR=$(gh pr list --head "$CURRENT_BRANCH" --state merged --json number --jq '.[0].number' 2>/dev/null)
if [ -n "$MERGED_PR" ] && [ "$MERGED_PR" != "null" ]; then
  echo "❌ 이 브랜치의 PR #$MERGED_PR이 이미 머지됐습니다. 새 브랜치를 만드세요." >&2
  exit 2
fi

# 1-2. WI 번호 중복 차단 — 같은 WI로 머지된 PR이 이미 있으면 차단
BRANCH_WI=$(echo "$CURRENT_BRANCH" | grep -oE 'WI-[0-9]+' | head -1)
if [ -n "$BRANCH_WI" ]; then
  # 머지된 커밋 중 같은 WI 번호가 있는지 확인
  WI_MERGED=$(git log --oneline --merges origin/main --grep="$BRANCH_WI" 2>/dev/null | wc -l)
  WI_DIRECT=$(git log --oneline --no-merges origin/main --grep="$BRANCH_WI" 2>/dev/null | wc -l)
  WI_TOTAL=$((WI_MERGED + WI_DIRECT))
  WI_TOTAL=${WI_TOTAL:-0}
  if [ "$WI_TOTAL" -gt 0 ]; then
    echo "❌ $BRANCH_WI 로 이미 ${WI_TOTAL}개 커밋이 머지되어 있습니다." >&2
    echo "다른 작업이면 새 WI 번호로 브랜치를 생성하세요." >&2
    exit 2
  fi
fi

# 1-3. 활성 팀 필수 (Guardian + DocOps는 모든 작업에서 필수)
SRC_IN_COMMIT=$(git diff --cached --name-only 2>/dev/null | grep "^src/" | head -1)
TEAM_DIR="$HOME/.claude/teams"
ACTIVE_TEAM=$(ls "$TEAM_DIR" 2>/dev/null | head -1)

if [ -z "$ACTIVE_TEAM" ]; then
  if [ -n "$SRC_IN_COMMIT" ]; then
    echo "❌ src/ 파일을 변경하려면 full 코워크 팀을 구성해야 합니다." >&2
    echo "필수 팀원: Guardian + Implementer + Verifier + Tester + DocOps" >&2
  else
    echo "❌ 코드 변경 시 전원 (Guardian, DocOps, Implementer, Verifier, Tester, Judge) 팀을 구성해야 합니다." >&2
    echo "Guardian: WI 번호 + 요구사항 검증 / DocOps: knowledge/ 업데이트 / Implementer: 구현 / Verifier: 검증 / Tester: 테스트 / Judge: 재평가" >&2
  fi
  echo "lead-workflow를 따라 팀을 구성한 후 작업하세요:" >&2
  echo "  1. 요구사항 확정 → 2. 설계 → 3. 팀 구성 → 4. 실행 → 5. 마무리" >&2
  exit 2
fi

# 1-4. 팀 구성원 확인 — 빈 팀 또는 필수 멤버 누락 차단
TEAM_CONFIG="$TEAM_DIR/$ACTIVE_TEAM/config.json"
if [ -f "$TEAM_CONFIG" ]; then
  HAS_GUARDIAN=$(jq -r '.members[]?.name // empty' "$TEAM_CONFIG" 2>/dev/null | grep -i "guardian" | head -1)
  HAS_DOCOPS=$(jq -r '.members[]?.name // empty' "$TEAM_CONFIG" 2>/dev/null | grep -i "docops" | head -1)
  HAS_IMPLEMENTER=$(jq -r '.members[]?.name // empty' "$TEAM_CONFIG" 2>/dev/null | grep -i "implementer" | head -1)
  HAS_VERIFIER=$(jq -r '.members[]?.name // empty' "$TEAM_CONFIG" 2>/dev/null | grep -i "verifier" | head -1)
  HAS_TESTER=$(jq -r '.members[]?.name // empty' "$TEAM_CONFIG" 2>/dev/null | grep -i "tester" | head -1)
  HAS_JUDGE=$(jq -r '.members[]?.name // empty' "$TEAM_CONFIG" 2>/dev/null | grep -i "judge" | head -1)

  if [ -z "$HAS_GUARDIAN" ] || [ -z "$HAS_DOCOPS" ] || [ -z "$HAS_IMPLEMENTER" ] || [ -z "$HAS_VERIFIER" ] || [ -z "$HAS_TESTER" ] || [ -z "$HAS_JUDGE" ]; then
    echo "❌ 팀에 필수 멤버가 없습니다. 전원 (Guardian, DocOps, Implementer, Verifier, Tester, Judge) 필수." >&2
    [ -z "$HAS_GUARDIAN" ] && echo "  - Guardian 없음 (WI 번호 + 요구사항 검증)" >&2
    [ -z "$HAS_DOCOPS" ] && echo "  - DocOps 없음 (knowledge/ 업데이트)" >&2
    [ -z "$HAS_IMPLEMENTER" ] && echo "  - Implementer 없음 (구현)" >&2
    [ -z "$HAS_VERIFIER" ] && echo "  - Verifier 없음 (요구사항 대비 검증)" >&2
    [ -z "$HAS_TESTER" ] && echo "  - Tester 없음 (Playwright MCP CRUD 테스트)" >&2
    [ -z "$HAS_JUDGE" ] && echo "  - Judge 없음 (2차 재평가)" >&2
    echo "빈 팀으로 우회하지 마세요. 필수 멤버를 전원 spawn하세요." >&2
    exit 2
  fi
fi

# 2. 요구사항 파일 확인
# 브랜치명에서 WI 번호 추출하여 해당 requirements만 체크
# 매칭 안 되면 전체 requirements 체크
REQ_DIR=".claude/requirements"
WI_NUM=$(echo "$CURRENT_BRANCH" | grep -oE 'WI-[0-9]+' | head -1)
if [ -n "$WI_NUM" ]; then
  # 브랜치에 WI 번호가 있으면 해당 requirements만 + 글로벌(global-system-cleanup 등)
  REQ_FILES=$(find "$REQ_DIR" -name "*.md" 2>/dev/null | grep -v "global-system" || true)
else
  REQ_FILES=$(find "$REQ_DIR" -name "*.md" 2>/dev/null)
fi
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

# 4-2. 외부 API 연동 체크 (소스 코드 변경이 있을 때만)
SRC_CHANGED=$(git diff --cached --name-only 2>/dev/null | grep "^src/" | head -1)
if [ -n "$SRC_CHANGED" ] && echo "$REQUIREMENTS" | grep -q "외부.*API\|API.*연동"; then
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
