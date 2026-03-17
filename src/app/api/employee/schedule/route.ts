import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { utcToday, utcTodayEnd, utcMonday, utcDaysOffset, utcMonthStart, utcLastMonthStart, utcLastMonthEnd, isSameUTCDay } from "@/lib/date-utils";
import { DEFAULT_TIMEZONE, DEFAULT_WORK_START_TIME, DEFAULT_WORK_END_TIME, HISTORY_LOOKBACK_DAYS, DEFAULT_PAGE_SIZE } from "@/lib/constants";

const SHIFT_TYPE_LABEL: Record<string, string> = {
  REGULAR: "일반 근무",
  MORNING: "오전 근무",
  AFTERNOON: "오후 근무",
  NIGHT: "야간 근무",
  FLEXIBLE: "유연 근무",
};

const DAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

/** Tenant timezone 기준으로 시각 포맷 (서버 환경 무관) */
function formatTime(date: Date | null | undefined, timezone = "Asia/Seoul"): string | null {
  if (!date) return null;
  const parts = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: timezone,
  }).formatToParts(date);
  const h = parts.find((p) => p.type === "hour")?.value ?? "00";
  const m = parts.find((p) => p.type === "minute")?.value ?? "00";
  return `${h}:${m}`;
}

function formatWorkMinutes(minutes: number | null | undefined): string | null {
  if (minutes === null || minutes === undefined) return null;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}시간 ${mins.toString().padStart(2, "0")}분`;
}

function isSameDay(a: Date, b: Date): boolean {
  return isSameUTCDay(a, b);
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
  try {
  const token = await getToken({ req: request });
  if (!token || !token.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tenantId = token.tenantId as string;
  const employee = await prisma.employee.findFirst({
    where: { userId: token.id, tenantId },
  });
  if (!employee) {
    return NextResponse.json({ error: "직원 정보를 찾을 수 없습니다" }, { status: 404 });
  }
  const employeeId = employee.id;
  const { searchParams } = new URL(request.url);
  const filter = searchParams.get("filter") || "recent2w";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = DEFAULT_PAGE_SIZE;

  // Tenant timezone 조회
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { settings: true },
  });
  const tenantSettings = (tenant?.settings && typeof tenant.settings === "object") ? tenant.settings as Record<string, unknown> : {};
  const tz = (typeof tenantSettings.timezone === "string" && tenantSettings.timezone) || DEFAULT_TIMEZONE;

  const now = new Date();
  const today = utcToday();

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
  const shiftStart = shiftAssignment?.shift.startTime || DEFAULT_WORK_START_TIME;
  const shiftEnd = shiftAssignment?.shift.endTime || DEFAULT_WORK_END_TIME;

  // Today's attendance
  const todayRecord = await prisma.attendanceRecord.findFirst({
    where: { employeeId, tenantId, date: today },
  });

  let attendanceStatus: "working" | "not_started" | "done" = "not_started";
  if (todayRecord?.checkIn && !todayRecord?.checkOut) attendanceStatus = "working";
  else if (todayRecord?.checkIn && todayRecord?.checkOut) attendanceStatus = "done";

  const todayData = {
    checkIn: formatTime(todayRecord?.checkIn, tz),
    checkOut: formatTime(todayRecord?.checkOut, tz),
    totalHours: formatWorkMinutes(todayRecord?.workMinutes),
    shiftType: shiftName,
    expectedEnd: shiftEnd,
    status: attendanceStatus,
  };

  // Weekly schedule
  const monday = utcMonday();
  const weekDays: Array<{ date: Date; dayLabel: string }> = [];
  for (let i = 0; i < 5; i++) {
    const d = new Date(monday);
    d.setUTCDate(monday.getUTCDate() + i);
    weekDays.push({ date: d, dayLabel: DAY_LABELS[d.getUTCDay()] });
  }

  const friday = weekDays[4].date;
  const weekEnd = new Date(friday);
  weekEnd.setUTCHours(23, 59, 59, 999);

  const weekRecords = await prisma.attendanceRecord.findMany({
    where: {
      employeeId,
      tenantId,
      date: { gte: monday, lte: weekEnd },
    },
  });

  const weekLabel = `${monday.getUTCFullYear()}년 ${monday.getUTCMonth() + 1}월 (${monday.getUTCMonth() + 1}/${monday.getUTCDate()} ~ ${friday.getUTCMonth() + 1}/${friday.getUTCDate()})`;

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
      date: `${wd.date.getUTCMonth() + 1}월 ${wd.date.getUTCDate()}일`,
      shiftType: shiftName,
      startTime: shiftStart,
      endTime: shiftEnd,
      status,
      isToday,
    };
  });

  // History
  let historyStart: Date;
  let historyEnd: Date = utcTodayEnd();

  if (filter === "lastMonth") {
    historyStart = utcLastMonthStart();
    historyEnd = utcLastMonthEnd();
  } else if (filter === "thisMonth") {
    historyStart = utcMonthStart();
  } else {
    historyStart = utcDaysOffset(-HISTORY_LOOKBACK_DAYS);
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
      dayLabel: DAY_LABELS[recordDate.getUTCDay()],
      checkIn: formatTime(r.checkIn, tz),
      checkOut: formatTime(r.checkOut, tz),
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
  } catch (error) {
    console.error("[employee/schedule GET] Error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
