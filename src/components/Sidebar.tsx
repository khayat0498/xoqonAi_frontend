"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import {
  Home, FolderOpen, Bookmark, History, Settings,
  ChevronLeft, ChevronRight, BarChart3, AlertCircle,
  CalendarDays, Moon, Sun, Pencil, User,
} from "lucide-react";
import { useUser } from "@/lib/user-context";

const studentLinks = [
  { href: "/home",               label: "Bosh sahifa", icon: Home },
  { href: "/dashboard",          label: "Papkalarim",  icon: FolderOpen },
  { href: "/dashboard/errors",   label: "Xato banki",  icon: AlertCircle },
  { href: "/dashboard/bookmarks",label: "Bookmarks",   icon: Bookmark },
  { href: "/dashboard/history",  label: "Tarix",       icon: History },
];

const teacherLinks = [
  { href: "/home",           label: "Bosh sahifa", icon: Home },
  { href: "/schedule",       label: "Jadval",      icon: CalendarDays },
  { href: "/dashboard/stats",label: "Statistika",  icon: BarChart3 },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [dark, setDark] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { user, loading, uploadAvatar } = useUser();

  const links = user?.role === "student" ? studentLinks : teacherLinks;

  const toggleDark = () => {
    setDark(!dark);
    document.documentElement.setAttribute("data-theme", !dark ? "dark" : "");
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadAvatar(file);
    e.target.value = "";
  };

  const initials = user?.name?.charAt(0)?.toUpperCase() ?? "?";

  return (
    <aside
      className={clsx(
        "hidden md:flex flex-col h-screen sticky top-0 transition-all duration-300 border-r",
        collapsed ? "w-16" : "w-60"
      )}
      style={{ background: "var(--bg-sidebar)", borderColor: "var(--border)" }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b" style={{ borderColor: "var(--border)" }}>
        <Image src="/logo.png" alt="Xoqon AI" width={32} height={32} className="rounded-lg shrink-0" />
        {!collapsed && (
          <span className="font-bold text-lg tracking-tight" style={{ color: "var(--text-primary)" }}>
            Xoqon AI
          </span>
        )}
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-2 py-4 flex flex-col gap-1">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150",
                active ? "font-medium" : "hover:opacity-80"
              )}
              style={{
                background: active ? "var(--accent-light)" : "transparent",
                color: active ? "var(--accent)" : "var(--text-secondary)",
              }}
            >
              <Icon size={18} className="shrink-0" />
              {!collapsed && <span className="text-sm font-semibold">{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-2 pb-4 flex flex-col gap-1 border-t pt-3" style={{ borderColor: "var(--border)" }}>
        <button
          onClick={toggleDark}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all hover:opacity-70 w-full"
          style={{ color: "var(--text-secondary)" }}
        >
          {dark ? <Sun size={18} /> : <Moon size={18} />}
          {!collapsed && <span className="text-sm font-medium">{dark ? "Yorug' rejim" : "Qorong'u rejim"}</span>}
        </button>

        <Link
          href="/settings"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all hover:opacity-70"
          style={{ color: "var(--text-secondary)" }}
        >
          <Settings size={18} />
          {!collapsed && <span className="text-sm font-medium">Sozlamalar</span>}
        </Link>

        {/* User */}
        <div className="flex items-center gap-3 px-3 py-2.5 mt-1">
          {/* Avatar + pencil */}
          <div className="relative shrink-0 group">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center text-white text-xs font-semibold"
              style={{ background: "var(--accent)" }}
            >
              {!loading && user?.avatarUrl
                ? <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                : <User size={14} color="white" />
              }
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ background: "var(--text-primary)", color: "var(--bg-card)" }}
            >
              <Pencil size={8} />
            </button>
          </div>

          {!collapsed && (
            <div className="flex-1 overflow-hidden">
              {loading ? (
                <div className="h-3 w-20 rounded" style={{ background: "var(--border)" }} />
              ) : (
                <>
                  <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                    {user?.name ?? ""}
                  </p>
                  <p className="text-xs font-medium truncate" style={{ color: "var(--text-muted)" }}>
                    {user?.role === "student" ? "Student" : "O'qituvchi"}
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full border flex items-center justify-center transition-all hover:scale-110"
        style={{
          background: "var(--bg-card)",
          borderColor: "var(--border)",
          color: "var(--text-muted)",
        }}
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </aside>
  );
}
