"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import {
  KPICard,
  KPIGrid,
  Badge,
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardBody,
  CardFooter,
  QueueList,
  QueueItem,
} from "@/components/ui";
import type { BadgeVariant, QueuePriority } from "@/components/ui";

// ─── Types ──────────────────────────────────────────────────

interface OperationQueueItem {
  priority: QueuePriority;
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

// ─── Helpers ────────────────────────────────────────────────

function StatRow({
  label,
  value,
  variant,
}: {
  label: string;
  value: string | number;
  variant?: "danger" | "warning" | "neutral";
}) {
  const colorMap: Record<string, string> = {
    danger: "text-status-danger",
    warning: "text-status-warning",
    neutral: "text-text-primary",
  };

  return (
    <div className="flex items-center justify-between border-b border-border-subtle py-sp-3 last:border-b-0">
      <span className="text-sm text-text-secondary">{label}</span>
      <span className={`text-sm font-semibold ${colorMap[variant ?? "neutral"]}`}>
        {value}
      </span>
    </div>
  );
}

function HealthBar({ label, value }: { label: string; value: number }) {
  const isWarning = value < 95;
  const barColor = isWarning
    ? "bg-status-warning-solid"
    : "bg-brand-primary";

  return (
    <div className="flex items-center gap-sp-3 py-sp-2">
      <span className="w-28 flex-shrink-0 text-sm text-text-secondary">{label}</span>
      <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-surface-secondary">
        <div
          className={`absolute inset-y-0 left-0 rounded-full ${barColor}`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="w-14 text-right text-sm font-medium text-text-primary">
        {value}%
      </span>
    </div>
  );
}

// ─── Component ──────────────────────────────────────────────

export default function PlatformDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-sp-12">
          <span className="text-sm text-text-tertiary">불러오는 중...</span>
        </div>
      }
    >
      <PlatformDashboardContent />
    </Suspense>
  );
}

function PlatformDashboardContent() {
  const [data, setData] = useState<PlatformDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/platform/dashboard");
      if (res.ok) {
        const json: PlatformDashboardData = await res.json();
        setData(json);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-sp-12">
        <span className="text-sm text-text-tertiary">불러오는 중...</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center py-sp-12">
        <span className="text-sm text-text-tertiary">
          데이터를 불러올 수 없습니다
        </span>
      </div>
    );
  }

  const todayStr = new Date().toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const healthBadgeVariant: Record<string, BadgeVariant> = {
    normal: "success",
    warning: "warning",
    critical: "danger",
  };

  const healthLabel: Record<string, string> = {
    normal: "정상",
    warning: "주의",
    critical: "위험",
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-sp-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">플랫폼 개요</h1>
          <p className="mt-sp-1 text-md text-text-secondary">
            {todayStr} 기준 운영 현황
          </p>
        </div>
        <div className="flex items-center gap-sp-3">
          <Button variant="secondary">리포트 내보내기</Button>
          <Button variant="primary">테넌트 추가</Button>
        </div>
      </div>

      {/* KPI Row (4 cols) */}
      <KPIGrid columns={4}>
        <KPICard
          eyebrow="활성 테넌트"
          value={data.kpi.activeTenants.value}
          label="전월 대비"
          delta={data.kpi.activeTenants.delta}
          deltaDirection={data.kpi.activeTenants.deltaDirection}
          emphasis
        />
        <KPICard
          eyebrow="유예 고객"
          value={data.kpi.gracePeriod.value}
          label="결제 유예 상태"
          delta={data.kpi.gracePeriod.delta}
          deltaDirection={data.kpi.gracePeriod.deltaDirection}
        />
        <KPICard
          eyebrow="결제 실패"
          value={data.kpi.paymentFailures.value}
          label="최근 7일간"
          delta={data.kpi.paymentFailures.delta}
          deltaDirection={data.kpi.paymentFailures.deltaDirection}
        />
        <KPICard
          eyebrow="미해결 지원"
          value={data.kpi.openSupport.value}
          label="SLA 위반 2건"
          delta={data.kpi.openSupport.delta}
          deltaDirection={data.kpi.openSupport.deltaDirection}
        />
      </KPIGrid>

      {/* Operations Queue + Right Column (2:1) */}
      <div className="mt-sp-6 grid grid-cols-1 gap-sp-6 lg:grid-cols-3">
        {/* Left Column */}
        <div className="flex flex-col gap-sp-6 lg:col-span-2">
          {/* Operations Queue */}
          <Card>
            <CardHeader>
              <CardTitle>운영 큐</CardTitle>
              <Button variant="ghost" size="sm">
                전체 보기
              </Button>
            </CardHeader>
            <CardBody>
              <QueueList>
                {data.operationsQueue.map((item, idx) => (
                  <QueueItem
                    key={idx}
                    priority={item.priority}
                    title={item.title}
                    meta={item.meta}
                    action={
                      <Button
                        variant={
                          item.actionVariant === "danger"
                            ? "danger"
                            : item.actionVariant === "primary"
                              ? "primary"
                              : item.actionVariant === "ghost"
                                ? "ghost"
                                : "secondary"
                        }
                        size="sm"
                      >
                        {item.actionLabel}
                      </Button>
                    }
                  />
                ))}
              </QueueList>
            </CardBody>
          </Card>

          {/* Platform Health Signals */}
          <Card>
            <CardHeader>
              <CardTitle>플랫폼 상태 신호</CardTitle>
              <Badge variant={healthBadgeVariant[data.healthStatus]}>
                {healthLabel[data.healthStatus]}
              </Badge>
            </CardHeader>
            <CardBody>
              {data.healthSignals.map((signal) => (
                <HealthBar
                  key={signal.label}
                  label={signal.label}
                  value={signal.value}
                />
              ))}
            </CardBody>
            <CardFooter>
              <span className="text-sm text-text-tertiary">
                마지막 업데이트: {data.healthLastUpdated}
              </span>
            </CardFooter>
          </Card>
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-sp-6">
          {/* Recent Tenant Changes */}
          <Card>
            <CardHeader>
              <CardTitle>최근 테넌트 변경</CardTitle>
            </CardHeader>
            <CardBody>
              <div className="flex flex-col">
                {data.tenantChanges.map((change, idx) => (
                  <div
                    key={idx}
                    className="flex gap-sp-3 border-b border-border-subtle py-sp-3 last:border-b-0"
                  >
                    <span className="w-20 flex-shrink-0 text-sm text-text-tertiary">
                      {change.time}
                    </span>
                    <span className="text-sm text-text-primary">
                      <strong>{change.tenant}</strong> {change.text}
                    </span>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          {/* Security Signals */}
          <Card>
            <CardHeader>
              <CardTitle>보안 신호</CardTitle>
              <Badge
                variant={data.securityAlertCount > 0 ? "warning" : "success"}
              >
                {data.securityAlertCount > 0
                  ? `주의 ${data.securityAlertCount}`
                  : "안전"}
              </Badge>
            </CardHeader>
            <CardBody>
              {data.securitySignals.map((signal) => (
                <StatRow
                  key={signal.label}
                  label={signal.label}
                  value={signal.value}
                  variant={signal.severity}
                />
              ))}
            </CardBody>
            <CardFooter>
              <button className="text-sm text-brand-primary hover:underline">
                감사 로그 전체 보기 →
              </button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
