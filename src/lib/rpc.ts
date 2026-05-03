// Universal RPC reader (Colba ERP pattern)
// POST /api/rpc/call → { success, data } | { success: false, error }

import { getToken, removeToken } from "./auth";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export class RpcError extends Error {
  constructor(public code: string, message: string) {
    super(message);
  }
}

export async function rpcCall<T = unknown>(
  funcId: number,
  params: Record<string, unknown> = {}
): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API}/api/rpc/call`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ funcId, params }),
  });

  if (res.status === 401) {
    removeToken();
    if (typeof window !== "undefined") window.location.href = "/auth/login";
  }

  const data = await res.json().catch(() => ({}));
  if (!data?.success) {
    throw new RpcError(
      data?.error?.code ?? "INTERNAL",
      data?.error?.message ?? `HTTP ${res.status}`
    );
  }
  return data.data as T;
}
