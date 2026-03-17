"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Sidebar } from "@/components/layout/Sidebar";
import type { NavSection } from "@/components/layout/Sidebar";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { useToast } from "@/components/layout/Toast";

const PLATFORM_NAV: NavSection[] = [
  {
    label: "메인",
    items: [{ id: "home", label: "대시보드", href: "/platform" }],
  },
  {
    label: "운영",
    items: [
      { id: "tenants", label: "테넌트 관리", href: "/platform/tenants" },
      { id: "billing", label: "플랜 & 빌링", href: "/platform/billing" },
    ],
  },
  {
    label: "지원",
    items: [
      { id: "support", label: "서포트", href: "/platform/support" },
      { id: "monitoring", label: "모니터링", href: "/platform/monitoring" },
    ],
  },
  {
    label: "시스템",
    items: [
      { id: "audit", label: "감사 & 보안", href: "/platform/audit" },
      { id: "settings", label: "플랫폼 설정", href: "/platform/settings" },
    ],
  },
];

function getActiveId(pathname: string): string {
  if (pathname === "/platform") return "home";
  const segment = pathname.split("/")[2];
  return segment ?? "home";
}

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const { addToast } = useToast();
  const activeId = getActiveId(pathname);

  useEffect(() => {
    if (status === "authenticated" && session && !session.user?.role) {
      addToast({ message: "세션이 만료되었습니다. 다시 로그인해주세요.", variant: "warning" });
      signOut({ callbackUrl: "/login" });
    }
  }, [status, session, addToast]);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  function handleNavigate(id: string) {
    const item = PLATFORM_NAV.flatMap((s) => s.items).find((i) => i.id === id);
    if (item?.href) router.push(item.href);
  }

  function handleMobileNavigate(id: string) {
    handleNavigate(id);
    setMobileMenuOpen(false);
  }

  const sidebarFooter = (
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
  );

  return (
    <div className="flex h-screen overflow-hidden bg-surface-canvas">
      {/* Desktop sidebar */}
      <div className="hidden md:flex">
        <Sidebar
          variant="platform"
          sections={PLATFORM_NAV}
          activeId={activeId}
          onNavigate={handleNavigate}
          footer={sidebarFooter}
        />
      </div>

      {/* Mobile hamburger button */}
      <button
        type="button"
        className="fixed left-3 top-3 z-40 flex h-10 w-10 items-center justify-center rounded-md bg-surface-inverse shadow-md md:hidden"
        onClick={() => setMobileMenuOpen(true)}
        aria-label="메뉴 열기"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {/* Mobile drawer overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            role="button"
            tabIndex={0}
            aria-label="메뉴 닫기"
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileMenuOpen(false)}
            onKeyDown={(e) => { if (e.key === "Escape" || e.key === "Enter") setMobileMenuOpen(false); }}
          />
          <div className="relative h-full w-sidebar">
            <Sidebar
              variant="platform"
              sections={PLATFORM_NAV}
              activeId={activeId}
              onNavigate={handleMobileNavigate}
              footer={sidebarFooter}
            />
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-4 pt-14 md:p-sp-8 md:pt-sp-8">
        {children}
      </main>
    </div>
  );
}
