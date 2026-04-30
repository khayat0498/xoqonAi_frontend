"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { Moon, Sun, CalendarDays, BarChart3, Home, FolderOpen, Settings } from "lucide-react";
import { useUser } from "@/lib/user-context";
import { useT } from "@/lib/i18n-context";

const studentLinks = [
  { href: "/home", labelKey: "nav.home", icon: Home },
  { href: "/dashboard", labelKey: "nav.folders", icon: FolderOpen },
  { href: "/settings", labelKey: "nav.settings", icon: Settings },
];

const teacherLinks = [
  { href: "/home", labelKey: "nav.home", icon: Home },
  { href: "/schedule", labelKey: "nav.schedule", icon: CalendarDays },
  { href: "/dashboard/stats", labelKey: "nav.stats", icon: BarChart3 },
  { href: "/settings", labelKey: "nav.settings", icon: Settings },
];

export default function Navbar() {
  const pathname = usePathname();
  const [dark, setDark] = useState(false);
  const { user } = useUser();
  const { t } = useT();

  const links = user?.role === "student" ? studentLinks : teacherLinks;

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.setAttribute("data-theme", next ? "dark" : "");
  };

  return (
    <header className="glass-nav fixed top-0 inset-x-0 z-50 hidden md:block">
      <div className="max-w-7xl mx-auto px-8 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link href="/home" prefetch={false} className="flex items-center gap-2 shrink-0" style={{ fontFamily: "'Merienda', cursive" }}>
          <span
            className="flex items-center justify-center font-bold"
            style={{
              width: 36,
              height: 36,
              borderRadius: "9999px",
              background: "var(--accent)",
              color: "#fff",
              fontSize: "1rem",
            }}
          >
            SI
          </span>
          <span style={{ color: "var(--accent)", fontSize: "1.5rem", fontWeight: 600 }}>baho</span>
        </Link>

        {/* Nav links */}
        <nav className="flex items-center gap-1">
          {links.map(({ href, labelKey }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                prefetch={false}
                className={clsx(
                  "px-4 py-2 text-sm font-medium transition-all",
                  active ? "font-semibold" : "hover:opacity-70"
                )}
                style={{
                  background: active ? "var(--accent-light)" : "transparent",
                  color: active ? "var(--accent)" : "var(--text-secondary)",
                  borderRadius: "var(--radius-sm)",
                }}
              >
                {t(labelKey)}
              </Link>
            );
          })}
        </nav>

        {/* O'ng tomon */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleDark}
            className="w-9 h-9 border flex items-center justify-center transition-all hover:opacity-70"
            style={{ borderColor: "var(--border)", color: "var(--text-secondary)", borderRadius: "var(--radius-sm)" }}
            title={dark ? t("nav.lightMode") : t("nav.darkMode")}
          >
            {dark ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          <div
            className="w-9 h-9 flex items-center justify-center text-white text-sm font-bold"
            style={{ background: "var(--accent)", borderRadius: "var(--radius-sm)" }}
            title={user?.name ?? ""}
          >
            {user?.name?.charAt(0) ?? ""}
          </div>
        </div>

      </div>
    </header>
  );
}
