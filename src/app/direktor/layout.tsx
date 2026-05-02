"use client";

import { useUser, UserProvider } from "@/lib/user-context";
import { ThemeProvider } from "@/lib/theme-context";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { Building2, Users as UsersIcon, Wallet, Clock, ArrowLeft } from "lucide-react";

const NAV = [
  { href: "/direktor", label: "Dashboard", icon: Building2, exact: true },
  { href: "/direktor/xodimlar", label: "Xodimlar", icon: UsersIcon },
  { href: "/direktor/balance", label: "Balans tarixi", icon: Wallet },
];

function DirektorGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && user && user.role !== "direktor") {
      router.replace("/home");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: "var(--bg-primary)" }}>
        <div className="w-6 h-6 border-2 border-transparent rounded-full animate-spin" style={{ borderTopColor: "var(--accent)" }} />
      </div>
    );
  }

  if (!user || user.role !== "direktor") return null;

  // Pending tenant uchun maxsus sahifa
  if (user.tenant?.status === "pending") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--bg-primary)" }}>
        <div className="max-w-md w-full p-8 rounded-3xl text-center" style={{ background: "var(--bg-card-solid)", border: "1px solid var(--border)", boxShadow: "var(--shadow-clay)" }}>
          <div className="w-16 h-16 rounded-full mx-auto mb-5 flex items-center justify-center" style={{ background: "var(--warning-bg)", color: "var(--warning)" }}>
            <Clock size={28} />
          </div>
          <h1 className="text-xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>Tasdiqlash kutilmoqda</h1>
          <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
            <strong>{user.tenant.name}</strong> tashkiloti admin tarafidan tekshirilmoqda.
            Tasdiqlangach panelga avtomatik kira olasiz.
          </p>
          <Link href="/auth/login" className="inline-block py-2.5 px-6 text-sm font-semibold rounded-xl" style={{ background: "var(--bg-primary)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}>
            Login sahifasiga
          </Link>
        </div>
      </div>
    );
  }

  if (user.tenant?.status === "rejected" || user.tenant?.status === "suspended") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--bg-primary)" }}>
        <div className="max-w-md w-full p-8 rounded-3xl text-center" style={{ background: "var(--bg-card-solid)", border: "1px solid var(--border)", boxShadow: "var(--shadow-clay)" }}>
          <h1 className="text-xl font-bold mb-2" style={{ color: "var(--error)" }}>
            Tashkilot {user.tenant.status === "rejected" ? "rad etilgan" : "to'xtatilgan"}
          </h1>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Iltimos, admin bilan bog'laning.
          </p>
        </div>
      </div>
    );
  }

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
          <Building2 size={16} color="#fff" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-white leading-none truncate" style={{ fontFamily: "var(--font-display)" }}>
            {user.tenant?.name ?? "Tashkilot"}
          </p>
          <p className="text-[10px] mt-0.5 truncate" style={{ color: "rgba(255,255,255,0.7)" }}>
            Direktor · {user.name}
          </p>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <div className="flex flex-col items-end">
            <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.7)" }}>Balans</span>
            <span className="text-sm font-bold tabular-nums text-white">
              {new Intl.NumberFormat("uz-UZ").format(user.tenant?.balanceUzs ?? 0)} UZS
            </span>
          </div>
        </div>
      </div>

      {/* Nav tabs */}
      <div
        className="flex gap-1 px-4 pt-3 pb-0 shrink-0 overflow-x-auto"
        style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-card)" }}
      >
        {NAV.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
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
            </Link>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}

export default function DirektorLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <UserProvider>
        <DirektorGuard>{children}</DirektorGuard>
      </UserProvider>
    </ThemeProvider>
  );
}
