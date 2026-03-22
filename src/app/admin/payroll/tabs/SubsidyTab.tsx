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
import type { BadgeVariant, Column } from "@/components/ui";
import { Modal } from "@/components/layout/Modal";
import { useToast } from "@/components/layout/Toast";

// ─── Types ──────────────────────────────────────────────────

interface ProgramRow {
  id: string;
  name: string;
  provider: string;
  category: string;
  description: string | null;
  eligibilityCriteria: Record<string, unknown>;
  monthlyAmount: number;
  maxDurationMonths: number;
  totalMaxAmount: number | null;
  applicationStart: string | null;
  applicationEnd: string | null;
  externalApiUrl: string | null;
  isActive: boolean;
  createdAt: string;
}

interface MatchRow {
  id: string;
  employeeId: string;
  employeeName: string;
  departmentName: string | null;
  programId: string;
  programName: string;
  provider: string;
  category: string;
  status: string;
  matchScore: number | null;
  matchDetails: CriterionDetail[];
  monthlyAmount: number;
  programMonthlyAmount: number;
  maxDurationMonths: number;
  totalReceived: number;
  appliedAt: string | null;
  approvedAt: string | null;
  note: string | null;
  createdAt: string;
}

interface CriterionDetail {
  criterion: string;
  met: boolean;
  detail: string;
}

interface ProgramFormData {
  name: string;
  provider: string;
  category: string;
  description: string;
  monthlyAmount: string;
  maxDurationMonths: string;
  totalMaxAmount: string;
  applicationStart: string;
  applicationEnd: string;
  // eligibilityCriteria fields
  ageMin: string;
  ageMax: string;
  employmentTypes: string[];
  minEmployeePeriodDays: string;
  maxEmployeePeriodDays: string;
  disabilityRequired: boolean;
}

// ─── Constants ──────────────────────────────────────────────

const SUBSIDY_STATUS_BADGE: Record<string, { label: string; variant: BadgeVariant }> = {
  ELIGIBLE: { label: "수급 자격", variant: "info" },
  APPLIED: { label: "신청", variant: "warning" },
  APPROVED: { label: "승인", variant: "success" },
  REJECTED: { label: "거절", variant: "danger" },
  RECEIVING: { label: "수급 중", variant: "success" },
  COMPLETED: { label: "완료", variant: "neutral" },
  EXPIRED: { label: "만료", variant: "neutral" },
};

const CATEGORY_OPTIONS = [
  { value: "고용안정", label: "고용안정" },
  { value: "직업능력개발", label: "직업능력개발" },
  { value: "고용촉진", label: "고용촉진" },
  { value: "모성보호", label: "모성보호" },
  { value: "장애인고용", label: "장애인고용" },
  { value: "기타", label: "기타" },
];

const EMPLOYMENT_TYPE_OPTIONS = [
  { value: "FULL_TIME", label: "정규직" },
  { value: "PART_TIME", label: "파트타임" },
  { value: "CONTRACT", label: "계약직" },
  { value: "INTERN", label: "인턴" },
];

const EMPTY_PROGRAM_FORM: ProgramFormData = {
  name: "",
  provider: "",
  category: "",
  description: "",
  monthlyAmount: "",
  maxDurationMonths: "",
  totalMaxAmount: "",
  applicationStart: "",
  applicationEnd: "",
  ageMin: "",
  ageMax: "",
  employmentTypes: [],
  minEmployeePeriodDays: "",
  maxEmployeePeriodDays: "",
  disabilityRequired: false,
};

// ─── Helpers ──────────────────────────────────────────────

function formatKRW(amount: number): string {
  return `\u20A9${amount.toLocaleString("ko-KR")}`;
}

// ─── Component ──────────────────────────────────────────────

