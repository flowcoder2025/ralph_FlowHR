"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import {
  KPICard,
  KPIGrid,
  Badge,
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardBody,
  CardFooter,
  QueueList,
  QueueItem,
  Input,
  Select,
  Textarea,
} from "@/components/ui";
import type { BadgeVariant } from "@/components/ui";
import { Drawer } from "@/components/layout/Drawer";

// ─── Types ──────────────────────────────────────────────

interface KPIData {
  unresolvedTickets: { value: number; delta: number };
  slaViolations: { value: number; label: string };
  avgResponseTime: { value: number; unit: string; delta: number };
  csat: { value: number; max: number; label: string };
}

interface TicketItem {
  id: string;
  ticketNumber: string;
  title: string;
  description: string | null;
  tenantName: string;
  priority: "critical" | "high" | "medium" | "low";
  status: string;
  category: string;
  requesterName: string;
  requesterEmail: string;
  assigneeId: string | null;
  ageLabel: string;
  slaStatus: "ok" | "warning" | "violated";
  slaRemaining: string;
  slaDeadlineAt: string | null;
  createdAt: string;
}

interface TicketDetail {
  id: string;
  ticketNumber: string;
  title: string;
  description: string | null;
  tenantName: string;
  tenantDomain: string;
  priority: string;
  status: string;
  category: string;
  requesterName: string;
  requesterEmail: string;
  assigneeId: string | null;
  slaDeadlineAt: string | null;
  slaStatus: string;
  slaRemaining: string;
  resolvedAt: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface StatusCounts {
  total: number;
  open: number;
  inProgress: number;
  waiting: number;
  resolved: number;
  closed: number;
}

interface SupportData {
  kpi: KPIData;
  queue: TicketItem[];
  statusCounts: StatusCounts;
}

// ─── Constants ──────────────────────────────────────────

const PRIORITY_FILTER_OPTIONS = [
  { value: "", label: "전체 우선순위" },
  { value: "CRITICAL", label: "긴급" },
  { value: "HIGH", label: "높음" },
  { value: "MEDIUM", label: "보통" },
  { value: "LOW", label: "낮음" },
];

const STATUS_FILTER_OPTIONS = [
  { value: "", label: "미해결 전체" },
  { value: "OPEN", label: "열림" },
  { value: "IN_PROGRESS", label: "처리중" },
  { value: "WAITING", label: "대기" },
  { value: "RESOLVED", label: "해결" },
  { value: "CLOSED", label: "종료" },
];

const PRIORITY_BADGE: Record<string, { label: string; variant: BadgeVariant }> =
  {
    CRITICAL: { label: "긴급", variant: "danger" },
    HIGH: { label: "높음", variant: "warning" },
    MEDIUM: { label: "보통", variant: "info" },
    LOW: { label: "낮음", variant: "neutral" },
  };

const STATUS_BADGE: Record<string, { label: string; variant: BadgeVariant }> = {
  OPEN: { label: "열림", variant: "info" },
  IN_PROGRESS: { label: "처리중", variant: "warning" },
  WAITING: { label: "대기", variant: "neutral" },
  RESOLVED: { label: "해결", variant: "success" },
  CLOSED: { label: "종료", variant: "neutral" },
};

const CATEGORY_LABELS: Record<string, string> = {
  BUG: "버그",
  FEATURE_REQUEST: "기능 요청",
  QUESTION: "문의",
  MIGRATION: "마이그레이션",
  SECURITY: "보안",
  BILLING: "결제",
};

// ─── Component ──────────────────────────────────────────

export default function SupportPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-sp-12">
          <span className="text-sm text-text-tertiary">불러오는 중...</span>
        </div>
      }
    >
      <SupportContent />
    </Suspense>
  );
}

