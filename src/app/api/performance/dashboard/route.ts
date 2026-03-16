import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
  const token = await getToken({ req: request });
  if (!token || !token.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tenantId = token.tenantId as string;
  const now = new Date();

  // ── Active evaluation cycle (다른 쿼리들이 의존) ──────
  const activeCycle = await prisma.evalCycle.findFirst({
    where: { tenantId, status: "ACTIVE" },
    orderBy: { startDate: "desc" },
  });

  // ── 독립 쿼리 + activeCycle 의존 쿼리 병렬 조회 ───────
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  const [
    totalEmployees,
    employeesWithGoalsResult,
    evaluationsInProgress,
    scheduledOneOnOnes,
    notStartedGoals,
    departments,
    completedEvals,
    totalEvals,
  ] = await Promise.all([
    // KPI 1: 목표 설정 완료율
    prisma.employee.count({
      where: { tenantId, status: "ACTIVE" },
    }),
    activeCycle
      ? prisma.goal.groupBy({
          by: ["employeeId"],
          where: { tenantId, cycleId: activeCycle.id },
        })
      : Promise.resolve([]),
    // KPI 2: 평가 중
    activeCycle
      ? prisma.evaluation.count({
          where: {
            tenantId,
            cycleId: activeCycle.id,
            status: { in: ["SELF_REVIEW", "PEER_REVIEW", "MANAGER_REVIEW"] },
          },
        })
      : Promise.resolve(0),
    // KPI 3: 1:1 예정
    prisma.oneOnOne.count({
      where: {
        tenantId,
        status: "SCHEDULED",
        scheduledAt: { gte: weekStart, lt: weekEnd },
      },
    }),
    // KPI 4: 미설정
    activeCycle
      ? prisma.goal.count({
          where: {
            tenantId,
            cycleId: activeCycle.id,
            status: "NOT_STARTED",
          },
        })
      : Promise.resolve(0),
    // 부서별 목표 설정률
    prisma.department.findMany({
      where: { tenantId, parentId: { not: null } },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    // Active Cycle info
    activeCycle
      ? prisma.evaluation.count({
          where: {
            tenantId,
            cycleId: activeCycle.id,
            status: "COMPLETED",
          },
        })
      : Promise.resolve(0),
    activeCycle
      ? prisma.evaluation.count({
          where: { tenantId, cycleId: activeCycle.id },
        })
      : Promise.resolve(0),
  ]);

  const employeesWithGoals = employeesWithGoalsResult.length;
  const goalCompletionRate =
    totalEmployees > 0
      ? Math.round((employeesWithGoals / totalEmployees) * 100)
      : 0;

  // ── 부서별 목표 설정률 (N부서 병렬 조회) ────────────────
  let deptGoalRates: { name: string; value: number }[] = [];

  if (activeCycle && departments.length > 0) {
    const deptResults = await Promise.all(
      departments.map(async (dept) => {
        const [deptEmployeeCount, deptEmployeesWithGoals] = await Promise.all([
          prisma.employee.count({
            where: { tenantId, departmentId: dept.id, status: "ACTIVE" },
          }),
          prisma.goal.groupBy({
            by: ["employeeId"],
            where: {
              tenantId,
              cycleId: activeCycle.id,
              employee: { departmentId: dept.id },
            },
          }),
        ]);

        if (deptEmployeeCount === 0) return null;

        const rate = Math.round(
          (deptEmployeesWithGoals.length / deptEmployeeCount) * 100,
        );
        return { name: dept.name, value: rate };
      }),
    );

    deptGoalRates = deptResults
      .filter((r): r is { name: string; value: number } => r !== null)
      .sort((a, b) => b.value - a.value);
  }

  // ── Active Cycle info ─────────────────────────────────
  let activeCycleInfo = null;
  if (activeCycle) {
    const completionRate =
      totalEvals > 0 ? Math.round((completedEvals / totalEvals) * 100) : 0;

    activeCycleInfo = {
      name: activeCycle.name,
      startDate: activeCycle.startDate.toISOString(),
      endDate: activeCycle.endDate.toISOString(),
      type: activeCycle.type,
      status: activeCycle.status,
      completionRate,
    };
  }

  return NextResponse.json({
    kpi: {
      goalCompletion: {
        rate: goalCompletionRate,
        completed: employeesWithGoals,
        total: totalEmployees,
      },
      evaluationsInProgress: { count: evaluationsInProgress },
      scheduledOneOnOnes: { count: scheduledOneOnOnes },
      notStartedGoals: { count: notStartedGoals },
    },
    deptGoalRates,
    activeCycle: activeCycleInfo,
  });
  } catch (error) {
    console.error("[performance/dashboard GET] Error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
