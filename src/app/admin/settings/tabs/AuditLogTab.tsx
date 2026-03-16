"use client";

import { useState } from "react";
import {
  Card,
  CardHeader,
  CardBody,
  Badge,
  Button,
  DataTable,
} from "@/components/ui";
import type { Column } from "@/components/ui";
import { exportToCSV } from "@/lib/export";

// ─── Types ──────────────────────────────────────────────────

interface AuditLogEntry {
  id: string;
  timestamp: string;
  user: string;
  role: string;
  roleBadge: "success" | "info" | "neutral";
  action: string;
  target: string;
  ip: string;
}

// ─── Constants ──────────────────────────────────────────────

const AUDIT_LOG_DATA: AuditLogEntry[] = [
  {
    id: "al-1",
    timestamp: "2026.03.12 14:32:18",
    user: "박유리",
    role: "HR 관리자",
    roleBadge: "info",
    action: "구성원 상태 변경",
    target: "정현우 (재직 중 → 퇴사 예정)",
    ip: "192.168.1.45",
  },
  {
    id: "al-2",
    timestamp: "2026.03.12 13:15:42",
    user: "김상훈",
    role: "슈퍼 관리자",
    roleBadge: "success",
    action: "역할 권한 수정",
    target: "급여 담당자 역할 — 리포트 읽기 권한 추가",
    ip: "192.168.1.10",
  },
  {
    id: "al-3",
    timestamp: "2026.03.12 11:08:33",
    user: "박유리",
    role: "HR 관리자",
    roleBadge: "info",
    action: "휴가 승인",
    target: "박서준 — 연차 3/20~21",
    ip: "192.168.1.45",
  },
  {
    id: "al-4",
    timestamp: "2026.03.12 10:30:05",
    user: "박유리",
    role: "HR 관리자",
    roleBadge: "info",
    action: "문서 발송",
    target: "강지민 — 근로계약서 발송",
    ip: "192.168.1.45",
  },
  {
    id: "al-5",
    timestamp: "2026.03.12 09:22:17",
    user: "김상훈",
    role: "슈퍼 관리자",
    roleBadge: "success",
    action: "시스템 설정 변경",
    target: "기본 근무 시간 09:00~18:00 확인",
    ip: "192.168.1.10",
  },
  {
    id: "al-6",
    timestamp: "2026.03.11 17:45:28",
    user: "인사팀 시스템",
    role: "시스템",
    roleBadge: "neutral",
    action: "자동 알림 발송",
    target: "체크아웃 누락 알림 4건 발송",
    ip: "10.0.0.1",
  },
  {
    id: "al-7",
    timestamp: "2026.03.11 16:30:12",
    user: "강태호",
    role: "부서장",
    roleBadge: "info",
    action: "초과근무 승인",
    target: "최도윤 — 3/11 야간근무 승인",
    ip: "192.168.1.72",
  },
];

const AUDIT_PAGE_SIZE = 7;
const AUDIT_TOTAL = 4521;

// ─── Component ──────────────────────────────────────────────

