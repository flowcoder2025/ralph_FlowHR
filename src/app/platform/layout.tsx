"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Sidebar } from "@/components/layout/Sidebar";
import type { NavSection } from "@/components/layout/Sidebar";

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
  const activeId = getActiveId(pathname);

  useEffect(() => {
    if (status === "authenticated" && session && !session.user?.role) {
      alert("세션이 만료되었습니다. 다시 로그인해주세요.");
      signOut({ callbackUrl: "/login" });
    }
  }, [status, session]);

  function handleNavigate(id: string) {
    const item = PLATFORM_NAV.flatMap((s) => s.items).find((i) => i.id === id);
    if (item?.href) router.push(item.href);
  }

  return (
    <div className="flex h-screen overflow-hidden bg-surface-canvas">
      <Sidebar
        variant="platform"
        sections={PLATFORM_NAV}
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
