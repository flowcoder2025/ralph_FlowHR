"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardBody,
  CardFooter,
  Badge,
  ProgressBar,
  QueueList,
  QueueItem,
} from "@/components/ui";

// ─── Types ──────────────────────────────────────────────────

interface OffboardingEmployee {
  employee: {
    id: string;
    name: string;
    department: string;
    position: string;
    resignDate: string | null;
  };
  tasks: OffboardingTask[];
}

interface OffboardingTask {
  id: string;
  title: string;
  description: string | null;
  category: string;
  status: string;
  dueDate: string | null;
  completedAt: string | null;
  sortOrder: number;
}

// ─── Constants ──────────────────────────────────────────────

const TASK_STATUS_LABELS: Record<string, string> = {
  PENDING: "미시작",
  IN_PROGRESS: "진행 중",
  COMPLETED: "완료",
  SKIPPED: "건너뜀",
};

const TASK_STATUS_VARIANTS: Record<string, "success" | "info" | "neutral" | "warning"> = {
  PENDING: "neutral",
  IN_PROGRESS: "info",
  COMPLETED: "success",
  SKIPPED: "warning",
};

// ─── Helpers ────────────────────────────────────────────────

function formatResignDate(dateStr: string | null): string {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function formatDueDate(dateStr: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${String(d.getDate()).padStart(2, "0")}`;
}

function getProgressVariant(completed: number, total: number): "success" | "brand" | "warning" {
  if (total === 0) return "brand";
  const ratio = completed / total;
  if (ratio >= 1) return "success";
  if (ratio >= 0.5) return "brand";
  return "warning";
}

// ─── Component ──────────────────────────────────────────────

export function OffboardingTab() {
  const [employees, setEmployees] = useState<OffboardingEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchOffboarding = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/recruiting/offboarding");
      if (res.ok) {
        const json = await res.json();
        setEmployees(json.data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOffboarding();
  }, [fetchOffboarding]);

  async function handleToggleStatus(task: OffboardingTask) {
    const newStatus = task.status === "COMPLETED" ? "PENDING" : "COMPLETED";
    setUpdating(task.id);

    setEmployees((prev) =>
      prev.map((emp) => ({
        ...emp,
        tasks: emp.tasks.map((t) =>
          t.id === task.id
            ? {
                ...t,
                status: newStatus,
                completedAt:
                  newStatus === "COMPLETED"
                    ? new Date().toISOString()
                    : null,
              }
            : t,
        ),
      })),
    );

    try {
      const res = await fetch("/api/recruiting/offboarding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId: task.id, status: newStatus }),
      });

      if (!res.ok) {
        fetchOffboarding();
      }
    } catch {
      fetchOffboarding();
    } finally {
      setUpdating(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-sp-12">
        <span className="text-sm text-text-tertiary">불러오는 중...</span>
      </div>
    );
  }

  if (employees.length === 0) {
    return (
      <div className="flex items-center justify-center py-sp-12">
        <span className="text-sm text-text-tertiary">
          오프보딩 대상자가 없습니다
        </span>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-sp-6 lg:grid-cols-2">
      {employees.map((emp) => {
        const total = emp.tasks.length;
        const completed = emp.tasks.filter(
          (t) => t.status === "COMPLETED",
        ).length;
        const isAllDone = completed === total && total > 0;

        return (
          <Card key={emp.employee.id}>
            <CardHeader>
              <div>
                <CardTitle>
                  {emp.employee.name} &mdash; 오프보딩
                </CardTitle>
                <p className="mt-sp-1 text-sm text-text-tertiary">
                  {emp.employee.department} &middot;{" "}
                  {emp.employee.position} &middot; 퇴사일{" "}
                  {formatResignDate(emp.employee.resignDate)}
                </p>
              </div>
              <Badge variant={isAllDone ? "success" : "info"}>
                {isAllDone ? "완료" : "진행 중"} ({completed}/{total})
              </Badge>
            </CardHeader>
            <CardBody>
              <ProgressBar
                value={completed}
                max={total}
                variant={getProgressVariant(completed, total)}
                showValue
                className="mb-sp-4"
              />
              <QueueList>
                {emp.tasks.map((task) => {
                  const isDone = task.status === "COMPLETED";
                  const dueDateStr = task.dueDate
                    ? task.status === "PENDING"
                      ? `${formatDueDate(task.dueDate)} 예정`
                      : ""
                    : "";
                  const statusLabel =
                    dueDateStr ||
                    TASK_STATUS_LABELS[task.status] ||
                    task.status;

                  return (
                    <QueueItem
                      key={task.id}
                      title={task.title}
                      meta={task.category}
                      action={
                        <div className="flex items-center gap-sp-2">
                          <Badge
                            variant={
                              TASK_STATUS_VARIANTS[task.status] ?? "neutral"
                            }
                          >
                            {statusLabel}
                          </Badge>
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(task)}
                            disabled={updating === task.id}
                            className={[
                              "flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors",
                              isDone
                                ? "border-status-success-solid bg-status-success-solid text-white"
                                : "border-border bg-surface-primary hover:border-brand",
                              updating === task.id ? "opacity-50" : "",
                            ].join(" ")}
                            aria-label={isDone ? "완료 취소" : "완료 처리"}
                          >
                            {isDone && (
                              <svg
                                width="12"
                                height="12"
                                viewBox="0 0 12 12"
                                fill="none"
                              >
                                <path
                                  d="M2.5 6L5 8.5L9.5 3.5"
                                  stroke="currentColor"
                                  strokeWidth="1.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            )}
                          </button>
                        </div>
                      }
                    />
                  );
                })}
              </QueueList>
            </CardBody>
            <CardFooter>
              <span className="text-xs text-text-tertiary">
                {emp.tasks.filter((t) => t.status === "IN_PROGRESS").length}건
                진행 중 &middot;{" "}
                {emp.tasks.filter((t) => t.status === "PENDING").length}건 대기
              </span>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
