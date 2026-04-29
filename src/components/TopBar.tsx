"use client";

import { Bell, Search } from "lucide-react";
import { useUser } from "@/lib/user-context";
import { useT } from "@/lib/i18n-context";

interface TopBarProps {
  title: string;
  subtitle?: string;
}

export default function TopBar({ title, subtitle }: TopBarProps) {
  const { user } = useUser();
  const { t } = useT();
  return (
    <header
      className="flex items-center justify-between px-6 py-4 border-b"
      style={{
        background: "var(--bg-card)",
        borderColor: "var(--border)",
      }}
    >
      <div>
        <h1 className="text-lg font-semibold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
            {subtitle}
          </p>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Search */}
        <div
          className="flex items-center gap-2 px-3 py-2 text-sm"
          style={{
            background: "var(--bg-primary)",
            color: "var(--text-muted)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-sm)",
          }}
        >
          <Search size={15} />
          <span className="hidden sm:block">{t("dashboard.searchPlaceholder")}</span>
        </div>

        {/* Notification */}
        <button
          className="relative w-9 h-9 flex items-center justify-center transition-all hover:opacity-70"
          style={{
            background: "var(--bg-primary)",
            border: "1px solid var(--border)",
            color: "var(--text-secondary)",
            borderRadius: "var(--radius-sm)",
          }}
        >
          <Bell size={17} />
          <span
            className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full"
            style={{ background: "var(--cta)" }}
          />
        </button>

        {/* Avatar */}
        <div
          className="w-9 h-9 flex items-center justify-center text-white text-sm font-semibold cursor-pointer"
          style={{ background: "var(--accent)", borderRadius: "var(--radius-sm)" }}
        >
          {user?.name?.charAt(0) ?? ""}
        </div>
      </div>
    </header>
  );
}
