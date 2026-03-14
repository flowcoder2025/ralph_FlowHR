import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface OperationQueueItem {
  priority: "critical" | "high" | "medium" | "low";
  title: string;
  meta: string;
  actionLabel: string;
  actionVariant: "danger" | "primary" | "secondary" | "ghost";
}

interface HealthSignal {
  label: string;
  value: number;
}

interface TenantChange {
  time: string;
  text: string;
  tenant: string;
}

interface SecuritySignal {
  label: string;
  value: number;
  severity: "danger" | "warning" | "neutral";
}

interface PlatformDashboardData {
  kpi: {
    activeTenants: { value: number; delta: string; deltaDirection: "up" | "down" | "neutral" };
    gracePeriod: { value: number; delta: string; deltaDirection: "up" | "down" | "neutral" };
    paymentFailures: { value: number; delta: string; deltaDirection: "up" | "down" | "neutral" };
    openSupport: { value: number; delta: string; deltaDirection: "up" | "down" | "neutral" };
  };
  operationsQueue: OperationQueueItem[];
  healthSignals: HealthSignal[];
  healthStatus: "normal" | "warning" | "critical";
  healthLastUpdated: string;
  tenantChanges: TenantChange[];
  securitySignals: SecuritySignal[];
  securityAlertCount: number;
}

export async function GET(): Promise<NextResponse<PlatformDashboardData>> {
  const now = new Date();
  const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  const data: PlatformDashboardData = {
    kpi: {
      activeTenants: { value: 247, delta: "+12 (+5.1%)", deltaDirection: "up" },
      gracePeriod: { value: 12, delta: "+3 지난주 대비", deltaDirection: "up" },
      paymentFailures: { value: 3, delta: "-2 개선", deltaDirection: "down" },
      openSupport: { value: 8, delta: "+1 증가", deltaDirection: "up" },
    },
    operationsQueue: [
      {
        priority: "critical",
        title: "Nova Team — 결제 3회 연속 실패",
        meta: "2시간 전 · 자동 유예 전환 예정",
        actionLabel: "즉시 확인",
        actionVariant: "danger",
      },
      {
        priority: "critical",
        title: "SSO 인증 오류 — Orbit Labs 연동 실패",
        meta: "45분 전 · SAML 인증서 만료 의심",
        actionLabel: "조치",
        actionVariant: "primary",
      },
      {
        priority: "high",
        title: "Acme Corp — Enterprise 업그레이드 요청",
        meta: "3시간 전 · 영업팀 연계 필요",
        actionLabel: "검토",
        actionVariant: "secondary",
      },
      {
        priority: "medium",
        title: "DeepField — 데이터 마이그레이션 지원 요청",
        meta: "오늘 09:20 · 기술 지원팀 배정 대기",
        actionLabel: "배정",
        actionVariant: "secondary",
      },
      {
        priority: "low",
        title: "Stellar Inc — API 사용량 한도 상향 문의",
        meta: "오늘 10:05 · 일반 문의",
        actionLabel: "응답",
        actionVariant: "ghost",
      },
    ],
    healthSignals: [
      { label: "API 성공률", value: 99.7 },
      { label: "Webhook 전송", value: 98.2 },
      { label: "SSO 인증", value: 94.5 },
      { label: "데이터 동기화", value: 99.1 },
    ],
    healthStatus: "normal",
    healthLastUpdated: `${timeStr} KST`,
    tenantChanges: [
      { time: "11:30", tenant: "BlueSky Corp", text: "신규 가입 (Growth 플랜)" },
      { time: "10:15", tenant: "Acme Corp", text: "좌석 50 → 75 증설" },
      { time: "09:45", tenant: "MegaTech", text: "체험판 → Starter 전환" },
      { time: "08:20", tenant: "Nova Team", text: "결제 실패 (3차)" },
      { time: "어제 18:30", tenant: "Orbit Labs", text: "SSO 설정 변경" },
    ],
    securitySignals: [
      { label: "비정상 로그인 시도", value: 7, severity: "danger" },
      { label: "MFA 미설정 운영자", value: 2, severity: "warning" },
      { label: "만료 예정 인증서", value: 1, severity: "neutral" },
      { label: "API 키 만료 예정", value: 3, severity: "neutral" },
      { label: "IP 차단 이벤트 (24h)", value: 14, severity: "neutral" },
    ],
    securityAlertCount: 1,
  };

  return NextResponse.json(data);
}
