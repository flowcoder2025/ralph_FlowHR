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
  Textarea,
} from "@/components/ui";
import { Drawer } from "@/components/layout/Drawer";

// ─── Types ──────────────────────────────────────────────────

interface LeaveRequestItem {
  id: string;
  employeeName: string;
  employeeNumber: string;
  department: string;
  leaveType: string;
  leaveTypeName: string;
  status: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  approvedBy: string | null;
  approvedAt: string | null;
  rejectedBy: string | null;
  rejectedAt: string | null;
  rejectReason: string | null;
  createdAt: string;
}

interface RequestsSummary {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

// ─── Constants ──────────────────────────────────────────────

const LEAVE_TYPE_LABELS: Record<string, string> = {
  ANNUAL: "연차 휴가",
  HALF_DAY: "반차",
  SICK: "병가",
  FAMILY_EVENT: "경조사 휴가",
  COMPENSATORY: "대체 휴가",
};

const REQUEST_STATUS_FILTERS = [
  { key: "ALL", label: "전체" },
  { key: "PENDING", label: "승인 대기" },
  { key: "APPROVED", label: "승인 완료" },
  { key: "REJECTED", label: "반려" },
] as const;

const REQUEST_STATUS_BADGE: Record<string, { label: string; variant: "warning" | "success" | "danger" | "neutral" }> = {
  PENDING: { label: "승인 대기", variant: "warning" },
  APPROVED: { label: "승인 완료", variant: "success" },
  REJECTED: { label: "반려", variant: "danger" },
  CANCELLED: { label: "취소", variant: "neutral" },
};

const LEAVE_PRIORITY_MAP: Record<string, "high" | "medium" | "low"> = {
  ANNUAL: "high",
  FAMILY_EVENT: "high",
  HALF_DAY: "medium",
  SICK: "medium",
  COMPENSATORY: "low",
};

// ─── Helpers ────────────────────────────────────────────────

function formatDateRange(start: string, end: string, days: number): string {
  const s = start.replace(/-/g, "/").slice(5);
  const e = end.replace(/-/g, "/").slice(5);
  const dayStr = days === 0.5 ? "0.5일" : `${days}일`;
  return start === end ? `${s} (${dayStr})` : `${s} ~ ${e} (${dayStr})`;
}

function daysAgo(dateStr: string): string {
  const diff = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24),
  );
  if (diff === 0) return "오늘";
  if (diff === 1) return "어제";
  return `${diff}일 전`;
}

// ─── Sub-component ──────────────────────────────────────────

function RequestDetailRow({
  label,
  value,
  children,
}: {
  label: string;
  value?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-sp-4">
      <span className="w-24 shrink-0 text-sm font-medium text-text-secondary">
        {label}
      </span>
      <span className="text-sm text-text-primary">
        {children ?? value ?? "-"}
      </span>
    </div>
  );
}

// ─── Component ──────────────────────────────────────────────

