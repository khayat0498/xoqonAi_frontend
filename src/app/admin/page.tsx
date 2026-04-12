"use client";

import { useEffect, useState, useCallback } from "react";
import { Users, FileImage, Clock, CheckCircle2, Ban, Crown, TrendingUp, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { getToken } from "@/lib/auth";
import { useAdminWS } from "@/lib/admin-ws";

const API = process.env.NEXT_PUBLIC_API_URL;
const h = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` });

type Stats = {
  users: { total: number; blocked: number; admins: number; thisMonth: number };
  submissions: { total: number; done: number; thisMonth: number };
  requests: { pending: number; approved: number; total: number };
  totalChecks: number;
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const { lastEvent } = useAdminWS();

  const loadStats = useCallback(() => {
    fetch(`${API}/api/billing/admin/stats`, { headers: h() })
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);

  // Real-time: stats_refresh yoki new_request kelganda qayta yukla
  useEffect(() => {
    if (lastEvent?.type === "stats_refresh" || lastEvent?.type === "new_request") {
      loadStats();
    }
  }, [lastEvent, loadStats]);

  const cards = [
    {
      label: "Jami foydalanuvchilar",
      value: stats?.users?.total ?? 0,
      sub: `+${stats?.users?.thisMonth ?? 0} bu oy`,
      icon: Users,
      color: "var(--accent)",
      bg: "var(--accent-light)",
    },
    {
      label: "Bloklangan",
      value: stats?.users?.blocked ?? 0,
      sub: "Faol emas",
      icon: Ban,
      color: "var(--error)",
      bg: "#FEF2F2",
    },
    {
      label: "Jami tekshirishlar",
      value: stats?.submissions?.total ?? 0,
      sub: `${stats?.submissions?.done ?? 0} ta bajarildi`,
      icon: FileImage,
      color: "#6366F1",
      bg: "#EEF2FF",
    },
    {
      label: "Bu oy tekshirishlar",
      value: stats?.submissions?.thisMonth ?? 0,
      sub: "Joriy oy",
      icon: TrendingUp,
      color: "var(--success)",
      bg: "var(--success-bg)",
    },
    {
      label: "Kutilayotgan so'rovlar",
      value: stats?.requests?.pending ?? 0,
      sub: "Tasdiqlanmagan",
      icon: Clock,
      color: "var(--warning)",
      bg: "var(--warning-bg)",
    },
    {
      label: "Tasdiqlangan rejalar",
      value: stats?.requests?.approved ?? 0,
      sub: "Jami aktivatsiya",
      icon: Crown,
      color: "var(--warning)",
      bg: "var(--warning-bg)",
    },
    {
      label: "Umumiy foydalanish",
      value: stats?.totalChecks ?? 0,
      sub: "Barcha oylar",
      icon: CheckCircle2,
      color: "var(--success)",
      bg: "var(--success-bg)",
    },
    {
      label: "Adminlar soni",
      value: stats?.users?.admins ?? 0,
      sub: "Super role",
      icon: ShieldCheck,
      color: "#8B5CF6",
      bg: "#F5F3FF",
    },
  ];

  return (
    <div className="px-4 py-5 max-w-3xl mx-auto flex flex-col gap-5">
      <div>
        <h2 className="text-base font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)" }}>Umumiy ko&apos;rsatkichlar</h2>
        <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Platforma statistikasi</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {cards.map(({ label, value, sub, icon: Icon, color, bg }) => (
          <div
            key={label}
            className="p-4 flex flex-col gap-3"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-light)",
              borderRadius: "var(--radius-md)",
              boxShadow: "var(--shadow-card)",
            }}
          >
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 flex items-center justify-center" style={{ background: bg, borderRadius: "var(--radius-sm)" }}>
                <Icon size={16} style={{ color }} />
              </div>
              {loading ? (
                <div className="w-10 h-6 rounded animate-pulse" style={{ background: "var(--border)" }} />
              ) : (
                <span className="text-2xl font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)" }}>
                  {value.toLocaleString()}
                </span>
              )}
            </div>
            <div>
              <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>{label}</p>
              <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>{sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div className="flex flex-col gap-2">
        <h3 className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Tezkor harakatlar</h3>
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/admin/requests"
            className="p-4 flex items-center gap-3 transition-all hover:scale-[1.02]"
            style={{
              background: stats?.requests?.pending ? "var(--warning-bg)" : "var(--bg-card)",
              border: stats?.requests?.pending ? "1px solid var(--warning)" : "1px solid var(--border)",
              borderRadius: "var(--radius-md)",
            }}
          >
            <Clock size={18} style={{ color: "var(--warning)" }} />
            <div>
              <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>So&apos;rovlar</p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                {stats?.requests?.pending ?? 0} ta kutilmoqda
              </p>
            </div>
          </Link>
          <Link
            href="/admin/users"
            className="p-4 flex items-center gap-3 transition-all hover:scale-[1.02]"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-md)",
            }}
          >
            <Users size={18} style={{ color: "var(--accent)" }} />
            <div>
              <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Foydalanuvchilar</p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                {stats?.users?.total ?? 0} ta ro&apos;yxatda
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
