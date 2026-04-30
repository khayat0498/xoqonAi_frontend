"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import clsx from "clsx";
import {
  Home, FolderOpen, Bookmark, History, Settings,
  ChevronLeft, ChevronRight, BarChart3, AlertCircle,
  CalendarDays, Moon, Sun, Pencil, User, LogOut,
  CreditCard, HelpCircle, MessageSquare, Layers,
} from "lucide-react";
import { useUser } from "@/lib/user-context";
import { useTheme } from "@/lib/theme-context";
import { useUserWS } from "@/lib/user-ws";
import { useT } from "@/lib/i18n-context";
import { getToken } from "@/lib/auth";

const studentLinks = [
  { href: "/home",               labelKey: "nav.home",       icon: Home },
  { href: "/home?tab=jildlar",   labelKey: "nav.folders",    icon: FolderOpen },
  { href: "/dashboard/errors",   labelKey: "nav.errorBank",  icon: AlertCircle },
  { href: "/dashboard/bookmarks",labelKey: "nav.bookmarks",  icon: Bookmark },
  { href: "/dashboard/history",  labelKey: "nav.history",    icon: History },
];

const teacherLinks = [
  { href: "/home",             labelKey: "nav.home",     icon: Home },
  { href: "/home?tab=jildlar", labelKey: "nav.folders",  icon: FolderOpen },
  { href: "/schedule",         labelKey: "nav.schedule", icon: CalendarDays },
  { href: "/dashboard/stats",  labelKey: "nav.stats",    icon: BarChart3 },
];

const API = process.env.NEXT_PUBLIC_API_URL;

