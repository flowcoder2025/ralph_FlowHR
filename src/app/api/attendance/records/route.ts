import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { formatTimeWithTz, formatDateWithTz } from "@/lib/date-utils";
import type { Prisma, AttendanceStatus } from "@prisma/client";
import { DEFAULT_TIMEZONE } from "@/lib/constants";

const VALID_STATUSES: AttendanceStatus[] = [
  "PRESENT",
  "ABSENT",
  "LATE",
  "EARLY_LEAVE",
  "HALF_DAY",
];

export async function GET(request: NextRequest) {
  try {
  const token = await getToken({ req: request });
  if (!token || !token.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tenantId = token.tenantId;
  const { searchParams } = request.nextUrl;

  const search = searchParams.get("search") ?? "";
  const status = searchParams.get("status") ?? "";
  const sortKey = searchParams.get("sortKey") ?? "date";
  const sortDir = searchParams.get("sortDir") === "asc" ? "asc" : "desc";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const pageSize = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get("pageSize") ?? "10", 10)),
  );

  const where: Prisma.AttendanceRecordWhereInput = {
    tenantId,
  };

  if (search) {
    where.employee = {
      name: { contains: search, mode: "insensitive" },
    };
  }

  if (status && VALID_STATUSES.includes(status as AttendanceStatus)) {
    where.status = status as AttendanceStatus;
  }

  // Build orderBy based on sortKey
  type OrderByType = Prisma.AttendanceRecordOrderByWithRelationInput;
  let orderBy: OrderByType;

  switch (sortKey) {
    case "name":
      orderBy = { employee: { name: sortDir } };
      break;
    case "checkIn":
      orderBy = { checkIn: sortDir };
      break;
    case "checkOut":
      orderBy = { checkOut: sortDir };
      break;
    case "workMinutes":
      orderBy = { workMinutes: sortDir };
      break;
    case "status":
      orderBy = { status: sortDir };
      break;
    default:
      orderBy = { date: sortDir };
  }

  // Tenant timezone 조회
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId as string },
    select: { settings: true },
  });
  const tenantSettings = (tenant?.settings && typeof tenant.settings === "object") ? tenant.settings as Record<string, unknown> : {};
  const tz = (typeof tenantSettings.timezone === "string" && tenantSettings.timezone) || DEFAULT_TIMEZONE;

  const [records, total] = await Promise.all([
    prisma.attendanceRecord.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            department: { select: { name: true } },
          },
        },
      },
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.attendanceRecord.count({ where }),
  ]);

  const data = records.map((r) => {
    // prisma generate 전 빌드 호환을 위한 확장 캐스트
    const rec = r as typeof r & {
      checkInGpsStatus?: string | null;
      checkOutGpsStatus?: string | null;
    };
    const checkInTime = formatTimeWithTz(rec.checkIn, tz);
    const checkOutTime = formatTimeWithTz(rec.checkOut, tz);

    let workDisplay: string;
    if (rec.workMinutes !== null && rec.workMinutes > 0) {
      const hours = Math.floor(rec.workMinutes / 60);
      const mins = rec.workMinutes % 60;
      workDisplay = `${hours}h ${mins}m`;
    } else if (rec.checkIn && !rec.checkOut) {
      workDisplay = "진행 중";
    } else {
      workDisplay = "—";
    }

    return {
      id: rec.id,
      employeeName: rec.employee.name,
      department: rec.employee.department?.name ?? "—",
      date: formatDateWithTz(rec.date, tz) ?? "—",
      checkIn: checkInTime,
      checkOut: checkOutTime,
      workDisplay,
      status: rec.status,
      overtime: rec.overtime,
      checkInLat: rec.checkInLat,
      checkInLon: rec.checkInLon,
      checkOutLat: rec.checkOutLat,
      checkOutLon: rec.checkOutLon,
      checkInGpsStatus: rec.checkInGpsStatus ?? null,
      checkOutGpsStatus: rec.checkOutGpsStatus ?? null,
    };
  });

  return NextResponse.json({
    data,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  });
  } catch (error) {
    console.error("[attendance/records GET] Error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// ─── PATCH: 출퇴근 기록 수정 ────────────────────────────
export async function PATCH(request: NextRequest) {
  try {
  const token = await getToken({ req: request });
  if (!token || !token.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tenantId = token.tenantId;

  const body = await request.json();
  const { id, checkIn, checkOut, status, note, overtime } = body;

  if (!id) {
    return NextResponse.json(
      { error: "id는 필수입니다" },
      { status: 400 },
    );
  }

  const record = await prisma.attendanceRecord.findFirst({
    where: { id, tenantId },
  });

  if (!record) {
    return NextResponse.json(
      { error: "해당 출퇴근 기록을 찾을 수 없습니다" },
      { status: 404 },
    );
  }

  const data: Record<string, unknown> = {};

  if (checkIn !== undefined) {
    data.checkIn = checkIn ? new Date(checkIn) : null;
  }

  if (checkOut !== undefined) {
    data.checkOut = checkOut ? new Date(checkOut) : null;
  }

  if (status !== undefined && VALID_STATUSES.includes(status as AttendanceStatus)) {
    data.status = status;
  }

  if (note !== undefined) {
    data.note = note;
  }

  if (overtime !== undefined) {
    data.overtime = Number(overtime);
  }

  // 근무 시간 재계산
  const finalCheckIn = data.checkIn !== undefined ? data.checkIn as Date | null : record.checkIn;
  const finalCheckOut = data.checkOut !== undefined ? data.checkOut as Date | null : record.checkOut;

  if (finalCheckIn && finalCheckOut) {
    data.workMinutes = Math.floor(
      ((finalCheckOut as Date).getTime() - (finalCheckIn as Date).getTime()) / (1000 * 60),
    );
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json(
      { error: "수정할 필드가 없습니다" },
      { status: 400 },
    );
  }

  const updated = await prisma.attendanceRecord.update({
    where: { id },
    data,
    include: {
      employee: {
        select: {
          id: true,
          name: true,
          department: { select: { name: true } },
        },
      },
    },
  });

  return NextResponse.json({ data: updated });
  } catch (error) {
    console.error("[attendance/records PATCH] Error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
