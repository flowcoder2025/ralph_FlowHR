"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardBody, Button, Select, Breadcrumb, SkeletonCard } from "@/components/ui";
import { useToast } from "@/components/layout/Toast";
import { exportToCSV } from "@/lib/export";

interface TableMeta {
  name: string;
  label: string;
  columns: { key: string; label: string }[];
}

interface ReportResult {
  data: Record<string, unknown>[];
  total: number;
  columns: { key: string; label: string }[];
}

export default function CustomReportPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [tables, setTables] = useState<TableMeta[]>([]);
  const [selectedTable, setSelectedTable] = useState("");
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [result, setResult] = useState<ReportResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [metaLoading, setMetaLoading] = useState(true);

  const fetchMeta = useCallback(async () => {
    setMetaLoading(true);
    try {
      const res = await fetch("/api/admin/reports/custom");
      if (res.ok) {
        const json = await res.json();
        setTables(json.data.tables);
      }
    } finally {
      setMetaLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMeta();
  }, [fetchMeta]);

  const currentTable = tables.find((t) => t.name === selectedTable);

  function handleTableChange(tableName: string) {
    setSelectedTable(tableName);
    const t = tables.find((tb) => tb.name === tableName);
    setSelectedColumns(t ? t.columns.map((c) => c.key) : []);
    setResult(null);
    setStatusFilter("");
  }

  function toggleColumn(key: string) {
    setSelectedColumns((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  }

  async function handleRun() {
    if (!selectedTable || selectedColumns.length === 0) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/reports/custom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          table: selectedTable,
          columns: selectedColumns,
          filters: {
            ...(dateFrom && { dateFrom }),
            ...(dateTo && { dateTo }),
            ...(statusFilter && { status: statusFilter }),
          },
        }),
      });
      if (res.ok) {
        const json: ReportResult = await res.json();
        setResult(json);
      } else {
        const err = await res.json().catch(() => ({}));
        addToast({ message: err.error || "리포트 생성에 실패했습니다.", variant: "danger" });
      }
    } finally {
      setLoading(false);
    }
  }

  function handleExportCSV() {
    if (!result) return;
    exportToCSV(
      result.columns,
      result.data.map((row) => {
        const mapped: Record<string, unknown> = {};
        for (const col of result.columns) {
          mapped[col.key] = row[col.key] ?? "";
        }
        return mapped;
      }),
      `custom-report-${selectedTable}`,
    );
  }

  if (metaLoading) {
    return (
      <div className="py-sp-12 space-y-sp-4">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-sp-6 flex items-center justify-between">
        <div>
          <Breadcrumb items={[{ label: "리포트 센터", href: "/admin/reports" }, { label: "커스텀 리포트" }]} />
          <h1 className="text-2xl font-bold text-text-primary md:text-3xl">커스텀 리포트</h1>
          <p className="mt-sp-1 text-md text-text-secondary">
            데이터 소스와 필터를 선택하여 맞춤 리포트를 생성합니다
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => router.push("/admin/reports")}>
          목록으로
        </Button>
      </div>

      {/* Builder */}
      <div className="grid grid-cols-1 gap-sp-4 lg:grid-cols-3">
        {/* 1. 테이블 선택 */}
        <Card>
          <CardHeader>
            <h2 className="text-md font-semibold">1. 데이터 소스</h2>
          </CardHeader>
          <CardBody>
            <Select
              label="테이블"
              options={[
                { value: "", label: "선택하세요" },
                ...tables.map((t) => ({ value: t.name, label: t.label })),
              ]}
              value={selectedTable}
              onChange={(e) => handleTableChange(e.target.value)}
            />
          </CardBody>
        </Card>

        {/* 2. 컬럼 선택 */}
        <Card>
          <CardHeader>
            <h2 className="text-md font-semibold">2. 컬럼 선택</h2>
          </CardHeader>
          <CardBody>
            {currentTable ? (
              <div className="space-y-sp-2">
                {currentTable.columns.map((col) => (
                  <label key={col.key} className="flex items-center gap-sp-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedColumns.includes(col.key)}
                      onChange={() => toggleColumn(col.key)}
                      className="rounded border-border"
                    />
                    {col.label}
                  </label>
                ))}
              </div>
            ) : (
              <p className="text-sm text-text-tertiary">데이터 소스를 먼저 선택하세요</p>
            )}
          </CardBody>
        </Card>

        {/* 3. 필터 */}
        <Card>
          <CardHeader>
            <h2 className="text-md font-semibold">3. 필터</h2>
          </CardHeader>
          <CardBody>
            <div className="space-y-sp-3">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-sp-1">
                  시작일
                </label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full px-sp-3 py-sp-2 border rounded-sm text-md bg-surface-primary text-text-primary border-border focus:outline-none focus:border-border-focus"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-sp-1">
                  종료일
                </label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full px-sp-3 py-sp-2 border rounded-sm text-md bg-surface-primary text-text-primary border-border focus:outline-none focus:border-border-focus"
                />
              </div>
              <Select
                label="상태 필터"
                options={[
                  { value: "", label: "전체" },
                  { value: "ACTIVE", label: "활성" },
                  { value: "PRESENT", label: "출근" },
                  { value: "ABSENT", label: "결근" },
                  { value: "LATE", label: "지각" },
                  { value: "PENDING", label: "대기" },
                  { value: "APPROVED", label: "승인" },
                  { value: "REJECTED", label: "반려" },
                ]}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              />
            </div>
          </CardBody>
        </Card>
      </div>

      {/* 실행 버튼 */}
      <div className="mt-sp-4 flex gap-sp-2">
        <Button
          variant="primary"
          onClick={handleRun}
          disabled={!selectedTable || selectedColumns.length === 0 || loading}
        >
          {loading ? "조회 중..." : "리포트 생성"}
        </Button>
        {result && (
          <Button variant="secondary" onClick={handleExportCSV}>
            CSV 내보내기
          </Button>
        )}
      </div>

      {/* 결과 테이블 */}
      {result && (
        <Card className="mt-sp-4">
          <CardHeader>
            <h2 className="text-md font-semibold">
              결과 ({result.total}건)
            </h2>
          </CardHeader>
          <CardBody className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {result.columns.map((col) => (
                    <th key={col.key} className="px-sp-3 py-sp-2 text-left font-medium text-text-secondary">
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.data.slice(0, 100).map((row, i) => (
                  <tr key={i} className="border-b border-border/50">
                    {result.columns.map((col) => (
                      <td key={col.key} className="px-sp-3 py-sp-2 text-text-primary">
                        {String(row[col.key] ?? "")}
                      </td>
                    ))}
                  </tr>
                ))}
                {result.total > 100 && (
                  <tr>
                    <td colSpan={result.columns.length} className="px-sp-3 py-sp-2 text-center text-text-tertiary">
                      ... 외 {result.total - 100}건 (CSV로 전체 내보내기 가능)
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
