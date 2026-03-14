"use client";

import { useState, useEffect } from "react";
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

/* ────────────────────────────────────────────
   Mock Data
   ──────────────────────────────────────────── */

const MOCK_TODAY: TodayStatus = {
  checkIn: "09:02",
  checkOut: null,
  totalHours: null,
  shiftType: "일반 근무",
  expectedEnd: "18:00",
};

const MOCK_ATTENDANCE_STATUS: AttendanceStatus = "working";

const MOCK_WEEKLY_SCHEDULE: WeeklyScheduleRow[] = [
  { dayLabel: "월", date: "3월 10일", shiftType: "일반 근무", startTime: "09:00", endTime: "18:00", status: "normal", isToday: false },
  { dayLabel: "화", date: "3월 11일", shiftType: "일반 근무", startTime: "09:00", endTime: "18:00", status: "normal", isToday: false },
  { dayLabel: "수", date: "3월 12일", shiftType: "일반 근무", startTime: "09:00", endTime: "18:00", status: "normal", isToday: false },
  { dayLabel: "목", date: "3월 13일", shiftType: "일반 근무", startTime: "09:00", endTime: "18:00", status: "working", isToday: true },
  { dayLabel: "금", date: "3월 14일", shiftType: "일반 근무", startTime: "09:00", endTime: "18:00", status: "scheduled", isToday: false },
];

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
  const [attendanceStatus] = useState<AttendanceStatus>(MOCK_ATTENDANCE_STATUS);
  const [todayStatus] = useState<TodayStatus>(MOCK_TODAY);
  const [weeklySchedule] = useState<WeeklyScheduleRow[]>(MOCK_WEEKLY_SCHEDULE);

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
          2026년 3월 2주차 (3/10 ~ 3/14)
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
    </div>
  );
}
