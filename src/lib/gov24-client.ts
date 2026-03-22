/**
 * 보조금24 API 클라이언트
 *
 * 행정안전부 공공서비스 혜택 정보(api.odcloud.kr)에서
 * 고용 관련 프로그램을 수집하여 SubsidyProgram 테이블에 동기화.
 */

import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// ─── Constants ──────────────────────────────────────────

const BASE_URL = "https://api.odcloud.kr/api";
const DEFAULT_PAGE = 1;
const DEFAULT_PER_PAGE = 100;

// ─── Types ──────────────────────────────────────────────

interface Gov24Response<T> {
  currentCount: number;
  matchCount: number;
  totalCount: number;
  page: number;
  perPage: number;
  data: T[];
}

interface ServiceListItem {
  서비스ID: string;
  서비스명: string;
  서비스분야: string;
  소관기관명: string;
  서비스목적요약: string;
  상세조회URL: string;
}

interface ServiceDetailItem {
  서비스ID: string;
  서비스명: string;
  서비스목적: string;
  신청기한: string;
  지원내용: string;
  선정기준: string;
  소관기관명: string;
  서비스분야: string;
}

interface SupportConditionItem {
  서비스ID: string;
  연령: string;
  JA0101?: string;
  JA0201?: string;
  JA0301?: string;
}

interface SyncResult {
  synced: number;
  created: number;
  updated: number;
}

// ─── Helpers ────────────────────────────────────────────

function getApiKey(): string {
  const key = process.env.GOV24_API_KEY;
  if (!key) {
    throw new Error("GOV24_API_KEY 환경변수가 설정되지 않았습니다");
  }
  return key;
}

function buildUrl(path: string, params: Record<string, string>): string {
  const url = new URL(`${BASE_URL}${path}`);
  url.searchParams.set("page", String(DEFAULT_PAGE));
  url.searchParams.set("perPage", String(DEFAULT_PER_PAGE));
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  const base = url.toString();
  return base + (base.includes("?") ? "&" : "?") + `serviceKey=${getApiKey()}`;
}

async function fetchJson<T>(url: string): Promise<Gov24Response<T>> {
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    throw new Error(`보조금24 API 호출 실패: ${res.status} ${res.statusText}`);
  }

  return res.json() as Promise<Gov24Response<T>>;
}

// ─── API Functions ──────────────────────────────────────

export async function fetchServiceList(): Promise<ServiceListItem[]> {
  const url = buildUrl("/gov24/v3/serviceList", {
    "cond[서비스분야::LIKE]": "고용",
  });
  const response = await fetchJson<ServiceListItem>(url);
  return response.data;
}

export async function fetchServiceDetail(serviceId: string): Promise<ServiceDetailItem | null> {
  const url = buildUrl("/gov24/v3/serviceDetail", {
    "cond[서비스ID::EQ]": serviceId,
  });
  const response = await fetchJson<ServiceDetailItem>(url);
  return response.data[0] ?? null;
}

export async function fetchSupportConditions(serviceId: string): Promise<SupportConditionItem | null> {
  const url = buildUrl("/gov24/v3/supportConditions", {
    "cond[서비스ID::EQ]": serviceId,
  });
  const response = await fetchJson<SupportConditionItem>(url);
  return response.data[0] ?? null;
}

// ─── Eligibility Criteria Mapping ───────────────────────

function parseAgeRange(ageStr: string): { ageMin?: number; ageMax?: number } {
  const result: { ageMin?: number; ageMax?: number } = {};

  const rangeMatch = ageStr.match(/(\d+)\s*[~\-세]\s*(\d+)/);
  if (rangeMatch) {
    result.ageMin = Number(rangeMatch[1]);
    result.ageMax = Number(rangeMatch[2]);
    return result;
  }

  const minMatch = ageStr.match(/(\d+)\s*세?\s*이상/);
  if (minMatch) {
    result.ageMin = Number(minMatch[1]);
  }

  const maxMatch = ageStr.match(/(\d+)\s*세?\s*이하/);
  if (maxMatch) {
    result.ageMax = Number(maxMatch[1]);
  }

  return result;
}

function mapEligibilityCriteria(
  conditions: SupportConditionItem | null,
): Record<string, unknown> {
  if (!conditions) return {};

  const criteria: Record<string, unknown> = {};

  if (conditions.연령) {
    const { ageMin, ageMax } = parseAgeRange(conditions.연령);
    if (ageMin !== undefined) criteria.ageMin = ageMin;
    if (ageMax !== undefined) criteria.ageMax = ageMax;
  }

  if (conditions.JA0201) {
    const disability = conditions.JA0201.toLowerCase();
    if (disability.includes("필수") || disability.includes("해당")) {
      criteria.disabilityRequired = true;
    }
  }

  return criteria;
}

// ─── Category Mapping ───────────────────────────────────

function mapCategory(field: string): string {
  if (field.includes("안정")) return "고용안정";
  if (field.includes("능력") || field.includes("개발")) return "직업능력개발";
  if (field.includes("촉진")) return "고용촉진";
  if (field.includes("모성") || field.includes("육아")) return "모성보호";
  if (field.includes("장애")) return "장애인고용";
  return "기타";
}

// ─── Sync ───────────────────────────────────────────────

export async function syncSubsidyPrograms(tenantId: string): Promise<SyncResult> {
  const services = await fetchServiceList();

  let created = 0;
  let updated = 0;

  for (const service of services) {
    const [detail, conditions] = await Promise.all([
      fetchServiceDetail(service.서비스ID),
      fetchSupportConditions(service.서비스ID),
    ]);

    const eligibilityCriteria = mapEligibilityCriteria(conditions) as Prisma.InputJsonValue;
    const category = mapCategory(service.서비스분야);
    const name = service.서비스명;
    const provider = detail?.소관기관명 ?? service.소관기관명;
    const description = detail?.서비스목적 ?? service.서비스목적요약;

    const existing = await prisma.subsidyProgram.findFirst({
      where: { tenantId, externalProgramId: service.서비스ID },
    });

    if (existing) {
      await prisma.subsidyProgram.update({
        where: { id: existing.id },
        data: {
          name,
          provider,
          category,
          description,
          eligibilityCriteria,
          isActive: true,
          externalApiUrl: service.상세조회URL || null,
        },
      });
      updated++;
    } else {
      await prisma.subsidyProgram.create({
        data: {
          tenantId,
          name,
          provider,
          category,
          description,
          eligibilityCriteria,
          monthlyAmount: 0,
          maxDurationMonths: 12,
          isActive: true,
          externalProgramId: service.서비스ID,
          externalApiUrl: service.상세조회URL || null,
        },
      });
      created++;
    }
  }

  return { synced: created + updated, created, updated };
}
