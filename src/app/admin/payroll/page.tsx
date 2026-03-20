"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DashboardTab } from "./tabs/DashboardTab";
import type { DashboardData } from "./tabs/DashboardTab";
import { WageConfigTab } from "./tabs/WageConfigTab";
import { CalculationTab } from "./tabs/CalculationTab";
import { RulesTab } from "./tabs/RulesTab";
import { ClosingTab } from "./tabs/ClosingTab";
import { PayslipsTab } from "./tabs/PayslipsTab";
import { SeveranceTab } from "./tabs/SeveranceTab";

// ─── Constants ──────────────────────────────────────────────

const TABS = [
  { key: "dashboard", label: "대시보드" },
  { key: "wage-config", label: "임금 설정" },
  { key: "calculation", label: "급여 계산" },
  { key: "rules", label: "급여 규칙" },
  { key: "closing", label: "마감" },
  { key: "payslips", label: "명세서" },
  { key: "severance", label: "퇴직금" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

// ─── Component ──────────────────────────────────────────────

export default function PayrollPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-sp-12">
          <span className="text-sm text-text-tertiary">불러오는 중...</span>
        </div>
      }
    >
      <PayrollContent />
    </Suspense>
  );
}

function PayrollContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = (searchParams.get("tab") as TabKey) || "dashboard";

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/payroll/dashboard");
      if (res.ok) {
        const json: DashboardData = await res.json();
        setData(json);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "dashboard") {
      fetchDashboard();
    }
  }, [activeTab, fetchDashboard]);

  function handleTabChange(tab: TabKey) {
    const params = new URLSearchParams(searchParams.toString());
    if (tab === "dashboard") {
      params.delete("tab");
    } else {
      params.set("tab", tab);
    }
    const qs = params.toString();
    router.push(`/admin/payroll${qs ? `?${qs}` : ""}`);
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-sp-6">
        <h1 className="text-2xl font-bold text-text-primary md:text-3xl">급여 관리</h1>
        <p className="mt-sp-1 text-md text-text-secondary">
          급여 규칙, 마감, 명세서 관리
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
      {activeTab === "dashboard" && (
        <DashboardTab data={data} loading={loading} />
      )}
      {activeTab === "wage-config" && <WageConfigTab />}
      {activeTab === "calculation" && <CalculationTab />}
      {activeTab === "rules" && <RulesTab />}
      {activeTab === "closing" && <ClosingTab />}
      {activeTab === "payslips" && <PayslipsTab />}
      {activeTab === "severance" && <SeveranceTab />}
    </div>
  );
}
