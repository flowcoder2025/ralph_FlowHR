"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import {
  Badge,
  Button,
  DataTable,
  Select,
} from "@/components/ui";
import type { Column, SortState } from "@/components/ui/DataTable";
import type { BadgeVariant } from "@/components/ui/Badge";

// ─── Types ──────────────────────────────────────────────────

interface TicketRow {
  id: string;
  ticketNumber: string;
  title: string;
  description: string | null;
  tenantName: string;
  tenantSlug: string;
  requesterName: string;
  requesterEmail: string;
  priority: string;
  status: string;
  category: string;
  slaDeadlineAt: string | null;
  resolvedAt: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface StatusCounts {
  total: number;
  byStatus: Record<string, number>;
}

interface PaginationInfo {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

// ─── Constants ──────────────────────────────────────────────

const STATUS_BADGE: Record<string, { label: string; variant: BadgeVariant }> = {
  OPEN: { label: "열림", variant: "info" },
  IN_PROGRESS: { label: "처리중", variant: "warning" },
  WAITING: { label: "대기", variant: "neutral" },
  RESOLVED: { label: "해결", variant: "success" },
  CLOSED: { label: "종료", variant: "neutral" },
};

const PRIORITY_BADGE: Record<string, { label: string; variant: BadgeVariant }> = {
  CRITICAL: { label: "긴급", variant: "danger" },
  HIGH: { label: "높음", variant: "warning" },
  MEDIUM: { label: "보통", variant: "neutral" },
  LOW: { label: "낮음", variant: "neutral" },
};

const CATEGORY_LABEL: Record<string, string> = {
  BUG: "버그",
  FEATURE_REQUEST: "기능 요청",
  QUESTION: "질문",
  MIGRATION: "마이그레이션",
  SECURITY: "보안",
  BILLING: "결제",
};

const STATUS_FILTER_OPTIONS = [
  { value: "", label: "전체 상태" },
  { value: "OPEN", label: "열림" },
  { value: "IN_PROGRESS", label: "처리중" },
  { value: "WAITING", label: "대기" },
  { value: "RESOLVED", label: "해결" },
  { value: "CLOSED", label: "종료" },
];

const CATEGORY_FILTER_OPTIONS = [
  { value: "", label: "전체 분류" },
  { value: "BUG", label: "버그" },
  { value: "FEATURE_REQUEST", label: "기능 요청" },
  { value: "QUESTION", label: "질문" },
  { value: "MIGRATION", label: "마이그레이션" },
  { value: "SECURITY", label: "보안" },
  { value: "BILLING", label: "결제" },
];

// ─── Helpers ────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "방금";
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}일 전`;
  return formatDate(iso);
}

// ─── Component ──────────────────────────────────────────────

export default function SupportPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-sp-12">
          <span className="text-sm text-text-tertiary">불러오는 중...</span>
        </div>
      }
    >
      <SupportContent />
    </Suspense>
  );
}

function SupportContent() {
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [counts, setCounts] = useState<StatusCounts>({ total: 0, byStatus: {} });
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1, pageSize: 20, total: 0, totalPages: 0,
  });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [sort, setSort] = useState<SortState>({ key: "createdAt", direction: "desc" });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      if (categoryFilter) params.set("category", categoryFilter);
      if (sort.key) params.set("sortKey", sort.key);
      if (sort.direction) params.set("sortDir", sort.direction);
      params.set("page", String(page));
      params.set("pageSize", "20");

      const res = await fetch(`/api/platform/support?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setTickets(json.data);
        setCounts(json.counts);
        setPagination(json.pagination);
      }
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, categoryFilter, sort, page]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  function handleSort(key: string) {
    setSort((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
    setPage(1);
  }

  function handleSearch(value: string) {
    setSearch(value);
    setPage(1);
  }

  // ─── Filter Chips ─────────────────────────────────────────

  const filterChips: { label: string; value: string; count: number }[] = [
    { label: "전체", value: "", count: counts.total },
    { label: "열림", value: "OPEN", count: counts.byStatus["OPEN"] ?? 0 },
    { label: "처리중", value: "IN_PROGRESS", count: counts.byStatus["IN_PROGRESS"] ?? 0 },
    { label: "대기", value: "WAITING", count: counts.byStatus["WAITING"] ?? 0 },
    { label: "해결", value: "RESOLVED", count: counts.byStatus["RESOLVED"] ?? 0 },
  ];

  function handleChipClick(chip: { value: string }) {
    setStatusFilter(chip.value);
    setPage(1);
  }

  // ─── Table Columns ────────────────────────────────────────

  const columns: Column<TicketRow>[] = [
    {
      key: "ticketNumber",
      header: "번호",
      sortable: true,
      render: (row) => (
        <span className="font-mono text-sm text-text-secondary">
          {row.ticketNumber}
        </span>
      ),
    },
    {
      key: "title",
      header: "제목",
      sortable: true,
      render: (row) => (
        <div>
          <p className="font-semibold text-text-primary">{row.title}</p>
          <p className="text-xs text-text-tertiary">
            {row.tenantName} &middot; {row.requesterName}
          </p>
        </div>
      ),
    },
    {
      key: "category",
      header: "분류",
      render: (row) => (
        <span className="text-sm text-text-secondary">
          {CATEGORY_LABEL[row.category] ?? row.category}
        </span>
      ),
    },
    {
      key: "priority",
      header: "우선순위",
      render: (row) => {
        const badge = PRIORITY_BADGE[row.priority];
        return badge ? (
          <Badge variant={badge.variant}>{badge.label}</Badge>
        ) : (
          <span>{row.priority}</span>
        );
      },
    },
    {
      key: "status",
      header: "상태",
      sortable: true,
      render: (row) => {
        const badge = STATUS_BADGE[row.status];
        return badge ? (
          <Badge variant={badge.variant}>{badge.label}</Badge>
        ) : (
          <span>{row.status}</span>
        );
      },
    },
    {
      key: "createdAt",
      header: "생성일",
      sortable: true,
      render: (row) => (
        <span className="text-text-tertiary">{timeAgo(row.createdAt)}</span>
      ),
    },
  ];

  // ─── Pagination ───────────────────────────────────────────

  function getPageNumbers(): number[] {
    const { totalPages } = pagination;
    const current = page;
    const pages: number[] = [];
    const start = Math.max(1, current - 2);
    const end = Math.min(totalPages, current + 2);
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-sp-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">지원 티켓</h1>
          <p className="mt-sp-1 text-md text-text-secondary">
            고객 지원 요청 관리
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="mb-sp-4 flex flex-col gap-sp-3 lg:flex-row lg:items-center">
        <input
          type="text"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="제목, 티켓번호, 요청자 검색..."
          className="w-full max-w-xs px-sp-3 py-sp-2 border rounded-sm text-md font-sans bg-surface-primary text-text-primary transition-colors duration-fast focus:outline-none focus:border-border-focus focus:ring-2 focus:ring-brand/10 border-border"
        />
        <div className="flex flex-wrap gap-sp-1">
          {filterChips.map((chip) => (
            <button
              key={chip.value}
              type="button"
              onClick={() => handleChipClick(chip)}
              className={[
                "rounded-full px-sp-3 py-sp-1 text-xs font-medium transition-colors duration-fast",
                statusFilter === chip.value
                  ? "bg-brand text-white"
                  : "bg-surface-secondary text-text-secondary hover:bg-surface-tertiary",
              ].join(" ")}
            >
              {chip.label} ({chip.count})
            </button>
          ))}
        </div>
        <div className="ml-auto flex gap-sp-2">
          <Select
            options={STATUS_FILTER_OPTIONS}
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          />
          <Select
            options={CATEGORY_FILTER_OPTIONS}
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-sp-12">
          <span className="text-sm text-text-tertiary">불러오는 중...</span>
        </div>
      ) : (
        <>
          <DataTable
            columns={columns}
            data={tickets}
            keyExtractor={(row) => row.id}
            sort={sort}
            onSort={handleSort}
            emptyMessage="조건에 맞는 티켓이 없습니다"
          />

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="mt-sp-4 flex items-center justify-between">
              <span className="text-xs text-text-tertiary">
                전체 {pagination.total}건 중{" "}
                {(page - 1) * pagination.pageSize + 1}–
                {Math.min(page * pagination.pageSize, pagination.total)}건
              </span>
              <div className="flex gap-sp-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  이전
                </Button>
                {getPageNumbers().map((p) => (
                  <Button
                    key={p}
                    variant={p === page ? "primary" : "ghost"}
                    size="sm"
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </Button>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={page >= pagination.totalPages}
                >
                  다음
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
