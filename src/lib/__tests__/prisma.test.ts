import { describe, it, expect, vi, beforeEach } from "vitest";

describe("Prisma Client", () => {
  beforeEach(() => {
    vi.resetModules();
    // globalThis에서 prisma 제거
    const g = globalThis as unknown as { prisma?: unknown };
    delete g.prisma;
  });

  it("prisma 인스턴스를 export해야 함", async () => {
    const mod = await import("../prisma");
    expect(mod.prisma).toBeDefined();
  });

  it("개발 환경에서 글로벌 싱글톤에 캐시해야 함", async () => {
    const origEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";

    const mod = await import("../prisma");
    const g = globalThis as unknown as { prisma?: unknown };
    expect(g.prisma).toBe(mod.prisma);

    process.env.NODE_ENV = origEnv;
  });

  it("프로덕션 환경에서는 글로벌에 캐시하지 않아야 함", async () => {
    const origEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";

    const g = globalThis as unknown as { prisma?: unknown };
    delete g.prisma;

    await import("../prisma");
    // production에서는 globalThis.prisma를 설정하지 않음
    expect(g.prisma).toBeUndefined();

    process.env.NODE_ENV = origEnv;
  });
});
