"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui";
import { useToast } from "@/components/layout/Toast";

// ─── Types ──────────────────────────────────────────────────

interface DepartmentNode {
  id: string;
  name: string;
  code: string;
  description: string | null;
  parentId: string | null;
  sortOrder: number;
  manager: { id: string; name: string; position: string | null } | null;
  employeeCount: number;
  children: DepartmentNode[];
}

interface EmployeeSummary {
  id: string;
  name: string;
  employeeNumber: string;
  email: string;
  position: { id: string; name: string; level: number } | null;
}

// ─── Helpers ────────────────────────────────────────────────

function getTotalCount(node: DepartmentNode): number {
  return node.employeeCount + node.children.reduce((sum, c) => sum + getTotalCount(c), 0);
}

function flattenDepts(nodes: DepartmentNode[]): { id: string; name: string }[] {
  const result: { id: string; name: string }[] = [];
  function walk(list: DepartmentNode[]) {
    for (const n of list) {
      result.push({ id: n.id, name: n.name });
      walk(n.children);
    }
  }
  walk(nodes);
  return result;
}

// ─── Component ──────────────────────────────────────────────

export default function OrgChartPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [tree, setTree] = useState<DepartmentNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // D-2: 선택된 부서의 직원 목록
  const [selectedDept, setSelectedDept] = useState<{ id: string; name: string } | null>(null);
  const [deptEmployees, setDeptEmployees] = useState<EmployeeSummary[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);

  // D-3: 부서 수정 모달
  const [editDept, setEditDept] = useState<DepartmentNode | null>(null);
  const [editName, setEditName] = useState("");
  const [editManagerId, setEditManagerId] = useState("");
  const [editEmployees, setEditEmployees] = useState<EmployeeSummary[]>([]);
  const [editSaving, setEditSaving] = useState(false);

  // D-4: 부서 추가 모달
  const [showAddDept, setShowAddDept] = useState(false);
  const [addName, setAddName] = useState("");
  const [addCode, setAddCode] = useState("");
  const [addParentId, setAddParentId] = useState("");
  const [addSaving, setAddSaving] = useState(false);

  const reloadTree = useCallback(() => {
    fetch("/api/departments/tree")
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json?.data) {
          setTree(json.data);
          const rootIds = new Set<string>(json.data.map((n: DepartmentNode) => n.id));
          setExpandedIds(rootIds);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    reloadTree();
  }, [reloadTree]);

  // D-3: 부서 수정 모달 열기 (소속 직원 로드)
  const openEditDept = useCallback((node: DepartmentNode) => {
    setEditDept(node);
    setEditName(node.name);
    setEditManagerId(node.manager?.id ?? "");
    fetch(`/api/employees?departmentId=${node.id}&pageSize=100`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => setEditEmployees(json?.data ?? []));
  }, []);

  // D-2: 부서 클릭 시 소속 직원 조회
  const selectDepartment = useCallback((dept: { id: string; name: string }) => {
    setSelectedDept(dept);
    setLoadingEmployees(true);
    fetch(`/api/employees?departmentId=${dept.id}&pageSize=100`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json?.data) setDeptEmployees(json.data);
        else setDeptEmployees([]);
      })
      .finally(() => setLoadingEmployees(false));
  }, []);

  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function expandAll() {
    const allIds = new Set<string>();
    function collect(nodes: DepartmentNode[]) {
      for (const n of nodes) {
        if (n.children.length > 0) allIds.add(n.id);
        collect(n.children);
      }
    }
    collect(tree);
    setExpandedIds(allIds);
  }

  function collapseAll() {
    setExpandedIds(new Set());
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-sp-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary md:text-3xl">조직도</h1>
          <p className="mt-sp-1 text-md text-text-secondary">
            부서별 트리 구조와 인원 현황을 확인합니다
          </p>
        </div>
        <div className="flex gap-sp-2">
          <button
            type="button"
            onClick={expandAll}
            className="rounded-md border border-border bg-surface-primary px-sp-3 py-sp-1 text-xs font-medium text-text-secondary transition-colors hover:bg-surface-secondary"
          >
            전체 펼치기
          </button>
          <button
            type="button"
            onClick={collapseAll}
            className="rounded-md border border-border bg-surface-primary px-sp-3 py-sp-1 text-xs font-medium text-text-secondary transition-colors hover:bg-surface-secondary"
          >
            전체 접기
          </button>
          <button
            type="button"
            onClick={() => setShowAddDept(true)}
            className="rounded-md bg-brand px-sp-3 py-sp-1 text-xs font-medium text-white transition-colors hover:bg-brand-hover"
          >
            + 부서 추가
          </button>
        </div>
      </div>

      {/* Tree */}
      <div className="rounded-lg border border-border bg-surface-primary p-sp-6 shadow-xs">
        {loading ? (
          <div className="flex items-center justify-center py-sp-12">
            <span className="text-sm text-text-tertiary">불러오는 중...</span>
          </div>
        ) : tree.length === 0 ? (
          <div className="flex items-center justify-center py-sp-12">
            <span className="text-sm text-text-tertiary">등록된 부서가 없습니다</span>
          </div>
        ) : (
          <div className="flex gap-sp-6">
            {/* Tree */}
            <div className={`space-y-sp-1 ${selectedDept ? "flex-1" : "w-full"}`}>
              {tree.map((node) => (
                <TreeNode
                  key={node.id}
                  node={node}
                  depth={0}
                  expandedIds={expandedIds}
                  onToggle={toggleExpand}
                  selectedDeptId={selectedDept?.id ?? null}
                  onSelectDept={selectDepartment}
                  onEditDept={openEditDept}
                  onReload={reloadTree}
                />
              ))}
            </div>

            {/* D-2: 소속 직원 패널 */}
            {selectedDept && (
              <div className="w-80 shrink-0 rounded-lg border border-border bg-surface-secondary p-sp-4">
                <div className="mb-sp-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-text-primary">
                    {selectedDept.name} 소속 직원
                  </h3>
                  <button
                    type="button"
                    onClick={() => setSelectedDept(null)}
                    className="text-xs text-text-tertiary hover:text-text-secondary"
                  >
                    닫기
                  </button>
                </div>
                {loadingEmployees ? (
                  <p className="text-sm text-text-tertiary">불러오는 중...</p>
                ) : deptEmployees.length === 0 ? (
                  <p className="text-sm text-text-tertiary">소속 직원이 없습니다</p>
                ) : (
                  <ul className="space-y-sp-2">
                    {deptEmployees.map((emp) => (
                      <li key={emp.id}>
                        <button
                          type="button"
                          onClick={() => router.push(`/admin/people?employee=${emp.id}`)}
                          className="flex w-full items-center justify-between rounded-md border border-border-subtle bg-surface-primary px-sp-3 py-sp-2 cursor-pointer hover:bg-surface-secondary transition-colors text-left"
                        >
                          <div>
                            <span className="text-sm font-medium text-text-primary hover:underline">{emp.name}</span>
                            <span className="ml-sp-2 text-xs text-text-tertiary">{emp.employeeNumber}</span>
                          </div>
                          {emp.position && (
                            <span className="text-xs text-text-secondary">{emp.position.name}</span>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* D-4: 부서 추가 모달 */}
      {showAddDept && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-96 rounded-lg bg-surface-primary p-sp-6 shadow-lg">
            <h3 className="mb-sp-4 text-lg font-semibold text-text-primary">부서 추가</h3>
            <div className="space-y-sp-3">
              <div>
                <label className="mb-sp-1 block text-sm text-text-secondary">부서명 *</label>
                <input
                  type="text"
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  className="w-full rounded-md border border-border bg-surface-primary px-sp-3 py-sp-2 text-sm"
                  placeholder="예: 개발팀"
                />
              </div>
              <div>
                <label className="mb-sp-1 block text-sm text-text-secondary">부서 코드 *</label>
                <input
                  type="text"
                  value={addCode}
                  onChange={(e) => setAddCode(e.target.value)}
                  className="w-full rounded-md border border-border bg-surface-primary px-sp-3 py-sp-2 text-sm"
                  placeholder="예: DEV"
                />
              </div>
              <div>
                <label className="mb-sp-1 block text-sm text-text-secondary">상위 부서</label>
                <select
                  value={addParentId}
                  onChange={(e) => setAddParentId(e.target.value)}
                  className="w-full rounded-md border border-border bg-surface-primary px-sp-3 py-sp-2 text-sm"
                >
                  <option value="">없음 (최상위)</option>
                  {flattenDepts(tree).map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-sp-4 flex justify-end gap-sp-2">
              <button
                type="button"
                onClick={() => { setShowAddDept(false); setAddName(""); setAddCode(""); setAddParentId(""); }}
                className="rounded-md border border-border px-sp-3 py-sp-2 text-sm text-text-secondary hover:bg-surface-secondary"
              >
                취소
              </button>
              <button
                type="button"
                disabled={addSaving || !addName || !addCode}
                onClick={async () => {
                  setAddSaving(true);
                  const res = await fetch("/api/departments", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name: addName, code: addCode, parentId: addParentId || null }),
                  });
                  setAddSaving(false);
                  if (res.ok) {
                    addToast({ message: "부서가 추가되었습니다.", variant: "success" });
                    setShowAddDept(false); setAddName(""); setAddCode(""); setAddParentId("");
                    reloadTree();
                  } else {
                    const err = await res.json().catch(() => ({}));
                    addToast({ message: err.error || "부서 추가에 실패했습니다.", variant: "danger" });
                  }
                }}
                className="rounded-md bg-brand px-sp-3 py-sp-2 text-sm font-medium text-white hover:bg-brand-hover disabled:opacity-50"
              >
                {addSaving ? "저장 중..." : "추가"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* D-3: 부서 수정 모달 (managerId 선택) */}
      {editDept && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-96 rounded-lg bg-surface-primary p-sp-6 shadow-lg">
            <h3 className="mb-sp-4 text-lg font-semibold text-text-primary">부서 수정</h3>
            <div className="space-y-sp-3">
              <div>
                <label className="mb-sp-1 block text-sm text-text-secondary">부서명</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-md border border-border bg-surface-primary px-sp-3 py-sp-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-sp-1 block text-sm text-text-secondary">부서장</label>
                <select
                  value={editManagerId}
                  onChange={(e) => setEditManagerId(e.target.value)}
                  className="w-full rounded-md border border-border bg-surface-primary px-sp-3 py-sp-2 text-sm"
                >
                  <option value="">없음</option>
                  {editEmployees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} {emp.position ? `(${emp.position.name})` : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-sp-4 flex justify-end gap-sp-2">
              <button
                type="button"
                onClick={() => setEditDept(null)}
                className="rounded-md border border-border px-sp-3 py-sp-2 text-sm text-text-secondary hover:bg-surface-secondary"
              >
                취소
              </button>
              <button
                type="button"
                disabled={editSaving}
                onClick={async () => {
                  if (!editDept) return;
                  setEditSaving(true);
                  const res = await fetch("/api/departments", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      id: editDept.id,
                      name: editName,
                      managerId: editManagerId || null,
                    }),
                  });
                  setEditSaving(false);
                  if (res.ok) {
                    addToast({ message: "부서가 수정되었습니다.", variant: "success" });
                    setEditDept(null);
                    reloadTree();
                  } else {
                    addToast({ message: "수정에 실패했습니다.", variant: "danger" });
                  }
                }}
                className="rounded-md bg-brand px-sp-3 py-sp-2 text-sm font-medium text-white hover:bg-brand-hover disabled:opacity-50"
              >
                {editSaving ? "저장 중..." : "저장"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tree Node ──────────────────────────────────────────────

function TreeNode({
  node,
  depth,
  expandedIds,
  onToggle,
  selectedDeptId,
  onSelectDept,
  onEditDept,
  onReload,
}: {
  node: DepartmentNode;
  depth: number;
  expandedIds: Set<string>;
  onToggle: (_id: string) => void;
  selectedDeptId: string | null;
  onSelectDept: (_dept: { id: string; name: string }) => void;
  onEditDept: (_node: DepartmentNode) => void;
  onReload: () => void;
}) {
  const { addToast } = useToast();
  const hasChildren = node.children.length > 0;
  const isExpanded = expandedIds.has(node.id);
  const totalCount = getTotalCount(node);
  const isSelected = selectedDeptId === node.id;

  return (
    <div>
      {/* Node row */}
      <div
        className={`group flex items-center gap-sp-3 rounded-md px-sp-3 py-sp-2 transition-colors hover:bg-surface-secondary ${isSelected ? "bg-brand-soft ring-1 ring-brand" : ""}`}
        style={{ paddingLeft: `${depth * 24 + 12}px` }}
      >
        {/* Expand toggle */}
        <button
          type="button"
          onClick={() => hasChildren && onToggle(node.id)}
          className={[
            "flex h-5 w-5 shrink-0 items-center justify-center rounded text-xs",
            hasChildren
              ? "text-text-secondary hover:bg-surface-tertiary cursor-pointer"
              : "text-transparent cursor-default",
          ].join(" ")}
        >
          {hasChildren ? (isExpanded ? "▼" : "▶") : "·"}
        </button>

        {/* Department icon + name (clickable for D-2) */}
        <button
          type="button"
          onClick={() => onSelectDept({ id: node.id, name: node.name })}
          className="flex items-center gap-sp-3 min-w-0 cursor-pointer"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-brand-soft text-xs font-semibold text-brand-text">
            {node.name.slice(0, 2)}
          </div>
          <div className="min-w-0 text-left">
            <span className="font-medium text-text-primary hover:underline">{node.name}</span>
            <span className="ml-sp-2 text-xs text-text-tertiary">{node.code}</span>
          </div>
        </button>

        {/* Department info spacer */}
        <div className="flex min-w-0 flex-1 items-center gap-sp-3">

          {/* Manager */}
          {node.manager && (
            <span className="shrink-0 text-xs text-text-secondary">
              {node.manager.name}
              {node.manager.position && (
                <span className="text-text-tertiary"> · {node.manager.position}</span>
              )}
            </span>
          )}
        </div>

        {/* Employee count badges */}
        <div className="flex shrink-0 items-center gap-sp-2">
          <Badge variant="info">{node.employeeCount}명</Badge>
          {hasChildren && totalCount !== node.employeeCount && (
            <span className="text-xs text-text-tertiary">
              (전체 {totalCount}명)
            </span>
          )}
        </div>

        {/* Edit/Delete */}
        <div className="hidden group-hover:flex shrink-0 items-center gap-sp-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEditDept(node);
            }}
            className="rounded px-sp-2 py-sp-1 text-xs text-text-secondary hover:bg-surface-tertiary"
          >
            수정
          </button>
          <button
            type="button"
            onClick={async (e) => {
              e.stopPropagation();
              if (!confirm(`"${node.name}" 부서를 삭제하시겠습니까?`)) return;
              const res = await fetch(`/api/departments?id=${node.id}`, { method: "DELETE" });
              if (res.ok) onReload();
              else {
                const err = await res.json().catch(() => ({}));
                addToast({ message: err.error || "삭제에 실패했습니다.", variant: "danger" });
              }
            }}
            className="rounded px-sp-2 py-sp-1 text-xs text-status-danger-solid hover:bg-red-50"
          >
            삭제
          </button>
        </div>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div>
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              expandedIds={expandedIds}
              onToggle={onToggle}
              selectedDeptId={selectedDeptId}
              onSelectDept={onSelectDept}
              onEditDept={onEditDept}
              onReload={onReload}
            />
          ))}
        </div>
      )}
    </div>
  );
}
