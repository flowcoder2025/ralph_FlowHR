"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  KPICard,
  KPIGrid,
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
import type { Column } from "@/components/ui";
import { useToast } from "@/components/layout/Toast";

// ─── Types ──────────────────────────────────────────────────

interface RateFormData {
  pensionRate: string;
  healthRate: string;
  ltcRate: string;
  employmentRate: string;
  injuryRate: string;
}

interface ContributionRow {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  grossSalary: number;
  pensionEmployee: number;
  pensionEmployer: number;
  healthEmployee: number;
  healthEmployer: number;
  ltcEmployee: number;
  ltcEmployer: number;
  employmentEmployee: number;
  employmentEmployer: number;
  injuryEmployer: number;
  totalEmployee: number;
  totalEmployer: number;
  status: string;
}

interface ContributionSummary {
  totalEmployee: number;
  totalEmployer: number;
}

interface ContributionResponse {
  data: ContributionRow[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  summary: ContributionSummary;
}

// ─── Constants ──────────────────────────────────────────────

const TABS = [
  { key: "dashboard", label: "대시보드" },
  { key: "rates", label: "요율 설정" },
  { key: "detail", label: "월별 상세" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const STATUS_BADGE: Record<string, { label: string; variant: "success" | "info" | "neutral" }> = {
  CALCULATED: { label: "산출 완료", variant: "success" },
  REPORTED: { label: "신고 완료", variant: "info" },
  PENDING: { label: "미처리", variant: "neutral" },
};

// ─── Helpers ────────────────────────────────────────────────

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

function generateYearOptions(): { value: string; label: string }[] {
  const currentYear = new Date().getFullYear();
  const options: { value: string; label: string }[] = [];
  for (let y = currentYear + 1; y >= currentYear - 2; y--) {
    options.push({ value: String(y), label: `${y}년` });
  }
  return options;
}

// ─── Component ──────────────────────────────────────────────

export default function InsurancePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-sp-12">
          <span className="text-sm text-text-tertiary">불러오는 중...</span>
        </div>
      }
    >
      <InsuranceContent />
    </Suspense>
  );
}

function InsuranceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = (searchParams.get("tab") as TabKey) || "dashboard";

  function handleTabChange(tab: TabKey) {
    const params = new URLSearchParams(searchParams.toString());
    if (tab === "dashboard") {
      params.delete("tab");
    } else {
      params.set("tab", tab);
    }
    const qs = params.toString();
    router.push(`/admin/insurance${qs ? `?${qs}` : ""}`);
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-sp-6">
        <h1 className="text-2xl font-bold text-text-primary md:text-3xl">보험/세금 관리</h1>
        <p className="mt-sp-1 text-md text-text-secondary">
          4대보험 요율 설정, 산출, 월별 내역 관리
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
      {activeTab === "dashboard" && <DashboardTab />}
      {activeTab === "rates" && <RatesTab />}
      {activeTab === "detail" && <DetailTab />}
    </div>
  );
}

// ─── Dashboard Tab ──────────────────────────────────────────

function DashboardTab() {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(
    `${now.getFullYear()}-${now.getMonth() + 1}`,
  );
  const [summary, setSummary] = useState<ContributionSummary | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [calculatedCount, setCalculatedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const { addToast } = useToast();

  const monthOptions = generateMonthOptions();

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    try {
      const [y, m] = selectedMonth.split("-");
      const res = await fetch(
        `/api/insurance/contributions?year=${y}&month=${m}&pageSize=1`,
      );
      if (res.ok) {
        const json: ContributionResponse = await res.json();
        setSummary(json.summary);
        setTotalCount(json.pagination.total);
        setCalculatedCount(json.pagination.total);
      }
    } finally {
      setLoading(false);
    }
  }, [selectedMonth]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  async function handleCalculate() {
    setCalculating(true);
    try {
      const [y, m] = selectedMonth.split("-");
      const res = await fetch("/api/insurance/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year: Number(y), month: Number(m) }),
      });
      if (res.ok) {
        const json = await res.json();
        addToast({
          message: `${json.data.processed}명 보험료 산출 완료`,
          variant: "success",
        });
        await fetchSummary();
      } else {
        const errJson = await res.json();
        addToast({
          message: errJson.error || "산출에 실패했습니다",
          variant: "danger",
        });
      }
    } finally {
      setCalculating(false);
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
    <div>
      {/* Month selector + Calculate button */}
      <div className="mb-sp-6 flex items-center gap-sp-3">
        <Select
          options={monthOptions}
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
        />
        <Button
          variant="primary"
          size="sm"
          onClick={handleCalculate}
          disabled={calculating}
        >
          {calculating ? "산출 중..." : "보험료 산출"}
        </Button>
      </div>

      {/* KPI Cards */}
      <KPIGrid columns={4}>
        <KPICard
          eyebrow="총 직원"
          value={totalCount}
          label="명 (산출 대상)"
        />
        <KPICard
          eyebrow="직원 부담 합계"
          value={summary ? formatKRW(summary.totalEmployee) : "-"}
          label="원"
          emphasis
        />
        <KPICard
          eyebrow="사업주 부담 합계"
          value={summary ? formatKRW(summary.totalEmployer) : "-"}
          label="원"
        />
        <KPICard
          eyebrow="처리 상태"
          value={calculatedCount}
          label={`건 산출 완료`}
        />
      </KPIGrid>
    </div>
  );
}

