"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Input,
  Select,
} from "@/components/ui";

// ─── Types ──────────────────────────────────────────────────

interface CompanyFormData {
  companyName: string;
  businessNumber: string;
  industry: string;
  representative: string;
  fiscalYearStart: string;
  timezone: string;
  workStartTime: string;
  workEndTime: string;
  logoUrl: string;
}

const EMPTY_FORM: CompanyFormData = {
  companyName: "",
  businessNumber: "",
  industry: "",
  representative: "",
  fiscalYearStart: "1",
  timezone: "Asia/Seoul",
  workStartTime: "09:00",
  workEndTime: "18:00",
  logoUrl: "",
};

// ─── Constants ──────────────────────────────────────────────

const INDUSTRY_OPTIONS = [
  { value: "", label: "선택하세요" },
  { value: "IT/소프트웨어", label: "IT/소프트웨어" },
  { value: "제조업", label: "제조업" },
  { value: "서비스업", label: "서비스업" },
  { value: "금융/보험업", label: "금융/보험업" },
  { value: "유통/물류", label: "유통/물류" },
  { value: "건설업", label: "건설업" },
  { value: "교육", label: "교육" },
  { value: "의료/제약", label: "의료/제약" },
];

const FISCAL_YEAR_OPTIONS = [
  { value: "1", label: "1월" },
  { value: "4", label: "4월" },
  { value: "7", label: "7월" },
];

const TIMEZONE_OPTIONS = [
  { value: "Asia/Seoul", label: "Asia/Seoul (KST, UTC+9)" },
  { value: "Asia/Tokyo", label: "Asia/Tokyo (JST, UTC+9)" },
  { value: "America/New_York", label: "America/New_York (EST, UTC-5)" },
  { value: "America/Los_Angeles", label: "America/Los_Angeles (PST, UTC-8)" },
  { value: "Europe/London", label: "Europe/London (GMT, UTC+0)" },
];

// ─── Component ──────────────────────────────────────────────

export default function CompanyTab() {
  const [form, setForm] = useState<CompanyFormData>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/settings/company");
      if (res.ok) {
        const json = await res.json();
        setForm({
          companyName: json.data.companyName || "",
          businessNumber: json.data.businessNumber || "",
          industry: json.data.industry || "",
          representative: json.data.representative || "",
          fiscalYearStart: json.data.fiscalYearStart || "1",
          timezone: json.data.timezone || "Asia/Seoul",
          workStartTime: json.data.workStartTime || "09:00",
          workEndTime: json.data.workEndTime || "18:00",
          logoUrl: json.data.logoUrl || "",
        });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  async function handleSave() {
    setError("");
    setSuccess("");

    if (!form.companyName.trim()) {
      setError("회사명은 필수 항목입니다");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/settings/company", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const errJson = await res.json();
        setError(errJson.error || "저장에 실패했습니다");
        return;
      }

      setSuccess("회사 정보가 저장되었습니다");
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
          회사 기본 정보
        </h2>
        <div className="flex items-center gap-sp-3">
          {error && (
            <span className="text-sm text-status-danger-text">{error}</span>
          )}
          {success && (
            <span className="text-sm text-status-success-text">{success}</span>
          )}
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "저장 중..." : "저장"}
          </Button>
        </div>
      </CardHeader>
      <CardBody>
        <div className="grid grid-cols-1 gap-sp-6 lg:grid-cols-2">
          {/* 좌측 컬럼 */}
          <div>
            <Input
              label="회사명"
              value={form.companyName}
              onChange={(e) =>
                setForm({ ...form, companyName: e.target.value })
              }
              placeholder="주식회사 FlowHR"
              error={
                error && !form.companyName.trim()
                  ? "회사명은 필수입니다"
                  : undefined
              }
            />
            <Input
              label="사업자 등록번호"
              value={form.businessNumber}
              onChange={(e) =>
                setForm({ ...form, businessNumber: e.target.value })
              }
              placeholder="000-00-00000"
            />
            <Select
              label="업종"
              options={INDUSTRY_OPTIONS}
              value={form.industry}
              onChange={(e) => setForm({ ...form, industry: e.target.value })}
            />
            <Input
              label="대표자"
              value={form.representative}
              onChange={(e) =>
                setForm({ ...form, representative: e.target.value })
              }
              placeholder="홍길동"
            />
          </div>

          {/* 우측 컬럼 */}
          <div>
            <Select
              label="회계연도 시작"
              options={FISCAL_YEAR_OPTIONS}
              value={form.fiscalYearStart}
              onChange={(e) =>
                setForm({ ...form, fiscalYearStart: e.target.value })
              }
            />
            <Select
              label="타임존"
              options={TIMEZONE_OPTIONS}
              value={form.timezone}
              onChange={(e) => setForm({ ...form, timezone: e.target.value })}
            />

            {/* 기본 근무 시간 */}
            <div className="mb-sp-4">
              <label className="block text-sm font-medium text-text-secondary mb-sp-1">
                기본 근무 시간
              </label>
              <div className="flex items-center gap-sp-2">
                <input
                  type="time"
                  value={form.workStartTime}
                  onChange={(e) =>
                    setForm({ ...form, workStartTime: e.target.value })
                  }
                  className="flex-1 px-sp-3 py-sp-2 border rounded-sm text-md font-sans bg-surface-primary text-text-primary transition-colors duration-fast focus:outline-none focus:border-border-focus focus:ring-2 focus:ring-brand/10 border-border"
                />
                <span className="text-sm text-text-tertiary">~</span>
                <input
                  type="time"
                  value={form.workEndTime}
                  onChange={(e) =>
                    setForm({ ...form, workEndTime: e.target.value })
                  }
                  className="flex-1 px-sp-3 py-sp-2 border rounded-sm text-md font-sans bg-surface-primary text-text-primary transition-colors duration-fast focus:outline-none focus:border-border-focus focus:ring-2 focus:ring-brand/10 border-border"
                />
              </div>
            </div>

            {/* 회사 로고 */}
            <div className="mb-sp-4">
              <label className="block text-sm font-medium text-text-secondary mb-sp-1">
                회사 로고
              </label>
              <div className="flex items-center gap-sp-4">
                <div
                  className="flex items-center justify-center rounded-md border-2 border-dashed border-border bg-surface-secondary"
                  style={{ width: 80, height: 80 }}
                >
                  {form.logoUrl ? (
                    <Image
                      src={form.logoUrl}
                      alt="회사 로고"
                      width={80}
                      height={80}
                      className="h-full w-full rounded-md object-contain"
                    />
                  ) : (
                    <span className="text-xs text-text-tertiary text-center px-sp-1">
                      로고 없음
                    </span>
                  )}
                </div>
                <div className="flex flex-col gap-sp-2">
                  <Input
                    label=""
                    value={form.logoUrl}
                    onChange={(e) =>
                      setForm({ ...form, logoUrl: e.target.value })
                    }
                    placeholder="로고 이미지 URL"
                  />
                  <p className="text-xs text-text-tertiary">
                    권장 크기: 200x200px, PNG 또는 SVG
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
