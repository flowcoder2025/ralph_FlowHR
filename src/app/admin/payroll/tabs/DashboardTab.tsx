"use client";

import { KPICard, KPIGrid } from "@/components/ui";

// ─── Types ──────────────────────────────────────────────────

export interface KPIData {
  totalEmployees: { count: number };
  confirmed: { count: number; percentage: number };
  unconfirmed: { count: number; delta: number };
  sent: { count: number; delta: number };
}

export interface DashboardData {
  kpi: KPIData;
}

// ─── Component ──────────────────────────────────────────────

export function DashboardTab({
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

  const { kpi } = data;

  return (
    <KPIGrid columns={4}>
      <KPICard
        eyebrow="급여 인원"
        value={kpi.totalEmployees.count}
        label="명 (이번 달)"
      />
      <KPICard
        eyebrow="확정 완료율"
        value={kpi.confirmed.count}
        label={`건 (${kpi.confirmed.percentage}%)`}
        emphasis
      />
      <KPICard
        eyebrow="미확정 건수"
        value={kpi.unconfirmed.count}
        label="건 미처리"
        delta={
          kpi.unconfirmed.delta !== 0
            ? `${Math.abs(kpi.unconfirmed.delta)}건 전월 대비`
            : undefined
        }
        deltaDirection={
          kpi.unconfirmed.delta > 0
            ? "up"
            : kpi.unconfirmed.delta < 0
              ? "down"
              : "neutral"
        }
      />
      <KPICard
        eyebrow="발송 완료"
        value={kpi.sent.count}
        label="건 발송됨"
        delta={
          kpi.sent.delta !== 0
            ? `${Math.abs(kpi.sent.delta)}건 전월 대비`
            : undefined
        }
        deltaDirection={
          kpi.sent.delta > 0
            ? "down"
            : kpi.sent.delta < 0
              ? "up"
              : "neutral"
        }
      />
    </KPIGrid>
  );
}
