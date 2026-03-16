"use client";

import {
  KPICard,
  KPIGrid,
} from "@/components/ui";

// ─── Types ──────────────────────────────────────────────────

interface KPIData {
  openPostings: { count: number };
  applications: { count: number; delta: number };
  interviews: { count: number };
  avgHiringDays: { days: number };
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
        eyebrow="진행 중 채용"
        value={kpi.openPostings.count}
        label="건 활성 공고"
        emphasis
      />
      <KPICard
        eyebrow="서류 접수"
        value={kpi.applications.count}
        label="명 지원자"
        delta={
          kpi.applications.delta !== 0
            ? `${Math.abs(kpi.applications.delta)}명 전주 대비`
            : undefined
        }
        deltaDirection={
          kpi.applications.delta > 0
            ? "up"
            : kpi.applications.delta < 0
              ? "down"
              : "neutral"
        }
      />
      <KPICard
        eyebrow="면접 예정"
        value={kpi.interviews.count}
        label="명 이번 주"
      />
      <KPICard
        eyebrow="평균 채용 기간"
        value={kpi.avgHiringDays.days}
        label="일 (공고~입사)"
      />
    </KPIGrid>
  );
}
