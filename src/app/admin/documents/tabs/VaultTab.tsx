"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardHeader,
  CardBody,
  Badge,
  Button,
  Select,
  DataTable,
} from "@/components/ui";
import type { Column, SortState } from "@/components/ui/DataTable";

// ─── Types ──────────────────────────────────────────────────

interface ArchiveDocument {
  id: string;
  title: string;
  senderName: string;
  recipientName: string;
  recipientId: string;
  templateName: string;
  templateCategory: string;
  templateId: string;
  status: string;
  sentAt: string | null;
  viewedAt: string | null;
  completedAt: string | null;
  deadline: string | null;
  memo: string | null;
  notifyEmail: boolean;
  notifyReminder: boolean;
}

interface PaginationInfo {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

// ─── Constants ──────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  CONTRACT: "계약서",
  NOTICE: "통지서",
  NDA: "비밀유지계약",
  CERTIFICATE: "증명서",
};

const STATUS_BADGE: Record<string, { label: string; variant: "info" | "success" | "danger" | "warning" | "neutral" }> = {
  DRAFT: { label: "임시저장", variant: "neutral" },
  SENT: { label: "발송됨", variant: "info" },
  VIEWED: { label: "열람됨", variant: "info" },
  SIGNED: { label: "서명 완료", variant: "success" },
  EXPIRED: { label: "만료됨", variant: "danger" },
  CANCELLED: { label: "취소됨", variant: "warning" },
};

const STATUS_FILTER_OPTIONS = [
  { value: "", label: "전체 상태" },
  { value: "DRAFT", label: "임시저장" },
  { value: "SENT", label: "발송됨" },
  { value: "VIEWED", label: "열람됨" },
  { value: "SIGNED", label: "서명 완료" },
  { value: "EXPIRED", label: "만료됨" },
  { value: "CANCELLED", label: "취소됨" },
];

// ─── Helpers ────────────────────────────────────────────────

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

// ─── Component ──────────────────────────────────────────────

export function VaultTab() {
  const [documents, setDocuments] = useState<ArchiveDocument[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1, pageSize: 10, total: 0, totalPages: 0,
  });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sort, setSort] = useState<SortState>({ key: "sentAt", direction: "desc" });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [resendingId, setResendingId] = useState<string | null>(null);

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      if (sort.key) params.set("sortKey", sort.key);
      if (sort.direction) params.set("sortDir", sort.direction);
      params.set("page", String(page));
      params.set("pageSize", "10");

      const res = await fetch(`/api/documents/archive?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setDocuments(json.data);
        setPagination(json.pagination);
      }
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, sort, page]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

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

  function handleStatusChange(value: string) {
    setStatusFilter(value);
    setPage(1);
  }

  async function handleResend(doc: ArchiveDocument) {
    setResendingId(doc.id);
    try {
      const res = await fetch("/api/documents/archive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: doc.id }),
      });
      if (res.ok) {
        fetchDocuments();
      }
    } finally {
      setResendingId(null);
    }
  }

  function handleDownload(doc: ArchiveDocument) {
    const content = [
      `문서명: ${doc.title}`,
      `템플릿: ${doc.templateName} (${CATEGORY_LABELS[doc.templateCategory] ?? doc.templateCategory})`,
      `발송자: ${doc.senderName}`,
      `수신자: ${doc.recipientName}`,
      `상태: ${STATUS_BADGE[doc.status]?.label ?? doc.status}`,
      `발송일: ${formatDate(doc.sentAt)}`,
      `마감일: ${formatDate(doc.deadline)}`,
      `열람일: ${formatDate(doc.viewedAt)}`,
      `완료일: ${formatDate(doc.completedAt)}`,
      doc.memo ? `메모: ${doc.memo}` : "",
    ].filter(Boolean).join("\n");

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${doc.title}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const columns: Column<ArchiveDocument>[] = [
    {
      key: "title",
      header: "문서명",
      sortable: true,
      render: (row) => (
        <div>
          <p className="font-medium text-text-primary">{row.title}</p>
          <p className="text-xs text-text-tertiary">
            {CATEGORY_LABELS[row.templateCategory] ?? row.templateCategory}
          </p>
        </div>
      ),
    },
    {
      key: "recipientName",
      header: "수신자",
      sortable: true,
    },
    {
      key: "sentAt",
      header: "발송일",
      sortable: true,
      render: (row) => <span>{formatDate(row.sentAt)}</span>,
    },
    {
      key: "deadline",
      header: "마감일",
      sortable: true,
      render: (row) => <span>{formatDate(row.deadline)}</span>,
    },
    {
      key: "status",
      header: "상태",
      sortable: true,
      align: "center",
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
      key: "actions",
      header: "액션",
      align: "center",
      width: "160px",
      render: (row) => (
        <div className="flex gap-sp-1 justify-center">
          <Button variant="ghost" size="sm" onClick={() => handleDownload(row)}>
            다운로드
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleResend(row)}
            disabled={resendingId === row.id}
          >
            {resendingId === row.id ? "발송 중..." : "재발송"}
          </Button>
        </div>
      ),
    },
  ];

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
    <Card>
      <CardHeader>
        <span className="text-lg font-semibold text-text-primary">문서 보관함</span>
      </CardHeader>
      <CardBody>
        {/* Filters */}
        <div className="mb-sp-4 flex flex-col gap-sp-3 sm:flex-row sm:items-center">
          <div className="flex-1">
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="문서명, 수신자, 발송자 검색..."
              className="w-full px-sp-3 py-sp-2 border rounded-sm text-md font-sans bg-surface-primary text-text-primary transition-colors duration-fast focus:outline-none focus:border-border-focus focus:ring-2 focus:ring-brand/10 border-border"
            />
          </div>
          <Select
            options={STATUS_FILTER_OPTIONS}
            value={statusFilter}
            onChange={(e) => handleStatusChange(e.target.value)}
          />
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
              data={documents}
              keyExtractor={(row) => row.id}
              sort={sort}
              onSort={handleSort}
              emptyMessage="보관된 문서가 없습니다"
            />

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="mt-sp-4 flex items-center justify-between">
                <span className="text-xs text-text-tertiary">
                  전체 {pagination.total}건 중 {(page - 1) * pagination.pageSize + 1}–
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
      </CardBody>
    </Card>
  );
}
