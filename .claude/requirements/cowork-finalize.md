# 코워크 시스템 마무리 요구사항

## 요구사항

### 1. 구 RAG 파일 삭제
- .claude/memory/rag/ 디렉토리의 13개 파일 삭제
- knowledge/로 마이그레이션 완료됨 — 원본 제거
- .claude/memory/MEMORY.md (프로젝트)도 정리 (RAG 인덱스 제거)

### 2. 테스트 브랜치 정리
- test/WI-160-test-cowork-flow 삭제
- test/WI-160-test-fail-and-plan 삭제
- test/WI-999-test-req-scope 삭제
- 로컬 + 리모트 모두

### 3. 글로벌 MEMORY.md Lessons 정리
- knowledge/lessons/global.md로 이관된 교훈들을 글로벌 MEMORY.md에서 정리
- 글로벌 MEMORY.md는 "User Preferences" + "Global Patterns" 핵심만 유지
- 프로젝트별 교훈(ComfyUI, 게임 등)은 해당 프로젝트 전용으로 분리

### 4. Tester → completion gate 연동
- verify-task-completion.sh에 tester 결과 확인 추가
- tester가 .claude/verification/{task_id}-test.md에 테스트 결과 작성
- 구현 태스크 완료 시 verifier PASS + tester PASS 둘 다 필요

## 검증 기준
- .claude/memory/rag/ 디렉토리가 비어있거나 삭제됨
- 테스트 브랜치가 로컬/리모트 모두 없음
- 글로벌 MEMORY.md가 간결해짐 (Lessons 30개+ → 핵심만)
- Tester PASS 없이 구현 태스크 완료 시 hook 차단 확인
