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

interface AuditLogRow {
  id: string;
  tenantName: string | null;
  operatorName: string;
  operatorRole: string | null;
  action: string;
  target: string;
  ipAddress: string | null;
  result: string;
  details: unknown;
  createdAt: string;
}

interface AuditCounts {
  total: number;
  byAction: Record<string, number>;
}

interface PaginationInfo {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

// ─── Constants ──────────────────────────────────────────────

const ACTION_LABEL: Record<string, string> = {
  LOGIN: "로그인",
  LOGOUT: "로그아웃",
  TENANT_CREATE: "테넌트 생성",
  TENANT_UPDATE: "테넌트 수정",
  TENANT_SUSPEND: "테넌트 중지",
  PLAN_CHANGE: "플랜 변경",
  SETTING_CHANGE: "설정 변경",
  SECURITY_EVENT: "보안 이벤트",
  SUPPORT_ACTION: "지원 조치",
};

const RESULT_BADGE: Record<string, { label: string; variant: BadgeVariant }> = {
  SUCCESS: { label: "성공", variant: "success" },
  FAILURE: { label: "실패", variant: "danger" },
};

const ACTION_FILTER_OPTIONS = [
  { value: "", label: "전체 액션" },
  { value: "LOGIN", label: "로그인" },
  { value: "LOGOUT", label: "로그아웃" },
  { value: "TENANT_CREATE", label: "테넌트 생성" },
  { value: "TENANT_UPDATE", label: "테넌트 수정" },
  { value: "TENANT_SUSPEND", label: "테넌트 중지" },
  { value: "PLAN_CHANGE", label: "플랜 변경" },
  { value: "SETTING_CHANGE", label: "설정 변경" },
  { value: "SECURITY_EVENT", label: "보안 이벤트" },
  { value: "SUPPORT_ACTION", label: "지원 조치" },
];

const RESULT_FILTER_OPTIONS = [
  { value: "", label: "전체 결과" },
  { value: "SUCCESS", label: "성공" },
  { value: "FAILURE", label: "실패" },
];

// ─── Helpers ────────────────────────────────────────────────

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Component ──────────────────────────────────────────────

export default function AuditPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-sp-12">
          <span className="text-sm text-text-tertiary">불러오는 중...</span>
        </div>
      }
    >
      <AuditContent />
    </Suspense>
  );
}

function AuditContent() {
  const [logs, setLogs] = useState<AuditLogRow[]>([]);
  const [counts, setCounts] = useState<AuditCounts>({ total: 0, byAction: {} });
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1, pageSize: 20, total: 0, totalPages: 0,
  });
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [resultFilter, setResultFilter] = useState("");
  const [sort, setSort] = useState<SortState>({ key: "createdAt", direction: "desc" });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (actionFilter) params.set("action", actionFilter);
      if (resultFilter) params.set("result", resultFilter);
      if (sort.key) params.set("sortKey", sort.key);
      if (sort.direction) params.set("sortDir", sort.direction);
      params.set("page", String(page));
      params.set("pageSize", "20");

      const res = await fetch(`/api/platform/audit?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setLogs(json.data);
        setCounts(json.counts);
        setPagination(json.pagination);
      }
    } finally {
      setLoading(false);
    }
  }, [search, actionFilter, resultFilter, sort, page]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

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

  // ─── Table Columns ────────────────────────────────────────

  const columns: Column<AuditLogRow>[] = [
    {
      key: "createdAt",
      header: "일시",
      sortable: true,
      render: (row) => (
        <span className="text-sm text-text-secondary">
          {formatDateTime(row.createdAt)}
        </span>
      ),
    },
    {
      key: "operatorName",
      header: "운영자",
      sortable: true,
      render: (row) => (
        <div>
          <p className="font-semibold text-text-primary">{row.operatorName}</p>
          {row.operatorRole && (
            <p className="text-xs text-text-tertiary">{row.operatorRole}</p>
          )}
        </div>
      ),
    },
    {
      key: "action",
      header: "액션",
      sortable: true,
      render: (row) => (
        <span className="text-sm text-text-primary">
          {ACTION_LABEL[row.action] ?? row.action}
        </span>
      ),
    },
    {
      key: "target",
      header: "대상",
      sortable: true,
      render: (row) => (
        <div>
          <p className="text-sm text-text-primary">{row.target}</p>
          {row.tenantName && (
            <p className="text-xs text-text-tertiary">{row.tenantName}</p>
          )}
        </div>
      ),
    },
    {
      key: "ipAddress",
      header: "IP",
      render: (row) => (
        <span className="font-mono text-xs text-text-tertiary">
          {row.ipAddress ?? "-"}
        </span>
      ),
    },
    {
      key: "result",
      header: "결과",
      sortable: true,
      render: (row) => {
        const badge = RESULT_BADGE[row.result];
        return badge ? (
          <Badge variant={badge.variant}>{badge.label}</Badge>
        ) : (
          <span>{row.result}</span>
        );
      },
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
          <h1 className="text-2xl font-bold text-text-primary md:text-3xl">감사 로그</h1>
          <p className="mt-sp-1 text-md text-text-secondary">
            플랫폼 운영 감사 로그 (총 {counts.total}건)
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="mb-sp-4 flex flex-col gap-sp-3 lg:flex-row lg:items-center">
        <input
          type="text"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="운영자명, 대상으로 검색..."
          className="w-full max-w-xs px-sp-3 py-sp-2 border rounded-sm text-md font-sans bg-surface-primary text-text-primary transition-colors duration-fast focus:outline-none focus:border-border-focus focus:ring-2 focus:ring-brand/10 border-border"
        />
        <div className="ml-auto flex gap-sp-2">
          <Select
            options={ACTION_FILTER_OPTIONS}
            value={actionFilter}
            onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
          />
          <Select
            options={RESULT_FILTER_OPTIONS}
            value={resultFilter}
            onChange={(e) => { setResultFilter(e.target.value); setPage(1); }}
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
            data={logs}
            keyExtractor={(row) => row.id}
            sort={sort}
            onSort={handleSort}
            emptyMessage="감사 로그가 없습니다"
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
