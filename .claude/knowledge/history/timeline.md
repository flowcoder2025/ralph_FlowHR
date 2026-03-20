---
name: session-timeline
description: 전체 세션 타임라인 (2026-03-13 ~ 2026-03-20)
type: reference
---

# 세션 타임라인

| 세션 | 날짜 | 핵심 작업 |
|------|------|-----------|
| S01~S18 | 03-13 | Phase 1~17 완료 (78 WI) |
| S19~S23 | 03-13~14 | E2E + Ralph Loop v2 + 디버깅 |
| S24 | 03-16 | Phase 18~20 (WI-079~125) |
| S25 | 03-16~17 | PR #148~158 (UTC, GPS, 보안, UX) |
| S26 | 03-17 | PR #159~165 (다크모드, 복합기능, 접근제어, 테스트, 직급) |
| S27 | 03-17~20 | PR #166~174 (정정신청, 문서발송, GPS지도, PWA, 모바일UI, 포괄임금) |

## S26 PR 이력 (18개)
| PR | 내용 |
|----|------|
| #148~149 | UTC 날짜 통일 + seed userId + gitignore |
| #150 | GPS 출퇴근 위치 검증 |
| #151 | 커스텀 리포트 + 결제 설정 |
| #152~154 | Employee 버그 + KST + Intl timezone |
| #155 | 하드코딩 전수 제거 + constants |
| #156 | 보안 강화 (rate limit, Zod, CSRF) |
| #157 | 종합 개선 (정정 승인, 계정 생성, 알림, 서명, CSV, Toast) |
| #158 | UX 마무리 (스켈레톤, 브레드크럼, 터치, alert) |
| #159 | 다크모드 + 폼 검증 + 결재 + 가이드 |
| #160 | Admin timezone 전수 |
| #161 | 복합기능 8건 (GPS 판정, 정정, 알림, 대시보드) |
| #162 | seed KST + API 접근 제어 (RBAC) |
| #163 | Platform 4페이지 + API 3건 |
| #164 | 부서 선택 + EARLY_LEAVE + 조퇴 Badge |
| #165 | 근태 KPI + 휴가 검증 + 승인 수정 + 직급 관리 |

## S27 PR 이력 (9개)
| PR | 내용 |
|----|------|
| #166 | 정정신청 키 불일치 수정 + 예외승인 인증 호환 |
| #167 | 문서발송 무한루프 해소 + Admin발송 fallback + timezone localTimeToUTC |
| #168 | GPS null 표시 수정 (undefined→null 체크) |
| #169 | GPS 지도 뷰어 (Leaflet) + 상태 판정 상수화 + Employee GPS 컬럼 |
| #170 | PWA (manifest, sw, offline) + Employee 모바일 반응형 (하단 네비) |
| #171 | Admin+Platform 모바일 반응형 (h1, 탭, 테이블 스크롤) |
| #172 | Admin+Platform 하단 네비 드롭다운 (햄버거 제거 → 카테고리 방식) |
| #173 | 모바일 하단 네비 로그아웃 버튼 (Employee/Admin/Platform) |
| #174 | 포괄임금 계산 (SalaryHistory 모델, payroll-calc, 3개 API) |

## Playwright 실테스트: 15건 Cross-Role 플로우 검증 완료

## S28 PR 이력 (03-20~21, PR #175~184)
| PR | WI | 내용 |
|----|-----|------|
| #175 | WI-151 | 직원 상세 드로어 SSOT 허브 재구현 |
| #176 | WI-152 | Employee 문서 + Platform 모니터링 SSOT 수정 |
| #177 | WI-153 | 4대보험 신고 및 관리 |
| #178 | WI-153-1 | 급여 계산에 4대보험 공제 연동 |
| #179 | WI-154 | 급여 시스템 DB 스키마 확장 |
| #180 | WI-155 | 급여 계산 엔진 + 세금 + 퇴직금 + 지원금 매칭 |
| #181 | WI-156 | 임금설정 + 급여계산 + 퇴직금 API 확장 |
| #182 | WI-157 | Admin 급여관리 UI 7탭 분할 |
| #183 | WI-158 | Employee 급여명세서 + 드로어 급여탭 확장 |
| #184 | WI-159 | 근로계약서 + 고용지원금 매칭 |

### S28 추가 작업
- Hook 검증 시스템 구축 (요구사항 보호 + 커밋 검증)
- Claude Code 체인지로그 RAG 생성 (글로벌)
- 코워크 검증 시스템 설계
