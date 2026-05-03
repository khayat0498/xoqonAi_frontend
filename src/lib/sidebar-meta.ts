// Shared cache + inflight deduplication for RPC 101 (get_sidebar_meta).
// UserProvider, Sidebar va home page bir xil ma'lumotni ishlatadi —
// bitta cache va bitta inflight Promise.

import { rpcCall } from "./rpc";
import type { UserRole, Tenant } from "./user-context-types";

const CACHE_KEY = "xoqon_sidebar_cache";
const CACHE_TS_KEY = "xoqon_sidebar_cache_ts";
const TTL_MS = 60_000;

export type SidebarMeta = {
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
    role: UserRole;
    tenantId: string | null;
    createdAt: string;
  };
  tenant: Tenant | null;
  planKey: string;
  period: string;
  endsAt: string | null;
  balanceUzs: number;
  usage: { used: number; limit: number; allowed: boolean };
};

let inflight: Promise<SidebarMeta | null> | null = null;

export function readCachedMeta(): SidebarMeta | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) as SidebarMeta : null;
  } catch {
    return null;
  }
}

export function isCacheFresh(): boolean {
  if (typeof window === "undefined") return false;
  const ts = Number(localStorage.getItem(CACHE_TS_KEY) ?? 0);
  return ts > 0 && (Date.now() - ts) < TTL_MS;
}

export async function fetchSidebarMeta(): Promise<SidebarMeta | null> {
  if (inflight) return inflight;
  inflight = rpcCall<SidebarMeta>(101)
    .then((meta) => {
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(meta));
        localStorage.setItem(CACHE_TS_KEY, String(Date.now()));
      } catch {}
      return meta;
    })
    .catch(() => null)
    .finally(() => { inflight = null; });
  return inflight;
}

export async function getSidebarMeta(force = false): Promise<SidebarMeta | null> {
  if (!force) {
    const cached = readCachedMeta();
    if (cached && isCacheFresh()) return cached;
  }
  return fetchSidebarMeta();
}

export function invalidateSidebarMeta() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(CACHE_KEY);
  localStorage.removeItem(CACHE_TS_KEY);
}

export function patchSidebarMeta(patch: Partial<SidebarMeta>) {
  const cached = readCachedMeta();
  if (!cached) return;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ ...cached, ...patch }));
  } catch {}
}
