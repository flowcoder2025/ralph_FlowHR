"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardBody,
  Badge,
  Button,
  DataTable,
  Select,
} from "@/components/ui";
import type { BadgeVariant, Column } from "@/components/ui";
import { useToast } from "@/components/layout/Toast";
import { exportToCSV } from "@/lib/export";

// ─── Types ──────────────────────────────────────────────────

interface PayslipRow {
  id: string;
  employeeName: string;
  department: string;
  baseSalary: number;
  allowances: number;
  deductions: number;
  netAmount: number;
  status: string;
  sentAt: string | null;
}

// ─── Constants ──────────────────────────────────────────────

const PAYSLIP_STATUS_BADGE: Record<string, { label: string; variant: BadgeVariant }> = {
  DRAFT: { label: "미확정", variant: "neutral" },
  CONFIRMED: { label: "확정", variant: "info" },
  SENT: { label: "발송 완료", variant: "success" },
  REISSUE_REQUESTED: { label: "재발행 요청", variant: "warning" },
};

// ─── Helpers ──────────────────────────────────────────────

function formatKRW(amount: number): string {
  return `\u20A9${amount.toLocaleString("ko-KR")}`;
}

function generateMonthOptions(): { value: string; label: string }[] {
  const now = new Date();
  const options: { value: string; label: string }[] = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    options.push({ value: `${y}-${m}`, label: `${y}년 ${m}월` });
  }
  return options;
}

// ─── Component ──────────────────────────────────────────────

export function PayslipsTab() {
  const { addToast } = useToast();
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(
    `${now.getFullYear()}-${now.getMonth() + 1}`,
  );
  const [payslips, setPayslips] = useState<PayslipRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const monthOptions = generateMonthOptions();

  const fetchPayslips = useCallback(async () => {
    setLoading(true);
    try {
      const [y, m] = selectedMonth.split("-");
      const res = await fetch(
        `/api/payroll/payslips?year=${y}&month=${m}&page=${page}&pageSize=${pageSize}`,
      );
      if (res.ok) {
        const json = await res.json();
        setPayslips(json.data);
        setTotal(json.total);
      }
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, page]);

  useEffect(() => {
    fetchPayslips();
  }, [fetchPayslips]);

  function handleMonthChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setSelectedMonth(e.target.value);
    setPage(1);
  }

  async function handleAction(id: string, action: "resend" | "reissue") {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/payroll/payslips/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        await fetchPayslips();
      }
    } finally {
      setActionLoading(null);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const columns: Column<PayslipRow>[] = [
    {
      key: "employeeName",
      header: "이름",
      render: (row) => (
        <span className="font-medium">{row.employeeName}</span>
      ),
    },
    {
      key: "department",
      header: "부서",
      render: (row) => (
        <span className="text-text-secondary">{row.department}</span>
      ),
    },
    {
      key: "baseSalary",
      header: "기본급",
      align: "right",
      render: (row) => formatKRW(row.baseSalary),
    },
    {
      key: "allowances",
      header: "수당",
      align: "right",
      render: (row) => formatKRW(row.allowances),
    },
    {
      key: "deductions",
      header: "공제",
      align: "right",
      render: (row) => formatKRW(row.deductions),
    },
    {
      key: "netAmount",
      header: "실수령액",
      align: "right",
      render: (row) => (
        <span className="font-semibold">{formatKRW(row.netAmount)}</span>
      ),
    },
    {
      key: "status",
      header: "상태",
      align: "center",
      render: (row) => {
        const badge = PAYSLIP_STATUS_BADGE[row.status] ?? {
          label: row.status,
          variant: "neutral" as BadgeVariant,
        };
        return <Badge variant={badge.variant}>{badge.label}</Badge>;
      },
    },
    {
      key: "actions",
      header: "액션",
      align: "center",
      render: (row) => (
        <div className="flex items-center justify-center gap-sp-2">
          {row.status === "REISSUE_REQUESTED" ? (
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleAction(row.id, "reissue")}
              disabled={actionLoading === row.id}
            >
              재발행
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleAction(row.id, "resend")}
              disabled={actionLoading === row.id}
            >
              재발송
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => {
            const cols = [
              { key: "employeeName", label: "이름" },
              { key: "department", label: "부서" },
              { key: "baseSalary", label: "기본급" },
              { key: "allowances", label: "수당" },
              { key: "deductions", label: "공제" },
              { key: "netAmount", label: "실수령액" },
              { key: "status", label: "상태" },
            ];
            exportToCSV(cols, [row as unknown as Record<string, unknown>], `payslip-${row.employeeName}-${selectedMonth}.csv`);
            addToast({ message: "명세서가 CSV로 다운로드되었습니다.", variant: "success" });
          }}>
            CSV 내보내기
          </Button>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-sp-12">
        <span className="text-sm text-text-tertiary">불러오는 중...</span>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>급여 명세서</CardTitle>
        <div className="flex items-center gap-sp-2">
          <Select
            options={monthOptions}
            value={selectedMonth}
            onChange={handleMonthChange}
          />
          <Button variant="secondary" size="sm" onClick={() => addToast({ message: "급여 명세서가 발송되었습니다.", variant: "success" })}>
            일괄 발송
          </Button>
          <Button variant="secondary" size="sm" onClick={() => {
            const csvCols = [
              { key: "employeeName", label: "이름" },
              { key: "department", label: "부서" },
              { key: "baseSalary", label: "기본급" },
              { key: "allowances", label: "수당" },
              { key: "deductions", label: "공제" },
              { key: "netAmount", label: "실수령액" },
              { key: "status", label: "상태" },
            ];
            exportToCSV(csvCols, payslips as unknown as Record<string, unknown>[], `payslips-${selectedMonth}.csv`);
          }}>
            내보내기
          </Button>
        </div>
      </CardHeader>
      <CardBody>
        <DataTable<PayslipRow>
          columns={columns}
          data={payslips}
          keyExtractor={(row) => row.id}
          emptyMessage="해당 월의 급여 명세서가 없습니다"
        />

        {/* Pagination */}
        {total > 0 && (
          <div className="mt-sp-4 flex items-center justify-between">
            <span className="text-sm text-text-tertiary">
              총 {total.toLocaleString("ko-KR")}건 중{" "}
              {((page - 1) * pageSize + 1).toLocaleString("ko-KR")} &ndash;{" "}
              {Math.min(page * pageSize, total).toLocaleString("ko-KR")} 표시
            </span>
            <div className="flex items-center gap-sp-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPage(1)}
                disabled={page === 1}
              >
                &laquo;
              </Button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }
                return (
                  <Button
                    key={pageNum}
                    variant={page === pageNum ? "primary" : "ghost"}
                    size="sm"
                    onClick={() => setPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPage(totalPages)}
                disabled={page === totalPages}
              >
                &raquo;
              </Button>
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
