import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";

// ─── GET: 임금설정 목록 조회 ────────────────────────────
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

    const [configs, total] = await Promise.all([
      prisma.wageConfig.findMany({
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
      prisma.wageConfig.count({ where }),
    ]);

    return NextResponse.json({
      data: configs.map((c) => ({
        id: c.id,
        employeeId: c.employeeId,
        employeeName: c.employee.name,
        departmentName: c.employee.department?.name ?? null,
        wageType: c.wageType,
        baseSalary: c.baseSalary,
        contractedOTHours: c.contractedOTHours,
        contractedNSHours: c.contractedNSHours,
        contractedHDHours: c.contractedHDHours,
        hourlyRate: c.hourlyRate,
        annualSalary: c.annualSalary,
        fixedAllowances: c.fixedAllowances,
        nonTaxableAllowances: c.nonTaxableAllowances,
        effectiveDate: c.effectiveDate.toISOString(),
        isActive: c.isActive,
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
    console.error("[payroll/wage-config GET] Error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 },
    );
  }
}

// ─── POST: 임금설정 생성 ────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request });
    if (!token || !token.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = token.tenantId as string;
    const body = await request.json();
    const {
      employeeId,
      wageType,
      baseSalary,
      contractedOTHours,
      contractedNSHours,
      contractedHDHours,
      hourlyRate,
      annualSalary,
      fixedAllowances,
      nonTaxableAllowances,
      effectiveDate,
    } = body;

    if (!employeeId || !wageType || baseSalary === undefined || baseSalary === null) {
      return NextResponse.json(
        { error: "employeeId, wageType, baseSalary는 필수입니다" },
        { status: 400 },
      );
    }

    if (typeof baseSalary !== "number" || baseSalary < 0) {
      return NextResponse.json(
        { error: "baseSalary는 0 이상의 숫자여야 합니다" },
        { status: 400 },
      );
    }

    // 직원 존재 확인
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

    // 중복 활성 설정 확인
    const existingConfig = await prisma.wageConfig.findUnique({
      where: { employeeId },
    });

    if (existingConfig) {
      return NextResponse.json(
        { error: "해당 직원에게 이미 임금설정이 존재합니다" },
        { status: 409 },
      );
    }

    const config = await prisma.wageConfig.create({
      data: {
        tenantId,
        employeeId,
        wageType,
        baseSalary: Number(baseSalary),
        contractedOTHours: contractedOTHours ? Number(contractedOTHours) : 0,
        contractedNSHours: contractedNSHours ? Number(contractedNSHours) : 0,
        contractedHDHours: contractedHDHours ? Number(contractedHDHours) : 0,
        hourlyRate: hourlyRate ? Number(hourlyRate) : null,
        annualSalary: annualSalary ? Number(annualSalary) : null,
        fixedAllowances: fixedAllowances ?? [],
        nonTaxableAllowances: nonTaxableAllowances ?? [],
        effectiveDate: effectiveDate ? new Date(effectiveDate) : new Date(),
      },
    });

    // SalaryHistory 기록 생성
    await prisma.salaryHistory.create({
      data: {
        tenantId,
        employeeId,
        baseSalary: Number(baseSalary),
        effectiveDate: effectiveDate ? new Date(effectiveDate) : new Date(),
        reason: "임금설정 생성",
        createdBy: (token.employeeNumber as string) ?? null,
      },
    });

    return NextResponse.json({
      data: {
        id: config.id,
        employeeId: config.employeeId,
        wageType: config.wageType,
        baseSalary: config.baseSalary,
        contractedOTHours: config.contractedOTHours,
        contractedNSHours: config.contractedNSHours,
        contractedHDHours: config.contractedHDHours,
        hourlyRate: config.hourlyRate,
        annualSalary: config.annualSalary,
        fixedAllowances: config.fixedAllowances,
        nonTaxableAllowances: config.nonTaxableAllowances,
        effectiveDate: config.effectiveDate.toISOString(),
        isActive: config.isActive,
        createdAt: config.createdAt.toISOString(),
        updatedAt: config.updatedAt.toISOString(),
      },
    }, { status: 201 });
  } catch (error) {
    console.error("[payroll/wage-config POST] Error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 },
    );
  }
}
