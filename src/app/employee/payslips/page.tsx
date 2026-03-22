"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardBody,
  Badge,
  Button,
} from "@/components/ui";
import type { BadgeVariant } from "@/components/ui";
import { useToast } from "@/components/layout/Toast";

/* ────────────────────────────────────────────
   Types
   ──────────────────────────────────────────── */

interface BreakdownAllowanceItem {
  name: string;
  amount: number;
}

interface PayslipBreakdown {
  baseSalary?: number;
  overtimePay?: number;
  nightShiftPay?: number;
  holidayPay?: number;
  fixedAllowances?: BreakdownAllowanceItem[];
  nonTaxableAllowances?: BreakdownAllowanceItem[];
  incomeTax?: number;
  localTax?: number;
  nationalPension?: number;
  healthInsurance?: number;
  longTermCare?: number;
  employmentInsurance?: number;
  wageType?: string;
}

interface PayslipData {
  id: string;
  year: number;
  month: number;
  baseSalary: number;
  allowances: number;
  deductions: number;
  netAmount: number;
  breakdown: PayslipBreakdown;
  status: string;
  sentAt: string | null;
  viewedAt: string | null;
  createdAt: string;
}

interface PayslipListResponse {
  data: PayslipData[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  year: number;
  month: number | null;
}

/* ────────────────────────────────────────────
   Constants
   ──────────────────────────────────────────── */

const WAGE_TYPE_MAP: Record<string, { label: string; variant: BadgeVariant }> = {
  COMPREHENSIVE: { label: "포괄임금", variant: "info" },
  STANDARD: { label: "통상임금", variant: "neutral" },
  HOURLY: { label: "시급", variant: "warning" },
  DAILY: { label: "일급", variant: "warning" },
  ANNUAL: { label: "연봉", variant: "success" },
};

const STATUS_MAP: Record<string, { label: string; variant: BadgeVariant }> = {
  DRAFT: { label: "작성 중", variant: "neutral" },
  CONFIRMED: { label: "확정", variant: "info" },
  SENT: { label: "발송 완료", variant: "success" },
  REISSUE_REQUESTED: { label: "재발행 요청", variant: "warning" },
};

/* ────────────────────────────────────────────
   Helpers
   ──────────────────────────────────────────── */

function formatCurrency(value: number): string {
  return value.toLocaleString("ko-KR") + "원";
}

function getYearOptions(): number[] {
  const current = new Date().getFullYear();
  const years: number[] = [];
  for (let y = current; y >= current - 4; y--) {
    years.push(y);
  }
  return years;
}

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => i + 1);

/* ────────────────────────────────────────────
   Page Component
   ──────────────────────────────────────────── */

