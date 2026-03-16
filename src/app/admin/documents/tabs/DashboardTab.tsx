"use client";

import {
  KPICard,
  KPIGrid,
} from "@/components/ui";

// ─── Types ──────────────────────────────────────────────────

interface KPIData {
  sent: { count: number };
  signed: { count: number; percentage: number };
  pending: { count: number; delta: number };
  expiring: { count: number; delta: number };
}

export interface DashboardData {
  kpi: KPIData;
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

  const { kpi } = data;

  return (
    <KPIGrid columns={4}>
      <KPICard
        eyebrow="발송 완료"
        value={kpi.sent.count}
        label="건 (이번 달)"
      />
      <KPICard
        eyebrow="서명 완료"
        value={kpi.signed.count}
        label={`건 (${kpi.signed.percentage}%)`}
        emphasis
      />
      <KPICard
        eyebrow="서명 대기"
        value={kpi.pending.count}
        label="건 미완료"
        delta={
          kpi.pending.delta !== 0
            ? `${Math.abs(kpi.pending.delta)}건 전주 대비`
            : undefined
        }
        deltaDirection={
          kpi.pending.delta > 0
            ? "up"
            : kpi.pending.delta < 0
              ? "down"
              : "neutral"
        }
      />
      <KPICard
        eyebrow="만료 예정"
        value={kpi.expiring.count}
        label="건 (7일 이내)"
        delta={
          kpi.expiring.delta !== 0
            ? `${Math.abs(kpi.expiring.delta)}건`
            : undefined
        }
        deltaDirection={
          kpi.expiring.delta > 0
            ? "up"
            : kpi.expiring.delta < 0
              ? "down"
              : "neutral"
        }
      />
    </KPIGrid>
  );
}
