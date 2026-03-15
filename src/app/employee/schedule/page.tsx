"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardBody,
  Badge,
  Button,
} from "@/components/ui";

/* ────────────────────────────────────────────
   Types
   ──────────────────────────────────────────── */

type AttendanceStatus = "working" | "not_started" | "done";

interface TodayStatus {
  checkIn: string | null;
  checkOut: string | null;
  totalHours: string | null;
  shiftType: string;
  expectedEnd: string;
  status: AttendanceStatus;
}

interface WeeklyScheduleRow {
  dayLabel: string;
  date: string;
  shiftType: string;
  startTime: string;
  endTime: string;
  status: "normal" | "working" | "scheduled";
  isToday: boolean;
}

type HistoryStatus = "normal" | "late" | "half_day" | "annual" | "working";
type HistoryFilter = "recent2w" | "thisMonth" | "lastMonth";

interface AttendanceHistoryRow {
  id: string;
  date: string;
  dayLabel: string;
  checkIn: string | null;
  checkOut: string | null;
  totalWork: string | null;
  status: HistoryStatus;
  isToday: boolean;
}

interface ScheduleResponse {
  data: {
    today: TodayStatus;
    weekLabel: string;
    weeklySchedule: WeeklyScheduleRow[];
    history: {
      items: AttendanceHistoryRow[];
      total: number;
      totalPages: number;
      page: number;
      pageSize: number;
    };
  };
}

/* ────────────────────────────────────────────
   Helpers
   ──────────────────────────────────────────── */

function statusBadge(status: AttendanceStatus) {
  switch (status) {
    case "working":
      return <Badge variant="success">근무 중</Badge>;
    case "not_started":
      return <Badge variant="neutral">미출근</Badge>;
    case "done":
      return <Badge variant="info">퇴근</Badge>;
  }
}

function scheduleStatusBadge(status: WeeklyScheduleRow["status"]) {
  switch (status) {
    case "normal":
      return <Badge variant="success">정상</Badge>;
    case "working":
      return <Badge variant="info">근무 중</Badge>;
    case "scheduled":
      return <Badge variant="neutral">예정</Badge>;
  }
}

function historyStatusBadge(status: HistoryStatus) {
  switch (status) {
    case "normal":
      return <Badge variant="success">정상</Badge>;
    case "late":
      return <Badge variant="warning">지각</Badge>;
    case "half_day":
      return <Badge variant="info">반차</Badge>;
    case "annual":
      return <Badge variant="neutral">연차</Badge>;
    case "working":
      return <Badge variant="info">근무 중</Badge>;
  }
}

const FILTER_LABELS: { key: HistoryFilter; label: string }[] = [
  { key: "recent2w", label: "최근 2주" },
  { key: "thisMonth", label: "이번 달" },
  { key: "lastMonth", label: "지난달" },
];

function StatRow({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between py-sp-2 border-b border-border-subtle last:border-b-0">
      <span className="text-sm text-text-tertiary">{label}</span>
      <span className={`text-sm font-medium ${muted ? "text-text-tertiary" : "text-text-primary"}`}>
        {value}
      </span>
    </div>
  );
}

/* ────────────────────────────────────────────
   Page Component
   ──────────────────────────────────────────── */

