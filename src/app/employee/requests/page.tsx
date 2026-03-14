"use client";

import { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardBody,
  Badge,
  Button,
  Select,
  Input,
  Textarea,
} from "@/components/ui";

/* ────────────────────────────────────────────
   Types
   ──────────────────────────────────────────── */

type RequestTypeId =
  | "annual"
  | "half_day"
  | "sick"
  | "check_in_fix"
  | "check_out_fix"
  | "expense"
  | "general";

interface RequestType {
  id: RequestTypeId;
  icon: string;
  label: string;
  description: string;
}

type FormStep = 1 | 2 | 3;

interface LeaveFormData {
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string;
  emergencyContact: string;
}

/* ────────────────────────────────────────────
   Constants
   ──────────────────────────────────────────── */

const REQUEST_TYPES: RequestType[] = [
  { id: "annual", icon: "\uD83C\uDF34", label: "연차 신청", description: "연차 휴가를 신청합니다" },
  { id: "half_day", icon: "\uD83C\uDF24", label: "반차 신청", description: "오전 또는 오후 반차 신청" },
  { id: "sick", icon: "\uD83C\uDFE5", label: "병가 신청", description: "진단서 첨부 병가 신청" },
  { id: "check_in_fix", icon: "\uD83D\uDD50", label: "출근 정정", description: "출근 시간 정정 요청" },
  { id: "check_out_fix", icon: "\uD83D\uDD55", label: "퇴근 정정", description: "퇴근 시간 정정 요청" },
  { id: "expense", icon: "\uD83D\uDCB3", label: "경비 청구", description: "업무 관련 경비 청구" },
  { id: "general", icon: "\uD83D\uDCDD", label: "일반 품의", description: "기타 결재 품의 신청" },
];

const LEAVE_TYPE_OPTIONS = [
  { value: "annual", label: "연차" },
  { value: "half_am", label: "반차 (오전)" },
  { value: "half_pm", label: "반차 (오후)" },
  { value: "sick", label: "병가" },
  { value: "family", label: "경조사" },
];

const STEP_LABELS = [
  { num: 1, label: "유형 선택" },
  { num: 2, label: "상세 정보" },
  { num: 3, label: "검토 \u00B7 제출" },
];

const MOCK_APPROVER = { name: "박서준", role: "Product 팀 리더", initial: "박" };
const MOCK_REMAINING_DAYS = "8.5";

/* ────────────────────────────────────────────
   Helpers
   ──────────────────────────────────────────── */

function calcDays(start: string, end: string): string {
  if (!start || !end) return "0일";
  const s = new Date(start);
  const e = new Date(end);
  const diff = Math.max(1, Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1);
  return `${diff}일`;
}

