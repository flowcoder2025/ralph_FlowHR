/**
 * 공통 API fetch 래퍼
 * - 401 응답 시 자동 로그아웃
 * - 에러 응답 표준 처리
 */
import { signOut } from "next-auth/react";

interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  total?: number;
  page?: number;
  pageSize?: number;
}

export async function apiFetch<T = unknown>(
  url: string,
  options?: RequestInit,
): Promise<ApiResponse<T>> {
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (res.status === 401) {
    signOut({ callbackUrl: "/login" });
    throw new Error("세션이 만료되었습니다.");
  }

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(json.error || `API 오류 (${res.status})`);
  }

  return json as ApiResponse<T>;
}

export async function apiGet<T = unknown>(url: string): Promise<ApiResponse<T>> {
  return apiFetch<T>(url);
}

export async function apiPost<T = unknown>(url: string, body: unknown): Promise<ApiResponse<T>> {
  return apiFetch<T>(url, { method: "POST", body: JSON.stringify(body) });
}

export async function apiPatch<T = unknown>(url: string, body: unknown): Promise<ApiResponse<T>> {
  return apiFetch<T>(url, { method: "PATCH", body: JSON.stringify(body) });
}

export async function apiDelete<T = unknown>(url: string): Promise<ApiResponse<T>> {
  return apiFetch<T>(url, { method: "DELETE" });
}
