"use client";

import {
  KPICard,
  KPIGrid,
} from "@/components/ui";

// ─── Types ──────────────────────────────────────────────────

interface KPIData {
  todayAbsences: { count: number };
  pendingRequests: { count: number; delta: number };
  avgRemaining: { days: number; employeeCount: number };
  monthUsage: { days: number; delta: number };
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
        eyebrow="오늘 휴가"
        value={kpi.todayAbsences.count}
        label="명 부재 중"
        emphasis
      />
      <KPICard
        eyebrow="대기 중 요청"
        value={kpi.pendingRequests.count}
        label="건 승인 대기"
        delta={
          kpi.pendingRequests.delta !== 0
            ? `${Math.abs(kpi.pendingRequests.delta)}건 전일 대비`
            : undefined
        }
        deltaDirection={
          kpi.pendingRequests.delta > 0
            ? "up"
            : kpi.pendingRequests.delta < 0
              ? "down"
              : "neutral"
        }
      />
      <KPICard
        eyebrow="잔여 연차 평균"
        value={kpi.avgRemaining.days}
        label="일 (전사 평균)"
      />
      <KPICard
        eyebrow="이번 달 사용"
        value={kpi.monthUsage.days}
        label="일 총 사용"
        delta={
          kpi.monthUsage.delta !== 0
            ? `${Math.abs(kpi.monthUsage.delta)}일 전월 대비`
            : "전월 동기 대비 유사"
        }
        deltaDirection={
          kpi.monthUsage.delta > 0
            ? "up"
            : kpi.monthUsage.delta < 0
              ? "down"
              : "neutral"
        }
      />
    </KPIGrid>
  );
}
