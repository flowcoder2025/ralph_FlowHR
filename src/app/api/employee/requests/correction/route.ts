import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

// ─── POST: 근태 정정 신청 ──────────────────────────────
export async function POST(request: NextRequest) {
  const token = await getToken({ req: request });
  if (!token || !token.tenantId || !token.employeeId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tenantId = token.tenantId as string;
  const employeeId = token.employeeId as string;

  const body = await request.json();
  const { date, reason } = body;

  if (!date || !reason) {
    return NextResponse.json(
      { error: "date, reason은 필수입니다" },
      { status: 400 },
    );
  }

  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);

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

  const exception = await prisma.attendanceException.create({
    data: {
      tenantId,
      employeeId,
      type: "CORRECTION",
      date: targetDate,
      reason,
      status: "PENDING",
    },
  });

  return NextResponse.json({ data: exception }, { status: 201 });
}
