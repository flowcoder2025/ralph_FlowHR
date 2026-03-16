"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardBody,
  Badge,
  Button,
  QueueList,
  QueueItem,
} from "@/components/ui";

// ─── Types ──────────────────────────────────────────────────

interface CalendarData {
  year: number;
  month: number;
  eventDays: number[];
  todayAbsences: {
    count: number;
    items: { employeeName: string; department: string; leaveType: string }[];
    remainingCount: number;
  };
}

// ─── Constants ──────────────────────────────────────────────

const DAY_HEADERS = ["일", "월", "화", "수", "목", "금", "토"];
const MONTH_NAMES = [
  "1월", "2월", "3월", "4월", "5월", "6월",
  "7월", "8월", "9월", "10월", "11월", "12월",
];

// ─── Component ──────────────────────────────────────────────

export default function CalendarTab() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [data, setData] = useState<CalendarData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCalendar = useCallback(async (y: number, m: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/leave/calendar?year=${y}&month=${m}`);
      if (res.ok) {
        const json: CalendarData = await res.json();
        setData(json);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCalendar(year, month);
  }, [year, month, fetchCalendar]);

  function handlePrevMonth() {
    if (month === 1) {
      setYear((y) => y - 1);
      setMonth(12);
    } else {
      setMonth((m) => m - 1);
    }
  }

  function handleNextMonth() {
    if (month === 12) {
      setYear((y) => y + 1);
      setMonth(1);
    } else {
      setMonth((m) => m + 1);
    }
  }

  // Build calendar grid cells
  const firstDayOfMonth = new Date(year, month - 1, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month, 0).getDate();
  const todayDate = now.getFullYear() === year && now.getMonth() + 1 === month ? now.getDate() : -1;
  const eventSet = new Set(data?.eventDays ?? []);

  const cells: { day: number; type: "normal" | "today" | "event" | "off" | "empty" }[] = [];

  // Leading empty cells
  for (let i = 0; i < firstDayOfMonth; i++) {
    cells.push({ day: 0, type: "empty" });
  }

  // Day cells
  for (let d = 1; d <= daysInMonth; d++) {
    const dayOfWeek = (firstDayOfMonth + d - 1) % 7;
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    if (d === todayDate) {
      cells.push({ day: d, type: "today" });
    } else if (eventSet.has(d)) {
      cells.push({ day: d, type: "event" });
    } else if (isWeekend) {
      cells.push({ day: d, type: "off" });
    } else {
      cells.push({ day: d, type: "normal" });
    }
  }

  const cellStyles: Record<string, string> = {
    normal: "bg-surface-primary text-text-primary",
    today: "bg-brand text-text-inverse font-bold",
    event: "bg-brand-soft text-brand-text",
    off: "bg-status-neutral-bg text-text-tertiary",
    empty: "",
  };

  return (
    <div className="grid grid-cols-1 gap-sp-6 lg:grid-cols-3">
      {/* Calendar Card (2/3 width) */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>휴가 캘린더</CardTitle>
          <div className="flex items-center gap-sp-2">
            <Button variant="ghost" size="sm" onClick={handlePrevMonth}>
              &larr;
            </Button>
            <span className="min-w-[100px] text-center text-sm font-semibold text-text-primary">
              {year}년 {MONTH_NAMES[month - 1]}
            </span>
            <Button variant="ghost" size="sm" onClick={handleNextMonth}>
              &rarr;
            </Button>
          </div>
        </CardHeader>
        <CardBody>
          {loading ? (
            <div className="flex items-center justify-center py-sp-12">
              <span className="text-sm text-text-tertiary">불러오는 중...</span>
            </div>
          ) : (
            <>
              {/* Day headers */}
              <div className="grid grid-cols-7 gap-px mb-px">
                {DAY_HEADERS.map((h) => (
                  <div
                    key={h}
                    className="py-sp-2 text-center text-xs font-semibold text-text-tertiary"
                  >
                    {h}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-px">
                {cells.map((cell, idx) => (
                  <div
                    key={idx}
                    className={[
                      "flex items-center justify-center rounded-sm py-sp-3 text-sm transition-colors duration-fast",
                      cell.type !== "empty" ? cellStyles[cell.type] : "",
                    ].join(" ")}
                  >
                    {cell.day > 0 ? cell.day : ""}
                  </div>
                ))}
              </div>

              {/* Legend */}
              <div className="mt-sp-4 flex gap-sp-4 text-sm text-text-secondary">
                <span className="flex items-center gap-sp-1">
                  <span className="inline-block h-3 w-3 rounded-sm bg-brand-soft" />
                  휴가
                </span>
                <span className="flex items-center gap-sp-1">
                  <span className="inline-block h-3 w-3 rounded-sm bg-brand" />
                  오늘
                </span>
                <span className="flex items-center gap-sp-1">
                  <span className="inline-block h-3 w-3 rounded-sm bg-status-neutral-bg" />
                  주말/공휴일
                </span>
              </div>
            </>
          )}
        </CardBody>
      </Card>

      {/* Today Absences Card (1/3 width) */}
      <Card>
        <CardHeader>
          <CardTitle>오늘 부재자</CardTitle>
          <Badge variant="info">{data?.todayAbsences.count ?? 0}명</Badge>
        </CardHeader>
        <CardBody>
          {loading ? (
            <div className="flex items-center justify-center py-sp-8">
              <span className="text-sm text-text-tertiary">불러오는 중...</span>
            </div>
          ) : data && data.todayAbsences.count > 0 ? (
            <QueueList>
              {data.todayAbsences.items.map((item, idx) => (
                <QueueItem
                  key={idx}
                  priority="low"
                  title={item.employeeName}
                  meta={`${item.department} · ${item.leaveType}`}
                />
              ))}
              {data.todayAbsences.remainingCount > 0 && (
                <QueueItem
                  priority="low"
                  title={`기타 ${data.todayAbsences.remainingCount}명`}
                  meta="전사 부서별 분포"
                />
              )}
            </QueueList>
          ) : (
            <div className="flex items-center justify-center py-sp-8">
              <span className="text-sm text-text-tertiary">오늘 부재자가 없습니다</span>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
