import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

const LEAVE_TYPE_LABEL: Record<string, string> = {
  ANNUAL: "\uC5F0\uCC28",
  HALF_DAY: "\uBC18\uCC28",
  SICK: "\uBCD1\uAC00",
  FAMILY_EVENT: "\uACBD\uC870\uC0AC",
  COMPENSATORY: "\uB300\uCCB4\uD734\uAC00",
};

const STATUS_MAP: Record<string, string> = {
  pending: "PENDING",
  approved: "APPROVED",
  rejected: "REJECTED",
};

export async function GET(request: NextRequest) {
  const token = await getToken({ req: request });
  if (!token || !token.tenantId || !token.employeeId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tenantId = token.tenantId;
  const employeeId = token.employeeId as string;
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || "all";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = parseInt(searchParams.get("pageSize") || "6", 10);

  // Fetch leave requests
  const leaveWhere: Record<string, unknown> = { tenantId, employeeId };
  if (STATUS_MAP[status]) leaveWhere.status = STATUS_MAP[status];

  const leaveRequests = await prisma.leaveRequest.findMany({
    where: leaveWhere,
    include: {
      policy: { select: { name: true, type: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Fetch attendance exceptions (corrections)
  const exceptionWhere: Record<string, unknown> = {
    tenantId,
    employeeId,
    type: "CORRECTION",
  };
  if (STATUS_MAP[status]) exceptionWhere.status = STATUS_MAP[status];

  const exceptions = await prisma.attendanceException.findMany({
    where: exceptionWhere,
    orderBy: { createdAt: "desc" },
  });

  // Fetch approval requests (expense/general)
  const approvalWhere: Record<string, unknown> = {
    tenantId,
    requesterId: employeeId,
  };
  if (status === "pending") {
    approvalWhere.status = { in: ["PENDING", "IN_PROGRESS"] };
  } else if (STATUS_MAP[status]) {
    approvalWhere.status = STATUS_MAP[status];
  }

  const approvalRequests = await prisma.approvalRequest.findMany({
    where: approvalWhere,
    orderBy: { createdAt: "desc" },
  });

  // Get employee's manager info
  const employee = await prisma.employee.findFirst({
    where: { id: employeeId, tenantId },
    include: {
      department: {
        include: {
          manager: { select: { name: true } },
        },
      },
    },
  });

  const managerName = employee?.department?.manager?.name || "";
  const managerInitial = managerName ? managerName.charAt(0) : "";

  // Map to unified format
  const leaveItems = leaveRequests.map((r) => {
    const startStr = r.startDate.toISOString().slice(0, 10);
    const endStr = r.endDate.toISOString().slice(0, 10);
    const typeLabel = LEAVE_TYPE_LABEL[r.policy.type] || r.policy.name;
    const dateRange = startStr !== endStr ? `${startStr}~${endStr}` : startStr;
    return {
      id: r.id,
      type: typeLabel,
      typeBadgeVariant: "info" as const,
      content: `${dateRange} ${typeLabel} (${r.days}\uC77C)`,
      requestDate: r.createdAt.toISOString().slice(0, 10),
      approver: managerName,
      approverInitial: managerInitial,
      status: r.status.toLowerCase() as "pending" | "approved" | "rejected",
    };
  });

  const exceptionItems = exceptions.map((e) => ({
    id: e.id,
    type: "\uCD9C\uD1F4\uADFC \uC815\uC815",
    typeBadgeVariant: "neutral" as const,
    content: `${e.date.toISOString().slice(0, 10)} \uC2DC\uAC04 \uC815\uC815`,
    requestDate: e.createdAt.toISOString().slice(0, 10),
    approver: managerName,
    approverInitial: managerInitial,
    status: e.status.toLowerCase() as "pending" | "approved" | "rejected",
  }));

  const approvalTypeLabel: Record<string, string> = {
    expense: "\uACBD\uBE44",
    general: "\uD488\uC758",
  };

  const approvalItems = approvalRequests
    .filter((a) => ["expense", "general"].includes(a.requestType))
    .map((a) => ({
      id: a.id,
      type: approvalTypeLabel[a.requestType] || a.requestType,
      typeBadgeVariant: "neutral" as const,
      content: a.title,
      requestDate: a.createdAt.toISOString().slice(0, 10),
      approver: managerName,
      approverInitial: managerInitial,
      status: (
        a.status === "IN_PROGRESS" ? "pending" : a.status.toLowerCase()
      ) as "pending" | "approved" | "rejected",
    }));

  // Combine and sort by requestDate descending
  const allItems = [...leaveItems, ...exceptionItems, ...approvalItems].sort(
    (a, b) => b.requestDate.localeCompare(a.requestDate),
  );

  // Paginate
  const total = allItems.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const paged = allItems.slice((page - 1) * pageSize, page * pageSize);

  return NextResponse.json({
    items: paged,
    total,
    totalPages,
    page,
    pageSize,
  });
}