export function SubsidyTab() {
  const { addToast } = useToast();
  const [subTab, setSubTab] = useState<"programs" | "matches">("programs");

  // Programs
  const [programs, setPrograms] = useState<ProgramRow[]>([]);
  const [programsLoading, setProgramsLoading] = useState(true);
  const [programModalOpen, setProgramModalOpen] = useState(false);
  const [programForm, setProgramForm] = useState<ProgramFormData>(EMPTY_PROGRAM_FORM);
  const [editingProgramId, setEditingProgramId] = useState<string | null>(null);
  const [programSaving, setProgramSaving] = useState(false);
  const [programError, setProgramError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  // Matches
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [matchesLoading, setMatchesLoading] = useState(true);
  const [matching, setMatching] = useState(false);
  const [matchActionLoading, setMatchActionLoading] = useState<string | null>(null);

  // ─── Fetch ─────────────────────────────────────────────

  const fetchPrograms = useCallback(async () => {
    setProgramsLoading(true);
    try {
      const res = await fetch("/api/subsidies/programs?pageSize=50");
      if (res.ok) {
        const json = await res.json();
        setPrograms(json.data);
      }
    } finally {
      setProgramsLoading(false);
    }
  }, []);

  const fetchMatches = useCallback(async () => {
    setMatchesLoading(true);
    try {
      const res = await fetch("/api/subsidies/matches?pageSize=50");
      if (res.ok) {
        const json = await res.json();
        setMatches(json.data);
      }
    } finally {
      setMatchesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrograms();
    fetchMatches();
  }, [fetchPrograms, fetchMatches]);

  // ─── Program CRUD ──────────────────────────────────────

  function openCreateProgramModal() {
    setProgramForm(EMPTY_PROGRAM_FORM);
    setEditingProgramId(null);
    setProgramError(null);
    setProgramModalOpen(true);
  }

  function openEditProgramModal(program: ProgramRow) {
    const criteria = program.eligibilityCriteria ?? {};
    setProgramForm({
      name: program.name,
      provider: program.provider,
      category: program.category,
      description: program.description ?? "",
      monthlyAmount: String(program.monthlyAmount),
      maxDurationMonths: String(program.maxDurationMonths),
      totalMaxAmount: program.totalMaxAmount ? String(program.totalMaxAmount) : "",
      applicationStart: program.applicationStart ? program.applicationStart.slice(0, 10) : "",
      applicationEnd: program.applicationEnd ? program.applicationEnd.slice(0, 10) : "",
      ageMin: criteria.ageMin !== undefined ? String(criteria.ageMin) : "",
      ageMax: criteria.ageMax !== undefined ? String(criteria.ageMax) : "",
      employmentTypes: (criteria.employmentTypes as string[]) ?? [],
      minEmployeePeriodDays: criteria.minEmployeePeriodDays !== undefined ? String(criteria.minEmployeePeriodDays) : "",
      maxEmployeePeriodDays: criteria.maxEmployeePeriodDays !== undefined ? String(criteria.maxEmployeePeriodDays) : "",
      disabilityRequired: (criteria.disabilityRequired as boolean) ?? false,
    });
    setEditingProgramId(program.id);
    setProgramError(null);
    setProgramModalOpen(true);
  }

  async function handleSaveProgram() {
    if (!programForm.name || !programForm.provider || !programForm.category || !programForm.monthlyAmount || !programForm.maxDurationMonths) {
      setProgramError("이름, 제공기관, 카테고리, 월 지원금, 최대 기간은 필수입니다");
      return;
    }

    setProgramSaving(true);
    setProgramError(null);

    try {
      const eligibilityCriteria: Record<string, unknown> = {};
      if (programForm.ageMin) eligibilityCriteria.ageMin = Number(programForm.ageMin);
      if (programForm.ageMax) eligibilityCriteria.ageMax = Number(programForm.ageMax);
      if (programForm.employmentTypes.length > 0) eligibilityCriteria.employmentTypes = programForm.employmentTypes;
      if (programForm.minEmployeePeriodDays) eligibilityCriteria.minEmployeePeriodDays = Number(programForm.minEmployeePeriodDays);
      if (programForm.maxEmployeePeriodDays) eligibilityCriteria.maxEmployeePeriodDays = Number(programForm.maxEmployeePeriodDays);
      if (programForm.disabilityRequired) eligibilityCriteria.disabilityRequired = true;

      const payload = {
        name: programForm.name,
        provider: programForm.provider,
        category: programForm.category,
        description: programForm.description || undefined,
        eligibilityCriteria,
        monthlyAmount: Number(programForm.monthlyAmount),
        maxDurationMonths: Number(programForm.maxDurationMonths),
        totalMaxAmount: programForm.totalMaxAmount ? Number(programForm.totalMaxAmount) : undefined,
        applicationStart: programForm.applicationStart || undefined,
        applicationEnd: programForm.applicationEnd || undefined,
      };

      let res: Response;
      if (editingProgramId) {
        res = await fetch(`/api/subsidies/programs/${editingProgramId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/subsidies/programs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const errJson = await res.json();
        setProgramError(errJson.error || "저장에 실패했습니다");
        return;
      }

      setProgramModalOpen(false);
      addToast({
        message: editingProgramId ? "프로그램이 수정되었습니다." : "프로그램이 생성되었습니다.",
        variant: "success",
      });
      fetchPrograms();
    } finally {
      setProgramSaving(false);
    }
  }

  async function handleDeleteProgram(id: string) {
    try {
      const res = await fetch(`/api/subsidies/programs/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        addToast({ message: "프로그램이 비활성화되었습니다.", variant: "success" });
        fetchPrograms();
      }
    } catch {
      addToast({ message: "삭제에 실패했습니다.", variant: "danger" });
    }
  }

  // ─── Sync ─────────────────────────────────────────────

  async function handleSync() {
    setSyncing(true);
    try {
      const res = await fetch("/api/subsidies/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (res.ok) {
        const json = await res.json();
        addToast({
          message: `동기화 완료: ${json.data.synced}건 (신규 ${json.data.created}, 갱신 ${json.data.updated}${json.data.failed ? `, 실패 ${json.data.failed}` : ""})`,
          variant: "success",
        });
        fetchPrograms();
      } else {
        const errJson = await res.json();
        addToast({ message: errJson.error || "동기화에 실패했습니다.", variant: "danger" });
      }
    } finally {
      setSyncing(false);
    }
  }

  async function handleDeleteAll() {
    if (!confirm("모든 프로그램과 매칭 결과가 삭제됩니다. 계속하시겠습니까?")) return;
    try {
      const res = await fetch("/api/subsidies/programs", { method: "DELETE" });
      if (res.ok) {
        const json = await res.json();
        addToast({
          message: `${json.data.deleted}건의 프로그램이 삭제되었습니다.`,
          variant: "success",
        });
        fetchPrograms();
      } else {
        const errJson = await res.json();
        addToast({ message: errJson.error || "삭제에 실패했습니다.", variant: "danger" });
      }
    } catch {
      addToast({ message: "삭제 중 오류가 발생했습니다.", variant: "danger" });
    }
  }

  // ─── Matching ──────────────────────────────────────────

  async function handleRunMatching() {
    setMatching(true);
    try {
      const res = await fetch("/api/subsidies/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (res.ok) {
        const json = await res.json();
        addToast({
          message: `매칭 완료: ${json.data.processed}건 처리, ${json.data.newMatches}건 자격`,
          variant: "success",
        });
        fetchMatches();
      } else {
        const errJson = await res.json();
        addToast({ message: errJson.error || "매칭에 실패했습니다.", variant: "danger" });
      }
    } finally {
      setMatching(false);
    }
  }

  async function handleMatchStatusChange(id: string, status: string) {
    setMatchActionLoading(id);
    try {
      const res = await fetch(`/api/subsidies/matches/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        addToast({ message: "상태가 변경되었습니다.", variant: "success" });
        fetchMatches();
      }
    } finally {
      setMatchActionLoading(null);
    }
  }

  function toggleEmploymentType(type: string) {
    const current = programForm.employmentTypes;
    if (current.includes(type)) {
      setProgramForm({ ...programForm, employmentTypes: current.filter((t) => t !== type) });
    } else {
      setProgramForm({ ...programForm, employmentTypes: [...current, type] });
    }
  }

  // ─── Program Columns ──────────────────────────────────

  const programColumns: Column<ProgramRow>[] = [
    {
      key: "name",
      header: "프로그램명",
      render: (row) =>
        row.externalApiUrl ? (
          <a
            href={row.externalApiUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary hover:underline"
          >
            {row.name}
          </a>
        ) : (
          <span className="font-medium">{row.name}</span>
        ),
    },
    {
      key: "provider",
      header: "제공기관",
      render: (row) => <span className="text-text-secondary">{row.provider}</span>,
    },
    {
      key: "category",
      header: "카테고리",
      render: (row) => <Badge variant="info">{row.category}</Badge>,
    },
    {
      key: "monthlyAmount",
      header: "월 지원금",
      align: "right",
      render: (row) => formatKRW(row.monthlyAmount),
    },
    {
      key: "maxDurationMonths",
      header: "최대 기간",
      align: "center",
      render: (row) => `${row.maxDurationMonths}개월`,
    },
    {
      key: "actions",
      header: "액션",
      align: "center",
      render: (row) => (
        <div className="flex items-center justify-center gap-sp-2">
          <Button variant="secondary" size="sm" onClick={() => openEditProgramModal(row)}>
            수정
          </Button>
          <Button variant="danger" size="sm" onClick={() => handleDeleteProgram(row.id)}>
            삭제
          </Button>
        </div>
      ),
    },
  ];

  // ─── Match Columns ────────────────────────────────────

  const matchColumns: Column<MatchRow>[] = [
    {
      key: "employeeName",
      header: "직원명",
      render: (row) => (
        <div>
          <span className="font-medium">{row.employeeName}</span>
          {row.departmentName && (
            <span className="ml-sp-1 text-xs text-text-tertiary">{row.departmentName}</span>
          )}
        </div>
      ),
    },
    {
      key: "programName",
      header: "프로그램",
      render: (row) => <span className="text-text-secondary">{row.programName}</span>,
    },
    {
      key: "matchScore",
      header: "매칭도",
      align: "center",
      render: (row) => {
        const score = row.matchScore ?? 0;
        const variant: BadgeVariant = score >= 100 ? "success" : score >= 50 ? "warning" : "danger";
        return <Badge variant={variant}>{score}%</Badge>;
      },
    },
    {
      key: "status",
      header: "상태",
      align: "center",
      render: (row) => {
        const badge = SUBSIDY_STATUS_BADGE[row.status] ?? {
          label: row.status,
          variant: "neutral" as BadgeVariant,
        };
        return <Badge variant={badge.variant}>{badge.label}</Badge>;
      },
    },
    {
      key: "monthlyAmount",
      header: "월 지원금",
      align: "right",
      render: (row) => formatKRW(row.programMonthlyAmount),
    },
    {
      key: "actions",
      header: "액션",
      align: "center",
      render: (row) => (
        <div className="flex items-center justify-center gap-sp-2">
          {row.status === "ELIGIBLE" && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleMatchStatusChange(row.id, "APPLIED")}
              disabled={matchActionLoading === row.id}
            >
              신청
            </Button>
          )}
          {row.status === "APPLIED" && (
            <>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleMatchStatusChange(row.id, "APPROVED")}
                disabled={matchActionLoading === row.id}
              >
                승인
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleMatchStatusChange(row.id, "REJECTED")}
                disabled={matchActionLoading === row.id}
              >
                거절
              </Button>
            </>
          )}
          {row.status === "APPROVED" && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleMatchStatusChange(row.id, "RECEIVING")}
              disabled={matchActionLoading === row.id}
            >
              수급시작
            </Button>
          )}
        </div>
      ),
    },
  ];

  // ─── Render ────────────────────────────────────────────

  return (
    <>
      {/* Sub-tab navigation */}
      <div className="mb-sp-4 flex gap-sp-2">
        <Button
          variant={subTab === "programs" ? "primary" : "secondary"}
          size="sm"
          onClick={() => setSubTab("programs")}
        >
          프로그램 관리
        </Button>
        <Button
          variant={subTab === "matches" ? "primary" : "secondary"}
          size="sm"
          onClick={() => setSubTab("matches")}
        >
          매칭 결과
        </Button>
      </div>

      {/* Programs section */}
      {subTab === "programs" && (
        <Card>
          <CardHeader>
            <CardTitle>지원금 프로그램</CardTitle>
            <div className="flex gap-sp-2">
              <Button variant="danger" size="sm" onClick={handleDeleteAll}>
                전체 삭제
              </Button>
              <Button variant="secondary" size="sm" onClick={handleSync} disabled={syncing}>
                {syncing ? "동기화 중..." : "정부 프로그램 동기화"}
              </Button>
              <Button variant="primary" size="sm" onClick={openCreateProgramModal}>
                프로그램 추가
              </Button>
            </div>
          </CardHeader>
          <CardBody>
            {programsLoading ? (
              <div className="flex items-center justify-center py-sp-12">
                <span className="text-sm text-text-tertiary">불러오는 중...</span>
              </div>
            ) : (
              <DataTable<ProgramRow>
                columns={programColumns}
                data={programs}
                keyExtractor={(row) => row.id}
                emptyMessage="등록된 프로그램이 없습니다"
              />
            )}
          </CardBody>
        </Card>
      )}

      {/* Matches section */}
      {subTab === "matches" && (
        <Card>
          <CardHeader>
            <CardTitle>매칭 결과</CardTitle>
            <Button variant="primary" size="sm" onClick={handleRunMatching} disabled={matching}>
              {matching ? "매칭 중..." : "자동 매칭 실행"}
            </Button>
          </CardHeader>
          <CardBody>
            {matchesLoading ? (
              <div className="flex items-center justify-center py-sp-12">
                <span className="text-sm text-text-tertiary">불러오는 중...</span>
              </div>
            ) : (
              <DataTable<MatchRow>
                columns={matchColumns}
                data={matches}
                keyExtractor={(row) => row.id}
                emptyMessage="매칭 결과가 없습니다. '자동 매칭 실행' 버튼을 클릭하세요."
              />
            )}
          </CardBody>
        </Card>
      )}

      {/* Program Create/Edit Modal */}
      <Modal
        open={programModalOpen}
        onClose={() => setProgramModalOpen(false)}
        title={editingProgramId ? "프로그램 수정" : "프로그램 추가"}
        size="lg"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setProgramModalOpen(false)}>
              취소
            </Button>
            <Button variant="primary" size="sm" onClick={handleSaveProgram} disabled={programSaving}>
              {programSaving ? "저장 중..." : "저장"}
            </Button>
          </>
        }
      >
        <div className="space-y-sp-4">
          {programError && (
            <div className="rounded-md bg-status-danger-bg p-sp-3 text-sm text-status-danger-text">
              {programError}
            </div>
          )}

          {/* 기본 정보 */}
          <div className="grid grid-cols-1 gap-sp-4 md:grid-cols-2">
            <Input
              label="프로그램명"
              value={programForm.name}
              onChange={(e) => setProgramForm({ ...programForm, name: e.target.value })}
              placeholder="예: 청년 고용 장려금"
            />
            <Input
              label="제공기관"
              value={programForm.provider}
              onChange={(e) => setProgramForm({ ...programForm, provider: e.target.value })}
              placeholder="예: 고용노동부"
            />
            <Select
              label="카테고리"
              options={CATEGORY_OPTIONS}
              value={programForm.category}
              onChange={(e) => setProgramForm({ ...programForm, category: e.target.value })}
              placeholder="선택"
            />
            <Input
              label="월 지원금 (원)"
              type="number"
              value={programForm.monthlyAmount}
              onChange={(e) => setProgramForm({ ...programForm, monthlyAmount: e.target.value })}
            />
            <Input
              label="최대 지원기간 (개월)"
              type="number"
              value={programForm.maxDurationMonths}
              onChange={(e) => setProgramForm({ ...programForm, maxDurationMonths: e.target.value })}
            />
            <Input
              label="총 최대 지원금 (원)"
              type="number"
              value={programForm.totalMaxAmount}
              onChange={(e) => setProgramForm({ ...programForm, totalMaxAmount: e.target.value })}
            />
            <Input
              label="신청 시작일"
              type="date"
              value={programForm.applicationStart}
              onChange={(e) => setProgramForm({ ...programForm, applicationStart: e.target.value })}
            />
            <Input
              label="신청 종료일"
              type="date"
              value={programForm.applicationEnd}
              onChange={(e) => setProgramForm({ ...programForm, applicationEnd: e.target.value })}
            />
          </div>

          <Textarea
            label="설명"
            rows={3}
            value={programForm.description}
            onChange={(e) => setProgramForm({ ...programForm, description: e.target.value })}
            placeholder="프로그램 설명"
          />

          {/* 수급 기준 */}
          <div>
            <p className="mb-sp-3 text-sm font-semibold text-text-primary">수급 기준 (선택)</p>
            <div className="grid grid-cols-1 gap-sp-4 md:grid-cols-2">
              <Input
                label="최소 연령"
                type="number"
                value={programForm.ageMin}
                onChange={(e) => setProgramForm({ ...programForm, ageMin: e.target.value })}
                placeholder="만 나이"
              />
              <Input
                label="최대 연령"
                type="number"
                value={programForm.ageMax}
                onChange={(e) => setProgramForm({ ...programForm, ageMax: e.target.value })}
                placeholder="만 나이"
              />
              <Input
                label="최소 근속일수"
                type="number"
                value={programForm.minEmployeePeriodDays}
                onChange={(e) => setProgramForm({ ...programForm, minEmployeePeriodDays: e.target.value })}
              />
              <Input
                label="최대 근속일수"
                type="number"
                value={programForm.maxEmployeePeriodDays}
                onChange={(e) => setProgramForm({ ...programForm, maxEmployeePeriodDays: e.target.value })}
              />
            </div>
            <div className="mt-sp-3">
              <p className="mb-sp-2 text-xs font-medium text-text-secondary">고용유형</p>
              <div className="flex flex-wrap gap-sp-2">
                {EMPLOYMENT_TYPE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => toggleEmploymentType(opt.value)}
                    className={[
                      "rounded-md border px-sp-3 py-sp-1 text-xs font-medium transition-colors",
                      programForm.employmentTypes.includes(opt.value)
                        ? "border-brand bg-brand-soft text-brand-text"
                        : "border-border text-text-secondary hover:bg-surface-secondary",
                    ].join(" ")}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-sp-3 flex items-center gap-sp-2">
              <input
                type="checkbox"
                id="disabilityRequired"
                checked={programForm.disabilityRequired}
                onChange={(e) => setProgramForm({ ...programForm, disabilityRequired: e.target.checked })}
                className="h-4 w-4 rounded border-border text-brand"
              />
              <label htmlFor="disabilityRequired" className="text-sm text-text-secondary">
                장애인 등록 필수
              </label>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
