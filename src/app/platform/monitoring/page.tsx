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
  BarChart,
  ProgressBar,
} from "@/components/ui";
import type { BadgeVariant } from "@/components/ui";

// ─── Types ──────────────────────────────────────────────

interface ModuleMetric {
  module: string;
  value: number;
  status: "ok" | "warning";
}

interface MethodBreakdown {
  method: string;
  value: number;
  percent: number;
}

interface ErrorBreakdown {
  type: string;
  value: number;
}

interface ServiceMetrics {
  apiResponseTime: {
    overall: number;
    breakdown: ModuleMetric[];
  };
  throughput: {
    overall: number;
    breakdown: MethodBreakdown[];
  };
  errorRate: {
    overall: number;
    threshold: number;
    breakdown: ErrorBreakdown[];
  };
}

interface ActiveUserPoint {
  day: string;
  value: number;
}

interface FeatureAdoptionItem {
  feature: string;
  rate: number;
}

interface UsageAnalytics {
  activeUserTrend: ActiveUserPoint[];
  featureAdoption: FeatureAdoptionItem[];
  activeTenants: number;
}

interface UptimeMetric {
  service: string;
  uptime: number;
  status: "ok" | "warning";
}

interface AlertRule {
  id: string;
  name: string;
  condition: string;
  enabled: boolean;
  lastTriggered: string | null;
}

interface MonitoringData {
  serviceMetrics: ServiceMetrics;
  usageAnalytics: UsageAnalytics;
  uptime: UptimeMetric[];
  alertRules: AlertRule[];
  range: string;
  lastUpdated: string;
}

// ─── Constants ──────────────────────────────────────────

const RANGE_OPTIONS = [
  { value: "24h", label: "24시간" },
  { value: "7d", label: "7일" },
  { value: "30d", label: "30일" },
];

