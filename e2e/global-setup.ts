import { execSync } from "child_process";
import type { FullConfig } from "@playwright/test";

/**
 * Playwright globalSetup — E2E 테스트 실행 전 DB 준비
 *
 * 1. prisma db push: 스키마 동기화 (마이그레이션 없이)
 * 2. prisma db seed: 테스트용 시드 데이터 주입
 */
export default async function globalSetup(_config: FullConfig): Promise<void> {
  console.log("\n[globalSetup] E2E DB 준비 시작...");

  const execOpts = {
    stdio: "inherit" as const,
    env: { ...process.env },
    timeout: 120_000,
  };

  try {
    console.log("[globalSetup] prisma db push (스키마 동기화)...");
    execSync("npx prisma db push --skip-generate --accept-data-loss", execOpts);

    console.log("[globalSetup] prisma db seed (시드 데이터 주입)...");
    execSync("npx prisma db seed", execOpts);

    console.log("[globalSetup] DB 준비 완료\n");
  } catch (error) {
    console.error("[globalSetup] DB 준비 실패:", error);
    throw error;
  }
}
