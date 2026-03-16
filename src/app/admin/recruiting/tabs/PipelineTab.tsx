"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { DragEvent } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardBody,
  Badge,
  Select,
} from "@/components/ui";

// ─── Types ──────────────────────────────────────────────────

interface PipelineApplication {
  id: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone: string | null;
  status: string;
  stage: number;
  rating: number | null;
  notes: string | null;
  appliedAt: string;
  hiredAt: string | null;
  rejectedAt: string | null;
  jobPostingId: string;
  jobPosting: { title: string };
}

interface PipelinePostingOption {
  id: string;
  title: string;
  status: string;
  _count: { applications: number };
}

// ─── Constants ──────────────────────────────────────────────

const PIPELINE_COLUMNS = [
  { status: "SCREENING", stage: 1, label: "서류 접수" },
  { status: "FIRST_INTERVIEW", stage: 2, label: "1차 면접" },
  { status: "SECOND_INTERVIEW", stage: 3, label: "2차 면접" },
  { status: "FINAL", stage: 4, label: "최종" },
] as const;

const PIPELINE_STATUS_MAP: Record<string, string> = {
  APPLIED: "SCREENING",
  SCREENING: "SCREENING",
  FIRST_INTERVIEW: "FIRST_INTERVIEW",
  SECOND_INTERVIEW: "SECOND_INTERVIEW",
  FINAL: "FINAL",
};

const APP_STATUS_BADGES: Record<string, { label: string; variant: "info" | "success" | "neutral" | "warning" | "danger" }> = {
  OFFER: { label: "오퍼 발송", variant: "success" },
  HIRED: { label: "채용 확정", variant: "success" },
  REJECTED: { label: "불합격", variant: "danger" },
  WITHDRAWN: { label: "지원 철회", variant: "neutral" },
};

// ─── Component ──────────────────────────────────────────────

