import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const token = await getToken({ req: request });
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const priorityFilter = searchParams.get("priority") ?? "";
  const statusFilter = searchParams.get("status") ?? "";

  // ─── KPI ──────────────────────────────────────────────

  const unresolvedCount = await prisma.supportTicket.count({
    where: { status: { in: ["OPEN", "IN_PROGRESS", "WAITING"] } },
  });

  const slaViolations = await prisma.supportTicket.count({
    where: {
      status: { in: ["OPEN", "IN_PROGRESS", "WAITING"] },
      slaDeadlineAt: { lt: new Date() },
    },
  });

  // 평균 응답시간 (해결된 티켓 기준, 시간 단위)
  const resolvedTickets = await prisma.supportTicket.findMany({
    where: { resolvedAt: { not: null } },
    select: { createdAt: true, resolvedAt: true },
    orderBy: { resolvedAt: "desc" },
    take: 50,
  });

  let avgResponseHours = 1.8;
  if (resolvedTickets.length > 0) {
    const totalMs = resolvedTickets.reduce(
      (sum: number, t: { createdAt: Date; resolvedAt: Date | null }) => {
        const diff = (t.resolvedAt as Date).getTime() - t.createdAt.getTime();
        return sum + diff;
      },
      0,
    );
    avgResponseHours =
      Math.round((totalMs / resolvedTickets.length / (1000 * 60 * 60)) * 10) /
      10;
  }

  // CSAT (시뮬레이션 - DB에 필드 없음)
  const csat = 4.6;

  // ─── Ticket Queue ─────────────────────────────────────

  interface WhereClause {
    status?: { in: string[] } | string;
    priority?: string;
  }

  const where: WhereClause = {};

  if (statusFilter) {
    where.status = statusFilter;
  } else {
    where.status = { in: ["OPEN", "IN_PROGRESS", "WAITING"] };
  }

  if (priorityFilter) {
    where.priority = priorityFilter;
  }

  const tickets = await prisma.supportTicket.findMany({
    where,
    include: { tenant: { select: { name: true } } },
    orderBy: [{ priority: "asc" }, { createdAt: "asc" }],
    take: 20,
  });

  const queue = tickets.map((t) => {
    const ageMs = Date.now() - t.createdAt.getTime();
    const ageMinutes = Math.floor(ageMs / 60000);
    let ageLabel = "방금";
    if (ageMinutes >= 1440) {
      ageLabel = `${Math.floor(ageMinutes / 1440)}일 전`;
    } else if (ageMinutes >= 60) {
      ageLabel = `${Math.floor(ageMinutes / 60)}시간 전`;
    } else if (ageMinutes >= 1) {
      ageLabel = `${ageMinutes}분 전`;
    }

    let slaStatus: "ok" | "warning" | "violated" = "ok";
    let slaRemaining = "";
    if (t.slaDeadlineAt) {
      const remaining = t.slaDeadlineAt.getTime() - Date.now();
      if (remaining < 0) {
        slaStatus = "violated";
        slaRemaining = "SLA 초과";
      } else if (remaining < 60 * 60 * 1000) {
        slaStatus = "warning";
        const mins = Math.floor(remaining / 60000);
        slaRemaining = `${mins}분 남음`;
      } else {
        const hrs = Math.round((remaining / (1000 * 60 * 60)) * 10) / 10;
        slaRemaining = `${hrs}시간 남음`;
      }
    }

    return {
      id: t.id,
      ticketNumber: t.ticketNumber,
      title: t.title,
      description: t.description,
      tenantName: t.tenant.name,
      priority: t.priority.toLowerCase() as
        | "critical"
        | "high"
        | "medium"
        | "low",
      status: t.status,
      category: t.category,
      requesterName: t.requesterName,
      requesterEmail: t.requesterEmail,
      assigneeId: t.assigneeId,
      ageLabel,
      slaStatus,
      slaRemaining,
      slaDeadlineAt: t.slaDeadlineAt?.toISOString() ?? null,
      createdAt: t.createdAt.toISOString(),
    };
  });

  // ─── Status Counts ────────────────────────────────────

  const statusCounts = {
    total: await prisma.supportTicket.count(),
    open: await prisma.supportTicket.count({ where: { status: "OPEN" } }),
    inProgress: await prisma.supportTicket.count({
      where: { status: "IN_PROGRESS" },
    }),
    waiting: await prisma.supportTicket.count({ where: { status: "WAITING" } }),
    resolved: await prisma.supportTicket.count({
      where: { status: "RESOLVED" },
    }),
    closed: await prisma.supportTicket.count({ where: { status: "CLOSED" } }),
  };

  return NextResponse.json({
    kpi: {
      unresolvedTickets: { value: unresolvedCount, delta: 1 },
      slaViolations: { value: slaViolations, label: "4시간 초과" },
      avgResponseTime: { value: avgResponseHours, unit: "h", delta: -0.4 },
      csat: { value: csat, max: 5.0, label: "월간" },
    },
    queue,
    statusCounts,
  });
}
