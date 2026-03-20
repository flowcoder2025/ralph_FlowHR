---
name: tab-refactor-history
description: 대형 파일 탭 분할 리팩토링 — 실패/성공 패턴, 교훈
type: reference
---

# 탭 분할 리팩토링

## 대상 파일 (1,100~1,450줄)
1. admin/leave/page.tsx (1,110줄)
2. admin/attendance/page.tsx
3. admin/people/page.tsx
4. admin/documents/page.tsx
5. admin/payroll/page.tsx

## 첫 시도: 실패 → revert

### 실패 원인
1. 각 탭이 자체 fetch → API 응답 형식 변경(`{data: ...}`)과 불일치
2. 부모의 공유 state/handler가 탭으로 전달 안 됨
3. 전체 5개를 한번에 분할해서 어디서 깨졌는지 파악 불가

### 증상
- 탭 버튼만 보이고 탭 내부 콘텐츠 렌더링 안 됨
- Employee schedule: "일정 정보를 불러오는 중..." 멈춤
- Employee requests: 신청 유형 버튼 없음
- Platform: 테넌트 추가 등 대시보드 콘텐츠 버튼 없음

## 두 번째 시도: 성공 (WI-125)

### 안전한 전략
1. 부모 page.tsx가 **데이터 fetch + state 관리 유지**
2. 탭 컴포넌트는 **순수 렌더링 (props로 데이터/핸들러 수신)**
3. **한 파일씩** 분할 → 빌드 → 실제 페이지 확인 → 다음 파일
4. 가장 작은 파일(leave 1,110줄)부터 시작

### Leave 분할 결과
- 1,110줄 → 225줄 (메인) + 3개 탭 (210+342+352줄)
- 대시보드 탭: KPI OK
- 정책 탭: 정책 추가/수정/비활성화 OK
- 신청큐 탭: 승인/반려/상세 OK

### 최종 결과
- 5개 파일 → 24개 탭 컴포넌트, 메인 97~120줄
- 기능 확인됨

## 교훈
- 탭 분할 시 데이터 fetch를 탭으로 이동하면 안 됨 (props 패턴 사용)
- 한 파일씩 분할하고 매번 확인
- API 응답 형식 변경과 동시에 탭 분할하면 안 됨 (한 번에 하나의 변경)
