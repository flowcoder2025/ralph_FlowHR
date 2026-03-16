import dotenv from "dotenv";
import { chromium } from "playwright";
dotenv.config();

const baseURL = "http://localhost:3001";

async function main() {
  const browser = await chromium.launch();

  console.log("=== SSOT 검증: 역할별 데이터 일치 확인 ===\n");

  const ac = await browser.newContext({ baseURL, storageState: "playwright/.auth/admin.json" });
  const ap = await ac.newPage();
  const ec = await browser.newContext({ baseURL, storageState: "playwright/.auth/employee.json" });
  const ep = await ec.newPage();

  // 1. Employee 휴가 신청 → Admin 큐
  console.log("--- 1. Employee 휴가 신청 → Admin 휴가큐 반영 ---");
  const before = await (await ap.request.get("/api/leave/requests")).json();
  const beforeCount = before.data?.length || 0;
  const lr = await ep.request.post("/api/employee/requests/leave", {
    data: { type: "ANNUAL", startDate: "2026-04-10", endDate: "2026-04-10", reason: "SSOT검증" },
  });
  console.log("신청:", lr.status());
  const after = await (await ap.request.get("/api/leave/requests")).json();
  const afterCount = after.data?.length || 0;
  console.log("Admin 큐: " + beforeCount + " → " + afterCount + (afterCount > beforeCount ? " ✅" : " ❌"));

  // 2. Admin 승인 → Employee 상태
  console.log("\n--- 2. Admin 승인 → Employee 이력 상태 ---");
  const pending = after.data?.filter(l => l.status === "PENDING" && l.reason === "SSOT검증");
  if (pending?.length > 0) {
    const ar = await ap.request.patch("/api/leave/requests", { data: { id: pending[0].id, action: "approve" } });
    console.log("승인:", ar.status());
    const hist = await (await ep.request.get("/api/employee/requests/history?status=all&page=1&pageSize=50")).json();
    const item = hist.data?.leaveRequests?.find(r => r.reason === "SSOT검증");
    console.log("Employee 상태:", item?.status === "APPROVED" ? "✅ APPROVED" : "❌ " + (item?.status || "NOT_FOUND"));
  } else {
    console.log("❌ 대기 건 없음 (정책 없음?)");
  }

  // 3. Employee 프로필 vs Admin 직원
  console.log("\n--- 3. Employee 프로필 vs Admin 직원 상세 ---");
  const profile = await (await ep.request.get("/api/employee/profile")).json();
  const empList = await (await ap.request.get("/api/employees?page=1&pageSize=100")).json();
  const match = empList.data?.find(e => e.email === profile.data?.email);
  console.log("이름:", profile.data?.name, "vs", match?.name, profile.data?.name === match?.name ? "✅" : "❌");
  console.log("이메일:", profile.data?.email, "vs", match?.email, profile.data?.email === match?.email ? "✅" : "❌");

  // 4. Employee 출결 vs Admin 출결
  console.log("\n--- 4. Employee 스케줄 vs Admin 근태 기록 ---");
  const empSch = await (await ep.request.get("/api/employee/schedule?filter=recent2w&page=1")).json();
  const adminRec = await (await ap.request.get("/api/attendance/records?page=1")).json();
  console.log("Employee:", (empSch.data?.history?.length || 0) + "건 | Admin 전체:", (adminRec.data?.length || 0) + "건");

  // 5. Admin 대시보드 KPI 정합성
  console.log("\n--- 5. 대시보드 KPI 정합성 ---");
  const dash = await (await ap.request.get("/api/admin/dashboard")).json();
  const leaveQ = await (await ap.request.get("/api/leave/requests")).json();
  const realPendingLeave = leaveQ.data?.filter(l => l.status === "PENDING")?.length || 0;
  const wfDash = await (await ap.request.get("/api/workflow/dashboard")).json();
  console.log("KPI 승인필요:", dash.kpi?.pendingApprovals?.value, "| 결재 대기:", wfDash.kpi?.pending || "N/A");
  console.log("KPI 근태이상:", dash.kpi?.attendanceIssues?.value);
  console.log("실제 휴가 대기:", realPendingLeave);

  await ac.close();
  await ec.close();

  // === 미구현 기능 탐색 ===
  console.log("\n=== 미구현 기능 전수 탐색 ===\n");

  const ac2 = await browser.newContext({ baseURL, storageState: "playwright/.auth/admin.json" });
  const ap2 = await ac2.newPage();

  const adminChecks = [
    ["/admin/people", "직원 등록 모달", "button:has-text('직원 등록'), button:has-text('+ 직원')"],
    ["/admin/people", "직원 상세 수정 버튼", "button:has-text('수정')"],
    ["/admin/org-chart", "부서 추가 버튼", "button:has-text('부서 추가')"],
    ["/admin/org-chart", "부서 수정/삭제 (hover)", "button:has-text('수정')"],
    ["/admin/attendance", "교대 편성 수정/저장", "button:has-text('편성 저장'), button:has-text('저장')"],
    ["/admin/attendance", "출결 기록 수정", "button:has-text('수정')"],
    ["/admin/leave", "정책 추가/수정", "button:has-text('정책 추가'), button:has-text('+ 추가')"],
    ["/admin/leave", "휴가 승인/반려 버튼", "button:has-text('승인'), button:has-text('반려')"],
    ["/admin/workflow", "결재 처리 드로어", "button:has-text('처리'), button:has-text('승인')"],
    ["/admin/workflow", "워크플로우 빌더", "button:has-text('워크플로우')"],
    ["/admin/documents", "템플릿 생성", "button:has-text('템플릿'), button:has-text('+ 추가')"],
    ["/admin/documents", "문서 발송 폼", "button:has-text('발송')"],
    ["/admin/payroll", "급여 규칙 추가", "button:has-text('규칙 추가'), button:has-text('+ 추가')"],
    ["/admin/payroll", "마감 단계 진행", "button:has-text('다음'), button:has-text('마감')"],
    ["/admin/performance", "평가 사이클 생성", "button:has-text('사이클'), button:has-text('생성')"],
    ["/admin/performance", "목표 등록", "button:has-text('목표'), button:has-text('+ 추가')"],
    ["/admin/recruiting", "공고 등록", "button:has-text('공고'), button:has-text('+ 추가')"],
    ["/admin/recruiting", "파이프라인 단계이동", "button:has-text('이동'), [draggable]"],
    ["/admin/settings", "역할 생성", "button:has-text('역할'), button:has-text('+ 추가')"],
    ["/admin/settings", "권한 매트릭스 편집", "button:has-text('편집'), select"],
    ["/admin/reports", "리포트 내보내기", "button:has-text('내보내기')"],
  ];

  for (const [url, label, selector] of adminChecks) {
    await ap2.goto(url, { waitUntil: "networkidle", timeout: 15000 }).catch(() => {});
    let count = 0;
    for (const sel of selector.split(", ")) {
      count += await ap2.locator(sel).count().catch(() => 0);
    }
    console.log((count > 0 ? "✅" : "❌") + " [Admin] " + label.padEnd(25) + (count > 0 ? count + "개" : "미구현"));
  }
  await ac2.close();

  const ec2 = await browser.newContext({ baseURL, storageState: "playwright/.auth/employee.json" });
  const ep2 = await ec2.newPage();

  const empChecks = [
    ["/employee/schedule", "출퇴근 체크인/아웃 버튼", "button:has-text('출근'), button:has-text('퇴근')"],
    ["/employee/schedule", "외근/연장 신청", "button:has-text('외근'), button:has-text('연장')"],
    ["/employee/requests", "휴가 신청 폼", "button:has-text('연차'), button:has-text('반차'), button:has-text('병가')"],
    ["/employee/requests", "근태 정정 폼", "button:has-text('정정'), button:has-text('출근 정정')"],
    ["/employee/documents", "서명 패드", "canvas, [class*=signature], button:has-text('서명')"],
    ["/employee/documents", "문서 다운로드", "button:has-text('다운로드'), button:has-text('PDF')"],
    ["/employee/profile", "프로필 수정 요청", "button:has-text('수정'), button:has-text('요청')"],
    ["/employee/inbox", "알림 목록", "div[class*=divide], ul"],
  ];

  for (const [url, label, selector] of empChecks) {
    await ep2.goto(url, { waitUntil: "networkidle", timeout: 15000 }).catch(() => {});
    let count = 0;
    for (const sel of selector.split(", ")) {
      count += await ep2.locator(sel).count().catch(() => 0);
    }
    console.log((count > 0 ? "✅" : "❌") + " [Employee] " + label.padEnd(25) + (count > 0 ? count + "개" : "미구현"));
  }
  await ec2.close();

  const oc = await browser.newContext({ baseURL, storageState: "playwright/.auth/operator.json" });
  const op = await oc.newPage();

  const opChecks = [
    ["/platform", "테넌트 추가", "button:has-text('테넌트 추가')"],
    ["/platform/tenants", "테넌트 상세 드로어", "table tbody tr"],
    ["/platform/tenants", "CSV 내보내기", "button:has-text('내보내기'), button:has-text('CSV')"],
    ["/platform/billing", "플랜 관리", "button:has-text('플랜'), button:has-text('변경')"],
  ];

  for (const [url, label, selector] of opChecks) {
    await op.goto(url, { waitUntil: "networkidle", timeout: 15000 }).catch(() => {});
    let count = 0;
    for (const sel of selector.split(", ")) {
      count += await op.locator(sel).count().catch(() => 0);
    }
    console.log((count > 0 ? "✅" : "❌") + " [Platform] " + label.padEnd(25) + (count > 0 ? count + "개" : "미구현"));
  }
  await oc.close();

  await browser.close();
  console.log("\n=== 검증 완료 ===");
}

main().catch(e => { console.error(e); process.exit(1); });