// ─── Component ──────────────────────────────────────────

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
  const [data, setData] = useState<MonitoringData | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("24h");

  const fetchMonitoring = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/platform/monitoring?range=${range}`);
      if (res.ok) {
        const json: MonitoringData = await res.json();
        setData(json);
      }
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    fetchMonitoring();
  }, [fetchMonitoring]);

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

  const { serviceMetrics, usageAnalytics, uptime, alertRules } = data;

  return (
    <div>
      {/* Header */}
      <div className="mb-sp-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">모니터링</h1>
          <p className="mt-sp-1 text-md text-text-secondary">
            API 메트릭 · 업타임 · 사용 분석 · 알림 규칙
          </p>
        </div>
        <div className="flex items-center gap-sp-2">
          {RANGE_OPTIONS.map((opt) => (
            <Button
              key={opt.value}
              variant={range === opt.value ? "primary" : "ghost"}
              size="sm"
              onClick={() => setRange(opt.value)}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Service Metrics KPI */}
      <KPIGrid columns={3}>
        <KPICard
          eyebrow="API 응답시간 (p95)"
          value={`${serviceMetrics.apiResponseTime.overall}ms`}
          label="전체 평균"
          emphasis
        />
        <KPICard
          eyebrow="처리량 (RPM)"
          value={serviceMetrics.throughput.overall.toLocaleString("ko-KR")}
          label="분당 요청 수"
        />
        <KPICard
          eyebrow="에러율"
          value={`${serviceMetrics.errorRate.overall}%`}
          label={`목표 ${serviceMetrics.errorRate.threshold}% 이하`}
          delta={
            serviceMetrics.errorRate.overall > serviceMetrics.errorRate.threshold
              ? "초과"
              : undefined
          }
          deltaDirection={
            serviceMetrics.errorRate.overall > serviceMetrics.errorRate.threshold
              ? "up"
              : "neutral"
          }
        />
      </KPIGrid>

      {/* Service Metrics Detail (3 cols) */}
      <div className="mt-sp-6 grid grid-cols-1 gap-sp-6 lg:grid-cols-3">
        {/* API Response Time Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>모듈별 응답시간</CardTitle>
            <Badge variant="info">p95</Badge>
          </CardHeader>
          <CardBody>
            <div className="flex flex-col gap-sp-3">
              {serviceMetrics.apiResponseTime.breakdown.map((m) => (
                <div
                  key={m.module}
                  className="grid grid-cols-[80px_1fr_60px] items-center gap-sp-3"
                >
                  <span className="text-xs text-text-secondary">
                    {m.module}
                  </span>
                  <div className="h-2 overflow-hidden rounded-full bg-surface-secondary">
                    <div
                      className={[
                        "h-full rounded-full transition-all",
                        m.status === "warning"
                          ? "bg-status-warning-solid"
                          : "bg-brand",
                      ].join(" ")}
                      style={{ width: `${Math.min((m.value / 300) * 100, 100)}%` }}
                    />
                  </div>
                  <span
                    className={[
                      "text-right text-xs font-medium",
                      m.status === "warning"
                        ? "text-status-warning-text"
                        : "text-text-primary",
                    ].join(" ")}
                  >
                    {m.value}ms
                  </span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* Throughput Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>처리량 상세</CardTitle>
            <span className="text-xs text-text-tertiary">RPM</span>
          </CardHeader>
          <CardBody>
            <div className="flex flex-col gap-sp-3">
              {serviceMetrics.throughput.breakdown.map((m) => (
                <div
                  key={m.method}
                  className="flex items-center justify-between border-b border-border-subtle py-sp-2 last:border-b-0"
                >
                  <span className="flex items-center gap-sp-2">
                    <Badge
                      variant={
                        m.method === "GET"
                          ? "info"
                          : m.method === "POST"
                            ? "success"
                            : m.method === "DELETE"
                              ? "danger"
                              : "warning"
                      }
                    >
                      {m.method}
                    </Badge>
                    <span className="text-sm text-text-primary">
                      {m.value.toLocaleString("ko-KR")}
                    </span>
                  </span>
                  <span className="text-xs text-text-tertiary">
                    {m.percent}%
                  </span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* Error Rate Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>에러 분류</CardTitle>
            {serviceMetrics.errorRate.overall >
            serviceMetrics.errorRate.threshold ? (
              <Badge variant="warning">주의</Badge>
            ) : (
              <Badge variant="success">정상</Badge>
            )}
          </CardHeader>
          <CardBody>
            <div className="flex flex-col gap-sp-3">
              {serviceMetrics.errorRate.breakdown.map((e) => (
                <div
                  key={e.type}
                  className="flex items-center justify-between border-b border-border-subtle py-sp-2 last:border-b-0"
                >
                  <span className="text-sm text-text-secondary">{e.type}</span>
                  <span className="text-sm font-semibold text-text-primary">
                    {e.value}%
                  </span>
                </div>
              ))}
              <div className="mt-sp-2 flex items-center justify-between rounded-sm bg-surface-secondary px-sp-3 py-sp-2">
                <span className="text-xs font-medium text-text-secondary">
                  전체 에러율
                </span>
                <span className="text-sm font-bold text-text-primary">
                  {serviceMetrics.errorRate.overall}%
                </span>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Usage Analytics (2 cols) */}
      <div className="mt-sp-6 grid grid-cols-1 gap-sp-6 lg:grid-cols-2">
        {/* Active User Trend */}
        <Card>
          <CardHeader>
            <CardTitle>활성 사용자 추이</CardTitle>
            <span className="text-xs text-text-tertiary">
              활성 테넌트 {usageAnalytics.activeTenants}개
            </span>
          </CardHeader>
          <CardBody>
            <BarChart
              data={usageAnalytics.activeUserTrend.map((d) => ({
                label: d.day,
                value: d.value,
              }))}
              height={180}
            />
          </CardBody>
        </Card>

        {/* Feature Adoption */}
        <Card>
          <CardHeader>
            <CardTitle>기능 도입률</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="flex flex-col gap-sp-3">
              {usageAnalytics.featureAdoption.map((f) => (
                <div key={f.feature} className="flex flex-col gap-sp-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-text-secondary">
                      {f.feature}
                    </span>
                    <span className="text-xs font-medium text-text-primary">
                      {f.rate}%
                    </span>
                  </div>
                  <ProgressBar
                    value={f.rate}
                    max={100}
                    variant={
                      f.rate >= 80
                        ? "success"
                        : f.rate >= 50
                          ? "default"
                          : "warning"
                    }
                  />
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Uptime + Alert Rules (1:1) */}
      <div className="mt-sp-6 grid grid-cols-1 gap-sp-6 lg:grid-cols-2">
        {/* Uptime */}
        <Card>
          <CardHeader>
            <CardTitle>서비스 업타임</CardTitle>
            <Badge variant="success">정상 운영</Badge>
          </CardHeader>
          <CardBody>
            <div className="flex flex-col gap-sp-3">
              {uptime.map((s) => (
                <div
                  key={s.service}
                  className="grid grid-cols-[120px_1fr_80px] items-center gap-sp-3"
                >
                  <span className="text-xs text-text-secondary">
                    {s.service}
                  </span>
                  <div className="h-2 overflow-hidden rounded-full bg-surface-secondary">
                    <div
                      className={[
                        "h-full rounded-full transition-all",
                        s.status === "warning"
                          ? "bg-status-warning-solid"
                          : "bg-status-success-solid",
                      ].join(" ")}
                      style={{ width: `${s.uptime}%` }}
                    />
                  </div>
                  <span
                    className={[
                      "text-right text-xs font-medium",
                      s.status === "warning"
                        ? "text-status-warning-text"
                        : "text-status-success-text",
                    ].join(" ")}
                  >
                    {s.uptime}%
                  </span>
                </div>
              ))}
            </div>
          </CardBody>
          <CardFooter>
            <span className="text-xs text-text-tertiary">
              마지막 업데이트:{" "}
              {new Date(data.lastUpdated).toLocaleString("ko-KR", {
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              })}{" "}
              KST
            </span>
          </CardFooter>
        </Card>

        {/* Alert Rules */}
        <Card>
          <CardHeader>
            <CardTitle>알림 규칙</CardTitle>
            <Badge variant="info">
              {alertRules.filter((r) => r.enabled).length}개 활성
            </Badge>
          </CardHeader>
          <CardBody>
            <div className="flex flex-col">
              {alertRules.map((rule) => (
                <div
                  key={rule.id}
                  className="flex items-center justify-between border-b border-border-subtle py-sp-3 last:border-b-0"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-text-primary">
                      {rule.name}
                    </span>
                    <span className="text-xs text-text-tertiary">
                      조건: {rule.condition}
                      {rule.lastTriggered && (
                        <>
                          {" · 최근 발동: "}
                          {new Date(rule.lastTriggered).toLocaleDateString(
                            "ko-KR",
                            { month: "2-digit", day: "2-digit" },
                          )}
                        </>
                      )}
                    </span>
                  </div>
                  <AlertToggle enabled={rule.enabled} />
                </div>
              ))}
            </div>
          </CardBody>
          <CardFooter>
            <Button variant="ghost" size="sm">
              규칙 추가 →
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

// ─── Helpers ────────────────────────────────────────────

function AlertToggle({ enabled }: { enabled: boolean }) {
  const [on, setOn] = useState(enabled);

  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => setOn((prev) => !prev)}
      className={[
        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-fast",
        on ? "bg-brand" : "bg-surface-tertiary",
      ].join(" ")}
    >
      <span
        className={[
          "pointer-events-none inline-block h-4 w-4 translate-y-0.5 rounded-full bg-white shadow transition-transform duration-fast",
          on ? "translate-x-4" : "translate-x-0.5",
        ].join(" ")}
      />
    </button>
  );
}
