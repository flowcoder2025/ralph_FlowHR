import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

const ALLOWED_TABLES = ["Employee", "AttendanceRecord", "LeaveRequest", "Payslip", "AttendanceException"] as const;
type AllowedTable = (typeof ALLOWED_TABLES)[number];

const TABLE_COLUMNS: Record<AllowedTable, { key: string; label: string }[]> = {
  Employee: [
    { key: "employeeNumber", label: "사번" },
    { key: "name", label: "이름" },
    { key: "email", label: "이메일" },
    { key: "phone", label: "연락처" },
    { key: "status", label: "상태" },
    { key: "type", label: "고용형태" },
    { key: "hireDate", label: "입사일" },
  ],
  AttendanceRecord: [
    { key: "date", label: "날짜" },
    { key: "employeeName", label: "직원명" },
    { key: "status", label: "상태" },
    { key: "checkIn", label: "출근" },
    { key: "checkOut", label: "퇴근" },
    { key: "workMinutes", label: "근무시간(분)" },
    { key: "overtime", label: "초과근무(분)" },
  ],
  LeaveRequest: [
    { key: "employeeName", label: "직원명" },
    { key: "policyName", label: "휴가유형" },
    { key: "startDate", label: "시작일" },
    { key: "endDate", label: "종료일" },
    { key: "days", label: "일수" },
    { key: "status", label: "상태" },
    { key: "reason", label: "사유" },
  ],
  Payslip: [
    { key: "employeeName", label: "직원명" },
    { key: "baseSalary", label: "기본급" },
    { key: "allowances", label: "수당" },
    { key: "deductions", label: "공제" },
    { key: "netAmount", label: "실수령액" },
    { key: "status", label: "상태" },
  ],
  AttendanceException: [
    { key: "employeeName", label: "직원명" },
    { key: "type", label: "유형" },
    { key: "date", label: "날짜" },
    { key: "status", label: "상태" },
    { key: "reason", label: "사유" },
  ],
};

// GET: 테이블 목록 + 컬럼 메타데이터 반환
export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request });
    if (!token || !token.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({
      data: {
        tables: ALLOWED_TABLES.map((t) => ({
          name: t,
          label: {
            Employee: "직원",
            AttendanceRecord: "근태 기록",
            LeaveRequest: "휴가 신청",
            Payslip: "급여 명세",
            AttendanceException: "근태 예외",
          }[t],
          columns: TABLE_COLUMNS[t],
        })),
      },
    });
  } catch (error) {
    console.error("[admin/reports/custom GET] Error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다" }, { status: 500 });
  }
}

// POST: 커스텀 리포트 실행
export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request });
    if (!token || !token.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = token.tenantId as string;
    const body = await request.json();
    const { table, columns, filters } = body as {
      table: string;
      columns: string[];
      filters?: {
        dateFrom?: string;
        dateTo?: string;
        status?: string;
        departmentId?: string;
      };
    };

    if (!ALLOWED_TABLES.includes(table as AllowedTable)) {
      return NextResponse.json({ error: "지원하지 않는 테이블입니다" }, { status: 400 });
    }

    const validColumns = TABLE_COLUMNS[table as AllowedTable].map((c) => c.key);
    const selectedColumns = columns.filter((c) => validColumns.includes(c));
    if (selectedColumns.length === 0) {
      return NextResponse.json({ error: "최소 1개 컬럼을 선택해주세요" }, { status: 400 });
    }

    const where: Record<string, unknown> = { tenantId };

    if (filters?.status) where.status = filters.status;
    if (filters?.dateFrom || filters?.dateTo) {
      const dateField = table === "LeaveRequest" ? "startDate" : "date";
      const dateFilter: Record<string, Date> = {};
      if (filters.dateFrom) dateFilter.gte = new Date(filters.dateFrom);
      if (filters.dateTo) {
        const to = new Date(filters.dateTo);
        to.setUTCHours(23, 59, 59, 999);
        dateFilter.lte = to;
      }
      if (table === "Employee") {
        where.hireDate = dateFilter;
      } else {
        where[dateField] = dateFilter;
      }
    }
    if (filters?.departmentId && table === "Employee") {
      where.departmentId = filters.departmentId;
    }

    let rows: Record<string, unknown>[] = [];

    if (table === "Employee") {
      const records = await prisma.employee.findMany({
        where,
        include: { department: { select: { name: true } } },
        take: 500,
        orderBy: { hireDate: "desc" },
      });
      rows = records.map((r) => ({
        employeeNumber: r.employeeNumber,
        name: r.name,
        email: r.email,
        phone: r.phone,
        status: r.status,
        type: r.type,
        hireDate: r.hireDate.toISOString().slice(0, 10),
        department: r.department?.name ?? "",
      }));
    } else if (table === "AttendanceRecord") {
      const records = await prisma.attendanceRecord.findMany({
        where,
        include: { employee: { select: { name: true } } },
        take: 500,
        orderBy: { date: "desc" },
      });
      rows = records.map((r) => ({
        date: r.date.toISOString().slice(0, 10),
        employeeName: r.employee.name,
        status: r.status,
        checkIn: r.checkIn?.toISOString().slice(11, 16) ?? "",
        checkOut: r.checkOut?.toISOString().slice(11, 16) ?? "",
        workMinutes: r.workMinutes ?? 0,
        overtime: r.overtime,
      }));
    } else if (table === "LeaveRequest") {
      const records = await prisma.leaveRequest.findMany({
        where,
        include: { employee: { select: { name: true } }, policy: { select: { name: true } } },
        take: 500,
        orderBy: { createdAt: "desc" },
      });
      rows = records.map((r) => ({
        employeeName: r.employee.name,
        policyName: r.policy?.name ?? "",
        startDate: r.startDate.toISOString().slice(0, 10),
        endDate: r.endDate.toISOString().slice(0, 10),
        days: r.days,
        status: r.status,
        reason: r.reason ?? "",
      }));
    } else if (table === "Payslip") {
      const records = await prisma.payslip.findMany({
        where,
        include: { employee: { select: { name: true } } },
        take: 500,
        orderBy: { createdAt: "desc" },
      });
      rows = records.map((r) => ({
        employeeName: r.employee.name,
        baseSalary: r.baseSalary,
        allowances: r.allowances,
        deductions: r.deductions,
        netAmount: r.netAmount,
        status: r.status,
      }));
    } else if (table === "AttendanceException") {
      const records = await prisma.attendanceException.findMany({
        where,
        include: { employee: { select: { name: true } } },
        take: 500,
        orderBy: { date: "desc" },
      });
      rows = records.map((r) => ({
        employeeName: r.employee.name,
        type: r.type,
        date: r.date.toISOString().slice(0, 10),
        status: r.status,
        reason: r.reason ?? "",
      }));
    }

    // 선택된 컬럼만 필터링
    const filteredRows = rows.map((row) => {
      const filtered: Record<string, unknown> = {};
      for (const col of selectedColumns) {
        filtered[col] = row[col] ?? "";
      }
      return filtered;
    });

    return NextResponse.json({
      data: filteredRows,
      total: filteredRows.length,
      columns: selectedColumns.map((key) => ({
        key,
        label: TABLE_COLUMNS[table as AllowedTable].find((c) => c.key === key)?.label ?? key,
      })),
    });
  } catch (error) {
    console.error("[admin/reports/custom POST] Error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다" }, { status: 500 });
  }
}
