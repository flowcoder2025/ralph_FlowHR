"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Drawer } from "@/components/layout/Drawer";
import { Badge, Button } from "@/components/ui";
import type { BadgeVariant } from "@/components/ui";
import { useToast } from "@/components/layout/Toast";

// ─── Types ──────────────────────────────────────────────────

interface DepartmentInfo {
  id: string;
  name: string;
  manager: { id: string; name: string } | null;
}

interface PositionInfo {
  id: string;
  name: string;
  level: number;
}

interface ChangeRecord {
  id: string;
  type: string;
  description: string | null;
  effectiveDate: string;
  fromDepartment: { name: string } | null;
  toDepartment: { name: string } | null;
  fromPosition: { name: string } | null;
  toPosition: { name: string } | null;
}

interface EmployeeDetail {
  id: string;
  employeeNumber: string;
  name: string;
  email: string;
  phone: string | null;
  status: string;
  type: string;
  hireDate: string;
  resignDate: string | null;
  birthDate: string | null;
  gender: string | null;
  disabilityStatus: boolean;
  department: DepartmentInfo | null;
  position: PositionInfo | null;
  changes: ChangeRecord[];
}

interface AttendanceRow {
  id: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  status: string;
}

interface LeaveRequestRow {
  id: string;
  leaveTypeName: string;
  startDate: string;
  endDate: string;
  days: number;
  status: string;
}

interface SalaryHistoryRow {
  id: string;
  baseSalary: number;
  effectiveDate: string;
  reason: string | null;
}

interface WageDetailData {
  salary: { baseSalary: number; effectiveDate: string } | null;
  breakdown: {
    baseSalary: number;
    allowances: number;
    deductions: number;
    netAmount: number;
    status: string;
  } | null;
}

interface WageConfigAllowanceItem {
  name: string;
  amount: number;
}

interface WageConfigData {
  id: string;
  employeeId: string;
  wageType: string;
  baseSalary: number;
  contractedOTHours: number;
  contractedNSHours: number;
  contractedHDHours: number;
  hourlyRate: number | null;
  annualSalary: number | null;
  fixedAllowances: WageConfigAllowanceItem[];
  nonTaxableAllowances: WageConfigAllowanceItem[];
  effectiveDate: string;
  isActive: boolean;
}

interface EditFormState {
  name: string;
  email: string;
  phone: string;
  departmentId: string;
  positionId: string;
  type: string;
  birthDate: string;
  gender: string;
  disabilityStatus: boolean;
  baseSalary: string;
}

interface DeptOption {
  id: string;
  name: string;
}

interface PosOption {
  id: string;
  name: string;
}

interface EmployeeDetailDrawerProps {
  employeeId: string | null;
  onClose: () => void;
  onRefresh?: () => void;
}

// ─── Constants ──────────────────────────────────────────────

const STATUS_BADGE_MAP: Record<string, { label: string; variant: BadgeVariant }> = {
  ACTIVE: { label: "재직 중", variant: "success" },
  ON_LEAVE: { label: "휴직", variant: "neutral" },
  PENDING_RESIGNATION: { label: "퇴사 예정", variant: "warning" },
  RESIGNED: { label: "퇴사", variant: "danger" },
  TERMINATED: { label: "해고", variant: "danger" },
};

const CHANGE_TYPE_MAP: Record<string, { label: string; variant: BadgeVariant }> = {
  HIRE: { label: "입사", variant: "success" },
  TRANSFER: { label: "이동", variant: "info" },
  PROMOTION: { label: "승진", variant: "info" },
  RESIGNATION: { label: "퇴사", variant: "warning" },
  TERMINATION: { label: "해고", variant: "danger" },
};

const ATTENDANCE_STATUS_MAP: Record<string, { label: string; variant: BadgeVariant }> = {
  PRESENT: { label: "출근", variant: "success" },
  ABSENT: { label: "결근", variant: "danger" },
  LATE: { label: "지각", variant: "warning" },
  EARLY_LEAVE: { label: "조퇴", variant: "warning" },
  HALF_DAY: { label: "반차", variant: "info" },
};

const LEAVE_STATUS_MAP: Record<string, { label: string; variant: BadgeVariant }> = {
  PENDING: { label: "승인 대기", variant: "warning" },
  APPROVED: { label: "승인 완료", variant: "success" },
  REJECTED: { label: "반려", variant: "danger" },
};

const EMPLOYEE_TYPE_OPTIONS = [
  { value: "FULL_TIME", label: "정규직" },
  { value: "PART_TIME", label: "파트타임" },
  { value: "CONTRACT", label: "계약직" },
  { value: "INTERN", label: "인턴" },
];

