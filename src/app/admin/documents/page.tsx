"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  KPICard,
  KPIGrid,
  Card,
  CardHeader,
  CardBody,
  Badge,
  Button,
  Input,
  Select,
  Textarea,
} from "@/components/ui";
import { Modal } from "@/components/layout/Modal";

// ─── Types ──────────────────────────────────────────────────

interface KPIData {
  sent: { count: number };
  signed: { count: number; percentage: number };
  pending: { count: number; delta: number };
  expiring: { count: number; delta: number };
}

interface DashboardData {
  kpi: KPIData;
}

// ─── Constants ──────────────────────────────────────────────

const TABS = [
  { key: "dashboard", label: "대시보드" },
  { key: "templates", label: "템플릿" },
  { key: "send", label: "발송" },
  { key: "vault", label: "보관함" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

// ─── Component ──────────────────────────────────────────────

export default function DocumentsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-sp-12">
          <span className="text-sm text-text-tertiary">불러오는 중...</span>
        </div>
      }
    >
      <DocumentsContent />
    </Suspense>
  );
}

function DocumentsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = (searchParams.get("tab") as TabKey) || "dashboard";

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/documents/dashboard");
      if (res.ok) {
        const json: DashboardData = await res.json();
        setData(json);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "dashboard") {
      fetchDashboard();
    }
  }, [activeTab, fetchDashboard]);

  function handleTabChange(tab: TabKey) {
    const params = new URLSearchParams(searchParams.toString());
    if (tab === "dashboard") {
      params.delete("tab");
    } else {
      params.set("tab", tab);
    }
    const qs = params.toString();
    router.push(`/admin/documents${qs ? `?${qs}` : ""}`);
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-sp-6">
        <h1 className="text-3xl font-bold text-text-primary">문서 관리</h1>
        <p className="mt-sp-1 text-md text-text-secondary">
          계약서 발송, 템플릿 관리, 문서 보관함
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-sp-6 flex gap-sp-1 border-b border-border">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => handleTabChange(tab.key)}
            className={[
              "px-sp-4 py-sp-2 text-sm font-medium transition-colors duration-fast",
              "-mb-px border-b-2",
              activeTab === tab.key
                ? "border-brand text-brand-text"
                : "border-transparent text-text-tertiary hover:text-text-secondary hover:border-border",
            ].join(" ")}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "dashboard" && (
        <DashboardTab data={data} loading={loading} />
      )}
      {activeTab === "templates" && <TemplatesTab />}
      {activeTab === "send" && (
        <div className="flex items-center justify-center py-sp-12">
          <span className="text-sm text-text-tertiary">
            문서 발송 (준비 중)
          </span>
        </div>
      )}
      {activeTab === "vault" && (
        <div className="flex items-center justify-center py-sp-12">
          <span className="text-sm text-text-tertiary">
            문서 보관함 (준비 중)
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Dashboard Tab ──────────────────────────────────────────

function DashboardTab({
  data,
  loading,
}: {
  data: DashboardData | null;
  loading: boolean;
}) {
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

  const { kpi } = data;

  return (
    <KPIGrid columns={4}>
      <KPICard
        eyebrow="발송 완료"
        value={kpi.sent.count}
        label="건 (이번 달)"
      />
      <KPICard
        eyebrow="서명 완료"
        value={kpi.signed.count}
        label={`건 (${kpi.signed.percentage}%)`}
        emphasis
      />
      <KPICard
        eyebrow="서명 대기"
        value={kpi.pending.count}
        label="건 미완료"
        delta={
          kpi.pending.delta !== 0
            ? `${Math.abs(kpi.pending.delta)}건 전주 대비`
            : undefined
        }
        deltaDirection={
          kpi.pending.delta > 0
            ? "up"
            : kpi.pending.delta < 0
              ? "down"
              : "neutral"
        }
      />
      <KPICard
        eyebrow="만료 예정"
        value={kpi.expiring.count}
        label="건 (7일 이내)"
        delta={
          kpi.expiring.delta !== 0
            ? `${Math.abs(kpi.expiring.delta)}건`
            : undefined
        }
        deltaDirection={
          kpi.expiring.delta > 0
            ? "up"
            : kpi.expiring.delta < 0
              ? "down"
              : "neutral"
        }
      />
    </KPIGrid>
  );
}

// ─── Templates Tab (WI-031) ─────────────────────────────

interface DocumentTemplate {
  id: string;
  name: string;
  description: string | null;
  category: string;
  version: string;
  usageCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  CONTRACT: "계약서",
  NOTICE: "통지서",
  NDA: "비밀유지계약",
  CERTIFICATE: "증명서",
};

const CATEGORY_OPTIONS = [
  { value: "CONTRACT", label: "계약서" },
  { value: "NOTICE", label: "통지서" },
  { value: "NDA", label: "비밀유지계약" },
  { value: "CERTIFICATE", label: "증명서" },
];

const CATEGORY_BADGE_VARIANT: Record<string, "info" | "success" | "warning" | "neutral"> = {
  CONTRACT: "info",
  NOTICE: "success",
  NDA: "warning",
  CERTIFICATE: "neutral",
};

interface TemplateFormData {
  name: string;
  description: string;
  category: string;
  version: string;
}

const EMPTY_TEMPLATE_FORM: TemplateFormData = {
  name: "",
  description: "",
  category: "",
  version: "1.0",
};

function TemplatesTab() {
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<DocumentTemplate | null>(null);
  const [form, setForm] = useState<TemplateFormData>(EMPTY_TEMPLATE_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/documents/templates");
      if (res.ok) {
        const json = await res.json();
        setTemplates(json.templates);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  function openCreateModal() {
    setEditingTemplate(null);
    setForm(EMPTY_TEMPLATE_FORM);
    setError(null);
    setModalOpen(true);
  }

  function openEditModal(template: DocumentTemplate) {
    setEditingTemplate(template);
    setForm({
      name: template.name,
      description: template.description ?? "",
      category: template.category,
      version: template.version,
    });
    setError(null);
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim() || !form.category) {
      setError("템플릿명과 카테고리는 필수입니다");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        category: form.category,
        version: form.version.trim() || "1.0",
      };

      const url = editingTemplate
        ? `/api/documents/templates/${editingTemplate.id}`
        : "/api/documents/templates";

      const res = await fetch(url, {
        method: editingTemplate ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json();
        setError(errJson.error || "저장에 실패했습니다");
        return;
      }

      setModalOpen(false);
      fetchTemplates();
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(template: DocumentTemplate) {
    await fetch(`/api/documents/templates/${template.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !template.isActive }),
    });
    fetchTemplates();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-sp-12">
        <span className="text-sm text-text-tertiary">불러오는 중...</span>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="mb-sp-4 flex items-center justify-between">
        <p className="text-sm text-text-secondary">
          {templates.length}개 템플릿 · 활성 {templates.filter((t) => t.isActive).length}개
        </p>
        <Button variant="primary" size="sm" onClick={openCreateModal}>
          템플릿 추가
        </Button>
      </div>

      {/* 4-Card Grid */}
      {templates.length === 0 ? (
        <div className="flex items-center justify-center py-sp-12">
          <span className="text-sm text-text-tertiary">
            등록된 템플릿이 없습니다
          </span>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-sp-4 sm:grid-cols-2 lg:grid-cols-4">
          {templates.map((template) => (
            <Card key={template.id} className={!template.isActive ? "opacity-60" : ""}>
              <CardHeader>
                <Badge variant={CATEGORY_BADGE_VARIANT[template.category] ?? "neutral"}>
                  {CATEGORY_LABELS[template.category] ?? template.category}
                </Badge>
                <span className="text-xs text-text-tertiary">v{template.version}</span>
              </CardHeader>
              <CardBody>
                <h3 className="mb-sp-1 text-sm font-semibold text-text-primary">
                  {template.name}
                </h3>
                <p className="mb-sp-3 line-clamp-2 text-xs text-text-secondary">
                  {template.description || "설명 없음"}
                </p>
                <div className="mb-sp-3 flex items-center justify-between text-xs text-text-tertiary">
                  <span>사용 {template.usageCount}회</span>
                  <Badge variant={template.isActive ? "success" : "danger"} >
                    {template.isActive ? "활성" : "비활성"}
                  </Badge>
                </div>
                <div className="flex gap-sp-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditModal(template)}
                    className="flex-1"
                  >
                    수정
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleActive(template)}
                    className="flex-1"
                  >
                    {template.isActive ? "비활성화" : "활성화"}
                  </Button>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingTemplate ? "템플릿 수정" : "템플릿 추가"}
        size="md"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setModalOpen(false)}>
              취소
            </Button>
            <Button variant="primary" size="sm" onClick={handleSave} disabled={saving}>
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
          label="템플릿명"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="예: 근로계약서"
        />

        <Select
          label="카테고리"
          options={CATEGORY_OPTIONS}
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
          placeholder="카테고리 선택"
          disabled={!!editingTemplate}
        />

        <Textarea
          label="설명"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="템플릿에 대한 간단한 설명을 입력하세요"
          rows={3}
        />

        <Input
          label="버전"
          value={form.version}
          onChange={(e) => setForm({ ...form, version: e.target.value })}
          placeholder="1.0"
        />
      </Modal>
    </>
  );
}
