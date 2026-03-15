import { execSync } from "child_process";
import type { FullConfig } from "@playwright/test";

/**
 * Playwright globalSetup — E2E 테스트 실행 전 DB 준비
 *
 * 1. prisma db push: 스키마 동기화 (마이그레이션 없이)
 * 2. prisma db seed: 테스트용 시드 데이터 주입
 */
export default async function globalSetup(_config: FullConfig): Promise<void> {
  // CI에서는 shard별로 globalSetup이 실행되므로 seed를 여기서 하면 충돌.
  // CI의 seed는 ci.yml의 별도 step에서 1회만 실행.
  if (process.env.CI) {
    console.log("\n[globalSetup] CI 환경 — DB seed 스킵 (ci.yml에서 처리)\n");
    return;
  }

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
