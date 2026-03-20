"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardBody,
  Badge,
  Button,
  DataTable,
  QueueList,
  QueueItem,
} from "@/components/ui";
import type { Column, QueuePriority } from "@/components/ui";
import { useToast } from "@/components/layout/Toast";
import { printPage } from "@/lib/export";

/* ────────────────────────────────────────────
   Types
   ──────────────────────────────────────────── */

interface SignatureDoc {
  id: string;
  icon: string;
  title: string;
  sender: string;
  deadline: string;
  priority: QueuePriority;
  priorityLabel: string;
}

type DocCategory = "all" | "contract" | "certificate" | "notice" | "pledge" | "statement";

interface ArchivedDoc {
  id: string;
  name: string;
  type: string;
  typeBadge: "info" | "neutral" | "warning";
  sender: string;
  receivedAt: string;
  signStatus: "signed" | "not_required";
}

type ViewMode = "list" | "viewer";

/* ────────────────────────────────────────────
   API Response Type
   ──────────────────────────────────────────── */

interface ApiDocument {
  id: string;
  title: string;
  status: string;
  templateName: string;
  templateCategory: string;
  senderName: string;
  deadline: string | null;
  sentAt: string | null;
  viewedAt: string | null;
  completedAt: string | null;
  memo: string | null;
  createdAt: string;
}

/* ────────────────────────────────────────────
   Mapping Helpers
   ──────────────────────────────────────────── */

const CATEGORY_LABEL_MAP: Record<string, { label: string; category: DocCategory }> = {
  CONTRACT: { label: "계약서", category: "contract" },
  NOTICE: { label: "통지서", category: "notice" },
  NDA: { label: "서약서", category: "pledge" },
  CERTIFICATE: { label: "증명서", category: "certificate" },
};

const CATEGORY_ICON_MAP: Record<string, string> = {
  CONTRACT: "\uD83D\uDCDD",
  NOTICE: "\uD83D\uDCC4",
  NDA: "\uD83D\uDD12",
  CERTIFICATE: "\uD83D\uDCCB",
};

const TYPE_BADGE_MAP: Record<string, "info" | "neutral" | "warning"> = {
  "계약서": "info",
  "통지서": "neutral",
  "서약서": "warning",
  "증명서": "info",
  "기타": "neutral",
};

function computePriority(deadline: string | null): { priority: QueuePriority; label: string } {
  if (!deadline) return { priority: "low", label: "낮음" };

  const now = new Date();
  const deadlineDate = new Date(deadline);
  const diffMs = deadlineDate.getTime() - now.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffDays <= 0) return { priority: "critical", label: "긴급" };
  if (diffDays <= 3) return { priority: "high", label: "높음" };
  if (diffDays <= 7) return { priority: "medium", label: "보통" };
  return { priority: "low", label: "낮음" };
}

function formatDeadline(deadline: string | null): string {
  if (!deadline) return "마감 없음";
  const d = new Date(deadline);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const deadlineDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());

  const dayNames = ["일", "월", "화", "수", "목", "금", "토"];
  const dayName = dayNames[d.getDay()];
  const dateStr = `${d.getMonth() + 1}/${d.getDate()} (${dayName})`;

  if (deadlineDay.getTime() === today.getTime()) return `오늘 (${d.getMonth() + 1}/${d.getDate()})`;
  return dateStr;
}

function mapToPendingDoc(doc: ApiDocument): SignatureDoc {
  const { priority, label } = computePriority(doc.deadline);
  return {
    id: doc.id,
    icon: CATEGORY_ICON_MAP[doc.templateCategory] ?? "\uD83D\uDCC4",
    title: doc.title,
    sender: doc.senderName,
    deadline: formatDeadline(doc.deadline),
    priority,
    priorityLabel: label,
  };
}

function mapToArchivedDoc(doc: ApiDocument): ArchivedDoc {
  const categoryInfo = CATEGORY_LABEL_MAP[doc.templateCategory];
  const typeLabel = categoryInfo?.label ?? "기타";
  return {
    id: doc.id,
    name: doc.title || doc.templateName,
    type: typeLabel,
    typeBadge: TYPE_BADGE_MAP[typeLabel] ?? "neutral",
    sender: doc.senderName,
    receivedAt: doc.sentAt ? doc.sentAt.split("T")[0] : doc.createdAt.split("T")[0],
    signStatus: doc.status === "SIGNED" ? "signed" : "not_required",
  };
}

