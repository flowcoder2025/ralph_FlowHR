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

interface ClosingChecklistItem {
  id: string;
  title: string;
  meta: string;
  status: "complete" | "pending" | "progress" | "not_started";
  statusLabel: string;
  priority: "low" | "medium" | "high" | "critical";
}

interface ClosingData {
  year: number;
  month: number;
  status: "OPEN" | "IN_REVIEW" | "CLOSED";
  closedBy: string | null;
  closedAt: string | null;
  totalDays: number;
  totalHours: number;
  checklist: ClosingChecklistItem[];
}

// ─── Constants ──────────────────────────────────────────────

const CLOSING_STATUS_BADGE: Record<string, { label: string; variant: BadgeVariant }> = {
  OPEN: { label: "진행 중", variant: "info" },
  IN_REVIEW: { label: "검토 중", variant: "warning" },
  CLOSED: { label: "마감 완료", variant: "success" },
};

const CHECKLIST_STATUS_BADGE: Record<string, BadgeVariant> = {
  complete: "success",
  pending: "warning",
  progress: "info",
  not_started: "neutral",
};

const CHECKLIST_PRIORITY: Record<string, QueuePriority> = {
  low: "low",
  medium: "medium",
  high: "high",
  critical: "critical",
};

// ─── Component ──────────────────────────────────────────────

export default function ClosingTab() {
  const [closingData, setClosingData] = useState<ClosingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchClosing = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/attendance/closing");
      if (res.ok) {
        const json: ClosingData = await res.json();
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
    if (!closingData || closingData.status === "CLOSED") return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/attendance/closing", {
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

  const statusBadge = CLOSING_STATUS_BADGE[closingData.status] ?? {
    label: closingData.status,
    variant: "neutral" as BadgeVariant,
  };

  const nextActionLabel =
    closingData.status === "OPEN"
      ? "검토 시작"
      : closingData.status === "IN_REVIEW"
        ? "최종 마감"
        : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {closingData.year}년 {closingData.month}월 근태 마감
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
        <QueueList>
          {closingData.checklist.map((item) => (
            <QueueItem
              key={item.id}
              priority={CHECKLIST_PRIORITY[item.priority] ?? "low"}
              title={item.title}
              meta={item.meta}
              action={
                <Badge variant={CHECKLIST_STATUS_BADGE[item.status] ?? "neutral"}>
                  {item.statusLabel}
                </Badge>
              }
            />
          ))}
        </QueueList>
      </CardBody>
    </Card>
  );
}