export default function AuditLogTab() {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const filtered = AUDIT_LOG_DATA.filter((entry) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      entry.user.toLowerCase().includes(q) ||
      entry.action.toLowerCase().includes(q) ||
      entry.target.toLowerCase().includes(q)
    );
  });

  const totalPages = Math.ceil(AUDIT_TOTAL / AUDIT_PAGE_SIZE);
  const startIdx = (currentPage - 1) * AUDIT_PAGE_SIZE;
  const displayed = filtered.slice(0, AUDIT_PAGE_SIZE);

  function handleExport() {
    const columns = [
      { key: "timestamp", label: "시간" },
      { key: "user", label: "사용자" },
      { key: "role", label: "역할" },
      { key: "action", label: "액션" },
      { key: "target", label: "대상" },
      { key: "ip", label: "IP" },
    ];
    exportToCSV(columns, AUDIT_LOG_DATA as unknown as Record<string, unknown>[], `audit-log-${new Date().toISOString().slice(0, 10)}.csv`);
  }

  function getPageNumbers(): (number | "ellipsis")[] {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (currentPage <= 3) return [1, 2, 3, "ellipsis", totalPages];
    if (currentPage >= totalPages - 2)
      return [1, "ellipsis", totalPages - 2, totalPages - 1, totalPages];
    return [1, "ellipsis", currentPage, "ellipsis", totalPages];
  }

  const columns: Column<AuditLogEntry>[] = [
    {
      key: "timestamp",
      header: "시간",
      width: "170px",
      render: (row) => (
        <span className="text-sm text-text-secondary tabular-nums">
          {row.timestamp}
        </span>
      ),
    },
    {
      key: "user",
      header: "사용자",
      render: (row) => (
        <span className="font-medium text-text-primary">{row.user}</span>
      ),
    },
    {
      key: "role",
      header: "역할",
      width: "120px",
      render: (row) => <Badge variant={row.roleBadge}>{row.role}</Badge>,
    },
    {
      key: "action",
      header: "액션",
      render: (row) => (
        <span className="text-text-primary">{row.action}</span>
      ),
    },
    {
      key: "target",
      header: "대상",
      render: (row) => (
        <span className="text-text-secondary">{row.target}</span>
      ),
    },
    {
      key: "ip",
      header: "IP",
      width: "130px",
      render: (row) => (
        <span className="text-sm text-text-tertiary tabular-nums">
          {row.ip}
        </span>
      ),
    },
  ];

  return (
    <Card>
      <CardHeader>
        <h2 className="text-md font-semibold text-text-primary">감사 로그</h2>
        <div className="flex items-center gap-sp-2">
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="사용자, 액션 검색..."
            className="px-sp-3 py-sp-1.5 border rounded-sm text-sm bg-surface-primary text-text-primary transition-colors duration-fast focus:outline-none focus:border-border-focus focus:ring-2 focus:ring-brand/10 border-border"
            style={{ width: 200 }}
          />
          <Button variant="secondary" size="sm" onClick={handleExport}>
            내보내기
          </Button>
        </div>
      </CardHeader>
      <CardBody>
        <DataTable<AuditLogEntry>
          columns={columns}
          data={displayed}
          keyExtractor={(r) => r.id}
          emptyMessage="검색 결과가 없습니다"
        />

        {/* 페이지네이션 */}
        <div className="flex items-center justify-between mt-sp-4 pt-sp-4 border-t border-border-subtle">
          <span className="text-sm text-text-tertiary">
            총 {AUDIT_TOTAL.toLocaleString()}건 중 {startIdx + 1} &ndash;{" "}
            {Math.min(startIdx + AUDIT_PAGE_SIZE, AUDIT_TOTAL)} 표시
          </span>
          <div className="flex items-center gap-sp-1">
            <button
              className="px-sp-2 py-sp-1 text-sm rounded-sm border border-border hover:bg-surface-secondary disabled:opacity-50 transition-colors duration-fast"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              &laquo;
            </button>
            {getPageNumbers().map((page, idx) =>
              page === "ellipsis" ? (
                <span
                  key={`ellipsis-${idx}`}
                  className="px-sp-2 py-sp-1 text-sm text-text-tertiary"
                >
                  ...
                </span>
              ) : (
                <button
                  key={page}
                  className={[
                    "px-sp-2 py-sp-1 text-sm rounded-sm border transition-colors duration-fast",
                    currentPage === page
                      ? "border-brand bg-brand text-white"
                      : "border-border hover:bg-surface-secondary text-text-primary",
                  ].join(" ")}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ),
            )}
            <button
              className="px-sp-2 py-sp-1 text-sm rounded-sm border border-border hover:bg-surface-secondary disabled:opacity-50 transition-colors duration-fast"
              disabled={currentPage === totalPages}
              onClick={() =>
                setCurrentPage((p) => Math.min(totalPages, p + 1))
              }
            >
              &raquo;
            </button>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
