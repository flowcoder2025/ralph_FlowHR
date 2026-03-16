"use client";

import {
  KPICard,
  KPIGrid,
  Card,
  CardHeader,
  CardTitle,
  CardBody,
  Badge,
  BarChart,
} from "@/components/ui";
import type { BadgeVariant } from "@/components/ui";

// ─── Types ──────────────────────────────────────────────────

interface KPIData {
  present: { rate: number; count: number; total: number };
  inProgress: { rate: number; count: number };
  absent: { rate: number; count: number };
  exceptions: {
    total: number;
    delta: number;
    late: number;
    correction: number;
    overtime: number;
    other: number;
  };
}

interface DepartmentRate {
  name: string;
  value: number;
  [key: string]: string | number;
}

interface WeeklySummary {
  avgCheckIn: string;
  avgCheckOut: string;
  avgWorkHours: string;
  overtimeCases: number;
  near52hLimit: number;
}

export interface DashboardData {
  kpi: KPIData;
  departmentRates: DepartmentRate[];
  weeklySummary: WeeklySummary;
}

// ─── Stat row component ─────────────────────────────────────

function StatRow({
  label,
  value,
  badge,
}: {
  label: string;
  value?: string;
  badge?: { text: string; variant: BadgeVariant };
}) {
  return (
    <div className="flex items-center justify-between border-b border-border-subtle py-sp-3 last:border-b-0">
      <span className="text-sm text-text-secondary">{label}</span>
      {badge ? (
        <Badge variant={badge.variant}>{badge.text}</Badge>
      ) : (
        <span className="text-sm font-semibold text-text-primary">
          {value}
        </span>
      )}
    </div>
  );
}

// ─── Component ──────────────────────────────────────────────

export default function DashboardTab({
  data,
  loading,
}: {
  data: DashboardData | null;
  loading: boolean;
}) {
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

  const { kpi, departmentRates, weeklySummary } = data;

  const exceptionLabel = [
    kpi.exceptions.late > 0 ? `지각 ${kpi.exceptions.late}` : null,
    kpi.exceptions.correction > 0
      ? `누락 ${kpi.exceptions.correction}`
      : null,
    kpi.exceptions.other > 0 ? `기타 ${kpi.exceptions.other}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <>
      {/* KPI Cards */}
      <KPIGrid columns={4}>
        <KPICard
          eyebrow="출근 완료"
          value={`${kpi.present.rate}%`}
          label={`${kpi.present.count.toLocaleString()} / ${kpi.present.total.toLocaleString()}명`}
          emphasis
        />
        <KPICard
          eyebrow="진행 중"
          value={`${kpi.inProgress.rate}%`}
          label={`${kpi.inProgress.count.toLocaleString()}명 근무 중`}
        />
        <KPICard
          eyebrow="미출근"
          value={`${kpi.absent.rate}%`}
          label={
            kpi.absent.count === 0
              ? "전원 출근 완료"
              : `${kpi.absent.count.toLocaleString()}명`
          }
        />
        <KPICard
          eyebrow="예외 건수"
          value={kpi.exceptions.total}
          label={exceptionLabel || "예외 없음"}
          delta={
            kpi.exceptions.delta !== 0
              ? `${Math.abs(kpi.exceptions.delta)}건 전일 대비`
              : undefined
          }
          deltaDirection={
            kpi.exceptions.delta > 0
              ? "up"
              : kpi.exceptions.delta < 0
                ? "down"
                : "neutral"
          }
        />
      </KPIGrid>

      {/* Department Chart + Weekly Summary */}
      <div className="mt-sp-6 grid grid-cols-1 gap-sp-6 lg:grid-cols-3">
        {/* Department Attendance Rate Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>부서별 출근율</CardTitle>
            <span className="text-sm text-text-tertiary">
              오늘{" "}
              {new Date().toLocaleTimeString("ko-KR", {
                hour: "2-digit",
                minute: "2-digit",
              })}{" "}
              기준
            </span>
          </CardHeader>
          <CardBody>
            {departmentRates.length > 0 ? (
              <BarChart
                data={departmentRates}
                layout="vertical"
                height={Math.max(200, departmentRates.length * 48)}
                showTooltip
              />
            ) : (
              <div className="flex items-center justify-center py-sp-8">
                <span className="text-sm text-text-tertiary">
                  부서 데이터 없음
                </span>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Weekly Summary */}
        <Card>
          <CardHeader>
            <CardTitle>주간 요약</CardTitle>
          </CardHeader>
          <CardBody>
            <StatRow
              label="평균 출근 시각"
              value={weeklySummary.avgCheckIn}
            />
            <StatRow
              label="평균 퇴근 시각"
              value={weeklySummary.avgCheckOut}
            />
            <StatRow
              label="평균 근무 시간"
              value={weeklySummary.avgWorkHours}
            />
            <StatRow
              label="초과근무 발생"
              badge={{
                text: `${weeklySummary.overtimeCases}건`,
                variant:
                  weeklySummary.overtimeCases > 0 ? "warning" : "success",
              }}
            />
            <StatRow
              label="52h 상한 임박"
              badge={{
                text: `${weeklySummary.near52hLimit}명`,
                variant:
                  weeklySummary.near52hLimit > 0 ? "danger" : "success",
              }}
            />
          </CardBody>
        </Card>
      </div>
    </>
  );
}
