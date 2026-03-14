"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  FolderOpen,
  AlertCircle,
  Settings,
  BarChart3,
  CalendarDays,
  Camera,
} from "lucide-react";
import { currentUser } from "@/lib/mock-data";

type NavLink = { href: string; icon: React.ElementType } | null;

const studentLinks: NavLink[] = [
  { href: "/home", icon: Home },
  { href: "/dashboard", icon: FolderOpen },
  null, // kamera tugmasi
  { href: "/dashboard/errors", icon: AlertCircle },
  { href: "/settings", icon: Settings },
];

const teacherLinks: NavLink[] = [
  { href: "/home", icon: Home },
  { href: "/schedule", icon: CalendarDays },
  null, // kamera tugmasi
  { href: "/dashboard/stats", icon: BarChart3 },
  { href: "/settings", icon: Settings },
];

export default function BottomNav() {
  const pathname = usePathname();
  const links = currentUser.role === "student" ? studentLinks : teacherLinks;

  return (
    <nav className="md:hidden fixed bottom-6 inset-x-4 z-50">
      <div
        className="flex justify-around items-center px-2 py-3 rounded-3xl shadow-2xl border"
        style={{
          background: "var(--bg-card)",
          borderColor: "var(--border)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
      >
        {links.map((link, i) => {
          if (!link) {
            return (
              <button
                key="camera"
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-white -mt-8"
                style={{
                  background: "var(--accent)",
                  border: "4px solid var(--bg-primary)",
                  boxShadow: "0 8px 24px rgba(19,191,168,0.4)",
                }}
              >
                <Camera size={22} />
              </button>
            );
          }

          const { href, icon: Icon } = link;
          const active = pathname === href;

          return (
            <Link
              key={href}
              href={href}
              className="w-11 h-11 flex items-center justify-center rounded-xl transition-all"
              style={{
                background: active ? "var(--accent-light)" : "transparent",
                color: active ? "var(--accent)" : "var(--text-muted)",
              }}
            >
              <Icon size={21} />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
