"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Badge,
  Button,
  DataTable,
} from "@/components/ui";
import type { BadgeVariant, Column, SortState, SortDirection } from "@/components/ui";

// ─── Types ──────────────────────────────────────────────────

interface AttendanceRecordRow {
  id: string;
  employeeName: string;
  department: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  workDisplay: string;
  status: string;
  overtime: number;
}

interface PaginationInfo {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

// ─── Constants ──────────────────────────────────────────────

const STATUS_BADGE_MAP: Record<string, { label: string; variant: BadgeVariant }> = {
  PRESENT: { label: "정상", variant: "success" },
  ABSENT: { label: "결근", variant: "danger" },
  LATE: { label: "지각", variant: "warning" },
  EARLY_LEAVE: { label: "조퇴", variant: "warning" },
  HALF_DAY: { label: "반차", variant: "info" },
};

const STATUS_FILTERS = [
  { key: "", label: "전체" },
  { key: "PRESENT", label: "정상" },
  { key: "LATE", label: "지각" },
  { key: "ABSENT", label: "결근" },
  { key: "EARLY_LEAVE", label: "조퇴" },
  { key: "HALF_DAY", label: "반차" },
] as const;

const RECORDS_PAGE_SIZE = 10;

// ─── Component ──────────────────────────────────────────────

export default function RecordsTab() {
  const [records, setRecords] = useState<AttendanceRecordRow[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    pageSize: RECORDS_PAGE_SIZE,
    total: 0,
    totalPages: 0,
  });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sort, setSort] = useState<SortState>({ key: "date", direction: "desc" });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);
    params.set("sortKey", sort.key);
    params.set("sortDir", sort.direction ?? "desc");
    params.set("page", String(page));
    params.set("pageSize", String(RECORDS_PAGE_SIZE));

    try {
      const res = await fetch(`/api/attendance/records?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setRecords(json.data);
        setPagination(json.pagination);
      }
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, sort, page]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  function handleSearch(value: string) {
    setSearch(value);
    setPage(1);
  }

  function handleStatusFilter(status: string) {
    setStatusFilter(status);
    setPage(1);
  }

  function handleSort(key: string) {
    setSort((prev) => {
      if (prev.key === key) {
        const next: SortDirection =
          prev.direction === "asc" ? "desc" : prev.direction === "desc" ? null : "asc";
        return { key, direction: next ?? "asc" };
      }
      return { key, direction: "asc" };
    });
    setPage(1);
  }

  const columns: Column<AttendanceRecordRow>[] = [
    {
      key: "name",
      header: "이름",
      sortable: true,
      width: "160px",
      render: (row) => (
        <div className="flex items-center gap-sp-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-soft text-xs font-semibold text-brand-text">
            {row.employeeName.slice(0, 1)}
          </div>
          <span className="font-medium">{row.employeeName}</span>
        </div>
      ),
    },
    {
      key: "date",
      header: "날짜",
      sortable: true,
      width: "120px",
    },
    {
      key: "checkIn",
      header: "출근",
      sortable: true,
      width: "80px",
      render: (row) => row.checkIn ?? "—",
    },
    {
      key: "checkOut",
      header: "퇴근",
      sortable: true,
      width: "80px",
      render: (row) => row.checkOut ?? "—",
    },
    {
      key: "workMinutes",
      header: "총 시간",
      sortable: true,
      align: "right",
      width: "100px",
      render: (row) => row.workDisplay,
    },
    {
      key: "status",
      header: "상태",
      sortable: true,
      width: "100px",
      render: (row) => {
        if (row.overtime > 0 && row.status === "PRESENT") {
          return <Badge variant="warning">초과근무</Badge>;
        }
        if (row.checkIn && !row.checkOut && row.status === "PRESENT") {
          return <Badge variant="danger">체크아웃 누락</Badge>;
        }
        const info = STATUS_BADGE_MAP[row.status];
        return info ? (
          <Badge variant={info.variant}>{info.label}</Badge>
        ) : (
          row.status
        );
      },
    },
    {
      key: "actions",
      header: "액션",
      align: "center",
      width: "80px",
      render: () => (
        <Button variant="ghost" size="sm" onClick={() => alert("출결 기록 수정 기능 준비 중입니다.")}>
          수정
        </Button>
      ),
    },
  ];

  // Pagination helpers
  function getPageNumbers(): number[] {
    const { totalPages } = pagination;
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const start = Math.max(1, page - 2);
    const end = Math.min(totalPages, start + 4);
    const adjusted = Math.max(1, end - 4);
    return Array.from({ length: end - adjusted + 1 }, (_, i) => adjusted + i);
  }

  const rangeStart = (pagination.page - 1) * pagination.pageSize + 1;
  const rangeEnd = Math.min(
    pagination.page * pagination.pageSize,
    pagination.total,
  );

  return (
    <>
      {/* Filter bar */}
      <div className="mb-sp-4 flex flex-wrap items-center gap-sp-3">
        <input
          type="text"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="이름 검색..."
          className="h-9 w-56 rounded-md border border-border bg-surface-primary px-sp-3 text-sm text-text-primary transition-colors duration-fast placeholder:text-text-tertiary focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-brand/10"
        />
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => handleStatusFilter(f.key)}
            className={[
              "rounded-full border px-sp-3 py-sp-1 text-xs font-medium transition-colors duration-fast",
              statusFilter === f.key
                ? "border-brand bg-brand-soft text-brand-text"
                : "border-border bg-surface-primary text-text-secondary hover:bg-surface-secondary",
            ].join(" ")}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border bg-surface-primary shadow-xs">
        {loading ? (
          <div className="flex items-center justify-center py-sp-12">
            <span className="text-sm text-text-tertiary">불러오는 중...</span>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={records}
            keyExtractor={(row) => row.id}
            sort={sort}
            onSort={handleSort}
            emptyMessage="근태 기록이 없습니다"
          />
        )}

        {/* Pagination */}
        {!loading && pagination.total > 0 && (
          <div className="flex items-center justify-between border-t border-border px-sp-4 py-sp-3">
            <span className="text-xs text-text-tertiary">
              총 {pagination.total.toLocaleString()}건 중 {rangeStart} –{" "}
              {rangeEnd} 표시
            </span>
            <div className="flex items-center gap-sp-1">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="flex h-7 w-7 items-center justify-center rounded-md text-xs text-text-secondary transition-colors hover:bg-surface-secondary disabled:cursor-not-allowed disabled:opacity-40"
              >
                &laquo;
              </button>
              {getPageNumbers().map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPage(p)}
                  className={[
                    "flex h-7 w-7 items-center justify-center rounded-md text-xs font-medium transition-colors",
                    p === page
                      ? "bg-brand text-white"
                      : "text-text-secondary hover:bg-surface-secondary",
                  ].join(" ")}
                >
                  {p}
                </button>
              ))}
              <button
                type="button"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage(page + 1)}
                className="flex h-7 w-7 items-center justify-center rounded-md text-xs text-text-secondary transition-colors hover:bg-surface-secondary disabled:cursor-not-allowed disabled:opacity-40"
              >
                &raquo;
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
