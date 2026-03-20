import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";

// ─── GET: 계약서 목록 조회 ────────────────────────────────
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

    const [contracts, total] = await Promise.all([
      prisma.employmentContract.findMany({
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
      prisma.employmentContract.count({ where }),
    ]);

    return NextResponse.json({
      data: contracts.map((c) => ({
        id: c.id,
        contractNumber: c.contractNumber,
        employeeId: c.employeeId,
        employeeName: c.employee.name,
        departmentName: c.employee.department?.name ?? null,
        contractType: c.contractType,
        wageType: c.wageType,
        baseSalary: c.baseSalary,
        annualSalary: c.annualSalary,
        hourlyRate: c.hourlyRate,
        startDate: c.startDate.toISOString(),
        endDate: c.endDate?.toISOString() ?? null,
        workHoursPerWeek: c.workHoursPerWeek,
        workDaysPerWeek: c.workDaysPerWeek,
        workStartTime: c.workStartTime,
        workEndTime: c.workEndTime,
        breakMinutes: c.breakMinutes,
        contractedOTHours: c.contractedOTHours,
        contractedNSHours: c.contractedNSHours,
        contractedHDHours: c.contractedHDHours,
        allowances: c.allowances,
        specialTerms: c.specialTerms,
        status: c.status,
        signedAt: c.signedAt?.toISOString() ?? null,
        signedByEmployee: c.signedByEmployee,
        signedByEmployer: c.signedByEmployer,
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
    console.error("[contracts GET] Error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 },
    );
  }
}

// ─── POST: 계약서 생성 ────────────────────────────────────
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
      contractType,
      startDate,
      endDate,
      wageType,
      baseSalary,
      annualSalary,
      hourlyRate,
      workHoursPerWeek,
      workDaysPerWeek,
      workStartTime,
      workEndTime,
      breakMinutes,
      contractedOTHours,
      contractedNSHours,
      contractedHDHours,
      allowances,
      specialTerms,
    } = body;

    if (!employeeId || !contractType || !startDate || !wageType || baseSalary === undefined || baseSalary === null) {
      return NextResponse.json(
        { error: "employeeId, contractType, startDate, wageType, baseSalary는 필수입니다" },
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

    // 계약번호 자동 생성: CT-{YYYY}-{NNN}
    const year = new Date().getFullYear();
    const prefix = `CT-${year}-`;

    const lastContract = await prisma.employmentContract.findFirst({
      where: {
        tenantId,
        contractNumber: { startsWith: prefix },
      },
      orderBy: { contractNumber: "desc" },
      select: { contractNumber: true },
    });

    let nextSeq = 1;
    if (lastContract) {
      const lastNum = parseInt(lastContract.contractNumber.replace(prefix, ""), 10);
      if (!isNaN(lastNum)) {
        nextSeq = lastNum + 1;
      }
    }

    const contractNumber = `${prefix}${String(nextSeq).padStart(3, "0")}`;

    const contract = await prisma.employmentContract.create({
      data: {
        tenantId,
        employeeId,
        contractNumber,
        contractType,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        wageType,
        baseSalary: Number(baseSalary),
        annualSalary: annualSalary ? Number(annualSalary) : null,
        hourlyRate: hourlyRate ? Number(hourlyRate) : null,
        workHoursPerWeek: workHoursPerWeek ? Number(workHoursPerWeek) : 40,
        workDaysPerWeek: workDaysPerWeek ? Number(workDaysPerWeek) : 5,
        workStartTime: workStartTime ?? "09:00",
        workEndTime: workEndTime ?? "18:00",
        breakMinutes: breakMinutes ? Number(breakMinutes) : 60,
        contractedOTHours: contractedOTHours ? Number(contractedOTHours) : null,
        contractedNSHours: contractedNSHours ? Number(contractedNSHours) : null,
        contractedHDHours: contractedHDHours ? Number(contractedHDHours) : null,
        allowances: allowances ?? [],
        specialTerms: specialTerms ?? null,
        status: "DRAFT",
      },
    });

    return NextResponse.json({
      data: {
        id: contract.id,
        contractNumber: contract.contractNumber,
        employeeId: contract.employeeId,
        contractType: contract.contractType,
        wageType: contract.wageType,
        baseSalary: contract.baseSalary,
        startDate: contract.startDate.toISOString(),
        endDate: contract.endDate?.toISOString() ?? null,
        status: contract.status,
        createdAt: contract.createdAt.toISOString(),
      },
    }, { status: 201 });
  } catch (error) {
    console.error("[contracts POST] Error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 },
    );
  }
}
