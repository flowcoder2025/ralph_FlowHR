#!/bin/bash
# TaskCompleted hook — 태스크 완료 시 검증 게이트
#
# 역할: 검증 팀원의 승인 없이 구현 태스크가 완료되는 것을 차단
# hook은 검증을 직접 수행하지 않음 — 검증 팀원의 결과 파일만 확인
#
# 플로우:
#   구현 팀원 → 태스크 완료 시도 → hook 발동
#   → 검증 팀원 승인 파일(.claude/verification/{task_id}.md) 확인
#   → PASS면 lint/build/test 후 통과
#   → 없거나 FAIL이면 차단 + 피드백
#
# exit 0 = 완료 허용, exit 2 = 완료 거부 + 피드백

export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8
export PYTHONUTF8=1

INPUT=$(cat)
TASK_ID=$(echo "$INPUT" | jq -r '.task_id // "unknown"')
TASK_SUBJECT=$(echo "$INPUT" | jq -r '.task_subject // "unknown"')
TEAMMATE=$(echo "$INPUT" | jq -r '.teammate_name // "unknown"')

echo "=== 태스크 완료 검증: $TASK_SUBJECT ===" >&2
echo "팀원: $TEAMMATE / ID: $TASK_ID" >&2

# ─── 검증/테스트 팀원은 자신의 태스크를 직접 완료할 수 있음 ───
# (검증 팀원의 태스크에 또 다른 검증을 요구하면 무한루프)
case "$TEAMMATE" in
  *verifier*|*검증*|*judge*|*심사*|*tester*|*테스트*|*guardian*|*감시*)
    echo "✅ 검증/감시/테스트 팀원 태스크 — 추가 검증 없이 완료 허용" >&2
    exit 0
    ;;
esac

# ─── 1단계: 검증 팀원 승인 확인 ───

VERIFICATION_DIR=".claude/verification"
VERIFICATION_FILE="$VERIFICATION_DIR/$TASK_ID.md"

if [ ! -f "$VERIFICATION_FILE" ]; then
  echo "❌ 검증 팀원의 승인이 없습니다." >&2
  echo "" >&2
  echo "검증 팀원이 다음 파일을 작성해야 합니다:" >&2
  echo "  $VERIFICATION_FILE" >&2
  echo "" >&2
  echo "파일 형식:" >&2
  echo "  첫 줄: PASS 또는 FAIL" >&2
  echo "  이후: 사유" >&2
  echo "" >&2
  echo "태스크 정보:" >&2
  echo "  ID: $TASK_ID" >&2
  echo "  제목: $TASK_SUBJECT" >&2
  exit 2
fi

# 승인 파일의 첫 줄 확인
RESULT=$(head -1 "$VERIFICATION_FILE" | tr -d '[:space:]')

if [ "$RESULT" = "FAIL" ]; then
  REASON=$(tail -n +2 "$VERIFICATION_FILE")
  echo "❌ 검증 팀원이 FAIL 판정했습니다:" >&2
  echo "$REASON" >&2
  echo "" >&2
  echo "FAIL 사유를 해결한 후 검증 팀원에게 재검증을 요청하세요." >&2
  exit 2
fi

if [ "$RESULT" != "PASS" ]; then
  echo "❌ 승인 파일 형식 오류: 첫 줄이 PASS 또는 FAIL이어야 합니다." >&2
  echo "현재 첫 줄: $RESULT" >&2
  exit 2
fi

echo "✅ 검증 팀원 승인 확인 (PASS)" >&2

# ─── 2단계: 기계적 검증 (lint/build/test) ───

npm run lint > /dev/null 2>&1
if [ $? -ne 0 ]; then
  echo "❌ lint 실패. 코드 스타일 문제를 수정하세요." >&2
  exit 2
fi

npm run build > /dev/null 2>&1
if [ $? -ne 0 ]; then
  echo "❌ build 실패. 컴파일 에러를 수정하세요." >&2
  exit 2
fi

npm test > /dev/null 2>&1
if [ $? -ne 0 ]; then
  echo "❌ test 실패. 테스트를 수정하세요." >&2
  exit 2
fi

echo "✅ 기계적 검증 통과 (lint/build/test)" >&2

# ─── 3단계: knowledge/ stale 체크 (DocOps 안전장치) ───

KNOWLEDGE_DIR=".claude/knowledge"
if [ -d "$KNOWLEDGE_DIR" ]; then
  STATE_FILE="$KNOWLEDGE_DIR/state.md"
  if [ -f "$STATE_FILE" ]; then
    # state.md의 마지막 수정 시각과 최근 커밋 시각 비교
    STATE_MOD=$(stat -c %Y "$STATE_FILE" 2>/dev/null || stat -f %m "$STATE_FILE" 2>/dev/null || echo 0)
    LATEST_COMMIT=$(git log -1 --format=%ct 2>/dev/null || echo 0)
    # state.md가 최근 커밋보다 1시간 이상 오래됐으면 stale
    DIFF_SEC=$((LATEST_COMMIT - STATE_MOD))
    if [ "$DIFF_SEC" -gt 3600 ]; then
      echo "⚠️ knowledge/state.md가 stale입니다 (${DIFF_SEC}초 전 업데이트). DocOps가 업데이트해야 합니다." >&2
      echo "DocOps 팀원이 없다면 리드가 직접 업데이트하세요." >&2
      # 경고만 — 차단하지 않음 (DocOps가 나중에 업데이트 가능)
    fi
  fi
fi

echo "✅ 태스크 '$TASK_SUBJECT' 완료 승인" >&2
exit 0
