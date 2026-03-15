"use client";

import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { Sidebar } from "@/components/layout/Sidebar";
import type { NavSection } from "@/components/layout/Sidebar";

const ADMIN_NAV: NavSection[] = [
  {
    label: "메인",
    items: [{ id: "home", label: "대시보드", href: "/admin" }],
  },
  {
    label: "인사관리",
    items: [
      { id: "people", label: "직원 관리", href: "/admin/people" },
      { id: "org-chart", label: "조직도", href: "/admin/org-chart" },
      { id: "changes", label: "인사 변동", href: "/admin/people/changes" },
      { id: "attendance", label: "근태 관리", href: "/admin/attendance" },
      { id: "leave", label: "휴가 관리", href: "/admin/leave" },
    ],
  },
  {
    label: "운영",
    items: [
      { id: "workflow", label: "결재", href: "/admin/workflow" },
      { id: "documents", label: "문서", href: "/admin/documents" },
      { id: "payroll", label: "급여", href: "/admin/payroll" },
      { id: "performance", label: "성과", href: "/admin/performance" },
      { id: "recruiting", label: "채용", href: "/admin/recruiting" },
    ],
  },
  {
    label: "시스템",
    items: [
      { id: "reports", label: "리포트", href: "/admin/reports" },
      { id: "settings", label: "설정", href: "/admin/settings" },
    ],
  },
];

function getActiveId(pathname: string): string {
  if (pathname === "/admin") return "home";
  if (pathname === "/admin/people/changes") return "changes";
  const segment = pathname.split("/")[2];
  return segment ?? "home";
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const activeId = getActiveId(pathname);

  function handleNavigate(id: string) {
    const item = ADMIN_NAV.flatMap((s) => s.items).find((i) => i.id === id);
    if (item?.href) router.push(item.href);
  }

  return (
    <div className="flex h-screen overflow-hidden bg-surface-canvas">
      <Sidebar
        variant="admin"
        sections={ADMIN_NAV}
        activeId={activeId}
        onNavigate={handleNavigate}
        footer={
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex w-full items-center gap-sp-2 rounded-md px-sp-3 py-sp-2 text-sm text-text-secondary hover:bg-surface-secondary hover:text-text-primary"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            로그아웃
          </button>
        }
      />
      <main className="flex-1 overflow-y-auto p-sp-8">{children}</main>
    </div>
  );
}
