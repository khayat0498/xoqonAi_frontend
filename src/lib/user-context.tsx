"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { getToken, removeToken } from "@/lib/auth";
import { useRouter } from "next/navigation";

export type UserRole = "teacher" | "student" | "admin" | "direktor" | "xodim";

export type Tenant = {
  id: string;
  name: string;
  status: "pending" | "active" | "rejected" | "suspended";
  inviteCode: string;
  balanceUzs: number;
};

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
const USER_CACHE_KEY = "xoqon_user_cache";

function readCachedUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(USER_CACHE_KEY);
    return raw ? JSON.parse(raw) as User : null;
  } catch {
    return null;
  }
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  // Boshlang'ich qiymatni keshdan o'qiymiz — sahifa darhol ochiladi.
  const [user, setUser] = useState<User | null>(() => readCachedUser());
  const [loading, setLoading] = useState(() => readCachedUser() === null);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/auth/login");
      return;
    }

    fetch(`${API}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (res.status === 401) {
          removeToken();
          localStorage.removeItem(USER_CACHE_KEY);
          router.replace("/auth/login");
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data) {
          setUser(data);
          try { localStorage.setItem(USER_CACHE_KEY, JSON.stringify(data)); } catch {}
        }
      })
      .finally(() => setLoading(false));
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
