"use client";

import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { Sidebar } from "@/components/layout/Sidebar";
import type { NavSection } from "@/components/layout/Sidebar";

const EMPLOYEE_NAV: NavSection[] = [
  {
    items: [
      { id: "home", label: "홈", href: "/employee" },
      { id: "schedule", label: "일정", href: "/employee/schedule" },
      { id: "requests", label: "요청", href: "/employee/requests", badge: 2 },
      { id: "inbox", label: "인박스", href: "/employee/inbox", badge: 3 },
      { id: "documents", label: "문서", href: "/employee/documents", badge: 1 },
      { id: "profile", label: "내 정보", href: "/employee/profile" },
    ],
  },
];

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
  const activeId = getActiveId(pathname);

  function handleNavigate(id: string) {
    const item = EMPLOYEE_NAV.flatMap((s) => s.items).find((i) => i.id === id);
    if (item?.href) router.push(item.href);
  }

  return (
    <div className="flex h-screen overflow-hidden bg-surface-canvas">
      <Sidebar
        variant="employee"
        sections={EMPLOYEE_NAV}
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
