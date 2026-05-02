"use client";

import { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "@/lib/auth";
import { UserProvider } from "@/lib/user-context";
import { UserWSProvider } from "@/lib/user-ws";
import { ThemeProvider } from "@/lib/theme-context";
import Sidebar from "@/components/Sidebar";
import BottomNav from "@/components/BottomNav";
import CameraFAB from "@/components/CameraFAB";

export default function ClassLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    if (!getToken()) {
      router.replace("/auth/login");
    }
  }, [router]);

  return (
    <ThemeProvider>
      <UserProvider>
        <UserWSProvider>
          <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg-primary)" }}>
            <Suspense fallback={null}><Sidebar /></Suspense>
            <main className="flex-1 flex flex-col overflow-hidden">{children}</main>
            <Suspense fallback={null}><BottomNav /></Suspense>
            <Suspense fallback={null}><CameraFAB /></Suspense>
          </div>
        </UserWSProvider>
      </UserProvider>
    </ThemeProvider>
  );
}
