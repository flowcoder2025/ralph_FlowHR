import { describe, it, expect, vi, beforeEach } from "vitest";
import { prismaMock } from "../../../__mocks__/prisma";
import { mockGetToken } from "../../../__mocks__/next-auth-jwt";
import { createMockRequest, createMockToken } from "../../../__mocks__/helpers";

import "../../../__mocks__/prisma";
import "../../../__mocks__/next-auth-jwt";

import { GET } from "../attendance/dashboard/route";

describe("GET /api/attendance/dashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("토큰 없으면 401 반환", async () => {
    mockGetToken.mockResolvedValue(null);

    const request = createMockRequest("/api/attendance/dashboard");
    const response = await GET(request);

    expect(response.status).toBe(401);
  });

  it("KPI, departmentRates, weeklySummary 반환", async () => {
    mockGetToken.mockResolvedValue(createMockToken());

    // Total employees
    prismaMock.employee.count.mockResolvedValue(50);

    // Today records
    prismaMock.attendanceRecord.findMany.mockResolvedValueOnce([
      {
        id: "rec-1",
        status: "PRESENT",
        checkIn: new Date("2026-03-14T09:00:00"),
        checkOut: new Date("2026-03-14T18:00:00"),
        employeeId: "emp-1",
        employee: { departmentId: "dept-1" },
        workMinutes: 480,
        overtime: 0,
      },
      {
        id: "rec-2",
        status: "LATE",
        checkIn: new Date("2026-03-14T10:00:00"),
        checkOut: null,
        employeeId: "emp-2",
        employee: { departmentId: "dept-1" },
        workMinutes: 0,
        overtime: 0,
      },
    ]);

    // Yesterday exceptions
    prismaMock.attendanceException.count.mockResolvedValueOnce(2);
    // Today exceptions
    prismaMock.attendanceException.count.mockResolvedValueOnce(3);

    // Exception breakdown
    prismaMock.attendanceException.groupBy.mockResolvedValue([
      { type: "CORRECTION", _count: 1 },
      { type: "OVERTIME", _count: 2 },
    ]);

    // Departments
    prismaMock.department.findMany.mockResolvedValue([
      {
        id: "dept-1",
        name: "개발팀",
        employees: [{ id: "emp-1" }, { id: "emp-2" }],
      },
    ]);

    // Week records
    prismaMock.attendanceRecord.findMany.mockResolvedValueOnce([
      {
        checkIn: new Date("2026-03-14T09:00:00"),
        checkOut: new Date("2026-03-14T18:00:00"),
        workMinutes: 480,
        overtime: 0,
        employeeId: "emp-1",
      },
    ]);

    const request = createMockRequest("/api/attendance/dashboard");
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    // 응답이 data 래퍼로 감싸져 있음
    const data = body.data;
    expect(data).toBeDefined();
    expect(data.kpi).toBeDefined();
    expect(data.kpi.present).toBeDefined();
    expect(data.kpi.present.total).toBe(50);
    expect(data.kpi.absent).toBeDefined();
    expect(data.kpi.exceptions).toBeDefined();
    expect(data.kpi.exceptions.delta).toBe(1); // 3 - 2
    expect(data.departmentRates).toBeDefined();
    expect(data.weeklySummary).toBeDefined();
  });

  it("직원 0명일 때 rate 0%", async () => {
    mockGetToken.mockResolvedValue(createMockToken());

    prismaMock.employee.count.mockResolvedValue(0);
    prismaMock.attendanceRecord.findMany.mockResolvedValue([]);
    prismaMock.attendanceException.count.mockResolvedValue(0);
    prismaMock.attendanceException.groupBy.mockResolvedValue([]);
    prismaMock.department.findMany.mockResolvedValue([]);

    const request = createMockRequest("/api/attendance/dashboard");
    const response = await GET(request);
    const body = await response.json();

    expect(body.data.kpi.present.rate).toBe(0);
    expect(body.data.kpi.inProgress.rate).toBe(0);
    expect(body.data.kpi.absent.rate).toBe(0);
  });
});
