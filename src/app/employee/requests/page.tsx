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
  | "checkin_correction"
  | "checkout_correction"
  | "expense"
  | "general";

interface RequestType {
  id: RequestTypeId;
  icon: string;
  title: string;
  description: string;
}

type FormStep = 1 | 2 | 3;

type LeaveType = "annual" | "half_am" | "half_pm" | "sick" | "family";

/* ────────────────────────────────────────────
   Mock Data
   ──────────────────────────────────────────── */

const REQUEST_TYPES: RequestType[] = [
  { id: "annual", icon: "\uD83C\uDFD6\uFE0F", title: "연차 신청", description: "연차 휴가를 신청합니다" },
  { id: "half_day", icon: "\u26C5", title: "반차 신청", description: "오전 또는 오후 반차 신청" },
  { id: "sick", icon: "\uD83C\uDFE5", title: "병가 신청", description: "진단서 첨부 병가 신청" },
  { id: "checkin_correction", icon: "\uD83D\uDD50", title: "출근 정정", description: "출근 시간 정정 요청" },
  { id: "checkout_correction", icon: "\uD83D\uDD55", title: "퇴근 정정", description: "퇴근 시간 정정 요청" },
  { id: "expense", icon: "\uD83D\uDCB3", title: "경비 청구", description: "업무 관련 경비 청구" },
  { id: "general", icon: "\uD83D\uDCDD", title: "일반 품의", description: "기타 결재 품의 신청" },
];

const LEAVE_TYPE_OPTIONS = [
  { value: "annual", label: "연차" },
  { value: "half_am", label: "반차 (오전)" },
  { value: "half_pm", label: "반차 (오후)" },
  { value: "sick", label: "병가" },
  { value: "family", label: "경조사" },
];

const STEPS: { step: FormStep; label: string }[] = [
  { step: 1, label: "유형 선택" },
  { step: 2, label: "상세 정보" },
  { step: 3, label: "검토 · 제출" },
];

/* ────────────────────────────────────────────
   Helpers
   ──────────────────────────────────────────── */

function leaveTypeLabel(type: LeaveType): string {
  const found = LEAVE_TYPE_OPTIONS.find((o) => o.value === type);
  return found?.label ?? type;
}

function calcDays(start: string, end: string, leaveType: LeaveType): string {
  if (!start || !end) return "0일";
  if (leaveType === "half_am" || leaveType === "half_pm") return "0.5일";
  const s = new Date(start);
  const e = new Date(end);
  const diff = Math.max(1, Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1);
  return `${diff}일`;
}

/* ────────────────────────────────────────────
   Page Component
   ──────────────────────────────────────────── */

