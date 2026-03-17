"use client";

import { useState, useEffect, useRef } from "react";
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
    href: "/platform",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
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
      { id: "tenants", label: "테넌트 관리", href: "/platform/tenants" },
      { id: "billing", label: "플랜 & 빌링", href: "/platform/billing" },
    ],
  },
  {
    key: "support",
    label: "지원",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
      </svg>
    ),
    items: [
      { id: "support", label: "서포트", href: "/platform/support" },
      { id: "monitoring", label: "모니터링", href: "/platform/monitoring" },
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

function getActiveCategoryKey(activeId: string): string {
  if (activeId === "home") return "home";
  for (const cat of BOTTOM_NAV) {
    if (cat.items?.some((i) => i.id === activeId)) return cat.key;
  }
  return "home";
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
  const activeCategoryKey = getActiveCategoryKey(activeId);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (status === "authenticated" && session && !session.user?.role) {
      addToast({ message: "세션이 만료되었습니다. 다시 로그인해주세요.", variant: "warning" });
      signOut({ callbackUrl: "/login" });
    }
  }, [status, session, addToast]);

  useEffect(() => {
    setOpenDropdown(null);
  }, [pathname]);

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
    const item = PLATFORM_NAV.flatMap((s) => s.items).find((i) => i.id === id);
    if (item?.href) router.push(item.href);
  }

  return (
    <div className="flex h-screen overflow-hidden bg-surface-canvas">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex">
        <Sidebar
          variant="platform"
          sections={PLATFORM_NAV}
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
      <nav ref={navRef} className="fixed bottom-0 left-0 right-0 z-50 flex md:hidden border-t border-gray-700 bg-surface-inverse">
        {BOTTOM_NAV.map((cat) => {
          const isActive = cat.key === activeCategoryKey;
          const isOpen = openDropdown === cat.key;

          return (
            <div key={cat.key} className="relative flex-1">
              {/* Dropdown popup */}
              {isOpen && cat.items && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-44 rounded-lg border border-gray-700 bg-surface-inverse shadow-lg py-1">
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
                          ? "bg-white/10 text-white font-medium"
                          : "text-gray-400 hover:bg-white/5 hover:text-gray-200",
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
                    ? "text-white"
                    : "text-gray-500 hover:text-gray-300",
                ].join(" ")}
              >
                <span className={isActive || isOpen ? "text-white" : "text-gray-500"}>
                  {cat.icon}
                </span>
                {cat.label}
              </button>
            </div>
          );
        })}
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-colors min-h-[56px] text-gray-500 hover:text-red-400"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          로그아웃
        </button>
      </nav>
    </div>
  );
}
