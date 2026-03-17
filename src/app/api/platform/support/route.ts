import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import type { Prisma, SupportTicketStatus, SupportTicketCategory, RequestPriority } from "@prisma/client";

const VALID_STATUSES: SupportTicketStatus[] = [
  "OPEN",
  "IN_PROGRESS",
  "WAITING",
  "RESOLVED",
  "CLOSED",
];

const VALID_CATEGORIES: SupportTicketCategory[] = [
  "BUG",
  "FEATURE_REQUEST",
  "QUESTION",
  "MIGRATION",
  "SECURITY",
  "BILLING",
];

const VALID_PRIORITIES: RequestPriority[] = [
  "CRITICAL",
  "HIGH",
  "MEDIUM",
  "LOW",
];

// ─── GET: 지원 티켓 목록 조회 ────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request });
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (token.role !== "PLATFORM_OPERATOR") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") ?? "";
    const status = searchParams.get("status") ?? "";
    const category = searchParams.get("category") ?? "";
    const priority = searchParams.get("priority") ?? "";
    const sortKey = searchParams.get("sortKey") ?? "createdAt";
    const sortDir = searchParams.get("sortDir") ?? "desc";
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const pageSize = Math.min(
      50,
      Math.max(1, parseInt(searchParams.get("pageSize") ?? "20", 10)),
    );

    const where: Prisma.SupportTicketWhereInput = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { ticketNumber: { contains: search, mode: "insensitive" } },
        { requesterName: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status && VALID_STATUSES.includes(status as SupportTicketStatus)) {
      where.status = status as SupportTicketStatus;
    }

    if (category && VALID_CATEGORIES.includes(category as SupportTicketCategory)) {
      where.category = category as SupportTicketCategory;
    }

    if (priority && VALID_PRIORITIES.includes(priority as RequestPriority)) {
      where.priority = priority as RequestPriority;
    }

    const validSortKeys: Record<string, string> = {
      title: "title",
      status: "status",
      priority: "priority",
      category: "category",
      createdAt: "createdAt",
      updatedAt: "updatedAt",
    };
    const orderField = validSortKeys[sortKey] ?? "createdAt";
    const orderDir = sortDir === "asc" ? "asc" : "desc";

    const [tickets, total] = await Promise.all([
      prisma.supportTicket.findMany({
        where,
        include: {
          tenant: { select: { name: true, slug: true } },
        },
        orderBy: { [orderField]: orderDir },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.supportTicket.count({ where }),
    ]);

    // Status counts for filter chips
    const statusCounts = await prisma.supportTicket.groupBy({
      by: ["status"],
      _count: true,
    });

    const counts = {
      total,
      byStatus: Object.fromEntries(
        statusCounts.map((s) => [s.status, s._count]),
      ),
    };

    const data = tickets.map((t) => ({
      id: t.id,
      ticketNumber: t.ticketNumber,
      title: t.title,
      description: t.description,
      tenantName: t.tenant.name,
      tenantSlug: t.tenant.slug,
      requesterName: t.requesterName,
      requesterEmail: t.requesterEmail,
      priority: t.priority,
      status: t.status,
      category: t.category,
      slaDeadlineAt: t.slaDeadlineAt?.toISOString() ?? null,
      resolvedAt: t.resolvedAt?.toISOString() ?? null,
      closedAt: t.closedAt?.toISOString() ?? null,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      data,
      counts,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error("[platform/support GET] Error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 },
    );
  }
}
