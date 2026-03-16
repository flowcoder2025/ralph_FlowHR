import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { utcToday } from "@/lib/date-utils";
import { calculateDistance } from "@/lib/geo";

interface GpsBody {
  latitude?: number;
  longitude?: number;
}

/** Tenant settings에서 GPS 설정 추출 */
function getGpsSettings(settings: unknown): {
  officeLatitude?: number;
  officeLongitude?: number;
  allowedRadius?: number;
} {
  if (!settings || typeof settings !== "object") return {};
  const s = settings as Record<string, unknown>;
  return {
    officeLatitude: typeof s.officeLatitude === "number" ? s.officeLatitude : undefined,
    officeLongitude: typeof s.officeLongitude === "number" ? s.officeLongitude : undefined,
    allowedRadius: typeof s.allowedRadius === "number" ? s.allowedRadius : undefined,
  };
}

/** GPS 위치 검증 — 설정이 없으면 통과, 좌표가 없으면 통과 */
function validateLocation(
  body: GpsBody,
  gps: ReturnType<typeof getGpsSettings>,
): { ok: boolean; error?: string; distance?: number } {
  const hasUserCoords = typeof body.latitude === "number" && typeof body.longitude === "number";
  const hasOfficeCoords = typeof gps.officeLatitude === "number" && typeof gps.officeLongitude === "number";

  if (!hasOfficeCoords || !hasUserCoords) return { ok: true };

  const distance = calculateDistance(
    body.latitude!, body.longitude!,
    gps.officeLatitude!, gps.officeLongitude!,
  );
  const radius = gps.allowedRadius ?? 500;

  if (distance > radius) {
    return {
      ok: false,
      distance,
      error: `사무실에서 ${distance}m 떨어져 있습니다 (허용 반경: ${radius}m)`,
    };
  }
  return { ok: true, distance };
}

// ─── POST: 출근 기록 생성 ──────────────────────────────
export async function POST(request: NextRequest) {
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

  // 요청 바디 파싱 (optional — 기존 호출 호환)
  let body: GpsBody = {};
  try {
    const raw = await request.json();
    if (raw && typeof raw === "object") body = raw;
  } catch {
    // 바디 없이 호출해도 정상 진행
  }

  const now = new Date();
  const today = utcToday();

  // 오늘 이미 출근 기록이 있는지 확인
  const existing = await prisma.attendanceRecord.findUnique({
    where: {
      tenantId_employeeId_date: { tenantId, employeeId, date: today },
    },
  });

  if (existing) {
    return NextResponse.json(
      { error: "오늘 이미 출근 기록이 존재합니다" },
      { status: 409 },
    );
  }

  // GPS 위치 검증
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { settings: true },
  });
  const gps = getGpsSettings(tenant?.settings);
  const validation = validateLocation(body, gps);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const record = await prisma.attendanceRecord.create({
    data: {
      tenantId,
      employeeId,
      date: today,
      checkIn: now,
      status: "PRESENT",
      checkInLat: body.latitude,
      checkInLon: body.longitude,
    },
  });

  return NextResponse.json({ data: record }, { status: 201 });
  } catch (error) {
    console.error("[employee/schedule/checkin POST] Error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// ─── PATCH: 퇴근 기록 업데이트 ─────────────────────────
export async function PATCH(request: NextRequest) {
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

  // 요청 바디 파싱 (optional)
  let body: GpsBody = {};
  try {
    const raw = await request.json();
    if (raw && typeof raw === "object") body = raw;
  } catch {
    // 바디 없이 호출해도 정상 진행
  }

  const now = new Date();
  const today = utcToday();

  const existing = await prisma.attendanceRecord.findUnique({
    where: {
      tenantId_employeeId_date: { tenantId, employeeId, date: today },
    },
  });

  if (!existing) {
    return NextResponse.json(
      { error: "오늘 출근 기록이 없습니다" },
      { status: 404 },
    );
  }

  if (!existing.checkIn) {
    return NextResponse.json(
      { error: "출근 기록이 없어 퇴근할 수 없습니다" },
      { status: 400 },
    );
  }

  if (existing.checkOut) {
    return NextResponse.json(
      { error: "이미 퇴근 처리되었습니다" },
      { status: 409 },
    );
  }

  // GPS 위치 검증
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { settings: true },
  });
  const gps = getGpsSettings(tenant?.settings);
  const validation = validateLocation(body, gps);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const workMinutes = Math.floor(
    (now.getTime() - existing.checkIn.getTime()) / (1000 * 60),
  );

  const record = await prisma.attendanceRecord.update({
    where: { id: existing.id },
    data: {
      checkOut: now,
      workMinutes,
      checkOutLat: body.latitude,
      checkOutLon: body.longitude,
    },
  });

  return NextResponse.json({ data: record });
  } catch (error) {
    console.error("[employee/schedule/checkin PATCH] Error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
