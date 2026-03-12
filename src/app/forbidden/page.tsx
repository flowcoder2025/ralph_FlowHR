"use client";

import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui";

export default function ForbiddenPage() {
  const router = useRouter();
  const { data: session } = useSession();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface-canvas p-sp-8">
      <div className="max-w-md text-center">
        <div className="mb-sp-4 text-4xl font-bold text-status-danger-solid">
          403
        </div>
        <h1 className="mb-sp-2 text-2xl font-bold text-text-primary">
          접근 권한 없음
        </h1>
        <p className="mb-sp-8 text-md text-text-secondary">
          이 페이지에 접근할 권한이 없습니다.
          {session?.user?.role && (
            <span className="mt-sp-2 block text-sm text-text-tertiary">
              현재 역할: {session.user.role}
            </span>
          )}
        </p>
        <div className="flex items-center justify-center gap-sp-3">
          <Button variant="secondary" onClick={() => router.back()}>
            뒤로 가기
          </Button>
          <Button
            variant="primary"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            다시 로그인
          </Button>
        </div>
      </div>
    </div>
  );
}
