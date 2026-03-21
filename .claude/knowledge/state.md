# 프로젝트 현재 상태

## 마지막 업데이트: 2026-03-22 (S34)

### 진행 현황
- PR #148~209 (62개 PR)
- S29~S30: 코워크 검증 시스템 완전 구축 (PR #185~204)
  - 7개 시스템 통합 아키텍처 확정 (Hook/코워크/CI/Rules/Auto memory/Knowledge/CLAUDE.md)
  - 코워크 실전 테스트 5회 (Guardian/Implementer/Verifier/Judge/Tester/DocOps 전원 확인)
  - DocOps 자율 정책 확립 (session JSONL 직접 읽기, 리드 의존 제거)
  - discussions/ 카테고리 추가 (대화 맥락 보존)
  - knowledge/ 재설계 완료 (RAG 12개 → 7카테고리)
  - 글로벌 시스템 통합 재편 (CLAUDE.md 슬림화, rules 통합)
- S31: WI-161 verify-on-commit.sh hook 강화 — 완료 (PR #205)
  - WI 번호 중복 차단 강화 (임계값 10 → 0, 경고 → 차단)
  - 빈 팀 우회 방지 (Guardian/DocOps 필수 멤버 확인)
  - CLAUDE.md 행동 가이드 추가
- S32: knowledge/ 동기화 (DocOps) — 완료 (PR #206)
- S33: WI-163 Stop hook 미커밋 파일 차단 + process.md 세션 규칙 — 완료 (PR #207)
- S33: WI-164 knowledge 동기화 — 완료 (PR #208)
- S34: WI-165 Guardian 파일 숙지 크로스체킹 Step 추가 — 완료 (PR #209)
  - guardian-agent.md에 Step 4 "리드 파일 숙지 크로스체킹" 추가
  - 리드가 작업 전 관련 파일을 실제로 읽었는지 검증
  - rules 강제주입이 유저 메시지 취급되어 무시될 수 있는 문제 대응

### 미완료 항목 (상세)

#### 높음
1. **end-to-end 전체 플로우 테스트** — 5단계 워크플로우를 실제 기능으로 처음부터 끝까지 실행
2. **Tester → completion gate 연동** — tester 결과가 TaskCompleted hook에 연결 안 됨
3. **SessionStart hook 검증** — 오토컴팩트/clear 양쪽에서 knowledge 주입 정상 동작 검증 필요
4. **WI-159 외부 API 연동** — 고용지원금 외부 API(고용24 등), hook에서 차단 확인됨
5. **코워크 항상 활성화 전환** — rules 강제주입이 유저 메시지로 취급되어 작업 압박 시 무시됨 → 코워크 항상 활성화로 첫 커밋에서 차단 필요

#### 중간
6. **TaskCompleted hook build false positive** — Next.js dynamic route 메시지 오탐
7. **다중 Implementer 병렬 테스트** — 파일 충돌 방지 미검증
8. **SSOT 흐름 실검증** — Admin→Employee 데이터 흐름

#### 낮음
9. console.error 정리 (프로덕션 배포 전)
10. 다른 프로젝트 코워크 주입 템플릿
11. mem 스킬 legacy 전환 반영

### 다음 작업 (우선순위: 시스템 → 기존 버그 → 신규 기능)

#### 1순위: 시스템/인프라 (도구 완성)
- 코워크 항상 활성화 전환 (rules 무시 방지 — 첫 커밋에서 차단)
- Tester → completion gate 연동 (tester 결과가 hook에 연결)
- SessionStart hook 검증 (오토컴팩트+clear 양쪽 커버 확인)
- end-to-end 전체 플로우 테스트 (5단계 처음부터 끝까지)

#### 2순위: 기존 버그
- TaskCompleted hook build false positive 수정
- console.error 정리

#### 3순위: 신규 기능
- WI-159 외부 API 연동 (고용지원금)

### 핵심 원칙 (다음 세션 필독)
- 7개 시스템 전부 강제 유지 — 하나도 풀면 안 됨
- 코워크+훅 조합으로 해결 — 코워크만으로 해결 X
- DocOps는 매 작업마다 자동 실행 — 수동 knowledge/ 수정 금지
- 사용자가 묻기 전에 gap을 스스로 찾아서 보고
- 형식적 테스트 금지 — 실질적 동작 확인 필수
- discussions/ 파일 참조 — 이전 세션 논의 맥락 확인
- WI 번호 분리 — 다른 작업은 다른 번호 (hook으로 강제 차단)
- hook 설계 시 구멍 금지 — 임계값/조건을 느슨하게 두지 말 것 (사용자 강력 지적)
- 코워크 마무리 우선 — 기능 작업보다 코워크(인프라) 완성이 먼저
- rules 강제주입은 유저 메시지 취급 — 작업 압박 시 무시될 수 있으므로 코워크+hook으로 보완 필수
- 작업 전 파일 숙지 검증 — Guardian이 리드의 파일 읽기 여부를 크로스체킹
