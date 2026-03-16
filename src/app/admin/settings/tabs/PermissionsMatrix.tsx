"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Badge,
} from "@/components/ui";

// ─── Types ──────────────────────────────────────────────────

interface RoleData {
  id: string;
  name: string;
  description: string | null;
  permissions: unknown;
  isSystem: boolean;
  userCount: number;
  createdAt: string;
  updatedAt: string;
}

// ─── Permission Matrix Constants (WI-056) ───────────────────

const FEATURES = [
  { key: "PEOPLE_MANAGE", label: "구성원 관리" },
  { key: "ATTENDANCE_MANAGE", label: "근태 관리" },
  { key: "PAYROLL_MANAGE", label: "급여 관리" },
  { key: "APPROVAL_MANAGE", label: "결재 승인" },
  { key: "REPORTS_VIEW", label: "리포트" },
  { key: "SETTINGS_EDIT", label: "설정" },
] as const;

const PERMISSION_LEVELS = [
  "전체",
  "읽기",
  "부서",
  "팀",
  "본인",
  "없음",
] as const;
type PermissionLevel = (typeof PERMISSION_LEVELS)[number];

type PermissionMap = Record<string, PermissionLevel>;

function getPermissionBadgeVariant(
  level: PermissionLevel,
): "success" | "info" | "neutral" {
  if (level === "전체") return "success";
  if (level === "읽기" || level === "부서" || level === "팀") return "info";
  return "neutral";
}

function parseRolePermissions(permissions: unknown): PermissionMap {
  const perms: PermissionMap = {};
  if (Array.isArray(permissions)) {
    for (const feature of FEATURES) {
      perms[feature.key] = permissions.includes(feature.key) ? "전체" : "없음";
    }
  } else if (permissions && typeof permissions === "object") {
    const map = permissions as Record<string, string>;
    for (const feature of FEATURES) {
      perms[feature.key] =
        (map[feature.key] as PermissionLevel) || "없음";
    }
  } else {
    for (const feature of FEATURES) {
      perms[feature.key] = "없음";
    }
  }
  return perms;
}

// ─── Component ──────────────────────────────────────────────

export function PermissionsMatrix() {
  const [roles, setRoles] = useState<RoleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [permissionState, setPermissionState] = useState<
    Record<string, PermissionMap>
  >({});
  const [hasChanges, setHasChanges] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/settings/roles");
      if (res.ok) {
        const json = await res.json();
        setRoles(json.data);
        const initial: Record<string, PermissionMap> = {};
        for (const role of json.data as RoleData[]) {
          initial[role.id] = parseRolePermissions(role.permissions);
        }
        setPermissionState(initial);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  function handleCellClick(roleId: string, featureKey: string) {
    setPermissionState((prev) => {
      const current = (prev[roleId]?.[featureKey] || "없음") as PermissionLevel;
      const idx = PERMISSION_LEVELS.indexOf(current);
      const next = PERMISSION_LEVELS[(idx + 1) % PERMISSION_LEVELS.length];
      return {
        ...prev,
        [roleId]: { ...prev[roleId], [featureKey]: next },
      };
    });
    setHasChanges(true);
    setSuccess("");
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const promises = roles.map((role) => {
        const perms = permissionState[role.id];
        if (!perms) return Promise.resolve(new Response());
        return fetch(`/api/settings/roles/${role.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ permissions: perms }),
        });
      });
      const results = await Promise.all(promises);
      const failed = results.filter((r) => !r.ok);
      if (failed.length > 0) {
        setError("일부 권한 저장에 실패했습니다");
        return;
      }
      setHasChanges(false);
      setSuccess("권한이 저장되었습니다");
      setTimeout(() => setSuccess(""), 3000);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-sp-12">
        <span className="text-sm text-text-tertiary">불러오는 중...</span>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="text-md font-semibold text-text-primary">
          권한 매트릭스
        </h2>
        <div className="flex items-center gap-sp-3">
          {error && (
            <span className="text-sm text-status-danger-text">{error}</span>
          )}
          {success && (
            <span className="text-sm text-status-success-text">{success}</span>
          )}
          <Button onClick={handleSave} disabled={saving || !hasChanges}>
            {saving ? "저장 중..." : "저장"}
          </Button>
        </div>
      </CardHeader>
      <CardBody>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-border-subtle">
                <th className="px-sp-4 py-sp-3 text-left text-sm font-semibold text-text-secondary">
                  기능
                </th>
                {roles.map((role) => (
                  <th
                    key={role.id}
                    className="px-sp-4 py-sp-3 text-center text-sm font-semibold text-text-secondary"
                  >
                    {role.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FEATURES.map((feature) => (
                <tr
                  key={feature.key}
                  className="border-b border-border-subtle hover:bg-surface-secondary transition-colors duration-fast"
                >
                  <td className="px-sp-4 py-sp-3 text-sm font-medium text-text-primary">
                    {feature.label}
                  </td>
                  {roles.map((role) => {
                    const level = (permissionState[role.id]?.[feature.key] ||
                      "없음") as PermissionLevel;
                    return (
                      <td
                        key={role.id}
                        className="px-sp-4 py-sp-3 text-center cursor-pointer"
                        onClick={() => handleCellClick(role.id, feature.key)}
                      >
                        <Badge variant={getPermissionBadgeVariant(level)}>
                          {level}
                        </Badge>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-sp-4 text-xs text-text-tertiary">
          셀을 클릭하면 권한 수준이 변경됩니다: 전체 → 읽기 → 부서 → 팀 →
          본인 → 없음
        </p>
      </CardBody>
    </Card>
  );
}
