import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";

// ─── GET: 매칭 결과 목록 조회 ────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request });
    if (!token || !token.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = token.tenantId as string;
    const { searchParams } = request.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const pageSize = Math.min(
      50,
      Math.max(1, parseInt(searchParams.get("pageSize") ?? String(DEFAULT_PAGE_SIZE), 10)),
    );

    const employeeId = searchParams.get("employeeId");
    const where: Record<string, unknown> = { tenantId };
    if (employeeId) {
      where.employeeId = employeeId;
    }

    const [matches, total] = await Promise.all([
      prisma.subsidyMatch.findMany({
        where,
        include: {
          employee: {
            select: {
              name: true,
              department: { select: { name: true } },
            },
          },
          program: {
            select: {
              name: true,
              provider: true,
              category: true,
              monthlyAmount: true,
              maxDurationMonths: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.subsidyMatch.count({ where }),
    ]);

    return NextResponse.json({
      data: matches.map((m) => ({
        id: m.id,
        employeeId: m.employeeId,
        employeeName: m.employee.name,
        departmentName: m.employee.department?.name ?? null,
        programId: m.programId,
        programName: m.program.name,
        provider: m.program.provider,
        category: m.program.category,
        status: m.status,
        matchScore: m.matchScore,
        matchDetails: m.matchDetails,
        monthlyAmount: m.monthlyAmount,
        programMonthlyAmount: m.program.monthlyAmount,
        maxDurationMonths: m.program.maxDurationMonths,
        totalReceived: m.totalReceived,
        appliedAt: m.appliedAt?.toISOString() ?? null,
        approvedAt: m.approvedAt?.toISOString() ?? null,
        note: m.note,
        createdAt: m.createdAt.toISOString(),
        updatedAt: m.updatedAt.toISOString(),
      })),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error("[subsidies/matches GET] Error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 },
    );
  }
}
