"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Sidebar } from "@/components/layout/Sidebar";
import type { NavSection } from "@/components/layout/Sidebar";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { useToast } from "@/components/layout/Toast";

const EMPLOYEE_NAV: NavSection[] = [
  {
    items: [
      { id: "home", label: "홈", href: "/employee" },
      { id: "schedule", label: "일정", href: "/employee/schedule" },
      { id: "requests", label: "요청", href: "/employee/requests" },
      { id: "inbox", label: "인박스", href: "/employee/inbox" },
      { id: "documents", label: "문서", href: "/employee/documents" },
      { id: "profile", label: "내 정보", href: "/employee/profile" },
    ],
  },
];

/* Bottom nav icons (SVG) for mobile */
const NAV_ICONS: Record<string, React.ReactNode> = {
  home: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  schedule: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  requests: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="12" y1="18" x2="12" y2="12" /><line x1="9" y1="15" x2="15" y2="15" />
    </svg>
  ),
  inbox: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" /><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </svg>
  ),
  documents: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
    </svg>
  ),
  profile: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  ),
};

function getActiveId(pathname: string): string {
  if (pathname === "/employee") return "home";
  const segment = pathname.split("/")[2];
  return segment ?? "home";
}

export default function EmployeeLayout({
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
    if (status === "authenticated" && !session?.user?.tenantId) {
      addToast({ message: "세션이 만료되었습니다. 다시 로그인해주세요.", variant: "warning" });
      signOut({ callbackUrl: "/login" });
    }
  }, [status, session, addToast]);

  function handleNavigate(id: string) {
    const item = EMPLOYEE_NAV.flatMap((s) => s.items).find((i) => i.id === id);
    if (item?.href) router.push(item.href);
  }

  const navItems = EMPLOYEE_NAV.flatMap((s) => s.items);

  return (
    <div className="flex h-screen overflow-hidden bg-surface-canvas">
      {/* Desktop Sidebar - hidden on mobile */}
      <div className="hidden md:flex">
        <Sidebar
          variant="employee"
          sections={EMPLOYEE_NAV}
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

      {/* Main Content - add bottom padding on mobile for bottom nav */}
      <main className="flex-1 overflow-y-auto px-4 py-4 pb-20 md:p-sp-8 md:pb-sp-8">{children}</main>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex md:hidden border-t border-border bg-surface-primary">
        {navItems.map((item) => {
          const isActive = item.id === activeId;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNavigate(item.id)}
              className={[
                "flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-colors min-h-[56px]",
                isActive
                  ? "text-brand"
                  : "text-text-tertiary hover:text-text-secondary",
              ].join(" ")}
            >
              <span className={isActive ? "text-brand" : "text-text-tertiary"}>
                {NAV_ICONS[item.id]}
              </span>
              {item.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
