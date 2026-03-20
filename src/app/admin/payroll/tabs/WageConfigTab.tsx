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

interface WageConfigRow {
  id: string;
  employeeId: string;
  employeeName: string;
  departmentName: string | null;
  wageType: string;
  baseSalary: number;
  contractedOTHours: number;
  contractedNSHours: number;
  contractedHDHours: number;
  hourlyRate: number | null;
  annualSalary: number | null;
  fixedAllowances: FixedAllowance[];
  nonTaxableAllowances: NonTaxableAllowance[];
  effectiveDate: string;
  isActive: boolean;
}

interface FixedAllowance {
  name: string;
  amount: number;
  taxable: boolean;
}

interface NonTaxableAllowance {
  name: string;
  amount: number;
  monthlyLimit: number;
}

interface EmployeeOption {
  id: string;
  name: string;
  department?: { name: string } | null;
}

interface WageConfigFormData {
  employeeId: string;
  wageType: string;
  baseSalary: string;
  contractedOTHours: string;
  contractedNSHours: string;
  contractedHDHours: string;
  hourlyRate: string;
  annualSalary: string;
  effectiveDate: string;
  fixedAllowances: FixedAllowance[];
  nonTaxableAllowances: NonTaxableAllowance[];
}

// ─── Constants ──────────────────────────────────────────────

const WAGE_TYPE_OPTIONS = [
  { value: "COMPREHENSIVE", label: "포괄임금" },
  { value: "STANDARD", label: "월급제" },
  { value: "HOURLY", label: "시급제" },
  { value: "DAILY", label: "일급제" },
  { value: "ANNUAL", label: "연봉제" },
];

const WAGE_TYPE_LABELS: Record<string, string> = {
  COMPREHENSIVE: "포괄임금",
  STANDARD: "월급제",
  HOURLY: "시급제",
  DAILY: "일급제",
  ANNUAL: "연봉제",
};

const WAGE_TYPE_BADGE: Record<string, BadgeVariant> = {
  COMPREHENSIVE: "info",
  STANDARD: "neutral",
  HOURLY: "warning",
  DAILY: "warning",
  ANNUAL: "success",
};

const EMPTY_FORM: WageConfigFormData = {
  employeeId: "",
  wageType: "",
  baseSalary: "",
  contractedOTHours: "",
  contractedNSHours: "",
  contractedHDHours: "",
  hourlyRate: "",
  annualSalary: "",
  effectiveDate: new Date().toISOString().slice(0, 10),
  fixedAllowances: [],
  nonTaxableAllowances: [],
};

// ─── Helpers ──────────────────────────────────────────────

function formatKRW(amount: number): string {
  return `\u20A9${amount.toLocaleString("ko-KR")}`;
}

// ─── Component ──────────────────────────────────────────────

