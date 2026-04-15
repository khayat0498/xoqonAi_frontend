"use client";

import { Suspense } from "react";
import { UserProvider } from "@/lib/user-context";
import { UserWSProvider } from "@/lib/user-ws";
import { ThemeProvider } from "@/lib/theme-context";
import Sidebar from "@/components/Sidebar";
import BottomNav from "@/components/BottomNav";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <UserProvider>
        <UserWSProvider>
          <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg-primary)" }}>
            <Suspense fallback={null}><Sidebar /></Suspense>
            <main className="flex-1 flex flex-col overflow-hidden">{children}</main>
            <Suspense fallback={null}><BottomNav /></Suspense>
          </div>
        </UserWSProvider>
      </UserProvider>
    </ThemeProvider>
  );
}
