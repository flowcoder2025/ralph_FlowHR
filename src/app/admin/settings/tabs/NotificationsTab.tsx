"use client";

import { useState } from "react";
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  DataTable,
  Badge,
} from "@/components/ui";
import type { Column } from "@/components/ui";
import { useToast } from "@/components/layout/Toast";

// ─── Types ──────────────────────────────────────────────────

interface NotificationRule {
  id: string;
  event: string;
  channels: string[];
  recipients: string;
  enabled: boolean;
}

// ─── Constants ──────────────────────────────────────────────

const INITIAL_NOTIFICATION_RULES: NotificationRule[] = [
  {
    id: "nr-1",
    event: "휴가 신청",
    channels: ["이메일", "Slack"],
    recipients: "직속 팀장",
    enabled: true,
  },
  {
    id: "nr-2",
    event: "초과근무 상한 도달",
    channels: ["이메일", "Slack", "SMS"],
    recipients: "팀장 + HR 담당",
    enabled: true,
  },
  {
    id: "nr-3",
    event: "체크아웃 누락",
    channels: ["Slack"],
    recipients: "본인 + 팀장",
    enabled: true,
  },
  {
    id: "nr-4",
    event: "급여 명세서 발행",
    channels: ["이메일"],
    recipients: "본인",
    enabled: true,
  },
  {
    id: "nr-5",
    event: "문서 서명 요청",
    channels: ["이메일", "Slack"],
    recipients: "수신자",
    enabled: true,
  },
  {
    id: "nr-6",
    event: "계약 만료 알림",
    channels: ["이메일"],
    recipients: "HR 담당 + 부서장",
    enabled: false,
  },
];

// ─── Helpers ────────────────────────────────────────────────

function getChannelBadgeVariant(
  channel: string,
): "info" | "danger" | "neutral" {
  if (channel === "SMS") return "danger";
  return "info";
}

// ─── Component ──────────────────────────────────────────────

export function NotificationsTab() {
  const { addToast } = useToast();
  const [rules, setRules] = useState<NotificationRule[]>(
    INITIAL_NOTIFICATION_RULES,
  );

  function handleToggle(id: string) {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)),
    );
  }

  const columns: Column<NotificationRule>[] = [
    {
      key: "event",
      header: "이벤트",
      render: (row) => (
        <span className="font-medium text-text-primary">{row.event}</span>
      ),
    },
    {
      key: "channels",
      header: "채널",
      render: (row) => (
        <div className="flex flex-wrap gap-sp-1">
          {row.channels.map((ch) => (
            <Badge key={ch} variant={getChannelBadgeVariant(ch)}>
              {ch}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      key: "recipients",
      header: "수신자",
      render: (row) => (
        <span className="text-text-secondary">{row.recipients}</span>
      ),
    },
    {
      key: "enabled",
      header: "상태",
      align: "center",
      width: "80px",
      render: (row) => (
        <button
          onClick={() => handleToggle(row.id)}
          className={[
            "relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-fast",
            row.enabled ? "bg-brand" : "bg-border",
          ].join(" ")}
          aria-label={row.enabled ? "알림 끄기" : "알림 켜기"}
        >
          <span
            className={[
              "inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform duration-fast shadow-sm",
              row.enabled ? "translate-x-[18px]" : "translate-x-[3px]",
            ].join(" ")}
          />
        </button>
      ),
    },
    {
      key: "actions",
      header: "액션",
      align: "center",
      width: "80px",
      render: (_row) => (
        <Button variant="ghost" size="sm" onClick={() => addToast({ message: "알림 규칙 설정은 관리자에게 문의하세요.", variant: "info" })}>
          편집
        </Button>
      ),
    },
  ];

  return (
    <Card>
      <CardHeader>
        <h2 className="text-md font-semibold text-text-primary">알림 규칙</h2>
        <Button size="sm" onClick={() => addToast({ message: "알림 규칙 설정은 관리자에게 문의하세요.", variant: "info" })}>규칙 추가</Button>
      </CardHeader>
      <CardBody>
        <DataTable<NotificationRule>
          columns={columns}
          data={rules}
          keyExtractor={(r) => r.id}
          emptyMessage="등록된 알림 규칙이 없습니다"
        />
      </CardBody>
    </Card>
  );
}