export default function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab");
  const [collapsed, setCollapsed] = useState(false);
  const { dark, toggleDark } = useTheme();
  const { t } = useT();
  const fileRef = useRef<HTMLInputElement>(null);
  const { user, loading, uploadAvatar } = useUser();
  const { lastEvent } = useUserWS();
  const [used, setUsed] = useState<number | null>(null);
  const [limit, setLimit] = useState<number>(60);
  const [planKey, setPlanKey] = useState("free");
  const [balanceUzs, setBalanceUzs] = useState<number | null>(null);


  useEffect(() => {
    const token = getToken();
    if (!token) return;
    const h = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
    fetch(`${API}/api/billing/my-plan`, { headers: h })
      .then((r) => r.json())
      .then((d) => setPlanKey(d.planKey ?? "free"))
      .catch(() => {});
    fetch(`${API}/api/submissions/usage/me`, { headers: h })
      .then((r) => r.json())
      .then((d) => { setUsed(d.used ?? 0); setLimit(d.limit ?? 60); })
      .catch(() => {});
    fetch(`${API}/api/balance/me`, { headers: h })
      .then((r) => r.json())
      .then((d) => setBalanceUzs(d.balanceUzs ?? null))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!lastEvent) return;
    if (lastEvent.type === "usage_updated") {
      setUsed(lastEvent.data.used);
      setLimit(lastEvent.data.limit);
    }
    if (lastEvent.type === "plan_updated") {
      setPlanKey(lastEvent.data.planKey);
    }
    if (lastEvent.type === "balance_updated") {
      setBalanceUzs(lastEvent.data.balanceUzs);
    }
  }, [lastEvent]);

  const links = user?.role === "student" ? studentLinks : teacherLinks;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadAvatar(file);
    e.target.value = "";
  };

  return (
    <aside
      className={clsx(
        "hidden md:flex flex-col h-screen sticky top-0 transition-all duration-300",
        collapsed ? "w-[68px]" : "w-[260px]"
      )}
      style={{
        background: "var(--bg-sidebar)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderRight: "1px solid var(--border)",
        boxShadow: "var(--shadow-clay-sm)",
      }}
    >
      {/* Logo */}
      <div
        className="flex items-center justify-center"
        style={{
          padding: collapsed ? "28px 12px 24px" : "32px 20px 28px",
          borderBottom: "1px solid var(--sidebar-border)",
        }}
      >
        <div className="flex items-center gap-3" style={{ fontFamily: "'Merienda', cursive" }}>
          <span
            className="flex items-center justify-center font-bold"
            style={{
              width: collapsed ? 48 : 56,
              height: collapsed ? 48 : 56,
              borderRadius: "9999px",
              background: "var(--accent)",
              color: "#fff",
              fontSize: collapsed ? "1.15rem" : "1.35rem",
              flexShrink: 0,
            }}
          >
            SI
          </span>
          {!collapsed && (
            <span style={{ color: "var(--accent)", fontSize: "2rem", fontWeight: 600, lineHeight: 1 }}>baho</span>
          )}
        </div>
      </div>

      {/* Section Label */}
      {!collapsed && (
        <div
          className="text-[0.62rem] uppercase tracking-[0.1em] font-bold"
          style={{ color: "var(--text-muted)", padding: "18px 24px 6px" }}
        >
          {t("nav.main")}
        </div>
      )}

      {/* Nav links */}
      <nav className="flex-1 px-[10px] py-2 flex flex-col gap-1">
        {links.map(({ href, labelKey, icon: Icon }) => {
          const hasQuery = href.includes("?");
          let active: boolean;
          if (hasQuery) {
            active = pathname === "/home" && currentTab === "jildlar";
          } else if (href === "/home") {
            active = pathname === "/home" && currentTab !== "jildlar";
          } else {
            active = pathname === href;
          }
          return (
            <Link
              key={href}
              href={href}
              prefetch={false}
              className={clsx(
                "flex items-center gap-[11px] py-[10px] transition-all duration-200 relative",
                collapsed ? "px-[14px] justify-center" : "px-[14px]",
                active ? "rounded-[var(--radius-sm)]" : "rounded-[var(--radius-sm)] hover:bg-[var(--sidebar-hover)]"
              )}
              style={{
                background: active ? "var(--sidebar-active-bg)" : "transparent",
                color: active ? "var(--sidebar-text-active)" : "var(--sidebar-text)",
                boxShadow: active ? "var(--shadow-clay-sm)" : "none",
              }}
            >
              {active && (
                <span
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[18px] rounded-r-[3px]"
                  style={{ background: "var(--cta)" }}
                />
              )}
              <Icon size={19} className="shrink-0" style={{ opacity: active ? 1 : 0.6 }} />
              {!collapsed && (
                <span className="text-[0.87rem] font-medium">{t(labelKey)}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Extra links */}
      {!collapsed && (
        <div
          className="text-[0.62rem] uppercase tracking-[0.1em] font-bold"
          style={{ color: "var(--text-muted)", padding: "12px 24px 6px" }}
        >
          {t("nav.other")}
        </div>
      )}
      <nav className="px-[10px] flex flex-col gap-1">
        {[
          { href: "/history", labelKey: "nav.usage", icon: History },
          { href: "/billing", labelKey: "nav.billing", icon: CreditCard },
          { href: "/plans", labelKey: "nav.plans", icon: Layers },
          { href: "/contact", labelKey: "nav.contact", icon: MessageSquare },
          { href: "/faq", labelKey: "nav.faq", icon: HelpCircle },
        ].map(({ href, labelKey, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            prefetch={false}
            className={clsx(
              "flex items-center gap-[11px] py-[10px] rounded-[var(--radius-sm)] transition-all hover:bg-[var(--sidebar-hover)]",
              collapsed ? "px-[14px] justify-center" : "px-[14px]"
            )}
            style={{
              background: pathname === href ? "var(--sidebar-active-bg)" : "transparent",
              color: pathname === href ? "var(--sidebar-text-active)" : "var(--sidebar-text)",
              boxShadow: pathname === href ? "var(--shadow-clay-sm)" : "none",
            }}
          >
            <Icon size={19} className="shrink-0" style={{ opacity: pathname === href ? 1 : 0.6 }} />
            {!collapsed && <span className="text-[0.87rem] font-medium">{t(labelKey)}</span>}
          </Link>
        ))}
      </nav>

      {/* Bottom */}
      <div
        className="px-[10px] pb-3 flex flex-col gap-1 pt-3"
        style={{ borderTop: "1px solid var(--sidebar-border)" }}
      >
        {/* Dark mode toggle */}
        <button
          onClick={toggleDark}
          className={clsx(
            "flex items-center gap-[11px] py-[10px] rounded-[var(--radius-sm)] transition-all w-full hover:bg-[var(--sidebar-hover)]",
            collapsed ? "px-[14px] justify-center" : "px-[14px]"
          )}
          style={{ color: "var(--sidebar-text)", background: "none", border: "none" }}
        >
          {dark ? <Sun size={19} style={{ opacity: 0.6 }} /> : <Moon size={19} style={{ opacity: 0.6 }} />}
          {!collapsed && (
            <span className="text-[0.87rem] font-medium">
              {dark ? t("nav.lightMode") : t("nav.darkMode")}
            </span>
          )}
        </button>

        {/* Settings */}
        <Link
          href="/settings"
          prefetch={false}
          className={clsx(
            "flex items-center gap-[11px] py-[10px] rounded-[var(--radius-sm)] transition-all hover:bg-[var(--sidebar-hover)]",
            collapsed ? "px-[14px] justify-center" : "px-[14px]"
          )}
          style={{ color: "var(--sidebar-text)" }}
        >
          <Settings size={19} style={{ opacity: 0.6 }} />
          {!collapsed && <span className="text-[0.87rem] font-medium">{t("nav.settings")}</span>}
        </Link>

        {/* User */}
        <div
          className={clsx(
            "flex items-center gap-[10px] py-[10px] mt-1",
            collapsed ? "px-[12px] justify-center" : "px-[12px]"
          )}
        >
          <div className="relative shrink-0 group">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <div
              className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center text-white text-[0.8rem] font-bold"
              style={{
                background: "linear-gradient(135deg, var(--accent), var(--cta))",
                boxShadow: "var(--shadow-clay-sm)",
              }}
            >
              {!loading && user?.avatarUrl
                ? <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                : <User size={15} color="white" />
              }
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ background: "var(--bg-card-solid)", color: "var(--accent)", boxShadow: "var(--shadow-clay-sm)" }}
            >
              <Pencil size={8} />
            </button>
          </div>

          {!collapsed && (
            <div className="flex-1 overflow-hidden">
              {loading ? (
                <div className="h-3 w-20 rounded" style={{ background: "var(--sidebar-border)" }} />
              ) : (
                <>
                  <p className="text-[0.82rem] font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                    {user?.name ?? ""}
                  </p>
                  <p className="text-[0.68rem] font-bold uppercase tracking-wide" style={{
                    color: planKey === "premium" ? "var(--warning)" : planKey === "pro" ? "var(--accent)" : planKey === "pay_per_use" ? "var(--success)" : "var(--text-muted)"
                  }}>
                    {planKey === "premium" ? "Premium" : planKey === "pro" ? "Pro" : planKey === "pay_per_use" ? "Pay per use" : "Free"}
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Balance bar (Pay-per-use) */}
      {!collapsed && planKey === 'pay_per_use' && balanceUzs !== null && (
        <Link
          href="/billing"
          prefetch={false}
          className="mx-3 mb-3 p-3 rounded-xl block transition-all hover:opacity-80"
          style={{ background: "var(--bg-primary)", border: "1px solid var(--border)" }}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[0.67rem] font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
              {t("nav.balance")}
            </span>
            <span className="text-[0.75rem] font-bold tabular-nums" style={{ color: "var(--accent)" }}>
              {new Intl.NumberFormat('uz-UZ').format(balanceUzs)} UZS
            </span>
          </div>
          <div className="text-[0.7rem] text-right" style={{ color: "var(--text-muted)" }}>
            {t("nav.topUp")} →
          </div>
        </Link>
      )}

      {/* Usage bar */}
      {!collapsed && planKey !== 'pay_per_use' && used !== null && limit < 99999 && (
        <Link
          href="/billing"
          prefetch={false}
          className="mx-3 mb-3 p-3 rounded-xl block transition-all hover:opacity-80"
          style={{ background: "var(--bg-primary)", border: "1px solid var(--border)" }}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[0.67rem] font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
              {t("nav.monthlyLimit")}
            </span>
            <span className="text-[0.75rem] font-bold tabular-nums" style={{
              color: used / limit >= 0.9 ? "var(--error)" : used / limit >= 0.7 ? "var(--warning)" : "var(--text-primary)"
            }}>
              {used} / {limit}
            </span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
            <div
              className="h-1.5 rounded-full transition-all duration-500"
              style={{
                width: `${Math.min((used / limit) * 100, 100)}%`,
                background: used / limit >= 0.9 ? "var(--error)" : used / limit >= 0.7 ? "var(--warning)" : "var(--accent)",
              }}
            />
          </div>
        </Link>
      )}

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full flex items-center justify-center transition-all hover:scale-110"
        style={{
          background: "var(--bg-card-solid)",
          border: "1px solid var(--border)",
          color: "var(--text-muted)",
          boxShadow: "var(--shadow-clay-sm)",
        }}
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </aside>
  );
}
