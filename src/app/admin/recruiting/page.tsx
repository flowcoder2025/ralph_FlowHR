"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import DashboardTab from "./tabs/DashboardTab";
import type { DashboardData } from "./tabs/DashboardTab";
import PostingsTab from "./tabs/PostingsTab";
import PipelineTab from "./tabs/PipelineTab";
import OnboardingTab from "./tabs/OnboardingTab";
import OffboardingTab from "./tabs/OffboardingTab";

// ─── Constants ──────────────────────────────────────────────

const TABS = [
  { key: "dashboard", label: "대시보드" },
  { key: "postings", label: "채용 공고" },
  { key: "pipeline", label: "파이프라인" },
  { key: "onboarding", label: "온보딩" },
  { key: "offboarding", label: "오프보딩" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

// ─── Component ──────────────────────────────────────────────

export default function RecruitingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-sp-12">
          <span className="text-sm text-text-tertiary">불러오는 중...</span>
        </div>
      }
    >
      <RecruitingContent />
    </Suspense>
  );
}

function RecruitingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = (searchParams.get("tab") as TabKey) || "dashboard";

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/recruiting/dashboard");
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
    router.push(`/admin/recruiting${qs ? `?${qs}` : ""}`);
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-sp-6">
        <h1 className="text-3xl font-bold text-text-primary">채용 관리</h1>
        <p className="mt-sp-1 text-md text-text-secondary">
          채용 공고, 지원자 파이프라인, 온보딩/오프보딩 관리
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-sp-6 flex gap-sp-1 border-b border-border">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => handleTabChange(tab.key)}
            className={[
              "px-sp-4 py-sp-2 text-sm font-medium transition-colors duration-fast",
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
      {activeTab === "postings" && <PostingsTab />}
      {activeTab === "pipeline" && <PipelineTab />}
      {activeTab === "onboarding" && <OnboardingTab />}
      {activeTab === "offboarding" && <OffboardingTab />}
    </div>
  );
}
