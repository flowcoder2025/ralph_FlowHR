"use client";

import { useState, useMemo } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardBody,
  Badge,
  Button,
  Input,
  Select,
  Textarea,
} from "@/components/ui";

/* ────────────────────────────────────────────
   Types
   ──────────────────────────────────────────── */

interface RequestType {
  id: string;
  icon: string;
  label: string;
  description: string;
  category: "leave" | "attendance" | "expense" | "general";
}

type LeaveFormStep = 1 | 2 | 3;

type LeaveType = "annual" | "half_am" | "half_pm" | "sick" | "family";

interface LeaveFormData {
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
  emergencyContact: string;
}

/* ────────────────────────────────────────────
   Constants
   ──────────────────────────────────────────── */

const REQUEST_TYPES: RequestType[] = [
  { id: "annual", icon: "\uD83C\uDF34", label: "연차 신청", description: "연차 휴가를 신청합니다", category: "leave" },
  { id: "half_day", icon: "\uD83C\uDF24", label: "반차 신청", description: "오전 또는 오후 반차 신청", category: "leave" },
  { id: "sick", icon: "\uD83C\uDFE5", label: "병가 신청", description: "진단서 첨부 병가 신청", category: "leave" },
  { id: "checkin_fix", icon: "\uD83D\uDD50", label: "출근 정정", description: "출근 시간 정정 요청", category: "attendance" },
  { id: "checkout_fix", icon: "\uD83D\uDD55", label: "퇴근 정정", description: "퇴근 시간 정정 요청", category: "attendance" },
  { id: "expense", icon: "\uD83D\uDCB3", label: "경비 청구", description: "업무 관련 경비 청구", category: "expense" },
  { id: "general", icon: "\uD83D\uDCDD", label: "일반 품의", description: "기타 결재 품의 신청", category: "general" },
];

const LEAVE_TYPE_OPTIONS = [
  { value: "annual", label: "연차" },
  { value: "half_am", label: "반차 (오전)" },
  { value: "half_pm", label: "반차 (오후)" },
  { value: "sick", label: "병가" },
  { value: "family", label: "경조사" },
];

const STEP_LABELS = [
  { step: 1 as const, label: "유형 선택" },
  { step: 2 as const, label: "상세 정보" },
  { step: 3 as const, label: "검토 \u00B7 제출" },
];

const INITIAL_FORM_DATA: LeaveFormData = {
  leaveType: "annual",
  startDate: "2026-04-07",
  endDate: "2026-04-08",
  reason: "",
  emergencyContact: "",
};

const REMAINING_LEAVE_DAYS = 8.5;

/* ────────────────────────────────────────────
   Helpers
   ──────────────────────────────────────────── */

