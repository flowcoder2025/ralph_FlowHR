"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Sidebar } from "@/components/layout/Sidebar";
import type { NavSection } from "@/components/layout/Sidebar";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { useToast } from "@/components/layout/Toast";

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

interface BottomNavCategory {
  key: string;
  label: string;
  icon: React.ReactNode;
  href?: string;
  items?: { id: string; label: string; href: string }[];
}

const BOTTOM_NAV: BottomNavCategory[] = [
  {
    key: "home",
    label: "대시보드",
    href: "/admin",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    key: "hr",
    label: "인사관리",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    items: [
      { id: "people", label: "직원 관리", href: "/admin/people" },
      { id: "org-chart", label: "조직도", href: "/admin/org-chart" },
      { id: "changes", label: "인사 변동", href: "/admin/people/changes" },
      { id: "attendance", label: "근태 관리", href: "/admin/attendance" },
      { id: "leave", label: "휴가 관리", href: "/admin/leave" },
    ],
  },
  {
    key: "ops",
    label: "운영",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      </svg>
    ),
    items: [
      { id: "workflow", label: "결재", href: "/admin/workflow" },
      { id: "documents", label: "문서", href: "/admin/documents" },
      { id: "payroll", label: "급여", href: "/admin/payroll" },
      { id: "performance", label: "성과", href: "/admin/performance" },
      { id: "recruiting", label: "채용", href: "/admin/recruiting" },
    ],
  },
  {
    key: "system",
    label: "시스템",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
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

function getActiveCategoryKey(activeId: string): string {
  if (activeId === "home") return "home";
  for (const cat of BOTTOM_NAV) {
    if (cat.items?.some((i) => i.id === activeId)) return cat.key;
  }
  return "home";
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const { addToast } = useToast();
  const activeId = getActiveId(pathname);
  const activeCategoryKey = getActiveCategoryKey(activeId);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (status === "authenticated" && !session?.user?.tenantId) {
      addToast({ message: "세션이 만료되었습니다. 다시 로그인해주세요.", variant: "warning" });
      signOut({ callbackUrl: "/login" });
    }
  }, [status, session, addToast]);

  // Close dropdown on route change
  useEffect(() => {
    setOpenDropdown(null);
  }, [pathname]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleNavigate(id: string) {
    const item = ADMIN_NAV.flatMap((s) => s.items).find((i) => i.id === id);
    if (item?.href) router.push(item.href);
  }

  return (
    <div className="flex h-screen overflow-hidden bg-surface-canvas">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex">
        <Sidebar
          variant="admin"
          sections={ADMIN_NAV}
          activeId={activeId}
          onNavigate={handleNavigate}
          footer={
            <div className="flex items-center justify-between">
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="flex items-center gap-sp-2 rounded-md px-sp-3 py-sp-2 text-sm text-text-secondary hover:bg-surface-secondary hover:text-text-primary"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                로그아웃
              </button>
              <ThemeToggle />
            </div>
          }
        />
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-4 py-4 pb-20 md:p-sp-8 md:pb-sp-8">{children}</main>

      {/* Mobile Bottom Navigation */}
      <nav ref={navRef} className="fixed bottom-0 left-0 right-0 z-50 flex md:hidden border-t border-border bg-surface-primary">
        {BOTTOM_NAV.map((cat) => {
          const isActive = cat.key === activeCategoryKey;
          const isOpen = openDropdown === cat.key;

          return (
            <div key={cat.key} className="relative flex-1">
              {/* Dropdown popup */}
              {isOpen && cat.items && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-44 rounded-lg border border-border bg-surface-primary shadow-lg py-1">
                  {cat.items.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        router.push(item.href);
                        setOpenDropdown(null);
                      }}
                      className={[
                        "flex w-full items-center px-4 py-2.5 text-sm transition-colors min-h-[40px]",
                        item.id === activeId
                          ? "bg-brand-soft text-brand-text font-medium"
                          : "text-text-secondary hover:bg-surface-secondary hover:text-text-primary",
                      ].join(" ")}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Bottom nav button */}
              <button
                type="button"
                onClick={() => {
                  if (cat.href) {
                    router.push(cat.href);
                    setOpenDropdown(null);
                  } else {
                    setOpenDropdown(isOpen ? null : cat.key);
                  }
                }}
                className={[
                  "flex w-full flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-colors min-h-[56px]",
                  isActive || isOpen
                    ? "text-brand"
                    : "text-text-tertiary hover:text-text-secondary",
                ].join(" ")}
              >
                <span className={isActive || isOpen ? "text-brand" : "text-text-tertiary"}>
                  {cat.icon}
                </span>
                {cat.label}
              </button>
            </div>
          );
        })}
      </nav>
    </div>
  );
}
