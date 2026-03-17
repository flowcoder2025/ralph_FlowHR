import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

// ─── POST: 근태 정정 신청 ──────────────────────────────
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

  const body = await request.json();
  const { date, reason, correctionType, correctedTime } = body;

  if (!date || !reason) {
    return NextResponse.json(
      { error: "date, reason은 필수입니다" },
      { status: 400 },
    );
  }

  const targetDate = new Date(date);
  targetDate.setUTCHours(0, 0, 0, 0);

  // 동일 날짜 중복 정정 신청 확인
  const existing = await prisma.attendanceException.findFirst({
    where: {
      tenantId,
      employeeId,
      date: targetDate,
      type: "CORRECTION",
      status: "PENDING",
    },
  });

  if (existing) {
    return NextResponse.json(
      { error: "해당 날짜에 이미 대기 중인 정정 신청이 있습니다" },
      { status: 409 },
    );
  }

  // 정정 시간값 저장 (correctionType: "checkin" | "checkout", correctedTime: "HH:mm")
  const correctedCheckIn = correctionType === "checkin" && correctedTime ? correctedTime : undefined;
  const correctedCheckOut = correctionType === "checkout" && correctedTime ? correctedTime : undefined;

  // prisma generate 전 빌드 호환: 새 필드를 포함하기 위해 data를 캐스트
  const createData = {
    tenantId,
    employeeId,
    type: "CORRECTION" as const,
    date: targetDate,
    reason,
    status: "PENDING" as const,
    correctedCheckIn,
    correctedCheckOut,
  };

  const exception = await prisma.attendanceException.create({
    data: createData as Parameters<typeof prisma.attendanceException.create>[0]["data"],
  });

  return NextResponse.json({ data: exception }, { status: 201 });
  } catch (error) {
    console.error("[employee/requests/correction POST] Error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