function calcDays(start: string, end: string, leaveType: LeaveType): number {
  if (!start || !end) return 0;
  if (leaveType === "half_am" || leaveType === "half_pm") return 0.5;
  const s = new Date(start);
  const e = new Date(end);
  if (isNaN(s.getTime()) || isNaN(e.getTime())) return 0;
  const diff = Math.floor((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  return Math.max(0, diff);
}

function leaveTypeLabel(type: LeaveType): string {
  return LEAVE_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? type;
}

/* ────────────────────────────────────────────
   Page Component
   ──────────────────────────────────────────── */

export default function RequestsPage() {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [formStep, setFormStep] = useState<LeaveFormStep>(1);
  const [formData, setFormData] = useState<LeaveFormData>(INITIAL_FORM_DATA);
  const [submitted, setSubmitted] = useState(false);

  const usedDays = useMemo(
    () => calcDays(formData.startDate, formData.endDate, formData.leaveType),
    [formData.startDate, formData.endDate, formData.leaveType],
  );

  function handleSelectRequestType(id: string) {
    setSelectedType(id);
    const rt = REQUEST_TYPES.find((r) => r.id === id);
    if (rt?.category === "leave") {
      const typeMap: Record<string, LeaveType> = {
        annual: "annual",
        half_day: "half_am",
        sick: "sick",
      };
      setFormData({ ...INITIAL_FORM_DATA, leaveType: typeMap[id] ?? "annual" });
      setFormStep(2);
      setSubmitted(false);
    }
  }

  function handleFormChange(field: keyof LeaveFormData, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit() {
    setSubmitted(true);
    setFormStep(3);
  }

  function handleReset() {
    setSelectedType(null);
    setFormStep(1);
    setFormData(INITIAL_FORM_DATA);
    setSubmitted(false);
  }

  const isLeaveSelected = REQUEST_TYPES.find((r) => r.id === selectedType)?.category === "leave";

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
        {REQUEST_TYPES.map((rt) => (
          <button
            key={rt.id}
            type="button"
            onClick={() => handleSelectRequestType(rt.id)}
            className={[
              "bg-surface-primary border rounded-lg shadow-xs overflow-hidden",
              "text-center p-sp-6 transition-all duration-fast cursor-pointer",
              "hover:shadow-sm hover:border-brand/40",
              "focus:outline-none focus:ring-2 focus:ring-brand/20",
              selectedType === rt.id
                ? "border-brand ring-2 ring-brand/20"
                : "border-border",
            ].join(" ")}
          >
            <div className="text-[32px] mb-sp-3">{rt.icon}</div>
            <div className="font-semibold text-sm text-text-primary mb-sp-1">{rt.label}</div>
            <div className="text-xs text-text-tertiary">{rt.description}</div>
          </button>
        ))}
      </div>

      {/* TE-202: Leave Request Form (3-step) */}
      {isLeaveSelected && (
        <>
          <div className="mb-sp-4">
            <h2 className="text-lg font-semibold text-text-primary">휴가 신청서</h2>
            <p className="text-sm text-text-tertiary mt-sp-1">연차 / 반차 / 병가 신청 양식</p>
          </div>

          <Card className="mb-sp-8">
            <CardHeader>
              <CardTitle>{leaveTypeLabel(formData.leaveType)} 신청</CardTitle>
              {!submitted ? (
                <Badge variant="info">작성 중</Badge>
              ) : (
                <Badge variant="success">제출 완료</Badge>
              )}
            </CardHeader>
            <CardBody>
              {/* Steps Indicator */}
              <div className="flex items-center gap-sp-4 mb-sp-6">
                {STEP_LABELS.map(({ step, label }, idx) => {
                  const isDone = formStep > step || submitted;
                  const isActive = formStep === step && !submitted;
                  return (
                    <div key={step} className="flex items-center gap-sp-2">
                      {idx > 0 && (
                        <div
                          className={[
                            "w-8 h-px",
                            isDone || isActive ? "bg-brand" : "bg-border",
                          ].join(" ")}
                        />
                      )}
                      <div className="flex items-center gap-sp-2">
                        <span
                          className={[
                            "inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold",
                            isDone
                              ? "bg-brand text-white"
                              : isActive
                                ? "bg-brand text-white"
                                : "bg-surface-secondary text-text-tertiary border border-border",
                          ].join(" ")}
                        >
                          {isDone && !isActive ? "\u2713" : step}
                        </span>
                        <span
                          className={[
                            "text-sm font-medium whitespace-nowrap",
                            isDone || isActive ? "text-text-primary" : "text-text-tertiary",
                          ].join(" ")}
                        >
                          {label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Step 2: Details Form */}
              {formStep === 2 && !submitted && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-sp-6">
                  <div>
                    <Select
                      label="휴가 유형"
                      options={LEAVE_TYPE_OPTIONS}
                      value={formData.leaveType}
                      onChange={(e) =>
                        handleFormChange("leaveType", e.target.value)
                      }
                    />
                    <Input
                      label="시작일"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) =>
                        handleFormChange("startDate", e.target.value)
                      }
                    />
                    <Input
                      label="종료일"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) =>
                        handleFormChange("endDate", e.target.value)
                      }
                    />
                    <div className="mb-sp-4">
                      <label className="block text-sm font-medium text-text-secondary mb-sp-1">
                        사용 일수
                      </label>
                      <input
                        type="text"
                        readOnly
                        value={`${usedDays}일`}
                        className="w-full px-sp-3 py-sp-2 border border-border rounded-sm text-md bg-surface-secondary text-text-primary cursor-default"
                      />
                      <p className="text-xs text-text-tertiary mt-sp-1">
                        잔여 연차: {REMAINING_LEAVE_DAYS}일
                      </p>
                    </div>
                  </div>
                  <div>
                    <Textarea
                      label="사유"
                      rows={4}
                      placeholder="휴가 사유를 입력해 주세요"
                      value={formData.reason}
                      onChange={(e) =>
                        handleFormChange("reason", e.target.value)
                      }
                    />
                    <div className="mb-sp-4">
                      <label className="block text-sm font-medium text-text-secondary mb-sp-1">
                        결재자
                      </label>
                      <div className="flex items-center gap-sp-3 p-sp-3 bg-surface-secondary rounded-sm">
                        <div className="w-8 h-8 rounded-full bg-brand/20 text-brand flex items-center justify-center text-sm font-bold">
                          박
                        </div>
                        <div>
                          <div className="font-semibold text-sm text-text-primary">박서준</div>
                          <div className="text-xs text-text-tertiary">Product 팀 리더</div>
                        </div>
                      </div>
                      <p className="text-xs text-text-tertiary mt-sp-1">
                        직속 상관이 자동 지정됩니다
                      </p>
                    </div>
                    <Input
                      label="비상 연락"
                      type="tel"
                      placeholder="휴가 중 연락 가능한 번호"
                      value={formData.emergencyContact}
                      onChange={(e) =>
                        handleFormChange("emergencyContact", e.target.value)
                      }
                    />
                  </div>
                </div>
              )}

              {/* Step 3: Review */}
              {(formStep === 3 || submitted) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-sp-6">
                  <div className="space-y-sp-3">
                    <ReviewRow label="휴가 유형" value={leaveTypeLabel(formData.leaveType)} />
                    <ReviewRow label="시작일" value={formData.startDate} />
                    <ReviewRow label="종료일" value={formData.endDate} />
                    <ReviewRow label="사용 일수" value={`${usedDays}일`} />
                  </div>
                  <div className="space-y-sp-3">
                    <ReviewRow label="사유" value={formData.reason || "—"} />
                    <ReviewRow label="결재자" value="박서준 (Product 팀 리더)" />
                    <ReviewRow label="비상 연락" value={formData.emergencyContact || "—"} />
                    {submitted && (
                      <ReviewRow label="상태" value="결재 대기 중" highlight />
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-sp-3 mt-sp-4 pt-sp-4 border-t border-border-subtle">
                {formStep === 2 && !submitted && (
                  <>
                    <Button variant="primary" onClick={() => setFormStep(3)}>
                      다음
                    </Button>
                    <Button variant="secondary" onClick={handleReset}>
                      임시 저장
                    </Button>
                    <Button variant="ghost" onClick={handleReset}>
                      취소
                    </Button>
                  </>
                )}
                {formStep === 3 && !submitted && (
                  <>
                    <Button variant="primary" onClick={handleSubmit}>
                      신청하기
                    </Button>
                    <Button variant="secondary" onClick={() => setFormStep(2)}>
                      이전
                    </Button>
                    <Button variant="ghost" onClick={handleReset}>
                      취소
                    </Button>
                  </>
                )}
                {submitted && (
                  <Button variant="secondary" onClick={handleReset}>
                    새 요청 작성
                  </Button>
                )}
              </div>
            </CardBody>
          </Card>
        </>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────
   Sub-components
   ──────────────────────────────────────────── */

function ReviewRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-sp-2 border-b border-border-subtle last:border-b-0">
      <span className="text-sm text-text-tertiary">{label}</span>
      <span
        className={[
          "text-sm font-medium",
          highlight ? "text-brand" : "text-text-primary",
        ].join(" ")}
      >
        {value}
      </span>
    </div>
  );
}
