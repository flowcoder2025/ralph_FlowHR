"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  Textarea,
} from "@/components/ui";
import type { BadgeVariant, Column } from "@/components/ui";
import { Modal } from "@/components/layout/Modal";
import { useToast } from "@/components/layout/Toast";

// ─── Types ──────────────────────────────────────────────────

interface ContractRow {
  id: string;
  contractNumber: string;
  employeeId: string;
  employeeName: string;
  departmentName: string | null;
  contractType: string;
  wageType: string;
  baseSalary: number;
  annualSalary: number | null;
  hourlyRate: number | null;
  startDate: string;
  endDate: string | null;
  workHoursPerWeek: number;
  workDaysPerWeek: number;
  workStartTime: string;
  workEndTime: string;
  breakMinutes: number;
  contractedOTHours: number | null;
  contractedNSHours: number | null;
  contractedHDHours: number | null;
  allowances: Allowance[];
  specialTerms: string | null;
  status: string;
  signedAt: string | null;
  signedByEmployee: boolean;
  signedByEmployer: boolean;
  createdAt: string;
}

interface Allowance {
  name: string;
  amount: number;
}

interface EmployeeOption {
  id: string;
  name: string;
  department?: { name: string } | null;
}

interface WageConfigData {
  wageType: string;
  baseSalary: number;
  annualSalary: number | null;
  hourlyRate: number | null;
  contractedOTHours: number;
  contractedNSHours: number;
  contractedHDHours: number;
  fixedAllowances: Allowance[];
}

interface ContractFormData {
  employeeId: string;
  contractType: string;
  startDate: string;
  endDate: string;
  wageType: string;
  baseSalary: string;
  annualSalary: string;
  hourlyRate: string;
  workHoursPerWeek: string;
  workDaysPerWeek: string;
  workStartTime: string;
  workEndTime: string;
  breakMinutes: string;
  contractedOTHours: string;
  contractedNSHours: string;
  contractedHDHours: string;
  allowances: Allowance[];
  specialTerms: string;
}

// ─── Constants ──────────────────────────────────────────────

const TABS = [
  { key: "list", label: "계약서 목록" },
  { key: "create", label: "계약서 작성" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const CONTRACT_STATUS_BADGE: Record<string, { label: string; variant: BadgeVariant }> = {
  DRAFT: { label: "초안", variant: "neutral" },
  PENDING_SIGN: { label: "서명 대기", variant: "warning" },
  SIGNED: { label: "체결 완료", variant: "success" },
  EXPIRED: { label: "만료", variant: "danger" },
  TERMINATED: { label: "해지", variant: "danger" },
};

const CONTRACT_TYPE_OPTIONS = [
  { value: "STANDARD", label: "정규직" },
  { value: "FIXED_TERM", label: "기간제" },
  { value: "PART_TIME", label: "단시간" },
];

const WAGE_TYPE_OPTIONS = [
  { value: "COMPREHENSIVE", label: "포괄임금" },
  { value: "STANDARD", label: "월급제" },
  { value: "HOURLY", label: "시급제" },
  { value: "DAILY", label: "일급제" },
  { value: "ANNUAL", label: "연봉제" },
];

const CONTRACT_TYPE_LABELS: Record<string, string> = {
  STANDARD: "정규직",
  FIXED_TERM: "기간제",
  PART_TIME: "단시간",
};

const WAGE_TYPE_LABELS: Record<string, string> = {
  COMPREHENSIVE: "포괄임금",
  STANDARD: "월급제",
  HOURLY: "시급제",
  DAILY: "일급제",
  ANNUAL: "연봉제",
};

const EMPTY_FORM: ContractFormData = {
  employeeId: "",
  contractType: "",
  startDate: new Date().toISOString().slice(0, 10),
  endDate: "",
  wageType: "",
  baseSalary: "",
  annualSalary: "",
  hourlyRate: "",
  workHoursPerWeek: "40",
  workDaysPerWeek: "5",
  workStartTime: "09:00",
  workEndTime: "18:00",
  breakMinutes: "60",
  contractedOTHours: "",
  contractedNSHours: "",
  contractedHDHours: "",
  allowances: [],
  specialTerms: "",
};

// ─── Helpers ──────────────────────────────────────────────

function formatKRW(amount: number): string {
  return `\u20A9${amount.toLocaleString("ko-KR")}`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("ko-KR");
}

// ─── Component ──────────────────────────────────────────────

export default function ContractsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-sp-12">
          <span className="text-sm text-text-tertiary">불러오는 중...</span>
        </div>
      }
    >
      <ContractsContent />
    </Suspense>
  );
}

function ContractsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = (searchParams.get("tab") as TabKey) || "list";

  function handleTabChange(tab: TabKey) {
    const params = new URLSearchParams(searchParams.toString());
    if (tab === "list") {
      params.delete("tab");
    } else {
      params.set("tab", tab);
    }
    const qs = params.toString();
    router.push(`/admin/contracts${qs ? `?${qs}` : ""}`);
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-sp-6">
        <h1 className="text-2xl font-bold text-text-primary md:text-3xl">근로계약서</h1>
        <p className="mt-sp-1 text-md text-text-secondary">
          근로계약서 작성, 서명, 관리
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-sp-6 flex gap-sp-1 overflow-x-auto border-b border-border">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => handleTabChange(tab.key)}
            className={[
              "whitespace-nowrap px-sp-4 py-sp-2 text-sm font-medium transition-colors duration-fast",
              "-mb-px border-b-2",
              activeTab === tab.key
                ? "border-brand text-brand-text"
                : "border-transparent text-text-tertiary hover:text-text-secondary hover:border-border",
            ].join(" ")}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "list" && <ContractListTab />}
      {activeTab === "create" && <ContractCreateTab onCreated={() => handleTabChange("list")} />}
    </div>
  );
}

// ─── 계약서 목록 탭 ──────────────────────────────────────