export default function PipelineTab() {
  const [applications, setApplications] = useState<PipelineApplication[]>([]);
  const [postings, setPostings] = useState<PipelinePostingOption[]>([]);
  const [selectedPostingId, setSelectedPostingId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [draggedAppId, setDraggedAppId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const dragCounterRef = useRef<Record<string, number>>({});

  const fetchPostings = useCallback(async () => {
    const res = await fetch("/api/recruiting/postings");
    if (res.ok) {
      const json = await res.json();
      const openPostings = (json.data as PipelinePostingOption[]).filter(
        (p) => p.status === "OPEN",
      );
      setPostings(openPostings);
      if (openPostings.length > 0 && !selectedPostingId) {
        setSelectedPostingId(openPostings[0].id);
      }
    }
  }, [selectedPostingId]);

  const fetchApplications = useCallback(async () => {
    if (!selectedPostingId) {
      setApplications([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `/api/recruiting/applications?jobPostingId=${selectedPostingId}`,
      );
      if (res.ok) {
        const json = await res.json();
        setApplications(json.data);
      }
    } finally {
      setLoading(false);
    }
  }, [selectedPostingId]);

  useEffect(() => {
    fetchPostings();
  }, [fetchPostings]);

  useEffect(() => {
    if (selectedPostingId) {
      fetchApplications();
    }
  }, [selectedPostingId, fetchApplications]);

  function getColumnApps(columnStatus: string): PipelineApplication[] {
    return applications.filter((app) => {
      const mapped = PIPELINE_STATUS_MAP[app.status];
      return mapped === columnStatus;
    });
  }

  function handleDragStart(e: DragEvent<HTMLDivElement>, appId: string) {
    setDraggedAppId(appId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", appId);
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = "0.5";
    }
  }

  function handleDragEnd(e: DragEvent<HTMLDivElement>) {
    setDraggedAppId(null);
    setDragOverColumn(null);
    dragCounterRef.current = {};
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = "1";
    }
  }

  function handleDragEnter(e: DragEvent<HTMLDivElement>, columnStatus: string) {
    e.preventDefault();
    const counters = dragCounterRef.current;
    counters[columnStatus] = (counters[columnStatus] || 0) + 1;
    setDragOverColumn(columnStatus);
  }

  function handleDragLeave(_e: DragEvent<HTMLDivElement>, columnStatus: string) {
    const counters = dragCounterRef.current;
    counters[columnStatus] = (counters[columnStatus] || 0) - 1;
    if (counters[columnStatus] <= 0) {
      counters[columnStatus] = 0;
      if (dragOverColumn === columnStatus) {
        setDragOverColumn(null);
      }
    }
  }

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  async function handleDrop(e: DragEvent<HTMLDivElement>, targetColumn: typeof PIPELINE_COLUMNS[number]) {
    e.preventDefault();
    setDragOverColumn(null);
    dragCounterRef.current = {};

    const appId = e.dataTransfer.getData("text/plain");
    if (!appId) return;

    const app = applications.find((a) => a.id === appId);
    if (!app) return;

    const currentMapped = PIPELINE_STATUS_MAP[app.status];
    if (currentMapped === targetColumn.status) return;

    setApplications((prev) =>
      prev.map((a) =>
        a.id === appId
          ? { ...a, status: targetColumn.status, stage: targetColumn.stage }
          : a,
      ),
    );

    try {
      const res = await fetch(`/api/recruiting/applications/${appId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: targetColumn.status,
          stage: targetColumn.stage,
        }),
      });

      if (!res.ok) {
        fetchApplications();
      }
    } catch {
      fetchApplications();
    }
  }

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString("ko-KR", {
      month: "numeric",
      day: "numeric",
    });
  }

  function renderStars(rating: number | null): string {
    if (!rating) return "";
    return Array.from({ length: 5 }, (_, i) => (i < rating ? "\u2605" : "\u2606")).join("");
  }

  const selectedPosting = postings.find((p) => p.id === selectedPostingId);

  if (loading && postings.length === 0) {
    return (
      <div className="flex items-center justify-center py-sp-12">
        <span className="text-sm text-text-tertiary">불러오는 중...</span>
      </div>
    );
  }

  if (postings.length === 0) {
    return (
      <div className="flex items-center justify-center py-sp-12">
        <span className="text-sm text-text-tertiary">
          진행 중인 채용 공고가 없습니다
        </span>
      </div>
    );
  }

  return (
    <div>
      {/* Posting selector */}
      <div className="mb-sp-4 flex items-center gap-sp-4">
        <Select
          label=""
          options={postings.map((p) => ({
            value: p.id,
            label: `${p.title} (${p._count.applications}명)`,
          }))}
          value={selectedPostingId}
          onChange={(e) => setSelectedPostingId(e.target.value)}
        />
        {selectedPosting && (
          <span className="text-sm text-text-secondary">
            총 {applications.length}명 지원
          </span>
        )}
      </div>

      {/* Kanban Board */}
      {loading ? (
        <div className="flex items-center justify-center py-sp-12">
          <span className="text-sm text-text-tertiary">불러오는 중...</span>
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-sp-4">
          {PIPELINE_COLUMNS.map((col) => {
            const columnApps = getColumnApps(col.status);
            const isOver = dragOverColumn === col.status;

            return (
              <div
                key={col.status}
                onDragEnter={(e) => handleDragEnter(e, col.status)}
                onDragLeave={(e) => handleDragLeave(e, col.status)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, col)}
                className={[
                  "rounded-md border-2 transition-colors duration-fast",
                  isOver && draggedAppId
                    ? "border-brand bg-brand/5"
                    : "border-transparent",
                ].join(" ")}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>{col.label}</CardTitle>
                    <Badge variant={col.status === "FINAL" ? "success" : "info"}>
                      {columnApps.length}명
                    </Badge>
                  </CardHeader>
                  <CardBody>
                    <div className="flex flex-col gap-sp-3">
                      {columnApps.length === 0 ? (
                        <div className="flex items-center justify-center py-sp-6">
                          <span className="text-xs text-text-tertiary">
                            지원자 없음
                          </span>
                        </div>
                      ) : (
                        columnApps.map((app) => {
                          const extraBadge = APP_STATUS_BADGES[app.status];
                          return (
                            <div
                              key={app.id}
                              draggable
                              onDragStart={(e) => handleDragStart(e, app.id)}
                              onDragEnd={handleDragEnd}
                              className={[
                                "cursor-grab rounded-md border border-border bg-surface-primary p-sp-3",
                                "transition-shadow duration-fast hover:shadow-md",
                                "active:cursor-grabbing",
                                draggedAppId === app.id ? "opacity-50" : "",
                              ].join(" ")}
                            >
                              <div className="flex items-center gap-sp-2">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand/10 text-sm font-semibold text-brand-text">
                                  {app.candidateName.charAt(0)}
                                </div>
                                <span className="font-semibold text-text-primary">
                                  {app.candidateName}
                                </span>
                              </div>
                              <div className="mt-sp-1 text-xs text-text-tertiary">
                                {formatDate(app.appliedAt)} 접수
                                {app.rating ? (
                                  <span className="ml-sp-2 text-yellow-500">
                                    {renderStars(app.rating)}
                                  </span>
                                ) : null}
                              </div>
                              {app.notes && (
                                <div className="mt-sp-1 truncate text-xs text-text-secondary">
                                  {app.notes}
                                </div>
                              )}
                              {extraBadge && (
                                <div className="mt-sp-2">
                                  <Badge variant={extraBadge.variant}>
                                    {extraBadge.label}
                                  </Badge>
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </CardBody>
                </Card>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
