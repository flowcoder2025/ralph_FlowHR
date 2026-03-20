import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

// ─── GET: 시스템 모니터링 메트릭 ────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request });
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (token.role !== "PLATFORM_OPERATOR") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // ─── 활성 사용자 (24시간 내 출근 기록이 있는 고유 직원 수) ──
    const recentAttendance = await prisma.attendanceRecord.findMany({
      where: {
        checkIn: { gte: last24h },
      },
      select: { employeeId: true },
      distinct: ["employeeId"],
    });
    const activeUsers = recentAttendance.length;

    // ─── 24시간 요청 수 (출근 기록 + 문서 수 합산) ─────────────
    const [attendanceCount, documentCount] = await Promise.all([
      prisma.attendanceRecord.count({
        where: { createdAt: { gte: last24h } },
      }),
      prisma.document.count({
        where: { createdAt: { gte: last24h } },
      }),
    ]);
    const totalRequests24h = attendanceCount + documentCount;

    // ─── 인프라 메트릭 (DB에서 측정 불가 — 시뮬레이션) ─────────
    const metrics = {
      uptime: 99.95,
      avgResponseTime: 142,
      errorRate: 0.12,
      activeUsers,
      totalRequests24h,
      dbConnections: 18,
      memoryUsage: 62,
      cpuUsage: 34,
      simulated: ["uptime", "avgResponseTime", "errorRate", "dbConnections", "memoryUsage", "cpuUsage"],
    };

    // ─── 서비스 상태 ──────────────────────────────────────────
    const services = [
      { name: "웹 애플리케이션", status: "operational" as const, latency: 89, uptime: 99.99 },
      { name: "API 서버", status: "operational" as const, latency: 42, uptime: 99.97 },
      { name: "데이터베이스", status: "operational" as const, latency: 12, uptime: 99.99 },
      { name: "파일 스토리지", status: "operational" as const, latency: 156, uptime: 99.95 },
      { name: "이메일 서비스", status: "operational" as const, latency: 320, uptime: 99.90 },
      { name: "알림 서비스", status: "operational" as const, latency: 68, uptime: 99.98 },
    ];

    return NextResponse.json({
      data: {
        metrics,
        services,
      },
    });
  } catch (error) {
    console.error("[platform/monitoring GET] Error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 },
    );
  }
}
