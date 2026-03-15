import type { FullConfig } from "@playwright/test";

/**
 * Playwright globalTeardown
 * DB 데이터는 삭제하지 않음 (다음 실행의 globalSetup에서 cleanup+seed 처리)
 */
export default async function globalTeardown(
  _config: FullConfig,
): Promise<void> {
  console.log("\n[globalTeardown] E2E 테스트 종료\n");
}
