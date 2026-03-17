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
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || "";
  const search = searchParams.get("search") || "";

  const where: Record<string, unknown> = { tenantId };

  if (status && status !== "ALL") {
    where.status = status;
  }

  if (search) {
    where.employee = {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { employeeNumber: { contains: search, mode: "insensitive" } },
      ],
    };
  }

  const requests = await prisma.leaveRequest.findMany({
    where,
    include: {
      employee: {
        select: {
          id: true,
          name: true,
          employeeNumber: true,
          department: { select: { name: true } },
        },
      },
      policy: {
        select: { name: true, type: true },
      },
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });

  const items = requests.map((r) => ({
    id: r.id,
    employeeName: r.employee.name,
    employeeNumber: r.employee.employeeNumber,
    department: r.employee.department?.name ?? "-",
    leaveType: r.policy.type,
    leaveTypeName: r.policy.name,
    status: r.status,
    startDate: r.startDate.toISOString().slice(0, 10),
    endDate: r.endDate.toISOString().slice(0, 10),
    days: r.days,
    reason: r.reason ?? "",
    approvedBy: r.approvedBy,
    approvedAt: r.approvedAt?.toISOString() ?? null,
    rejectedBy: r.rejectedBy,
    rejectedAt: r.rejectedAt?.toISOString() ?? null,
    rejectReason: r.rejectReason ?? null,
    createdAt: r.createdAt.toISOString(),
  }));

  const summary = {
    total: items.length,
    pending: items.filter((i) => i.status === "PENDING").length,
    approved: items.filter((i) => i.status === "APPROVED").length,
    rejected: items.filter((i) => i.status === "REJECTED").length,
  };

  return NextResponse.json({ data: items, summary });
  } catch (error) {
    console.error("[leave/requests GET] Error:", error);
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

  const currentEmployee = await prisma.employee.findFirst({
    where: { userId: token.id as string, tenantId: tenantId as string },
  });
  // Admin 유저는 Employee 레코드가 없을 수 있으므로 userId로 대체
  const actorId = currentEmployee?.id ?? (token.id as string);
  const body = await request.json();
  const { id, action } = body as { id: string; action: "approve" | "reject"; rejectReason?: string };

  if (!id || !action) {
    return NextResponse.json({ error: "id와 action은 필수입니다" }, { status: 400 });
  }

  const leaveRequest = await prisma.leaveRequest.findFirst({
    where: { id, tenantId, status: "PENDING" },
    include: { policy: true },
  });

  if (!leaveRequest) {
    return NextResponse.json(
      { error: "대기 중인 요청을 찾을 수 없습니다" },
      { status: 404 },
    );
  }

  const now = new Date();

  if (action === "approve") {
    await prisma.$transaction([
      prisma.leaveRequest.update({
        where: { id },
        data: {
          status: "APPROVED",
          approvedBy: actorId,
          approvedAt: now,
        },
      }),
      prisma.leaveBalance.updateMany({
        where: {
          tenantId,
          employeeId: leaveRequest.employeeId,
          policyId: leaveRequest.policyId,
          year: now.getFullYear(),
        },
        data: {
          usedDays: { increment: leaveRequest.days },
          pendingDays: { decrement: leaveRequest.days },
        },
      }),
      prisma.notification.create({
        data: {
          tenantId: tenantId as string,
          employeeId: leaveRequest.employeeId,
          type: "LEAVE",
          title: "휴가 승인",
          message: `${leaveRequest.policy.name} 휴가 신청이 승인되었습니다.`,
        },
      }),
    ]);
  } else {
    const rejectReason = body.rejectReason || null;
    await prisma.$transaction([
      prisma.leaveRequest.update({
        where: { id },
        data: {
          status: "REJECTED",
          rejectedBy: actorId,
          rejectedAt: now,
          rejectReason,
        },
      }),
      prisma.leaveBalance.updateMany({
        where: {
          tenantId,
          employeeId: leaveRequest.employeeId,
          policyId: leaveRequest.policyId,
          year: now.getFullYear(),
        },
        data: {
          pendingDays: { decrement: leaveRequest.days },
        },
      }),
      prisma.notification.create({
        data: {
          tenantId: tenantId as string,
          employeeId: leaveRequest.employeeId,
          type: "LEAVE",
          title: "휴가 반려",
          message: rejectReason
            ? `${leaveRequest.policy.name} 휴가 신청이 반려되었습니다. (사유: ${rejectReason})`
            : `${leaveRequest.policy.name} 휴가 신청이 반려되었습니다.`,
        },
      }),
    ]);
  }

  return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[leave/requests PATCH] Error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
