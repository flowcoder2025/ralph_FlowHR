import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { utcToday, utcTomorrow, utcYesterday, utcDaysOffset } from "@/lib/date-utils";

export async function GET(request: NextRequest) {
  try {
  const token = await getToken({ req: request });
  if (!token || !token.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tenantId = token.tenantId;
  const today = utcToday();
  const tomorrow = utcTomorrow();
  const yesterday = utcYesterday();

  // Total active employees
  const totalEmployees = await prisma.employee.count({
    where: { tenantId, status: "ACTIVE" },
  });

  // Today's attendance records
  const todayRecords = await prisma.attendanceRecord.findMany({
    where: {
      tenantId,
      date: { gte: today, lt: tomorrow },
    },
    include: {
      employee: {
        select: { departmentId: true },
      },
    },
  });

  // Yesterday's exception count for delta
  const yesterdayExceptions = await prisma.attendanceException.count({
    where: {
      tenantId,
      date: { gte: yesterday, lt: today },
    },
  });

  // Today's exceptions
  const todayExceptions = await prisma.attendanceException.count({
    where: {
      tenantId,
      date: { gte: today, lt: tomorrow },
    },
  });

  // Exception breakdown by type
  const exceptionsByType = await prisma.attendanceException.groupBy({
    by: ["type"],
    where: {
      tenantId,
      date: { gte: today, lt: tomorrow },
    },
    _count: true,
  });

  // Calculate KPIs — 부서 유무와 무관하게 전체 활성 직원 기준
  const checkedInCount = todayRecords.filter(
    (r) => r.checkIn !== null,
  ).length;
  const inProgressCount = todayRecords.filter(
    (r) => r.checkIn !== null && r.checkOut === null,
  ).length;
  const lateCount = todayRecords.filter((r) => r.status === "LATE").length;
  const absentCount = Math.max(0, totalEmployees - checkedInCount);

  const presentRate =
    totalEmployees > 0
      ? Math.round((checkedInCount / totalEmployees) * 100)
      : 0;
  const inProgressRate =
    totalEmployees > 0
      ? Math.round((inProgressCount / totalEmployees) * 100)
      : 0;
  const completedCount = todayRecords.filter(
    (r) => r.checkIn !== null && r.checkOut !== null,
  ).length;
  const absentRate =
    totalEmployees > 0
      ? Math.round((absentCount / totalEmployees) * 100)
      : 0;

  const exceptionDelta = todayExceptions - yesterdayExceptions;

  const correctionCount =
    exceptionsByType.find((e) => e.type === "CORRECTION")?._count ?? 0;
  const overtimeCount =
    exceptionsByType.find((e) => e.type === "OVERTIME")?._count ?? 0;
  const otherCount = todayExceptions - correctionCount - overtimeCount;

  // Department attendance rates
  const departments = await prisma.department.findMany({
    where: { tenantId },
    select: {
      id: true,
      name: true,
      employees: {
        where: { status: "ACTIVE" },
        select: { id: true },
      },
    },
  });

  const departmentRates = departments
    .filter((d) => d.employees.length > 0)
    .map((dept) => {
      const deptEmployeeIds = new Set(dept.employees.map((e) => e.id));
      const deptPresent = todayRecords.filter(
        (r) =>
          r.employee.departmentId &&
          deptEmployeeIds.has(r.employeeId),
      ).length;
      const rate =
        dept.employees.length > 0
          ? Math.round((deptPresent / dept.employees.length) * 100)
          : 0;
      return { name: dept.name, value: rate };
    })
    .sort((a, b) => b.value - a.value);

  // Weekly summary (last 7 days)
  const weekStart = utcDaysOffset(-6);

  const weekRecords = await prisma.attendanceRecord.findMany({
    where: {
      tenantId,
      date: { gte: weekStart, lt: tomorrow },
    },
  });

  const recordsWithTimes = weekRecords.filter(
    (r) => r.checkIn !== null,
  );
  const avgCheckInMinutes =
    recordsWithTimes.length > 0
      ? Math.round(
          recordsWithTimes.reduce((sum, r) => {
            const d = r.checkIn!;
            return sum + d.getHours() * 60 + d.getMinutes();
          }, 0) / recordsWithTimes.length,
        )
      : 0;

  const recordsWithCheckout = weekRecords.filter(
    (r) => r.checkOut !== null,
  );
  const avgCheckOutMinutes =
    recordsWithCheckout.length > 0
      ? Math.round(
          recordsWithCheckout.reduce((sum, r) => {
            const d = r.checkOut!;
            return sum + d.getHours() * 60 + d.getMinutes();
          }, 0) / recordsWithCheckout.length,
        )
      : 0;

  const avgWorkMinutes =
    recordsWithCheckout.length > 0
      ? Math.round(
          recordsWithCheckout.reduce(
            (sum, r) => sum + (r.workMinutes ?? 0),
            0,
          ) / recordsWithCheckout.length,
        )
      : 0;

  const overtimeRecords = weekRecords.filter((r) => r.overtime > 0).length;

  // Employees near 52h weekly limit (3120 minutes)
  const weeklyHoursByEmployee = new Map<string, number>();
  for (const r of weekRecords) {
    const current = weeklyHoursByEmployee.get(r.employeeId) ?? 0;
    weeklyHoursByEmployee.set(
      r.employeeId,
      current + (r.workMinutes ?? 0),
    );
  }
  const near52hCount = Array.from(weeklyHoursByEmployee.values()).filter(
    (mins) => mins >= 2880,
  ).length; // 48h+

  const formatTime = (totalMinutes: number): string => {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  };

  return NextResponse.json({
    data: {
      kpi: {
        present: {
          rate: presentRate,
          count: checkedInCount,
          completed: completedCount,
          total: totalEmployees,
        },
        inProgress: { rate: inProgressRate, count: inProgressCount },
        absent: { rate: absentRate, count: absentCount },
        exceptions: {
          total: todayExceptions,
          delta: exceptionDelta,
          late: lateCount,
          correction: correctionCount,
          overtime: overtimeCount,
          other: otherCount,
        },
      },
      departmentRates,
      weeklySummary: {
        avgCheckIn: formatTime(avgCheckInMinutes),
        avgCheckOut: formatTime(avgCheckOutMinutes),
        avgWorkHours: (avgWorkMinutes / 60).toFixed(1) + "h",
        overtimeCases: overtimeRecords,
        near52hLimit: near52hCount,
      },
    },
  });
  } catch (error) {
    console.error("[attendance/dashboard GET] Error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
