import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import type { Prisma, EmployeeStatus } from "@prisma/client";

const VALID_STATUSES: EmployeeStatus[] = [
  "ACTIVE",
  "ON_LEAVE",
  "PENDING_RESIGNATION",
  "RESIGNED",
  "TERMINATED",
];

export async function GET(request: NextRequest) {
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
}
