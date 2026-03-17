import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { formatDateWithTz } from "@/lib/date-utils";
import { DEFAULT_TIMEZONE } from "@/lib/constants";
import type { ExceptionType, ExceptionStatus } from "@prisma/client";

/**
 * Tenant timezone 기준 "HH:mm" → UTC Date 변환
 * 예: recordDate=2026-03-17, time="09:00", tz="Asia/Seoul"
 *   → KST 09:00 = UTC 00:00 → 2026-03-17T00:00:00Z
 */
function localTimeToUTC(recordDate: Date, time: string, timezone: string): Date {
  const [h, m] = time.split(":").map(Number);
  // 임시로 UTC에 로컬 시각을 넣고, Intl로 실제 UTC offset을 계산
  const tentative = new Date(recordDate);
  tentative.setUTCHours(h, m, 0, 0);
  // Intl.DateTimeFormat으로 해당 timezone의 실제 시각을 구해서 offset 역산
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false,
  });
  const parts = formatter.formatToParts(tentative);
  const tzH = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
  const tzM = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
  // offset(분) = (tz에서 보이는 시각) - (UTC 시각)
  const utcMinutes = h * 60 + m;
  const localMinutes = tzH * 60 + tzM;
  const offsetMinutes = localMinutes - utcMinutes;
  // 사용자가 입력한 시각은 로컬이므로, UTC = 로컬 - offset
  const result = new Date(recordDate);
  result.setUTCHours(h, m, 0, 0);
  result.setUTCMinutes(result.getUTCMinutes() - offsetMinutes);
  return result;
}

const VALID_TYPES: ExceptionType[] = [
  "CORRECTION",
  "OVERTIME",
  "BUSINESS_TRIP",
  "REMOTE_WORK",
];

const VALID_STATUSES: ExceptionStatus[] = ["PENDING", "APPROVED", "REJECTED"];