export default function RequestsTab() {
  const [items, setItems] = useState<LeaveRequestItem[]>([]);
  const [summary, setSummary] = useState<RequestsSummary>({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [selectedItem, setSelectedItem] = useState<LeaveRequestItem | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (search) params.set("search", search);
      const res = await fetch(`/api/leave/requests?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setItems(json.data);
        setSummary(json.summary);
      }
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  async function handleAction(id: string, action: "approve" | "reject") {
    setActionLoading(true);
    try {
      const body: Record<string, string> = { id, action };
      if (action === "reject" && rejectReason.trim()) {
        body.rejectReason = rejectReason.trim();
      }
      const res = await fetch("/api/leave/requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setSelectedItem(null);
        setRejectReason("");
        await fetchRequests();
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
      {/* Filter bar */}
      <div className="mb-sp-4 flex flex-wrap items-center gap-sp-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="이름 검색..."
          className="h-9 w-56 rounded-md border border-border bg-surface-primary px-sp-3 text-sm text-text-primary transition-colors duration-fast placeholder:text-text-tertiary focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-brand/10"
        />
        {REQUEST_STATUS_FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setStatusFilter(f.key)}
            className={[
              "rounded-full px-sp-3 py-sp-1 text-sm font-medium transition-colors duration-fast",
              statusFilter === f.key
                ? "bg-brand text-text-inverse"
                : "bg-surface-secondary text-text-secondary hover:bg-surface-tertiary",
            ].join(" ")}
          >
            {f.label}
            {f.key === "PENDING" && summary.pending > 0 && (
              <span className="ml-sp-1">({summary.pending})</span>
            )}
          </button>
        ))}
      </div>

      {/* Queue list */}
      <Card>
        <CardHeader>
          <CardTitle>휴가 신청 큐</CardTitle>
          <Badge variant="info">
            {summary.total}건{summary.pending > 0 ? ` (대기 ${summary.pending})` : ""}
          </Badge>
        </CardHeader>
        <CardBody>
          {items.length === 0 ? (
            <div className="flex items-center justify-center py-sp-8">
              <span className="text-sm text-text-tertiary">
                {statusFilter === "ALL"
                  ? "휴가 신청 내역이 없습니다"
                  : "해당 상태의 신청 내역이 없습니다"}
              </span>
            </div>
          ) : (
            <QueueList>
              {items.map((item) => {
                const priority = item.status === "PENDING"
                  ? (LEAVE_PRIORITY_MAP[item.leaveType] ?? "medium")
                  : "low";
                const statusInfo = REQUEST_STATUS_BADGE[item.status];
                return (
                  <QueueItem
                    key={item.id}
                    priority={priority}
                    title={`${item.employeeName} — ${LEAVE_TYPE_LABELS[item.leaveType] ?? item.leaveTypeName} (${formatDateRange(item.startDate, item.endDate, item.days)})`}
                    meta={`${item.department} · ${item.reason || "-"} · ${daysAgo(item.createdAt)}`}
                    action={
                      <div className="flex items-center gap-sp-2">
                        {statusInfo && (
                          <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                        )}
                        {item.status === "PENDING" ? (
                          <>
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleAction(item.id, "approve")}
                              disabled={actionLoading}
                            >
                              승인
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedItem(item);
                                setRejectReason("");
                              }}
                            >
                              반려
                            </Button>
                          </>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedItem(item)}
                          >
                            상세
                          </Button>
                        )}
                      </div>
                    }
                  />
                );
              })}
            </QueueList>
          )}
        </CardBody>
      </Card>

      {/* Detail Drawer */}
      <Drawer
        open={!!selectedItem}
        onClose={() => {
          setSelectedItem(null);
          setRejectReason("");
        }}
        title="휴가 신청 상세"
        size="md"
        footer={
          selectedItem?.status === "PENDING" ? (
            <div className="flex justify-end gap-sp-3">
              <Button
                variant="danger"
                size="sm"
                onClick={() => selectedItem && handleAction(selectedItem.id, "reject")}
                disabled={actionLoading}
              >
                반려
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => selectedItem && handleAction(selectedItem.id, "approve")}
                disabled={actionLoading}
              >
                승인
              </Button>
            </div>
          ) : undefined
        }
      >
        {selectedItem && (
          <div className="space-y-sp-4">
            <RequestDetailRow label="상태">
              {REQUEST_STATUS_BADGE[selectedItem.status] && (
                <Badge variant={REQUEST_STATUS_BADGE[selectedItem.status].variant}>
                  {REQUEST_STATUS_BADGE[selectedItem.status].label}
                </Badge>
              )}
            </RequestDetailRow>
            <RequestDetailRow label="신청자" value={selectedItem.employeeName} />
            <RequestDetailRow label="사번" value={selectedItem.employeeNumber} />
            <RequestDetailRow label="부서" value={selectedItem.department} />
            <RequestDetailRow label="휴가 유형">
              <Badge variant="info">
                {LEAVE_TYPE_LABELS[selectedItem.leaveType] ?? selectedItem.leaveTypeName}
              </Badge>
            </RequestDetailRow>
            <RequestDetailRow
              label="기간"
              value={formatDateRange(selectedItem.startDate, selectedItem.endDate, selectedItem.days)}
            />
            <RequestDetailRow label="일수" value={`${selectedItem.days}일`} />
            <RequestDetailRow label="사유" value={selectedItem.reason || "-"} />
            <RequestDetailRow label="신청일" value={selectedItem.createdAt.slice(0, 10)} />

            {selectedItem.status === "APPROVED" && selectedItem.approvedAt && (
              <RequestDetailRow label="승인일" value={selectedItem.approvedAt.slice(0, 10)} />
            )}

            {selectedItem.status === "REJECTED" && (
              <>
                {selectedItem.rejectedAt && (
                  <RequestDetailRow label="반려일" value={selectedItem.rejectedAt.slice(0, 10)} />
                )}
                {selectedItem.rejectReason && (
                  <RequestDetailRow label="반려 사유" value={selectedItem.rejectReason} />
                )}
              </>
            )}

            {selectedItem.status === "PENDING" && (
              <div className="mt-sp-4">
                <Textarea
                  label="반려 사유 (선택)"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="반려 시 사유를 입력하세요"
                  rows={3}
                />
              </div>
            )}
          </div>
        )}
      </Drawer>
    </>
  );
}
