"use client";

import { useState } from "react";
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
import { Modal } from "@/components/layout/Modal";
import { useToast } from "@/components/layout/Toast";

// ─── Types ──────────────────────────────────────────────────

interface ComprehensiveDetail {
  contractedOTPay: number;
  contractedNSPay: number;
  contractedHDPay: number;
  excessOTHours: number;
  excessOTPay: number;
  excessNSHours: number;
  excessNSPay: number;
  excessHDHours: number;
  excessHDPay: number;
}

interface Earnings {
  basePay: number;
  overtimePay: number;
  nightPay: number;
  holidayPay: number;
  fixedAllowances: { name: string; amount: number }[];
  nonTaxableAllowances: { name: string; amount: number }[];
  totalTaxable: number;
  totalNonTaxable: number;
  grossPay: number;
}

interface Deductions {
  pension: number;
  health: number;
  longTermCare: number;
  employment: number;
  incomeTax: number;
  localIncomeTax: number;
  totalDeductions: number;
}

interface Breakdown {
  wageType: string;
  hourlyRate: number;
  earnings: Earnings;
  comprehensiveDetail?: ComprehensiveDetail;
  tax: { incomeTax: number; localIncomeTax: number; totalTax: number };
  deductions: Deductions;
  netPay: number;
}

interface CalculationResult {
  employeeId: string;
  employeeName: string;
  breakdown: Breakdown;
}

interface CalculationResponse {
  processed: number;
  year: number;
  month: number;
  totalGross: number;
  totalNetPay: number;
  results: CalculationResult[];
}

// ─── Constants ──────────────────────────────────────────────

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

// ─── Helpers ──────────────────────────────────────────────

function formatKRW(amount: number): string {
  return `\u20A9${amount.toLocaleString("ko-KR")}`;
}

function generateYearOptions(): { value: string; label: string }[] {
  const now = new Date();
  const options: { value: string; label: string }[] = [];
  for (let i = 0; i < 3; i++) {
    const y = now.getFullYear() - i;
    options.push({ value: String(y), label: `${y}년` });
  }
  return options;
}

function generateMonthOptions(): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = [];
  for (let m = 1; m <= 12; m++) {
    options.push({ value: String(m), label: `${m}월` });
  }
  return options;
}

// ─── Component ──────────────────────────────────────────────

