import { describe, it, expect, vi, beforeEach } from "vitest";
import { prismaMock } from "../../../__mocks__/prisma";
import { mockGetToken } from "../../../__mocks__/next-auth-jwt";
import { createMockRequest, createMockToken } from "../../../__mocks__/helpers";

import "../../../__mocks__/prisma";
import "../../../__mocks__/next-auth-jwt";

import { GET } from "../employee/profile/route";

describe("GET /api/employee/profile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("토큰 없으면 401 반환", async () => {
    mockGetToken.mockResolvedValue(null);

    const request = createMockRequest("/api/employee/profile");
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  it("tenantId 없으면 401 반환", async () => {
    mockGetToken.mockResolvedValue({ id: "user-1", tenantId: null });

    const request = createMockRequest("/api/employee/profile");
    const response = await GET(request);

    expect(response.status).toBe(401);
  });

  it("직원 레코드가 없으면 404 반환", async () => {
    const token = createMockToken({ role: "EMPLOYEE" });
    mockGetToken.mockResolvedValue(token);
    prismaMock.employee.findFirst.mockResolvedValue(null);

    const request = createMockRequest("/api/employee/profile");
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toBe("Employee not found");
  });

  it("프로필 + 휴가잔여 + 목표 + 평가 + 1:1 데이터 반환", async () => {
    const token = createMockToken({ role: "EMPLOYEE" });
    mockGetToken.mockResolvedValue(token);

    const mockEmployee = {
      id: "emp-1",
      tenantId: "tenant-1",
      userId: "user-1",
      name: "김지은",
      employeeNumber: "EMP-001",
      email: "jieun.kim@flowhr.com",
      phone: "010-1234-5678",
      hireDate: new Date("2022-03-15"),
      status: "ACTIVE",
      type: "FULL_TIME",
      department: { name: "Product" },
      position: { name: "시니어 개발자" },
    };
    prismaMock.employee.findFirst.mockResolvedValue(mockEmployee);

    const mockLeaveBalances = [
      {
        id: "lb-1",
        totalDays: 15,
        usedDays: 6.5,
        pendingDays: 1,
        policy: { name: "연차", type: "ANNUAL" },
      },
    ];
    prismaMock.leaveBalance.findMany.mockResolvedValue(mockLeaveBalances);

    const mockGoals = [
      {
        id: "g1",
        title: "API 응답 시간 30% 개선",
        progress: 75,
        status: "IN_PROGRESS",
        dueDate: new Date("2026-06-30"),
      },
    ];
    prismaMock.goal.findMany.mockResolvedValue(mockGoals);

    const mockEvaluations = [
      {
        id: "eval-1",
        selfScore: 4.2,
        managerScore: 4.5,
        finalScore: 4.4,
        status: "COMPLETED",
        cycle: { name: "2025 하반기 평가" },
      },
    ];
    prismaMock.evaluation.findMany.mockResolvedValue(mockEvaluations);

    const mockOneOnOnes = [
      {
        id: "o1",
        scheduledAt: new Date("2026-03-18T14:00:00"),
        duration: 30,
        status: "SCHEDULED",
        agenda: "Q1 목표 중간 점검",
        manager: { name: "박서준" },
      },
    ];
    prismaMock.oneOnOne.findMany.mockResolvedValue(mockOneOnOnes);

    const request = createMockRequest("/api/employee/profile");
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);

    // Profile
    expect(body.data.profile.name).toBe("김지은");
    expect(body.data.profile.employeeNumber).toBe("EMP-001");
    expect(body.data.profile.department).toBe("Product");
    expect(body.data.profile.position).toBe("시니어 개발자");
    expect(body.data.profile.status).toBe("ACTIVE");
    expect(body.data.profile.avatar).toBe("김");

    // Leave balances
    expect(body.data.leaveBalances).toHaveLength(1);
    expect(body.data.leaveBalances[0].type).toBe("ANNUAL");
    expect(body.data.leaveBalances[0].total).toBe(15);
    expect(body.data.leaveBalances[0].used).toBe(6.5);

    // Goals
    expect(body.data.goals).toHaveLength(1);
    expect(body.data.goals[0].title).toBe("API 응답 시간 30% 개선");
    expect(body.data.goals[0].progress).toBe(75);

    // Evaluation
    expect(body.data.evaluation).not.toBeNull();
    expect(body.data.evaluation.cycleName).toBe("2025 하반기 평가");
    expect(body.data.evaluation.finalScore).toBe(4.4);

    // OneOnOnes
    expect(body.data.oneOnOnes).toHaveLength(1);
    expect(body.data.oneOnOnes[0].managerName).toBe("박서준");
    expect(body.data.oneOnOnes[0].status).toBe("SCHEDULED");
  });

  it("평가 데이터 없으면 evaluation null 반환", async () => {
    const token = createMockToken({ role: "EMPLOYEE" });
    mockGetToken.mockResolvedValue(token);

    prismaMock.employee.findFirst.mockResolvedValue({
      id: "emp-1",
      tenantId: "tenant-1",
      userId: "user-1",
      name: "김지은",
      employeeNumber: "EMP-001",
      email: "jieun.kim@flowhr.com",
      phone: null,
      hireDate: new Date("2022-03-15"),
      status: "ACTIVE",
      type: "FULL_TIME",
      department: null,
      position: null,
    });

    prismaMock.leaveBalance.findMany.mockResolvedValue([]);
    prismaMock.goal.findMany.mockResolvedValue([]);
    prismaMock.evaluation.findMany.mockResolvedValue([]);
    prismaMock.oneOnOne.findMany.mockResolvedValue([]);

    const request = createMockRequest("/api/employee/profile");
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.evaluation).toBeNull();
    expect(body.data.profile.phone).toBe("");
    expect(body.data.profile.department).toBe("");
    expect(body.data.profile.position).toBe("");
  });
});
