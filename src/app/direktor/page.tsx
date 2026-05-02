"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Building2, Users as UsersIcon, Wallet, FileText, Copy, Check, ArrowRight, TrendingUp } from "lucide-react";
import { getToken } from "@/lib/auth";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

type Tenant = {
  id: string;
  name: string;
  inviteCode: string;
  balanceUzs: number;
  status: string;
  createdAt: string;
  approvedAt: string | null;
};

type Stats = {
  memberCount: number;
  totalSubmissions: number;
};

type Xodim = {
  id: string;
  name: string;
  email: string;
  balanceUzs: number | null;
  createdAt: string;
};

type Log = {
  id: string;
  amountUzs: number;
  type: string;
  note: string | null;
  toUserName: string | null;
  createdAt: string;
};

export default function DirektorDashboard() {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [xodimlar, setXodimlar] = useState<Xodim[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    const h = { Authorization: `Bearer ${token}` };

    Promise.all([
      fetch(`${API}/api/direktor/me`, { headers: h }).then((r) => r.json()),
      fetch(`${API}/api/direktor/xodimlar`, { headers: h }).then((r) => r.json()),
      fetch(`${API}/api/direktor/balance-logs?limit=10`, { headers: h }).then((r) => r.json()),
    ])
      .then(([me, xodimlarData, logsData]) => {
        setTenant(me.tenant);
        setStats(me.stats);
        setXodimlar(xodimlarData.xodimlar ?? []);
        setLogs(logsData.logs ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  const copyInviteCode = () => {
    if (!tenant) return;
    navigator.clipboard.writeText(tenant.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-transparent rounded-full animate-spin" style={{ borderTopColor: "var(--accent)" }} />
      </div>
    );
  }

  return (
    <div className="px-5 py-6 max-w-6xl mx-auto w-full">

      {/* Welcome */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)" }}>
          Boshqaruv paneli
        </h1>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Tashkilotingiz balansi, xodimlari va faoliyati.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "var(--accent-light)", color: "var(--accent)" }}>
              <Wallet size={18} />
            </div>
            <span className="text-xs uppercase tracking-wider font-semibold" style={{ color: "var(--text-muted)" }}>
              Tashkilot balansi
            </span>
          </div>
          <p className="text-2xl font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>
            {new Intl.NumberFormat("uz-UZ").format(tenant?.balanceUzs ?? 0)} <span className="text-sm font-normal" style={{ color: "var(--text-muted)" }}>UZS</span>
          </p>
        </Card>

        <Card>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "var(--cta-ghost)", color: "var(--cta)" }}>
              <UsersIcon size={18} />
            </div>
            <span className="text-xs uppercase tracking-wider font-semibold" style={{ color: "var(--text-muted)" }}>
              Xodimlar
            </span>
          </div>
          <p className="text-2xl font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>
            {stats?.memberCount ?? 0}
          </p>
        </Card>

        <Card>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "var(--success-bg)", color: "var(--success)" }}>
              <FileText size={18} />
            </div>
            <span className="text-xs uppercase tracking-wider font-semibold" style={{ color: "var(--text-muted)" }}>
              Tekshirilgan ishlar
            </span>
          </div>
          <p className="text-2xl font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>
            {stats?.totalSubmissions ?? 0}
          </p>
        </Card>
      </div>

      {/* Invite code */}
      <Card className="mb-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <p className="text-xs uppercase tracking-wider font-semibold mb-1" style={{ color: "var(--text-muted)" }}>
              Xodimlar uchun ulanish kodi
            </p>
            <p className="font-mono text-lg font-bold" style={{ color: "var(--text-primary)" }}>
              {tenant?.inviteCode}
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
              Xodimlar Settings → "Tashkilotga ulanish" orqali kiritadi
            </p>
          </div>
          <button
            onClick={copyInviteCode}
            className="px-4 py-2.5 text-sm font-semibold rounded-xl flex items-center gap-2 transition-all hover:opacity-90"
            style={{
              background: copied ? "var(--success)" : "var(--accent)",
              color: "#fff",
            }}
          >
            {copied ? <><Check size={14} /> Nusxalandi</> : <><Copy size={14} /> Nusxalash</>}
          </button>
        </div>
      </Card>

      {/* Xodimlar quick list + logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Xodimlar */}
        <div className="lg:col-span-2">
          <div className="flex items-end justify-between mb-3">
            <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>So'nggi xodimlar</h2>
            <Link href="/direktor/xodimlar" className="text-xs font-semibold flex items-center gap-1" style={{ color: "var(--accent)" }}>
              Hammasi <ArrowRight size={12} />
            </Link>
          </div>
          <Card>
            {xodimlar.length === 0 ? (
              <Empty title="Hozircha xodim yo'q" sub={`Yuqoridagi kod (${tenant?.inviteCode})ni xodimlarga bering — ular Settings'dan ulanadi`} />
            ) : (
              <div className="divide-y" style={{ borderColor: "var(--border)" }}>
                {xodimlar.slice(0, 6).map((x) => (
                  <div key={x.id} className="flex items-center gap-3 py-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold text-white shrink-0" style={{ background: "linear-gradient(135deg, var(--accent), var(--cta))" }}>
                      {x.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>{x.name}</p>
                      <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>{x.email}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>Balans</p>
                      <p className="text-sm font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>
                        {new Intl.NumberFormat("uz-UZ").format(x.balanceUzs ?? 0)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Logs */}
        <div>
          <div className="flex items-end justify-between mb-3">
            <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>So'nggi operatsiyalar</h2>
          </div>
          <Card>
            {logs.length === 0 ? (
              <Empty title="Operatsiyalar yo'q" sub="Admin balansni to'ldirgach bu yerda ko'rinadi" small />
            ) : (
              <div className="divide-y" style={{ borderColor: "var(--border)" }}>
                {logs.map((log) => (
                  <div key={log.id} className="py-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{
                          background: log.type === "deposit" ? "var(--success)" : log.type === "transfer" ? "var(--accent)" : "var(--text-muted)",
                        }} />
                        <p className="text-xs font-medium truncate" style={{ color: "var(--text-primary)" }}>
                          {log.type === "deposit" ? "Admin to'ldirdi" : log.type === "transfer" ? `→ ${log.toUserName ?? "Xodim"}` : log.type}
                        </p>
                      </div>
                      <span className="text-xs font-bold tabular-nums shrink-0" style={{ color: log.amountUzs > 0 ? "var(--success)" : "var(--error)" }}>
                        {log.amountUzs > 0 ? "+" : ""}{new Intl.NumberFormat("uz-UZ").format(log.amountUzs)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`p-4 ${className}`}
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-md)",
        boxShadow: "var(--shadow-clay-sm)",
      }}
    >
      {children}
    </div>
  );
}

function Empty({ title, sub, small }: { title: string; sub?: string; small?: boolean }) {
  return (
    <div className={`text-center ${small ? "py-6" : "py-10"}`}>
      <p className="text-sm font-semibold mb-1" style={{ color: "var(--text-secondary)" }}>{title}</p>
      {sub && <p className="text-xs" style={{ color: "var(--text-muted)" }}>{sub}</p>}
    </div>
  );
}
