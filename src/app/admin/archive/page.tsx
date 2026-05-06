"use client";

import { useState, useEffect, useCallback } from "react";
import { Archive, Search, RotateCcw, Trash2, Mail } from "lucide-react";
import { getToken } from "@/lib/auth";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

function authHeaders() {
  return { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` };
}

type ArchivedUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl: string | null;
  deactivatedAt: string | null;
  createdAt: string;
};

function formatDate(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("uz-UZ", { day: "2-digit", month: "2-digit", year: "numeric" }) +
    " " + d.toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" });
}

export default function AdminArchivePage() {
  const [users, setUsers] = useState<ArchivedUser[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<ArchivedUser | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/users/archive?search=${encodeURIComponent(search)}`, {
        headers: authHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  const handleRestore = async (u: ArchivedUser) => {
    setActionId(u.id);
    try {
      const res = await fetch(`${API}/api/users/${u.id}/restore`, {
        method: "PATCH",
        headers: authHeaders(),
      });
      if (res.ok) setUsers(prev => prev.filter(x => x.id !== u.id));
    } finally {
      setActionId(null);
    }
  };

  const handleHardDelete = async () => {
    if (!confirmDelete) return;
    setActionId(confirmDelete.id);
    try {
      const res = await fetch(`${API}/api/users/${confirmDelete.id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (res.ok) setUsers(prev => prev.filter(x => x.id !== confirmDelete.id));
    } finally {
      setActionId(null);
      setConfirmDelete(null);
    }
  };

  return (
    <div className="p-5 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <Archive size={16} style={{ color: "var(--text-muted)" }} />
        </div>
        <div>
          <h1 className="text-lg font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)" }}>Arxiv</h1>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>O'chirilgan hisoblar — kim qachon chiqib ketgan</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
        <input
          type="text"
          placeholder="Ism yoki email bo'yicha qidirish..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm outline-none"
          style={{ background: "var(--bg-card)", color: "var(--text-primary)", border: "1px solid var(--border)" }}
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-transparent rounded-full animate-spin" style={{ borderTopColor: "var(--accent)" }} />
        </div>
      ) : users.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Archive size={32} style={{ color: "var(--text-muted)" }} />
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>Arxiv bo'sh</p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>O'chirilgan hisob yo'q</p>
        </div>
      ) : (
        <div className="space-y-2">
          {users.map(u => (
            <div
              key={u.id}
              className="rounded-2xl px-4 py-3 flex items-center gap-3"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 overflow-hidden" style={{ background: "var(--bg-primary)" }}>
                {u.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={u.avatarUrl} alt={u.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-sm font-bold" style={{ color: "var(--text-muted)" }}>{u.name?.[0]?.toUpperCase() ?? "?"}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>{u.name}</p>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md" style={{ background: "var(--bg-primary)", color: "var(--text-muted)" }}>
                    {u.role}
                  </span>
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  <Mail size={11} style={{ color: "var(--text-muted)" }} />
                  <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>{u.email}</p>
                </div>
                <p className="text-[11px] mt-1" style={{ color: "var(--text-muted)" }}>
                  O'chirilgan: <strong style={{ color: "var(--error)" }}>{formatDate(u.deactivatedAt)}</strong>
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => handleRestore(u)}
                  disabled={actionId === u.id}
                  className="px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all hover:opacity-80"
                  style={{ background: "var(--success)", color: "#fff", opacity: actionId === u.id ? 0.5 : 1 }}
                  title="Qayta tiklash"
                >
                  <RotateCcw size={12} />
                  Tiklash
                </button>
                <button
                  onClick={() => setConfirmDelete(u)}
                  disabled={actionId === u.id}
                  className="px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all hover:opacity-80"
                  style={{ background: "var(--error)", color: "#fff", opacity: actionId === u.id ? 0.5 : 1 }}
                  title="Butunlay o'chirish"
                >
                  <Trash2 size={12} />
                  O'chirish
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Hard delete confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.72)" }} onClick={() => setConfirmDelete(null)}>
          <div
            className="w-full max-w-md p-5 flex flex-col gap-4"
            style={{ background: "var(--bg-card)", borderRadius: "var(--radius-lg)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2">
              <Trash2 size={18} style={{ color: "var(--error)" }} />
              <p className="text-base font-bold" style={{ color: "var(--error)" }}>Butunlay o'chirish</p>
            </div>
            <p className="text-sm" style={{ color: "var(--text-primary)" }}>
              <strong>{confirmDelete.email}</strong> hisobini DB'dan butunlay o'chirmoqchimisiz?
            </p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Bu amalni qaytarib bo'lmaydi. Barcha bog'liq ma'lumotlar (sinflar, submissions, balans loglari) ham o'chiriladi.
            </p>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => setConfirmDelete(null)}
                disabled={actionId === confirmDelete.id}
                className="flex-1 py-2.5 text-sm font-bold rounded-xl transition-all"
                style={{ background: "var(--bg-primary)", color: "var(--text-primary)" }}
              >
                Bekor qilish
              </button>
              <button
                onClick={handleHardDelete}
                disabled={actionId === confirmDelete.id}
                className="flex-1 py-2.5 text-sm font-bold rounded-xl transition-all"
                style={{ background: "var(--error)", color: "#fff", opacity: actionId === confirmDelete.id ? 0.6 : 1 }}
              >
                {actionId === confirmDelete.id ? "O'chirilmoqda..." : "Ha, butunlay o'chirish"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