const TYPE_LABEL_MAP: Record<string, string> = {
  FULL_TIME: "정규직",
  PART_TIME: "파트타임",
  CONTRACT: "계약직",
  INTERN: "인턴",
};

type TabKey = "info" | "attendance" | "leave" | "payroll";

const TABS: { key: TabKey; label: string }[] = [
  { key: "info", label: "기본정보" },
  { key: "attendance", label: "근태" },
  { key: "leave", label: "휴가" },
  { key: "payroll", label: "급여" },
];

// ─── Helpers ────────────────────────────────────────────────

function getSignals(emp: EmployeeDetail): { title: string; meta: string; priority: string }[] {
  const signals: { title: string; meta: string; priority: string }[] = [];

  if (emp.status === "PENDING_RESIGNATION") {
    const d = emp.resignDate
      ? new Date(emp.resignDate).toLocaleDateString("ko-KR")
      : "미정";
    signals.push({ title: "퇴사 예정", meta: `퇴사일: ${d}`, priority: "critical" });
  }

  if (emp.status === "ON_LEAVE") {
    signals.push({ title: "휴직 중", meta: "복직 예정일 확인 필요", priority: "high" });
  }

  const hire = new Date(emp.hireDate);
  const now = new Date();
  const months = (now.getFullYear() - hire.getFullYear()) * 12 + (now.getMonth() - hire.getMonth());
  if (months <= 3 && emp.status === "ACTIVE") {
    signals.push({ title: "신규 입사자", meta: "온보딩 기간 (3개월 이내)", priority: "medium" });
  }

  return signals;
}

const PRIORITY_COLORS: Record<string, string> = {
  critical: "bg-status-danger-solid",
  high: "bg-status-warning-solid",
  medium: "bg-status-info-solid",
};

function formatCurrency(value: number): string {
  return value.toLocaleString("ko-KR") + "원";
}

// ─── Component ──────────────────────────────────────────────