function getLeaveTypeLabel(value: string): string {
  return LEAVE_TYPE_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

/* ────────────────────────────────────────────
   Sub-components
   ──────────────────────────────────────────── */

function StepIndicator({ currentStep }: { currentStep: FormStep }) {
  return (
    <div className="flex items-center gap-sp-4 mb-sp-6">
      {STEP_LABELS.map(({ num, label }) => {
        const isDone = num < currentStep;
        const isActive = num === currentStep;
        return (
          <div key={num} className="flex items-center gap-sp-2">
            <span
              className={[
                "inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold",
                isDone
                  ? "bg-status-success-solid text-white"
                  : isActive
                    ? "bg-brand text-white"
                    : "bg-surface-secondary text-text-tertiary",
              ].join(" ")}
            >
              {isDone ? "\u2713" : num}
            </span>
            <span
              className={[
                "text-sm font-medium",
                isActive ? "text-text-primary" : isDone ? "text-status-success-text" : "text-text-tertiary",
              ].join(" ")}
            >
              {label}
            </span>
            {num < STEP_LABELS.length && (
              <div className="w-8 h-px bg-border-subtle ml-sp-2" />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ────────────────────────────────────────────
   Page Component
   ──────────────────────────────────────────── */

export default function RequestsPage() {
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [currentStep, setCurrentStep] = useState<FormStep>(1);
  const [formData, setFormData] = useState<LeaveFormData>({
    leaveType: "annual",
    startDate: "2026-04-07",
    endDate: "2026-04-08",
    reason: "",
    emergencyContact: "",
  });

  function handleRequestTypeClick(type: RequestTypeId) {
    if (type === "annual" || type === "half_day" || type === "sick") {
      setShowLeaveForm(true);
      setCurrentStep(1);
      const leaveMap: Record<string, string> = {
        annual: "annual",
        half_day: "half_am",
        sick: "sick",
      };
      setFormData((prev) => ({ ...prev, leaveType: leaveMap[type] ?? "annual" }));
    }
  }

  function handleNext() {
    if (currentStep < 3) setCurrentStep((s) => (s + 1) as FormStep);
  }

  function handleBack() {
    if (currentStep > 1) setCurrentStep((s) => (s - 1) as FormStep);
  }

  function handleCancel() {
    setShowLeaveForm(false);
    setCurrentStep(1);
    setFormData({ leaveType: "annual", startDate: "2026-04-07", endDate: "2026-04-08", reason: "", emergencyContact: "" });
  }

  function handleSubmit() {
    setShowLeaveForm(false);
    setCurrentStep(1);
  }

  const usedDays = calcDays(formData.startDate, formData.endDate);

  return (
    <div>
      {/* Page Header */}
      <div className="mb-sp-6">
        <div className="text-sm text-text-tertiary mb-sp-1">홈 &gt; 요청</div>
        <h1 className="text-xl font-bold text-text-primary">요청</h1>
        <p className="text-sm text-text-tertiary mt-sp-1">
          휴가, 근태 정정, 경비 등 다양한 요청을 신청하세요
        </p>
      </div>

      {/* TE-201: New Request Hub */}
      <div className="mb-sp-4">
        <h2 className="text-lg font-semibold text-text-primary">새 요청</h2>
        <p className="text-sm text-text-tertiary mt-sp-1">신청할 요청 유형을 선택하세요</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-sp-4 mb-sp-8">
        {REQUEST_TYPES.map((type) => (
          <button
            key={type.id}
            type="button"
            onClick={() => handleRequestTypeClick(type.id)}
            className="group text-left"
          >
            <Card className="h-full transition-shadow hover:shadow-md cursor-pointer group-focus-visible:ring-2 group-focus-visible:ring-brand">
              <CardBody className="text-center py-sp-6 px-sp-4">
                <div className="text-3xl mb-sp-3">{type.icon}</div>
                <div className="font-semibold text-sm text-text-primary mb-sp-1">
                  {type.label}
                </div>
                <div className="text-xs text-text-tertiary">{type.description}</div>
              </CardBody>
            </Card>
          </button>
        ))}
      </div>

      {/* TE-202: Leave Request Form (3-step) */}
      {showLeaveForm && (
        <>
          <div className="mb-sp-4">
            <h2 className="text-lg font-semibold text-text-primary">휴가 신청서</h2>
            <p className="text-sm text-text-tertiary mt-sp-1">연차 / 반차 / 병가 신청 양식</p>
          </div>

          <Card className="mb-sp-6">
            <CardHeader>
              <CardTitle>
                {getLeaveTypeLabel(formData.leaveType)} 신청
              </CardTitle>
              <Badge variant="info">작성 중</Badge>
            </CardHeader>
            <CardBody>
              <StepIndicator currentStep={currentStep} />

              {/* Step 1: 유형 선택 */}
              {currentStep === 1 && (
                <div className="max-w-md">
                  <Select
                    label="휴가 유형"
                    options={LEAVE_TYPE_OPTIONS}
                    value={formData.leaveType}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, leaveType: e.target.value }))
                    }
                  />
                  <div className="bg-surface-secondary rounded-md p-sp-4 mt-sp-2">
                    <div className="text-sm font-medium text-text-secondary mb-sp-1">
                      선택된 유형
                    </div>
                    <div className="text-lg font-bold text-text-primary">
                      {getLeaveTypeLabel(formData.leaveType)}
                    </div>
                    <div className="text-xs text-text-tertiary mt-sp-1">
                      잔여 연차: {MOCK_REMAINING_DAYS}일
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: 상세 정보 */}
              {currentStep === 2 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-sp-6">
                  <div>
                    <Select
                      label="휴가 유형"
                      options={LEAVE_TYPE_OPTIONS}
                      value={formData.leaveType}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, leaveType: e.target.value }))
                      }
                    />
                    <Input
                      label="시작일"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, startDate: e.target.value }))
                      }
                    />
                    <Input
                      label="종료일"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, endDate: e.target.value }))
                      }
                    />
                    <Input
                      label="사용 일수"
                      value={usedDays}
                      readOnly
                      hint={`잔여 연차: ${MOCK_REMAINING_DAYS}일`}
                      className="bg-surface-secondary"
                    />
                  </div>
                  <div>
                    <Textarea
                      label="사유"
                      rows={4}
                      placeholder="휴가 사유를 입력해 주세요"
                      value={formData.reason}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, reason: e.target.value }))
                      }
                    />
                    <div className="mb-sp-4">
                      <label className="block text-sm font-medium text-text-secondary mb-sp-1">
                        결재자
                      </label>
                      <div className="flex items-center gap-sp-3 p-sp-3 bg-surface-secondary rounded-sm">
                        <div className="w-8 h-8 rounded-full bg-brand text-white flex items-center justify-center text-xs font-bold">
                          {MOCK_APPROVER.initial}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-text-primary">
                            {MOCK_APPROVER.name}
                          </div>
                          <div className="text-xs text-text-tertiary">
                            {MOCK_APPROVER.role}
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-text-tertiary mt-sp-1">
                        직속 상관이 자동 지정됩니다
                      </p>
                    </div>
                    <Input
                      label="비상 연락"
                      placeholder="휴가 중 연락 가능한 번호"
                      value={formData.emergencyContact}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          emergencyContact: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
              )}

              {/* Step 3: 검토 · 제출 */}
              {currentStep === 3 && (
                <div className="max-w-lg space-y-sp-4">
                  <h3 className="text-md font-semibold text-text-primary mb-sp-4">
                    신청 내용을 검토하세요
                  </h3>
                  <div className="divide-y divide-border-subtle rounded-md border border-border overflow-hidden">
                    <ReviewRow label="휴가 유형" value={getLeaveTypeLabel(formData.leaveType)} />
                    <ReviewRow label="기간" value={`${formData.startDate} ~ ${formData.endDate}`} />
                    <ReviewRow label="사용 일수" value={usedDays} />
                    <ReviewRow label="사유" value={formData.reason || "(미입력)"} />
                    <ReviewRow label="결재자" value={`${MOCK_APPROVER.name} (${MOCK_APPROVER.role})`} />
                    <ReviewRow label="비상 연락" value={formData.emergencyContact || "(미입력)"} />
                  </div>
                  <div className="bg-status-info-bg border border-status-info-border rounded-md p-sp-4">
                    <p className="text-sm text-status-info-text">
                      신청 후 결재자의 승인을 받아야 확정됩니다. 승인/반려 결과는 알림으로 안내됩니다.
                    </p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-sp-3 mt-sp-6 pt-sp-4 border-t border-border-subtle">
                {currentStep === 3 ? (
                  <Button variant="primary" onClick={handleSubmit}>
                    신청하기
                  </Button>
                ) : (
                  <Button variant="primary" onClick={handleNext}>
                    다음
                  </Button>
                )}
                {currentStep > 1 && (
                  <Button variant="secondary" onClick={handleBack}>
                    이전
                  </Button>
                )}
                <Button variant="ghost" onClick={handleCancel}>
                  취소
                </Button>
              </div>
            </CardBody>
          </Card>
        </>
      )}
    </div>
  );
}

/* ── Review row for step 3 ── */

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start px-sp-4 py-sp-3">
      <span className="text-sm text-text-tertiary w-28 shrink-0">{label}</span>
      <span className="text-sm text-text-primary">{value}</span>
    </div>
  );
}
