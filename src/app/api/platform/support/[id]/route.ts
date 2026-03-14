import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const token = await getToken({ req: request });
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const ticket = await prisma.supportTicket.findUnique({
    where: { id },
    include: { tenant: { select: { name: true, domain: true } } },
  });

  if (!ticket) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let slaStatus: "ok" | "warning" | "violated" = "ok";
  let slaRemaining = "";
  if (ticket.slaDeadlineAt) {
    const remaining = ticket.slaDeadlineAt.getTime() - Date.now();
    if (remaining < 0) {
      slaStatus = "violated";
      const overMs = Math.abs(remaining);
      const overHrs = Math.round((overMs / (1000 * 60 * 60)) * 10) / 10;
      slaRemaining = `${overHrs}시간 초과`;
    } else if (remaining < 60 * 60 * 1000) {
      slaStatus = "warning";
      slaRemaining = `${Math.floor(remaining / 60000)}분 남음`;
    } else {
      slaRemaining = `${Math.round((remaining / (1000 * 60 * 60)) * 10) / 10}시간 남음`;
    }
  }

  return NextResponse.json({
    id: ticket.id,
    ticketNumber: ticket.ticketNumber,
    title: ticket.title,
    description: ticket.description,
    tenantName: ticket.tenant.name,
    tenantDomain: ticket.tenant.domain,
    priority: ticket.priority,
    status: ticket.status,
    category: ticket.category,
    requesterName: ticket.requesterName,
    requesterEmail: ticket.requesterEmail,
    assigneeId: ticket.assigneeId,
    slaDeadlineAt: ticket.slaDeadlineAt?.toISOString() ?? null,
    slaStatus,
    slaRemaining,
    resolvedAt: ticket.resolvedAt?.toISOString() ?? null,
    closedAt: ticket.closedAt?.toISOString() ?? null,
    createdAt: ticket.createdAt.toISOString(),
    updatedAt: ticket.updatedAt.toISOString(),
  });
}
