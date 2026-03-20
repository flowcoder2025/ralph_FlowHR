import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { matchSubsidy } from "@/lib/subsidy-matcher";
import type { MatchInput } from "@/lib/subsidy-matcher";

// ─── POST: 전체 매칭 실행 ────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request });
    if (!token || !token.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = token.tenantId as string;

    // 활성 직원 조회
    const employees = await prisma.employee.findMany({
      where: { tenantId, status: "ACTIVE" },
      select: {
        id: true,
        name: true,
        birthDate: true,
        hireDate: true,
        type: true,
        disabilityStatus: true,
      },
    });

    // 활성 프로그램 조회
    const programs = await prisma.subsidyProgram.findMany({
      where: { tenantId, isActive: true },
    });

    let newMatches = 0;
    const results: Array<{
      employeeId: string;
      employeeName: string;
      programId: string;
      programName: string;
      eligible: boolean;
      score: number;
    }> = [];

    for (const employee of employees) {
      for (const program of programs) {
        const criteria = (program.eligibilityCriteria ?? {}) as Record<string, unknown>;

        const input: MatchInput = {
          employee: {
            birthDate: employee.birthDate,
            hireDate: employee.hireDate,
            employmentType: employee.type,
            disabilityStatus: employee.disabilityStatus,
          },
          criteria: {
            ageMin: criteria.ageMin as number | undefined,
            ageMax: criteria.ageMax as number | undefined,
            employmentTypes: criteria.employmentTypes as string[] | undefined,
            minEmployeePeriodDays: criteria.minEmployeePeriodDays as number | undefined,
            maxEmployeePeriodDays: criteria.maxEmployeePeriodDays as number | undefined,
            disabilityRequired: criteria.disabilityRequired as boolean | undefined,
          },
        };

        const result = matchSubsidy(input);

        // Upsert SubsidyMatch 레코드
        await prisma.subsidyMatch.upsert({
          where: {
            tenantId_programId_employeeId: {
              tenantId,
              programId: program.id,
              employeeId: employee.id,
            },
          },
          update: {
            matchScore: result.score,
            matchDetails: result.details as unknown as Prisma.InputJsonValue,
            status: result.eligible ? "ELIGIBLE" : "REJECTED",
          },
          create: {
            tenantId,
            programId: program.id,
            employeeId: employee.id,
            matchScore: result.score,
            matchDetails: result.details as unknown as Prisma.InputJsonValue,
            status: result.eligible ? "ELIGIBLE" : "REJECTED",
            monthlyAmount: result.eligible ? program.monthlyAmount : 0,
          },
        });

        if (result.eligible) {
          newMatches++;
        }

        results.push({
          employeeId: employee.id,
          employeeName: employee.name,
          programId: program.id,
          programName: program.name,
          eligible: result.eligible,
          score: result.score,
        });
      }
    }

    return NextResponse.json({
      data: {
        processed: employees.length * programs.length,
        newMatches,
        results,
      },
    });
  } catch (error) {
    console.error("[subsidies/match POST] Error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 },
    );
  }
}
