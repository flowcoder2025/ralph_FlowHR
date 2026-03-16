"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardHeader,
  CardBody,
  Badge,
  Button,
  DataTable,
  Input,
} from "@/components/ui";
import type { Column } from "@/components/ui";
import { Modal } from "@/components/layout/Modal";

// ─── Types ──────────────────────────────────────────────────

export interface RoleData {
  id: string;
  name: string;
  description: string | null;
  permissions: unknown;
  isSystem: boolean;
  userCount: number;
  createdAt: string;
  updatedAt: string;
}

interface RoleFormData {
  name: string;
  description: string;
}

const EMPTY_ROLE_FORM: RoleFormData = {
  name: "",
  description: "",
};

// ─── Component ──────────────────────────────────────────────

export default function RolesTab() {
  const [roles, setRoles] = useState<RoleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleData | null>(null);
  const [form, setForm] = useState<RoleFormData>(EMPTY_ROLE_FORM);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/settings/roles");
      if (res.ok) {
        const json = await res.json();
        setRoles(json.data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  function openCreateModal() {
    setEditingRole(null);
    setForm(EMPTY_ROLE_FORM);
    setError(null);
    setModalOpen(true);
  }

  function openEditModal(role: RoleData) {
    setEditingRole(role);
    setForm({
      name: role.name,
      description: role.description || "",
    });
    setError(null);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingRole(null);
    setError(null);
  }

  async function handleSave() {
    if (!form.name.trim()) {
      setError("역할명은 필수입니다");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const isEdit = !!editingRole;
      const url = isEdit
        ? `/api/settings/roles/${editingRole.id}`
        : "/api/settings/roles";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim() || null,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json();
        setError(errJson.error || "저장에 실패했습니다");
        return;
      }

      closeModal();
      fetchRoles();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(role: RoleData) {
    if (role.isSystem) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/settings/roles/${role.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errJson = await res.json();
        setError(errJson.error || "삭제에 실패했습니다");
        return;
      }

      fetchRoles();
    } finally {
      setDeleting(false);
    }
  }

  const columns: Column<RoleData>[] = [
    {
      key: "name",
      header: "역할명",
      render: (row) => (
        <div className="flex items-center gap-sp-2">
          <span className="font-semibold text-text-primary">{row.name}</span>
          {row.isSystem && (
            <Badge variant="info">시스템</Badge>
          )}
        </div>
      ),
    },
    {
      key: "description",
      header: "설명",
      render: (row) => (
        <span className="text-text-secondary">
          {row.description || "-"}
        </span>
      ),
    },
    {
      key: "userCount",
      header: "사용자 수",
      align: "right",
      render: (row) => (
        <span className="tabular-nums">{row.userCount.toLocaleString()}명</span>
      ),
    },
    {
      key: "actions",
      header: "액션",
      align: "center",
      width: "160px",
      render: (row) => (
        <div className="flex items-center justify-center gap-sp-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              openEditModal(row);
            }}
          >
            수정
          </Button>
          {!row.isSystem && (
            <Button
              variant="ghost"
              size="sm"
              disabled={deleting || row.userCount > 0}
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(row);
              }}
            >
              삭제
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
          <h2 className="text-md font-semibold text-text-primary">
            역할 관리
          </h2>
          <Button onClick={openCreateModal}>역할 추가</Button>
        </CardHeader>
        <CardBody>
          {error && !modalOpen && (
            <div className="mb-sp-4 rounded-md bg-status-danger-bg px-sp-4 py-sp-3 text-sm text-status-danger-text">
              {error}
            </div>
          )}
          <DataTable<RoleData>
            columns={columns}
            data={roles}
            keyExtractor={(r) => r.id}
            emptyMessage="등록된 역할이 없습니다"
          />
        </CardBody>
      </Card>

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editingRole ? "역할 수정" : "역할 추가"}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={closeModal}>
              취소
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "저장 중..." : "저장"}
            </Button>
          </>
        }
      >
        {error && (
          <div className="mb-sp-4 rounded-md bg-status-danger-bg px-sp-4 py-sp-3 text-sm text-status-danger-text">
            {error}
          </div>
        )}
        <Input
          label="역할명"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="예: HR 관리자"
          error={error && !form.name.trim() ? "역할명은 필수입니다" : undefined}
        />
        <Input
          label="설명"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="이 역할의 설명을 입력하세요"
        />
      </Modal>
    </>
  );
}