export default function PayslipsPage() {
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [payslips, setPayslips] = useState<PayslipData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reissueLoading, setReissueLoading] = useState<string | null>(null);
  const { addToast } = useToast();

  const fetchPayslips = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        year: String(selectedYear),
        month: String(selectedMonth),
      });
      const res = await fetch(`/api/employee/payslips?${params.toString()}`);
      if (!res.ok) {
        throw new Error(
          res.status === 401 ? "인증이 필요합니다" : "급여명세서를 불러올 수 없습니다",
        );
      }
      const json: PayslipListResponse = await res.json();
      setPayslips(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  }, [selectedYear, selectedMonth]);

  useEffect(() => {
    fetchPayslips();
  }, [fetchPayslips]);

  const handleReissueRequest = async (payslipId: string) => {
    setReissueLoading(payslipId);
    try {
      const res = await fetch(`/api/employee/payslips/${payslipId}`, {
        method: "POST",
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? "재발행 요청에 실패했습니다");
      }
      addToast({ message: "재발행 요청이 접수되었습니다.", variant: "success" });
      await fetchPayslips();
    } catch (err) {
      addToast({
        message: err instanceof Error ? err.message : "재발행 요청에 실패했습니다.",
        variant: "danger",
      });
    } finally {
      setReissueLoading(null);
    }
  };

  const handleDownloadPdf = () => {
    if (!payslip) return;
    const breakdown = payslip.breakdown;
    const fixedItems = (breakdown.fixedAllowances ?? [])
      .map((a) => `<tr><td style="padding-left:20px">${a.name}</td><td style="text-align:right">${a.amount.toLocaleString("ko-KR")}원</td></tr>`)
      .join("");
    const nonTaxItems = (breakdown.nonTaxableAllowances ?? [])
      .map((a) => `<tr><td style="padding-left:20px">${a.name}</td><td style="text-align:right">${a.amount.toLocaleString("ko-KR")}원</td></tr>`)
      .join("");

    const fmt = (v: number) => v.toLocaleString("ko-KR") + "원";
    const html = [
      "<!DOCTYPE html><html><head><meta charset=\"utf-8\">",
      `<title>${payslip.year}년 ${payslip.month}월 급여명세서</title>`,
      "<style>body{font-family:sans-serif;padding:40px;color:#333}h1{text-align:center;font-size:22px;margin-bottom:8px}",
      ".sub{text-align:center;color:#666;margin-bottom:24px;font-size:14px}",
      "table{width:100%;border-collapse:collapse;margin-bottom:24px}th,td{padding:8px 12px;border-bottom:1px solid #eee;font-size:14px}",
      "th{text-align:left;background:#f8f9fa;font-weight:600}td:last-child{text-align:right}",
      ".section{font-weight:600;background:#f0f4ff;padding:10px 12px;margin-top:16px}",
      ".total{font-weight:700;border-top:2px solid #333;font-size:15px}",
      ".net{text-align:center;margin-top:32px;padding:20px;background:#f0f4ff;border-radius:8px}",
      ".net .amount{font-size:28px;font-weight:700;color:#4f46e5}",
      "@media print{body{padding:20px}}</style></head><body>",
      `<h1>${payslip.year}년 ${payslip.month}월 급여명세서</h1>`,
      `<div class="sub">발급일: ${new Date().toLocaleDateString("ko-KR")}</div>`,
      '<div class="section">지급 내역</div>',
      `<table><tr><td>기본급</td><td>${fmt(breakdown.baseSalary ?? payslip.baseSalary)}</td></tr>`,
      (breakdown.overtimePay ?? 0) > 0 ? `<tr><td>연장수당</td><td>${fmt(breakdown.overtimePay!)}</td></tr>` : "",
      (breakdown.nightShiftPay ?? 0) > 0 ? `<tr><td>야간수당</td><td>${fmt(breakdown.nightShiftPay!)}</td></tr>` : "",
      (breakdown.holidayPay ?? 0) > 0 ? `<tr><td>휴일수당</td><td>${fmt(breakdown.holidayPay!)}</td></tr>` : "",
      fixedItems, nonTaxItems,
      `<tr class="total"><td>총 지급액</td><td>${fmt(payslip.baseSalary + payslip.allowances)}</td></tr></table>`,
      '<div class="section">공제 내역</div><table>',
      (breakdown.incomeTax ?? 0) > 0 ? `<tr><td>소득세</td><td>${fmt(breakdown.incomeTax!)}</td></tr>` : "",
      (breakdown.localTax ?? 0) > 0 ? `<tr><td>지방소득세</td><td>${fmt(breakdown.localTax!)}</td></tr>` : "",
      (breakdown.nationalPension ?? 0) > 0 ? `<tr><td>국민연금</td><td>${fmt(breakdown.nationalPension!)}</td></tr>` : "",
      (breakdown.healthInsurance ?? 0) > 0 ? `<tr><td>건강보험</td><td>${fmt(breakdown.healthInsurance!)}</td></tr>` : "",
      (breakdown.longTermCare ?? 0) > 0 ? `<tr><td>장기요양</td><td>${fmt(breakdown.longTermCare!)}</td></tr>` : "",
      (breakdown.employmentInsurance ?? 0) > 0 ? `<tr><td>고용보험</td><td>${fmt(breakdown.employmentInsurance!)}</td></tr>` : "",
      `<tr class="total"><td>총 공제액</td><td>-${fmt(payslip.deductions)}</td></tr></table>`,
      '<div class="net"><div style="font-size:14px;color:#666;margin-bottom:8px">실수령액</div>',
      `<div class="amount">${fmt(payslip.netAmount)}</div></div>`,
      "</body></html>",
    ].join("\n");

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.onload = () => printWindow.print();
    }
  };

  const payslip = payslips.length > 0 ? payslips[0] : null;

  return (
    <div>
      {/* Page Header */}
      <div className="mb-sp-6">
        <div className="text-sm text-text-tertiary mb-sp-1">홈 &gt; 급여명세서</div>
        <h1 className="text-xl font-bold text-text-primary">급여명세서</h1>
        <p className="text-sm text-text-tertiary mt-sp-1">
          월별 급여명세서를 확인하고 재발행을 요청할 수 있습니다
        </p>
      </div>

      {/* Month Selector */}
      <div className="flex flex-wrap items-center gap-sp-3 mb-sp-6">
        <div className="flex items-center gap-sp-2">
          <label className="text-sm text-text-secondary">연도</label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="rounded-md border border-border bg-surface-primary px-sp-3 py-sp-2 text-sm text-text-primary min-h-[44px]"
          >
            {getYearOptions().map((y) => (
              <option key={y} value={y}>
                {y}년
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-sp-2">
          <label className="text-sm text-text-secondary">월</label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="rounded-md border border-border bg-surface-primary px-sp-3 py-sp-2 text-sm text-text-primary min-h-[44px]"
          >
            {MONTH_OPTIONS.map((m) => (
              <option key={m} value={m}>
                {m}월
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-sm text-text-tertiary">급여명세서를 불러오는 중...</div>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-sm text-status-error">{error}</div>
        </div>
      ) : !payslip ? (
        <Card>
          <CardBody>
            <div className="flex flex-col items-center justify-center py-sp-8 text-center">
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-text-tertiary mb-sp-4"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
              <p className="text-sm text-text-tertiary">
                이번 달 급여 명세서가 아직 생성되지 않았습니다
              </p>
            </div>
          </CardBody>
        </Card>
      ) : (
        <PayslipDetail
          payslip={payslip}
          onReissue={handleReissueRequest}
          onDownloadPdf={handleDownloadPdf}
          reissueLoading={reissueLoading}
        />
      )}
    </div>
  );
}

/* ────────────────────────────────────────────
   Payslip Detail
   ──────────────────────────────────────────── */

function PayslipDetail({
  payslip,
  onReissue,
  onDownloadPdf,
  reissueLoading,
}: {
  payslip: PayslipData;
  onReissue: (_id: string) => void;
  onDownloadPdf: () => void;
  reissueLoading: string | null;
}) {
  const breakdown = payslip.breakdown;
  const wageTypeInfo = breakdown.wageType ? WAGE_TYPE_MAP[breakdown.wageType] : null;
  const statusInfo = STATUS_MAP[payslip.status];

  // Compute total allowances from breakdown
  const fixedAllowancesTotal = (breakdown.fixedAllowances ?? []).reduce(
    (sum, a) => sum + a.amount,
    0,
  );
  const nonTaxableAllowancesTotal = (breakdown.nonTaxableAllowances ?? []).reduce(
    (sum, a) => sum + a.amount,
    0,
  );

  // Compute total deductions from breakdown
  const totalDeductions =
    (breakdown.incomeTax ?? 0) +
    (breakdown.localTax ?? 0) +
    (breakdown.nationalPension ?? 0) +
    (breakdown.healthInsurance ?? 0) +
    (breakdown.longTermCare ?? 0) +
    (breakdown.employmentInsurance ?? 0);

  return (
    <div className="space-y-sp-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-sp-2">
            <CardTitle>
              {payslip.year}년 {payslip.month}월 급여명세서
            </CardTitle>
            {statusInfo && (
              <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
            )}
            {wageTypeInfo && (
              <Badge variant={wageTypeInfo.variant}>{wageTypeInfo.label}</Badge>
            )}
          </div>
        </CardHeader>
        <CardBody>
          <div className="flex flex-col sm:flex-row items-center gap-sp-4 sm:gap-sp-8">
            <div className="text-center sm:text-left">
              <div className="text-xs text-text-tertiary mb-sp-1">실수령액</div>
              <div className="text-3xl font-bold text-brand">
                {formatCurrency(payslip.netAmount)}
              </div>
            </div>
            <div className="flex gap-sp-6 text-center">
              <div>
                <div className="text-xs text-text-tertiary mb-sp-1">총 지급액</div>
                <div className="text-lg font-semibold text-text-primary">
                  {formatCurrency(payslip.baseSalary + payslip.allowances)}
                </div>
              </div>
              <div>
                <div className="text-xs text-text-tertiary mb-sp-1">총 공제액</div>
                <div className="text-lg font-semibold text-status-error">
                  -{formatCurrency(payslip.deductions)}
                </div>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* 지급 내역 */}
      <Card>
        <CardHeader>
          <CardTitle>지급 내역</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="space-y-sp-2">
            <PayslipRow
              label="기본급"
              value={formatCurrency(breakdown.baseSalary ?? payslip.baseSalary)}
            />
            {(breakdown.overtimePay ?? 0) > 0 && (
              <PayslipRow
                label="연장수당"
                value={formatCurrency(breakdown.overtimePay!)}
              />
            )}
            {(breakdown.nightShiftPay ?? 0) > 0 && (
              <PayslipRow
                label="야간수당"
                value={formatCurrency(breakdown.nightShiftPay!)}
              />
            )}
            {(breakdown.holidayPay ?? 0) > 0 && (
              <PayslipRow
                label="휴일수당"
                value={formatCurrency(breakdown.holidayPay!)}
              />
            )}

            {/* 고정수당 */}
            {(breakdown.fixedAllowances ?? []).length > 0 && (
              <>
                <div className="pt-sp-2 text-xs font-medium text-text-tertiary">
                  고정수당
                </div>
                {breakdown.fixedAllowances!.map((a, i) => (
                  <PayslipRow
                    key={`fixed-${i}`}
                    label={a.name}
                    value={formatCurrency(a.amount)}
                    indent
                  />
                ))}
              </>
            )}

            {/* 비과세수당 */}
            {(breakdown.nonTaxableAllowances ?? []).length > 0 && (
              <>
                <div className="pt-sp-2 text-xs font-medium text-text-tertiary">
                  비과세수당
                </div>
                {breakdown.nonTaxableAllowances!.map((a, i) => (
                  <PayslipRow
                    key={`nontax-${i}`}
                    label={a.name}
                    value={formatCurrency(a.amount)}
                    indent
                  />
                ))}
              </>
            )}

            {/* Total */}
            <div className="flex items-center justify-between border-t border-border pt-sp-3 mt-sp-2">
              <span className="text-sm font-semibold text-text-primary">총 지급액</span>
              <span className="text-sm font-bold text-text-primary">
                {formatCurrency(
                  (breakdown.baseSalary ?? payslip.baseSalary) +
                    (breakdown.overtimePay ?? 0) +
                    (breakdown.nightShiftPay ?? 0) +
                    (breakdown.holidayPay ?? 0) +
                    fixedAllowancesTotal +
                    nonTaxableAllowancesTotal,
                )}
              </span>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* 공제 내역 */}
      <Card>
        <CardHeader>
          <CardTitle>공제 내역</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="space-y-sp-2">
            {(breakdown.incomeTax ?? 0) > 0 && (
              <PayslipRow label="소득세" value={formatCurrency(breakdown.incomeTax!)} />
            )}
            {(breakdown.localTax ?? 0) > 0 && (
              <PayslipRow
                label="지방소득세"
                value={formatCurrency(breakdown.localTax!)}
              />
            )}
            {(breakdown.nationalPension ?? 0) > 0 && (
              <PayslipRow
                label="국민연금"
                value={formatCurrency(breakdown.nationalPension!)}
              />
            )}
            {(breakdown.healthInsurance ?? 0) > 0 && (
              <PayslipRow
                label="건강보험"
                value={formatCurrency(breakdown.healthInsurance!)}
              />
            )}
            {(breakdown.longTermCare ?? 0) > 0 && (
              <PayslipRow
                label="장기요양"
                value={formatCurrency(breakdown.longTermCare!)}
              />
            )}
            {(breakdown.employmentInsurance ?? 0) > 0 && (
              <PayslipRow
                label="고용보험"
                value={formatCurrency(breakdown.employmentInsurance!)}
              />
            )}

            {/* Total */}
            <div className="flex items-center justify-between border-t border-border pt-sp-3 mt-sp-2">
              <span className="text-sm font-semibold text-text-primary">총 공제액</span>
              <span className="text-sm font-bold text-status-error">
                -{formatCurrency(totalDeductions > 0 ? totalDeductions : payslip.deductions)}
              </span>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* 실수령액 */}
      <Card className="border-brand">
        <CardBody>
          <div className="flex items-center justify-between">
            <span className="text-base font-bold text-text-primary">실수령액</span>
            <span className="text-2xl font-bold text-brand">
              {formatCurrency(payslip.netAmount)}
            </span>
          </div>
        </CardBody>
      </Card>

      {/* Actions */}
      <div className="flex flex-wrap gap-sp-3">
        <Button variant="secondary" size="sm" onClick={onDownloadPdf}>
          <span className="flex items-center gap-sp-2">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            PDF 다운로드
          </span>
        </Button>
        {payslip.status !== "REISSUE_REQUESTED" && (
          <Button
            variant="secondary"
            size="sm"
            disabled={reissueLoading === payslip.id}
            onClick={() => onReissue(payslip.id)}
          >
            {reissueLoading === payslip.id ? "요청 중..." : "재발행 요청"}
          </Button>
        )}
        {payslip.status === "REISSUE_REQUESTED" && (
          <Badge variant="warning">재발행 요청 진행 중</Badge>
        )}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────
   Sub-components
   ──────────────────────────────────────────── */

function PayslipRow({
  label,
  value,
  indent = false,
}: {
  label: string;
  value: string;
  indent?: boolean;
}) {
  return (
    <div className="flex items-center justify-between border-b border-border-subtle py-sp-2">
      <span
        className={[
          "text-sm text-text-secondary",
          indent ? "pl-sp-4" : "",
        ].join(" ")}
      >
        {label}
      </span>
      <span className="text-sm font-medium text-text-primary">{value}</span>
    </div>
  );
}
