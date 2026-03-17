import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

// ─── POST: CSV 내보내기 ─────────────────────────────────
export async function POST(request: NextRequest) {
  try {
  const token = await getToken({ req: request });
  if (!token || !token.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tenantId = token.tenantId as string;
  const body = await request.json();
  const { type, filters } = body as {
    type: "payslips" | "attendance";
    filters?: { year?: number; month?: number; employeeId?: string };
  };

  if (!type || !["payslips", "attendance"].includes(type)) {
    return NextResponse.json(
      { error: "type은 'payslips' 또는 'attendance'여야 합니다" },
      { status: 400 },
    );
  }

  const year = filters?.year ?? new Date().getFullYear();
  const month = filters?.month;

  let csv = "";
  let filename = "";

  if (type === "payslips") {
    csv = await exportPayslips(tenantId, year, month, filters?.employeeId);
    filename = `payslips_${year}${month ? `_${String(month).padStart(2, "0")}` : ""}.csv`;
  } else {
    csv = await exportAttendance(tenantId, year, month, filters?.employeeId);
    filename = `attendance_${year}${month ? `_${String(month).padStart(2, "0")}` : ""}.csv`;
  }

  // BOM + CSV 본문 (Excel 한글 호환)
  const bom = "\uFEFF";
  return new NextResponse(bom + csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
  } catch (error) {
    console.error("[export POST] Error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// ─── 급여명세서 CSV ─────────────────────────────────────
async function exportPayslips(
  tenantId: string,
  year: number,
  month?: number,
  employeeId?: string,
): Promise<string> {
  const where: {
    tenantId: string;
    payrollRun?: { year: number; month?: number };
    employeeId?: string;
  } = {
    tenantId,
    payrollRun: { year },
  };

  if (month) {
    where.payrollRun = { year, month };
  }
  if (employeeId) {
    where.employeeId = employeeId;
  }

  const payslips = await prisma.payslip.findMany({
    where,
    include: {
      employee: { select: { name: true, employeeNumber: true } },
      payrollRun: { select: { year: true, month: true } },
    },
    orderBy: [
      { payrollRun: { month: "asc" } },
      { employee: { name: "asc" } },
    ],
  });

  const header = [
    "년도",
    "월",
    "사번",
    "이름",
    "기본급",
    "수당",
    "공제",
    "실수령액",
    "상태",
  ].join(",");

  const rows = payslips.map((p) =>
    [
      p.payrollRun.year,
      p.payrollRun.month,
      p.employee.employeeNumber,
      escapeCsvField(p.employee.name),
      p.baseSalary,
      p.allowances,
      p.deductions,
      p.netAmount,
      p.status,
    ].join(","),
  );

  return [header, ...rows].join("\n");
}

// ─── 출결 기록 CSV ──────────────────────────────────────
async function exportAttendance(
  tenantId: string,
  year: number,
  month?: number,
  employeeId?: string,
): Promise<string> {
  const dateStart = new Date(Date.UTC(year, month ? month - 1 : 0, 1));
  const dateEnd = month
    ? new Date(Date.UTC(year, month, 1))
    : new Date(Date.UTC(year + 1, 0, 1));

  const where: {
    tenantId: string;
    date: { gte: Date; lt: Date };
    employeeId?: string;
  } = {
    tenantId,
    date: { gte: dateStart, lt: dateEnd },
  };

  if (employeeId) {
    where.employeeId = employeeId;
  }

  const records = await prisma.attendanceRecord.findMany({
    where,
    include: {
      employee: { select: { name: true, employeeNumber: true } },
    },
    orderBy: [{ date: "asc" }, { employee: { name: "asc" } }],
  });

  const header = [
    "날짜",
    "사번",
    "이름",
    "상태",
    "출근시간",
    "퇴근시간",
    "근무시간(분)",
    "초과근무(분)",
    "비고",
  ].join(",");

  const rows = records.map((r) =>
    [
      r.date.toISOString().split("T")[0],
      r.employee.employeeNumber,
      escapeCsvField(r.employee.name),
      r.status,
      r.checkIn ? r.checkIn.toISOString().replace("T", " ").slice(0, 19) : "",
      r.checkOut
        ? r.checkOut.toISOString().replace("T", " ").slice(0, 19)
        : "",
      r.workMinutes ?? "",
      r.overtime,
      escapeCsvField(r.note ?? ""),
    ].join(","),
  );

  return [header, ...rows].join("\n");
}

// ─── CSV 필드 이스케이프 ────────────────────────────────
function escapeCsvField(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
