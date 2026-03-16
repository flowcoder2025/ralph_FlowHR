"use client";

import { useEffect } from "react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Platform Error]", error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-sp-4">
      <div className="text-4xl">⚠️</div>
      <h2 className="text-xl font-bold text-text-primary">문제가 발생했습니다</h2>
      <p className="text-sm text-text-secondary max-w-md text-center">
        {error.message || "알 수 없는 오류가 발생했습니다. 잠시 후 다시 시도해주세요."}
      </p>
      <button
        onClick={reset}
        className="rounded-md bg-brand px-sp-4 py-sp-2 text-sm font-medium text-white hover:bg-brand-hover transition-colors"
      >
        다시 시도
      </button>
    </div>
  );
}
