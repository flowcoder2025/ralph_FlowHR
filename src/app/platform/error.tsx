"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui";

export default function PlatformError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Platform]", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-sp-4 text-center">
      <div className="rounded-full bg-status-error/10 p-sp-4">
        <svg
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-status-error"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <h2 className="text-lg font-semibold text-text-primary">
        시스템 오류가 발생했습니다
      </h2>
      <p className="max-w-md text-sm text-text-secondary">
        플랫폼 콘솔에서 오류가 발생했습니다. 문제가 지속되면 관리자에게
        문의해 주세요.
      </p>
      <Button variant="primary" onClick={reset}>
        다시 시도
      </Button>
    </div>
  );
}
