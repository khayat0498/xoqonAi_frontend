"use client";

import { useEffect, useState } from "react";
import { Plus, Minus, UserMinus, X } from "lucide-react";
import { getToken } from "@/lib/auth";
import { useUserWS } from "@/lib/user-ws";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

type Xodim = {
  id: string;
  name: string;
  email: string;
  balanceUzs: number | null;
  createdAt: string;
};

type ModalKind = "topup" | "withdraw" | null;

export default function XodimlarPage() {
  const [xodimlar, setXodimlar] = useState<Xodim[]>([]);
  const [loading, setLoading] = useState(true);
  const [tenantBalance, setTenantBalance] = useState(0);

  const [modalKind, setModalKind] = useState<ModalKind>(null);
  const [activeXodim, setActiveXodim] = useState<Xodim | null>(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    const token = getToken();
    if (!token) return;
    const h = { Authorization: `Bearer ${token}` };
    const [meRes, listRes] = await Promise.all([
      fetch(`${API}/api/direktor/me`, { headers: h }).then((r) => r.json()),
      fetch(`${API}/api/direktor/xodimlar`, { headers: h }).then((r) => r.json()),
    ]);
    setTenantBalance(meRes.tenant?.balanceUzs ?? 0);
    setXodimlar(listRes.xodimlar ?? []);
    setLoading(false);
  };

  const { lastEvent } = useUserWS();

  useEffect(() => {
    load();
  }, []);

  // Real-time: tenant yoki xodim balansi yangilansa
  useEffect(() => {
    if (!lastEvent) return;
    if (
      lastEvent.type === "tenant_balance_updated" ||
      lastEvent.type === "xodim_balance_updated" ||
      lastEvent.type === "balance_updated"
    ) {
      load();
    }
  }, [lastEvent]);

  const openModal = (kind: ModalKind, x: Xodim) => {
    setModalKind(kind);
    setActiveXodim(x);
    setAmount("");
    setNote("");
    setError("");
  };

  const closeModal = () => {
    setModalKind(null);
    setActiveXodim(null);
  };

  const submitTransfer = async () => {
    if (!activeXodim || !modalKind) return;
    const amt = Number(amount);
    if (!amt || amt <= 0) return setError("Summa noto'g'ri");
    if (modalKind === "topup" && amt > tenantBalance) {
      return setError("Tashkilot balansi yetarli emas");
    }
    if (modalKind === "withdraw" && amt > (activeXodim.balanceUzs ?? 0)) {
      return setError("Xodim balansi yetarli emas");
    }

    setSubmitting(true);
    setError("");
    try {
      const path = modalKind === "topup" ? "topup" : "withdraw";
      const res = await fetch(`${API}/api/direktor/xodim/${activeXodim.id}/${path}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ amountUzs: amt, note: note.trim() || undefined }),
      });
      const d = await res.json();
      if (!res.ok) return setError(d.error ?? "Xatolik");
      closeModal();
      await load();
    } finally {
      setSubmitting(false);
    }
  };

  const removeXodim = async (x: Xodim) => {
    if (!confirm(`${x.name} ni tashkilotdan chiqaramizmi? Balansi unda qoladi.`)) return;
    await fetch(`${API}/api/direktor/xodim/${x.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    await load();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-transparent rounded-full animate-spin" style={{ borderTopColor: "var(--accent)" }} />
      </div>
    );
  }

  return (
    <div className="px-5 py-6 max-w-5xl mx-auto w-full">
      <div className="mb-5">
        <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)" }}>
          Xodimlar
        </h1>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Tashkilotdagi {xodimlar.length} ta xodim · Tashkilot balansi: <strong className="tabular-nums">{new Intl.NumberFormat("uz-UZ").format(tenantBalance)} UZS</strong>
        </p>
      </div>

      {xodimlar.length === 0 ? (
        <div className="p-10 text-center rounded-2xl" style={{ background: "var(--bg-card)", border: "1px dashed var(--border)" }}>
          <p className="text-base font-semibold mb-1" style={{ color: "var(--text-primary)" }}>Hozircha xodim yo'q</p>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Dashboard'dan invite kodni nusxalang va xodimlarga bering
          </p>
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ background: "var(--bg-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-clay-sm)" }}>
          {xodimlar.map((x, i) => (
            <div
              key={x.id}
              className="flex items-center gap-3 p-4 transition-colors hover:bg-[var(--bg-primary)]"
              style={{ borderTop: i === 0 ? "none" : "1px solid var(--border)" }}
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold shrink-0" style={{ background: "linear-gradient(135deg, var(--accent), var(--cta))" }}>
                {x.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>{x.name}</p>
                <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>{x.email}</p>
              </div>
              <div className="text-right hidden sm:block">
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>Balansi</p>
                <p className="text-sm font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>
                  {new Intl.NumberFormat("uz-UZ").format(x.balanceUzs ?? 0)} UZS
                </p>
              </div>
              <div className="flex gap-1.5">
                <IconBtn label="To'ldirish" color="var(--success)" onClick={() => openModal("topup", x)}>
                  <Plus size={14} />
                </IconBtn>
                <IconBtn label="Qaytarish" color="var(--warning)" onClick={() => openModal("withdraw", x)}>
                  <Minus size={14} />
                </IconBtn>
                <IconBtn label="Chiqarish" color="var(--error)" onClick={() => removeXodim(x)}>
                  <UserMinus size={14} />
                </IconBtn>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Topup/Withdraw Modal */}
      {modalKind && activeXodim && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.7)" }} onClick={closeModal}>
          <div
            className="w-full max-w-md p-6 rounded-2xl"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-clay)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-base font-bold" style={{ color: "var(--text-primary)" }}>
                  {modalKind === "topup" ? "Balansni to'ldirish" : "Balansni qaytarish"}
                </p>
                <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{activeXodim.name}</p>
              </div>
              <button onClick={closeModal} className="w-7 h-7 flex items-center justify-center rounded-full" style={{ background: "var(--bg-primary)", color: "var(--text-muted)" }}>
                <X size={16} />
              </button>
            </div>

            <p className="text-xs mb-4" style={{ color: "var(--text-secondary)" }}>
              {modalKind === "topup"
                ? <>Tashkilot balansi: <strong className="tabular-nums">{new Intl.NumberFormat("uz-UZ").format(tenantBalance)} UZS</strong></>
                : <>Xodim balansi: <strong className="tabular-nums">{new Intl.NumberFormat("uz-UZ").format(activeXodim.balanceUzs ?? 0)} UZS</strong></>}
            </p>

            <label className="block mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: "var(--text-muted)" }}>Summa (UZS)</span>
              <input
                type="number"
                autoFocus
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="100000"
                className="w-full px-3 py-2.5 text-sm font-medium tabular-nums outline-none"
                style={{ background: "var(--bg-primary)", border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)", color: "var(--text-primary)" }}
              />
            </label>

            <label className="block mb-4">
              <span className="text-xs font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: "var(--text-muted)" }}>Izoh (ixtiyoriy)</span>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="May oyi uchun"
                className="w-full px-3 py-2.5 text-sm outline-none"
                style={{ background: "var(--bg-primary)", border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)", color: "var(--text-primary)" }}
              />
            </label>

            {error && <p className="text-xs font-medium mb-3" style={{ color: "var(--error)" }}>{error}</p>}

            <button
              onClick={submitTransfer}
              disabled={submitting || !amount}
              className="w-full py-3 text-sm font-bold rounded-xl transition-all"
              style={{
                background: modalKind === "topup" ? "var(--success)" : "var(--warning)",
                color: "#fff",
                opacity: submitting || !amount ? 0.6 : 1,
              }}
            >
              {submitting ? "Yuborilmoqda..." : modalKind === "topup" ? "To'ldirish" : "Qaytarish"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function IconBtn({ children, label, color, onClick }: { children: React.ReactNode; label: string; color: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title={label}
      className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-105"
      style={{ background: "var(--bg-primary)", color, border: "1px solid var(--border)" }}
    >
      {children}
    </button>
  );
}
