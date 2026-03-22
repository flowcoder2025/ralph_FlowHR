"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardBody,
  Badge,
  Button,
  ProgressBar,
} from "@/components/ui";
import type { BadgeVariant } from "@/components/ui";
import { useToast } from "@/components/layout/Toast";

/* ────────────────────────────────────────────
   Types
   ──────────────────────────────────────────── */

interface ProfileData {
  name: string;
  employeeNumber: string;
  email: string;
  phone: string;
  department: string;
  position: string;
  hireDate: string;
  birthDate: string | null;
  gender: string | null;
  status: string;
  type: string;
  avatar: string;
}

interface LeaveBalanceItem {
  type: string;
  label: string;
  total: number;
  used: number;
  pending: number;
}

interface GoalItem {
  id: string;
  title: string;
  progress: number;
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
  dueDate: string;
}

interface EvaluationSummary {
  cycleName: string;
  selfScore: number | null;
  managerScore: number | null;
  finalScore: number | null;
  status: string;
}

interface OneOnOneItem {
  id: string;
  managerName: string;
  scheduledAt: string;
  duration: number;
  status: "SCHEDULED" | "COMPLETED" | "CANCELLED";
  agenda: string | null;
}

interface ProfileResponse {
  data: {
    profile: ProfileData;
    leaveBalances: LeaveBalanceItem[];
    goals: GoalItem[];
    evaluation: EvaluationSummary | null;
    oneOnOnes: OneOnOneItem[];
  };
}

/* ────────────────────────────────────────────
   Constants
   ──────────────────────────────────────────── */

const STATUS_MAP: Record<string, { label: string; variant: BadgeVariant }> = {
  ACTIVE: { label: "재직 중", variant: "success" },
  ON_LEAVE: { label: "휴직", variant: "neutral" },
  PENDING_RESIGNATION: { label: "퇴사 예정", variant: "warning" },
  RESIGNED: { label: "퇴사", variant: "danger" },
};

const TYPE_MAP: Record<string, string> = {
  FULL_TIME: "정규직",
  PART_TIME: "파트타임",
  CONTRACT: "계약직",
  INTERN: "인턴",
};

const GOAL_STATUS_MAP: Record<string, { label: string; variant: BadgeVariant }> = {
  NOT_STARTED: { label: "시작 전", variant: "neutral" },
  IN_PROGRESS: { label: "진행 중", variant: "info" },
  COMPLETED: { label: "완료", variant: "success" },
};

const ONE_ON_ONE_STATUS_MAP: Record<string, { label: string; variant: BadgeVariant }> = {
  SCHEDULED: { label: "예정", variant: "info" },
  COMPLETED: { label: "완료", variant: "success" },
  CANCELLED: { label: "취소", variant: "danger" },
};

