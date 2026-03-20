import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";

// ─── GET: 급여 이력 조회 ───────────────────────────────
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

    if (!employeeId) {
      return NextResponse.json(
        { error: "employeeId는 필수입니다" },
        { status: 400 },
      );
    }

    // 해당 직원이 같은 tenant인지 확인
    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, tenantId },
      select: { id: true, name: true },
    });

    if (!employee) {
      return NextResponse.json(
        { error: "해당 직원을 찾을 수 없습니다" },
        { status: 404 },
      );
    }

    const where = { tenantId, employeeId };

    const [histories, total] = await Promise.all([
      prisma.salaryHistory.findMany({
        where,
        orderBy: { effectiveDate: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.salaryHistory.count({ where }),
    ]);

    return NextResponse.json({
      data: histories.map((h) => ({
        id: h.id,
        employeeId: h.employeeId,
        baseSalary: h.baseSalary,
        effectiveDate: h.effectiveDate.toISOString(),
        reason: h.reason,
        createdBy: h.createdBy,
        createdAt: h.createdAt.toISOString(),
      })),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error("[payroll/salary-history GET] Error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 },
    );
  }
}

// ─── POST: 급여 이력 생성 ──────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request });
    if (!token || !token.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = token.tenantId as string;
    const body = await request.json();
    const { employeeId, baseSalary, effectiveDate, reason } = body;

    if (!employeeId || baseSalary === undefined || baseSalary === null || !effectiveDate) {
      return NextResponse.json(
        { error: "employeeId, baseSalary, effectiveDate는 필수입니다" },
        { status: 400 },
      );
    }

    if (typeof baseSalary !== "number" || baseSalary < 0) {
      return NextResponse.json(
        { error: "baseSalary는 0 이상의 숫자여야 합니다" },
        { status: 400 },
      );
    }

    // 해당 직원이 같은 tenant인지 확인
    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, tenantId },
      select: { id: true },
    });

    if (!employee) {
      return NextResponse.json(
        { error: "해당 직원을 찾을 수 없습니다" },
        { status: 404 },
      );
    }

    const history = await prisma.salaryHistory.create({
      data: {
        tenantId,
        employeeId,
        baseSalary: Number(baseSalary),
        effectiveDate: new Date(effectiveDate),
        reason: reason || null,
        createdBy: (token.employeeNumber as string) ?? null,
      },
    });

    return NextResponse.json({
      data: {
        id: history.id,
        employeeId: history.employeeId,
        baseSalary: history.baseSalary,
        effectiveDate: history.effectiveDate.toISOString(),
        reason: history.reason,
        createdBy: history.createdBy,
        createdAt: history.createdAt.toISOString(),
      },
    }, { status: 201 });
  } catch (error) {
    console.error("[payroll/salary-history POST] Error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 },
    );
  }
}
