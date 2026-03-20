import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

// ─── GET: 월별 보험료 내역 조회 ─────────────────────────
export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request });
    if (!token || !token.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = token.tenantId as string;
    const { searchParams } = new URL(request.url);

    const now = new Date();
    const year = Number(searchParams.get("year")) || now.getFullYear();
    const month = Number(searchParams.get("month")) || now.getMonth() + 1;
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize")) || 20));

    const where = { tenantId, year, month };

    const [contributions, total] = await Promise.all([
      prisma.insuranceContribution.findMany({
        where,
        include: {
          employee: {
            select: {
              name: true,
              department: { select: { name: true } },
            },
          },
        },
        orderBy: { employee: { name: "asc" } },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.insuranceContribution.count({ where }),
    ]);

    // 해당 월 전체 합계 (페이지네이션 무관)
    const summary = await prisma.insuranceContribution.aggregate({
      where,
      _sum: {
        totalEmployee: true,
        totalEmployer: true,
      },
    });

    const data = contributions.map((c) => ({
      id: c.id,
      employeeId: c.employeeId,
      employeeName: c.employee.name,
      department: c.employee.department?.name ?? "-",
      grossSalary: c.grossSalary,
      pensionEmployee: c.pensionEmployee,
      pensionEmployer: c.pensionEmployer,
      healthEmployee: c.healthEmployee,
      healthEmployer: c.healthEmployer,
      ltcEmployee: c.ltcEmployee,
      ltcEmployer: c.ltcEmployer,
      employmentEmployee: c.employmentEmployee,
      employmentEmployer: c.employmentEmployer,
      injuryEmployer: c.injuryEmployer,
      totalEmployee: c.totalEmployee,
      totalEmployer: c.totalEmployer,
      status: c.status,
    }));

    return NextResponse.json({
      data,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
      summary: {
        totalEmployee: summary._sum.totalEmployee ?? 0,
        totalEmployer: summary._sum.totalEmployer ?? 0,
      },
    });
  } catch (error) {
    console.error("[insurance/contributions GET] Error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 },
    );
  }
}
