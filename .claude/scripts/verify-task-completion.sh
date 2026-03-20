#!/bin/bash
# TaskCompleted hook — 태스크 완료 시 검증
# 1단계: 기계적 검증 (lint, build, test)
# 2단계: AI 판단 검증 (requirements 대조, 껍데기/SSOT/회피 감지)
# exit 0 = 완료 허용, exit 2 = 완료 거부 + 피드백

export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8
export PYTHONUTF8=1

INPUT=$(cat)
TASK_ID=$(echo "$INPUT" | jq -r '.task_id // "unknown"')
TASK_SUBJECT=$(echo "$INPUT" | jq -r '.task_subject // "unknown"')
TASK_DESC=$(echo "$INPUT" | jq -r '.task_description // ""')
TEAMMATE=$(echo "$INPUT" | jq -r '.teammate_name // "unknown"')

echo "=== 태스크 완료 검증: $TASK_SUBJECT ===" >&2
echo "팀원: $TEAMMATE / ID: $TASK_ID" >&2

# ─── 1단계: 기계적 검증 ───

# lint
if ! npm run lint --silent 2>/dev/null; then
  echo "❌ lint 실패. 코드 스타일 문제를 수정하세요." >&2
  exit 2
fi

# build
if ! npm run build --silent 2>/dev/null; then
  echo "❌ build 실패. 컴파일 에러를 수정하세요." >&2
  exit 2
fi

# test
if ! npm test --silent 2>/dev/null; then
  echo "❌ test 실패. 테스트를 수정하세요." >&2
  exit 2
fi

echo "✅ 기계적 검증 통과 (lint/build/test)" >&2

# ─── 2단계: AI 판단 검증 ───

# 요구사항 파일 수집
REQ_DIR=".claude/requirements"
REQ_FILES=$(find "$REQ_DIR" -name "*.md" 2>/dev/null)

# 요구사항 파일이 없으면 기계적 검증만으로 통과
if [ -z "$REQ_FILES" ]; then
  echo "✅ 요구사항 파일 없음 — 기계적 검증만으로 통과" >&2
  exit 0
fi

# 요구사항 내용 수집
REQUIREMENTS=""
for f in $REQ_FILES; do
  REQUIREMENTS="$REQUIREMENTS\n--- $(basename "$f") ---\n$(cat "$f")\n"
done

# 변경된 파일 목록 + diff
CHANGED_FILES=$(git diff --name-only HEAD~1 2>/dev/null || git diff --cached --name-only 2>/dev/null || echo "변경 파일 확인 불가")
DIFF_STAT=$(git diff --stat HEAD~1 2>/dev/null || git diff --cached --stat 2>/dev/null || echo "diff 확인 불가")
# 핵심 코드 diff (500줄 제한)
CODE_DIFF=$(git diff HEAD~1 -- '*.ts' '*.tsx' 2>/dev/null | head -500 || echo "")

# verifier/judge 지침 로드
VERIFIER=""
if [ -f ".claude/agents/verifier-agent.md" ]; then
  VERIFIER=$(cat .claude/agents/verifier-agent.md)
fi
JUDGE=""
if [ -f ".claude/agents/judge-agent.md" ]; then
  JUDGE=$(cat .claude/agents/judge-agent.md)
fi

# AI 검증 실행 (claude -p)
VERIFICATION=$(echo "" | claude -p "
당신은 코드 검증 에이전트입니다. 아래 정보를 기반으로 태스크 완료 여부를 판단하세요.

## 태스크
- 제목: $TASK_SUBJECT
- 설명: $TASK_DESC

## 사용자 원본 요구사항
$(echo -e "$REQUIREMENTS")

## 검증 지침
$VERIFIER

$JUDGE

## 변경된 파일
$CHANGED_FILES

## 변경 통계
$DIFF_STAT

## 코드 diff (주요 부분)
$CODE_DIFF

## 판단 기준
1. 요구사항이 실제로 구현되었는가? (껍데기/placeholder/TODO가 아닌 실제 로직)
2. 외부 API 연동 요구사항이 있으면 fetch/axios 호출이 실제로 존재하는가?
3. SSOT: Admin에서 생성한 데이터가 Employee에서 조회 가능한 경로가 있는가?
4. 회피 표현(향후, 나중에, Phase 2, temporary)이 없는가?
5. 하드코딩 배열/고정값 반환이 아닌 실제 DB 쿼리를 하는가?

## 응답 형식 (반드시 이 형식으로만)
PASS 또는 FAIL 한 줄, 그 아래에 사유.
예시:
PASS
모든 요구사항이 구현됨.

또는:
FAIL
외부 API 연동이 mock으로만 처리됨. fetch 호출이 없음.
" 2>/dev/null)

# AI 검증 결과 파싱
if echo "$VERIFICATION" | head -1 | grep -q "FAIL"; then
  REASON=$(echo "$VERIFICATION" | tail -n +2)
  echo "❌ AI 검증 실패: $REASON" >&2
  exit 2
fi

if echo "$VERIFICATION" | head -1 | grep -q "PASS"; then
  echo "✅ AI 검증 통과" >&2
  exit 0
fi

# AI 응답이 불명확하면 통과 (false positive 방지)
echo "⚠️ AI 검증 응답 불명확 — 통과 처리" >&2
exit 0
