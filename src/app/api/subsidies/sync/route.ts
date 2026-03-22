import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { syncSubsidyPrograms } from "@/lib/gov24-client";

// ─── POST: 보조금24 외부 프로그램 동기화 ─────────────────
export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request });
    if (!token || !token.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = token.tenantId as string;
    const result = await syncSubsidyPrograms(tenantId);

    return NextResponse.json({
      data: result,
    });
  } catch (error) {
    console.error("[subsidies/sync POST] Error:", error);
    return NextResponse.json(
      { error: "동기화 중 오류가 발생했습니다" },
      { status: 500 },
    );
  }
}
