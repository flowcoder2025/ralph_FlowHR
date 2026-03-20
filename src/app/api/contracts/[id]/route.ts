import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// ─── GET: 계약서 상세 조회 ────────────────────────────────
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const token = await getToken({ req: request });
    if (!token || !token.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = token.tenantId as string;
    const { id } = await context.params;

    const contract = await prisma.employmentContract.findFirst({
      where: { id, tenantId },
      include: {
        employee: {
          select: {
            name: true,
            email: true,
            phone: true,
            employeeNumber: true,
            department: { select: { name: true } },
            position: { select: { name: true } },
          },
        },
      },
    });

    if (!contract) {
      return NextResponse.json(
        { error: "계약서를 찾을 수 없습니다" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      data: {
        id: contract.id,
        contractNumber: contract.contractNumber,
        employeeId: contract.employeeId,
        employeeName: contract.employee.name,
        employeeEmail: contract.employee.email,
        employeePhone: contract.employee.phone,
        employeeNumber: contract.employee.employeeNumber,
        departmentName: contract.employee.department?.name ?? null,
        positionName: contract.employee.position?.name ?? null,
        contractType: contract.contractType,
        wageType: contract.wageType,
        baseSalary: contract.baseSalary,
        annualSalary: contract.annualSalary,
        hourlyRate: contract.hourlyRate,
        startDate: contract.startDate.toISOString(),
        endDate: contract.endDate?.toISOString() ?? null,
        workHoursPerWeek: contract.workHoursPerWeek,
        workDaysPerWeek: contract.workDaysPerWeek,
        workStartTime: contract.workStartTime,
        workEndTime: contract.workEndTime,
        breakMinutes: contract.breakMinutes,
        contractedOTHours: contract.contractedOTHours,
        contractedNSHours: contract.contractedNSHours,
        contractedHDHours: contract.contractedHDHours,
        allowances: contract.allowances,
        specialTerms: contract.specialTerms,
        status: contract.status,
        signedAt: contract.signedAt?.toISOString() ?? null,
        signedByEmployee: contract.signedByEmployee,
        signedByEmployer: contract.signedByEmployer,
        createdAt: contract.createdAt.toISOString(),
        updatedAt: contract.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("[contracts/[id] GET] Error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 },
    );
  }
}

// ─── PATCH: 계약서 수정 ──────────────────────────────────
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const token = await getToken({ req: request });
    if (!token || !token.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = token.tenantId as string;
    const { id } = await context.params;

    const existing = await prisma.employmentContract.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "계약서를 찾을 수 없습니다" },
        { status: 404 },
      );
    }

    const body = await request.json();
    const updateData: Record<string, unknown> = {};

    // 상태 전환 처리
    if (body.status !== undefined) {
      const validTransitions: Record<string, string[]> = {
        DRAFT: ["PENDING_SIGN"],
        PENDING_SIGN: ["SIGNED", "DRAFT"],
      };

      const allowed = validTransitions[existing.status] ?? [];
      if (!allowed.includes(body.status)) {
        return NextResponse.json(
          { error: `${existing.status} 상태에서 ${body.status}(으)로 변경할 수 없습니다` },
          { status: 400 },
        );
      }

      updateData.status = body.status;
    }

    // 필드 업데이트 (DRAFT 상태에서만 필드 수정 가능)
    if (existing.status === "DRAFT") {
      if (body.contractType !== undefined) updateData.contractType = body.contractType;
      if (body.startDate !== undefined) updateData.startDate = new Date(body.startDate);
      if (body.endDate !== undefined) updateData.endDate = body.endDate ? new Date(body.endDate) : null;
      if (body.wageType !== undefined) updateData.wageType = body.wageType;
      if (body.baseSalary !== undefined) updateData.baseSalary = Number(body.baseSalary);
      if (body.annualSalary !== undefined) updateData.annualSalary = body.annualSalary ? Number(body.annualSalary) : null;
      if (body.hourlyRate !== undefined) updateData.hourlyRate = body.hourlyRate ? Number(body.hourlyRate) : null;
      if (body.workHoursPerWeek !== undefined) updateData.workHoursPerWeek = Number(body.workHoursPerWeek);
      if (body.workDaysPerWeek !== undefined) updateData.workDaysPerWeek = Number(body.workDaysPerWeek);
      if (body.workStartTime !== undefined) updateData.workStartTime = body.workStartTime;
      if (body.workEndTime !== undefined) updateData.workEndTime = body.workEndTime;
      if (body.breakMinutes !== undefined) updateData.breakMinutes = Number(body.breakMinutes);
      if (body.contractedOTHours !== undefined) updateData.contractedOTHours = body.contractedOTHours ? Number(body.contractedOTHours) : null;
      if (body.contractedNSHours !== undefined) updateData.contractedNSHours = body.contractedNSHours ? Number(body.contractedNSHours) : null;
      if (body.contractedHDHours !== undefined) updateData.contractedHDHours = body.contractedHDHours ? Number(body.contractedHDHours) : null;
      if (body.allowances !== undefined) updateData.allowances = body.allowances;
      if (body.specialTerms !== undefined) updateData.specialTerms = body.specialTerms ?? null;
    }

    const updated = await prisma.employmentContract.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      data: {
        id: updated.id,
        contractNumber: updated.contractNumber,
        status: updated.status,
        updatedAt: updated.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("[contracts/[id] PATCH] Error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 },
    );
  }
}
