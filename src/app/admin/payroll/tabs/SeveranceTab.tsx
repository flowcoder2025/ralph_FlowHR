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
  Input,
  Select,
} from "@/components/ui";
import type { BadgeVariant, Column } from "@/components/ui";
import { Modal } from "@/components/layout/Modal";
import { useToast } from "@/components/layout/Toast";

// ─── Types ──────────────────────────────────────────────────

interface SeveranceRow {
  id: string;
  employeeId: string;
  employeeName: string;
  departmentName: string | null;
  startDate: string;
  endDate: string;
  totalServiceDays: number;
  totalServiceYears: number;
  avgDailySalary: number;
  last3MonthsTotal: number;
  last3MonthsDays: number;
  severanceAmount: number;
  status: string;
  note: string | null;
  createdAt: string;
}

interface SeveranceCalculationResult {
  id: string;
  employeeId: string;
  employeeName: string;
  eligible: boolean;
  startDate: string;
  endDate: string;
  totalServiceDays: number;
  totalServiceYears: number;
  avgDailySalary: number;
  last3MonthsTotal: number;
  last3MonthsDays: number;
  severanceAmount: number;
  status: string;
}

interface EmployeeOption {
  id: string;
  name: string;
  department?: { name: string } | null;
}

// ─── Constants ──────────────────────────────────────────────

const SEVERANCE_STATUS_BADGE: Record<string, { label: string; variant: BadgeVariant }> = {
  ESTIMATED: { label: "산출", variant: "neutral" },
  CONFIRMED: { label: "확정", variant: "info" },
  PAID: { label: "지급 완료", variant: "success" },
};

// ─── Helpers ──────────────────────────────────────────────

function formatKRW(amount: number): string {
  return `\u20A9${amount.toLocaleString("ko-KR")}`;
}

function formatServicePeriod(days: number): string {
  const years = Math.floor(days / 365);
  const months = Math.floor((days % 365) / 30);
  const remainDays = days % 30;
  const parts: string[] = [];
  if (years > 0) parts.push(`${years}년`);
  if (months > 0) parts.push(`${months}개월`);
  if (remainDays > 0 || parts.length === 0) parts.push(`${remainDays}일`);
  return parts.join(" ");
}

// ─── Component ──────────────────────────────────────────────

