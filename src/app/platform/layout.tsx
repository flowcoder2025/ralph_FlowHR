"use client";

import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import type { NavSection } from "@/components/layout/Sidebar";

const PLATFORM_NAV: NavSection[] = [
  {
    label: "메인",
    items: [
      { id: "overview", label: "개요", href: "/platform" },
      { id: "tenants", label: "테넌트 관리", href: "/platform/tenants" },
      { id: "billing", label: "플랜 & 빌링", href: "/platform/billing" },
    ],
  },
  {
    label: "운영",
    items: [
      { id: "support", label: "지원 운영", href: "/platform/support", badge: 8 },
      { id: "monitoring", label: "모니터링", href: "/platform/monitoring" },
      { id: "audit", label: "감사 & 보안", href: "/platform/audit" },
    ],
  },
  {
    label: "시스템",
    items: [
      { id: "settings", label: "설정", href: "/platform/settings" },
    ],
  },
];

function getActiveId(pathname: string): string {
  if (pathname === "/platform") return "overview";
  const segment = pathname.split("/")[2];
  return segment ?? "overview";
}

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const activeId = getActiveId(pathname);

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
      />
      <main className="flex-1 overflow-y-auto p-sp-8">{children}</main>
    </div>
  );
}