export function WageConfigTab() {
  const { addToast } = useToast();
  const [configs, setConfigs] = useState<WageConfigRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<WageConfigFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);

  const fetchConfigs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/payroll/wage-config?pageSize=50");
      if (res.ok) {
        const json = await res.json();
        setConfigs(json.data);
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
    fetchConfigs();
    fetchEmployees();
  }, [fetchConfigs, fetchEmployees]);

  function openCreateModal() {
    setForm(EMPTY_FORM);
    setError(null);
    setModalOpen(true);
  }

  function addFixedAllowance() {
    setForm({
      ...form,
      fixedAllowances: [
        ...form.fixedAllowances,
        { name: "", amount: 0, taxable: true },
      ],
    });
  }

  function removeFixedAllowance(index: number) {
    setForm({
      ...form,
      fixedAllowances: form.fixedAllowances.filter((_, i) => i !== index),
    });
  }

  function updateFixedAllowance(index: number, field: keyof FixedAllowance, value: string | number | boolean) {
    const updated = [...form.fixedAllowances];
    updated[index] = { ...updated[index], [field]: value };
    setForm({ ...form, fixedAllowances: updated });
  }

  function addNonTaxableAllowance() {
    setForm({
      ...form,
      nonTaxableAllowances: [
        ...form.nonTaxableAllowances,
        { name: "", amount: 0, monthlyLimit: 0 },
      ],
    });
  }

  function removeNonTaxableAllowance(index: number) {
    setForm({
      ...form,
      nonTaxableAllowances: form.nonTaxableAllowances.filter((_, i) => i !== index),
    });
  }

  function updateNonTaxableAllowance(index: number, field: keyof NonTaxableAllowance, value: string | number) {
    const updated = [...form.nonTaxableAllowances];
    updated[index] = { ...updated[index], [field]: value };
    setForm({ ...form, nonTaxableAllowances: updated });
  }

  async function handleSave() {
    if (!form.employeeId || !form.wageType || !form.baseSalary) {
      setError("직원, 임금유형, 기본급은 필수입니다");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const payload = {
        employeeId: form.employeeId,
        wageType: form.wageType,
        baseSalary: Number(form.baseSalary),
        contractedOTHours: form.contractedOTHours ? Number(form.contractedOTHours) : 0,
        contractedNSHours: form.contractedNSHours ? Number(form.contractedNSHours) : 0,
        contractedHDHours: form.contractedHDHours ? Number(form.contractedHDHours) : 0,
        hourlyRate: form.hourlyRate ? Number(form.hourlyRate) : null,
        annualSalary: form.annualSalary ? Number(form.annualSalary) : null,
        effectiveDate: form.effectiveDate || new Date().toISOString().slice(0, 10),
        fixedAllowances: form.fixedAllowances.filter((a) => a.name.trim()),
        nonTaxableAllowances: form.nonTaxableAllowances.filter((a) => a.name.trim()),
      };

      const res = await fetch("/api/payroll/wage-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json();
        setError(errJson.error || "저장에 실패했습니다");
        return;
      }

      setModalOpen(false);
      addToast({ message: "임금 설정이 저장되었습니다.", variant: "success" });
      fetchConfigs();
    } finally {
      setSaving(false);
    }
  }

  function sumAllowances(row: WageConfigRow): number {
    const fixed = (row.fixedAllowances ?? []).reduce((s, a) => s + a.amount, 0);
    return fixed;
  }

  function sumNonTaxable(row: WageConfigRow): number {
    return (row.nonTaxableAllowances ?? []).reduce((s, a) => s + Math.min(a.amount, a.monthlyLimit), 0);
  }

  const columns: Column<WageConfigRow>[] = [
    {
      key: "employeeName",
      header: "이름",
      render: (row) => (
        <span className="font-medium">{row.employeeName}</span>
      ),
    },
    {
      key: "departmentName",
      header: "부서",
      render: (row) => (
        <span className="text-text-secondary">{row.departmentName ?? "-"}</span>
      ),
    },
    {
      key: "wageType",
      header: "임금유형",
      align: "center",
      render: (row) => (
        <Badge variant={WAGE_TYPE_BADGE[row.wageType] ?? "neutral"}>
          {WAGE_TYPE_LABELS[row.wageType] ?? row.wageType}
        </Badge>
      ),
    },
    {
      key: "baseSalary",
      header: "기본급",
      align: "right",
      render: (row) => formatKRW(row.baseSalary),
    },
    {
      key: "contractedOTHours",
      header: "약정시간",
      align: "right",
      render: (row) => {
        const total = row.contractedOTHours + row.contractedNSHours + row.contractedHDHours;
        return total > 0 ? `${total}h` : "-";
      },
    },
    {
      key: "fixedAllowances",
      header: "수당합계",
      align: "right",
      render: (row) => {
        const total = sumAllowances(row);
        return total > 0 ? formatKRW(total) : "-";
      },
    },
    {
      key: "nonTaxableAllowances",
      header: "비과세",
      align: "right",
      render: (row) => {
        const total = sumNonTaxable(row);
        return total > 0 ? formatKRW(total) : "-";
      },
    },
    {
      key: "effectiveDate",
      header: "적용일",
      render: (row) => (
        <span className="text-text-secondary">
          {new Date(row.effectiveDate).toLocaleDateString("ko-KR")}
        </span>
      ),
    },
    {
      key: "actions",
      header: "액션",
      align: "center",
      render: (row) => (
        <Badge variant={row.isActive ? "success" : "neutral"}>
          {row.isActive ? "활성" : "비활성"}
        </Badge>
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
          <CardTitle>임금 설정</CardTitle>
          <Button variant="primary" size="sm" onClick={openCreateModal}>
            임금 설정
          </Button>
        </CardHeader>
        <CardBody>
          <DataTable<WageConfigRow>
            columns={columns}
            data={configs}
            keyExtractor={(row) => row.id}
            emptyMessage="등록된 임금 설정이 없습니다"
          />
        </CardBody>
      </Card>

      {/* Create Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="임금 설정"
        size="lg"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setModalOpen(false)}>
              취소
            </Button>
            <Button variant="primary" size="sm" onClick={handleSave} disabled={saving}>
              {saving ? "저장 중..." : "저장"}
            </Button>
          </>
        }
      >
        {error && (
          <div className="mb-sp-4 rounded-sm bg-status-danger-bg px-sp-3 py-sp-2 text-sm text-status-danger-text">
            {error}
          </div>
        )}

        <div className="space-y-sp-4">
          <Select
            label="직원"
            options={employeeOptions}
            value={form.employeeId}
            onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
            placeholder="직원 선택"
          />

          <Select
            label="임금유형"
            options={WAGE_TYPE_OPTIONS}
            value={form.wageType}
            onChange={(e) => setForm({ ...form, wageType: e.target.value })}
            placeholder="임금유형 선택"
          />

          <Input
            label="기본급"
            type="number"
            value={form.baseSalary}
            onChange={(e) => setForm({ ...form, baseSalary: e.target.value })}
            placeholder="예: 3000000"
          />

          {/* COMPREHENSIVE 전용 필드 */}
          {form.wageType === "COMPREHENSIVE" && (
            <div className="rounded-md border border-border bg-surface-secondary p-sp-4">
              <p className="mb-sp-3 text-sm font-semibold text-text-primary">포괄임금 약정시간</p>
              <div className="grid grid-cols-1 gap-sp-3 sm:grid-cols-3">
                <Input
                  label="연장근무 (시간)"
                  type="number"
                  value={form.contractedOTHours}
                  onChange={(e) => setForm({ ...form, contractedOTHours: e.target.value })}
                  placeholder="0"
                />
                <Input
                  label="야간근무 (시간)"
                  type="number"
                  value={form.contractedNSHours}
                  onChange={(e) => setForm({ ...form, contractedNSHours: e.target.value })}
                  placeholder="0"
                />
                <Input
                  label="휴일근무 (시간)"
                  type="number"
                  value={form.contractedHDHours}
                  onChange={(e) => setForm({ ...form, contractedHDHours: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>
          )}

          {/* HOURLY 전용 필드 */}
          {form.wageType === "HOURLY" && (
            <Input
              label="시급"
              type="number"
              value={form.hourlyRate}
              onChange={(e) => setForm({ ...form, hourlyRate: e.target.value })}
              placeholder="예: 10000"
            />
          )}

          {/* ANNUAL 전용 필드 */}
          {form.wageType === "ANNUAL" && (
            <Input
              label="연봉"
              type="number"
              value={form.annualSalary}
              onChange={(e) => setForm({ ...form, annualSalary: e.target.value })}
              placeholder="예: 36000000"
            />
          )}

          <Input
            label="적용일"
            type="date"
            value={form.effectiveDate}
            onChange={(e) => setForm({ ...form, effectiveDate: e.target.value })}
          />

          {/* 고정 수당 */}
          <div className="rounded-md border border-border p-sp-4">
            <div className="mb-sp-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-text-primary">고정 수당</p>
              <Button variant="secondary" size="sm" onClick={addFixedAllowance}>
                추가
              </Button>
            </div>
            {form.fixedAllowances.length === 0 && (
              <p className="text-sm text-text-tertiary">등록된 고정 수당이 없습니다</p>
            )}
            {form.fixedAllowances.map((allowance, idx) => (
              <div key={idx} className="mb-sp-2 flex items-end gap-sp-2">
                <div className="flex-1">
                  <Input
                    label={idx === 0 ? "수당명" : undefined}
                    value={allowance.name}
                    onChange={(e) => updateFixedAllowance(idx, "name", e.target.value)}
                    placeholder="수당명"
                  />
                </div>
                <div className="w-32">
                  <Input
                    label={idx === 0 ? "금액" : undefined}
                    type="number"
                    value={String(allowance.amount)}
                    onChange={(e) => updateFixedAllowance(idx, "amount", Number(e.target.value))}
                    placeholder="금액"
                  />
                </div>
                <label className="flex items-center gap-sp-1 pb-sp-1 text-sm text-text-secondary">
                  <input
                    type="checkbox"
                    checked={allowance.taxable}
                    onChange={(e) => updateFixedAllowance(idx, "taxable", e.target.checked)}
                    className="h-4 w-4 rounded border-border"
                  />
                  과세
                </label>
                <Button variant="ghost" size="sm" onClick={() => removeFixedAllowance(idx)}>
                  삭제
                </Button>
              </div>
            ))}
          </div>

          {/* 비과세 수당 */}
          <div className="rounded-md border border-border p-sp-4">
            <div className="mb-sp-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-text-primary">비과세 수당</p>
              <Button variant="secondary" size="sm" onClick={addNonTaxableAllowance}>
                추가
              </Button>
            </div>
            {form.nonTaxableAllowances.length === 0 && (
              <p className="text-sm text-text-tertiary">등록된 비과세 수당이 없습니다</p>
            )}
            {form.nonTaxableAllowances.map((allowance, idx) => (
              <div key={idx} className="mb-sp-2 flex items-end gap-sp-2">
                <div className="flex-1">
                  <Input
                    label={idx === 0 ? "수당명" : undefined}
                    value={allowance.name}
                    onChange={(e) => updateNonTaxableAllowance(idx, "name", e.target.value)}
                    placeholder="수당명"
                  />
                </div>
                <div className="w-32">
                  <Input
                    label={idx === 0 ? "금액" : undefined}
                    type="number"
                    value={String(allowance.amount)}
                    onChange={(e) => updateNonTaxableAllowance(idx, "amount", Number(e.target.value))}
                    placeholder="금액"
                  />
                </div>
                <div className="w-32">
                  <Input
                    label={idx === 0 ? "월 한도" : undefined}
                    type="number"
                    value={String(allowance.monthlyLimit)}
                    onChange={(e) => updateNonTaxableAllowance(idx, "monthlyLimit", Number(e.target.value))}
                    placeholder="한도"
                  />
                </div>
                <Button variant="ghost" size="sm" onClick={() => removeNonTaxableAllowance(idx)}>
                  삭제
                </Button>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </>
  );
}
