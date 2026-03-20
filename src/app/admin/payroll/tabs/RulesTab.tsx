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
  Input,
  Select,
  Textarea,
} from "@/components/ui";
import type { Column } from "@/components/ui";
import { Modal } from "@/components/layout/Modal";

// ─── Types ──────────────────────────────────────────────────

interface PayrollRule {
  id: string;
  name: string;
  type: string;
  description: string | null;
  formula: string;
  rate: number | null;
  isActive: boolean;
  sortOrder: number;
}

interface RuleFormData {
  name: string;
  type: string;
  description: string;
  formula: string;
  rate: string;
}

// ─── Constants ──────────────────────────────────────────────

const RULE_TYPE_LABELS: Record<string, string> = {
  FIXED: "고정",
  VARIABLE: "변동",
  DEDUCTION: "공제",
};

const RULE_TYPE_BADGE: Record<string, "info" | "warning" | "neutral"> = {
  FIXED: "info",
  VARIABLE: "warning",
  DEDUCTION: "neutral",
};

const RULE_TYPE_OPTIONS = [
  { value: "FIXED", label: "고정" },
  { value: "VARIABLE", label: "변동" },
  { value: "DEDUCTION", label: "공제" },
];

const EMPTY_RULE_FORM: RuleFormData = {
  name: "",
  type: "",
  description: "",
  formula: "",
  rate: "",
};

// ─── Component ──────────────────────────────────────────────

export function RulesTab() {
  const [rules, setRules] = useState<PayrollRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<PayrollRule | null>(null);
  const [form, setForm] = useState<RuleFormData>(EMPTY_RULE_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRules = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/payroll/rules");
      if (res.ok) {
        const json = await res.json();
        setRules(json.data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  function openCreateModal() {
    setEditingRule(null);
    setForm(EMPTY_RULE_FORM);
    setError(null);
    setModalOpen(true);
  }

  function openEditModal(rule: PayrollRule) {
    setEditingRule(rule);
    setForm({
      name: rule.name,
      type: rule.type,
      description: rule.description ?? "",
      formula: rule.formula,
      rate: rule.rate !== null ? String(rule.rate) : "",
    });
    setError(null);
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim() || !form.type || !form.formula.trim()) {
      setError("규칙명, 유형, 계산 방식은 필수입니다");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const payload = {
        name: form.name.trim(),
        type: form.type,
        description: form.description.trim() || null,
        formula: form.formula.trim(),
        rate: form.rate ? Number(form.rate) : null,
      };

      const url = editingRule
        ? `/api/payroll/rules/${editingRule.id}`
        : "/api/payroll/rules";

      const res = await fetch(url, {
        method: editingRule ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json();
        setError(errJson.error || "저장에 실패했습니다");
        return;
      }

      setModalOpen(false);
      fetchRules();
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(rule: PayrollRule) {
    await fetch(`/api/payroll/rules/${rule.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !rule.isActive }),
    });
    fetchRules();
  }

  const columns: Column<PayrollRule>[] = [
    {
      key: "name",
      header: "규칙명",
      render: (row) => (
        <span className="font-medium">{row.name}</span>
      ),
    },
    {
      key: "type",
      header: "유형",
      align: "center",
      render: (row) => (
        <Badge variant={RULE_TYPE_BADGE[row.type] ?? "neutral"}>
          {RULE_TYPE_LABELS[row.type] ?? row.type}
        </Badge>
      ),
    },
    {
      key: "formula",
      header: "계산 방식",
      render: (row) => (
        <span className="text-text-secondary">{row.formula}</span>
      ),
    },
    {
      key: "isActive",
      header: "상태",
      align: "center",
      render: (row) => (
        <Badge variant={row.isActive ? "success" : "danger"}>
          {row.isActive ? "활성" : "비활성"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "액션",
      align: "center",
      render: (row) => (
        <div className="flex items-center justify-center gap-sp-2">
          <Button variant="ghost" size="sm" onClick={() => openEditModal(row)}>
            편집
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleToggleActive(row)}
          >
            {row.isActive ? "비활성화" : "활성화"}
          </Button>
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
          <CardTitle>급여 규칙</CardTitle>
          <Button variant="primary" size="sm" onClick={openCreateModal}>
            규칙 추가
          </Button>
        </CardHeader>
        <CardBody>
          <DataTable<PayrollRule>
            columns={columns}
            data={rules}
            keyExtractor={(row) => row.id}
            emptyMessage="등록된 급여 규칙이 없습니다"
          />
        </CardBody>
      </Card>

      {/* Create / Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingRule ? "급여 규칙 수정" : "급여 규칙 추가"}
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
          label="규칙명"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="예: 기본급"
        />

        <Select
          label="유형"
          options={RULE_TYPE_OPTIONS}
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value })}
          placeholder="유형 선택"
          disabled={!!editingRule}
        />

        <Input
          label="계산 방식"
          value={form.formula}
          onChange={(e) => setForm({ ...form, formula: e.target.value })}
          placeholder="예: 연봉 / 12"
        />

        <Input
          label="비율 (선택)"
          type="number"
          step="0.001"
          value={form.rate}
          onChange={(e) => setForm({ ...form, rate: e.target.value })}
          placeholder="예: 1.5, 0.045"
        />

        <Textarea
          label="설명 (선택)"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="규칙에 대한 상세 설명"
          rows={2}
        />
      </Modal>
    </>
  );
}
