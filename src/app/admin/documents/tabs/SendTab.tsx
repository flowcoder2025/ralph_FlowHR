"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardHeader,
  CardBody,
  Badge,
  Button,
  Input,
  Select,
  Textarea,
} from "@/components/ui";

// ─── Types ──────────────────────────────────────────────────

interface DocumentTemplate {
  id: string;
  name: string;
  description: string | null;
  category: string;
  version: string;
  usageCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface RecipientEmployee {
  id: string;
  name: string;
  email: string;
  department: { id: string; name: string } | null;
  position: { id: string; name: string; level: number } | null;
}

interface SendFormData {
  templateId: string;
  recipientIds: string[];
  deadline: string;
  memo: string;
  notifyEmail: boolean;
  notifyReminder: boolean;
}

// ─── Constants ──────────────────────────────────────────────

const EMPTY_SEND_FORM: SendFormData = {
  templateId: "",
  recipientIds: [],
  deadline: "",
  memo: "",
  notifyEmail: true,
  notifyReminder: false,
};

const CATEGORY_LABELS: Record<string, string> = {
  CONTRACT: "계약서",
  NOTICE: "통지서",
  NDA: "비밀유지계약",
  CERTIFICATE: "증명서",
};

const CATEGORY_BADGE_VARIANT: Record<string, "info" | "success" | "warning" | "neutral"> = {
  CONTRACT: "info",
  NOTICE: "success",
  NDA: "warning",
  CERTIFICATE: "neutral",
};

// ─── Component ──────────────────────────────────────────────

export default function SendTab() {
  const [form, setForm] = useState<SendFormData>(EMPTY_SEND_FORM);
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [selectedRecipients, setSelectedRecipients] = useState<RecipientEmployee[]>([]);
  const [recipientSearch, setRecipientSearch] = useState("");
  const [searchResults, setSearchResults] = useState<RecipientEmployee[]>([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [searching, setSearching] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const searchTimeoutRef = useCallback(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    return {
      set: (fn: () => void, ms: number) => {
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(fn, ms);
      },
      clear: () => {
        if (timeoutId) clearTimeout(timeoutId);
      },
    };
  }, [])();

  // 템플릿 로드
  useEffect(() => {
    async function loadTemplates() {
      setLoadingTemplates(true);
      try {
        const res = await fetch("/api/documents/templates");
        if (res.ok) {
          const json = await res.json();
          setTemplates(json.data.filter((t: DocumentTemplate) => t.isActive));
        }
      } finally {
        setLoadingTemplates(false);
      }
    }
    loadTemplates();
  }, []);

  // 기본 마감일: 오늘 + 7일
  useEffect(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    setForm((prev) => ({ ...prev, deadline: `${yyyy}-${mm}-${dd}` }));
  }, []);

  // 수신자 검색
  useEffect(() => {
    if (!recipientSearch.trim()) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }

    searchTimeoutRef.set(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `/api/employees?search=${encodeURIComponent(recipientSearch)}&status=ACTIVE&pageSize=10`,
        );
        if (res.ok) {
          const json = await res.json();
          const filtered = (json.data as RecipientEmployee[]).filter(
            (emp) => !form.recipientIds.includes(emp.id),
          );
          setSearchResults(filtered);
          setShowSearchDropdown(true);
        }
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => searchTimeoutRef.clear();
  }, [recipientSearch, form.recipientIds, searchTimeoutRef]);

  function addRecipient(emp: RecipientEmployee) {
    setSelectedRecipients((prev) => [...prev, emp]);
    setForm((prev) => ({
      ...prev,
      recipientIds: [...prev.recipientIds, emp.id],
    }));
    setRecipientSearch("");
    setShowSearchDropdown(false);
  }

  function removeRecipient(empId: string) {
    setSelectedRecipients((prev) => prev.filter((r) => r.id !== empId));
    setForm((prev) => ({
      ...prev,
      recipientIds: prev.recipientIds.filter((id) => id !== empId),
    }));
  }