export async function GET(request: NextRequest) {
  try {
  const token = await getToken({ req: request });
  if (!token || !token.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tenantId = token.tenantId;
  const { searchParams } = request.nextUrl;

  const typeFilter = searchParams.get("type") ?? "";
  const statusFilter = searchParams.get("status") ?? "";

  const where: {
    tenantId: string;
    type?: ExceptionType;
    status?: ExceptionStatus;
  } = { tenantId };

  if (typeFilter && VALID_TYPES.includes(typeFilter as ExceptionType)) {
    where.type = typeFilter as ExceptionType;
  }
  if (
    statusFilter &&
    VALID_STATUSES.includes(statusFilter as ExceptionStatus)
  ) {
    where.status = statusFilter as ExceptionStatus;
  }

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId as string }, select: { settings: true } });
  const tenantSettings = (tenant?.settings && typeof tenant.settings === "object") ? tenant.settings as Record<string, unknown> : {};
  const tz = (typeof tenantSettings.timezone === "string" && tenantSettings.timezone) || DEFAULT_TIMEZONE;

  const exceptions = await prisma.attendanceException.findMany({
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
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });

  // Group by type with counts
  const grouped: Record<
    string,
    {
      type: string;
      total: number;
      pending: number;
      items: {
        id: string;
        employeeName: string;
        department: string;
        type: string;
        status: string;
        date: string;
        reason: string;
        approvedBy: string | null;
        approvedAt: string | null;
        createdAt: string;
      }[];
    }
  > = {};

  for (const t of VALID_TYPES) {
    grouped[t] = { type: t, total: 0, pending: 0, items: [] };
  }

  for (const ex of exceptions) {
    const group = grouped[ex.type];
    if (!group) continue;
    group.total += 1;
    if (ex.status === "PENDING") group.pending += 1;
    group.items.push({
      id: ex.id,
      employeeName: ex.employee.name,
      department: ex.employee.department?.name ?? "—",
      type: ex.type,
      status: ex.status,
      date: formatDateWithTz(new Date(ex.date), tz) ?? "—",
      reason: ex.reason,
      approvedBy: ex.approvedBy,
      approvedAt: ex.approvedAt
        ? formatDateWithTz(new Date(ex.approvedAt), tz)
        : null,
      createdAt: formatDateWithTz(new Date(ex.createdAt), tz) ?? "—",
    });
  }

  return NextResponse.json({ groups: Object.values(grouped) });
  } catch (error) {
    console.error("[attendance/exceptions GET] Error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
  const token = await getToken({ req: request });
  if (!token || !token.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tenantId = token.tenantId;
  const body = await request.json();
  const { id, action } = body as { id: string; action: string };

  if (!id || !["approve", "reject"].includes(action)) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const exception = await prisma.attendanceException.findFirst({
    where: { id, tenantId },
  });

  if (!exception) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (exception.status !== "PENDING") {
    return NextResponse.json(
      { error: "Already processed" },
      { status: 409 },
    );
  }

  // exception을 확장 타입으로 캐스트 (prisma generate 전 빌드 호환)
  const exceptionExt = exception as typeof exception & {
    correctedCheckIn?: string | null;
    correctedCheckOut?: string | null;
  };

  if (action === "approve") {
    // 트랜잭션: exception 승인 + 출결 기록 자동 수정
    const [updated] = await prisma.$transaction(async (tx) => {
      const updatedEx = await tx.attendanceException.update({
        where: { id },
        data: {
          status: "APPROVED",
          approvedBy: token.employeeNumber as string,
          approvedAt: new Date(),
        },
      });

      // CORRECTION 타입 승인 시 해당 날짜 출결 기록 자동 수정
      if (exceptionExt.type === "CORRECTION") {
        const recordDate = new Date(exceptionExt.date);
        recordDate.setUTCHours(0, 0, 0, 0);

        // Tenant timezone 조회 (정정 시각은 로컬 시간대 기준)
        const tenantRecord = await tx.tenant.findUnique({
          where: { id: tenantId as string },
          select: { settings: true },
        });
        const tSettings = (tenantRecord?.settings && typeof tenantRecord.settings === "object")
          ? tenantRecord.settings as Record<string, unknown> : {};
        const tz = (typeof tSettings.timezone === "string" && tSettings.timezone) || DEFAULT_TIMEZONE;

        // 기존 출결 기록 조회
        const existingRecord = await tx.attendanceRecord.findUnique({
          where: {
            tenantId_employeeId_date: {
              tenantId,
              employeeId: exceptionExt.employeeId,
              date: recordDate,
            },
          },
        });

        // 정정 시간값 반영 (correctedCheckIn/correctedCheckOut)
        const updateData: Record<string, unknown> = {
          status: "PRESENT",
          note: `정정 승인 (사유: ${exceptionExt.reason})`,
        };

        if (exceptionExt.correctedCheckIn && existingRecord) {
          const correctedDate = localTimeToUTC(recordDate, exceptionExt.correctedCheckIn, tz);
          updateData.checkIn = correctedDate;

          // workMinutes 재계산
          const checkOut = existingRecord.checkOut;
          if (checkOut) {
            updateData.workMinutes = Math.floor(
              (checkOut.getTime() - correctedDate.getTime()) / (1000 * 60),
            );
          }
        }

        if (exceptionExt.correctedCheckOut && existingRecord) {
          const correctedDate = localTimeToUTC(recordDate, exceptionExt.correctedCheckOut, tz);
          updateData.checkOut = correctedDate;

          // workMinutes 재계산
          const checkIn = updateData.checkIn
            ? (updateData.checkIn as Date)
            : existingRecord.checkIn;
          if (checkIn) {
            updateData.workMinutes = Math.floor(
              (correctedDate.getTime() - (checkIn as Date).getTime()) / (1000 * 60),
            );
          }
        }

        await tx.attendanceRecord.upsert({
          where: {
            tenantId_employeeId_date: {
              tenantId,
              employeeId: exceptionExt.employeeId,
              date: recordDate,
            },
          },
          update: updateData,
          create: {
            tenantId,
            employeeId: exceptionExt.employeeId,
            date: recordDate,
            status: "PRESENT",
            note: `정정 승인 (사유: ${exceptionExt.reason})`,
            checkIn: updateData.checkIn as Date | undefined,
            checkOut: updateData.checkOut as Date | undefined,
            workMinutes: updateData.workMinutes as number | undefined,
          },
        });
      }

      return [updatedEx];
    });

    return NextResponse.json({
      id: updated.id,
      status: updated.status,
    });
  } else {
    // reject
    const updated = await prisma.attendanceException.update({
      where: { id },
      data: {
        status: "REJECTED",
        approvedBy: token.employeeNumber as string,
        approvedAt: new Date(),
      },
    });

    return NextResponse.json({
      id: updated.id,
      status: updated.status,
    });
  }
  } catch (error) {
    console.error("[attendance/exceptions PATCH] Error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