export default function SchedulePage() {
  const [currentTime, setCurrentTime] = useState<string>("");
  const [currentDate, setCurrentDate] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [todayStatus, setTodayStatus] = useState<TodayStatus>({
    checkIn: null, checkOut: null, totalHours: null, shiftType: "일반 근무", expectedEnd: "18:00", status: "not_started",
  });
  const [attendanceStatus, setAttendanceStatus] = useState<AttendanceStatus>("not_started");
  const [weeklySchedule, setWeeklySchedule] = useState<WeeklyScheduleRow[]>([]);
  const [weekLabel, setWeekLabel] = useState<string>("");
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>("recent2w");
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPageData, setHistoryPageData] = useState<AttendanceHistoryRow[]>([]);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);

  const fetchSchedule = useCallback(async (filter: HistoryFilter, page: number) => {
    try {
      const res = await fetch(`/api/employee/schedule?filter=${filter}&page=${page}`);
      if (!res.ok) {
        throw new Error(res.status === 401 ? "인증이 필요합니다" : "데이터를 불러올 수 없습니다");
      }
      const json: ScheduleResponse = await res.json();
      setTodayStatus(json.data.today);
      setAttendanceStatus(json.data.today.status);
      setWeekLabel(json.data.weekLabel);
      setWeeklySchedule(json.data.weeklySchedule);
      setHistoryPageData(json.data.history.items);
      setHistoryTotal(json.data.history.total);
      setHistoryTotalPages(json.data.history.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSchedule(historyFilter, historyPage);
  }, [fetchSchedule, historyFilter, historyPage]);

  useEffect(() => {
    function updateTime() {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false })
      );
      setCurrentDate(
        now.toLocaleDateString("ko-KR", {
          year: "numeric",
          month: "long",
          day: "numeric",
          weekday: "long",
        })
      );
    }
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-sm text-text-tertiary">일정 정보를 불러오는 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-sm text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="mb-sp-6">
        <div className="text-sm text-text-tertiary mb-sp-1">홈 &gt; 일정 · 근태</div>
        <h1 className="text-xl font-bold text-text-primary">일정 · 근태</h1>
        <p className="text-sm text-text-tertiary mt-sp-1">나의 근무 일정과 출퇴근 기록을 확인하세요</p>
      </div>

      {/* TE-101: Attendance Check Panel + Current Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-sp-6 mb-sp-6">
        {/* Check-in/out Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>출퇴근 체크</CardTitle>
            {statusBadge(attendanceStatus)}
          </CardHeader>
          <CardBody className="text-center">
            <div className="text-5xl font-bold text-text-primary mb-sp-2 tabular-nums">
              {currentTime}
            </div>
            <div className="text-sm text-text-tertiary mb-sp-6">{currentDate}</div>

            <div className="flex gap-sp-4 justify-center">
              <Button
                variant="secondary"
                size="lg"
                disabled={attendanceStatus === "working" || attendanceStatus === "done"}
                className="min-w-[140px]"
              >
                <div>
                  <div>출근</div>
                  {todayStatus.checkIn && (
                    <div className="text-xs text-text-tertiary">{todayStatus.checkIn} 완료</div>
                  )}
                </div>
              </Button>
              <Button
                variant="primary"
                size="lg"
                disabled={attendanceStatus !== "working"}
                className="min-w-[140px]"
              >
                퇴근
              </Button>
            </div>
          </CardBody>
        </Card>

        {/* Today Status Card */}
        <Card>
          <CardHeader>
            <CardTitle>오늘 현황</CardTitle>
          </CardHeader>
          <CardBody>
            <StatRow label="출근" value={todayStatus.checkIn ?? "—"} muted={!todayStatus.checkIn} />
            <StatRow label="퇴근" value={todayStatus.checkOut ?? "—"} muted={!todayStatus.checkOut} />
            <StatRow label="총 근무시간" value={todayStatus.totalHours ?? "—"} muted={!todayStatus.totalHours} />
            <StatRow label="근무 유형" value={todayStatus.shiftType} />
            <StatRow label="예정 퇴근" value={todayStatus.expectedEnd} />
          </CardBody>
        </Card>
      </div>

      {/* TE-102: Weekly Schedule Table */}
      <div className="mb-sp-4">
        <h2 className="text-lg font-semibold text-text-primary">이번 주 근무 일정</h2>
        <p className="text-sm text-text-tertiary mt-sp-1">
          {weekLabel}
        </p>
      </div>

      <Card>
        <CardBody className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-sp-5 py-sp-3 font-medium text-text-tertiary w-[100px]">요일</th>
                <th className="text-left px-sp-5 py-sp-3 font-medium text-text-tertiary">날짜</th>
                <th className="text-left px-sp-5 py-sp-3 font-medium text-text-tertiary">근무 유형</th>
                <th className="text-left px-sp-5 py-sp-3 font-medium text-text-tertiary">시작</th>
                <th className="text-left px-sp-5 py-sp-3 font-medium text-text-tertiary">종료</th>
                <th className="text-left px-sp-5 py-sp-3 font-medium text-text-tertiary">상태</th>
              </tr>
            </thead>
            <tbody>
              {weeklySchedule.map((row) => (
                <tr
                  key={row.dayLabel}
                  className={[
                    "border-b border-border-subtle last:border-b-0 transition-colors",
                    row.isToday
                      ? "bg-brand-soft/30"
                      : "hover:bg-surface-secondary",
                  ].join(" ")}
                >
                  <td className="px-sp-5 py-sp-3 font-semibold text-text-primary">
                    {row.isToday ? `${row.dayLabel} (오늘)` : row.dayLabel}
                  </td>
                  <td className="px-sp-5 py-sp-3 text-text-secondary">{row.date}</td>
                  <td className="px-sp-5 py-sp-3 text-text-secondary">{row.shiftType}</td>
                  <td className="px-sp-5 py-sp-3 text-text-secondary tabular-nums">{row.startTime}</td>
                  <td className="px-sp-5 py-sp-3 text-text-secondary tabular-nums">{row.endTime}</td>
                  <td className="px-sp-5 py-sp-3">{scheduleStatusBadge(row.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>

      {/* TE-103: Attendance History */}
      <div className="mt-sp-8 mb-sp-4">
        <h2 className="text-lg font-semibold text-text-primary">출퇴근 기록</h2>
        <p className="text-sm text-text-tertiary mt-sp-1">최근 2주간 근태 기록</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>근태 이력</CardTitle>
          <div className="flex gap-sp-2">
            {FILTER_LABELS.map((f) => (
              <button
                key={f.key}
                onClick={() => { setHistoryFilter(f.key); setHistoryPage(1); }}
                className={[
                  "px-sp-3 py-sp-1 rounded-full text-xs font-medium transition-colors",
                  historyFilter === f.key
                    ? "bg-brand text-white"
                    : "bg-surface-secondary text-text-secondary hover:bg-surface-canvas",
                ].join(" ")}
              >
                {f.label}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardBody className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-sp-5 py-sp-3 font-medium text-text-tertiary">날짜</th>
                <th className="text-left px-sp-5 py-sp-3 font-medium text-text-tertiary w-[60px]">요일</th>
                <th className="text-left px-sp-5 py-sp-3 font-medium text-text-tertiary">출근</th>
                <th className="text-left px-sp-5 py-sp-3 font-medium text-text-tertiary">퇴근</th>
                <th className="text-left px-sp-5 py-sp-3 font-medium text-text-tertiary">총 근무</th>
                <th className="text-left px-sp-5 py-sp-3 font-medium text-text-tertiary">상태</th>
              </tr>
            </thead>
            <tbody>
              {historyPageData.map((row) => (
                <tr
                  key={row.id}
                  className={[
                    "border-b border-border-subtle last:border-b-0 transition-colors",
                    row.isToday ? "bg-brand-soft/30" : "hover:bg-surface-secondary",
                  ].join(" ")}
                >
                  <td className="px-sp-5 py-sp-3 text-text-primary">{row.date}</td>
                  <td className="px-sp-5 py-sp-3 text-text-secondary">{row.dayLabel}</td>
                  <td className={`px-sp-5 py-sp-3 tabular-nums ${row.checkIn ? "text-text-secondary" : "text-text-tertiary"}`}>
                    {row.checkIn ?? "—"}
                  </td>
                  <td className={`px-sp-5 py-sp-3 tabular-nums ${row.checkOut ? "text-text-secondary" : "text-text-tertiary"}`}>
                    {row.checkOut ?? "—"}
                  </td>
                  <td className={`px-sp-5 py-sp-3 tabular-nums ${row.totalWork ? "text-text-secondary" : "text-text-tertiary"}`}>
                    {row.totalWork ?? "—"}
                  </td>
                  <td className="px-sp-5 py-sp-3">{historyStatusBadge(row.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>

        {/* Pagination Footer */}
        <div className="flex items-center justify-between px-sp-5 py-sp-3 border-t border-border">
          <span className="text-xs text-text-tertiary">
            {historyTotal}건 중 {historyTotal > 0 ? (historyPage - 1) * 10 + 1 : 0}–
            {Math.min(historyPage * 10, historyTotal)}건 표시
          </span>
          <div className="flex items-center gap-sp-2">
            <Button
              variant="ghost"
              size="sm"
              disabled={historyPage <= 1}
              onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
            >
              ← 이전
            </Button>
            {Array.from({ length: historyTotalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setHistoryPage(p)}
                className={[
                  "w-8 h-8 rounded text-xs font-medium transition-colors",
                  p === historyPage
                    ? "bg-brand text-white"
                    : "text-text-secondary hover:bg-surface-secondary",
                ].join(" ")}
              >
                {p}
              </button>
            ))}
            <Button
              variant="ghost"
              size="sm"
              disabled={historyPage >= historyTotalPages}
              onClick={() => setHistoryPage((p) => Math.min(historyTotalPages, p + 1))}
            >
              다음 →
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
