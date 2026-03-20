import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

// ─── GET: 임금설정 단건 조회 ────────────────────────────
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const token = await getToken({ req: request });
    if (!token || !token.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = token.tenantId as string;
    const { id } = await params;

    const config = await prisma.wageConfig.findFirst({
      where: { id, tenantId },
      include: {
        employee: {
          select: {
            name: true,
            department: { select: { name: true } },
          },
        },
      },
    });

    if (!config) {
      return NextResponse.json(
        { error: "임금설정을 찾을 수 없습니다" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      data: {
        id: config.id,
        employeeId: config.employeeId,
        employeeName: config.employee.name,
        departmentName: config.employee.department?.name ?? null,
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
    });
  } catch (error) {
    console.error("[payroll/wage-config/[id] GET] Error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 },
    );
  }
}

// ─── PATCH: 임금설정 수정 ───────────────────────────────
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const token = await getToken({ req: request });
    if (!token || !token.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = token.tenantId as string;
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.wageConfig.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "임금설정을 찾을 수 없습니다" },
        { status: 404 },
      );
    }

    const updateData: Record<string, unknown> = {};

    if (body.wageType !== undefined) updateData.wageType = body.wageType;
    if (body.baseSalary !== undefined) updateData.baseSalary = Number(body.baseSalary);
    if (body.contractedOTHours !== undefined) updateData.contractedOTHours = Number(body.contractedOTHours);
    if (body.contractedNSHours !== undefined) updateData.contractedNSHours = Number(body.contractedNSHours);
    if (body.contractedHDHours !== undefined) updateData.contractedHDHours = Number(body.contractedHDHours);
    if (body.hourlyRate !== undefined) updateData.hourlyRate = body.hourlyRate !== null ? Number(body.hourlyRate) : null;
    if (body.annualSalary !== undefined) updateData.annualSalary = body.annualSalary !== null ? Number(body.annualSalary) : null;
    if (body.fixedAllowances !== undefined) updateData.fixedAllowances = body.fixedAllowances;
    if (body.nonTaxableAllowances !== undefined) updateData.nonTaxableAllowances = body.nonTaxableAllowances;
    if (body.effectiveDate !== undefined) updateData.effectiveDate = new Date(body.effectiveDate);
    if (body.isActive !== undefined) updateData.isActive = body.isActive;

    // baseSalary 변경 시 SalaryHistory 기록 생성
    if (body.baseSalary !== undefined && Number(body.baseSalary) !== existing.baseSalary) {
      await prisma.salaryHistory.create({
        data: {
          tenantId,
          employeeId: existing.employeeId,
          baseSalary: Number(body.baseSalary),
          effectiveDate: body.effectiveDate ? new Date(body.effectiveDate) : new Date(),
          reason: "임금설정 변경",
          createdBy: (token.employeeNumber as string) ?? null,
        },
      });
    }

    const updated = await prisma.wageConfig.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      data: {
        id: updated.id,
        employeeId: updated.employeeId,
        wageType: updated.wageType,
        baseSalary: updated.baseSalary,
        contractedOTHours: updated.contractedOTHours,
        contractedNSHours: updated.contractedNSHours,
        contractedHDHours: updated.contractedHDHours,
        hourlyRate: updated.hourlyRate,
        annualSalary: updated.annualSalary,
        fixedAllowances: updated.fixedAllowances,
        nonTaxableAllowances: updated.nonTaxableAllowances,
        effectiveDate: updated.effectiveDate.toISOString(),
        isActive: updated.isActive,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("[payroll/wage-config/[id] PATCH] Error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 },
    );
  }
}
