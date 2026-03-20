#!/bin/bash
# TeammateIdle hook — 팀원이 idle 상태로 전환 전 품질 검증
# exit 0 = idle 허용, exit 2 = 피드백 전달 + 계속 작업
#
# 목적: 팀원이 "다 했어요"하고 멈추려 할 때
# 실제로 lint/build/test가 통과하는지, uncommitted 변경이 없는지 확인

export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8
export PYTHONUTF8=1

INPUT=$(cat)
TEAMMATE=$(echo "$INPUT" | jq -r '.teammate_name // "unknown"')
TEAM=$(echo "$INPUT" | jq -r '.team_name // "unknown"')

echo "=== 팀원 idle 검증: $TEAMMATE ===" >&2

# ─── 읽기 전용 팀원은 코드 수정/커밋 권한이 없으므로 스킵 ───
case "$TEAMMATE" in
  *guardian*|*감시*|*verifier*|*검증*|*judge*|*심사*)
    echo "✅ 읽기 전용 팀원 — idle 허용" >&2
    exit 0
    ;;
esac

# 1. uncommitted 변경 확인
UNSTAGED=$(git diff --name-only 2>/dev/null | wc -l)
STAGED=$(git diff --cached --name-only 2>/dev/null | wc -l)

if [ "$UNSTAGED" -gt 0 ] || [ "$STAGED" -gt 0 ]; then
  echo "❌ 커밋되지 않은 변경이 있습니다 (unstaged: $UNSTAGED, staged: $STAGED). 커밋하거나 원복하세요." >&2
  exit 2
fi

# 2. lint 확인 (exit code만 체크, stderr 오탐 방지)
npm run lint > /dev/null 2>&1
if [ $? -ne 0 ]; then
  echo "❌ lint 실패. 코드 스타일 문제를 수정하세요." >&2
  exit 2
fi

# 3. build 확인 (exit code만 체크, Next.js dynamic route 메시지 오탐 방지)
npm run build > /dev/null 2>&1
if [ $? -ne 0 ]; then
  echo "❌ build 실패. 컴파일 에러를 수정하세요." >&2
  exit 2
fi

# 4. test 확인
npm test > /dev/null 2>&1
if [ $? -ne 0 ]; then
  echo "❌ test 실패. 테스트를 수정하세요." >&2
  exit 2
fi

echo "✅ $TEAMMATE 품질 게이트 통과. idle 허용." >&2
exit 0
