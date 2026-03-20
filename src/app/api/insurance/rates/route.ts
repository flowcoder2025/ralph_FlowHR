import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { DEFAULT_INSURANCE_RATES } from "@/lib/insurance-calc";

// ─── GET: 해당 연도 보험 요율 조회 ──────────────────────
export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request });
    if (!token || !token.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = token.tenantId as string;
    const { searchParams } = new URL(request.url);
    const year = Number(searchParams.get("year")) || new Date().getFullYear();

    const config = await prisma.insuranceRateConfig.findUnique({
      where: { tenantId_year: { tenantId, year } },
    });

    if (config) {
      return NextResponse.json({
        data: {
          id: config.id,
          year: config.year,
          pensionRate: config.pensionRate,
          healthRate: config.healthRate,
          ltcRate: config.ltcRate,
          employmentRate: config.employmentRate,
          injuryRate: config.injuryRate,
          isActive: config.isActive,
        },
      });
    }

    // 설정이 없으면 기본값 반환
    return NextResponse.json({
      data: {
        id: null,
        year,
        ...DEFAULT_INSURANCE_RATES,
        isActive: true,
      },
    });
  } catch (error) {
    console.error("[insurance/rates GET] Error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 },
    );
  }
}

// ─── PUT: 보험 요율 설정 (생성/수정) ────────────────────
export async function PUT(request: NextRequest) {
  try {
    const token = await getToken({ req: request });
    if (!token || !token.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = token.tenantId as string;
    const body = await request.json();
    const { year, pensionRate, healthRate, ltcRate, employmentRate, injuryRate } = body;

    if (!year) {
      return NextResponse.json(
        { error: "year는 필수입니다" },
        { status: 400 },
      );
    }

    const targetYear = Number(year);

    const config = await prisma.insuranceRateConfig.upsert({
      where: { tenantId_year: { tenantId, year: targetYear } },
      create: {
        tenantId,
        year: targetYear,
        pensionRate: pensionRate ?? DEFAULT_INSURANCE_RATES.pensionRate,
        healthRate: healthRate ?? DEFAULT_INSURANCE_RATES.healthRate,
        ltcRate: ltcRate ?? DEFAULT_INSURANCE_RATES.ltcRate,
        employmentRate: employmentRate ?? DEFAULT_INSURANCE_RATES.employmentRate,
        injuryRate: injuryRate ?? DEFAULT_INSURANCE_RATES.injuryRate,
      },
      update: {
        ...(pensionRate !== undefined && { pensionRate }),
        ...(healthRate !== undefined && { healthRate }),
        ...(ltcRate !== undefined && { ltcRate }),
        ...(employmentRate !== undefined && { employmentRate }),
        ...(injuryRate !== undefined && { injuryRate }),
      },
    });

    return NextResponse.json({
      data: {
        id: config.id,
        year: config.year,
        pensionRate: config.pensionRate,
        healthRate: config.healthRate,
        ltcRate: config.ltcRate,
        employmentRate: config.employmentRate,
        injuryRate: config.injuryRate,
        isActive: config.isActive,
      },
    });
  } catch (error) {
    console.error("[insurance/rates PUT] Error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 },
    );
  }
}
