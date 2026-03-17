import { describe, it, expect, vi, beforeEach } from "vitest";
import { prismaMock } from "../../../__mocks__/prisma";
import { mockGetToken } from "../../../__mocks__/next-auth-jwt";
import { createMockRequest, createMockToken } from "../../../__mocks__/helpers";

import "../../../__mocks__/prisma";
import "../../../__mocks__/next-auth-jwt";

import { GET } from "../employee/schedule/route";

describe("GET /api/employee/schedule", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("토큰 없으면 401 반환", async () => {
    mockGetToken.mockResolvedValue(null);

    const request = createMockRequest("/api/employee/schedule");
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  it("직원 레코드가 없으면 404 반환", async () => {
    const token = createMockToken({ role: "EMPLOYEE" });
    mockGetToken.mockResolvedValue(token);
    prismaMock.employee.findFirst.mockResolvedValue(null);

    const request = createMockRequest("/api/employee/schedule");
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toBe("직원 정보를 찾을 수 없습니다");
  });

  it("오늘 현황 + 주간 스케줄 + 이력 데이터 반환", async () => {
    const token = createMockToken({ role: "EMPLOYEE" });
    mockGetToken.mockResolvedValue(token);

    prismaMock.employee.findFirst.mockResolvedValue({
      id: "emp-1",
      tenantId: "tenant-1",
      name: "김지은",
    });

    // Shift assignment with shift
    prismaMock.shiftAssignment.findFirst.mockResolvedValue({
      id: "sa-1",
      shift: {
        id: "shift-1",
        type: "REGULAR",
        name: "일반 근무",
        startTime: "09:00",
        endTime: "18:00",
      },
    });

    // Today's attendance (KST 09:02 = UTC 00:02)
    const todayCheckIn = new Date();
    todayCheckIn.setUTCHours(0, 2, 0, 0);
    prismaMock.attendanceRecord.findFirst.mockResolvedValue({
      id: "rec-today",
      checkIn: todayCheckIn,
      checkOut: null,
      workMinutes: null,
      status: "PRESENT",
    });

    // Weekly attendance records
    prismaMock.attendanceRecord.findMany.mockResolvedValue([]);

    const request = createMockRequest("/api/employee/schedule");
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.today.checkIn).toBe("09:02");
    expect(body.data.today.checkOut).toBeNull();
    expect(body.data.today.status).toBe("working");
    expect(body.data.today.shiftType).toBe("일반 근무");
    expect(body.data.today.expectedEnd).toBe("18:00");
    expect(body.data.weeklySchedule).toHaveLength(5);
    expect(body.data.history).toBeDefined();
    expect(body.data.history.items).toBeDefined();
    expect(body.data.history.page).toBe(1);
  });

  it("교대 배정 없으면 기본 근무 사용", async () => {
    const token = createMockToken({ role: "EMPLOYEE" });
    mockGetToken.mockResolvedValue(token);

    prismaMock.employee.findFirst.mockResolvedValue({
      id: "emp-1",
      tenantId: "tenant-1",
      name: "김지은",
    });

    prismaMock.shiftAssignment.findFirst.mockResolvedValue(null);
    prismaMock.attendanceRecord.findFirst.mockResolvedValue(null);
    prismaMock.attendanceRecord.findMany.mockResolvedValue([]);

    const request = createMockRequest("/api/employee/schedule");
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.today.shiftType).toBe("일반 근무");
    expect(body.data.today.expectedEnd).toBe("18:00");
    expect(body.data.today.status).toBe("not_started");
    expect(body.data.today.checkIn).toBeNull();
  });

  it("출결 이력을 올바른 상태로 매핑", async () => {
    const token = createMockToken({ role: "EMPLOYEE" });
    mockGetToken.mockResolvedValue(token);

    prismaMock.employee.findFirst.mockResolvedValue({
      id: "emp-1",
      tenantId: "tenant-1",
      name: "김지은",
    });
    prismaMock.shiftAssignment.findFirst.mockResolvedValue(null);
    prismaMock.attendanceRecord.findFirst.mockResolvedValue(null);

    const yesterday = new Date();
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    yesterday.setUTCHours(0, 0, 0, 0);

    // KST 09:12 = UTC 00:12, KST 18:30 = UTC 09:30
    const checkIn = new Date(yesterday);
    checkIn.setUTCHours(0, 12, 0, 0);
    const checkOut = new Date(yesterday);
    checkOut.setUTCHours(9, 30, 0, 0);

    // findMany is called twice: weekly records then history records
    prismaMock.attendanceRecord.findMany
      .mockResolvedValueOnce([]) // weekly
      .mockResolvedValueOnce([
        {
          id: "h1",
          date: yesterday,
          checkIn,
          checkOut,
          workMinutes: 558,
          status: "LATE",
        },
      ]);

    const request = createMockRequest("/api/employee/schedule?filter=recent2w");
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.history.items).toHaveLength(1);
    expect(body.data.history.items[0].status).toBe("late");
    expect(body.data.history.items[0].checkIn).toBe("09:12");
    expect(body.data.history.items[0].checkOut).toBe("18:30");
    expect(body.data.history.items[0].totalWork).toBe("9시간 18분");
  });

  it("퇴근 완료 시 done 상태 반환", async () => {
    const token = createMockToken({ role: "EMPLOYEE" });
    mockGetToken.mockResolvedValue(token);

    prismaMock.employee.findFirst.mockResolvedValue({
      id: "emp-1",
      tenantId: "tenant-1",
      name: "김지은",
    });
    prismaMock.shiftAssignment.findFirst.mockResolvedValue(null);

    // KST 09:00 = UTC 00:00, KST 18:05 = UTC 09:05
    const checkIn = new Date();
    checkIn.setUTCHours(0, 0, 0, 0);
    const checkOut = new Date();
    checkOut.setUTCHours(9, 5, 0, 0);

    prismaMock.attendanceRecord.findFirst.mockResolvedValue({
      id: "rec-today",
      checkIn,
      checkOut,
      workMinutes: 545,
      status: "PRESENT",
    });
    prismaMock.attendanceRecord.findMany.mockResolvedValue([]);

    const request = createMockRequest("/api/employee/schedule");
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.today.status).toBe("done");
    expect(body.data.today.totalHours).toBe("9시간 05분");
  });
});
