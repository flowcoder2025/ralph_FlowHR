import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import type { Prisma, EmployeeStatus, EmploymentType } from "@prisma/client";

const VALID_STATUSES: EmployeeStatus[] = [
  "ACTIVE",
  "ON_LEAVE",
  "PENDING_RESIGNATION",
  "RESIGNED",
  "TERMINATED",
];

export async function GET(request: NextRequest) {
  try {
  const token = await getToken({ req: request });
  if (!token || !token.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const search = searchParams.get("search") ?? "";
  const status = searchParams.get("status") ?? "";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const pageSize = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get("pageSize") ?? "10", 10)),
  );

  const where: Prisma.EmployeeWhereInput = {
    tenantId: token.tenantId,
  };

  // Search by name, department name, or position name
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { employeeNumber: { contains: search, mode: "insensitive" } },
      { department: { name: { contains: search, mode: "insensitive" } } },
      { position: { name: { contains: search, mode: "insensitive" } } },
    ];
  }

  // Filter by status
  if (status && VALID_STATUSES.includes(status as EmployeeStatus)) {
    where.status = status as EmployeeStatus;
  }

  const [employees, total] = await Promise.all([
    prisma.employee.findMany({
      where,
      include: {
        department: { select: { id: true, name: true } },
        position: { select: { id: true, name: true, level: true } },
      },
      orderBy: [{ name: "asc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.employee.count({ where }),
  ]);

  return NextResponse.json({
    data: employees,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  });
  } catch (error) {
    console.error("[employees GET] Error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// ─── POST: 직원 생성 ───────────────────────────────────
export async function POST(request: NextRequest) {
  try {
  const token = await getToken({ req: request });
  if (!token || !token.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tenantId = token.tenantId as string;
  const body = await request.json();
  const { name, email, phone, departmentId, positionId, employeeNumber, hireDate, type } = body;

  if (!name || !email || !employeeNumber || !hireDate) {
    return NextResponse.json(
      { error: "name, email, employeeNumber, hireDate는 필수입니다" },
      { status: 400 },
    );
  }

  // 동일 tenant + employeeNumber 중복 검사
  const existing = await prisma.employee.findUnique({
    where: { tenantId_employeeNumber: { tenantId, employeeNumber } },
  });
  if (existing) {
    return NextResponse.json(
      { error: "이미 동일한 사번의 직원이 존재합니다" },
      { status: 409 },
    );
  }

  const validTypes: EmploymentType[] = ["FULL_TIME", "PART_TIME", "CONTRACT", "INTERN"];
  const empType = type && validTypes.includes(type) ? type : "FULL_TIME";

  const employee = await prisma.employee.create({
    data: {
      tenantId,
      name,
      email,
      phone: phone || null,
      departmentId: departmentId || null,
      positionId: positionId || null,
      employeeNumber,
      hireDate: new Date(hireDate),
      type: empType,
    },
    include: {
      department: { select: { id: true, name: true } },
      position: { select: { id: true, name: true, level: true } },
    },
  });

  return NextResponse.json({ data: employee }, { status: 201 });
  } catch (error) {
    console.error("[employees POST] Error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
