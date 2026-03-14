"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { Moon, Sun, CalendarDays, BarChart3, Home, FolderOpen, Settings } from "lucide-react";
import { currentUser } from "@/lib/mock-data";

const studentLinks = [
  { href: "/home", label: "Bosh sahifa", icon: Home },
  { href: "/dashboard", label: "Papkalarim", icon: FolderOpen },
  { href: "/settings", label: "Sozlamalar", icon: Settings },
];

const teacherLinks = [
  { href: "/home", label: "Bosh sahifa", icon: Home },
  { href: "/schedule", label: "Jadval", icon: CalendarDays },
  { href: "/dashboard/stats", label: "Statistika", icon: BarChart3 },
  { href: "/settings", label: "Sozlamalar", icon: Settings },
];

export default function Navbar() {
  const pathname = usePathname();
  const [dark, setDark] = useState(false);

  const links = currentUser.role === "student" ? studentLinks : teacherLinks;

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.setAttribute("data-theme", next ? "dark" : "");
  };

  return (
    <header className="glass-nav fixed top-0 inset-x-0 z-50 hidden md:block">
      <div className="max-w-7xl mx-auto px-8 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link href="/home" className="flex items-center gap-3 shrink-0">
          <Image src="/logo.png" alt="Xoqon AI" width={32} height={32} className="rounded-lg" />
          <span className="font-bold text-lg tracking-tight" style={{ color: "var(--text-primary)" }}>
            Xoqon <span style={{ color: "var(--accent)" }}>AI</span>
          </span>
        </Link>

        {/* Nav links */}
        <nav className="flex items-center gap-1">
          {links.map(({ href, label }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={clsx(
                  "px-4 py-2 rounded-xl text-sm font-medium transition-all",
                  active ? "font-semibold" : "hover:opacity-70"
                )}
                style={{
                  background: active ? "var(--accent-light)" : "transparent",
                  color: active ? "var(--accent)" : "var(--text-secondary)",
                }}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        {/* O'ng tomon */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleDark}
            className="w-9 h-9 rounded-xl border flex items-center justify-center transition-all hover:opacity-70"
            style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
            title={dark ? "Yorug' rejim" : "Qorong'u rejim"}
          >
            {dark ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold"
            style={{ background: "var(--accent)" }}
            title={currentUser.name}
          >
            {currentUser.name.charAt(0)}
          </div>
        </div>

      </div>
    </header>
  );
}