// ─── Rates Tab ──────────────────────────────────────────────

function RatesTab() {
  const [selectedYear, setSelectedYear] = useState(
    String(new Date().getFullYear()),
  );
  const [form, setForm] = useState<RateFormData>({
    pensionRate: "4.5",
    healthRate: "3.545",
    ltcRate: "12.81",
    employmentRate: "0.9",
    injuryRate: "0.7",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { addToast } = useToast();

  const yearOptions = generateYearOptions();

  const fetchRates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/insurance/rates?year=${selectedYear}`);
      if (res.ok) {
        const json = await res.json();
        const d = json.data;
        setForm({
          pensionRate: String(d.pensionRate * 100),
          healthRate: String(d.healthRate * 100),
          ltcRate: String(d.ltcRate * 100),
          employmentRate: String(d.employmentRate * 100),
          injuryRate: String(d.injuryRate * 100),
        });
      }
    } finally {
      setLoading(false);
    }
  }, [selectedYear]);

  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/insurance/rates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          year: Number(selectedYear),
          pensionRate: Number(form.pensionRate) / 100,
          healthRate: Number(form.healthRate) / 100,
          ltcRate: Number(form.ltcRate) / 100,
          employmentRate: Number(form.employmentRate) / 100,
          injuryRate: Number(form.injuryRate) / 100,
        }),
      });
      if (res.ok) {
        addToast({ message: "요율이 저장되었습니다", variant: "success" });
      } else {
        const errJson = await res.json();
        addToast({ message: errJson.error || "저장에 실패했습니다", variant: "danger" });
      }
    } finally {
      setSaving(false);
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
    <Card>
      <CardHeader>
        <CardTitle>보험 요율 설정</CardTitle>
        <div className="flex items-center gap-sp-2">
          <Select
            options={yearOptions}
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
          />
          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "저장 중..." : "저장"}
          </Button>
        </div>
      </CardHeader>
      <CardBody>
        <div className="grid grid-cols-1 gap-sp-4 sm:grid-cols-2 lg:grid-cols-3">
          <Input
            label="국민연금 (%)"
            type="number"
            step="0.001"
            value={form.pensionRate}
            onChange={(e) => setForm({ ...form, pensionRate: e.target.value })}
          />
          <Input
            label="건강보험 (%)"
            type="number"
            step="0.001"
            value={form.healthRate}
            onChange={(e) => setForm({ ...form, healthRate: e.target.value })}
          />
          <Input
            label="장기요양보험 (% of 건강보험료)"
            type="number"
            step="0.001"
            value={form.ltcRate}
            onChange={(e) => setForm({ ...form, ltcRate: e.target.value })}
          />
          <Input
            label="고용보험 (%)"
            type="number"
            step="0.001"
            value={form.employmentRate}
            onChange={(e) => setForm({ ...form, employmentRate: e.target.value })}
          />
          <Input
            label="산재보험 (%, 사업주 부담)"
            type="number"
            step="0.001"
            value={form.injuryRate}
            onChange={(e) => setForm({ ...form, injuryRate: e.target.value })}
          />
        </div>

        <div className="mt-sp-6 rounded-md bg-surface-secondary px-sp-4 py-sp-3">
          <p className="text-sm text-text-secondary">
            <strong>안내:</strong> 국민연금, 건강보험, 장기요양, 고용보험은 노사 각각 동일 비율로 부담합니다.
            산재보험은 사업주가 전액 부담합니다. 요율 변경 후 월별 상세 탭에서 보험료를 재산출해주세요.
          </p>
        </div>
      </CardBody>
    </Card>
  );
}

// ─── Detail Tab ─────────────────────────────────────────────

function DetailTab() {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(
    `${now.getFullYear()}-${now.getMonth() + 1}`,
  );
  const [contributions, setContributions] = useState<ContributionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [summary, setSummary] = useState<ContributionSummary>({ totalEmployee: 0, totalEmployer: 0 });
  const [calculating, setCalculating] = useState(false);
  const { addToast } = useToast();
  const pageSize = 20;

  const monthOptions = generateMonthOptions();

  const fetchContributions = useCallback(async () => {
    setLoading(true);
    try {
      const [y, m] = selectedMonth.split("-");
      const res = await fetch(
        `/api/insurance/contributions?year=${y}&month=${m}&page=${page}&pageSize=${pageSize}`,
      );
      if (res.ok) {
        const json: ContributionResponse = await res.json();
        setContributions(json.data);
        setTotal(json.pagination.total);
        setSummary(json.summary);
      }
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, page]);

  useEffect(() => {
    fetchContributions();
  }, [fetchContributions]);

  function handleMonthChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setSelectedMonth(e.target.value);
    setPage(1);
  }

  async function handleCalculate() {
    setCalculating(true);
    try {
      const [y, m] = selectedMonth.split("-");
      const res = await fetch("/api/insurance/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year: Number(y), month: Number(m) }),
      });
      if (res.ok) {
        const json = await res.json();
        addToast({
          message: `${json.data.processed}명 보험료 산출 완료`,
          variant: "success",
        });
        await fetchContributions();
      } else {
        const errJson = await res.json();
        addToast({
          message: errJson.error || "산출에 실패했습니다",
          variant: "danger",
        });
      }
    } finally {
      setCalculating(false);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const columns: Column<ContributionRow>[] = [
    {
      key: "employeeName",
      header: "이름",
      render: (row) => <span className="font-medium">{row.employeeName}</span>,
    },
    {
      key: "department",
      header: "부서",
      render: (row) => <span className="text-text-secondary">{row.department}</span>,
    },
    {
      key: "grossSalary",
      header: "급여",
      align: "right",
      render: (row) => formatKRW(row.grossSalary),
    },
    {
      key: "pension",
      header: "연금",
      align: "right",
      render: (row) => formatKRW(row.pensionEmployee),
    },
    {
      key: "health",
      header: "건강",
      align: "right",
      render: (row) => formatKRW(row.healthEmployee),
    },
    {
      key: "ltc",
      header: "장기요양",
      align: "right",
      render: (row) => formatKRW(row.ltcEmployee),
    },
    {
      key: "employment",
      header: "고용",
      align: "right",
      render: (row) => formatKRW(row.employmentEmployee),
    },
    {
      key: "injury",
      header: "산재(사업주)",
      align: "right",
      render: (row) => formatKRW(row.injuryEmployer),
    },
    {
      key: "totalEmployee",
      header: "직원 합계",
      align: "right",
      render: (row) => (
        <span className="font-semibold">{formatKRW(row.totalEmployee)}</span>
      ),
    },
    {
      key: "totalEmployer",
      header: "사업주 합계",
      align: "right",
      render: (row) => (
        <span className="font-semibold">{formatKRW(row.totalEmployer)}</span>
      ),
    },
    {
      key: "status",
      header: "상태",
      align: "center",
      render: (row) => {
        const badge = STATUS_BADGE[row.status] ?? { label: row.status, variant: "neutral" as const };
        return <Badge variant={badge.variant}>{badge.label}</Badge>;
      },
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
        <CardTitle>월별 보험료 상세</CardTitle>
        <div className="flex items-center gap-sp-2">
          <Select
            options={monthOptions}
            value={selectedMonth}
            onChange={handleMonthChange}
          />
          <Button
            variant="primary"
            size="sm"
            onClick={handleCalculate}
            disabled={calculating}
          >
            {calculating ? "산출 중..." : "보험료 산출"}
          </Button>
        </div>
      </CardHeader>
      <CardBody>
        {/* Summary bar */}
        {total > 0 && (
          <div className="mb-sp-4 flex flex-wrap gap-sp-4 rounded-md bg-surface-secondary px-sp-4 py-sp-3">
            <span className="text-sm text-text-secondary">
              직원 부담 합계: <strong className="text-text-primary">{formatKRW(summary.totalEmployee)}</strong>
            </span>
            <span className="text-sm text-text-secondary">
              사업주 부담 합계: <strong className="text-text-primary">{formatKRW(summary.totalEmployer)}</strong>
            </span>
            <span className="text-sm text-text-secondary">
              총합: <strong className="text-text-primary">{formatKRW(summary.totalEmployee + summary.totalEmployer)}</strong>
            </span>
          </div>
        )}

        <DataTable<ContributionRow>
          columns={columns}
          data={contributions}
          keyExtractor={(row) => row.id}
          emptyMessage="해당 월의 보험료 내역이 없습니다. 보험료 산출 버튼을 눌러주세요."
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
