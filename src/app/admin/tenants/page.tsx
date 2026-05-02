"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Building2, Check, X, Wallet, Users as UsersIcon, ShieldCheck, ShieldX, Pause, Plus } from "lucide-react";
import { getToken } from "@/lib/auth";
import { useAdminWS } from "@/lib/admin-ws";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

type Tenant = {
  id: string;
  name: string;
  inviteCode: string;
  balanceUzs: number;
  status: "pending" | "active" | "rejected" | "suspended";
  createdAt: string;
  approvedAt: string | null;
  rejectedReason: string | null;
  ownerId: string;
  ownerName: string | null;
  ownerEmail: string | null;
  memberCount: number;
};

type StatusFilter = "all" | "pending" | "active" | "rejected" | "suspended";

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: "Kutilmoqda", color: "var(--warning)", bg: "var(--warning-bg)" },
  active: { label: "Faol", color: "var(--success)", bg: "var(--success-bg)" },
  rejected: { label: "Rad etilgan", color: "var(--error)", bg: "var(--error-bg)" },
  suspended: { label: "To'xtatilgan", color: "var(--text-muted)", bg: "var(--bg-primary)" },
};

export default function AdminTenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [loading, setLoading] = useState(true);

  // Topup modal
  const [topupTenant, setTopupTenant] = useState<Tenant | null>(null);
  const [topupAmount, setTopupAmount] = useState("");
  const [topupNote, setTopupNote] = useState("");
  const [topupSubmitting, setTopupSubmitting] = useState(false);
  const [topupError, setTopupError] = useState("");

  // Reject modal
  const [rejectTenant, setRejectTenant] = useState<Tenant | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const load = async () => {
    const token = getToken();
    if (!token) return;
    const url = `${API}/api/admin/tenants${filter !== "all" ? `?status=${filter}` : ""}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const d = await res.json();
    setTenants(d.tenants ?? []);
    setLoading(false);
  };

  const { lastEvent } = useAdminWS();

  useEffect(() => {
    load();
  }, [filter]);

  // Yangi tenant kelsa yoki status o'zgarsa darhol yangilanadi
  useEffect(() => {
    if (lastEvent?.type === "tenant_pending_changed") {
      load();
    }
  }, [lastEvent]);

  const approve = async (t: Tenant) => {
    if (!confirm(`"${t.name}" ni tasdiqlaysizmi?`)) return;
    await fetch(`${API}/api/admin/tenants/${t.id}/approve`, {
      method: "POST",
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    await load();
  };

  const submitReject = async () => {
    if (!rejectTenant) return;
    await fetch(`${API}/api/admin/tenants/${rejectTenant.id}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ reason: rejectReason.trim() || undefined }),
    });
    setRejectTenant(null);
    setRejectReason("");
    await load();
  };

  const suspend = async (t: Tenant) => {
    if (!confirm(`"${t.name}" ni to'xtatamizmi?`)) return;
    await fetch(`${API}/api/admin/tenants/${t.id}/suspend`, {
      method: "POST",
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    await load();
  };

  const submitTopup = async () => {
    if (!topupTenant) return;
    const amt = Number(topupAmount);
    if (!amt || amt <= 0) return setTopupError("Summa noto'g'ri");

    setTopupSubmitting(true);
    setTopupError("");
    try {
      const res = await fetch(`${API}/api/admin/tenants/${topupTenant.id}/topup`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ amountUzs: amt, note: topupNote.trim() || undefined }),
      });
      const d = await res.json();
      if (!res.ok) return setTopupError(d.error ?? "Xatolik");
      setTopupTenant(null);
      setTopupAmount("");
      setTopupNote("");
      await load();
    } finally {
      setTopupSubmitting(false);
    }
  };

  const pendingCount = tenants.filter((t) => t.status === "pending").length;

  return (
    <div className="px-5 py-6 max-w-6xl mx-auto w-full">
      <div className="mb-5">
        <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)" }}>
          Tashkilotlar
        </h1>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Direktor so'rovlari, tasdiqlash va balans boshqaruvi
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5 overflow-x-auto">
        {(["all", "pending", "active", "rejected", "suspended"] as StatusFilter[]).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap flex items-center gap-1.5"
            style={{
              background: filter === s ? "var(--accent)" : "var(--bg-card)",
              color: filter === s ? "#fff" : "var(--text-secondary)",
              border: "1px solid var(--border)",
            }}
          >
            {s === "all" ? "Barchasi" : STATUS_META[s].label}
            {s === "pending" && pendingCount > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] rounded-full" style={{ background: "var(--warning)", color: "#fff" }}>
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-16 flex justify-center">
          <div className="w-6 h-6 border-2 border-transparent rounded-full animate-spin" style={{ borderTopColor: "var(--accent)" }} />
        </div>
      ) : tenants.length === 0 ? (
        <div className="py-16 text-center rounded-2xl" style={{ background: "var(--bg-card)", border: "1px dashed var(--border)" }}>
          <Building2 size={32} className="mx-auto mb-3" style={{ color: "var(--text-muted)" }} />
          <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Tashkilotlar yo'q</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tenants.map((t) => (
            <div
              key={t.id}
              className="p-4 rounded-2xl"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-clay-sm)" }}
            >
              <div className="flex items-start gap-3 flex-wrap">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: "var(--accent-light)", color: "var(--accent)" }}>
                  <Building2 size={20} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>{t.name}</h3>
                    <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full" style={{ background: STATUS_META[t.status].bg, color: STATUS_META[t.status].color }}>
                      {STATUS_META[t.status].label}
                    </span>
                  </div>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    Direktor: {t.ownerName ?? "—"} · {t.ownerEmail}
                  </p>
                  <div className="flex gap-4 mt-2 text-xs" style={{ color: "var(--text-secondary)" }}>
                    <span className="flex items-center gap-1"><UsersIcon size={11} /> {t.memberCount} xodim</span>
                    <span className="flex items-center gap-1 tabular-nums"><Wallet size={11} /> {new Intl.NumberFormat("uz-UZ").format(t.balanceUzs)} UZS</span>
                    <span className="font-mono">{t.inviteCode}</span>
                  </div>
                  {t.rejectedReason && (
                    <p className="text-xs mt-2 italic" style={{ color: "var(--error)" }}>
                      Sabab: {t.rejectedReason}
                    </p>
                  )}
                </div>

                <div className="flex gap-2 flex-wrap">
                  {t.status === "pending" && (
                    <>
                      <ActionBtn icon={Check} label="Tasdiqlash" color="var(--success)" onClick={() => approve(t)} />
                      <ActionBtn icon={X} label="Rad etish" color="var(--error)" onClick={() => setRejectTenant(t)} />
                    </>
                  )}
                  {t.status === "active" && (
                    <>
                      <ActionBtn icon={Plus} label="Balans" color="var(--accent)" onClick={() => { setTopupTenant(t); setTopupAmount(""); setTopupNote(""); setTopupError(""); }} />
                      <ActionBtn icon={Pause} label="To'xtatish" color="var(--warning)" onClick={() => suspend(t)} />
                    </>
                  )}
                  {t.status === "suspended" && (
                    <ActionBtn icon={Check} label="Faollashtirish" color="var(--success)" onClick={() => approve(t)} />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Topup Modal */}
      {topupTenant && (
        <Modal title={`${topupTenant.name} — balans to'ldirish`} onClose={() => setTopupTenant(null)}>
          <p className="text-xs mb-4" style={{ color: "var(--text-secondary)" }}>
            Hozirgi balans: <strong className="tabular-nums">{new Intl.NumberFormat("uz-UZ").format(topupTenant.balanceUzs)} UZS</strong>
          </p>
          <ModalInput label="Summa (UZS)" type="number" value={topupAmount} onChange={setTopupAmount} placeholder="500000" autoFocus />
          <ModalInput label="Izoh (ixtiyoriy)" value={topupNote} onChange={setTopupNote} placeholder="May oyi to'lovi" />
          {topupError && <p className="text-xs font-medium mb-3" style={{ color: "var(--error)" }}>{topupError}</p>}
          <button
            onClick={submitTopup}
            disabled={topupSubmitting || !topupAmount}
            className="w-full py-3 text-sm font-bold rounded-xl"
            style={{ background: "var(--accent)", color: "#fff", opacity: topupSubmitting || !topupAmount ? 0.6 : 1 }}
          >
            {topupSubmitting ? "Yuborilmoqda..." : "To'ldirish"}
          </button>
        </Modal>
      )}

      {/* Reject Modal */}
      {rejectTenant && (
        <Modal title={`${rejectTenant.name} — rad etish`} onClose={() => setRejectTenant(null)}>
          <ModalInput
            label="Sababi (ixtiyoriy)"
            value={rejectReason}
            onChange={setRejectReason}
            placeholder="Tashkilot ma'lumotlari to'liq emas"
            autoFocus
          />
          <button
            onClick={submitReject}
            className="w-full py-3 text-sm font-bold rounded-xl"
            style={{ background: "var(--error)", color: "#fff" }}
          >
            Rad etishni tasdiqlash
          </button>
        </Modal>
      )}
    </div>
  );
}

function ActionBtn({ icon: Icon, label, color, onClick }: { icon: React.ElementType; label: string; color: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 text-xs font-semibold rounded-lg transition-all hover:opacity-90 flex items-center gap-1.5"
      style={{ background: color, color: "#fff" }}
    >
      <Icon size={12} /> {label}
    </button>
  );
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.7)" }} onClick={onClose}>
      <div
        className="w-full max-w-md p-6 rounded-2xl"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-clay)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <p className="text-base font-bold" style={{ color: "var(--text-primary)" }}>{title}</p>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full" style={{ background: "var(--bg-primary)", color: "var(--text-muted)" }}>
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ModalInput({ label, value, onChange, placeholder, type = "text", autoFocus }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; autoFocus?: boolean }) {
  return (
    <label className="block mb-3">
      <span className="text-xs font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: "var(--text-muted)" }}>{label}</span>
      <input
        type={type}
        autoFocus={autoFocus}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 text-sm outline-none"
        style={{ background: "var(--bg-primary)", border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)", color: "var(--text-primary)" }}
      />
    </label>
  );
}