export function CalculationTab() {
  const { addToast } = useToast();
  const now = new Date();
  const [year, setYear] = useState(String(now.getFullYear()));
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [results, setResults] = useState<CalculationResult[]>([]);
  const [calculating, setCalculating] = useState(false);
  const [calculated, setCalculated] = useState(false);
  const [summary, setSummary] = useState<{ totalGross: number; totalNetPay: number; processed: number } | null>(null);
  const [detailModal, setDetailModal] = useState<CalculationResult | null>(null);

  const yearOptions = generateYearOptions();
  const monthOptions = generateMonthOptions();

  async function handleCalculate() {
    setCalculating(true);
    try {
      const res = await fetch("/api/payroll/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year: Number(year), month: Number(month) }),
      });

      if (!res.ok) {
        const errJson = await res.json();
        addToast({ message: errJson.error || "계산에 실패했습니다.", variant: "danger" });
        return;
      }

      const json = await res.json();
      const data: CalculationResponse = json.data;
      setResults(data.results);
      setSummary({
        totalGross: data.totalGross,
        totalNetPay: data.totalNetPay,
        processed: data.processed,
      });
      setCalculated(true);
      addToast({ message: `${data.processed}명의 급여 계산이 완료되었습니다.`, variant: "success" });
    } finally {
      setCalculating(false);
    }
  }

  const columns: Column<CalculationResult>[] = [
    {
      key: "employeeName",
      header: "이름",
      render: (row) => (
        <span className="font-medium">{row.employeeName}</span>
      ),
    },
    {
      key: "wageType",
      header: "임금유형",
      align: "center",
      render: (row) => (
        <Badge variant={WAGE_TYPE_BADGE[row.breakdown.wageType] ?? "neutral"}>
          {WAGE_TYPE_LABELS[row.breakdown.wageType] ?? row.breakdown.wageType}
        </Badge>
      ),
    },
    {
      key: "basePay",
      header: "기본급",
      align: "right",
      render: (row) => formatKRW(row.breakdown.earnings.basePay),
    },
    {
      key: "allowances",
      header: "수당",
      align: "right",
      render: (row) => {
        const total =
          row.breakdown.earnings.overtimePay +
          row.breakdown.earnings.nightPay +
          row.breakdown.earnings.holidayPay +
          row.breakdown.earnings.fixedAllowances.reduce((s, a) => s + a.amount, 0);
        return formatKRW(total);
      },
    },
    {
      key: "nonTaxable",
      header: "비과세",
      align: "right",
      render: (row) => formatKRW(row.breakdown.earnings.totalNonTaxable),
    },
    {
      key: "tax",
      header: "소득세",
      align: "right",
      render: (row) => formatKRW(row.breakdown.tax.totalTax),
    },
    {
      key: "insurance",
      header: "4대보험",
      align: "right",
      render: (row) => {
        const ins =
          row.breakdown.deductions.pension +
          row.breakdown.deductions.health +
          row.breakdown.deductions.longTermCare +
          row.breakdown.deductions.employment;
        return formatKRW(ins);
      },
    },
    {
      key: "netPay",
      header: "실수령액",
      align: "right",
      render: (row) => (
        <span className="font-semibold">{formatKRW(row.breakdown.netPay)}</span>
      ),
    },
    {
      key: "actions",
      header: "상세",
      align: "center",
      render: (row) => (
        <Button variant="ghost" size="sm" onClick={() => setDetailModal(row)}>
          상세
        </Button>
      ),
    },
  ];

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>급여 계산</CardTitle>
          <div className="flex items-center gap-sp-2">
            <Select
              options={yearOptions}
              value={year}
              onChange={(e) => {
                setYear(e.target.value);
                setCalculated(false);
              }}
            />
            <Select
              options={monthOptions}
              value={month}
              onChange={(e) => {
                setMonth(e.target.value);
                setCalculated(false);
              }}
            />
            <Button
              variant="primary"
              size="sm"
              onClick={handleCalculate}
              disabled={calculating}
            >
              {calculating ? "계산 중..." : "전체 계산 실행"}
            </Button>
          </div>
        </CardHeader>
        <CardBody>
          {/* Summary */}
          {calculated && summary && (
            <div className="mb-sp-4 flex flex-col gap-sp-2 rounded-md bg-surface-secondary p-sp-4 sm:flex-row sm:items-center sm:gap-sp-6">
              <div className="text-sm text-text-secondary">
                대상 인원: <span className="font-semibold text-text-primary">{summary.processed}명</span>
              </div>
              <div className="text-sm text-text-secondary">
                총 지급액: <span className="font-semibold text-text-primary">{formatKRW(summary.totalGross)}</span>
              </div>
              <div className="text-sm text-text-secondary">
                총 실수령액: <span className="font-semibold text-text-primary">{formatKRW(summary.totalNetPay)}</span>
              </div>
            </div>
          )}

          {calculated ? (
            <DataTable<CalculationResult>
              columns={columns}
              data={results}
              keyExtractor={(row) => row.employeeId}
              emptyMessage="계산 결과가 없습니다"
            />
          ) : (
            <div className="flex items-center justify-center py-sp-12">
              <span className="text-sm text-text-tertiary">
                월을 선택하고 &quot;전체 계산 실행&quot; 버튼을 눌러주세요
              </span>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Detail Modal */}
      <Modal
        open={detailModal !== null}
        onClose={() => setDetailModal(null)}
        title={detailModal ? `${detailModal.employeeName} - 급여 상세` : ""}
        size="lg"
      >
        {detailModal && (
          <div className="space-y-sp-4">
            {/* 기본 정보 */}
            <div className="rounded-md border border-border p-sp-4">
              <p className="mb-sp-2 text-sm font-semibold text-text-primary">기본 정보</p>
              <div className="grid grid-cols-2 gap-sp-2 text-sm">
                <div className="text-text-secondary">임금유형</div>
                <div>
                  <Badge variant={WAGE_TYPE_BADGE[detailModal.breakdown.wageType] ?? "neutral"}>
                    {WAGE_TYPE_LABELS[detailModal.breakdown.wageType] ?? detailModal.breakdown.wageType}
                  </Badge>
                </div>
                <div className="text-text-secondary">시급</div>
                <div>{formatKRW(detailModal.breakdown.hourlyRate)}</div>
              </div>
            </div>

            {/* 급여 항목 */}
            <div className="rounded-md border border-border p-sp-4">
              <p className="mb-sp-2 text-sm font-semibold text-text-primary">급여 항목</p>
              <div className="grid grid-cols-2 gap-sp-2 text-sm">
                <div className="text-text-secondary">기본급</div>
                <div className="text-right">{formatKRW(detailModal.breakdown.earnings.basePay)}</div>
                <div className="text-text-secondary">연장근무수당</div>
                <div className="text-right">{formatKRW(detailModal.breakdown.earnings.overtimePay)}</div>
                <div className="text-text-secondary">야간근무수당</div>
                <div className="text-right">{formatKRW(detailModal.breakdown.earnings.nightPay)}</div>
                <div className="text-text-secondary">휴일근무수당</div>
                <div className="text-right">{formatKRW(detailModal.breakdown.earnings.holidayPay)}</div>

                {detailModal.breakdown.earnings.fixedAllowances.map((a, i) => (
                  <div key={`fixed-${i}`} className="contents">
                    <div className="text-text-secondary">{a.name}</div>
                    <div className="text-right">{formatKRW(a.amount)}</div>
                  </div>
                ))}

                {detailModal.breakdown.earnings.nonTaxableAllowances.map((a, i) => (
                  <div key={`nontax-${i}`} className="contents">
                    <div className="text-text-secondary">{a.name} (비과세)</div>
                    <div className="text-right">{formatKRW(a.amount)}</div>
                  </div>
                ))}

                <div className="border-t border-border pt-sp-2 font-semibold text-text-primary">과세 소계</div>
                <div className="border-t border-border pt-sp-2 text-right font-semibold">{formatKRW(detailModal.breakdown.earnings.totalTaxable)}</div>
                <div className="font-semibold text-text-primary">비과세 소계</div>
                <div className="text-right font-semibold">{formatKRW(detailModal.breakdown.earnings.totalNonTaxable)}</div>
                <div className="font-semibold text-text-primary">총 지급액</div>
                <div className="text-right font-semibold">{formatKRW(detailModal.breakdown.earnings.grossPay)}</div>
              </div>
            </div>

            {/* 포괄임금 상세 (COMPREHENSIVE only) */}
            {detailModal.breakdown.comprehensiveDetail && (
              <div className="rounded-md border border-border bg-surface-secondary p-sp-4">
                <p className="mb-sp-2 text-sm font-semibold text-text-primary">포괄임금 약정/초과 내역</p>
                <div className="grid grid-cols-2 gap-sp-2 text-sm">
                  <div className="text-text-secondary">약정 연장수당 (포함)</div>
                  <div className="text-right">{formatKRW(detailModal.breakdown.comprehensiveDetail.contractedOTPay)}</div>
                  <div className="text-text-secondary">약정 야간수당 (포함)</div>
                  <div className="text-right">{formatKRW(detailModal.breakdown.comprehensiveDetail.contractedNSPay)}</div>
                  <div className="text-text-secondary">약정 휴일수당 (포함)</div>
                  <div className="text-right">{formatKRW(detailModal.breakdown.comprehensiveDetail.contractedHDPay)}</div>

                  <div className="border-t border-border pt-sp-2 text-text-secondary">
                    초과 연장 ({detailModal.breakdown.comprehensiveDetail.excessOTHours}h)
                  </div>
                  <div className="border-t border-border pt-sp-2 text-right">
                    {formatKRW(detailModal.breakdown.comprehensiveDetail.excessOTPay)}
                  </div>
                  <div className="text-text-secondary">
                    초과 야간 ({detailModal.breakdown.comprehensiveDetail.excessNSHours}h)
                  </div>
                  <div className="text-right">
                    {formatKRW(detailModal.breakdown.comprehensiveDetail.excessNSPay)}
                  </div>
                  <div className="text-text-secondary">
                    초과 휴일 ({detailModal.breakdown.comprehensiveDetail.excessHDHours}h)
                  </div>
                  <div className="text-right">
                    {formatKRW(detailModal.breakdown.comprehensiveDetail.excessHDPay)}
                  </div>
                </div>
              </div>
            )}

            {/* 공제 항목 */}
            <div className="rounded-md border border-border p-sp-4">
              <p className="mb-sp-2 text-sm font-semibold text-text-primary">공제 항목</p>
              <div className="grid grid-cols-2 gap-sp-2 text-sm">
                <div className="text-text-secondary">국민연금</div>
                <div className="text-right">{formatKRW(detailModal.breakdown.deductions.pension)}</div>
                <div className="text-text-secondary">건강보험</div>
                <div className="text-right">{formatKRW(detailModal.breakdown.deductions.health)}</div>
                <div className="text-text-secondary">장기요양보험</div>
                <div className="text-right">{formatKRW(detailModal.breakdown.deductions.longTermCare)}</div>
                <div className="text-text-secondary">고용보험</div>
                <div className="text-right">{formatKRW(detailModal.breakdown.deductions.employment)}</div>
                <div className="text-text-secondary">소득세</div>
                <div className="text-right">{formatKRW(detailModal.breakdown.deductions.incomeTax)}</div>
                <div className="text-text-secondary">지방소득세</div>
                <div className="text-right">{formatKRW(detailModal.breakdown.deductions.localIncomeTax)}</div>
                <div className="border-t border-border pt-sp-2 font-semibold text-text-primary">공제 합계</div>
                <div className="border-t border-border pt-sp-2 text-right font-semibold">{formatKRW(detailModal.breakdown.deductions.totalDeductions)}</div>
              </div>
            </div>

            {/* 실수령액 */}
            <div className="rounded-md bg-brand-bg p-sp-4 text-center">
              <p className="text-sm text-text-secondary">실수령액</p>
              <p className="text-2xl font-bold text-brand-text">{formatKRW(detailModal.breakdown.netPay)}</p>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
