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

interface ExceptionItem {
  id: string;
  employeeName: string;
  department: string;
  type: string;
  status: string;
  date: string;
  reason: string;
  approvedBy: string | null;
  approvedAt: string | null;
  createdAt: string;
}

interface ExceptionGroup {
  type: string;
  total: number;
  pending: number;
  items: ExceptionItem[];
}

// ─── Constants ──────────────────────────────────────────────

const EXCEPTION_TYPE_META: Record<
  string,
  { label: string; badgeVariant: BadgeVariant; defaultPriority: QueuePriority }
> = {
  CORRECTION: { label: "근태 정정", badgeVariant: "danger", defaultPriority: "critical" },
  OVERTIME: { label: "초과근무", badgeVariant: "warning", defaultPriority: "high" },
  BUSINESS_TRIP: { label: "출장", badgeVariant: "info", defaultPriority: "medium" },
  REMOTE_WORK: { label: "재택근무", badgeVariant: "info", defaultPriority: "low" },
};

const EXCEPTION_STATUS_BADGE: Record<string, { label: string; variant: BadgeVariant }> = {
  PENDING: { label: "대기", variant: "warning" },
  APPROVED: { label: "승인", variant: "success" },
  REJECTED: { label: "반려", variant: "danger" },
};

// ─── Sub-component ──────────────────────────────────────────

function DetailRow({
  label,
  value,
  children,
}: {
  label: string;
  value?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between border-b border-border-subtle py-sp-2 last:border-b-0">
      <span className="text-sm text-text-secondary">{label}</span>
      {children ?? (
        <span className="text-sm font-medium text-text-primary">{value}</span>
      )}
    </div>
  );
}

function ExceptionDetailPanel({
  item,
  onClose,
  onAction,
  actionLoading,
}: {
  item: ExceptionItem;
  onClose: () => void;
  onAction: (_id: string, _action: "approve" | "reject") => void;
  actionLoading: boolean;
}) {
  const typeMeta = EXCEPTION_TYPE_META[item.type];
  const statusInfo = EXCEPTION_STATUS_BADGE[item.status];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="mx-sp-4 w-full max-w-lg rounded-xl border border-border bg-surface-primary p-sp-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-sp-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-text-primary">예외 상세</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-text-tertiary transition-colors hover:text-text-primary"
          >
            &times;
          </button>
        </div>

        {/* Content */}
        <div className="space-y-sp-3">
          <DetailRow label="유형">
            <Badge variant={typeMeta?.badgeVariant ?? "neutral"}>
              {typeMeta?.label ?? item.type}
            </Badge>
          </DetailRow>
          <DetailRow label="상태">
            {statusInfo && (
              <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
            )}
          </DetailRow>
          <DetailRow label="직원" value={item.employeeName} />
          <DetailRow label="부서" value={item.department} />
          <DetailRow label="날짜" value={item.date} />
          <DetailRow label="사유" value={item.reason} />
          <DetailRow label="신청일" value={item.createdAt} />
          {item.approvedBy && (
            <DetailRow label="처리자" value={item.approvedBy} />
          )}
          {item.approvedAt && (
            <DetailRow label="처리일" value={item.approvedAt} />
          )}
        </div>

        {/* Actions */}
        {item.status === "PENDING" && (
          <div className="mt-sp-6 flex justify-end gap-sp-3">
            <Button
              variant="danger"
              size="sm"
              onClick={() => onAction(item.id, "reject")}
              disabled={actionLoading}
            >
              반려
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => onAction(item.id, "approve")}
              disabled={actionLoading}
            >
              승인
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Component ──────────────────────────────────────────────

export default function ExceptionsTab() {
  const [groups, setGroups] = useState<ExceptionGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<ExceptionItem | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchExceptions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/attendance/exceptions");
      if (res.ok) {
        const json = await res.json();
        setGroups(json.groups);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExceptions();
  }, [fetchExceptions]);

  async function handleAction(id: string, action: "approve" | "reject") {
    setActionLoading(true);
    try {
      const res = await fetch("/api/attendance/exceptions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      if (res.ok) {
        setSelectedItem(null);
        await fetchExceptions();
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

  return (
    <>
      {/* 4-type cards grid */}
      <div className="grid grid-cols-1 gap-sp-6 lg:grid-cols-2">
        {groups.map((group) => {
          const meta = EXCEPTION_TYPE_META[group.type] ?? {
            label: group.type,
            badgeVariant: "neutral" as BadgeVariant,
            defaultPriority: "medium" as QueuePriority,
          };
          return (
            <Card key={group.type}>
              <CardHeader>
                <CardTitle>{meta.label}</CardTitle>
                <Badge variant={meta.badgeVariant}>
                  {group.total}건{group.pending > 0 ? ` (대기 ${group.pending})` : ""}
                </Badge>
              </CardHeader>
              <CardBody>
                {group.items.length === 0 ? (
                  <div className="flex items-center justify-center py-sp-6">
                    <span className="text-sm text-text-tertiary">
                      해당 유형의 예외가 없습니다
                    </span>
                  </div>
                ) : (
                  <QueueList>
                    {group.items.map((item) => {
                      const priority: QueuePriority =
                        item.status === "PENDING" ? meta.defaultPriority : "low";
                      const statusInfo = EXCEPTION_STATUS_BADGE[item.status];
                      return (
                        <QueueItem
                          key={item.id}
                          priority={priority}
                          title={item.employeeName}
                          meta={`${item.department} · ${item.date} · ${item.reason}`}
                          action={
                            <div className="flex items-center gap-sp-2">
                              {statusInfo && (
                                <Badge variant={statusInfo.variant}>
                                  {statusInfo.label}
                                </Badge>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedItem(item)}
                              >
                                상세
                              </Button>
                            </div>
                          }
                        />
                      );
                    })}
                  </QueueList>
                )}
              </CardBody>
            </Card>
          );
        })}
      </div>

      {/* Detail overlay */}
      {selectedItem && (
        <ExceptionDetailPanel
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onAction={handleAction}
          actionLoading={actionLoading}
        />
      )}
    </>
  );
}
