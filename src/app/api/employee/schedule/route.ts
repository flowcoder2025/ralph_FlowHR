import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

const SHIFT_TYPE_LABEL: Record<string, string> = {
  REGULAR: "일반 근무",
  MORNING: "오전 근무",
  AFTERNOON: "오후 근무",
  NIGHT: "야간 근무",
  FLEXIBLE: "유연 근무",
};

const DAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

function formatTime(date: Date | null | undefined): string | null {
  if (!date) return null;
  const h = date.getHours().toString().padStart(2, "0");
  const m = date.getMinutes().toString().padStart(2, "0");
  return `${h}:${m}`;
}

function formatWorkMinutes(minutes: number | null | undefined): string | null {
  if (minutes === null || minutes === undefined) return null;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}시간 ${mins.toString().padStart(2, "0")}분`;
}

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function mapHistoryStatus(
  status: string,
  isToday: boolean,
  checkIn: Date | null,
  checkOut: Date | null,
): string {
  if (isToday && checkIn && !checkOut) return "working";
  switch (status) {
    case "LATE":
      return "late";
    case "HALF_DAY":
      return "half_day";
    case "ABSENT":
      return "annual";
    default:
      return "normal";
  }
}

export async function GET(request: NextRequest) {
  const token = await getToken({ req: request });
  if (!token || !token.tenantId || !token.employeeId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tenantId = token.tenantId as string;
  const employeeId = token.employeeId as string;
  const { searchParams } = new URL(request.url);
  const filter = searchParams.get("filter") || "recent2w";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = 10;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const employee = await prisma.employee.findFirst({
    where: { id: employeeId, tenantId },
  });

  if (!employee) {
    return NextResponse.json({ error: "Employee not found" }, { status: 404 });
  }

  // Shift assignment
  const shiftAssignment = await prisma.shiftAssignment.findFirst({
    where: {
      employeeId,
      tenantId,
      startDate: { lte: now },
      OR: [{ endDate: null }, { endDate: { gte: today } }],
    },
    include: { shift: true },
    orderBy: { startDate: "desc" },
  });

  const shiftName = shiftAssignment
    ? SHIFT_TYPE_LABEL[shiftAssignment.shift.type] || shiftAssignment.shift.name
    : "일반 근무";
  const shiftStart = shiftAssignment?.shift.startTime || "09:00";
  const shiftEnd = shiftAssignment?.shift.endTime || "18:00";

  // Today's attendance
  const todayRecord = await prisma.attendanceRecord.findFirst({
    where: { employeeId, tenantId, date: today },
  });

  let attendanceStatus: "working" | "not_started" | "done" = "not_started";
  if (todayRecord?.checkIn && !todayRecord?.checkOut) attendanceStatus = "working";
  else if (todayRecord?.checkIn && todayRecord?.checkOut) attendanceStatus = "done";

  const todayData = {
    checkIn: formatTime(todayRecord?.checkIn),
    checkOut: formatTime(todayRecord?.checkOut),
    totalHours: formatWorkMinutes(todayRecord?.workMinutes),
    shiftType: shiftName,
    expectedEnd: shiftEnd,
    status: attendanceStatus,
  };

  // Weekly schedule
  const monday = getMonday(today);
  const weekDays: Array<{ date: Date; dayLabel: string }> = [];
  for (let i = 0; i < 5; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    weekDays.push({ date: d, dayLabel: DAY_LABELS[d.getDay()] });
  }

  const friday = weekDays[4].date;
  const weekEnd = new Date(friday);
  weekEnd.setHours(23, 59, 59, 999);

  const weekRecords = await prisma.attendanceRecord.findMany({
    where: {
      employeeId,
      tenantId,
      date: { gte: monday, lte: weekEnd },
    },
  });

  const weekLabel = `${monday.getFullYear()}년 ${monday.getMonth() + 1}월 (${monday.getMonth() + 1}/${monday.getDate()} ~ ${friday.getMonth() + 1}/${friday.getDate()})`;

  const weeklySchedule = weekDays.map((wd) => {
    const record = weekRecords.find((r) => isSameDay(new Date(r.date), wd.date));
    const isToday = isSameDay(wd.date, today);
    let status: "normal" | "working" | "scheduled" = "scheduled";
    if (wd.date < today) {
      status = "normal";
    } else if (isToday) {
      status =
        record?.checkIn && !record?.checkOut
          ? "working"
          : record?.checkIn
            ? "normal"
            : "scheduled";
    }
    return {
      dayLabel: wd.dayLabel,
      date: `${wd.date.getMonth() + 1}월 ${wd.date.getDate()}일`,
      shiftType: shiftName,
      startTime: shiftStart,
      endTime: shiftEnd,
      status,
      isToday,
    };
  });

  // History
  let historyStart: Date;
  let historyEnd: Date = new Date(today);
  historyEnd.setHours(23, 59, 59, 999);

  if (filter === "lastMonth") {
    historyStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    historyEnd = new Date(today.getFullYear(), today.getMonth(), 0);
    historyEnd.setHours(23, 59, 59, 999);
  } else if (filter === "thisMonth") {
    historyStart = new Date(today.getFullYear(), today.getMonth(), 1);
  } else {
    historyStart = new Date(today);
    historyStart.setDate(today.getDate() - 13);
  }

  const historyRecords = await prisma.attendanceRecord.findMany({
    where: {
      employeeId,
      tenantId,
      date: { gte: historyStart, lte: historyEnd },
    },
    orderBy: { date: "desc" },
  });

  const historyItems = historyRecords.map((r) => {
    const recordDate = new Date(r.date);
    const isToday = isSameDay(recordDate, today);
    return {
      id: r.id,
      date: r.date.toISOString().slice(0, 10),
      dayLabel: DAY_LABELS[recordDate.getDay()],
      checkIn: formatTime(r.checkIn),
      checkOut: formatTime(r.checkOut),
      totalWork: formatWorkMinutes(r.workMinutes),
      status: mapHistoryStatus(r.status, isToday, r.checkIn, r.checkOut),
      isToday,
    };
  });

  const total = historyItems.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pagedItems = historyItems.slice((page - 1) * pageSize, page * pageSize);

  return NextResponse.json({
    data: {
      today: todayData,
      weekLabel,
      weeklySchedule,
      history: {
        items: pagedItems,
        total,
        totalPages,
        page,
        pageSize,
      },
    },
  });
}
