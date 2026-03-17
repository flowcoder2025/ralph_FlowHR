"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CompanyTab } from "./tabs/CompanyTab";
import { RolesTab } from "./tabs/RolesTab";
import { PermissionsMatrix } from "./tabs/PermissionsMatrix";
import { NotificationsTab } from "./tabs/NotificationsTab";
import { IntegrationsTab } from "./tabs/IntegrationsTab";
import { AuditLogTab } from "./tabs/AuditLogTab";

// ─── Constants ──────────────────────────────────────────────

const TABS = [
  { key: "company", label: "회사 정보" },
  { key: "roles", label: "역할 및 권한" },
  { key: "notifications", label: "알림 설정" },
  { key: "integrations", label: "연동 관리" },
  { key: "audit", label: "감사 로그" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

// ─── Component ──────────────────────────────────────────────

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-sp-12">
          <span className="text-sm text-text-tertiary">불러오는 중...</span>
        </div>
      }
    >
      <SettingsContent />
    </Suspense>
  );
}

function SettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = (searchParams.get("tab") as TabKey) || "company";

  function handleTabChange(tab: TabKey) {
    const params = new URLSearchParams(searchParams.toString());
    if (tab === "company") {
      params.delete("tab");
    } else {
      params.set("tab", tab);
    }
    const qs = params.toString();
    router.push(`/admin/settings${qs ? `?${qs}` : ""}`);
  }

  return (
    <div className="space-y-sp-6">
      {/* 페이지 헤더 */}
      <div>
        <h1 className="text-xl font-bold text-text-primary">설정</h1>
        <p className="text-sm text-text-tertiary mt-sp-1">
          회사 정보와 시스템 설정을 관리합니다
        </p>
      </div>

      {/* 탭 네비게이션 */}
      <nav className="flex gap-sp-1 overflow-x-auto border-b border-border-subtle">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleTabChange(tab.key)}
            className={[
              "whitespace-nowrap px-sp-4 py-sp-2 text-sm font-medium transition-colors duration-fast -mb-px",
              activeTab === tab.key
                ? "text-brand border-b-2 border-brand"
                : "text-text-tertiary hover:text-text-primary",
            ].join(" ")}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* 탭 콘텐츠 */}
      {activeTab === "company" && <CompanyTab />}
      {activeTab === "roles" && (
        <div className="space-y-sp-6">
          <RolesTab />
          <PermissionsMatrix />
        </div>
      )}
      {activeTab === "notifications" && <NotificationsTab />}
      {activeTab === "integrations" && <IntegrationsTab />}
      {activeTab === "audit" && <AuditLogTab />}
    </div>
  );
}
