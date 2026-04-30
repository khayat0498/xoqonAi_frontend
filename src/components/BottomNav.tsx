"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  Home,
  FolderOpen,
  Settings,
  CalendarDays,
} from "lucide-react";
import { useUser } from "@/lib/user-context";
import { useT } from "@/lib/i18n-context";

type NavItem = { href: string; icon: React.ElementType; labelKey: string };

const studentLinks: NavItem[] = [
  { href: "/home?tab=jildlar", labelKey: "nav.folders", icon: FolderOpen },
  { href: "/home",             labelKey: "nav.home",    icon: Home },
  { href: "/settings",         labelKey: "nav.settings",icon: Settings },
];

const teacherLinks: NavItem[] = [
  { href: "/home?tab=jildlar", labelKey: "nav.folders",  icon: FolderOpen },
  { href: "/home",             labelKey: "nav.home",     icon: Home },
  { href: "/schedule",         labelKey: "nav.schedule", icon: CalendarDays },
  { href: "/settings",         labelKey: "nav.settings", icon: Settings },
];

export default function BottomNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useUser();
  const { t } = useT();
  const links = user?.role === "student" ? studentLinks : teacherLinks;
  const currentTab = searchParams.get("tab");

  return (
    <nav className="md:hidden fixed bottom-2 inset-x-4 z-50">
      <div
        className="flex justify-around items-center px-2 py-2"
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-xl)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          boxShadow: "var(--shadow-clay)",
        }}
      >
        {links.map(({ href, labelKey, icon: Icon }) => {
          const hasQuery = href.includes("?");
          let isActive: boolean;

          if (hasQuery) {
            // Jildlar: active only when ?tab=jildlar is present
            isActive = pathname === "/home" && currentTab === "jildlar";
          } else if (href === "/home") {
            // Home: active when on /home WITHOUT ?tab=jildlar
            isActive = pathname === "/home" && currentTab !== "jildlar";
          } else {
            isActive = pathname === href;
          }

          return (
            <Link
              key={href}
              href={href}
              prefetch={false}
              className="flex flex-col items-center gap-0.5 py-1 px-3 transition-all"
              style={{
                color: isActive ? "var(--accent)" : "var(--text-muted)",
              }}
            >
              <div
                className="w-10 h-10 flex items-center justify-center transition-all"
                style={{
                  background: isActive ? "var(--accent-light)" : "transparent",
                  borderRadius: "var(--radius-sm)",
                  boxShadow: isActive ? "var(--shadow-clay-sm)" : "none",
                }}
              >
                <Icon size={20} />
              </div>
              <span className="text-[10px] font-semibold">{t(labelKey)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
