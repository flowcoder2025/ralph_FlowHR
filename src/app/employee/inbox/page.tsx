"use client";

import { useState, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui";
import type { BadgeVariant } from "@/components/ui";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

const TYPE_BADGE: Record<string, { label: string; variant: BadgeVariant }> = {
  APPROVAL: { label: "결재", variant: "info" },
  LEAVE: { label: "휴가", variant: "success" },
  ATTENDANCE: { label: "근태", variant: "warning" },
  DOCUMENT: { label: "문서", variant: "neutral" },
  PAYROLL: { label: "급여", variant: "info" },
  SYSTEM: { label: "시스템", variant: "neutral" },
};

export default function InboxPage() {
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const readParam = filter === "unread" ? "&read=false" : "";
      const res = await fetch(`/api/employee/notifications?page=1&pageSize=50${readParam}`);
      if (res.ok) {
        const json = await res.json();
        setNotifications(json.data ?? []);
        setUnreadCount(json.unreadCount ?? 0);
      }
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  async function handleMarkRead(id: string) {
    const res = await fetch("/api/employee/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
      setUnreadCount((c) => Math.max(0, c - 1));
    }
  }

  return (
    <div>
      <div className="mb-sp-6">
        <h1 className="text-3xl font-bold text-text-primary">수신함</h1>
        <p className="mt-sp-1 text-md text-text-secondary">
          알림, 결재 요청, 공지사항을 확인합니다
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-sp-4 flex gap-sp-2">
        <button
          onClick={() => setFilter("all")}
          className={`rounded-full border px-sp-3 py-sp-1 text-xs font-medium transition-colors ${filter === "all" ? "border-brand bg-brand-soft text-brand-text" : "border-border text-text-secondary hover:bg-surface-secondary"}`}
        >
          전체 ({notifications.length})
        </button>
        <button
          onClick={() => setFilter("unread")}
          className={`rounded-full border px-sp-3 py-sp-1 text-xs font-medium transition-colors ${filter === "unread" ? "border-brand bg-brand-soft text-brand-text" : "border-border text-text-secondary hover:bg-surface-secondary"}`}
        >
          안 읽음 ({unreadCount})
        </button>
      </div>

      {/* List */}
      <div className="rounded-lg border border-border bg-surface-primary shadow-xs">
        {loading ? (
          <div className="flex items-center justify-center py-sp-12">
            <span className="text-sm text-text-tertiary">불러오는 중...</span>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex items-center justify-center py-sp-12">
            <span className="text-sm text-text-tertiary">
              {filter === "unread" ? "안 읽은 알림이 없습니다" : "수신함이 비어 있습니다"}
            </span>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {notifications.map((n) => {
              const typeInfo = TYPE_BADGE[n.type] || { label: n.type, variant: "neutral" as BadgeVariant };
              return (
                <div
                  key={n.id}
                  className={`flex items-start gap-sp-3 px-sp-4 py-sp-3 transition-colors hover:bg-surface-secondary cursor-pointer ${!n.read ? "bg-brand-soft/20" : ""}`}
                  onClick={() => !n.read && handleMarkRead(n.id)}
                >
                  <div className="mt-0.5">
                    {!n.read && <span className="block h-2 w-2 rounded-full bg-brand" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-sp-2">
                      <Badge variant={typeInfo.variant}>{typeInfo.label}</Badge>
                      <span className="text-sm font-medium text-text-primary truncate">{n.title}</span>
                    </div>
                    <p className="mt-sp-1 text-xs text-text-tertiary truncate">{n.message}</p>
                  </div>
                  <span className="shrink-0 text-xs text-text-tertiary">
                    {new Date(n.createdAt).toLocaleDateString("ko-KR")}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