function SupportContent() {
  const [data, setData] = useState<SupportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [priorityFilter, setPriorityFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [detail, setDetail] = useState<TicketDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Notice composer state
  const [noticeTitle, setNoticeTitle] = useState("");
  const [noticeContent, setNoticeContent] = useState("");
  const [noticeChannels, setNoticeChannels] = useState({
    inApp: true,
    email: false,
    sms: false,
  });

  const fetchSupport = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (priorityFilter) params.set("priority", priorityFilter);
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/platform/support?${params.toString()}`);
      if (res.ok) {
        const json: SupportData = await res.json();
        setData(json);
      }
    } finally {
      setLoading(false);
    }
  }, [priorityFilter, statusFilter]);

  useEffect(() => {
    fetchSupport();
  }, [fetchSupport]);

  const fetchDetail = useCallback(async (id: string) => {
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/platform/support/${id}`);
      if (res.ok) {
        const json: TicketDetail = await res.json();
        setDetail(json);
      }
    } finally {
      setDetailLoading(false);
    }
  }, []);

  function handleTicketClick(ticket: TicketItem) {
    setSelectedTicketId(ticket.id);
    setDrawerOpen(true);
    fetchDetail(ticket.id);
  }

  function handlePriorityChange(value: string) {
    setPriorityFilter(value);
  }

  function handleStatusChange(value: string) {
    setStatusFilter(value);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-sp-12">
        <span className="text-sm text-text-tertiary">불러오는 중...</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center py-sp-12">
        <span className="text-sm text-text-tertiary">
          데이터를 불러올 수 없습니다
        </span>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-sp-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">서포트</h1>
          <p className="mt-sp-1 text-md text-text-secondary">
            티켓 큐 · SLA 모니터링 · 공지 발송
          </p>
        </div>
        <div className="flex items-center gap-sp-3">
          <Button variant="secondary" size="sm">
            내보내기
          </Button>
          <Button variant="primary" size="sm">
            티켓 생성
          </Button>
        </div>
      </div>

      {/* KPI Row (4 cols) */}
      <KPIGrid columns={4}>
        <KPICard
          eyebrow="미해결 티켓"
          value={data.kpi.unresolvedTickets.value}
          label="전일 대비"
          delta={
            data.kpi.unresolvedTickets.delta !== 0
              ? `${data.kpi.unresolvedTickets.delta > 0 ? "+" : ""}${data.kpi.unresolvedTickets.delta}건`
              : undefined
          }
          deltaDirection={
            data.kpi.unresolvedTickets.delta > 0 ? "up" : "neutral"
          }
          emphasis
        />
        <KPICard
          eyebrow="SLA 위반"
          value={data.kpi.slaViolations.value}
          label={data.kpi.slaViolations.label}
        />
        <KPICard
          eyebrow="평균 응답시간"
          value={`${data.kpi.avgResponseTime.value}${data.kpi.avgResponseTime.unit}`}
          label="평균 해결 시간"
          delta={
            data.kpi.avgResponseTime.delta !== 0
              ? `${data.kpi.avgResponseTime.delta}h`
              : undefined
          }
          deltaDirection={
            data.kpi.avgResponseTime.delta < 0 ? "down" : "neutral"
          }
        />
        <KPICard
          eyebrow="만족도 (CSAT)"
          value={`${data.kpi.csat.value} / ${data.kpi.csat.max}`}
          label={data.kpi.csat.label}
        />
      </KPIGrid>

      {/* Ticket Queue + Notice Composer */}
      <div className="mt-sp-6 grid grid-cols-1 gap-sp-6 lg:grid-cols-3">
        {/* Ticket Queue (2 cols) */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              티켓 수신함{" "}
              <Badge variant="info">{data.statusCounts.open}</Badge>
            </CardTitle>
            <div className="flex gap-sp-2">
              <Select
                options={PRIORITY_FILTER_OPTIONS}
                value={priorityFilter}
                onChange={(e) => handlePriorityChange(e.target.value)}
              />
              <Select
                options={STATUS_FILTER_OPTIONS}
                value={statusFilter}
                onChange={(e) => handleStatusChange(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardBody>
            {data.queue.length > 0 ? (
              <QueueList>
                {data.queue.map((ticket) => (
                  <QueueItem
                    key={ticket.id}
                    priority={ticket.priority}
                    title={
                      <button
                        type="button"
                        className="text-left hover:text-brand transition-colors"
                        onClick={() => handleTicketClick(ticket)}
                      >
                        <span className="font-semibold">{ticket.title}</span>
                        <span className="ml-sp-2 text-xs text-text-tertiary">
                          {ticket.ticketNumber}
                        </span>
                      </button>
                    }
                    meta={
                      <span className="flex items-center gap-sp-2">
                        <span>{ticket.tenantName}</span>
                        <span>·</span>
                        <span>{ticket.ageLabel}</span>
                        {ticket.slaRemaining && (
                          <>
                            <span>·</span>
                            <span
                              className={
                                ticket.slaStatus === "violated"
                                  ? "font-semibold text-status-danger-text"
                                  : ticket.slaStatus === "warning"
                                    ? "font-semibold text-status-warning-text"
                                    : "text-text-tertiary"
                              }
                            >
                              {ticket.slaRemaining}
                            </span>
                          </>
                        )}
                      </span>
                    }
                    action={
                      <Button
                        variant={
                          ticket.priority === "critical" ? "primary" : "secondary"
                        }
                        size="sm"
                        onClick={() => handleTicketClick(ticket)}
                      >
                        {ticket.priority === "critical" ? "즉시 확인" : "상세"}
                      </Button>
                    }
                  />
                ))}
              </QueueList>
            ) : (
              <div className="flex items-center justify-center py-sp-8">
                <span className="text-sm text-text-tertiary">
                  해당 조건의 티켓이 없습니다
                </span>
              </div>
            )}
          </CardBody>
          <CardFooter>
            <span className="text-xs text-text-tertiary">
              전체 {data.statusCounts.total}건 · 열림{" "}
              {data.statusCounts.open} · 처리중{" "}
              {data.statusCounts.inProgress} · 대기{" "}
              {data.statusCounts.waiting}
            </span>
          </CardFooter>
        </Card>

        {/* Notice Composer (1 col) */}
        <Card>
          <CardHeader>
            <CardTitle>공지 발송</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="flex flex-col gap-sp-4">
              <div>
                <label className="mb-sp-1 block text-xs font-medium text-text-secondary">
                  제목
                </label>
                <Input
                  value={noticeTitle}
                  onChange={(e) => setNoticeTitle(e.target.value)}
                  placeholder="공지 제목 입력..."
                />
              </div>
              <div>
                <label className="mb-sp-1 block text-xs font-medium text-text-secondary">
                  대상 테넌트
                </label>
                <Select
                  options={[
                    { value: "all", label: "전체 테넌트" },
                    { value: "active", label: "활성 테넌트만" },
                    { value: "enterprise", label: "Enterprise 플랜" },
                  ]}
                  value="all"
                  onChange={() => {}}
                />
              </div>
              <div>
                <label className="mb-sp-1 block text-xs font-medium text-text-secondary">
                  전송 채널
                </label>
                <div className="flex gap-sp-3">
                  {(
                    [
                      ["inApp", "인앱"],
                      ["email", "이메일"],
                      ["sms", "SMS"],
                    ] as const
                  ).map(([key, label]) => (
                    <label
                      key={key}
                      className="flex items-center gap-sp-1 text-sm text-text-secondary"
                    >
                      <input
                        type="checkbox"
                        checked={noticeChannels[key]}
                        onChange={(e) =>
                          setNoticeChannels((prev) => ({
                            ...prev,
                            [key]: e.target.checked,
                          }))
                        }
                        className="rounded border-border"
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-sp-1 block text-xs font-medium text-text-secondary">
                  내용
                </label>
                <Textarea
                  value={noticeContent}
                  onChange={(e) => setNoticeContent(e.target.value)}
                  placeholder="공지 내용을 입력하세요..."
                  rows={4}
                />
              </div>
            </div>
          </CardBody>
          <CardFooter>
            <div className="flex gap-sp-2">
              <Button variant="primary" size="sm">
                발송
              </Button>
              <Button variant="secondary" size="sm">
                미리보기
              </Button>
              <Button variant="ghost" size="sm">
                임시저장
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>

      {/* Ticket Detail Drawer */}
      <Drawer
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedTicketId(null);
          setDetail(null);
        }}
        title={
          detail
            ? `${detail.ticketNumber} — ${detail.title}`
            : "티켓 상세"
        }
        size="lg"
        footer={
          detail ? (
            <div className="flex gap-sp-2">
              <Button variant="primary" size="sm">
                담당자 배정
              </Button>
              <Button variant="secondary" size="sm">
                답변 작성
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-status-danger-text"
              >
                에스컬레이션
              </Button>
            </div>
          ) : undefined
        }
      >
        {detailLoading ? (
          <div className="flex items-center justify-center py-sp-12">
            <span className="text-sm text-text-tertiary">불러오는 중...</span>
          </div>
        ) : detail ? (
          <TicketDetailPanel detail={detail} />
        ) : (
          <div className="flex items-center justify-center py-sp-12">
            <span className="text-sm text-text-tertiary">
              데이터를 불러올 수 없습니다
            </span>
          </div>
        )}
      </Drawer>
    </div>
  );
}

// ─── Ticket Detail Panel ────────────────────────────────

function StatRow({
  label,
  value,
  badge,
}: {
  label: string;
  value?: string;
  badge?: { text: string; variant: BadgeVariant };
}) {
  return (
    <div className="flex items-center justify-between border-b border-border-subtle py-sp-3 last:border-b-0">
      <span className="text-sm text-text-secondary">{label}</span>
      <span className="flex items-center gap-sp-2">
        {value && (
          <span className="text-sm font-semibold text-text-primary">
            {value}
          </span>
        )}
        {badge && <Badge variant={badge.variant}>{badge.text}</Badge>}
      </span>
    </div>
  );
}

function TicketDetailPanel({ detail }: { detail: TicketDetail }) {
  const priBadge = PRIORITY_BADGE[detail.priority];
  const stsBadge = STATUS_BADGE[detail.status];

  return (
    <div className="flex flex-col gap-sp-6">
      {/* 티켓 정보 */}
      <div>
        <h3 className="mb-sp-2 text-sm font-medium text-text-tertiary">
          티켓 정보
        </h3>
        <StatRow label="티켓 번호" value={detail.ticketNumber} />
        <StatRow
          label="우선순위"
          badge={
            priBadge
              ? { text: priBadge.label, variant: priBadge.variant }
              : { text: detail.priority, variant: "neutral" }
          }
        />
        <StatRow
          label="상태"
          badge={
            stsBadge
              ? { text: stsBadge.label, variant: stsBadge.variant }
              : { text: detail.status, variant: "neutral" }
          }
        />
        <StatRow
          label="카테고리"
          value={CATEGORY_LABELS[detail.category] ?? detail.category}
        />
        <StatRow
          label="SLA"
          value={detail.slaRemaining || "—"}
          badge={
            detail.slaStatus === "violated"
              ? { text: "위반", variant: "danger" }
              : detail.slaStatus === "warning"
                ? { text: "임박", variant: "warning" }
                : undefined
          }
        />
      </div>

      {/* 테넌트 & 요청자 */}
      <div>
        <h3 className="mb-sp-2 text-sm font-medium text-text-tertiary">
          테넌트 & 요청자
        </h3>
        <StatRow label="테넌트" value={detail.tenantName} />
        <StatRow label="도메인" value={detail.tenantDomain} />
        <StatRow label="요청자" value={detail.requesterName} />
        <StatRow label="이메일" value={detail.requesterEmail} />
        {detail.assigneeId && (
          <StatRow label="담당자" value={detail.assigneeId} />
        )}
      </div>

      {/* 상세 내용 */}
      {detail.description && (
        <div>
          <h3 className="mb-sp-2 text-sm font-medium text-text-tertiary">
            설명
          </h3>
          <p className="whitespace-pre-wrap text-sm text-text-primary leading-relaxed">
            {detail.description}
          </p>
        </div>
      )}

      {/* 타임라인 */}
      <div>
        <h3 className="mb-sp-2 text-sm font-medium text-text-tertiary">
          타임라인
        </h3>
        <StatRow
          label="생성"
          value={new Date(detail.createdAt).toLocaleString("ko-KR")}
        />
        <StatRow
          label="최종 수정"
          value={new Date(detail.updatedAt).toLocaleString("ko-KR")}
        />
        {detail.resolvedAt && (
          <StatRow
            label="해결"
            value={new Date(detail.resolvedAt).toLocaleString("ko-KR")}
          />
        )}
        {detail.closedAt && (
          <StatRow
            label="종료"
            value={new Date(detail.closedAt).toLocaleString("ko-KR")}
          />
        )}
      </div>
    </div>
  );
}
