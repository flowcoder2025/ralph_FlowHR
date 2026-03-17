import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import type { Prisma, DocumentStatus } from "@prisma/client";

const VALID_STATUSES: DocumentStatus[] = [
  "DRAFT",
  "SENT",
  "VIEWED",
  "SIGNED",
  "EXPIRED",
  "CANCELLED",
];

// ─── GET: 로그인한 직원이 수신한 문서 목록 ────────────────
export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request });
    if (!token || !token.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const employee = await prisma.employee.findFirst({
      where: {
        userId: token.id,
        tenantId: token.tenantId,
      },
    });

    if (!employee) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 },
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") ?? "";
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const pageSize = Math.min(
      50,
      Math.max(1, parseInt(searchParams.get("pageSize") ?? "20", 10)),
    );

    const where: Prisma.DocumentWhereInput = {
      recipientId: employee.id,
      tenantId: token.tenantId as string,
    };

    if (status && VALID_STATUSES.includes(status as DocumentStatus)) {
      where.status = status as DocumentStatus;
    }

    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where,
        include: {
          template: { select: { name: true, category: true } },
          sender: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.document.count({ where }),
    ]);

    const data = documents.map((doc) => ({
      id: doc.id,
      title: doc.title,
      status: doc.status,
      templateName: doc.template.name,
      templateCategory: doc.template.category,
      senderName: doc.sender.name,
      deadline: doc.deadline?.toISOString() ?? null,
      sentAt: doc.sentAt?.toISOString() ?? null,
      viewedAt: doc.viewedAt?.toISOString() ?? null,
      completedAt: doc.completedAt?.toISOString() ?? null,
      memo: doc.memo,
      createdAt: doc.createdAt.toISOString(),
    }));

    return NextResponse.json({
      data,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error("[employee/documents GET] Error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 },
    );
  }
}