export function EmployeeDetailDrawer({ employeeId, onClose, onRefresh }: EmployeeDetailDrawerProps) {
  const { addToast } = useToast();

  // Core state
  const [employee, setEmployee] = useState<EmployeeDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("info");

  // Edit mode
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState<EditFormState>({
    name: "", email: "", phone: "", departmentId: "", positionId: "", type: "FULL_TIME", birthDate: "", gender: "", disabilityStatus: false, baseSalary: "",
  });
  const [editSaving, setEditSaving] = useState(false);
  const [departments, setDepartments] = useState<DeptOption[]>([]);
  const [positions, setPositions] = useState<PosOption[]>([]);
  const [currentBaseSalary, setCurrentBaseSalary] = useState<number | null>(null);

  // Tab data
  const [attendanceData, setAttendanceData] = useState<AttendanceRow[]>([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);

  const [leaveData, setLeaveData] = useState<LeaveRequestRow[]>([]);
  const [leaveLoading, setLeaveLoading] = useState(false);

  const [salaryHistory, setSalaryHistory] = useState<SalaryHistoryRow[]>([]);
  const [wageDetail, setWageDetail] = useState<WageDetailData | null>(null);
  const [wageConfig, setWageConfig] = useState<WageConfigData | null>(null);
  const [payrollLoading, setPayrollLoading] = useState(false);

  // ─── Fetch employee detail ─────────────────────────────────
  const fetchEmployee = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/employees/${id}`);
      if (res.ok) {
        const json = await res.json();
        if (json?.data) setEmployee(json.data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!employeeId) {
      setEmployee(null);
      setActiveTab("info");
      setEditMode(false);
      return;
    }
    fetchEmployee(employeeId);
  }, [employeeId, fetchEmployee]);

  // ─── Fetch departments & positions for edit mode ────────────
  const fetchEditOptions = useCallback(async () => {
    const [deptRes, posRes] = await Promise.all([
      fetch("/api/departments/tree"),
      fetch("/api/positions"),
    ]);

    if (deptRes.ok) {
      const deptJson = await deptRes.json();
      const depts: DeptOption[] = [];
      const flatten = (nodes: Array<{ id: string; name: string; children?: Array<{ id: string; name: string }> }>) => {
        for (const n of nodes) {
          depts.push({ id: n.id, name: n.name });
          if (n.children) flatten(n.children);
        }
      };
      flatten(deptJson.data || deptJson || []);
      setDepartments(depts);
    }

    if (posRes.ok) {
      const posJson = await posRes.json();
      setPositions((posJson.data || []).map((p: { id: string; name: string }) => ({ id: p.id, name: p.name })));
    }
  }, []);

  // ─── Fetch current base salary ──────────────────────────────
  const fetchCurrentSalary = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/payroll/salary-history?employeeId=${id}&pageSize=1`);
      if (res.ok) {
        const json = await res.json();
        if (json.data && json.data.length > 0) {
          setCurrentBaseSalary(json.data[0].baseSalary);
        } else {
          setCurrentBaseSalary(null);
        }
      }
    } catch {
      setCurrentBaseSalary(null);
    }
  }, []);

  // ─── Enter edit mode ────────────────────────────────────────
  const enterEditMode = useCallback(async () => {
    if (!employee) return;
    await fetchEditOptions();
    await fetchCurrentSalary(employee.id);
    setEditForm({
      name: employee.name,
      email: employee.email,
      phone: employee.phone ?? "",
      departmentId: employee.department?.id ?? "",
      positionId: employee.position?.id ?? "",
      type: employee.type,
      birthDate: employee.birthDate ? employee.birthDate.slice(0, 10) : "",
      gender: employee.gender ?? "",
      disabilityStatus: employee.disabilityStatus ?? false,
      baseSalary: "",
    });
    setEditMode(true);
  }, [employee, fetchEditOptions, fetchCurrentSalary]);

  // ─── Save edit ──────────────────────────────────────────────
  const handleSaveEdit = async () => {
    if (!employee) return;
    setEditSaving(true);
    try {
      const patchBody: Record<string, unknown> = {};

      if (editForm.name !== employee.name) patchBody.name = editForm.name;
      if (editForm.email !== employee.email) patchBody.email = editForm.email;
      if ((editForm.phone || null) !== (employee.phone || null)) patchBody.phone = editForm.phone || null;
      if (editForm.departmentId !== (employee.department?.id ?? "")) {
        patchBody.departmentId = editForm.departmentId || null;
      }
      if (editForm.positionId !== (employee.position?.id ?? "")) {
        patchBody.positionId = editForm.positionId || null;
      }
      if (editForm.type !== employee.type) patchBody.type = editForm.type;
      if (editForm.birthDate !== (employee.birthDate?.slice(0, 10) ?? "")) {
        patchBody.birthDate = editForm.birthDate || null;
      }
      if (editForm.gender !== (employee.gender ?? "")) {
        patchBody.gender = editForm.gender || null;
      }
      if (editForm.disabilityStatus !== (employee.disabilityStatus ?? false)) {
        patchBody.disabilityStatus = editForm.disabilityStatus;
      }

      const newBaseSalary = editForm.baseSalary ? Number(editForm.baseSalary) : null;
      const salaryChanged = newBaseSalary !== null && newBaseSalary !== currentBaseSalary;

      // PATCH employee info if any field changed
      if (Object.keys(patchBody).length > 0) {
        const res = await fetch(`/api/employees/${employee.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patchBody),
        });
        if (!res.ok) {
          addToast({ message: "직원 정보 수정에 실패했습니다.", variant: "danger" });
          return;
        }
      }

      // POST salary history if baseSalary changed
      if (salaryChanged && newBaseSalary !== null) {
        const salaryRes = await fetch("/api/payroll/salary-history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            employeeId: employee.id,
            baseSalary: newBaseSalary,
            effectiveDate: new Date().toISOString(),
            reason: "급여 변경",
          }),
        });
        if (!salaryRes.ok) {
          addToast({ message: "급여 변경에 실패했습니다.", variant: "danger" });
          return;
        }
      }

      if (Object.keys(patchBody).length === 0 && !salaryChanged) {
        addToast({ message: "변경된 내용이 없습니다.", variant: "info" });
        setEditMode(false);
        return;
      }

      addToast({ message: "수정되었습니다.", variant: "success" });
      setEditMode(false);
      await fetchEmployee(employee.id);
      onRefresh?.();
    } finally {
      setEditSaving(false);
    }
  };

  // ─── Tab data fetchers ──────────────────────────────────────
  const fetchAttendance = useCallback(async (name: string) => {
    setAttendanceLoading(true);
    try {
      const params = new URLSearchParams({ search: name, pageSize: "5" });
      const res = await fetch(`/api/attendance/records?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setAttendanceData(json.data || []);
      }
    } finally {
      setAttendanceLoading(false);
    }
  }, []);

  const fetchLeave = useCallback(async (name: string) => {
    setLeaveLoading(true);
    try {
      const params = new URLSearchParams({ search: name });
      const res = await fetch(`/api/leave/requests?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setLeaveData((json.data || []).slice(0, 5));
      }
    } finally {
      setLeaveLoading(false);
    }
  }, []);

  const fetchPayroll = useCallback(async (id: string) => {
    setPayrollLoading(true);
    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;

      const [salaryRes, wageRes, wageConfigRes] = await Promise.all([
        fetch(`/api/payroll/salary-history?employeeId=${id}`),
        fetch(`/api/payroll/wage-detail?employeeId=${id}&year=${year}&month=${month}`),
        fetch(`/api/payroll/wage-config?employeeId=${id}&pageSize=1`),
      ]);

      if (salaryRes.ok) {
        const salaryJson = await salaryRes.json();
        setSalaryHistory(salaryJson.data || []);
      }

      if (wageRes.ok) {
        const wageJson = await wageRes.json();
        setWageDetail(wageJson.data || null);
      }

      if (wageConfigRes.ok) {
        const wageConfigJson = await wageConfigRes.json();
        const configs = wageConfigJson.data || [];
        setWageConfig(configs.length > 0 ? configs[0] : null);
      } else {
        setWageConfig(null);
      }
    } finally {
      setPayrollLoading(false);
    }
  }, []);

  // ─── Fetch tab data on tab change ───────────────────────────
  useEffect(() => {
    if (!employee) return;

    if (activeTab === "attendance") {
      fetchAttendance(employee.name);
    } else if (activeTab === "leave") {
      fetchLeave(employee.name);
    } else if (activeTab === "payroll") {
      fetchPayroll(employee.id);
    }
  }, [activeTab, employee, fetchAttendance, fetchLeave, fetchPayroll]);

  const signals = employee ? getSignals(employee) : [];
  const statusInfo = employee ? STATUS_BADGE_MAP[employee.status] : null;

  // ─── Render ─────────────────────────────────────────────────

  return (
    <Drawer
      open={!!employeeId}
      onClose={onClose}
      title={employee ? `구성원 상세 — ${employee.name}` : "구성원 상세"}
      size="lg"
      footer={employee ? (
        <div className="flex flex-wrap gap-sp-2">
          <Button
            size="sm"
            variant="danger"
            disabled={actionLoading === "resign"}
            onClick={async () => {
              if (!employee) return;
              if (!confirm(employee.name + " 직원을 퇴사 처리하시겠습니까?")) return;
              setActionLoading("resign");
              try {
                const res = await fetch("/api/employees/" + employee.id, { method: "DELETE" });
                if (res.ok) {
                  addToast({ message: "퇴사 처리되었습니다.", variant: "success" });
                  onClose();
                  onRefresh?.();
                } else {
                  addToast({ message: "처리에 실패했습니다.", variant: "danger" });
                }
              } finally {
                setActionLoading(null);
              }
            }}
          >
            {actionLoading === "resign" ? "처리 중..." : "퇴사 처리"}
          </Button>
          <Button
            size="sm"
            variant="primary"
            disabled={actionLoading === "meeting"}
            onClick={async () => {
              if (!employee) return;
              const date = prompt("1:1 일정 (예: 2026-03-20 14:00)");
              if (!date) return;
              setActionLoading("meeting");
              try {
                const res = await fetch("/api/performance/one-on-one", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    employeeId: employee.id,
                    scheduledAt: new Date(date).toISOString(),
                    duration: 30,
                    agenda: `${employee.name} 1:1 미팅`,
                  }),
                });
                addToast({
                  message: res.ok ? "1:1 예약이 생성되었습니다." : "1:1 예약에 실패했습니다.",
                  variant: res.ok ? "success" : "danger",
                });
              } finally {
                setActionLoading(null);
              }
            }}
          >
            {actionLoading === "meeting" ? "예약 중..." : "1:1 예약"}
          </Button>
        </div>
      ) : undefined}
    >
      {loading ? (
        <div className="flex items-center justify-center py-sp-12">
          <span className="text-sm text-text-tertiary">불러오는 중...</span>
        </div>
      ) : employee ? (
        <div className="space-y-sp-5">
          {/* ─── Profile Card ──────────────────────────────── */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-sp-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-soft text-xl font-semibold text-brand-text">
                {employee.name.slice(0, 1)}
              </div>
              <div>
                <div className="flex items-center gap-sp-2">
                  <span className="text-lg font-semibold text-text-primary">
                    {employee.name}
                  </span>
                  {statusInfo && (
                    <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                  )}
                </div>
                <div className="text-sm text-text-secondary">
                  {employee.department?.name ?? "—"} · {employee.position?.name ?? "—"}
                </div>
                <div className="text-sm text-text-tertiary">
                  사번: {employee.employeeNumber} · 입사일:{" "}
                  {new Date(employee.hireDate).toLocaleDateString("ko-KR")}
                </div>
              </div>
            </div>
            {!editMode && (
              <Button size="sm" variant="secondary" onClick={enterEditMode}>
                수정
              </Button>
            )}
          </div>

          {/* ─── Tabs ──────────────────────────────────────── */}
          <div className="flex border-b border-border">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => { setActiveTab(tab.key); setEditMode(false); }}
                className={[
                  "px-sp-4 py-sp-2 text-sm font-medium transition-colors border-b-2 -mb-px",
                  activeTab === tab.key
                    ? "border-brand text-brand-text"
                    : "border-transparent text-text-tertiary hover:text-text-primary hover:border-border",
                ].join(" ")}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ─── Tab Content ───────────────────────────────── */}
          {activeTab === "info" && (
            <InfoTab
              employee={employee}
              editMode={editMode}
              editForm={editForm}
              editSaving={editSaving}
              departments={departments}
              positions={positions}
              currentBaseSalary={currentBaseSalary}
              signals={signals}
              onEditFormChange={setEditForm}
              onSave={handleSaveEdit}
              onCancel={() => setEditMode(false)}
            />
          )}

          {activeTab === "attendance" && (
            <AttendanceTab
              data={attendanceData}
              loading={attendanceLoading}
              onClose={onClose}
            />
          )}

          {activeTab === "leave" && (
            <LeaveTab
              data={leaveData}
              loading={leaveLoading}
              onClose={onClose}
            />
          )}

          {activeTab === "payroll" && (
            <PayrollTab
              salaryHistory={salaryHistory}
              wageDetail={wageDetail}
              wageConfig={wageConfig}
              loading={payrollLoading}
              onClose={onClose}
            />
          )}
        </div>
      ) : (
        <div className="flex items-center justify-center py-sp-12">
          <span className="text-sm text-text-tertiary">직원을 찾을 수 없습니다</span>
        </div>
      )}
    </Drawer>
  );
}

// ─── Info Tab ────────────────────────────────────────────────

function InfoTab({
  employee,
  editMode,
  editForm,
  editSaving,
  departments,
  positions,
  currentBaseSalary,
  signals,
  onEditFormChange,
  onSave,
  onCancel,
}: {
  employee: EmployeeDetail;
  editMode: boolean;
  editForm: EditFormState;
  editSaving: boolean;
  departments: DeptOption[];
  positions: PosOption[];
  currentBaseSalary: number | null;
  signals: { title: string; meta: string; priority: string }[];
  onEditFormChange: (_form: EditFormState) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  if (editMode) {
    return (
      <div className="space-y-sp-4">
        <div className="grid grid-cols-1 gap-sp-3 sm:grid-cols-2">
          <EditField label="이름" value={editForm.name} onChange={(v) => onEditFormChange({ ...editForm, name: v })} type="text" required />
          <EditField label="이메일" value={editForm.email} onChange={(v) => onEditFormChange({ ...editForm, email: v })} type="email" required />
          <EditField label="전화번호" value={editForm.phone} onChange={(v) => onEditFormChange({ ...editForm, phone: v })} type="tel" />
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-sp-1">부서</label>
            <select
              value={editForm.departmentId}
              onChange={(e) => onEditFormChange({ ...editForm, departmentId: e.target.value })}
              className="w-full rounded-md border border-border bg-surface-primary px-sp-3 py-sp-2 text-sm text-text-primary"
            >
              <option value="">선택 안 함</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-sp-1">직급</label>
            <select
              value={editForm.positionId}
              onChange={(e) => onEditFormChange({ ...editForm, positionId: e.target.value })}
              className="w-full rounded-md border border-border bg-surface-primary px-sp-3 py-sp-2 text-sm text-text-primary"
            >
              <option value="">선택 안 함</option>
              {positions.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <EditField label="생년월일" value={editForm.birthDate} onChange={(v) => onEditFormChange({ ...editForm, birthDate: v })} type="date" />
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-sp-1">성별</label>
            <select
              value={editForm.gender}
              onChange={(e) => onEditFormChange({ ...editForm, gender: e.target.value })}
              className="w-full rounded-md border border-border bg-surface-primary px-sp-3 py-sp-2 text-sm text-text-primary"
            >
              <option value="">선택 안 함</option>
              <option value="MALE">남성</option>
              <option value="FEMALE">여성</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-sp-1">장애 여부</label>
            <select
              value={editForm.disabilityStatus ? "true" : "false"}
              onChange={(e) => onEditFormChange({ ...editForm, disabilityStatus: e.target.value === "true" })}
              className="w-full rounded-md border border-border bg-surface-primary px-sp-3 py-sp-2 text-sm text-text-primary"
            >
              <option value="false">비해당</option>
              <option value="true">해당</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-sp-1">고용형태</label>
            <select
              value={editForm.type}
              onChange={(e) => onEditFormChange({ ...editForm, type: e.target.value })}
              className="w-full rounded-md border border-border bg-surface-primary px-sp-3 py-sp-2 text-sm text-text-primary"
            >
              {EMPLOYEE_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-sp-1">
              기본급 (월)
              {currentBaseSalary !== null && (
                <span className="ml-sp-1 text-text-tertiary font-normal">
                  현재: {formatCurrency(currentBaseSalary)}
                </span>
              )}
            </label>
            <input
              type="number"
              min="0"
              step="10000"
              value={editForm.baseSalary}
              onChange={(e) => onEditFormChange({ ...editForm, baseSalary: e.target.value })}
              placeholder={currentBaseSalary !== null ? String(currentBaseSalary) : "미설정"}
              className="w-full rounded-md border border-border bg-surface-primary px-sp-3 py-sp-2 text-sm text-text-primary"
            />
          </div>
        </div>
        <div className="flex justify-end gap-sp-2 pt-sp-2">
          <Button size="sm" variant="secondary" disabled={editSaving} onClick={onCancel}>
            취소
          </Button>
          <Button size="sm" variant="primary" disabled={editSaving} onClick={onSave}>
            {editSaving ? "저장 중..." : "저장"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-sp-6">
      {/* Detail Fields */}
      <div className="space-y-sp-3">
        <StatRow label="이메일" value={employee.email} />
        <StatRow label="전화번호" value={employee.phone ?? "—"} />
        <StatRow label="직위" value={employee.position?.name ?? "—"} />
        <StatRow label="팀장" value={employee.department?.manager?.name ?? "—"} />
        <StatRow label="고용 형태" value={TYPE_LABEL_MAP[employee.type] ?? employee.type} />
        <StatRow label="생년월일" value={employee.birthDate ? new Date(employee.birthDate).toLocaleDateString("ko-KR") : "—"} />
        <StatRow label="성별" value={employee.gender === "MALE" ? "남성" : employee.gender === "FEMALE" ? "여성" : "—"} />
        <StatRow label="장애 여부" value={employee.disabilityStatus ? "해당" : "비해당"} />
      </div>

      {/* Signals */}
      <div>
        <h3 className="mb-sp-3 text-sm font-semibold text-text-primary">
          최근 시그널
        </h3>
        {signals.length === 0 ? (
          <p className="text-sm text-text-tertiary">특이사항 없음</p>
        ) : (
          <div className="space-y-sp-2">
            {signals.map((signal, i) => (
              <div
                key={i}
                className="flex items-start gap-sp-3 rounded-md border border-border p-sp-3"
              >
                <div
                  className={`mt-1 h-2 w-2 shrink-0 rounded-full ${PRIORITY_COLORS[signal.priority] ?? "bg-gray-400"}`}
                />
                <div>
                  <div className="text-sm font-medium text-text-primary">
                    {signal.title}
                  </div>
                  <div className="text-xs text-text-tertiary">
                    {signal.meta}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Changes */}
      {employee.changes.length > 0 && (
        <div>
          <h3 className="mb-sp-3 text-sm font-semibold text-text-primary">
            최근 인사 변동
          </h3>
          <div className="space-y-sp-2">
            {employee.changes.map((change) => {
              const typeInfo = CHANGE_TYPE_MAP[change.type];
              return (
                <div
                  key={change.id}
                  className="flex items-start gap-sp-3 text-sm"
                >
                  <span className="mt-0.5 shrink-0">
                    {typeInfo ? (
                      <Badge variant={typeInfo.variant}>{typeInfo.label}</Badge>
                    ) : (
                      change.type
                    )}
                  </span>
                  <div className="flex-1">
                    <span className="text-text-primary">
                      {change.description ?? "—"}
                    </span>
                    <span className="ml-sp-2 text-xs text-text-tertiary">
                      {new Date(change.effectiveDate).toLocaleDateString("ko-KR")}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Attendance Tab ──────────────────────────────────────────

function AttendanceTab({
  data,
  loading,
  onClose,
}: {
  data: AttendanceRow[];
  loading: boolean;
  onClose: () => void;
}) {
  const router = useRouter();

  if (loading) {
    return <TabLoading />;
  }

  return (
    <div className="space-y-sp-4">
      {data.length === 0 ? (
        <p className="text-sm text-text-tertiary py-sp-4">근태 기록이 없습니다.</p>
      ) : (
        <div className="overflow-hidden rounded-md border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-secondary">
                <th className="px-sp-3 py-sp-2 text-left font-medium text-text-secondary">날짜</th>
                <th className="px-sp-3 py-sp-2 text-left font-medium text-text-secondary">출근</th>
                <th className="px-sp-3 py-sp-2 text-left font-medium text-text-secondary">퇴근</th>
                <th className="px-sp-3 py-sp-2 text-left font-medium text-text-secondary">상태</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => {
                const statusInfo = ATTENDANCE_STATUS_MAP[row.status];
                return (
                  <tr key={row.id} className="border-b border-border-subtle last:border-b-0">
                    <td className="px-sp-3 py-sp-2 text-text-primary">{row.date}</td>
                    <td className="px-sp-3 py-sp-2 text-text-primary">{row.checkIn ?? "—"}</td>
                    <td className="px-sp-3 py-sp-2 text-text-primary">{row.checkOut ?? "—"}</td>
                    <td className="px-sp-3 py-sp-2">
                      {statusInfo ? (
                        <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                      ) : (
                        row.status
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <LinkButton
        label="전체 보기"
        onClick={() => {
          onClose();
          router.push(`/admin/attendance?tab=records`);
        }}
      />
    </div>
  );
}

// ─── Leave Tab ───────────────────────────────────────────────

function LeaveTab({
  data,
  loading,
  onClose,
}: {
  data: LeaveRequestRow[];
  loading: boolean;
  onClose: () => void;
}) {
  const router = useRouter();

  if (loading) {
    return <TabLoading />;
  }

  return (
    <div className="space-y-sp-4">
      {data.length === 0 ? (
        <p className="text-sm text-text-tertiary py-sp-4">휴가 기록이 없습니다.</p>
      ) : (
        <div className="overflow-hidden rounded-md border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-secondary">
                <th className="px-sp-3 py-sp-2 text-left font-medium text-text-secondary">유형</th>
                <th className="px-sp-3 py-sp-2 text-left font-medium text-text-secondary">기간</th>
                <th className="px-sp-3 py-sp-2 text-right font-medium text-text-secondary">일수</th>
                <th className="px-sp-3 py-sp-2 text-left font-medium text-text-secondary">상태</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => {
                const statusInfo = LEAVE_STATUS_MAP[row.status];
                return (
                  <tr key={row.id} className="border-b border-border-subtle last:border-b-0">
                    <td className="px-sp-3 py-sp-2 text-text-primary">{row.leaveTypeName}</td>
                    <td className="px-sp-3 py-sp-2 text-text-primary text-xs">
                      {row.startDate} ~ {row.endDate}
                    </td>
                    <td className="px-sp-3 py-sp-2 text-right text-text-primary">{row.days}일</td>
                    <td className="px-sp-3 py-sp-2">
                      {statusInfo ? (
                        <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                      ) : (
                        row.status
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <LinkButton
        label="전체 보기"
        onClick={() => {
          onClose();
          router.push("/admin/leave?tab=requests");
        }}
      />
    </div>
  );
}

// ─── Payroll Tab ─────────────────────────────────────────────

function PayrollTab({
  salaryHistory,
  wageDetail,
  wageConfig,
  loading,
  onClose,
}: {
  salaryHistory: SalaryHistoryRow[];
  wageDetail: WageDetailData | null;
  wageConfig: WageConfigData | null;
  loading: boolean;
  onClose: () => void;
}) {
  const router = useRouter();

  if (loading) {
    return <TabLoading />;
  }

  const currentSalary = wageDetail?.salary?.baseSalary ?? (salaryHistory.length > 0 ? salaryHistory[0].baseSalary : null);

  const WAGE_TYPE_LABEL: Record<string, string> = {
    COMPREHENSIVE: "포괄임금",
    STANDARD: "통상임금",
    HOURLY: "시급",
    DAILY: "일급",
    ANNUAL: "연봉",
  };

  const WAGE_TYPE_VARIANT: Record<string, BadgeVariant> = {
    COMPREHENSIVE: "info",
    STANDARD: "neutral",
    HOURLY: "warning",
    DAILY: "warning",
    ANNUAL: "success",
  };

  const wageConfigAllowances = wageConfig
    ? [
        ...(Array.isArray(wageConfig.fixedAllowances) ? wageConfig.fixedAllowances : []),
        ...(Array.isArray(wageConfig.nonTaxableAllowances) ? wageConfig.nonTaxableAllowances : []),
      ]
    : [];

  return (
    <div className="space-y-sp-5">
      {/* Wage Type & Config */}
      {wageConfig && (
        <div>
          <h4 className="mb-sp-2 text-sm font-semibold text-text-primary">임금 유형</h4>
          <div className="space-y-sp-2 rounded-md border border-border p-sp-3">
            <div className="flex items-center justify-between py-sp-1">
              <span className="text-sm text-text-secondary">임금유형</span>
              <Badge variant={WAGE_TYPE_VARIANT[wageConfig.wageType] ?? "neutral"}>
                {WAGE_TYPE_LABEL[wageConfig.wageType] ?? wageConfig.wageType}
              </Badge>
            </div>

            {wageConfig.wageType === "COMPREHENSIVE" && (
              <>
                {wageConfig.contractedOTHours > 0 && (
                  <StatRow
                    label="약정 연장근무"
                    value={`${wageConfig.contractedOTHours}시간`}
                  />
                )}
                {wageConfig.contractedNSHours > 0 && (
                  <StatRow
                    label="약정 야간근무"
                    value={`${wageConfig.contractedNSHours}시간`}
                  />
                )}
                {wageConfig.contractedHDHours > 0 && (
                  <StatRow
                    label="약정 휴일근무"
                    value={`${wageConfig.contractedHDHours}시간`}
                  />
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Non-taxable / Fixed Allowances from Wage Config */}
      {wageConfigAllowances.length > 0 && (
        <div>
          <h4 className="mb-sp-2 text-sm font-semibold text-text-primary">비과세 수당</h4>
          <div className="space-y-sp-2 rounded-md border border-border p-sp-3">
            {wageConfigAllowances.map((a, i) => (
              <StatRow
                key={`allow-${i}`}
                label={a.name}
                value={formatCurrency(a.amount)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Current Base Salary */}
      <div>
        <h4 className="mb-sp-2 text-sm font-semibold text-text-primary">현재 기본급</h4>
        <div className="text-lg font-bold text-text-primary">
          {currentSalary !== null ? formatCurrency(currentSalary) : "미설정"}
        </div>
      </div>

      {/* This Month Wage Detail */}
      {wageDetail?.breakdown && (
        <div>
          <h4 className="mb-sp-2 text-sm font-semibold text-text-primary">이번 달 급여 상세</h4>
          <div className="space-y-sp-2 rounded-md border border-border p-sp-3">
            <StatRow label="기본급" value={formatCurrency(wageDetail.breakdown.baseSalary)} />
            <StatRow label="수당" value={formatCurrency(wageDetail.breakdown.allowances)} />
            <StatRow label="공제" value={formatCurrency(wageDetail.breakdown.deductions)} />
            <div className="flex items-center justify-between border-t border-border pt-sp-2">
              <span className="text-sm font-semibold text-text-primary">실수령액</span>
              <span className="text-sm font-bold text-brand-text">
                {formatCurrency(wageDetail.breakdown.netAmount)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Salary History */}
      <div>
        <h4 className="mb-sp-2 text-sm font-semibold text-text-primary">급여 이력</h4>
        {salaryHistory.length === 0 ? (
          <p className="text-sm text-text-tertiary">급여 이력이 없습니다.</p>
        ) : (
          <div className="overflow-hidden rounded-md border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-secondary">
                  <th className="px-sp-3 py-sp-2 text-left font-medium text-text-secondary">날짜</th>
                  <th className="px-sp-3 py-sp-2 text-right font-medium text-text-secondary">금액</th>
                  <th className="px-sp-3 py-sp-2 text-left font-medium text-text-secondary">사유</th>
                </tr>
              </thead>
              <tbody>
                {salaryHistory.map((row) => (
                  <tr key={row.id} className="border-b border-border-subtle last:border-b-0">
                    <td className="px-sp-3 py-sp-2 text-text-primary">
                      {new Date(row.effectiveDate).toLocaleDateString("ko-KR")}
                    </td>
                    <td className="px-sp-3 py-sp-2 text-right text-text-primary">
                      {formatCurrency(row.baseSalary)}
                    </td>
                    <td className="px-sp-3 py-sp-2 text-text-secondary">
                      {row.reason ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <LinkButton
        label="전체 보기"
        onClick={() => {
          onClose();
          router.push("/admin/payroll?tab=payslips");
        }}
      />
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────────

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border-subtle py-sp-2">
      <span className="text-sm text-text-secondary">{label}</span>
      <span className="text-sm font-medium text-text-primary">{value}</span>
    </div>
  );
}

function EditField({
  label,
  value,
  onChange,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (_value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-text-secondary mb-sp-1">
        {label} {required && "*"}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full rounded-md border border-border bg-surface-primary px-sp-3 py-sp-2 text-sm text-text-primary"
      />
    </div>
  );
}

function TabLoading() {
  return (
    <div className="flex items-center justify-center py-sp-8">
      <span className="text-sm text-text-tertiary">불러오는 중...</span>
    </div>
  );
}

function LinkButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <div className="flex justify-end">
      <button
        type="button"
        onClick={onClick}
        className="text-sm font-medium text-brand-text hover:underline"
      >
        {label} &rarr;
      </button>
    </div>
  );
}
