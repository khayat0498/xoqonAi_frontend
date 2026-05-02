// Markazlashtirilgan API client. Bearer token avtomatik qo'shiladi,
// 401'da token o'chiriladi va login sahifaga yo'naltiriladi.

import { getToken, removeToken } from "./auth";
import type { Tenant, UserRole } from "./user-context";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

// ─── Asosiy fetch wrapper ───
type FetchOpts = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  auth?: boolean; // default true
  headers?: Record<string, string>;
};

export class ApiError extends Error {
  constructor(public status: number, public body: { error?: string; [k: string]: unknown }) {
    super(body?.error ?? `HTTP ${status}`);
  }
}

async function request<T>(path: string, opts: FetchOpts = {}): Promise<T> {
  const headers: Record<string, string> = {
    ...(opts.body ? { "Content-Type": "application/json" } : {}),
    ...(opts.headers ?? {}),
  };

  if (opts.auth !== false) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API}${path}`, {
    method: opts.method ?? "GET",
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });

  if (res.status === 401) {
    removeToken();
    if (typeof window !== "undefined") window.location.href = "/auth/login";
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data);
  return data as T;
}

// ═══════════════════════════════════════════
// AUTH
// ═══════════════════════════════════════════

export const auth = {
  checkEmail: (email: string) =>
    request<{ exists: boolean }>("/api/auth/check-email", {
      method: "POST",
      body: { email },
      auth: false,
    }),

  sendCode: (email: string) =>
    request<{ ok: boolean }>("/api/auth/send-code", {
      method: "POST",
      body: { email },
      auth: false,
    }),

  verifyCode: (email: string, code: string) =>
    request<{ verified: boolean; exists: boolean; tempToken?: string }>(
      "/api/auth/verify-code",
      { method: "POST", body: { email, code }, auth: false }
    ),

  registerTenant: (input: { tempToken: string; password: string; name: string; tenantName: string }) =>
    request<{
      token: string;
      user: { id: string; name: string; email: string; role: UserRole; tenantId: string };
      tenant: Tenant;
    }>("/api/auth/register-tenant", { method: "POST", body: input, auth: false }),

  me: () =>
    request<{
      id: string;
      name: string;
      email: string;
      role: UserRole;
      avatarUrl: string | null;
      tenantId: string | null;
      tenant: Tenant | null;
      createdAt: string;
    }>("/api/auth/me"),

  logout: () => request<{ ok: boolean }>("/api/auth/logout", { method: "POST" }),
};

// ═══════════════════════════════════════════
// TENANT (xodim/teacher tomonidan)
// ═══════════════════════════════════════════

export const tenant = {
  preview: (inviteCode: string) =>
    request<{ tenant: { id: string; name: string } }>("/api/tenant/preview", {
      method: "POST",
      body: { inviteCode },
    }),

  join: (inviteCode: string) =>
    request<{ ok: boolean; tenant: { id: string; name: string } }>("/api/tenant/join", {
      method: "POST",
      body: { inviteCode },
    }),

  leave: () => request<{ ok: boolean }>("/api/tenant/leave", { method: "POST" }),
};

// ═══════════════════════════════════════════
// DIREKTOR
// ═══════════════════════════════════════════

export type DirektorXodim = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  role: UserRole;
  balanceUzs: number | null;
  createdAt: string;
};

export type TenantBalanceLog = {
  id: string;
  amountUzs: number;
  type: "deposit" | "transfer" | "refund" | string;
  note: string | null;
  toUserName: string | null;
  createdAt: string;
};

export const direktor = {
  me: () =>
    request<{
      tenant: Tenant & { createdAt: string; approvedAt: string | null };
      stats: { memberCount: number; totalSubmissions: number };
    }>("/api/direktor/me"),

  xodimlar: () => request<{ xodimlar: DirektorXodim[] }>("/api/direktor/xodimlar"),

  topupXodim: (xodimId: string, amountUzs: number, note?: string) =>
    request<{ ok: boolean }>(`/api/direktor/xodim/${xodimId}/topup`, {
      method: "POST",
      body: { amountUzs, note },
    }),

  withdrawXodim: (xodimId: string, amountUzs: number, note?: string) =>
    request<{ ok: boolean }>(`/api/direktor/xodim/${xodimId}/withdraw`, {
      method: "POST",
      body: { amountUzs, note },
    }),

  removeXodim: (xodimId: string) =>
    request<{ ok: boolean }>(`/api/direktor/xodim/${xodimId}`, { method: "DELETE" }),

  balanceLogs: (limit = 50) =>
    request<{ logs: TenantBalanceLog[] }>(`/api/direktor/balance-logs?limit=${limit}`),

  submissions: (limit = 50) =>
    request<{
      submissions: {
        id: string;
        teacherId: string;
        teacherName: string;
        status: string;
        subject: string | null;
        createdAt: string;
      }[];
    }>(`/api/direktor/submissions?limit=${limit}`),
};

// ═══════════════════════════════════════════
// ADMIN — TENANTS
// ═══════════════════════════════════════════

export type AdminTenant = {
  id: string;
  name: string;
  inviteCode: string;
  balanceUzs: number;
  status: "pending" | "active" | "rejected" | "suspended";
  createdAt: string;
  approvedAt: string | null;
  rejectedReason: string | null;
  ownerId: string;
  ownerName: string | null;
  ownerEmail: string | null;
  memberCount: number;
};

export const adminTenants = {
  list: (status?: "all" | AdminTenant["status"]) => {
    const q = status && status !== "all" ? `?status=${status}` : "";
    return request<{ tenants: AdminTenant[] }>(`/api/admin/tenants${q}`);
  },

  detail: (id: string) =>
    request<{
      tenant: AdminTenant;
      members: { id: string; name: string; email: string; role: UserRole; createdAt: string }[];
      recentLogs: TenantBalanceLog[];
    }>(`/api/admin/tenants/${id}`),

  approve: (id: string) =>
    request<{ ok: boolean }>(`/api/admin/tenants/${id}/approve`, { method: "POST" }),

  reject: (id: string, reason?: string) =>
    request<{ ok: boolean }>(`/api/admin/tenants/${id}/reject`, {
      method: "POST",
      body: { reason },
    }),

  suspend: (id: string) =>
    request<{ ok: boolean }>(`/api/admin/tenants/${id}/suspend`, { method: "POST" }),

  topup: (id: string, amountUzs: number, note?: string) =>
    request<{ ok: boolean }>(`/api/admin/tenants/${id}/topup`, {
      method: "POST",
      body: { amountUzs, note },
    }),
};
