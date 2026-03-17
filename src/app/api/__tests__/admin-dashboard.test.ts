import { describe, it, expect, vi, beforeEach } from "vitest";
import { prismaMock } from "../../../__mocks__/prisma";
import { mockGetToken } from "../../../__mocks__/next-auth-jwt";
import { createMockRequest, createMockToken } from "../../../__mocks__/helpers";

import "../../../__mocks__/prisma";
import "../../../__mocks__/next-auth-jwt";

import { GET } from "../admin/dashboard/route";

describe("GET /api/admin/dashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("토큰 없으면 401 반환", async () => {
    mockGetToken.mockResolvedValue(null);

    const request = createMockRequest("/api/admin/dashboard");
    const response = await GET(request);

    expect(response.status).toBe(401);
  });

  it("KPI 5개 + 대기열 + 조직스냅샷 + 퍼널 반환", async () => {
    mockGetToken.mockResolvedValue(createMockToken());

    // KPI 1: Pending approvals
    prismaMock.approvalRequest.count
      .mockResolvedValueOnce(5)   // current pending
      .mockResolvedValueOnce(3)   // yesterday pending
      .mockResolvedValueOnce(1);  // sla overdue

    // KPI 2: checkout missing
    prismaMock.attendanceRecord.count
      .mockResolvedValueOnce(2)   // today missing
      .mockResolvedValueOnce(1);  // yesterday missing

    // KPI 3: week records
    prismaMock.attendanceRecord.findMany
      .mockResolvedValueOnce([
        { employeeId: "emp-1", workMinutes: 2900 }, // over 48h
        { employeeId: "emp-2", workMinutes: 2000 },
      ])
      .mockResolvedValueOnce([ // today records for org snapshot
        { employeeId: "emp-1" },
      ]);

    // KPI 4: unsigned docs
    prismaMock.document.count
      .mockResolvedValueOnce(4)   // unsigned total
      .mockResolvedValueOnce(2)   // yesterday unsigned
      .mockResolvedValueOnce(3)   // pending docs sent
      .mockResolvedValueOnce(4)   // unsigned total (docs status)
      .mockResolvedValueOnce(1)   // urgent docs
      .mockResolvedValueOnce(0);  // expiring contracts

    // KPI 5: closing bottleneck
    prismaMock.attendanceClosing.count.mockResolvedValue(1);
    prismaMock.payrollRun.count.mockResolvedValue(1);

    // Today exceptions
    prismaMock.attendanceException.findMany.mockResolvedValue([]);
    prismaMock.attendanceException.groupBy.mockResolvedValue([]);

    // Pending leaves
    prismaMock.leaveRequest.count.mockResolvedValue(2);

    // Departments for org snapshot
    prismaMock.department.findMany.mockResolvedValue([
      {
        id: "dept-1",
        name: "개발팀",
        employees: [{ id: "emp-1" }, { id: "emp-2" }],
      },
    ]);

    // Approval funnel
    prismaMock.approvalRequest.groupBy.mockResolvedValue([
      { status: "PENDING", _count: 5 },
      { status: "APPROVED", _count: 10 },
    ]);

    // Completed requests for avg time
    prismaMock.approvalRequest.findMany.mockResolvedValue([]);

    // Payroll status
    prismaMock.payrollRun.findFirst.mockResolvedValue({
      status: "IN_PROGRESS",
      currentStep: 2,
    });
    prismaMock.payslip.count.mockResolvedValue(0);

    const request = createMockRequest("/api/admin/dashboard");
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);

    // 응답이 data 래퍼로 감싸져 있음
    const data = body.data;
    expect(data).toBeDefined();

    // KPI structure
    expect(data.kpi.pendingApprovals).toBeDefined();
    expect(data.kpi.attendanceIssues).toBeDefined();
    expect(data.kpi.overtimeNear).toBeDefined();
    expect(data.kpi.unsignedDocs).toBeDefined();
    expect(data.kpi.closingBottleneck).toBeDefined();

    // Queue
    expect(data.todayQueue).toBeDefined();
    expect(Array.isArray(data.todayQueue)).toBe(true);

    // Org snapshot
    expect(data.orgSnapshot).toBeDefined();
    expect(data.orgSnapshot.departments).toBeDefined();

    // Approval funnel
    expect(data.approvalFunnel).toBeDefined();
    expect(data.approvalFunnel.data).toHaveLength(4);

    // Document status
    expect(data.documentStatus).toBeDefined();

    // Payroll status
    expect(data.payrollStatus).toBeDefined();
    expect(data.payrollStatus.currentStatus).toBe("IN_PROGRESS");
  });

  it("대기열 항목 우선순위 순서 확인", async () => {
    mockGetToken.mockResolvedValue(createMockToken());

    // Setup: overtime near limit, missing checkouts, pending leaves
    prismaMock.approvalRequest.count.mockResolvedValue(0);
    prismaMock.attendanceRecord.count
      .mockResolvedValueOnce(3) // today missing checkouts
      .mockResolvedValueOnce(0); // yesterday missing

    prismaMock.attendanceRecord.findMany
      .mockResolvedValueOnce([
        { employeeId: "emp-1", workMinutes: 3000 }, // over 48h → critical
      ])
      .mockResolvedValueOnce([]);

    prismaMock.document.count.mockResolvedValue(2);
    prismaMock.attendanceClosing.count.mockResolvedValue(0);
    prismaMock.payrollRun.count.mockResolvedValue(0);
    prismaMock.attendanceException.findMany.mockResolvedValue([]);
    prismaMock.attendanceException.groupBy.mockResolvedValue([]);
    prismaMock.leaveRequest.count.mockResolvedValue(5);
    prismaMock.department.findMany.mockResolvedValue([]);
    prismaMock.approvalRequest.groupBy.mockResolvedValue([]);
    prismaMock.approvalRequest.findMany.mockResolvedValue([]);
    prismaMock.payrollRun.findFirst.mockResolvedValue(null);
    prismaMock.payslip.count.mockResolvedValue(0);

    const request = createMockRequest("/api/admin/dashboard");
    const response = await GET(request);
    const body = await response.json();

    // Should have queue items for overtime (critical) and missing checkouts (high)
    expect(body.data.todayQueue.length).toBeGreaterThan(0);

    // First item should be critical (overtime)
    if (body.data.todayQueue.length > 0) {
      expect(body.data.todayQueue[0].priority).toBe("critical");
    }
  });
});