/* ────────────────────────────────────────────
   Helpers
   ──────────────────────────────────────────── */

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.toLocaleDateString("ko-KR", { month: "short", day: "numeric" })} ${d.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}`;
}

function getTenure(hireDate: string): string {
  const hire = new Date(hireDate);
  const now = new Date();
  const years = now.getFullYear() - hire.getFullYear();
  const months = now.getMonth() - hire.getMonth();
  const totalMonths = years * 12 + months;
  const y = Math.floor(totalMonths / 12);
  const m = totalMonths % 12;
  if (y === 0) return `${m}개월`;
  if (m === 0) return `${y}년`;
  return `${y}년 ${m}개월`;
}

/* ────────────────────────────────────────────
   Tab type
   ──────────────────────────────────────────── */

type ProfileTab = "basic" | "leave" | "performance" | "oneOnOne";

const TABS: { id: ProfileTab; label: string }[] = [
  { id: "basic", label: "기본정보" },
  { id: "leave", label: "휴가 잔여" },
  { id: "performance", label: "성과" },
  { id: "oneOnOne", label: "1:1" },
];

/* ────────────────────────────────────────────
   Page Component
   ──────────────────────────────────────────── */

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<ProfileTab>("basic");
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalanceItem[]>([]);
  const [goals, setGoals] = useState<GoalItem[]>([]);
  const [evaluation, setEvaluation] = useState<EvaluationSummary | null>(null);
  const [oneOnOnes, setOneOnOnes] = useState<OneOnOneItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch("/api/employee/profile");
        if (!res.ok) {
          throw new Error(res.status === 401 ? "인증이 필요합니다" : "프로필을 불러올 수 없습니다");
        }
        const json: ProfileResponse = await res.json();
        setProfile(json.data.profile);
        setLeaveBalances(json.data.leaveBalances);
        setGoals(json.data.goals);
        setEvaluation(json.data.evaluation);
        setOneOnOnes(json.data.oneOnOnes);
      } catch (err) {
        setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다");
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-sm text-text-tertiary">프로필을 불러오는 중...</div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-sm text-status-error">{error ?? "프로필을 불러올 수 없습니다"}</div>
      </div>
    );
  }

  const statusInfo = STATUS_MAP[profile.status];
  const totalLeaveRemaining = leaveBalances.reduce(
    (sum, b) => sum + (b.total - b.used - b.pending),
    0
  );

  return (
    <div>
      {/* Page Header */}
      <div className="mb-sp-6">
        <div className="text-sm text-text-tertiary mb-sp-1">홈 &gt; 내 정보</div>
        <h1 className="text-xl font-bold text-text-primary">내 정보</h1>
        <p className="text-sm text-text-tertiary mt-sp-1">
          나의 프로필, 휴가 잔여, 성과, 1:1 미팅 정보를 확인합니다
        </p>
      </div>

      {/* Profile Hero */}
      <Card className="mb-sp-6">
        <CardBody>
          <div className="flex flex-col sm:flex-row items-center sm:items-center gap-sp-4 sm:gap-sp-6">
            <div className="flex h-16 w-16 sm:h-20 sm:w-20 shrink-0 items-center justify-center rounded-full bg-brand-soft text-xl sm:text-2xl font-bold text-brand-text">
              {profile.avatar}
            </div>
            <div className="flex-1 min-w-0 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-sp-3 mb-sp-1">
                <span className="text-lg sm:text-xl font-bold text-text-primary">
                  {profile.name}
                </span>
                {statusInfo && (
                  <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                )}
              </div>
              <div className="text-sm text-text-secondary mb-sp-1">
                {profile.department} · {profile.position}
              </div>
              <div className="text-xs sm:text-sm text-text-tertiary">
                사번: {profile.employeeNumber} · 입사일: {formatDate(profile.hireDate)} · 근속: {getTenure(profile.hireDate)}
              </div>
            </div>
            {/* Leave balance - visible on mobile too (below name) */}
            <div className="flex flex-col items-center sm:items-end gap-sp-2">
              <div className="text-center sm:text-right">
                <div className="text-xs text-text-tertiary">잔여 연차</div>
                <div className="text-2xl font-bold text-brand">
                  {totalLeaveRemaining}
                  <span className="text-sm font-normal text-text-tertiary ml-sp-1">일</span>
                </div>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Tabs */}
      <div className="flex gap-sp-1 border-b border-border mb-sp-6 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={[
              "px-sp-3 md:px-sp-4 py-sp-3 text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap min-h-[44px]",
              activeTab === tab.id
                ? "border-brand text-brand"
                : "border-transparent text-text-tertiary hover:text-text-secondary",
            ].join(" ")}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "basic" && <BasicInfoTab profile={profile} />}
      {activeTab === "leave" && <LeaveBalanceTab leaveBalances={leaveBalances} />}
      {activeTab === "performance" && <PerformanceTab goals={goals} evaluation={evaluation} />}
      {activeTab === "oneOnOne" && <OneOnOneTab oneOnOnes={oneOnOnes} />}
    </div>
  );
}

/* ────────────────────────────────────────────
   Tab: 기본정보 + 연락처
   ──────────────────────────────────────────── */

function BasicInfoTab({ profile }: { profile: ProfileData }) {
  const { addToast } = useToast();
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-sp-6">
      {/* 기본정보 */}
      <Card>
        <CardHeader>
          <CardTitle>기본 정보</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="space-y-sp-3">
            <InfoRow label="이름" value={profile.name} />
            <InfoRow label="사번" value={profile.employeeNumber} />
            <InfoRow label="부서" value={profile.department} />
            <InfoRow label="직위" value={profile.position} />
            <InfoRow label="입사일" value={formatDate(profile.hireDate)} />
            <InfoRow label="근속 기간" value={getTenure(profile.hireDate)} />
            <InfoRow label="고용 형태" value={TYPE_MAP[profile.type] ?? profile.type} />
            <InfoRow label="생년월일" value={profile.birthDate ? new Date(profile.birthDate).toLocaleDateString("ko-KR") : "—"} />
            <InfoRow label="성별" value={profile.gender === "MALE" ? "남성" : profile.gender === "FEMALE" ? "여성" : "—"} />
            <InfoRow
              label="재직 상태"
              value={STATUS_MAP[profile.status]?.label ?? profile.status}
            />
          </div>
        </CardBody>
      </Card>

      {/* 연락처 */}
      <Card>
        <CardHeader>
          <CardTitle>연락처</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="space-y-sp-3">
            <InfoRow label="이메일" value={profile.email} />
            <InfoRow label="전화번호" value={profile.phone} />
          </div>
          <div className="mt-sp-6 pt-sp-4 border-t border-border-subtle">
            <p className="text-xs text-text-tertiary mb-sp-3">
              전화번호, 이메일 변경이 필요하면 아래 버튼으로 HR 담당자에게 요청해 주세요.
            </p>
            <Button size="sm" variant="secondary" onClick={async () => {
              try {
                const res = await fetch("/api/employee/profile", {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    requestType: "info_change",
                    email: profile.email,
                    phone: profile.phone,
                  }),
                });
                if (!res.ok) throw new Error("요청 실패");
                addToast({ message: "연락처 수정 요청이 성공적으로 제출되었습니다.", variant: "success" });
              } catch {
                addToast({ message: "연락처 수정 요청에 실패했습니다. 다시 시도해 주세요.", variant: "danger" });
              }
            }}>
              연락처 수정 요청
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

/* ────────────────────────────────────────────
   Tab: 휴가 잔여
   ──────────────────────────────────────────── */

function LeaveBalanceTab({ leaveBalances }: { leaveBalances: LeaveBalanceItem[] }) {
  const totalUsed = leaveBalances.reduce((s, b) => s + b.used, 0);
  const totalAll = leaveBalances.reduce((s, b) => s + b.total, 0);
  const totalPending = leaveBalances.reduce((s, b) => s + b.pending, 0);
  const totalRemaining = totalAll - totalUsed - totalPending;

  return (
    <div>
      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-sp-3 md:gap-sp-4 mb-sp-6">
        <SummaryCard label="총 부여" value={`${totalAll}일`} />
        <SummaryCard label="사용" value={`${totalUsed}일`} />
        <SummaryCard label="승인 대기" value={`${totalPending}일`} />
        <SummaryCard label="잔여" value={`${totalRemaining}일`} highlight />
      </div>

      {/* Detail Table */}
      <Card>
        <CardHeader>
          <CardTitle>유형별 휴가 잔여</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[540px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-sp-3 px-sp-4 text-text-secondary font-medium">유형</th>
                  <th className="text-right py-sp-3 px-sp-4 text-text-secondary font-medium">부여</th>
                  <th className="text-right py-sp-3 px-sp-4 text-text-secondary font-medium">사용</th>
                  <th className="text-right py-sp-3 px-sp-4 text-text-secondary font-medium">대기</th>
                  <th className="text-right py-sp-3 px-sp-4 text-text-secondary font-medium">잔여</th>
                  <th className="py-sp-3 px-sp-4 text-text-secondary font-medium w-40">사용률</th>
                </tr>
              </thead>
              <tbody>
                {leaveBalances.map((bal) => {
                  const remaining = bal.total - bal.used - bal.pending;
                  const usagePercent = bal.total > 0 ? Math.round((bal.used / bal.total) * 100) : 0;
                  return (
                    <tr key={bal.type} className="border-b border-border-subtle">
                      <td className="py-sp-3 px-sp-4 font-medium text-text-primary">{bal.label}</td>
                      <td className="py-sp-3 px-sp-4 text-right text-text-primary">{bal.total}</td>
                      <td className="py-sp-3 px-sp-4 text-right text-text-primary">{bal.used}</td>
                      <td className="py-sp-3 px-sp-4 text-right text-text-tertiary">
                        {bal.pending > 0 ? bal.pending : "—"}
                      </td>
                      <td className="py-sp-3 px-sp-4 text-right font-semibold text-brand">
                        {remaining}
                      </td>
                      <td className="py-sp-3 px-sp-4">
                        <div className="flex items-center gap-sp-2">
                          <ProgressBar value={usagePercent} variant="brand" className="flex-1" />
                          <span className="text-xs text-text-tertiary w-10 text-right">
                            {usagePercent}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

/* ────────────────────────────────────────────
   Tab: 성과
   ──────────────────────────────────────────── */

function PerformanceTab({ goals, evaluation }: { goals: GoalItem[]; evaluation: EvaluationSummary | null }) {
  return (
    <div className="space-y-sp-6">
      {/* Evaluation Summary */}
      {evaluation && (
        <Card>
          <CardHeader>
            <CardTitle>최근 평가</CardTitle>
            <Badge variant={evaluation.status === "COMPLETED" ? "success" : "info"}>
              {evaluation.status === "COMPLETED" ? "완료" : "진행 중"}
            </Badge>
          </CardHeader>
          <CardBody>
            <div className="mb-sp-3 text-sm text-text-secondary">
              {evaluation.cycleName}
            </div>
            <div className="grid grid-cols-3 gap-sp-3 md:gap-sp-4">
              <ScoreCard
                label="자기 평가"
                score={evaluation.selfScore}
              />
              <ScoreCard
                label="매니저 평가"
                score={evaluation.managerScore}
              />
              <ScoreCard
                label="최종 점수"
                score={evaluation.finalScore}
                highlight
              />
            </div>
          </CardBody>
        </Card>
      )}

      {!evaluation && (
        <Card>
          <CardHeader>
            <CardTitle>최근 평가</CardTitle>
          </CardHeader>
          <CardBody>
            <p className="text-sm text-text-tertiary py-sp-4 text-center">
              평가 데이터가 없습니다
            </p>
          </CardBody>
        </Card>
      )}

      {/* Goals */}
      <Card>
        <CardHeader>
          <CardTitle>목표 현황</CardTitle>
          <Badge variant="neutral">
            {goals.filter((g) => g.status === "COMPLETED").length}/{goals.length} 완료
          </Badge>
        </CardHeader>
        <CardBody>
          {goals.length === 0 ? (
            <p className="text-sm text-text-tertiary py-sp-4 text-center">
              등록된 목표가 없습니다
            </p>
          ) : (
            <div className="space-y-sp-4">
              {goals.map((goal) => {
                const statusInfo = GOAL_STATUS_MAP[goal.status];
                return (
                  <div
                    key={goal.id}
                    className="flex items-start gap-sp-4 p-sp-4 rounded-lg border border-border-subtle"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-sp-2 mb-sp-2">
                        <span className="text-sm font-medium text-text-primary">
                          {goal.title}
                        </span>
                        {statusInfo && (
                          <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-sp-3">
                        <ProgressBar
                          value={goal.progress}
                          variant={goal.status === "COMPLETED" ? "success" : "brand"}
                          className="flex-1"
                        />
                        <span className="text-sm font-semibold text-text-primary w-12 text-right">
                          {goal.progress}%
                        </span>
                      </div>
                      {goal.dueDate && (
                        <div className="text-xs text-text-tertiary mt-sp-1">
                          마감: {formatDate(goal.dueDate)}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

/* ────────────────────────────────────────────
   Tab: 1:1
   ──────────────────────────────────────────── */

function OneOnOneTab({ oneOnOnes }: { oneOnOnes: OneOnOneItem[] }) {
  const upcoming = oneOnOnes.filter((o) => o.status === "SCHEDULED");
  const past = oneOnOnes.filter((o) => o.status !== "SCHEDULED");

  return (
    <div className="space-y-sp-6">
      {/* Upcoming */}
      <Card>
        <CardHeader>
          <CardTitle>예정된 1:1</CardTitle>
          {upcoming.length > 0 && (
            <Badge variant="info">{upcoming.length}건</Badge>
          )}
        </CardHeader>
        <CardBody>
          {upcoming.length === 0 ? (
            <p className="text-sm text-text-tertiary py-sp-4 text-center">
              예정된 1:1 미팅이 없습니다
            </p>
          ) : (
            <div className="space-y-sp-3">
              {upcoming.map((meeting) => (
                <MeetingRow key={meeting.id} meeting={meeting} />
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Past */}
      <Card>
        <CardHeader>
          <CardTitle>지난 1:1</CardTitle>
        </CardHeader>
        <CardBody>
          {past.length === 0 ? (
            <p className="text-sm text-text-tertiary py-sp-4 text-center">
              지난 1:1 기록이 없습니다
            </p>
          ) : (
            <div className="space-y-sp-3">
              {past.map((meeting) => (
                <MeetingRow key={meeting.id} meeting={meeting} />
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

/* ────────────────────────────────────────────
   Sub-components
   ──────────────────────────────────────────── */

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border-subtle py-sp-2">
      <span className="text-sm text-text-secondary">{label}</span>
      <span className="text-sm font-medium text-text-primary">{value}</span>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={[
        "rounded-xl border p-sp-4 text-center",
        highlight
          ? "border-brand bg-brand-soft"
          : "border-border bg-surface-primary",
      ].join(" ")}
    >
      <div className="text-xs text-text-tertiary mb-sp-1">{label}</div>
      <div
        className={[
          "text-xl font-bold",
          highlight ? "text-brand" : "text-text-primary",
        ].join(" ")}
      >
        {value}
      </div>
    </div>
  );
}

function ScoreCard({
  label,
  score,
  highlight = false,
}: {
  label: string;
  score: number | null;
  highlight?: boolean;
}) {
  return (
    <div
      className={[
        "rounded-xl border p-sp-4 text-center",
        highlight
          ? "border-brand bg-brand-soft"
          : "border-border-subtle bg-surface-secondary",
      ].join(" ")}
    >
      <div className="text-xs text-text-tertiary mb-sp-2">{label}</div>
      <div
        className={[
          "text-2xl font-bold",
          highlight ? "text-brand" : "text-text-primary",
        ].join(" ")}
      >
        {score !== null ? score.toFixed(1) : "—"}
      </div>
      <div className="text-xs text-text-tertiary mt-sp-1">/ 5.0</div>
    </div>
  );
}

function MeetingRow({ meeting }: { meeting: OneOnOneItem }) {
  const statusInfo = ONE_ON_ONE_STATUS_MAP[meeting.status];
  return (
    <div className="flex items-start gap-sp-4 p-sp-4 rounded-lg border border-border-subtle">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-soft text-sm font-semibold text-brand">
        {meeting.managerName.slice(0, 1)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-sp-2 mb-sp-1">
          <span className="text-sm font-medium text-text-primary">
            {meeting.managerName}
          </span>
          {statusInfo && (
            <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
          )}
        </div>
        <div className="text-xs text-text-tertiary mb-sp-1">
          {formatDateTime(meeting.scheduledAt)} · {meeting.duration}분
        </div>
        {meeting.agenda && (
          <div className="text-sm text-text-secondary">{meeting.agenda}</div>
        )}
      </div>
    </div>
  );
}
