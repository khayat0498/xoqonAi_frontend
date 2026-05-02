"use client";

import { useEffect, useState } from "react";
import { Wallet, TrendingUp, TrendingDown, Clock } from "lucide-react";
import { getToken } from "@/lib/auth";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

type Log = {
  id: string;
  amountUzs: number;
  type: string;
  note: string | null;
  toUserName: string | null;
  createdAt: string;
};

export default function BalancePage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [tenantBalance, setTenantBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    const h = { Authorization: `Bearer ${token}` };

    Promise.all([
      fetch(`${API}/api/direktor/me`, { headers: h }).then((r) => r.json()),
      fetch(`${API}/api/direktor/balance-logs?limit=200`, { headers: h }).then((r) => r.json()),
    ])
      .then(([me, l]) => {
        setTenantBalance(me.tenant?.balanceUzs ?? 0);
        setLogs(l.logs ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  const totalIn = logs.filter((l) => l.amountUzs > 0).reduce((s, l) => s + l.amountUzs, 0);
  const totalOut = logs.filter((l) => l.amountUzs < 0).reduce((s, l) => s + l.amountUzs, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-transparent rounded-full animate-spin" style={{ borderTopColor: "var(--accent)" }} />
      </div>
    );
  }

  return (
    <div className="px-5 py-6 max-w-4xl mx-auto w-full">
      <div className="mb-5">
        <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)" }}>
          Balans tarixi
        </h1>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Admin to'ldirishlari va xodimlarga taqsimotlar
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <Stat icon={Wallet} color="var(--accent)" label="Hozirgi balans" value={tenantBalance} />
        <Stat icon={TrendingUp} color="var(--success)" label="Jami to'ldirilgan" value={totalIn} />
        <Stat icon={TrendingDown} color="var(--warning)" label="Jami taqsimlangan" value={Math.abs(totalOut)} />
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: "var(--bg-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-clay-sm)" }}>
        {logs.length === 0 ? (
          <div className="py-16 text-center">
            <Clock size={28} className="mx-auto mb-3" style={{ color: "var(--text-muted)" }} />
            <p className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>Operatsiyalar yo'q</p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>Admin balansingizni to'ldirgach bu yerda ko'rinadi</p>
          </div>
        ) : (
          logs.map((log, i) => (
            <div
              key={log.id}
              className="flex items-center gap-3 px-4 py-3.5"
              style={{ borderTop: i === 0 ? "none" : "1px solid var(--border)" }}
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{
                background: log.amountUzs > 0 ? "var(--success-bg)" : "var(--warning-bg)",
                color: log.amountUzs > 0 ? "var(--success)" : "var(--warning)",
              }}>
                {log.amountUzs > 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                  {log.type === "deposit" && "Admin to'ldirishi"}
                  {log.type === "transfer" && `→ ${log.toUserName ?? "Xodim"}ga taqsimot`}
                  {log.type === "refund" && `← ${log.toUserName ?? "Xodim"}dan qaytarildi`}
                </p>
                {log.note && (
                  <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>{log.note}</p>
                )}
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold tabular-nums" style={{ color: log.amountUzs > 0 ? "var(--success)" : "var(--text-primary)" }}>
                  {log.amountUzs > 0 ? "+" : ""}{new Intl.NumberFormat("uz-UZ").format(log.amountUzs)}
                </p>
                <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                  {new Date(log.createdAt).toLocaleDateString("uz-UZ", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function Stat({ icon: Icon, color, label, value }: { icon: React.ElementType; color: string; label: string; value: number }) {
  return (
    <div className="p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-clay-sm)" }}>
      <div className="flex items-center gap-2 mb-2">
        <Icon size={14} style={{ color }} />
        <span className="text-xs uppercase tracking-wider font-semibold" style={{ color: "var(--text-muted)" }}>
          {label}
        </span>
      </div>
      <p className="text-xl font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>
        {new Intl.NumberFormat("uz-UZ").format(value)} <span className="text-xs font-normal" style={{ color: "var(--text-muted)" }}>UZS</span>
      </p>
    </div>
  );
}
