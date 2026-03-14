import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const token = await getToken({ req: request });
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const range = searchParams.get("range") ?? "24h";

  // ─── Service Metrics ──────────────────────────────────

  const apiResponseTime = {
    overall: 142,
    breakdown: [
      { module: "HR", value: 120, status: "ok" as const },
      { module: "근태", value: 142, status: "ok" as const },
      { module: "급여", value: 168, status: "ok" as const },
      { module: "결재", value: 108, status: "ok" as const },
      { module: "문서", value: 195, status: "warning" as const },
    ],
  };

  const throughput = {
    overall: 12450,
    breakdown: [
      { method: "GET", value: 9340, percent: 75 },
      { method: "POST", value: 2240, percent: 18 },
      { method: "PUT", value: 680, percent: 6 },
      { method: "DELETE", value: 190, percent: 2 },
    ],
  };

  const errorRate = {
    overall: 0.31,
    threshold: 0.1,
    breakdown: [
      { type: "4xx Client", value: 0.2 },
      { type: "5xx Server", value: 0.11 },
      { type: "Timeout", value: 0.03 },
    ],
  };

  // ─── Usage Analytics ──────────────────────────────────

  const rangeMultiplier = range === "30d" ? 1.2 : range === "7d" ? 1.0 : 0.8;

  const activeUserTrend = [
    { day: "월", value: Math.round(2840 * rangeMultiplier) },
    { day: "화", value: Math.round(3200 * rangeMultiplier) },
    { day: "수", value: Math.round(3600 * rangeMultiplier) },
    { day: "목", value: Math.round(3100 * rangeMultiplier) },
    { day: "금", value: Math.round(2950 * rangeMultiplier) },
    { day: "토", value: Math.round(480 * rangeMultiplier) },
    { day: "일", value: Math.round(520 * rangeMultiplier) },
  ];

  const featureAdoption = [
    { feature: "인사관리", rate: 98 },
    { feature: "근태관리", rate: 94 },
    { feature: "휴가관리", rate: 91 },
    { feature: "결재관리", rate: 82 },
    { feature: "급여관리", rate: 67 },
    { feature: "성과관리", rate: 43 },
    { feature: "채용관리", rate: 31 },
  ];

  // ─── Uptime & Alerts ─────────────────────────────────

  const tenantCount = await prisma.tenant.count({ where: { status: "ACTIVE" } });

  const uptimeMetrics = [
    { service: "API Gateway", uptime: 99.97, status: "ok" as const },
    { service: "Database", uptime: 99.99, status: "ok" as const },
    { service: "Auth Service", uptime: 99.95, status: "ok" as const },
    { service: "File Storage", uptime: 99.92, status: "ok" as const },
    { service: "Webhook Engine", uptime: 98.5, status: "warning" as const },
  ];

  const alertRules = [
    {
      id: "1",
      name: "API 에러율 임계치",
      condition: "5xx > 0.5%",
      enabled: true,
      lastTriggered: null,
    },
    {
      id: "2",
      name: "응답 시간 지연",
      condition: "p95 > 500ms",
      enabled: true,
      lastTriggered: null,
    },
    {
      id: "3",
      name: "결제 실패 알림",
      condition: "연속 3회 실패",
      enabled: true,
      lastTriggered: "2026-03-12T08:30:00Z",
    },
    {
      id: "4",
      name: "디스크 사용량 경고",
      condition: "> 85%",
      enabled: false,
      lastTriggered: null,
    },
    {
      id: "5",
      name: "Webhook 전송 실패",
      condition: "실패율 > 5%",
      enabled: true,
      lastTriggered: "2026-03-13T15:20:00Z",
    },
  ];

  return NextResponse.json({
    serviceMetrics: {
      apiResponseTime,
      throughput,
      errorRate,
    },
    usageAnalytics: {
      activeUserTrend,
      featureAdoption,
      activeTenants: tenantCount,
    },
    uptime: uptimeMetrics,
    alertRules,
    range,
    lastUpdated: new Date().toISOString(),
  });
}