function ContractListTab() {
  const { addToast } = useToast();
  const [contracts, setContracts] = useState<ContractRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<ContractRow | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchContracts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/contracts?pageSize=50");
      if (res.ok) {
        const json = await res.json();
        setContracts(json.data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContracts();
  }, [fetchContracts]);

  async function handleRequestSign(id: string) {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/contracts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "PENDING_SIGN" }),
      });

      if (res.ok) {
        addToast({ message: "서명 요청이 완료되었습니다.", variant: "success" });
        fetchContracts();
      } else {
        const errJson = await res.json();
        addToast({ message: errJson.error || "서명 요청에 실패했습니다.", variant: "danger" });
      }
    } finally {
      setActionLoading(null);
    }
  }

  async function handleSign(id: string, signer: "employee" | "employer") {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/contracts/${id}/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signer }),
      });

      if (res.ok) {
        addToast({ message: "서명이 완료되었습니다.", variant: "success" });
        fetchContracts();
        setDetailModalOpen(false);
      } else {
        const errJson = await res.json();
        addToast({ message: errJson.error || "서명에 실패했습니다.", variant: "danger" });
      }
    } finally {
      setActionLoading(null);
    }
  }

  const columns: Column<ContractRow>[] = [
    {
      key: "contractNumber",
      header: "계약번호",
      render: (row) => (
        <span className="font-medium text-brand-text">{row.contractNumber}</span>
      ),
    },
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
      key: "contractType",
      header: "계약유형",
      render: (row) => (
        <span className="text-text-secondary">{CONTRACT_TYPE_LABELS[row.contractType] ?? row.contractType}</span>
      ),
    },
    {
      key: "wageType",
      header: "임금유형",
      render: (row) => (
        <span className="text-text-secondary">{WAGE_TYPE_LABELS[row.wageType] ?? row.wageType}</span>
      ),
    },
    {
      key: "startDate",
      header: "시작일",
      render: (row) => formatDate(row.startDate),
    },
    {
      key: "endDate",
      header: "종료일",
      render: (row) => formatDate(row.endDate),
    },
    {
      key: "status",
      header: "상태",
      align: "center",
      render: (row) => {
        const badge = CONTRACT_STATUS_BADGE[row.status] ?? {
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
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setSelectedContract(row);
              setDetailModalOpen(true);
            }}
          >
            상세
          </Button>
          {row.status === "DRAFT" && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleRequestSign(row.id)}
              disabled={actionLoading === row.id}
            >
              서명요청
            </Button>
          )}
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
    <>
      <Card>
        <CardHeader>
          <CardTitle>계약서 목록</CardTitle>
        </CardHeader>
        <CardBody>
          <DataTable<ContractRow>
            columns={columns}
            data={contracts}
            keyExtractor={(row) => row.id}
            emptyMessage="등록된 계약서가 없습니다"
          />
        </CardBody>
      </Card>

      {/* Detail Modal */}
      <Modal
        open={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title={`계약서 상세 - ${selectedContract?.contractNumber ?? ""}`}
        size="lg"
        footer={
          <>
            {selectedContract?.status === "PENDING_SIGN" && !selectedContract.signedByEmployer && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => selectedContract && handleSign(selectedContract.id, "employer")}
                disabled={actionLoading === selectedContract?.id}
              >
                사업주 서명
              </Button>
            )}
            {selectedContract?.status === "PENDING_SIGN" && !selectedContract.signedByEmployee && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => selectedContract && handleSign(selectedContract.id, "employee")}
                disabled={actionLoading === selectedContract?.id}
              >
                직원 서명
              </Button>
            )}
            <Button variant="secondary" size="sm" onClick={() => setDetailModalOpen(false)}>
              닫기
            </Button>
          </>
        }
      >
        {selectedContract && (
          <div className="space-y-sp-4">
            {/* 기본 정보 */}
            <div className="rounded-md border border-border p-sp-4">
              <p className="mb-sp-3 text-sm font-semibold text-text-primary">기본 정보</p>
              <div className="grid grid-cols-2 gap-sp-2 text-sm">
                <div className="text-text-secondary">직원명</div>
                <div className="font-medium">{selectedContract.employeeName}</div>
                <div className="text-text-secondary">부서</div>
                <div>{selectedContract.departmentName ?? "-"}</div>
                <div className="text-text-secondary">계약유형</div>
                <div>{CONTRACT_TYPE_LABELS[selectedContract.contractType] ?? selectedContract.contractType}</div>
                <div className="text-text-secondary">계약기간</div>
                <div>
                  {formatDate(selectedContract.startDate)} ~ {formatDate(selectedContract.endDate)}
                </div>
              </div>
            </div>

            {/* 임금 조건 */}
            <div className="rounded-md border border-border p-sp-4">
              <p className="mb-sp-3 text-sm font-semibold text-text-primary">임금 조건</p>
              <div className="grid grid-cols-2 gap-sp-2 text-sm">
                <div className="text-text-secondary">임금유형</div>
                <div>{WAGE_TYPE_LABELS[selectedContract.wageType] ?? selectedContract.wageType}</div>
                <div className="text-text-secondary">기본급</div>
                <div className="font-medium">{formatKRW(selectedContract.baseSalary)}</div>
                {selectedContract.annualSalary && (
                  <>
                    <div className="text-text-secondary">연봉</div>
                    <div>{formatKRW(selectedContract.annualSalary)}</div>
                  </>
                )}
                {selectedContract.hourlyRate && (
                  <>
                    <div className="text-text-secondary">시급</div>
                    <div>{formatKRW(selectedContract.hourlyRate)}</div>
                  </>
                )}
              </div>
            </div>

            {/* 근무 조건 */}
            <div className="rounded-md border border-border p-sp-4">
              <p className="mb-sp-3 text-sm font-semibold text-text-primary">근무 조건</p>
              <div className="grid grid-cols-2 gap-sp-2 text-sm">
                <div className="text-text-secondary">주 근무시간</div>
                <div>{selectedContract.workHoursPerWeek}시간</div>
                <div className="text-text-secondary">주 근무일</div>
                <div>{selectedContract.workDaysPerWeek}일</div>
                <div className="text-text-secondary">근무시간</div>
                <div>{selectedContract.workStartTime} ~ {selectedContract.workEndTime}</div>
                <div className="text-text-secondary">휴게시간</div>
                <div>{selectedContract.breakMinutes}분</div>
              </div>
            </div>

            {/* 서명 상태 */}
            <div className="rounded-md border border-border p-sp-4">
              <p className="mb-sp-3 text-sm font-semibold text-text-primary">서명 상태</p>
              <div className="grid grid-cols-2 gap-sp-2 text-sm">
                <div className="text-text-secondary">사업주 서명</div>
                <div>
                  <Badge variant={selectedContract.signedByEmployer ? "success" : "neutral"}>
                    {selectedContract.signedByEmployer ? "완료" : "대기"}
                  </Badge>
                </div>
                <div className="text-text-secondary">직원 서명</div>
                <div>
                  <Badge variant={selectedContract.signedByEmployee ? "success" : "neutral"}>
                    {selectedContract.signedByEmployee ? "완료" : "대기"}
                  </Badge>
                </div>
                {selectedContract.signedAt && (
                  <>
                    <div className="text-text-secondary">서명일</div>
                    <div>{formatDate(selectedContract.signedAt)}</div>
                  </>
                )}
              </div>
            </div>

            {/* 특약사항 */}
            {selectedContract.specialTerms && (
              <div className="rounded-md border border-border p-sp-4">
                <p className="mb-sp-3 text-sm font-semibold text-text-primary">특약 사항</p>
                <p className="text-sm text-text-secondary whitespace-pre-wrap">{selectedContract.specialTerms}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}

// ─── 계약서 작성 탭 ──────────────────────────────────────

function ContractCreateTab({ onCreated }: { onCreated: () => void }) {
  const { addToast } = useToast();
  const [form, setForm] = useState<ContractFormData>(EMPTY_FORM);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingWageConfig, setLoadingWageConfig] = useState(false);

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
    fetchEmployees();
  }, [fetchEmployees]);

  // 직원 선택 시 WageConfig 자동 로드
  async function handleEmployeeChange(employeeId: string) {
    setForm({ ...form, employeeId });

    if (!employeeId) return;

    setLoadingWageConfig(true);
    try {
      const res = await fetch(`/api/payroll/wage-config?employeeId=${employeeId}`);
      if (res.ok) {
        const json = await res.json();
        const configs: WageConfigData[] = json.data;
        if (configs.length > 0) {
          const wc = configs[0];
          setForm((prev) => ({
            ...prev,
            employeeId,
            wageType: wc.wageType,
            baseSalary: String(wc.baseSalary),
            annualSalary: wc.annualSalary ? String(wc.annualSalary) : "",
            hourlyRate: wc.hourlyRate ? String(wc.hourlyRate) : "",
            contractedOTHours: wc.contractedOTHours ? String(wc.contractedOTHours) : "",
            contractedNSHours: wc.contractedNSHours ? String(wc.contractedNSHours) : "",
            contractedHDHours: wc.contractedHDHours ? String(wc.contractedHDHours) : "",
            allowances: wc.fixedAllowances ?? [],
          }));
        }
      }
    } finally {
      setLoadingWageConfig(false);
    }
  }

  function addAllowance() {
    setForm({
      ...form,
      allowances: [...form.allowances, { name: "", amount: 0 }],
    });
  }

  function removeAllowance(index: number) {
    setForm({
      ...form,
      allowances: form.allowances.filter((_, i) => i !== index),
    });
  }

  function updateAllowance(index: number, field: keyof Allowance, value: string | number) {
    const updated = [...form.allowances];
    updated[index] = { ...updated[index], [field]: value };
    setForm({ ...form, allowances: updated });
  }

  async function handleSave() {
    if (!form.employeeId || !form.contractType || !form.wageType || !form.baseSalary) {
      setError("직원, 계약유형, 임금유형, 기본급은 필수입니다");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const payload = {
        employeeId: form.employeeId,
        contractType: form.contractType,
        startDate: form.startDate,
        endDate: form.endDate || undefined,
        wageType: form.wageType,
        baseSalary: Number(form.baseSalary),
        annualSalary: form.annualSalary ? Number(form.annualSalary) : undefined,
        hourlyRate: form.hourlyRate ? Number(form.hourlyRate) : undefined,
        workHoursPerWeek: Number(form.workHoursPerWeek),
        workDaysPerWeek: Number(form.workDaysPerWeek),
        workStartTime: form.workStartTime,
        workEndTime: form.workEndTime,
        breakMinutes: Number(form.breakMinutes),
        contractedOTHours: form.contractedOTHours ? Number(form.contractedOTHours) : undefined,
        contractedNSHours: form.contractedNSHours ? Number(form.contractedNSHours) : undefined,
        contractedHDHours: form.contractedHDHours ? Number(form.contractedHDHours) : undefined,
        allowances: form.allowances.filter((a) => a.name.trim()),
        specialTerms: form.specialTerms || undefined,
      };

      const res = await fetch("/api/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json();
        setError(errJson.error || "저장에 실패했습니다");
        return;
      }

      addToast({ message: "근로계약서가 저장되었습니다.", variant: "success" });
      setForm(EMPTY_FORM);
      onCreated();
    } finally {
      setSaving(false);
    }
  }

  const employeeOptions = employees.map((e) => ({
    value: e.id,
    label: `${e.name}${e.department?.name ? ` (${e.department.name})` : ""}`,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>계약서 작성</CardTitle>
      </CardHeader>
      <CardBody>
        <div className="space-y-sp-6">
          {error && (
            <div className="rounded-md bg-status-danger-bg p-sp-3 text-sm text-status-danger-text">
              {error}
            </div>
          )}

          {/* 직원 선택 */}
          <div>
            <h3 className="mb-sp-3 text-sm font-semibold text-text-primary">직원 선택</h3>
            <Select
              label="직원"
              options={employeeOptions}
              value={form.employeeId}
              onChange={(e) => handleEmployeeChange(e.target.value)}
              placeholder="직원 선택"
            />
            {loadingWageConfig && (
              <p className="mt-sp-1 text-xs text-text-tertiary">임금 설정 불러오는 중...</p>
            )}
          </div>

          {/* 계약 유형 */}
          <div>
            <h3 className="mb-sp-3 text-sm font-semibold text-text-primary">계약 유형</h3>
            <div className="grid grid-cols-1 gap-sp-4 md:grid-cols-3">
              <Select
                label="계약유형"
                options={CONTRACT_TYPE_OPTIONS}
                value={form.contractType}
                onChange={(e) => setForm({ ...form, contractType: e.target.value })}
                placeholder="선택"
              />
              <Input
                label="시작일"
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              />
              <Input
                label="종료일"
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              />
            </div>
          </div>

          {/* 임금 조건 */}
          <div>
            <h3 className="mb-sp-3 text-sm font-semibold text-text-primary">임금 조건</h3>
            <div className="grid grid-cols-1 gap-sp-4 md:grid-cols-3">
              <Select
                label="임금유형"
                options={WAGE_TYPE_OPTIONS}
                value={form.wageType}
                onChange={(e) => setForm({ ...form, wageType: e.target.value })}
                placeholder="선택"
              />
              <Input
                label="기본급 (원)"
                type="number"
                value={form.baseSalary}
                onChange={(e) => setForm({ ...form, baseSalary: e.target.value })}
              />
              <Input
                label="연봉 (원)"
                type="number"
                value={form.annualSalary}
                onChange={(e) => setForm({ ...form, annualSalary: e.target.value })}
              />
              <Input
                label="시급 (원)"
                type="number"
                value={form.hourlyRate}
                onChange={(e) => setForm({ ...form, hourlyRate: e.target.value })}
              />
              <Input
                label="포괄 연장근무 (시간/월)"
                type="number"
                value={form.contractedOTHours}
                onChange={(e) => setForm({ ...form, contractedOTHours: e.target.value })}
              />
              <Input
                label="포괄 야간근무 (시간/월)"
                type="number"
                value={form.contractedNSHours}
                onChange={(e) => setForm({ ...form, contractedNSHours: e.target.value })}
              />
              <Input
                label="포괄 휴일근무 (시간/월)"
                type="number"
                value={form.contractedHDHours}
                onChange={(e) => setForm({ ...form, contractedHDHours: e.target.value })}
              />
            </div>
          </div>

          {/* 수당 */}
          <div>
            <div className="mb-sp-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-text-primary">수당</h3>
              <Button variant="secondary" size="sm" onClick={addAllowance}>
                수당 추가
              </Button>
            </div>
            {form.allowances.map((a, i) => (
              <div key={i} className="mb-sp-2 flex items-end gap-sp-2">
                <Input
                  label={i === 0 ? "수당명" : undefined}
                  value={a.name}
                  onChange={(e) => updateAllowance(i, "name", e.target.value)}
                  placeholder="수당명"
                />
                <Input
                  label={i === 0 ? "금액 (원)" : undefined}
                  type="number"
                  value={String(a.amount)}
                  onChange={(e) => updateAllowance(i, "amount", Number(e.target.value))}
                />
                <Button variant="danger" size="sm" onClick={() => removeAllowance(i)}>
                  삭제
                </Button>
              </div>
            ))}
          </div>

          {/* 근무 조건 */}
          <div>
            <h3 className="mb-sp-3 text-sm font-semibold text-text-primary">근무 조건</h3>
            <div className="grid grid-cols-1 gap-sp-4 md:grid-cols-3">
              <Input
                label="주 근무시간"
                type="number"
                value={form.workHoursPerWeek}
                onChange={(e) => setForm({ ...form, workHoursPerWeek: e.target.value })}
              />
              <Input
                label="주 근무일"
                type="number"
                value={form.workDaysPerWeek}
                onChange={(e) => setForm({ ...form, workDaysPerWeek: e.target.value })}
              />
              <Input
                label="출근시간"
                type="time"
                value={form.workStartTime}
                onChange={(e) => setForm({ ...form, workStartTime: e.target.value })}
              />
              <Input
                label="퇴근시간"
                type="time"
                value={form.workEndTime}
                onChange={(e) => setForm({ ...form, workEndTime: e.target.value })}
              />
              <Input
                label="휴게시간 (분)"
                type="number"
                value={form.breakMinutes}
                onChange={(e) => setForm({ ...form, breakMinutes: e.target.value })}
              />
            </div>
          </div>

          {/* 특약 사항 */}
          <div>
            <h3 className="mb-sp-3 text-sm font-semibold text-text-primary">특약 사항</h3>
            <Textarea
              label="특약 사항"
              rows={4}
              value={form.specialTerms}
              onChange={(e) => setForm({ ...form, specialTerms: e.target.value })}
              placeholder="특약 사항을 입력하세요"
            />
          </div>

          {/* 저장 버튼 */}
          <div className="flex justify-end">
            <Button variant="primary" onClick={handleSave} disabled={saving}>
              {saving ? "저장 중..." : "저장 (초안)"}
            </Button>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
