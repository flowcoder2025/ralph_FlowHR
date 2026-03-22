# WI-184 외부 API 연동 — 고용지원금

## WI 번호: WI-184

## 요구사항
1. 보조금24 API 연동 모듈 구현 — GOV24_API_KEY로 /gov24/v3/serviceList 호출
2. 고용 관련 프로그램 자동 수집 — "고용" 분야 필터링 → SubsidyProgram DB에 upsert
3. 프로그램 상세 + 지원조건 반영 — serviceDetail + supportConditions → eligibilityCriteria 매핑
4. 동기화 API 엔드포인트 — /api/subsidies/sync POST → 외부 API 호출 → DB 동기화
5. UI에 "외부 동기화" 버튼 추가 — SubsidyTab 프로그램 관리에 "정부 프로그램 동기화" 버튼
6. 기존 내부 매칭 엔진 연동 유지 — 동기화된 프로그램도 기존 매칭 흐름 그대로 동작

## 사용자 결정사항
- 보조금24 API 사용 (행정안전부 대한민국 공공서비스 혜택 정보)
- API 키 발급 완료, .env에 GOV24_API_KEY로 설정
- Base URL: api.odcloud.kr/api
- 인증: 쿼리 serviceKey 방식

## 검증 기준
- /api/subsidies/sync POST 호출 시 보조금24 API에서 고용 관련 프로그램 수집 성공
- 수집된 프로그램이 SubsidyProgram 테이블에 upsert
- 기존 매칭 엔진(subsidy-matcher.ts)으로 매칭 실행 시 정상 동작
- UI에서 "정부 프로그램 동기화" 버튼 클릭 → 프로그램 목록 갱신
