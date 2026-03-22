import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";

// ─── GET: 지원금 프로그램 목록 조회 ──────────────────────
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

    const where: Record<string, unknown> = { tenantId, isActive: true };

    const [programs, total] = await Promise.all([
      prisma.subsidyProgram.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.subsidyProgram.count({ where }),
    ]);

    return NextResponse.json({
      data: programs.map((p) => ({
        id: p.id,
        name: p.name,
        provider: p.provider,
        category: p.category,
        description: p.description,
        eligibilityCriteria: p.eligibilityCriteria,
        monthlyAmount: p.monthlyAmount,
        maxDurationMonths: p.maxDurationMonths,
        totalMaxAmount: p.totalMaxAmount,
        applicationStart: p.applicationStart?.toISOString() ?? null,
        applicationEnd: p.applicationEnd?.toISOString() ?? null,
        externalApiUrl: p.externalApiUrl ?? null,
        isActive: p.isActive,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      })),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error("[subsidies/programs GET] Error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 },
    );
  }
}

// ─── POST: 지원금 프로그램 생성 ──────────────────────────
export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request });
    if (!token || !token.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = token.tenantId as string;
    const body = await request.json();
    const {
      name,
      provider,
      category,
      description,
      eligibilityCriteria,
      monthlyAmount,
      maxDurationMonths,
      totalMaxAmount,
      applicationStart,
      applicationEnd,
    } = body;

    if (!name || !provider || !category || monthlyAmount === undefined || !maxDurationMonths) {
      return NextResponse.json(
        { error: "name, provider, category, monthlyAmount, maxDurationMonths는 필수입니다" },
        { status: 400 },
      );
    }

    // 동일 tenant + name 중복 검사
    const existing = await prisma.subsidyProgram.findUnique({
      where: { tenantId_name: { tenantId, name } },
    });
    if (existing) {
      return NextResponse.json(
        { error: "이미 동일한 이름의 프로그램이 존재합니다" },
        { status: 409 },
      );
    }

    const program = await prisma.subsidyProgram.create({
      data: {
        tenantId,
        name,
        provider,
        category,
        description: description ?? null,
        eligibilityCriteria: eligibilityCriteria ?? {},
        monthlyAmount: Number(monthlyAmount),
        maxDurationMonths: Number(maxDurationMonths),
        totalMaxAmount: totalMaxAmount ? Number(totalMaxAmount) : null,
        applicationStart: applicationStart ? new Date(applicationStart) : null,
        applicationEnd: applicationEnd ? new Date(applicationEnd) : null,
      },
    });

    return NextResponse.json({
      data: {
        id: program.id,
        name: program.name,
        provider: program.provider,
        category: program.category,
        monthlyAmount: program.monthlyAmount,
        maxDurationMonths: program.maxDurationMonths,
        isActive: program.isActive,
        createdAt: program.createdAt.toISOString(),
      },
    }, { status: 201 });
  } catch (error) {
    console.error("[subsidies/programs POST] Error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 },
    );
  }
}