export default function RequestsPage() {
  const [selectedType, setSelectedType] = useState<RequestTypeId | null>(null);
  const [formStep, setFormStep] = useState<FormStep>(1);
  const [showForm, setShowForm] = useState(false);

  /* Leave form state */
  const [leaveType, setLeaveType] = useState<LeaveType>("annual");
  const [startDate, setStartDate] = useState("2026-04-07");
  const [endDate, setEndDate] = useState("2026-04-08");
  const [reason, setReason] = useState("개인 사유 (가족 행사)");
  const [emergencyContact, setEmergencyContact] = useState("");

  const usedDays = calcDays(startDate, endDate, leaveType);

  function handleSelectRequestType(id: RequestTypeId) {
    setSelectedType(id);
    if (id === "annual" || id === "half_day" || id === "sick") {
      setShowForm(true);
      setFormStep(1);
      if (id === "half_day") setLeaveType("half_am");
      else if (id === "sick") setLeaveType("sick");
      else setLeaveType("annual");
    }
  }

  function handleNextStep() {
    if (formStep < 3) setFormStep((s) => (s + 1) as FormStep);
  }

  function handlePrevStep() {
    if (formStep > 1) setFormStep((s) => (s - 1) as FormStep);
  }

  function handleCancel() {
    setShowForm(false);
    setSelectedType(null);
    setFormStep(1);
  }

  function handleSubmit() {
    setShowForm(false);
    setSelectedType(null);
    setFormStep(1);
    setReason("");
    setEmergencyContact("");
  }

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
        <p className="text-sm text-text-tertiary mt-sp-1">
          신청할 요청 유형을 선택하세요
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-sp-4 mb-sp-8">
        {REQUEST_TYPES.map((rt) => (
          <button
            key={rt.id}
            onClick={() => handleSelectRequestType(rt.id)}
            className={[
              "rounded-lg border text-center p-sp-6 transition-colors cursor-pointer",
              "hover:border-brand hover:shadow-sm",
              selectedType === rt.id
                ? "border-brand bg-brand-soft/20 shadow-sm"
                : "border-border bg-surface-primary",
            ].join(" ")}
          >
            <div className="text-[32px] mb-sp-3">{rt.icon}</div>
            <div className="font-semibold text-sm text-text-primary mb-sp-1">
              {rt.title}
            </div>
            <div className="text-xs text-text-tertiary">{rt.description}</div>
          </button>
        ))}
      </div>

      {/* TE-202: Leave Request Form (3-step) */}
      {showForm && (
        <>
          <div className="mb-sp-4">
            <h2 className="text-lg font-semibold text-text-primary">
              휴가 신청서
            </h2>
            <p className="text-sm text-text-tertiary mt-sp-1">
              연차 / 반차 / 병가 신청 양식
            </p>
          </div>

          <Card className="mb-sp-8">
            <CardHeader>
              <CardTitle>{leaveTypeLabel(leaveType)} 신청</CardTitle>
              <Badge variant="info">작성 중</Badge>
            </CardHeader>
            <CardBody>
              {/* Steps Indicator */}
              <div className="flex items-center gap-sp-3 mb-sp-8">
                {STEPS.map((s, idx) => {
                  const isDone = s.step < formStep;
                  const isActive = s.step === formStep;
                  return (
                    <div key={s.step} className="flex items-center gap-sp-2">
                      {idx > 0 && (
                        <div
                          className={[
                            "w-8 h-[2px]",
                            isDone ? "bg-brand" : "bg-border",
                          ].join(" ")}
                        />
                      )}
                      <div className="flex items-center gap-sp-2">
                        <span
                          className={[
                            "w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold",
                            isDone
                              ? "bg-brand text-white"
                              : isActive
                                ? "bg-brand text-white"
                                : "bg-surface-secondary text-text-tertiary",
                          ].join(" ")}
                        >
                          {isDone ? "\u2713" : s.step}
                        </span>
                        <span
                          className={[
                            "text-sm font-medium",
                            isActive
                              ? "text-text-primary"
                              : isDone
                                ? "text-brand-text"
                                : "text-text-tertiary",
                          ].join(" ")}
                        >
                          {s.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Step 1: Type Selection */}
              {formStep === 1 && (
                <div className="max-w-md">
                  <Select
                    label="휴가 유형"
                    options={LEAVE_TYPE_OPTIONS}
                    value={leaveType}
                    onChange={(e) =>
                      setLeaveType(e.target.value as LeaveType)
                    }
                  />
                  <div className="mt-sp-4 p-sp-4 bg-surface-secondary rounded-md text-sm text-text-secondary">
                    <strong>
                      {leaveTypeLabel(leaveType)}
                    </strong>
                    {" "}유형이 선택되었습니다. 다음 단계에서 상세 정보를 입력하세요.
                  </div>
                </div>
              )}

              {/* Step 2: Detail Information */}
              {formStep === 2 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-sp-6">
                  <div>
                    <Select
                      label="휴가 유형"
                      options={LEAVE_TYPE_OPTIONS}
                      value={leaveType}
                      onChange={(e) =>
                        setLeaveType(e.target.value as LeaveType)
                      }
                    />
                    <Input
                      label="시작일"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                    <Input
                      label="종료일"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                    <div className="mb-sp-4">
                      <label className="block text-sm font-medium text-text-secondary mb-sp-1">
                        사용 일수
                      </label>
                      <div className="w-full px-sp-3 py-sp-2 border rounded-sm text-md bg-surface-secondary text-text-primary border-border">
                        {usedDays}
                      </div>
                      <p className="text-xs text-text-tertiary mt-sp-1">
                        잔여 연차: 8.5일
                      </p>
                    </div>
                  </div>
                  <div>
                    <Textarea
                      label="사유"
                      rows={4}
                      placeholder="휴가 사유를 입력해 주세요"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                    />
                    <div className="mb-sp-4">
                      <label className="block text-sm font-medium text-text-secondary mb-sp-1">
                        결재자
                      </label>
                      <div className="flex items-center gap-sp-3 p-sp-3 bg-surface-secondary rounded-sm">
                        <div className="w-8 h-8 rounded-full bg-brand-soft flex items-center justify-center text-sm font-semibold text-brand-text">
                          박
                        </div>
                        <div>
                          <div className="font-semibold text-sm text-text-primary">
                            박서준
                          </div>
                          <div className="text-xs text-text-tertiary">
                            Product 팀 리더
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
                      value={emergencyContact}
                      onChange={(e) =>
                        setEmergencyContact(e.target.value)
                      }
                    />
                  </div>
                </div>
              )}

              {/* Step 3: Review & Submit */}
              {formStep === 3 && (
                <div className="max-w-lg space-y-sp-4">
                  <h3 className="text-md font-semibold text-text-primary mb-sp-2">
                    신청 내용 확인
                  </h3>
                  <div className="border border-border rounded-md divide-y divide-border-subtle">
                    <ReviewRow label="휴가 유형" value={leaveTypeLabel(leaveType)} />
                    <ReviewRow label="시작일" value={startDate} />
                    <ReviewRow label="종료일" value={endDate} />
                    <ReviewRow label="사용 일수" value={usedDays} />
                    <ReviewRow label="사유" value={reason || "—"} />
                    <ReviewRow label="결재자" value="박서준 (Product 팀 리더)" />
                    <ReviewRow
                      label="비상 연락"
                      value={emergencyContact || "—"}
                    />
                  </div>
                  <p className="text-xs text-text-tertiary">
                    위 내용을 확인 후 &quot;신청하기&quot;를 누르면 결재자에게 요청이
                    전달됩니다.
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-sp-3 mt-sp-6 pt-sp-4 border-t border-border-subtle">
                {formStep === 3 ? (
                  <Button variant="primary" onClick={handleSubmit}>
                    신청하기
                  </Button>
                ) : (
                  <Button variant="primary" onClick={handleNextStep}>
                    다음
                  </Button>
                )}
                {formStep > 1 && (
                  <Button variant="secondary" onClick={handlePrevStep}>
                    이전
                  </Button>
                )}
                {formStep === 2 && (
                  <Button variant="secondary" onClick={() => {}}>
                    임시 저장
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

/* ────────────────────────────────────────────
   Sub-components
   ──────────────────────────────────────────── */

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-sp-4 py-sp-3">
      <span className="text-sm text-text-tertiary">{label}</span>
      <span className="text-sm font-medium text-text-primary">{value}</span>
    </div>
  );
}
