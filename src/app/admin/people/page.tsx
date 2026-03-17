"use client";

import { useState, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui";
import type { BadgeVariant } from "@/components/ui";
import { DataTable } from "@/components/ui";
import type { Column } from "@/components/ui";
import { EmployeeDetailDrawer } from "./EmployeeDetailDrawer";
import { useToast } from "@/components/layout/Toast";

// ─── Types ──────────────────────────────────────────────────

interface EmployeeRow {
  id: string;
  employeeNumber: string;
  name: string;
  email: string;
  phone: string | null;
  status: string;
  type: string;
  hireDate: string;
  department: { id: string; name: string } | null;
  position: { id: string; name: string; level: number } | null;
}

interface PaginationInfo {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

// ─── Constants ──────────────────────────────────────────────

const STATUS_FILTERS = [
  { key: "", label: "전체" },
  { key: "ACTIVE", label: "재직 중" },
  { key: "PENDING_RESIGNATION", label: "퇴사 예정" },
  { key: "ON_LEAVE", label: "휴직" },
  { key: "RESIGNED", label: "퇴사" },
] as const;

const STATUS_BADGE_MAP: Record<string, { label: string; variant: BadgeVariant }> = {
  ACTIVE: { label: "재직 중", variant: "success" },
  ON_LEAVE: { label: "휴직", variant: "neutral" },
  PENDING_RESIGNATION: { label: "퇴사 예정", variant: "warning" },
  RESIGNED: { label: "퇴사", variant: "danger" },
  TERMINATED: { label: "해고", variant: "danger" },
};

const PAGE_SIZE = 10;

// ─── Component ──────────────────────────────────────────────

export default function PeoplePage() {
  const { addToast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    pageSize: PAGE_SIZE,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);
    params.set("page", String(page));
    params.set("pageSize", String(PAGE_SIZE));

    try {
      const res = await fetch(`/api/employees?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setEmployees(json.data);
        setPagination(json.pagination);
      }
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, page]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // Reset to page 1 when filters change
  function handleSearch(value: string) {
    setSearch(value);
    setPage(1);
  }

  function handleStatusFilter(status: string) {
    setStatusFilter(status);
    setPage(1);
  }

  // ─── Table columns ────────────────────────────────────────

  const columns: Column<EmployeeRow>[] = [
    {
      key: "name",
      header: "이름",
      width: "200px",
      render: (row) => (
        <div className="flex items-center gap-sp-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-soft text-xs font-semibold text-brand-text">
            {row.name.slice(0, 1)}
          </div>
          <div>
            <div className="font-medium text-text-primary">{row.name}</div>
            <div className="text-xs text-text-tertiary">
              {row.employeeNumber}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "department",
      header: "부서",
      render: (row) => row.department?.name ?? "—",
    },
    {
      key: "position",
      header: "직위",
      render: (row) => row.position?.name ?? "—",
    },
    {
      key: "status",
      header: "상태",
      render: (row) => {
        const info = STATUS_BADGE_MAP[row.status];
        return info ? (
          <Badge variant={info.variant}>{info.label}</Badge>
        ) : (
          row.status
        );
      },
    },
    {
      key: "hireDate",
      header: "입사일",
      render: (row) => {
        const d = new Date(row.hireDate);
        return d.toLocaleDateString("ko-KR", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        });
      },
    },
  ];

  // ─── Pagination helpers ───────────────────────────────────

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

  // ─── Render ───────────────────────────────────────────────

  return (
    <div>
      {/* Header */}
      <div className="mb-sp-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">직원 관리</h1>
          <p className="mt-sp-1 text-md text-text-secondary">
            전체 직원 목록을 검색하고 관리합니다
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="rounded-md bg-brand px-sp-4 py-sp-2 text-sm font-medium text-white hover:bg-brand-hover transition-colors"
        >
          + 직원 등록
        </button>
      </div>

      {/* 직원 등록 모달 */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-lg rounded-lg bg-surface-primary p-sp-6 shadow-lg">
            <h2 className="text-lg font-semibold text-text-primary mb-sp-4">직원 등록</h2>
            <form onSubmit={async (e) => {
              e.preventDefault();
              setCreateLoading(true);
              try {
                const form = e.target as HTMLFormElement;
                const fd = new FormData(form);
                const res = await fetch("/api/employees", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    name: fd.get("name"),
                    email: fd.get("email"),
                    phone: fd.get("phone") || undefined,
                    employeeNumber: fd.get("employeeNumber"),
                    hireDate: fd.get("hireDate"),
                    type: fd.get("type") || "FULL_TIME",
                  }),
                });
                if (res.ok) {
                  setShowCreateModal(false);
                  fetchEmployees();
                } else {
                  const err = await res.json().catch(() => ({}));
                  addToast({ message: err.error || "등록에 실패했습니다.", variant: "danger" });
                }
              } finally {
                setCreateLoading(false);
              }
            }} className="space-y-sp-3">
              <div className="grid grid-cols-2 gap-sp-3">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-sp-1">이름 *</label>
                  <input name="name" required className="w-full rounded-md border border-border px-sp-3 py-sp-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-sp-1">사번 *</label>
                  <input name="employeeNumber" required className="w-full rounded-md border border-border px-sp-3 py-sp-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-sp-1">이메일 *</label>
                  <input name="email" type="email" required className="w-full rounded-md border border-border px-sp-3 py-sp-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-sp-1">전화번호</label>
                  <input name="phone" className="w-full rounded-md border border-border px-sp-3 py-sp-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-sp-1">입사일 *</label>
                  <input name="hireDate" type="date" required className="w-full rounded-md border border-border px-sp-3 py-sp-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-sp-1">고용형태</label>
                  <select name="type" className="w-full rounded-md border border-border px-sp-3 py-sp-2 text-sm">
                    <option value="FULL_TIME">정규직</option>
                    <option value="PART_TIME">파트타임</option>
                    <option value="CONTRACT">계약직</option>
                    <option value="INTERN">인턴</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-sp-2 pt-sp-3">
                <button type="button" onClick={() => setShowCreateModal(false)} disabled={createLoading} className="rounded-md border border-border px-sp-4 py-sp-2 text-sm text-text-secondary hover:bg-surface-secondary disabled:opacity-50 disabled:cursor-not-allowed">취소</button>
                <button type="submit" disabled={createLoading} className="rounded-md bg-brand px-sp-4 py-sp-2 text-sm font-medium text-white hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed">{createLoading ? "등록 중..." : "등록"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Filter bar */}
      <div className="mb-sp-6 flex flex-wrap items-center gap-sp-3">
        <input
          type="text"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="이름, 부서, 직위 검색..."
          className="h-9 w-64 rounded-md border border-border bg-surface-primary px-sp-3 text-sm text-text-primary transition-colors duration-fast placeholder:text-text-tertiary focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-brand/10"
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
            data={employees}
            keyExtractor={(row) => row.id}
            onRowClick={(row) => setSelectedEmployeeId(row.id)}
            activeRowKey={selectedEmployeeId ?? undefined}
          />
        )}

        {/* Pagination */}
        {!loading && pagination.total > 0 && (
          <div className="flex items-center justify-between border-t border-border px-sp-4 py-sp-3">
            <span className="text-xs text-text-tertiary">
              {pagination.total.toLocaleString()}명 중 {rangeStart} –{" "}
              {rangeEnd} 표시
            </span>
            <div className="flex items-center gap-sp-1">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="flex h-10 w-10 items-center justify-center rounded-md text-xs text-text-secondary transition-colors hover:bg-surface-secondary disabled:cursor-not-allowed disabled:opacity-40"
              >
                &laquo;
              </button>
              {getPageNumbers().map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPage(p)}
                  className={[
                    "flex h-10 w-10 items-center justify-center rounded-md text-xs font-medium transition-colors",
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
                className="flex h-10 w-10 items-center justify-center rounded-md text-xs text-text-secondary transition-colors hover:bg-surface-secondary disabled:cursor-not-allowed disabled:opacity-40"
              >
                &raquo;
              </button>
            </div>
          </div>
        )}
      </div>
      <EmployeeDetailDrawer
        employeeId={selectedEmployeeId}
        onClose={() => setSelectedEmployeeId(null)}
      />
    </div>
  );
}
