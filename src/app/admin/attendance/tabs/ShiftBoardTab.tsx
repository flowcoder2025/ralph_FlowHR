"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  CardTitle,
} from "@/components/ui";
import type { BadgeVariant } from "@/components/ui";

// ─── Types ──────────────────────────────────────────────────

interface ShiftEmployee {
  id: string;
  name: string;
  shifts: { shiftName: string; shiftType: string }[];
}

interface ShiftDepartment {
  id: string;
  name: string;
  employees: ShiftEmployee[];
}

interface ShiftBoardData {
  weekStart: string;
  weekDays: { date: string; label: string }[];
  departments: ShiftDepartment[];
}

// ─── Constants ──────────────────────────────────────────────

const SHIFT_TYPE_BADGE: Record<string, { label: string; variant: BadgeVariant }> = {
  REGULAR: { label: "주간", variant: "info" },
  MORNING: { label: "오전", variant: "info" },
  AFTERNOON: { label: "오후", variant: "info" },
  NIGHT: { label: "야간", variant: "warning" },
  FLEXIBLE: { label: "유연", variant: "success" },
};

// ─── Helpers ────────────────────────────────────────────────

function getShiftBadge(
  shiftName: string,
  shiftType: string,
): { label: string; variant: BadgeVariant } | null {
  if (!shiftName && !shiftType) return null;

  const mapped = SHIFT_TYPE_BADGE[shiftType];
  if (mapped) return mapped;

  // Fallback: use shift name with neutral badge
  return { label: shiftName || "—", variant: "neutral" };
}

function getMonday(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const dayOfWeek = d.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  d.setDate(d.getDate() + mondayOffset);
  return d;
}

function formatWeekRange(weekStart: string): string {
  const start = new Date(weekStart);
  const end = new Date(start);
  end.setDate(start.getDate() + 4);
  const sm = start.getMonth() + 1;
  const sd = start.getDate();
  const em = end.getMonth() + 1;
  const ed = end.getDate();
  return `${sm}월 ${sd}일 – ${em}월 ${ed}일`;
}

// ─── Component ──────────────────────────────────────────────

export function ShiftBoardTab() {
  const [shiftData, setShiftData] = useState<ShiftBoardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [weekStart, setWeekStart] = useState<Date>(() => getMonday(new Date()));

  const fetchShifts = useCallback(async (ws: Date) => {
    setLoading(true);
    try {
      const dateStr = ws.toISOString().split("T")[0];
      const res = await fetch(`/api/attendance/shifts?weekStart=${dateStr}`);
      if (res.ok) {
        const json: ShiftBoardData = await res.json();
        setShiftData(json);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchShifts(weekStart);
  }, [weekStart, fetchShifts]);

  function handlePrevWeek() {
    setWeekStart((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() - 7);
      return d;
    });
  }

  function handleNextWeek() {
    setWeekStart((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + 7);
      return d;
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-sp-12">
        <span className="text-sm text-text-tertiary">불러오는 중...</span>
      </div>
    );
  }

  if (!shiftData) {
    return (
      <div className="flex items-center justify-center py-sp-12">
        <span className="text-sm text-text-tertiary">
          데이터를 불러올 수 없습니다
        </span>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>주간 편성표</CardTitle>
        <div className="flex items-center gap-sp-3">
          <Button variant="ghost" size="sm" onClick={handlePrevWeek}>
            &larr; 이전 주
          </Button>
          <span className="text-sm font-semibold text-text-primary">
            {formatWeekRange(shiftData.weekStart)}
          </span>
          <Button variant="ghost" size="sm" onClick={handleNextWeek}>
            다음 주 &rarr;
          </Button>
        </div>
      </CardHeader>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-secondary">
              <th className="px-sp-4 py-sp-3 text-left font-medium text-text-secondary">
                팀 / 이름
              </th>
              {shiftData.weekDays.map((day) => (
                <th
                  key={day.date}
                  className="px-sp-4 py-sp-3 text-center font-medium text-text-secondary"
                >
                  {day.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shiftData.departments.length === 0 ? (
              <tr>
                <td
                  colSpan={1 + shiftData.weekDays.length}
                  className="px-sp-4 py-sp-8 text-center text-text-tertiary"
                >
                  배정된 근무 편성이 없습니다
                </td>
              </tr>
            ) : (
              shiftData.departments.map((dept) => (
                <DepartmentShiftGroup
                  key={dept.id}
                  department={dept}
                  dayCount={shiftData.weekDays.length}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function DepartmentShiftGroup({
  department,
  dayCount,
}: {
  department: ShiftDepartment;
  dayCount: number;
}) {
  return (
    <>
      <tr>
        <td
          colSpan={1 + dayCount}
          className="bg-surface-secondary px-sp-4 py-sp-2 font-semibold text-text-primary"
        >
          {department.name}
        </td>
      </tr>
      {department.employees.map((emp) => (
        <tr
          key={emp.id}
          className="border-b border-border-subtle last:border-b-0"
        >
          <td className="px-sp-4 py-sp-2 text-text-primary">{emp.name}</td>
          {emp.shifts.map((shift, idx) => {
            const badge = getShiftBadge(shift.shiftName, shift.shiftType);
            return (
              <td key={idx} className="px-sp-4 py-sp-2 text-center">
                {badge ? (
                  <Badge variant={badge.variant}>{badge.label}</Badge>
                ) : (
                  <span className="text-text-tertiary">—</span>
                )}
              </td>
            );
          })}
        </tr>
      ))}
    </>
  );
}
