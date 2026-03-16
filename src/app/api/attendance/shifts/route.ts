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

  const tenantId = token.tenantId;
  const { searchParams } = request.nextUrl;

  // Parse week start date from query param (ISO string), default to current week's Monday
  const weekParam = searchParams.get("weekStart");
  let weekStart: Date;

  if (weekParam) {
    weekStart = new Date(weekParam);
    weekStart.setHours(0, 0, 0, 0);
  } else {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dayOfWeek = today.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    weekStart = new Date(today);
    weekStart.setDate(today.getDate() + mondayOffset);
  }

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 5); // Monday to Friday (5 days)

  // Fetch shift assignments for the week with employee and shift details
  const assignments = await prisma.shiftAssignment.findMany({
    where: {
      tenantId,
      startDate: { lte: weekEnd },
      OR: [
        { endDate: null },
        { endDate: { gte: weekStart } },
      ],
    },
    include: {
      employee: {
        select: {
          id: true,
          name: true,
          departmentId: true,
          department: { select: { id: true, name: true } },
        },
      },
      shift: {
        select: {
          id: true,
          name: true,
          type: true,
          startTime: true,
          endTime: true,
        },
      },
    },
    orderBy: [
      { employee: { department: { name: "asc" } } },
      { employee: { name: "asc" } },
    ],
  });

  // Group by department, then by employee
  const departmentMap = new Map<
    string,
    {
      id: string;
      name: string;
      employees: Map<
        string,
        {
          id: string;
          name: string;
          shifts: { shiftName: string; shiftType: string }[];
        }
      >;
    }
  >();

  // Generate weekday dates (Mon-Fri)
  const weekDays: string[] = [];
  for (let i = 0; i < 5; i++) {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    weekDays.push(d.toISOString().split("T")[0]);
  }

  for (const assignment of assignments) {
    const dept = assignment.employee.department;
    if (!dept) continue;

    if (!departmentMap.has(dept.id)) {
      departmentMap.set(dept.id, {
        id: dept.id,
        name: dept.name,
        employees: new Map(),
      });
    }

    const deptEntry = departmentMap.get(dept.id)!;
    const empId = assignment.employee.id;

    if (!deptEntry.employees.has(empId)) {
      // Initialize with empty shifts for each weekday
      deptEntry.employees.set(empId, {
        id: empId,
        name: assignment.employee.name,
        shifts: weekDays.map(() => ({ shiftName: "", shiftType: "" })),
      });
    }

    const empEntry = deptEntry.employees.get(empId)!;

    // Fill in shift for each applicable day
    for (let i = 0; i < weekDays.length; i++) {
      const dayDate = new Date(weekDays[i]);
      const assignStart = new Date(assignment.startDate);
      assignStart.setHours(0, 0, 0, 0);
      const assignEnd = assignment.endDate
        ? new Date(assignment.endDate)
        : null;
      if (assignEnd) assignEnd.setHours(23, 59, 59, 999);

      if (
        dayDate >= assignStart &&
        (assignEnd === null || dayDate <= assignEnd)
      ) {
        empEntry.shifts[i] = {
          shiftName: assignment.shift.name,
          shiftType: assignment.shift.type,
        };
      }
    }
  }

  // Convert to array format
  const departments = Array.from(departmentMap.values()).map((dept) => ({
    id: dept.id,
    name: dept.name,
    employees: Array.from(dept.employees.values()),
  }));

  // Format week days with day names
  const DAY_NAMES = ["일", "월", "화", "수", "목", "금", "토"];
  const formattedDays = weekDays.map((dateStr) => {
    const d = new Date(dateStr);
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const dayName = DAY_NAMES[d.getDay()];
    return { date: dateStr, label: `${dayName} (${month}/${day})` };
  });

  return NextResponse.json({
    weekStart: weekStart.toISOString().split("T")[0],
    weekDays: formattedDays,
    departments,
  });
  } catch (error) {
    console.error("[attendance/shifts GET] Error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// ─── POST: 근무 시프트 배정 생성 ────────────────────────
export async function POST(request: NextRequest) {
  try {
  const token = await getToken({ req: request });
  if (!token || !token.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tenantId = token.tenantId as string;

  const body = await request.json();
  const { employeeId, shiftId, startDate, endDate } = body;

  if (!employeeId || !shiftId || !startDate) {
    return NextResponse.json(
      { error: "employeeId, shiftId, startDate는 필수입니다" },
      { status: 400 },
    );
  }

  // 직원 존재 확인
  const employee = await prisma.employee.findFirst({
    where: { id: employeeId, tenantId },
  });

  if (!employee) {
    return NextResponse.json(
      { error: "해당 직원을 찾을 수 없습니다" },
      { status: 404 },
    );
  }

  // 시프트 존재 확인
  const shift = await prisma.shift.findFirst({
    where: { id: shiftId, tenantId },
  });

  if (!shift) {
    return NextResponse.json(
      { error: "해당 시프트를 찾을 수 없습니다" },
      { status: 404 },
    );
  }

  const assignment = await prisma.shiftAssignment.create({
    data: {
      tenantId,
      employeeId,
      shiftId,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
    },
    include: {
      employee: { select: { id: true, name: true } },
      shift: { select: { id: true, name: true, type: true, startTime: true, endTime: true } },
    },
  });

  return NextResponse.json({ data: assignment }, { status: 201 });
  } catch (error) {
    console.error("[attendance/shifts POST] Error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// ─── PATCH: 근무 시프트 배정 수정 ───────────────────────
export async function PATCH(request: NextRequest) {
  try {
  const token = await getToken({ req: request });
  if (!token || !token.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tenantId = token.tenantId as string;

  const body = await request.json();
  const { id, shiftId, startDate, endDate } = body;

  if (!id) {
    return NextResponse.json(
      { error: "id는 필수입니다" },
      { status: 400 },
    );
  }

  const existing = await prisma.shiftAssignment.findFirst({
    where: { id, tenantId },
  });

  if (!existing) {
    return NextResponse.json(
      { error: "해당 시프트 배정을 찾을 수 없습니다" },
      { status: 404 },
    );
  }

  const data: Record<string, unknown> = {};

  if (shiftId !== undefined) {
    const shift = await prisma.shift.findFirst({
      where: { id: shiftId, tenantId },
    });
    if (!shift) {
      return NextResponse.json(
        { error: "해당 시프트를 찾을 수 없습니다" },
        { status: 404 },
      );
    }
    data.shiftId = shiftId;
  }

  if (startDate !== undefined) {
    data.startDate = new Date(startDate);
  }

  if (endDate !== undefined) {
    data.endDate = endDate ? new Date(endDate) : null;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json(
      { error: "수정할 필드가 없습니다" },
      { status: 400 },
    );
  }

  const updated = await prisma.shiftAssignment.update({
    where: { id },
    data,
    include: {
      employee: { select: { id: true, name: true } },
      shift: { select: { id: true, name: true, type: true, startTime: true, endTime: true } },
    },
  });

  return NextResponse.json({ data: updated });
  } catch (error) {
    console.error("[attendance/shifts PATCH] Error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
