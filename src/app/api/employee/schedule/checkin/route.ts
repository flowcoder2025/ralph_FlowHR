import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

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

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

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

  const record = await prisma.attendanceRecord.create({
    data: {
      tenantId,
      employeeId,
      date: today,
      checkIn: now,
      status: "PRESENT",
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

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

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

  const workMinutes = Math.floor(
    (now.getTime() - existing.checkIn.getTime()) / (1000 * 60),
  );

  const record = await prisma.attendanceRecord.update({
    where: { id: existing.id },
    data: {
      checkOut: now,
      workMinutes,
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