export function SeveranceTab() {
  const { addToast } = useToast();
  const [records, setRecords] = useState<SeveranceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);

  // Calculate form
  const [calcModalOpen, setCalcModalOpen] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [resignDate, setResignDate] = useState("");
  const [calculating, setCalculating] = useState(false);
  const [calcResult, setCalcResult] = useState<SeveranceCalculationResult | null>(null);

  // Status change
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/payroll/severance?pageSize=50");
      if (res.ok) {
        const json = await res.json();
        setRecords(json.data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchEmployees = useCallback(async () => {
    try {
      const res = await fetch("/api/employees?status=ACTIVE&pageSize=100");
      if (res.ok) {
        const json = await res.json();
        setEmployees(json.data);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchRecords();
    fetchEmployees();
  }, [fetchRecords, fetchEmployees]);

  function openCalcModal() {
    setSelectedEmployeeId("");
    setResignDate("");
    setCalcResult(null);
    setCalcModalOpen(true);
  }

  async function handleCalculate() {
    if (!selectedEmployeeId || !resignDate) {
      addToast({ message: "직원과 퇴직예정일을 선택해주세요.", variant: "danger" });
      return;
    }

    setCalculating(true);
    try {
      const res = await fetch("/api/payroll/severance/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: selectedEmployeeId,
          resignDate,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json();
        addToast({ message: errJson.error || "계산에 실패했습니다.", variant: "danger" });
        return;
      }

      const json = await res.json();
      setCalcResult(json.data);
      addToast({ message: "퇴직금 계산이 완료되었습니다.", variant: "success" });
      fetchRecords();
    } finally {
      setCalculating(false);
    }
  }

  async function handleStatusChange(id: string, status: "CONFIRMED" | "PAID") {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/payroll/severance/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        addToast({
          message: status === "CONFIRMED" ? "퇴직금이 확정되었습니다." : "지급 완료 처리되었습니다.",
          variant: "success",
        });
        fetchRecords();
      }
    } finally {
      setActionLoading(null);
    }
  }

  const columns: Column<SeveranceRow>[] = [
    {
      key: "employeeName",
      header: "직원명",
      render: (row) => (
        <div>
          <span className="font-medium">{row.employeeName}</span>
          {row.departmentName && (
            <span className="ml-sp-1 text-xs text-text-tertiary">{row.departmentName}</span>
          )}
        </div>
      ),
    },
    {
      key: "totalServiceDays",
      header: "근속",
      render: (row) => (
        <span className="text-text-secondary">{formatServicePeriod(row.totalServiceDays)}</span>
      ),
    },
    {
      key: "avgDailySalary",
      header: "평균임금",
      align: "right",
      render: (row) => formatKRW(row.avgDailySalary),
    },
    {
      key: "severanceAmount",
      header: "퇴직금",
      align: "right",
      render: (row) => (
        <span className="font-semibold">{formatKRW(row.severanceAmount)}</span>
      ),
    },
    {
      key: "status",
      header: "상태",
      align: "center",
      render: (row) => {
        const badge = SEVERANCE_STATUS_BADGE[row.status] ?? {
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
          {row.status === "ESTIMATED" && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleStatusChange(row.id, "CONFIRMED")}
              disabled={actionLoading === row.id}
            >
              확정
            </Button>
          )}
          {row.status === "CONFIRMED" && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleStatusChange(row.id, "PAID")}
              disabled={actionLoading === row.id}
            >
              지급 완료
            </Button>
          )}
        </div>
      ),
    },
  ];

  const employeeOptions = employees.map((e) => ({
    value: e.id,
    label: `${e.name}${e.department?.name ? ` (${e.department.name})` : ""}`,
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-sp-12">
        <span className="text-sm text-text-tertiary">불러오는 중...</span>
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>퇴직금</CardTitle>
          <Button variant="primary" size="sm" onClick={openCalcModal}>
            퇴직금 계산
          </Button>
        </CardHeader>
        <CardBody>
          <DataTable<SeveranceRow>
            columns={columns}
            data={records}
            keyExtractor={(row) => row.id}
            emptyMessage="퇴직금 산출 내역이 없습니다"
          />
        </CardBody>
      </Card>

      {/* Calculate Modal */}
      <Modal
        open={calcModalOpen}
        onClose={() => setCalcModalOpen(false)}
        title="퇴직금 계산"
        size="md"
        footer={
          !calcResult ? (
            <>
              <Button variant="secondary" size="sm" onClick={() => setCalcModalOpen(false)}>
                취소
              </Button>
              <Button variant="primary" size="sm" onClick={handleCalculate} disabled={calculating}>
                {calculating ? "계산 중..." : "계산"}
              </Button>
            </>
          ) : (
            <Button variant="secondary" size="sm" onClick={() => setCalcModalOpen(false)}>
              닫기
            </Button>
          )
        }
      >
        {!calcResult ? (
          <div className="space-y-sp-4">
            <Select
              label="직원"
              options={employeeOptions}
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              placeholder="직원 선택"
            />
            <Input
              label="퇴직예정일"
              type="date"
              value={resignDate}
              onChange={(e) => setResignDate(e.target.value)}
            />
          </div>
        ) : (
          <div className="space-y-sp-4">
            {/* 계산 결과 */}
            <div className="rounded-md border border-border p-sp-4">
              <p className="mb-sp-3 text-sm font-semibold text-text-primary">계산 결과</p>
              <div className="grid grid-cols-2 gap-sp-2 text-sm">
                <div className="text-text-secondary">직원명</div>
                <div className="font-medium">{calcResult.employeeName}</div>
                <div className="text-text-secondary">근무기간</div>
                <div>
                  {new Date(calcResult.startDate).toLocaleDateString("ko-KR")} ~{" "}
                  {new Date(calcResult.endDate).toLocaleDateString("ko-KR")}
                </div>
                <div className="text-text-secondary">근속기간</div>
                <div>{formatServicePeriod(calcResult.totalServiceDays)}</div>
                <div className="text-text-secondary">최근 3개월 급여 합계</div>
                <div>{formatKRW(calcResult.last3MonthsTotal)}</div>
                <div className="text-text-secondary">최근 3개월 일수</div>
                <div>{calcResult.last3MonthsDays}일</div>
                <div className="text-text-secondary">평균임금 (일)</div>
                <div>{formatKRW(calcResult.avgDailySalary)}</div>
              </div>
            </div>

            <div className="rounded-md bg-brand-bg p-sp-4 text-center">
              <p className="text-sm text-text-secondary">퇴직금</p>
              <p className="text-2xl font-bold text-brand-text">
                {formatKRW(calcResult.severanceAmount)}
              </p>
              {!calcResult.eligible && (
                <p className="mt-sp-1 text-xs text-status-danger-text">
                  근속 1년 미만으로 퇴직금 수급 요건 미충족
                </p>
              )}
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