  async function handleSubmit(isDraft: boolean) {
    setError(null);
    setSuccess(null);

    if (!form.templateId) {
      setError("문서 템플릿을 선택해주세요");
      return;
    }
    if (form.recipientIds.length === 0) {
      setError("수신자를 1명 이상 선택해주세요");
      return;
    }

    setSending(true);
    try {
      const res = await fetch("/api/documents/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, isDraft }),
      });

      if (!res.ok) {
        const errJson = await res.json();
        setError(errJson.error || "발송에 실패했습니다");
        return;
      }

      const result = await res.json();
      setSuccess(result.message);

      // 발송 후 폼 초기화
      if (!isDraft) {
        setForm((prev) => ({
          ...EMPTY_SEND_FORM,
          deadline: prev.deadline,
        }));
        setSelectedRecipients([]);
      }
    } finally {
      setSending(false);
    }
  }

  const selectedTemplate = templates.find((t) => t.id === form.templateId) ?? null;

  return (
    <Card>
      <CardHeader>
        <span className="text-lg font-semibold text-text-primary">새 문서 발송</span>
      </CardHeader>
      <CardBody>
        {error && (
          <div className="mb-sp-4 rounded-sm bg-status-danger-bg px-sp-3 py-sp-2 text-sm text-status-danger-text">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-sp-4 rounded-sm bg-status-success-bg px-sp-3 py-sp-2 text-sm text-status-success-text">
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 gap-sp-6 lg:grid-cols-2">
          {/* 좌측: 폼 입력 */}
          <div>
            {/* 수신자 선택 */}
            <div className="mb-sp-4">
              <label className="block text-sm font-medium text-text-secondary mb-sp-1">
                수신자
              </label>
              {/* 선택된 수신자 뱃지 */}
              {selectedRecipients.length > 0 && (
                <div className="mb-sp-2 flex flex-wrap gap-sp-1">
                  {selectedRecipients.map((r) => (
                    <span
                      key={r.id}
                      className="inline-flex items-center gap-sp-1 rounded-sm bg-brand/10 px-sp-2 py-sp-1 text-xs text-brand-text"
                    >
                      {r.name}
                      {r.department && (
                        <span className="text-text-tertiary">({r.department.name})</span>
                      )}
                      <button
                        type="button"
                        onClick={() => removeRecipient(r.id)}
                        className="ml-sp-1 text-text-tertiary hover:text-status-danger-text"
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
              )}
              {/* 검색 입력 */}
              <div className="relative">
                <input
                  type="text"
                  value={recipientSearch}
                  onChange={(e) => setRecipientSearch(e.target.value)}
                  onFocus={() => {
                    if (searchResults.length > 0) setShowSearchDropdown(true);
                  }}
                  onBlur={() => {
                    setTimeout(() => setShowSearchDropdown(false), 200);
                  }}
                  placeholder="이름 또는 부서 검색..."
                  className="w-full px-sp-3 py-sp-2 border rounded-sm text-md font-sans bg-surface-primary text-text-primary transition-colors duration-fast focus:outline-none focus:border-border-focus focus:ring-2 focus:ring-brand/10 border-border"
                />
                {searching && (
                  <span className="absolute right-sp-3 top-1/2 -translate-y-1/2 text-xs text-text-tertiary">
                    검색 중...
                  </span>
                )}
                {/* 검색 드롭다운 */}
                {showSearchDropdown && searchResults.length > 0 && (
                  <div className="absolute z-10 mt-sp-1 w-full rounded-sm border border-border bg-surface-primary shadow-md">
                    {searchResults.map((emp) => (
                      <button
                        key={emp.id}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => addRecipient(emp)}
                        className="flex w-full items-center gap-sp-2 px-sp-3 py-sp-2 text-left text-sm hover:bg-surface-secondary"
                      >
                        <span className="font-medium text-text-primary">{emp.name}</span>
                        {emp.department && (
                          <span className="text-xs text-text-tertiary">
                            {emp.department.name}
                          </span>
                        )}
                        {emp.position && (
                          <span className="text-xs text-text-tertiary">
                            {emp.position.name}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 문서 템플릿 */}
            <Select
              label="문서 템플릿"
              options={
                loadingTemplates
                  ? [{ value: "", label: "불러오는 중..." }]
                  : templates.map((t) => ({
                      value: t.id,
                      label: `${t.name} (v${t.version})`,
                    }))
              }
              value={form.templateId}
              onChange={(e) => setForm({ ...form, templateId: e.target.value })}
              placeholder="템플릿 선택"
            />

            {/* 서명 마감일 */}
            <Input
              label="서명 마감일"
              type="date"
              value={form.deadline}
              onChange={(e) => setForm({ ...form, deadline: e.target.value })}
            />

            {/* 메모 */}
            <Textarea
              label="메모 (선택)"
              value={form.memo}
              onChange={(e) => setForm({ ...form, memo: e.target.value })}
              placeholder="수신자에게 전달할 메모를 입력하세요..."
              rows={4}
            />
          </div>

          {/* 우측: 미리보기 + 알림 토글 */}
          <div>
            {/* 발송 미리보기 */}
            <div className="mb-sp-4">
              <span className="block text-sm font-semibold text-text-primary mb-sp-2">
                발송 미리보기
              </span>
              <div className="rounded-md bg-surface-secondary p-sp-4" style={{ minHeight: 200 }}>
                {selectedTemplate ? (
                  <>
                    <p className="mb-sp-2 text-sm text-text-secondary">
                      {selectedTemplate.name} (v{selectedTemplate.version})
                    </p>
                    <div className="rounded-sm border border-dashed border-border p-sp-8 text-center">
                      <Badge variant={CATEGORY_BADGE_VARIANT[selectedTemplate.category] ?? "neutral"}>
                        {CATEGORY_LABELS[selectedTemplate.category] ?? selectedTemplate.category}
                      </Badge>
                      <p className="mt-sp-2 text-sm text-text-tertiary">
                        {selectedTemplate.description || "문서 미리보기 영역"}
                      </p>
                      {selectedRecipients.length > 0 && (
                        <p className="mt-sp-3 text-xs text-text-tertiary">
                          수신자: {selectedRecipients.map((r) => r.name).join(", ")}
                        </p>
                      )}
                      {form.deadline && (
                        <p className="mt-sp-1 text-xs text-text-tertiary">
                          마감일: {form.deadline}
                        </p>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="rounded-sm border border-dashed border-border p-sp-8 text-center">
                    <span className="text-sm text-text-tertiary">
                      템플릿을 선택하면 미리보기가 표시됩니다
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* 알림 토글: 서명 알림 이메일 */}
            <div className="mb-sp-4 flex items-center gap-sp-3">
              <button
                type="button"
                role="switch"
                aria-checked={form.notifyEmail}
                onClick={() => setForm({ ...form, notifyEmail: !form.notifyEmail })}
                className={[
                  "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-fast",
                  form.notifyEmail ? "bg-brand" : "bg-border",
                ].join(" ")}
              >
                <span
                  className={[
                    "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform duration-fast",
                    form.notifyEmail ? "translate-x-5" : "translate-x-0.5",
                  ].join(" ")}
                  style={{ marginTop: 2 }}
                />
              </button>
              <span className="text-sm text-text-primary">서명 알림 이메일 발송</span>
            </div>

            {/* 알림 토글: 마감일 자동 리마인더 */}
            <div className="mb-sp-4 flex items-center gap-sp-3">
              <button
                type="button"
                role="switch"
                aria-checked={form.notifyReminder}
                onClick={() => setForm({ ...form, notifyReminder: !form.notifyReminder })}
                className={[
                  "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-fast",
                  form.notifyReminder ? "bg-brand" : "bg-border",
                ].join(" ")}
              >
                <span
                  className={[
                    "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform duration-fast",
                    form.notifyReminder ? "translate-x-5" : "translate-x-0.5",
                  ].join(" ")}
                  style={{ marginTop: 2 }}
                />
              </button>
              <span className="text-sm text-text-primary">마감일 자동 리마인더</span>
            </div>
          </div>
        </div>

        {/* 하단 버튼 */}
        <div className="mt-sp-6 flex justify-end gap-sp-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleSubmit(true)}
            disabled={sending}
          >
            임시 저장
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => handleSubmit(false)}
            disabled={sending}
          >
            {sending ? "발송 중..." : "발송하기"}
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
