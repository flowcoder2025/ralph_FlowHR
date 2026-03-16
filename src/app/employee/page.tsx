"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

interface TodayStatus {
  checkIn: string | null;
  checkOut: string | null;
  status: string;
}

interface QuickStat {
  label: string;
  value: string;
}

export default function EmployeeHomePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [todayStatus, setTodayStatus] = useState<TodayStatus | null>(null);
  const [stats, setStats] = useState<QuickStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHome() {
      try {
        const [scheduleRes, profileRes] = await Promise.all([
          fetch("/api/employee/schedule?filter=today&page=1"),
          fetch("/api/employee/profile"),
        ]);

        if (scheduleRes.ok) {
          const scheduleData = await scheduleRes.json();
          const today = scheduleData.data?.todayRecord;
          if (today) {
            setTodayStatus({
              checkIn: today.checkIn ? new Date(today.checkIn).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }) : null,
              checkOut: today.checkOut ? new Date(today.checkOut).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }) : null,
              status: today.status || "NOT_STARTED",
            });
          }
        }

        if (profileRes.ok) {
          const profileData = await profileRes.json();
          const p = profileData.data;
          const quickStats: QuickStat[] = [];
          if (p?.leaveBalances) {
            const total = p.leaveBalances.reduce((s: number, b: { totalDays: number; usedDays: number }) => s + (b.totalDays - b.usedDays), 0);
            quickStats.push({ label: "잔여 휴가", value: total + "일" });
          }
          if (p?.goals) {
            quickStats.push({ label: "진행 목표", value: p.goals.length + "개" });
          }
          setStats(quickStats);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    fetchHome();
  }, []);

  const userName = session?.user?.name || "직원";
  const now = new Date();
  const greeting = now.getHours() < 12 ? "좋은 아침이에요" : now.getHours() < 18 ? "좋은 오후예요" : "수고하셨어요";

  return (
    <div>
      {/* Header */}
      <div className="mb-sp-8">
        <h1 className="text-3xl font-bold text-text-primary">{greeting}, {userName}님</h1>
        <p className="mt-sp-1 text-md text-text-secondary">
          {now.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric", weekday: "long" })}
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-sp-12">
          <span className="text-sm text-text-tertiary">불러오는 중...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-sp-6 md:grid-cols-2 lg:grid-cols-3">
          {/* 출퇴근 상태 */}
          <div className="rounded-lg border border-border bg-surface-primary p-sp-6 shadow-xs">
            <h2 className="text-sm font-semibold text-text-secondary mb-sp-3">오늘 근무</h2>
            <div className="flex items-center gap-sp-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-soft">
                <span className="text-xl">⏰</span>
              </div>
              <div>
                <div className="text-lg font-bold text-text-primary">
                  {todayStatus?.checkIn ? `출근 ${todayStatus.checkIn}` : "미출근"}
                </div>
                <div className="text-sm text-text-tertiary">
                  {todayStatus?.checkOut ? `퇴근 ${todayStatus.checkOut}` : todayStatus?.checkIn ? "근무 중" : "출근 전"}
                </div>
              </div>
            </div>
            <button
              onClick={() => router.push("/employee/schedule")}
              className="mt-sp-4 w-full rounded-md border border-border py-sp-2 text-sm text-text-secondary hover:bg-surface-secondary transition-colors"
            >
              출퇴근 관리 →
            </button>
          </div>

          {/* 빠른 통계 */}
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-lg border border-border bg-surface-primary p-sp-6 shadow-xs">
              <h2 className="text-sm font-semibold text-text-secondary mb-sp-3">{stat.label}</h2>
              <div className="text-2xl font-bold text-text-primary">{stat.value}</div>
            </div>
          ))}

          {/* 퀵 액션 */}
          <div className="rounded-lg border border-border bg-surface-primary p-sp-6 shadow-xs">
            <h2 className="text-sm font-semibold text-text-secondary mb-sp-3">빠른 이동</h2>
            <div className="space-y-sp-2">
              <button onClick={() => router.push("/employee/requests")} className="w-full rounded-md border border-border py-sp-2 text-sm text-text-primary hover:bg-surface-secondary transition-colors">휴가 신청</button>
              <button onClick={() => router.push("/employee/documents")} className="w-full rounded-md border border-border py-sp-2 text-sm text-text-primary hover:bg-surface-secondary transition-colors">문서 · 서명</button>
              <button onClick={() => router.push("/employee/profile")} className="w-full rounded-md border border-border py-sp-2 text-sm text-text-primary hover:bg-surface-secondary transition-colors">내 정보</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
