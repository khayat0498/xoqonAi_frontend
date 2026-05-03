"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { getToken, removeToken } from "@/lib/auth";
import { getSidebarMeta, patchSidebarMeta, invalidateSidebarMeta, type SidebarMeta } from "@/lib/sidebar-meta";
import type { UserRole, Tenant } from "@/lib/user-context-types";
import { useRouter } from "next/navigation";

export type { UserRole, Tenant } from "@/lib/user-context-types";

type User = {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  role: UserRole;
  tenantId: string | null;
  tenant: Tenant | null;
  createdAt: string;
};

type UserContextType = {
  user: User | null;
  loading: boolean;
  uploadAvatar: (file: File) => Promise<void>;
};

const UserContext = createContext<UserContextType>({
  user: null,
  loading: true,
  uploadAvatar: async () => {},
});

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

function metaToUser(meta: SidebarMeta): User {
  return { ...meta.user, tenant: meta.tenant };
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem("xoqon_sidebar_cache");
      if (!raw) return null;
      const meta = JSON.parse(raw) as SidebarMeta;
      return meta?.user ? metaToUser(meta) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(() => user === null);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/auth/login");
      return;
    }

    let cancelled = false;
    getSidebarMeta()
      .then((meta) => {
        if (cancelled) return;
        if (meta) {
          setUser(metaToUser(meta));
        } else {
          // RPC error — token bo'lishi mumkin yaroqsiz
          removeToken();
          invalidateSidebarMeta();
          router.replace("/auth/login");
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [router]);

  const uploadAvatar = useCallback(async (file: File) => {
    const token = getToken();
    if (!token) return;

    const form = new FormData();
    form.append("avatar", file);

    const res = await fetch(`${API}/api/users/me/avatar`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });

    if (res.ok) {
      const data = await res.json();
      setUser((prev) => prev ? { ...prev, avatarUrl: data.avatarUrl } : prev);
      // Cache'ni yangilaymiz (sidebar va home avatar uchun)
      patchSidebarMeta({
        user: { ...(JSON.parse(localStorage.getItem("xoqon_sidebar_cache") ?? "{}").user ?? {}), avatarUrl: data.avatarUrl },
      } as Partial<SidebarMeta>);
    }
  }, []);

  return (
    <UserContext.Provider value={{ user, loading, uploadAvatar }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
