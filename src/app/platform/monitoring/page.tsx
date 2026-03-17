"use client";

import { Suspense, useState, useEffect } from "react";
import {
  KPICard,
  KPIGrid,
  Card,
  CardHeader,
  CardTitle,
  CardBody,
  Badge,
} from "@/components/ui";
import type { BadgeVariant } from "@/components/ui/Badge";

// ─── Types ──────────────────────────────────────────────────

interface ServiceStatus {
  name: string;
  status: "operational" | "degraded" | "down";
  latency: number;
  uptime: number;
}

interface SystemMetrics {
  uptime: number;
  avgResponseTime: number;
  errorRate: number;
  activeUsers: number;
  totalRequests24h: number;
  dbConnections: number;
  memoryUsage: number;
  cpuUsage: number;
}

// ─── Constants ──────────────────────────────────────────────

const SERVICE_STATUS_BADGE: Record<string, { label: string; variant: BadgeVariant }> = {
  operational: { label: "정상", variant: "success" },
  degraded: { label: "저하", variant: "warning" },
  down: { label: "중단", variant: "danger" },
};

// ─── Static data (모니터링 전용 API 없으므로 정적 표시) ──────

function generateMetrics(): SystemMetrics {
  return {
    uptime: 99.95,
    avgResponseTime: 142,
    errorRate: 0.12,
    activeUsers: 87,
    totalRequests24h: 45230,
    dbConnections: 18,
    memoryUsage: 62,
    cpuUsage: 34,
  };
}

function generateServices(): ServiceStatus[] {
  return [
    { name: "웹 애플리케이션", status: "operational", latency: 89, uptime: 99.99 },
    { name: "API 서버", status: "operational", latency: 42, uptime: 99.97 },
    { name: "데이터베이스", status: "operational", latency: 12, uptime: 99.99 },
    { name: "파일 스토리지", status: "operational", latency: 156, uptime: 99.95 },
    { name: "이메일 서비스", status: "operational", latency: 320, uptime: 99.90 },
    { name: "알림 서비스", status: "operational", latency: 68, uptime: 99.98 },
  ];
}

// ─── Component ──────────────────────────────────────────────

export default function MonitoringPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-sp-12">
          <span className="text-sm text-text-tertiary">불러오는 중...</span>
        </div>
      }
    >
      <MonitoringContent />
    </Suspense>
  );
}

function MonitoringContent() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  useEffect(() => {
    setMetrics(generateMetrics());
    setServices(generateServices());
    setLastUpdated(
      new Date().toLocaleString("ko-KR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
    );
    setLoading(false);
  }, []);

  if (loading || !metrics) {
    return (
      <div className="flex items-center justify-center py-sp-12">
        <span className="text-sm text-text-tertiary">불러오는 중...</span>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-sp-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">
            시스템 모니터링
          </h1>
          <p className="mt-sp-1 text-md text-text-secondary">
            시스템 상태 및 성능 현황
          </p>
        </div>
        <div className="text-sm text-text-tertiary">
          마지막 업데이트: {lastUpdated}
        </div>
      </div>

      {/* KPI Row */}
      <KPIGrid columns={4}>
        <KPICard
          eyebrow="가동률"
          value={`${metrics.uptime}%`}
          label="최근 30일"
          emphasis
        />
        <KPICard
          eyebrow="응답시간"
          value={`${metrics.avgResponseTime}ms`}
          label="평균 응답 시간"
        />
        <KPICard
          eyebrow="에러율"
          value={`${metrics.errorRate}%`}
          label="최근 24시간"
        />
        <KPICard
          eyebrow="활성 사용자"
          value={`${metrics.activeUsers}`}
          label="현재 접속"
        />
      </KPIGrid>

      {/* System Resources */}
      <div className="mt-sp-6 grid grid-cols-1 gap-sp-4 md:grid-cols-4">
        <Card>
          <CardBody>
            <p className="text-sm text-text-secondary">24시간 요청</p>
            <p className="mt-sp-1 text-2xl font-bold text-text-primary">
              {metrics.totalRequests24h.toLocaleString("ko-KR")}
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm text-text-secondary">DB 연결</p>
            <p className="mt-sp-1 text-2xl font-bold text-text-primary">
              {metrics.dbConnections}
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm text-text-secondary">메모리 사용</p>
            <p className="mt-sp-1 text-2xl font-bold text-text-primary">
              {metrics.memoryUsage}%
            </p>
            <div className="mt-sp-2 h-2 w-full rounded-full bg-surface-secondary">
              <div
                className="h-2 rounded-full bg-brand"
                style={{ width: `${metrics.memoryUsage}%` }}
              />
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm text-text-secondary">CPU 사용</p>
            <p className="mt-sp-1 text-2xl font-bold text-text-primary">
              {metrics.cpuUsage}%
            </p>
            <div className="mt-sp-2 h-2 w-full rounded-full bg-surface-secondary">
              <div
                className="h-2 rounded-full bg-brand"
                style={{ width: `${metrics.cpuUsage}%` }}
              />
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Service Status */}
      <div className="mt-sp-6">
        <Card>
          <CardHeader>
            <CardTitle>서비스 상태</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="divide-y divide-border-subtle">
              {services.map((service) => {
                const badge = SERVICE_STATUS_BADGE[service.status];
                return (
                  <div
                    key={service.name}
                    className="flex items-center justify-between py-sp-3"
                  >
                    <div className="flex items-center gap-sp-3">
                      <div
                        className={[
                          "h-2.5 w-2.5 rounded-full",
                          service.status === "operational"
                            ? "bg-status-success-text"
                            : service.status === "degraded"
                              ? "bg-status-warning-text"
                              : "bg-status-danger-text",
                        ].join(" ")}
                      />
                      <span className="text-sm font-medium text-text-primary">
                        {service.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-sp-4">
                      <span className="text-xs text-text-tertiary">
                        {service.latency}ms
                      </span>
                      <span className="text-xs text-text-tertiary">
                        {service.uptime}%
                      </span>
                      {badge && (
                        <Badge variant={badge.variant}>{badge.label}</Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
