import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { DEFAULT_TIMEZONE, DEFAULT_WORK_START_TIME, DEFAULT_WORK_END_TIME, DEFAULT_GPS_RADIUS } from "@/lib/constants";

interface CompanySettings {
  companyName: string;
  businessNumber: string;
  industry: string;
  representative: string;
  fiscalYearStart: string;
  timezone: string;
  workStartTime: string;
  workEndTime: string;
  logoUrl: string;
  officeLatitude: string;
  officeLongitude: string;
  allowedRadius: string;
}

const DEFAULT_SETTINGS: CompanySettings = {
  companyName: "",
  businessNumber: "",
  industry: "",
  representative: "",
  fiscalYearStart: "1",
  timezone: DEFAULT_TIMEZONE,
  workStartTime: DEFAULT_WORK_START_TIME,
  workEndTime: DEFAULT_WORK_END_TIME,
  logoUrl: "",
  officeLatitude: "",
  officeLongitude: "",
  allowedRadius: String(DEFAULT_GPS_RADIUS),
};

// ─── GET: 회사 설정 조회 ────────────────────────────────
export async function GET(request: NextRequest) {
  try {
  const token = await getToken({ req: request });
  if (!token || !token.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tenantId = token.tenantId as string;

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { name: true, settings: true },
  });

  if (!tenant) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  const stored =
    typeof tenant.settings === "object" && tenant.settings !== null
      ? (tenant.settings as Record<string, unknown>)
      : {};

  const company: CompanySettings = {
    ...DEFAULT_SETTINGS,
    companyName: (stored.companyName as string) || tenant.name || "",
    businessNumber: (stored.businessNumber as string) || "",
    industry: (stored.industry as string) || "",
    representative: (stored.representative as string) || "",
    fiscalYearStart: (stored.fiscalYearStart as string) || "1",
    timezone: (stored.timezone as string) || DEFAULT_TIMEZONE,
    workStartTime: (stored.workStartTime as string) || DEFAULT_WORK_START_TIME,
    workEndTime: (stored.workEndTime as string) || DEFAULT_WORK_END_TIME,
    logoUrl: (stored.logoUrl as string) || "",
    officeLatitude: (stored.officeLatitude != null) ? String(stored.officeLatitude) : "",
    officeLongitude: (stored.officeLongitude != null) ? String(stored.officeLongitude) : "",
    allowedRadius: (stored.allowedRadius != null) ? String(stored.allowedRadius) : String(DEFAULT_GPS_RADIUS),
  };

  return NextResponse.json({ data: company });
  } catch (error) {
    console.error("[settings/company GET] Error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// ─── PATCH: 회사 설정 수정 ──────────────────────────────
export async function PATCH(request: NextRequest) {
  try {
  const token = await getToken({ req: request });
  if (!token || !token.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tenantId = token.tenantId as string;
  const body = await request.json();

  const {
    companyName,
    name,
    businessNumber,
    industry,
    representative,
    fiscalYearStart,
    timezone,
    workStartTime,
    workEndTime,
    logoUrl,
    officeLatitude,
    officeLongitude,
    allowedRadius,
  } = body as Partial<CompanySettings & { name: string }>;

  const resolvedName = companyName || name;

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { settings: true },
  });

  if (!tenant) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  const existing =
    typeof tenant.settings === "object" && tenant.settings !== null
      ? (tenant.settings as Record<string, unknown>)
      : {};

  const updatedSettings = {
    ...existing,
    ...(resolvedName && { companyName: resolvedName.trim() }),
    ...(businessNumber !== undefined && { businessNumber: businessNumber.trim() }),
    ...(industry !== undefined && { industry }),
    ...(representative !== undefined && { representative: representative.trim() }),
    ...(fiscalYearStart !== undefined && { fiscalYearStart }),
    ...(timezone !== undefined && { timezone }),
    ...(workStartTime !== undefined && { workStartTime }),
    ...(workEndTime !== undefined && { workEndTime }),
    ...(logoUrl !== undefined && { logoUrl }),
    ...(officeLatitude !== undefined && { officeLatitude: officeLatitude ? parseFloat(officeLatitude) : null }),
    ...(officeLongitude !== undefined && { officeLongitude: officeLongitude ? parseFloat(officeLongitude) : null }),
    ...(allowedRadius !== undefined && { allowedRadius: allowedRadius ? parseInt(allowedRadius, 10) : DEFAULT_GPS_RADIUS }),
  };

  await prisma.tenant.update({
    where: { id: tenantId },
    data: {
      ...(resolvedName && { name: resolvedName.trim() }),
      settings: updatedSettings,
    },
  });

  return NextResponse.json({ data: updatedSettings });
  } catch (error) {
    console.error("[settings/company PATCH] Error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
