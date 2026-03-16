import { describe, it, expect, vi, beforeEach } from "vitest";
import { prismaMock } from "../../../__mocks__/prisma";
import { mockGetToken } from "../../../__mocks__/next-auth-jwt";
import { createMockRequest, createMockToken } from "../../../__mocks__/helpers";

import "../../../__mocks__/prisma";
import "../../../__mocks__/next-auth-jwt";

import { GET as getTypes } from "../employee/requests/types/route";
import { GET as getHistory } from "../employee/requests/history/route";

describe("GET /api/employee/requests/types", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("토큰 없으면 401 반환", async () => {
    mockGetToken.mockResolvedValue(null);
    const request = createMockRequest("/api/employee/requests/types");
    const response = await getTypes(request);
    expect(response.status).toBe(401);
  });

  it("활성 휴가 정책 기반 요청 유형과 잔여 연차 반환", async () => {
    mockGetToken.mockResolvedValue(createMockToken());

    prismaMock.employee.findFirst.mockResolvedValue({
      id: "emp-1",
      tenantId: "tenant-1",
    });

    prismaMock.leavePolicy.findMany.mockResolvedValue([
      { id: "p1", type: "ANNUAL", name: "연차", isActive: true },
      { id: "p2", type: "HALF_DAY", name: "반차", isActive: true },
      { id: "p3", type: "SICK", name: "병가", isActive: true },
    ]);

    prismaMock.leaveBalance.findMany.mockResolvedValue([
      { totalDays: 15, usedDays: 5, pendingDays: 1.5 },
    ]);

    const request = createMockRequest("/api/employee/requests/types");
    const response = await getTypes(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    // 3 leave types + 4 static types = 7
    expect(body.types).toHaveLength(7);
    expect(body.types[0]).toEqual(
      expect.objectContaining({
        id: "annual",
        isLeave: true,
        isCorrection: false,
      }),
    );
    expect(body.remainingLeave).toBe(8.5);
  });

  it("휴가 정책 없을 때 정적 유형만 반환", async () => {
    mockGetToken.mockResolvedValue(createMockToken());
    prismaMock.leavePolicy.findMany.mockResolvedValue([]);
    prismaMock.leaveBalance.findMany.mockResolvedValue([]);

    const request = createMockRequest("/api/employee/requests/types");
    const response = await getTypes(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.types).toHaveLength(4); // only static types
    expect(body.remainingLeave).toBe(0);
  });
});

describe("GET /api/employee/requests/history", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("토큰 없으면 401 반환", async () => {
    mockGetToken.mockResolvedValue(null);
    const request = createMockRequest("/api/employee/requests/history");
    const response = await getHistory(request);
    expect(response.status).toBe(401);
  });

  it("직원 레코드가 없으면 404 반환", async () => {
    mockGetToken.mockResolvedValue(createMockToken());
    prismaMock.employee.findFirst.mockResolvedValue(null);

    const request = createMockRequest("/api/employee/requests/history");
    const response = await getHistory(request);
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toBe("Employee not found");
  });

  it("요청 이력과 페이지네이션 반환", async () => {
    mockGetToken.mockResolvedValue(createMockToken());

    // First call: user→employee lookup, Second call: manager info
    prismaMock.employee.findFirst
      .mockResolvedValueOnce({ id: "emp-1", tenantId: "tenant-1" })
      .mockResolvedValueOnce({
        department: {
          manager: { name: "박서준" },
        },
      });

    prismaMock.leaveRequest.findMany.mockResolvedValue([
      {
        id: "lr-1",
        status: "PENDING",
        startDate: new Date("2026-04-07"),
        endDate: new Date("2026-04-08"),
        days: 2,
        createdAt: new Date("2026-03-12"),
        policy: { name: "연차", type: "ANNUAL" },
      },
    ]);
    prismaMock.attendanceException.findMany.mockResolvedValue([]);
    prismaMock.approvalRequest.findMany.mockResolvedValue([]);

    const request = createMockRequest("/api/employee/requests/history");
    const response = await getHistory(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.items).toHaveLength(1);
    expect(body.items[0]).toEqual(
      expect.objectContaining({
        id: "lr-1",
        type: "연차",
        status: "pending",
        approver: "박서준",
        approverInitial: "박",
      }),
    );
    expect(body.total).toBe(1);
    expect(body.totalPages).toBe(1);
  });

  it("여러 유형의 이력 통합 반환", async () => {
    mockGetToken.mockResolvedValue(createMockToken());

    // First call: user→employee lookup, Second call: manager info
    prismaMock.employee.findFirst
      .mockResolvedValueOnce({ id: "emp-1", tenantId: "tenant-1" })
      .mockResolvedValueOnce({
        department: { manager: { name: "박서준" } },
      });

    prismaMock.leaveRequest.findMany.mockResolvedValue([
      {
        id: "lr-1",
        status: "APPROVED",
        startDate: new Date("2026-03-04"),
        endDate: new Date("2026-03-04"),
        days: 1,
        createdAt: new Date("2026-03-01"),
        policy: { name: "연차", type: "ANNUAL" },
      },
    ]);
    prismaMock.attendanceException.findMany.mockResolvedValue([
      {
        id: "ex-1",
        type: "CORRECTION",
        status: "REJECTED",
        date: new Date("2026-03-07"),
        createdAt: new Date("2026-03-07"),
      },
    ]);
    prismaMock.approvalRequest.findMany.mockResolvedValue([
      {
        id: "ar-1",
        requestType: "expense",
        title: "2월 교통비 청구 ₩45,000",
        status: "APPROVED",
        createdAt: new Date("2026-02-25"),
      },
    ]);

    const request = createMockRequest("/api/employee/requests/history");
    const response = await getHistory(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.items).toHaveLength(3);
    // Sorted by requestDate descending
    expect(body.items[0].id).toBe("ex-1"); // 2026-03-07
    expect(body.items[1].id).toBe("lr-1"); // 2026-03-01
    expect(body.items[2].id).toBe("ar-1"); // 2026-02-25
  });

  it("상태 필터 적용", async () => {
    mockGetToken.mockResolvedValue(createMockToken());

    // First call: user→employee lookup, Second call: manager info
    prismaMock.employee.findFirst
      .mockResolvedValueOnce({ id: "emp-1", tenantId: "tenant-1" })
      .mockResolvedValueOnce(null);

    prismaMock.leaveRequest.findMany.mockResolvedValue([]);
    prismaMock.attendanceException.findMany.mockResolvedValue([]);
    prismaMock.approvalRequest.findMany.mockResolvedValue([]);

    const request = createMockRequest(
      "/api/employee/requests/history?status=pending",
    );
    await getHistory(request);

    expect(prismaMock.leaveRequest.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: "PENDING",
        }),
      }),
    );
  });
});
