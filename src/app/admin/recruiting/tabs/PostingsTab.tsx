"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardBody,
  Badge,
  Button,
  Input,
  Select,
  Textarea,
  DataTable,
} from "@/components/ui";
import type { Column } from "@/components/ui";
import { Modal } from "@/components/layout/Modal";

// ─── Types ──────────────────────────────────────────────────

interface JobPosting {
  id: string;
  title: string;
  departmentId: string | null;
  positionId: string | null;
  hiringManagerId: string;
  status: string;
  description: string | null;
  requirements: string | null;
  location: string | null;
  employmentType: string;
  headcount: number;
  openDate: string | null;
  closeDate: string | null;
  _count: { applications: number };
}

// ─── Constants ──────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "임시저장",
  OPEN: "모집 중",
  CLOSED: "마감",
  CANCELLED: "취소",
};

const STATUS_VARIANTS: Record<string, "info" | "success" | "neutral" | "danger"> = {
  DRAFT: "neutral",
  OPEN: "success",
  CLOSED: "info",
  CANCELLED: "danger",
};

const STATUS_OPTIONS = [
  { value: "DRAFT", label: "임시저장" },
  { value: "OPEN", label: "모집 중" },
  { value: "CLOSED", label: "마감" },
  { value: "CANCELLED", label: "취소" },
];

const EMPLOYMENT_TYPE_LABELS: Record<string, string> = {
  FULL_TIME: "정규직",
  PART_TIME: "파트타임",
  CONTRACT: "계약직",
  INTERN: "인턴",
};

const EMPLOYMENT_TYPE_OPTIONS = [
  { value: "FULL_TIME", label: "정규직" },
  { value: "PART_TIME", label: "파트타임" },
  { value: "CONTRACT", label: "계약직" },
  { value: "INTERN", label: "인턴" },
];

const STATUS_FILTER_OPTIONS = [
  { value: "ALL", label: "전체" },
  { value: "OPEN", label: "모집 중" },
  { value: "CLOSED", label: "마감" },
  { value: "DRAFT", label: "임시저장" },
  { value: "CANCELLED", label: "취소" },
];

interface PostingFormData {
  title: string;
  status: string;
  description: string;
  requirements: string;
  location: string;
  employmentType: string;
  headcount: string;
  openDate: string;
  closeDate: string;
}

const EMPTY_FORM: PostingFormData = {
  title: "",
  status: "DRAFT",
  description: "",
  requirements: "",
  location: "",
  employmentType: "FULL_TIME",
  headcount: "1",
  openDate: "",
  closeDate: "",
};

// ─── Component ──────────────────────────────────────────────

