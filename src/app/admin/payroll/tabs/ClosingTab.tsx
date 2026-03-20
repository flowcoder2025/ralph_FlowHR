"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardBody,
  Badge,
  Button,
  QueueList,
  QueueItem,
} from "@/components/ui";
import type { BadgeVariant, QueuePriority } from "@/components/ui";

// ─── Types ──────────────────────────────────────────────────

interface PayrollClosingChecklistItem {
  id: string;
  title: string;
  meta: string;
  status: "complete" | "pending" | "progress" | "not_started";
  statusLabel: string;
  priority: "low" | "medium" | "high" | "critical";
}

interface PayrollClosingData {
  year: number;
  month: number;
  status: string;
  currentStep: number;
  totalSteps: number;
  totalEmployees: number;
  totalAmount: number;
  confirmedBy: string | null;
  confirmedAt: string | null;
  checklist: PayrollClosingChecklistItem[];
}

// ─── Constants ──────────────────────────────────────────────

const PAYROLL_STEPS = [
  { step: 1, label: "데이터 수집", desc: "근태/변동 데이터" },
  { step: 2, label: "변동 확인", desc: "승진/조정/입퇴사" },
  { step: 3, label: "계산", desc: "급여 산출" },
  { step: 4, label: "검토", desc: "부서장/CFO" },
  { step: 5, label: "확정", desc: "이체/명세서 발행" },
];

const PAYROLL_STATUS_BADGE: Record<string, { label: string; variant: BadgeVariant }> = {
  DRAFT: { label: "준비", variant: "neutral" },
  DATA_COLLECTION: { label: "진행 중 (1/5단계)", variant: "info" },
  CHANGE_REVIEW: { label: "진행 중 (2/5단계)", variant: "info" },
  CALCULATION: { label: "진행 중 (3/5단계)", variant: "info" },
  REVIEW: { label: "검토 중 (4/5단계)", variant: "warning" },
  CONFIRMED: { label: "확정 완료", variant: "success" },
};

const PAYROLL_CHECKLIST_STATUS_BADGE: Record<string, BadgeVariant> = {
  complete: "success",
  pending: "warning",
  progress: "info",
  not_started: "neutral",
};

const PAYROLL_CHECKLIST_PRIORITY: Record<string, QueuePriority> = {
  low: "low",
  medium: "medium",
  high: "high",
  critical: "critical",
};

const PAYROLL_NEXT_ACTION: Record<string, string> = {
  DRAFT: "데이터 수집 시작",
  DATA_COLLECTION: "변동 확인",
  CHANGE_REVIEW: "계산 실행",
  CALCULATION: "검토 요청",
  REVIEW: "최종 확정",
};

// ─── Component ──────────────────────────────────────────────

export function ClosingTab() {
  const [closingData, setClosingData] = useState<PayrollClosingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchClosing = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/payroll/closing");
      if (res.ok) {
        const json: PayrollClosingData = await res.json();
        setClosingData(json);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClosing();
  }, [fetchClosing]);

  async function handleAdvance() {
    if (!closingData || closingData.status === "CONFIRMED") return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/payroll/closing", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          year: closingData.year,
          month: closingData.month,
          action: "advance",
        }),
      });
      if (res.ok) {
        await fetchClosing();
      }
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-sp-12">
        <span className="text-sm text-text-tertiary">불러오는 중...</span>
      </div>
    );
  }

  if (!closingData) {
    return (
      <div className="flex items-center justify-center py-sp-12">
        <span className="text-sm text-text-tertiary">
          데이터를 불러올 수 없습니다
        </span>
      </div>
    );
  }

  const statusBadge = PAYROLL_STATUS_BADGE[closingData.status] ?? {
    label: closingData.status,
    variant: "neutral" as BadgeVariant,
  };

  const nextActionLabel = PAYROLL_NEXT_ACTION[closingData.status] ?? null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {closingData.year}년 {closingData.month}월 급여 마감
        </CardTitle>
        <div className="flex items-center gap-sp-3">
          <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
          {nextActionLabel && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleAdvance}
              disabled={actionLoading}
            >
              {nextActionLabel}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardBody>
        {/* 5-Step Indicator */}
        <div className="mb-sp-6 grid grid-cols-2 gap-sp-4 sm:grid-cols-3 md:grid-cols-5">
          {PAYROLL_STEPS.map((s) => {
            const isDone = closingData.currentStep > s.step;
            const isActive = closingData.currentStep === s.step;
            return (
              <div
                key={s.step}
                className={[
                  "flex items-start gap-sp-2 rounded-md border px-sp-3 py-sp-2",
                  isDone
                    ? "border-status-success bg-status-success-bg"
                    : isActive
                      ? "border-brand bg-brand-bg"
                      : "border-border bg-surface-secondary",
                ].join(" ")}
              >
                <span
                  className={[
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                    isDone
                      ? "bg-status-success text-white"
                      : isActive
                        ? "bg-brand text-white"
                        : "bg-surface-tertiary text-text-tertiary",
                  ].join(" ")}
                >
                  {isDone ? "\u2713" : s.step}
                </span>
                <div className="min-w-0">
                  <div className={[
                    "text-sm font-semibold",
                    isDone ? "text-status-success-text" : isActive ? "text-brand-text" : "text-text-tertiary",
                  ].join(" ")}>
                    {s.label}
                  </div>
                  <div className="text-xs text-text-tertiary">{s.desc}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Checklist */}
        <QueueList>
          {closingData.checklist.map((item) => (
            <QueueItem
              key={item.id}
              priority={PAYROLL_CHECKLIST_PRIORITY[item.priority] ?? "low"}
              title={item.title}
              meta={item.meta}
              action={
                <Badge variant={PAYROLL_CHECKLIST_STATUS_BADGE[item.status] ?? "neutral"}>
                  {item.statusLabel}
                </Badge>
              }
            />
          ))}
        </QueueList>

        {/* Confirmed info */}
        {closingData.status === "CONFIRMED" && closingData.confirmedAt && (
          <div className="mt-sp-4 rounded-md bg-status-success-bg px-sp-4 py-sp-3 text-sm text-status-success-text">
            확정 완료: {closingData.confirmedAt}
            {closingData.confirmedBy && ` (${closingData.confirmedBy})`}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