/* ────────────────────────────────────────────
   Constants
   ──────────────────────────────────────────── */

const PRIORITY_BADGE_MAP: Record<QueuePriority, "danger" | "warning" | "info" | "neutral"> = {
  critical: "danger",
  high: "warning",
  medium: "info",
  low: "neutral",
};

const CATEGORY_FILTERS: { value: DocCategory; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "contract", label: "계약서" },
  { value: "certificate", label: "증명서" },
  { value: "notice", label: "통지서" },
  { value: "pledge", label: "서약서" },
  { value: "statement", label: "명세서" },
];

const CATEGORY_TYPE_MAP: Record<string, DocCategory> = {
  "계약서": "contract",
  "증명서": "certificate",
  "통지서": "notice",
  "서약서": "pledge",
  "명세서": "statement",
};

/* ────────────────────────────────────────────
   Archive Table Columns
   ──────────────────────────────────────────── */

const ARCHIVE_COLUMNS: Column<ArchivedDoc>[] = [
  {
    key: "name",
    header: "문서명",
    render: (row) => <span className="font-semibold text-text-primary">{row.name}</span>,
  },
  {
    key: "type",
    header: "유형",
    render: (row) => <Badge variant={row.typeBadge}>{row.type}</Badge>,
  },
  { key: "sender", header: "발신" },
  { key: "receivedAt", header: "수신일" },
  {
    key: "signStatus",
    header: "서명 상태",
    render: (row) =>
      row.signStatus === "signed" ? (
        <Badge variant="success">{"서명 완료"}</Badge>
      ) : (
        <Badge variant="neutral">{"서명 불필요"}</Badge>
      ),
  },
  {
    key: "download",
    header: "다운로드",
    align: "right" as const,
    render: (row) => (
      <Button variant="ghost" size="sm" onClick={() => {
        const content = `%PDF-1.4\n${row.name}\nPlaceholder document`;
        const blob = new Blob([content], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${row.name}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }}>
        {"\uD83D\uDCE5 PDF"}
      </Button>
    ),
  },
];

/* ────────────────────────────────────────────
   Page Component
   ──────────────────────────────────────────── */

export default function EmployeeDocumentsPage() {
  const { addToast } = useToast();
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedDoc, setSelectedDoc] = useState<SignatureDoc | null>(null);
  const [signed, setSigned] = useState(false);
  const [signatureDrawn, setSignatureDrawn] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<DocCategory>("all");

  const [pendingDocs, setPendingDocs] = useState<SignatureDoc[]>([]);
  const [archivedDocs, setArchivedDocs] = useState<ArchivedDoc[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const [pendingRes, allRes] = await Promise.all([
        fetch("/api/employee/documents?status=SENT&pageSize=50"),
        fetch("/api/employee/documents?pageSize=50"),
      ]);

      if (pendingRes.ok) {
        const pendingJson = await pendingRes.json();
        const docs: ApiDocument[] = pendingJson.data ?? [];
        setPendingDocs(docs.map(mapToPendingDoc));
      }

      if (allRes.ok) {
        const allJson = await allRes.json();
        const docs: ApiDocument[] = allJson.data ?? [];
        const archived = docs
          .filter((d) => ["SIGNED", "VIEWED", "EXPIRED"].includes(d.status))
          .map(mapToArchivedDoc);
        setArchivedDocs(archived);
      }
    } catch {
      addToast({ message: "문서 목록을 불러오는데 실패했습니다.", variant: "danger" });
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const filteredArchive =
    categoryFilter === "all"
      ? archivedDocs
      : archivedDocs.filter((d) => CATEGORY_TYPE_MAP[d.type] === categoryFilter);

  function handleSign(doc: SignatureDoc) {
    setSelectedDoc(doc);
    setViewMode("viewer");
    setSigned(false);
    setSignatureDrawn(false);
  }

  async function handleSignComplete() {
    if (!selectedDoc) return;
    try {
      const res = await fetch(`/api/employee/documents/${selectedDoc.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "SIGNED" }),
      });
      if (!res.ok) {
        addToast({ message: "서명 처리에 실패했습니다.", variant: "danger" });
        return;
      }
      setSigned(true);
      setViewMode("list");
      setSelectedDoc(null);
      setSignatureDrawn(false);
      await fetchDocuments();
    } catch {
      addToast({ message: "서명 처리에 실패했습니다.", variant: "danger" });
    }
  }

  function handleBack() {
    setViewMode("list");
    setSelectedDoc(null);
    setSigned(false);
    setSignatureDrawn(false);
  }

  return (
    <div>
      {/* Page Header */}
      <div className="mb-sp-6">
        <div className="text-sm text-text-tertiary mb-sp-1">
          {viewMode === "viewer" ? "홈 > 문서 · 서명 > 문서 뷰어" : "홈 > 문서 · 서명"}
        </div>
        <h1 className="text-xl font-bold text-text-primary">
          {viewMode === "viewer" ? "문서 뷰어" : "문서 · 서명"}
        </h1>
        <p className="text-sm text-text-tertiary mt-sp-1">
          {viewMode === "viewer"
            ? "문서 미리보기 및 전자서명"
            : "서명 대기 문서와 보관 문서를 관리하세요"}
        </p>
      </div>

      {/* Signing success toast */}
      {signed && (
        <div className="mb-sp-6 p-sp-4 rounded-lg bg-status-success-soft border border-status-success text-sm text-status-success font-medium">
          {"서명이 완료되었습니다."}
        </div>
      )}

      {/* TE-402: Document Viewer */}
      {viewMode === "viewer" && selectedDoc && (
        <Card className="mb-sp-6">
          <CardHeader>
            <div>
              <CardTitle>{selectedDoc.title}</CardTitle>
              <div className="text-sm text-text-tertiary mt-sp-1">
                {selectedDoc.sender} {"발송"} {"\u00b7"} {"PDF"}
              </div>
            </div>
            <div className="flex gap-sp-2">
              <Button variant="ghost" size="sm" onClick={() => {
                const content = `%PDF-1.4\n${selectedDoc.title}\nPlaceholder document`;
                const blob = new Blob([content], { type: "application/pdf" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `${selectedDoc.title}.pdf`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              }}>
                {"다운로드"}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => printPage()}>
                {"인쇄"}
              </Button>
            </div>
          </CardHeader>
          <CardBody>
            {/* Document Preview Area */}
            <div className="bg-surface-secondary border border-border rounded-lg flex items-center justify-center mb-sp-5" style={{ minHeight: 360 }}>
              <div className="w-4/5 max-w-[520px] bg-white border border-border rounded-md p-sp-8 shadow-md">
                <div className="text-center mb-sp-6">
                  <div className="text-xl font-bold">{selectedDoc.title}</div>
                </div>
                <div className="text-sm text-text-secondary leading-8">
                  <p className="text-text-tertiary">{"문서 내용이 여기에 표시됩니다."}</p>
                </div>
              </div>
            </div>

            {/* Signature Pad Area */}
            <div
              className="border-2 border-dashed border-brand rounded-lg p-sp-6 text-center"
              style={{ background: "var(--brand-soft, #eef2ff)" }}
            >
              <div className="text-2xl mb-sp-2">{"\u270D\uFE0F"}</div>
              <div className="font-semibold text-brand mb-sp-2">{"서명 영역"}</div>
              <div className="text-sm text-text-tertiary">{"터치 또는 마우스로 서명해 주세요"}</div>
              <div
                role="button"
                tabIndex={0}
                onClick={() => setSignatureDrawn(true)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") setSignatureDrawn(true);
                }}
                className="h-20 bg-white border border-border rounded-md mt-sp-4 flex items-center justify-center cursor-pointer hover:border-brand transition-colors"
              >
                {signatureDrawn ? (
                  <span className="text-lg text-brand font-semibold italic">{"서명됨"}</span>
                ) : (
                  <span className="text-sm text-text-tertiary">{"여기에 서명"}</span>
                )}
              </div>
              {signatureDrawn && (
                <button
                  onClick={() => setSignatureDrawn(false)}
                  className="text-xs text-text-tertiary mt-sp-2 underline hover:text-text-secondary"
                >
                  {"서명 지우기"}
                </button>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-sp-3 mt-sp-4 pt-sp-4 border-t border-border-subtle">
              <Button
                variant="primary"
                size="lg"
                onClick={handleSignComplete}
                disabled={!signatureDrawn}
                className="w-full sm:w-auto min-h-[44px]"
              >
                {"서명 완료"}
              </Button>
              <Button variant="danger" size="lg" className="w-full sm:w-auto min-h-[44px]" onClick={() => {
                if (!selectedDoc) return;
                fetch(`/api/employee/documents/${selectedDoc.id}`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ status: "REJECTED" }),
                }).then((res) => {
                  if (!res.ok) throw new Error();
                  addToast({ message: "문서가 거부되었습니다.", variant: "success" });
                  handleBack();
                  fetchDocuments();
                }).catch(() => {
                  addToast({ message: "문서 거부 처리에 실패했습니다.", variant: "danger" });
                });
              }}>
                {"거부"}
              </Button>
              <Button variant="ghost" onClick={handleBack} className="w-full sm:w-auto min-h-[44px]">
                {"뒤로"}
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {/* TE-401: Signature Inbox (only in list mode) */}
      {viewMode === "list" && (
        <>
          <div className="mb-sp-4">
            <h2 className="text-lg font-semibold text-text-primary">{"서명 대기함"}</h2>
            <p className="text-sm text-text-tertiary mt-sp-1">{"서명이 필요한 문서 목록"}</p>
          </div>

          <div className="mb-sp-8">
            {loading ? (
              <div className="flex items-center justify-center py-sp-8">
                <span className="text-sm text-text-tertiary">{"불러오는 중..."}</span>
              </div>
            ) : pendingDocs.length === 0 ? (
              <div className="flex items-center justify-center py-sp-8">
                <span className="text-sm text-text-tertiary">{"서명 대기 중인 문서가 없습니다."}</span>
              </div>
            ) : (
              <QueueList>
                {pendingDocs.map((doc) => (
                  <QueueItem
                    key={doc.id}
                    priority={doc.priority}
                    title={doc.title}
                    meta={`발신: ${doc.sender} \u00b7 마감: ${doc.deadline}`}
                    action={
                      <div className="flex items-center gap-sp-3">
                        <Badge variant={PRIORITY_BADGE_MAP[doc.priority]}>
                          {doc.priorityLabel}
                        </Badge>
                        <Button
                          variant={doc.priority === "critical" ? "primary" : "secondary"}
                          size="sm"
                          onClick={() => handleSign(doc)}
                        >
                          {"서명하기"}
                        </Button>
                      </div>
                    }
                  />
                ))}
              </QueueList>
            )}
          </div>

          {/* TE-403: My Document Archive */}
          <div className="mb-sp-4">
            <h2 className="text-lg font-semibold text-text-primary">{"문서 보관함"}</h2>
            <p className="text-sm text-text-tertiary mt-sp-1">{"수신 및 서명 완료된 문서 목록"}</p>
          </div>

          <Card>
            <CardHeader className="flex-col gap-sp-3 sm:flex-row">
              <CardTitle>{"보관 문서"}</CardTitle>
              <div className="flex gap-sp-2 flex-wrap">
                {CATEGORY_FILTERS.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setCategoryFilter(f.value)}
                    className={[
                      "px-sp-3 py-sp-1 rounded-full text-xs md:text-sm font-medium transition-colors min-h-[32px]",
                      categoryFilter === f.value
                        ? "bg-brand text-white"
                        : "bg-surface-secondary text-text-secondary hover:bg-surface-tertiary",
                    ].join(" ")}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </CardHeader>
            <CardBody className="!p-0 overflow-x-auto">
              {loading ? (
                <div className="flex items-center justify-center py-sp-8">
                  <span className="text-sm text-text-tertiary">{"불러오는 중..."}</span>
                </div>
              ) : (
                <DataTable
                  columns={ARCHIVE_COLUMNS}
                  data={filteredArchive}
                  keyExtractor={(row) => row.id}
                  emptyMessage={"해당 유형의 문서가 없습니다."}
                />
              )}
            </CardBody>
            <div className="px-sp-5 py-sp-3 border-t border-border-subtle text-sm text-text-tertiary">
              {"총"} {filteredArchive.length}{"건"}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