export function PostingsTab() {
  const [postings, setPostings] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPosting, setEditingPosting] = useState<JobPosting | null>(null);
  const [form, setForm] = useState<PostingFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("ALL");

  const fetchPostings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/recruiting/postings");
      if (res.ok) {
        const json = await res.json();
        setPostings(json.data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPostings();
  }, [fetchPostings]);

  function openCreateModal() {
    setEditingPosting(null);
    setForm(EMPTY_FORM);
    setError(null);
    setModalOpen(true);
  }

  function openEditModal(posting: JobPosting) {
    setEditingPosting(posting);
    setForm({
      title: posting.title,
      status: posting.status,
      description: posting.description ?? "",
      requirements: posting.requirements ?? "",
      location: posting.location ?? "",
      employmentType: posting.employmentType,
      headcount: String(posting.headcount),
      openDate: posting.openDate ? posting.openDate.slice(0, 10) : "",
      closeDate: posting.closeDate ? posting.closeDate.slice(0, 10) : "",
    });
    setError(null);
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.title.trim()) {
      setError("공고 제목은 필수입니다");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const payload = {
        title: form.title.trim(),
        hiringManagerId: editingPosting?.hiringManagerId ?? "seed-emp-001",
        status: form.status,
        description: form.description.trim() || null,
        requirements: form.requirements.trim() || null,
        location: form.location.trim() || null,
        employmentType: form.employmentType,
        headcount: Number(form.headcount || 1),
        openDate: form.openDate || null,
        closeDate: form.closeDate || null,
      };

      const url = editingPosting
        ? `/api/recruiting/postings/${editingPosting.id}`
        : "/api/recruiting/postings";

      const res = await fetch(url, {
        method: editingPosting ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json();
        setError(errJson.error || "저장에 실패했습니다");
        return;
      }

      setModalOpen(false);
      fetchPostings();
    } finally {
      setSaving(false);
    }
  }

  async function handleCancel(posting: JobPosting) {
    await fetch(`/api/recruiting/postings/${posting.id}`, {
      method: "DELETE",
    });
    fetchPostings();
  }

  const filteredPostings =
    statusFilter === "ALL"
      ? postings
      : postings.filter((p) => p.status === statusFilter);

  const columns: Column<JobPosting>[] = [
    {
      key: "title",
      header: "포지션명",
      render: (row) => (
        <span className="font-medium text-text-primary">{row.title}</span>
      ),
    },
    {
      key: "employmentType",
      header: "고용 유형",
      render: (row) => (
        <span className="text-text-secondary">
          {EMPLOYMENT_TYPE_LABELS[row.employmentType] ?? row.employmentType}
        </span>
      ),
    },
    {
      key: "status",
      header: "상태",
      align: "center",
      render: (row) => (
        <Badge variant={STATUS_VARIANTS[row.status] ?? "neutral"}>
          {STATUS_LABELS[row.status] ?? row.status}
        </Badge>
      ),
    },
    {
      key: "applications",
      header: "지원자",
      align: "right",
      render: (row) => `${row._count.applications}명`,
    },
    {
      key: "headcount",
      header: "채용 인원",
      align: "right",
      render: (row) => `${row.headcount}명`,
    },
    {
      key: "closeDate",
      header: "마감일",
      render: (row) =>
        row.closeDate
          ? new Date(row.closeDate).toLocaleDateString("ko-KR")
          : "-",
    },
    {
      key: "actions",
      header: "액션",
      align: "center",
      render: (row) => (
        <div className="flex items-center justify-center gap-sp-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openEditModal(row)}
          >
            관리
          </Button>
          {row.status !== "CANCELLED" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleCancel(row)}
            >
              취소
            </Button>
          )}
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-sp-12">
        <span className="text-sm text-text-tertiary">불러오는 중...</span>
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-sp-4">
            <CardTitle>채용 공고</CardTitle>
            <div className="flex gap-sp-1">
              {STATUS_FILTER_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setStatusFilter(opt.value)}
                  className={[
                    "rounded-full px-sp-3 py-sp-1 text-xs font-medium transition-colors",
                    statusFilter === opt.value
                      ? "bg-brand text-white"
                      : "bg-surface-secondary text-text-secondary hover:bg-surface-tertiary",
                  ].join(" ")}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <Button variant="primary" size="sm" onClick={openCreateModal}>
            공고 등록
          </Button>
        </CardHeader>
        <CardBody>
          <DataTable<JobPosting>
            columns={columns}
            data={filteredPostings}
            keyExtractor={(row) => row.id}
            emptyMessage="등록된 채용 공고가 없습니다"
          />
        </CardBody>
      </Card>

      {/* Create / Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingPosting ? "채용 공고 수정" : "채용 공고 등록"}
        size="md"
        footer={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setModalOpen(false)}
            >
              취소
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "저장 중..." : "저장"}
            </Button>
          </>
        }
      >
        {error && (
          <div className="mb-sp-4 rounded-sm bg-status-danger-bg px-sp-3 py-sp-2 text-sm text-status-danger-text">
            {error}
          </div>
        )}

        <Input
          label="포지션명"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="예: 프론트엔드 개발자"
        />

        <div className="grid grid-cols-2 gap-sp-4">
          <Select
            label="공고 상태"
            options={STATUS_OPTIONS}
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
          />
          <Select
            label="고용 유형"
            options={EMPLOYMENT_TYPE_OPTIONS}
            value={form.employmentType}
            onChange={(e) =>
              setForm({ ...form, employmentType: e.target.value })
            }
          />
        </div>

        <Input
          label="근무 위치"
          value={form.location}
          onChange={(e) => setForm({ ...form, location: e.target.value })}
          placeholder="예: 서울 강남구"
        />

        <div className="grid grid-cols-3 gap-sp-4">
          <Input
            label="채용 인원"
            type="number"
            min="1"
            value={form.headcount}
            onChange={(e) => setForm({ ...form, headcount: e.target.value })}
          />
          <Input
            label="공고 시작일"
            type="date"
            value={form.openDate}
            onChange={(e) => setForm({ ...form, openDate: e.target.value })}
          />
          <Input
            label="마감일"
            type="date"
            value={form.closeDate}
            onChange={(e) => setForm({ ...form, closeDate: e.target.value })}
          />
        </div>

        <Textarea
          label="직무 설명"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="담당 업무 및 직무 설명을 입력하세요"
          rows={3}
        />

        <Textarea
          label="자격 요건"
          value={form.requirements}
          onChange={(e) => setForm({ ...form, requirements: e.target.value })}
          placeholder="필수/우대 자격 요건을 입력하세요"
          rows={3}
        />
      </Modal>
    </>
  );
}
