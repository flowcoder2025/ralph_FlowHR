import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";

// ─── GET: 퇴직금 산출 목록 조회 ─────────────────────────
export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request });
    if (!token || !token.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = token.tenantId as string;
    const { searchParams } = request.nextUrl;
    const employeeId = searchParams.get("employeeId");
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const pageSize = Math.min(
      50,
      Math.max(1, parseInt(searchParams.get("pageSize") ?? String(DEFAULT_PAGE_SIZE), 10)),
    );

    const where = {
      tenantId,
      ...(employeeId ? { employeeId } : {}),
    };

    const [calculations, total] = await Promise.all([
      prisma.severanceCalculation.findMany({
        where,
        include: {
          employee: {
            select: {
              name: true,
              department: { select: { name: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.severanceCalculation.count({ where }),
    ]);

    return NextResponse.json({
      data: calculations.map((c) => ({
        id: c.id,
        employeeId: c.employeeId,
        employeeName: c.employee.name,
        departmentName: c.employee.department?.name ?? null,
        startDate: c.startDate.toISOString(),
        endDate: c.endDate.toISOString(),
        totalServiceDays: c.totalServiceDays,
        totalServiceYears: c.totalServiceYears,
        avgDailySalary: c.avgDailySalary,
        last3MonthsTotal: c.last3MonthsTotal,
        last3MonthsDays: c.last3MonthsDays,
        severanceAmount: c.severanceAmount,
        status: c.status,
        note: c.note,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
      })),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error("[payroll/severance GET] Error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 },
    );
  }
}
