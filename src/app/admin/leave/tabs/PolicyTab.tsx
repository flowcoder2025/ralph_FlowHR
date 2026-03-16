"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card, CardHeader, CardTitle, CardBody, Badge, Button, DataTable, Input, Select, Textarea,
} from "@/components/ui";
import type { Column } from "@/components/ui";
import { Modal } from "@/components/layout/Modal";

interface LeavePolicy {
  id: string;
  name: string;
  type: string;
  description: string | null;
  defaultDays: number;
  carryOverLimit: number;
  requiresApproval: boolean;
  isActive: boolean;
}

const LEAVE_TYPE_LABELS: Record<string, string> = {
  ANNUAL: "연차 휴가",
  HALF_DAY: "반차",
  SICK: "병가",
  FAMILY_EVENT: "경조사 휴가",
  COMPENSATORY: "대체 휴가",
};

const LEAVE_TYPE_OPTIONS = [
  { value: "ANNUAL", label: "연차 휴가" },
  { value: "HALF_DAY", label: "반차" },
  { value: "SICK", label: "병가" },
  { value: "FAMILY_EVENT", label: "경조사 휴가" },
  { value: "COMPENSATORY", label: "대체 휴가" },
];

const PAID_TYPES = new Set(["ANNUAL", "HALF_DAY", "COMPENSATORY"]);

interface PolicyFormData {
  name: string;
  type: string;
  description: string;
  defaultDays: string;
  carryOverLimit: string;
  requiresApproval: boolean;
}

const EMPTY_FORM: PolicyFormData = {
  name: "",
  type: "",
  description: "",
  defaultDays: "",
  carryOverLimit: "0",
  requiresApproval: true,
};


export
function PolicyTab() {
  const [policies, setPolicies] = useState<LeavePolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<LeavePolicy | null>(null);
  const [form, setForm] = useState<PolicyFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPolicies = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/leave/policies");
      if (res.ok) {
        const json = await res.json();
        setPolicies(json.data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPolicies();
  }, [fetchPolicies]);

  function openCreateModal() {
    setEditingPolicy(null);
    setForm(EMPTY_FORM);
    setError(null);
    setModalOpen(true);
  }

  function openEditModal(policy: LeavePolicy) {
    setEditingPolicy(policy);
    setForm({
      name: policy.name,
      type: policy.type,
      description: policy.description ?? "",
      defaultDays: String(policy.defaultDays),
      carryOverLimit: String(policy.carryOverLimit),
      requiresApproval: policy.requiresApproval,
    });
    setError(null);
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim() || !form.type || !form.defaultDays) {
      setError("정책명, 휴가 유형, 연간 부여일은 필수입니다");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const payload = {
        name: form.name.trim(),
        type: form.type,
        description: form.description.trim() || null,
        defaultDays: Number(form.defaultDays),
        carryOverLimit: Number(form.carryOverLimit || 0),
        requiresApproval: form.requiresApproval,
      };

      const url = editingPolicy
        ? `/api/leave/policies/${editingPolicy.id}`
        : "/api/leave/policies";

      const res = await fetch(url, {
        method: editingPolicy ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json();
        setError(errJson.error || "저장에 실패했습니다");
        return;
      }

      setModalOpen(false);
      fetchPolicies();
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(policy: LeavePolicy) {
    await fetch(`/api/leave/policies/${policy.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !policy.isActive }),
    });
    fetchPolicies();
  }

  const columns: Column<LeavePolicy>[] = [
    {
      key: "type",
      header: "휴가 유형",
      render: (row) => (
        <span className="font-medium">
          {LEAVE_TYPE_LABELS[row.type] ?? row.type}
        </span>
      ),
    },
    {
      key: "description",
      header: "부여 기준",
      render: (row) => (
        <span className="text-text-secondary">
          {row.description || "-"}
        </span>
      ),
    },
    {
      key: "defaultDays",
      header: "연간 부여일",
      align: "right",
      render: (row) => `${row.defaultDays}일`,
    },
    {
      key: "carryOverLimit",
      header: "이월 한도",
      align: "right",
      render: (row) =>
        row.carryOverLimit > 0
          ? `최대 ${row.carryOverLimit}일`
          : "이월 불가",
    },
    {
      key: "paid",
      header: "유급/무급",
      align: "center",
      render: (row) => (
        <Badge variant={PAID_TYPES.has(row.type) ? "info" : "neutral"}>
          {PAID_TYPES.has(row.type) ? "유급" : "무급"}
        </Badge>
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
            수정
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
          <CardTitle>휴가 정책</CardTitle>
          <Button variant="primary" size="sm" onClick={openCreateModal}>
            정책 추가
          </Button>
        </CardHeader>
        <CardBody>
          <DataTable<LeavePolicy>
            columns={columns}
            data={policies}
            keyExtractor={(row) => row.id}
            emptyMessage="등록된 휴가 정책이 없습니다"
          />
        </CardBody>
      </Card>

      {/* Create / Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingPolicy ? "휴가 정책 수정" : "휴가 정책 추가"}
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
          label="정책명"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="예: 연차 휴가"
        />

        <Select
          label="휴가 유형"
          options={LEAVE_TYPE_OPTIONS}
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value })}
          placeholder="유형 선택"
          disabled={!!editingPolicy}
        />

        <Textarea
          label="부여 기준 설명"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="예: 근속연수 1년 이상, 연 15일 부여"
          rows={2}
        />

        <div className="grid grid-cols-2 gap-sp-4">
          <Input
            label="연간 부여일"
            type="number"
            min="0"
            step="0.5"
            value={form.defaultDays}
            onChange={(e) => setForm({ ...form, defaultDays: e.target.value })}
            placeholder="15"
          />
          <Input
            label="이월 한도 (일)"
            type="number"
            min="0"
            step="1"
            value={form.carryOverLimit}
            onChange={(e) => setForm({ ...form, carryOverLimit: e.target.value })}
            placeholder="0"
          />
        </div>

        <div className="mb-sp-4">
          <label className="flex items-center gap-sp-2 text-sm text-text-secondary">
            <input
              type="checkbox"
              checked={form.requiresApproval}
              onChange={(e) => setForm({ ...form, requiresApproval: e.target.checked })}
              className="h-4 w-4 rounded border-border text-brand focus:ring-brand/20"
            />
            승인 필요
          </label>
        </div>
      </Modal>
    </>
  );
}

