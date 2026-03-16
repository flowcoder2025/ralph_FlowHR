import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

interface NotificationRule {
  id: string;
  event: string;
  label: string;
  emailEnabled: boolean;
  inAppEnabled: boolean;
}

const DEFAULT_RULES: NotificationRule[] = [
  { id: "leave_request", event: "LEAVE_REQUEST", label: "휴가 신청", emailEnabled: true, inAppEnabled: true },
  { id: "leave_approved", event: "LEAVE_APPROVED", label: "휴가 승인", emailEnabled: true, inAppEnabled: true },
  { id: "leave_rejected", event: "LEAVE_REJECTED", label: "휴가 반려", emailEnabled: true, inAppEnabled: true },
  { id: "attendance_late", event: "ATTENDANCE_LATE", label: "지각 알림", emailEnabled: false, inAppEnabled: true },
  { id: "one_on_one_reminder", event: "ONE_ON_ONE_REMINDER", label: "1:1 미팅 리마인더", emailEnabled: true, inAppEnabled: true },
  { id: "eval_start", event: "EVAL_START", label: "평가 시작", emailEnabled: true, inAppEnabled: true },
  { id: "document_received", event: "DOCUMENT_RECEIVED", label: "문서 수신", emailEnabled: true, inAppEnabled: true },
  { id: "approval_request", event: "APPROVAL_REQUEST", label: "결재 요청", emailEnabled: true, inAppEnabled: true },
];

// ─── GET: 알림 규칙 목록 조회 ────────────────────────────
export async function GET(request: NextRequest) {
  try {
  const token = await getToken({ req: request });
  if (!token || !token.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tenantId = token.tenantId as string;

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { settings: true },
  });

  if (!tenant) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  const stored =
    typeof tenant.settings === "object" && tenant.settings !== null
      ? (tenant.settings as Record<string, unknown>)
      : {};

  const savedRules = (stored.notifications as NotificationRule[] | undefined) ?? [];

  // 기본 규칙에 저장된 설정 병합
  const rules = DEFAULT_RULES.map((defaultRule) => {
    const saved = savedRules.find((r) => r.id === defaultRule.id);
    return saved ? { ...defaultRule, ...saved } : defaultRule;
  });

  return NextResponse.json({ data: rules });
  } catch (error) {
    console.error("[settings/notifications GET] Error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// ─── PATCH: 알림 규칙 수정 ──────────────────────────────
export async function PATCH(request: NextRequest) {
  try {
  const token = await getToken({ req: request });
  if (!token || !token.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tenantId = token.tenantId as string;

  const body = await request.json();
  const { id, emailEnabled, inAppEnabled } = body;

  if (!id) {
    return NextResponse.json(
      { error: "id는 필수입니다" },
      { status: 400 },
    );
  }

  const validRule = DEFAULT_RULES.find((r) => r.id === id);
  if (!validRule) {
    return NextResponse.json(
      { error: "유효하지 않은 알림 규칙입니다" },
      { status: 400 },
    );
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { settings: true },
  });

  if (!tenant) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  const stored =
    typeof tenant.settings === "object" && tenant.settings !== null
      ? (tenant.settings as Record<string, unknown>)
      : {};

  const savedRules = (stored.notifications as NotificationRule[] | undefined) ?? [];

  const existingIndex = savedRules.findIndex((r) => r.id === id);
  const updatedRule: NotificationRule = {
    ...validRule,
    ...(existingIndex >= 0 ? savedRules[existingIndex] : {}),
    ...(emailEnabled !== undefined ? { emailEnabled } : {}),
    ...(inAppEnabled !== undefined ? { inAppEnabled } : {}),
  };

  const updatedRules = [...savedRules];
  if (existingIndex >= 0) {
    updatedRules[existingIndex] = updatedRule;
  } else {
    updatedRules.push(updatedRule);
  }

  const updatedSettings = {
    ...stored,
    notifications: updatedRules as unknown as Prisma.JsonArray,
  } as Prisma.InputJsonValue;

  await prisma.tenant.update({
    where: { id: tenantId },
    data: {
      settings: updatedSettings,
    },
  });

  return NextResponse.json({ data: updatedRule });
  } catch (error) {
    console.error("[settings/notifications PATCH] Error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
