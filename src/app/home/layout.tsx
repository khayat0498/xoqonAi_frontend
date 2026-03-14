"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "@/lib/auth";
import { UserProvider } from "@/lib/user-context";
import Sidebar from "@/components/Sidebar";
import BottomNav from "@/components/BottomNav";

export default function HomeLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    if (!getToken()) {
      router.replace("/auth/login");
    }
  }, [router]);

  return (
    <UserProvider>
      <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg-primary)" }}>
        <Sidebar />
        <main className="flex-1 flex flex-col overflow-hidden">
          {children}
        </main>
        <BottomNav />
      </div>
    </UserProvider>
  );
}
