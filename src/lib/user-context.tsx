"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { getToken, removeToken } from "@/lib/auth";
import { useRouter } from "next/navigation";

type User = {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  role: "teacher" | "student";
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

export function UserProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

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
          router.replace("/auth/login");
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data) setUser(data);
      })
      .finally(() => setLoading(false));
  }, [router]);

  const uploadAvatar = useCallback(async (file: File) => {
    const token = getToken();
    if (!token) return;

    const form = new FormData();
    form.append("file", file);

    const res = await fetch(`${API}/api/upload/avatar`, {
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
