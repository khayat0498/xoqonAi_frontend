"use client";

import { useUser, UserProvider } from "@/lib/user-context";
import { ThemeProvider } from "@/lib/theme-context";
import { AdminWSProvider, useAdminWS } from "@/lib/admin-ws";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { LayoutDashboard, Users, FileText, ShieldCheck, Wifi, WifiOff, Package, Building2 } from "lucide-react";
import { getToken } from "@/lib/auth";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true, badgeKey: null },
  { href: "/admin/users", label: "Foydalanuvchilar", icon: Users, badgeKey: null },
  { href: "/admin/tenants", label: "Tashkilotlar", icon: Building2, badgeKey: "pendingTenants" as const },
  { href: "/admin/requests", label: "So'rovlar", icon: FileText, badgeKey: null },
  { href: "/admin/plans", label: "Tariflar", icon: Package, badgeKey: null },
];

function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useUser();
  const { connected, lastEvent } = useAdminWS();
  const router = useRouter();
  const pathname = usePathname();
  const [badges, setBadges] = useState<{ pendingTenants: number }>({ pendingTenants: 0 });

  useEffect(() => {
    if (!loading && user?.role !== "admin") {
      router.replace("/dashboard");
    }
  }, [user, loading, router]);

  // Pending tenant sonini fetch qilamiz
  const fetchBadges = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch(`${API}/api/admin/tenants?status=pending`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const d = await res.json();
      setBadges({ pendingTenants: d.tenants?.length ?? 0 });
    } catch {}
  }, []);

  useEffect(() => {
    if (user?.role !== "admin") return;
    fetchBadges();
    // 60 soniyada bir backup poll (WS uzilsa ham ishlasin)
    const interval = setInterval(fetchBadges, 60000);
    return () => clearInterval(interval);
  }, [user?.role, pathname, fetchBadges]);

  // Real-time: yangi pending tenant kelsa darhol yangilanadi
  useEffect(() => {
    if (lastEvent?.type === "tenant_pending_changed") {
      fetchBadges();
    }
  }, [lastEvent, fetchBadges]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: "var(--bg-primary)" }}>
        <div className="w-6 h-6 border-2 border-transparent rounded-full animate-spin" style={{ borderTopColor: "var(--accent)" }} />
      </div>
    );
  }

  if (user?.role !== "admin") return null;

  return (
    <div className="flex flex-col min-h-screen" style={{ background: "var(--bg-primary)" }}>
      {/* Top header */}
      <div
        className="px-5 py-3 flex items-center gap-3 shrink-0"
        style={{
          background: "linear-gradient(135deg, var(--accent-dark) 0%, var(--accent) 100%)",
          boxShadow: "0 2px 12px rgba(53,120,136,0.3)",
        }}
      >
        <div className="w-8 h-8 flex items-center justify-center rounded-lg" style={{ background: "rgba(255,255,255,0.2)" }}>
          <ShieldCheck size={16} color="#fff" />
        </div>
        <div>
          <p className="text-sm font-bold text-white leading-none" style={{ fontFamily: "var(--font-display)" }}>Admin Panel</p>
          <p className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.7)" }}>{user.name}</p>
        </div>

        {/* WS connection status */}
        <div
          className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
          style={{ background: "rgba(255,255,255,0.15)" }}
        >
          {connected
            ? <Wifi size={12} color="#4ade80" />
            : <WifiOff size={12} color="rgba(255,255,255,0.5)" />
          }
          <span className="text-[10px] font-semibold" style={{ color: connected ? "#4ade80" : "rgba(255,255,255,0.5)" }}>
            {connected ? "Live" : "Offline"}
          </span>
        </div>

        <Link
          href="/dashboard"
          className="text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-all hover:opacity-80"
          style={{ background: "rgba(255,255,255,0.15)", color: "#fff" }}
        >
          ← Asosiy
        </Link>
      </div>

      {/* Nav tabs */}
      <div
        className="flex gap-1 px-4 pt-3 pb-0 shrink-0 overflow-x-auto"
        style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-card)" }}
      >
        {NAV.map(({ href, label, icon: Icon, exact, badgeKey }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          const badgeCount = badgeKey ? badges[badgeKey] : 0;
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold whitespace-nowrap transition-all relative"
              style={{
                color: active ? "var(--accent)" : "var(--text-muted)",
                borderBottom: active ? "2px solid var(--accent)" : "2px solid transparent",
                marginBottom: -1,
              }}
            >
              <Icon size={14} />
              {label}
              {badgeCount > 0 && (
                <span
                  className="ml-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1.5 rounded-full text-[10px] font-bold tabular-nums"
                  style={{ background: "var(--warning)", color: "#fff" }}
                >
                  {badgeCount}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Page content */}
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <UserProvider>
        <AdminWSProvider>
          <AdminGuard>{children}</AdminGuard>
        </AdminWSProvider>
      </UserProvider>
    </ThemeProvider>
  );
}
