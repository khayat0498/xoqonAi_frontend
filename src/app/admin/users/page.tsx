"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Search, Ban, ShieldCheck, Trash2, Crown, User,
  CheckCircle2, XCircle, ChevronLeft, ChevronRight, RefreshCw, CreditCard,
} from "lucide-react";
import { getToken } from "@/lib/auth";
import { useUser } from "@/lib/user-context";

const API = process.env.NEXT_PUBLIC_API_URL;
const h = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` });

type UserItem = {
  id: string;
  name: string;
  email: string;
  role: "teacher" | "student" | "admin" | "direktor" | "xodim";
  avatarUrl: string | null;
  emailVerified: boolean;
  blocked?: boolean;
  createdAt: string;
  planKey?: string | null;
  balanceUzs?: number | null;
  totalInputTokens?: number;
  totalOutputTokens?: number;
  totalSpentUzs?: number;
};

type Pagination = { page: number; limit: number; total: number; totalPages: number };

const roleColors: Record<string, { color: string; bg: string; label: string }> = {
  admin: { color: "#8B5CF6", bg: "#F5F3FF", label: "Admin" },
  teacher: { color: "var(--accent)", bg: "var(--accent-light)", label: "O'qituvchi" },
  student: { color: "var(--success)", bg: "var(--success-bg)", label: "O'quvchi" },
  direktor: { color: "#DC2626", bg: "#FEE2E2", label: "Direktor" },
  xodim: { color: "#EA580C", bg: "#FFEDD5", label: "Xodim" },
};

const FALLBACK_ROLE = { color: "var(--text-muted)", bg: "var(--bg-primary)", label: "Foydalanuvchi" };

export default function AdminUsersPage() {
  const { user: me } = useUser();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<UserItem | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [planExpandedId, setPlanExpandedId] = useState<string | null>(null);
  const [grantingPlan, setGrantingPlan] = useState<string | null>(null);
  const [topupAmounts, setTopupAmounts] = useState<Record<string, string>>({});
  const [topupBonuses, setTopupBonuses] = useState<Record<string, string>>({});
  const [toppingUp, setToppingUp] = useState<string | null>(null);

  const handleTopup = async (userId: string) => {
    const amount = Number(topupAmounts[userId]);
    if (!amount || amount <= 0) return;
    const bonus = Number(topupBonuses[userId] ?? 0);
    const total = amount + Math.floor(amount * bonus / 100);
    setToppingUp(userId);
    try {
      await fetch(`${API}/api/balance/topup`, {
        method: "POST",
        headers: h(),
        body: JSON.stringify({ userId, amountUzs: amount, bonusPercent: bonus }),
      });
      setUsers((prev) => prev.map((u) =>
        u.id === userId ? { ...u, balanceUzs: (u.balanceUzs ?? 0) + total } : u
      ));
      setTopupAmounts((prev) => ({ ...prev, [userId]: "" }));
      setTopupBonuses((prev) => ({ ...prev, [userId]: "" }));
    } finally {
      setToppingUp(null);
    }
  };

  const PLAN_OPTIONS = [
    { key: "free",        label: "Bepul",       color: "var(--text-muted)",  bg: "var(--bg-primary)" },
    { key: "pro",         label: "Pro",         color: "var(--accent)",      bg: "var(--accent-light)" },
    { key: "premium",     label: "Premium",     color: "var(--warning)",     bg: "var(--warning-bg)" },
    { key: "pay_per_use", label: "Hamyon",      color: "#7C3AED",            bg: "#EDE9FE" },
  ];

  const handleGrantPlan = async (userId: string, planKey: string) => {
    setGrantingPlan(planKey);
    try {
      await fetch(`${API}/api/billing/admin/grant`, {
        method: "POST",
        headers: h(),
        body: JSON.stringify({ userId, planKey }),
      });
      setPlanExpandedId(null);
    } finally {
      setGrantingPlan(null);
    }
  };

  const load = useCallback(async (page = 1, q = search) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (q) params.set("search", q);
      const res = await fetch(`${API}/api/users/all?${params}`, { headers: h() });
      const data = await res.json();
      if (!res.ok) {
        console.error("[AdminUsers] API xato:", res.status, data);
        return;
      }
      setUsers(data.users ?? []);
      setPagination(data.pagination ?? { page, limit: 20, total: 0, totalPages: 1 });
    } catch (e) {
      console.error("[AdminUsers] Fetch xato:", e);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { load(1, ""); }, []);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => load(1, search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const handleBlock = async (user: UserItem) => {
    setActionLoading(user.id + "_block");
    try {
      const res = await fetch(`${API}/api/users/${user.id}/block`, {
        method: "PATCH",
        headers: h(),
        body: JSON.stringify({ blocked: !user.blocked }),
      });
      if (res.ok) {
        setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, blocked: !user.blocked } : u));
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleRole = async (user: UserItem, role: string) => {
    setActionLoading(user.id + "_role");
    try {
      const res = await fetch(`${API}/api/users/${user.id}/role`, {
        method: "PATCH",
        headers: h(),
        body: JSON.stringify({ role }),
      });
      if (res.ok) {
        setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, role: role as UserItem["role"] } : u));
        setExpandedId(null);
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (user: UserItem) => {
    setActionLoading(user.id + "_delete");
    try {
      const res = await fetch(`${API}/api/users/${user.id}`, { method: "DELETE", headers: h() });
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== user.id));
        setDeleteConfirm(null);
        setPagination((p) => ({ ...p, total: p.total - 1 }));
      }
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="px-4 py-5 max-w-3xl mx-auto flex flex-col gap-4">
      {/* Search + refresh */}
      <div className="flex gap-2">
        <div className="flex-1 flex items-center gap-2 px-3 py-2.5"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)" }}>
          <Search size={15} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Ism yoki email bo'yicha qidirish..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 text-sm bg-transparent outline-none"
            style={{ color: "var(--text-primary)" }}
          />
        </div>
        <button
          onClick={() => load(pagination.page)}
          className="w-10 h-10 flex items-center justify-center"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", color: "var(--text-muted)" }}
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Count */}
      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
        Jami <span className="font-bold" style={{ color: "var(--text-primary)" }}>{pagination.total}</span> ta foydalanuvchi
      </p>

      {/* List */}
      {loading ? (
        <div className="flex flex-col gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-20 rounded-xl animate-pulse" style={{ background: "var(--border)" }} />
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16">
          <User size={32} style={{ color: "var(--text-muted)" }} />
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>Foydalanuvchi topilmadi</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {users.map((user) => {
            const rc = roleColors[user.role] ?? FALLBACK_ROLE;
            const isMe = user.id === me?.id;
            const expanded = expandedId === user.id;
            const blockLoading = actionLoading === user.id + "_block";
            const roleLoading = actionLoading === user.id + "_role";
            const delLoading = actionLoading === user.id + "_delete";

            return (
              <div
                key={user.id}
                className="flex flex-col"
                style={{
                  background: "var(--bg-card)",
                  border: user.blocked ? "1px solid var(--error)" : "1px solid var(--border)",
                  borderRadius: "var(--radius-md)",
                  boxShadow: "var(--shadow-card)",
                  opacity: user.blocked ? 0.85 : 1,
                }}
              >
                <div className="flex items-center gap-3 p-3">
                  {/* Avatar */}
                  <div
                    className="w-10 h-10 shrink-0 flex items-center justify-center text-sm font-bold rounded-full"
                    style={{
                      background: user.avatarUrl ? "transparent" : rc.bg,
                      color: rc.color,
                      backgroundImage: user.avatarUrl ? `url(${API}${user.avatarUrl})` : undefined,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  >
                    {!user.avatarUrl && user.name.charAt(0).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                        {user.name} {isMe && <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>(men)</span>}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md" style={{ background: rc.bg, color: rc.color }}>
                        {rc.label}
                      </span>
                      {user.planKey && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md" style={{
                          background: user.planKey === "pay_per_use" ? "#EDE9FE" : user.planKey === "premium" ? "var(--warning-bg)" : user.planKey === "pro" ? "var(--accent-light)" : "var(--bg-primary)",
                          color: user.planKey === "pay_per_use" ? "#7C3AED" : user.planKey === "premium" ? "var(--warning)" : user.planKey === "pro" ? "var(--accent)" : "var(--text-muted)",
                        }}>
                          {user.planKey === "pay_per_use" ? "Hamyon" : user.planKey === "free" ? "Bepul" : user.planKey}
                        </span>
                      )}
                      {user.planKey === "pay_per_use" && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md" style={{ background: "var(--bg-primary)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
                          {(user.balanceUzs ?? 0).toLocaleString()} so'm
                        </span>
                      )}
                      {user.blocked && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md" style={{ background: "#FEF2F2", color: "var(--error)" }}>
                          Bloklangan
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs truncate" style={{ color: "var(--text-muted)" }}>{user.email}</span>
                      {user.emailVerified
                        ? <CheckCircle2 size={11} style={{ color: "var(--success)", flexShrink: 0 }} />
                        : <XCircle size={11} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
                      }
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                        {new Date(user.createdAt).toLocaleDateString("uz-UZ")}
                      </span>
                      {((user.totalInputTokens ?? 0) > 0 || (user.totalOutputTokens ?? 0) > 0) && (
                        <span className="text-[11px] font-medium" style={{ color: "var(--accent)" }}>
                          {(user.totalInputTokens ?? 0).toLocaleString()}in / {(user.totalOutputTokens ?? 0).toLocaleString()}out · {(user.totalSpentUzs ?? 0).toLocaleString()} so'm
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  {!isMe && (
                    <div className="flex items-center gap-1 shrink-0">
                      {/* Block */}
                      <button
                        onClick={() => handleBlock(user)}
                        disabled={!!actionLoading}
                        title={user.blocked ? "Blokdan chiqarish" : "Bloklash"}
                        className="w-8 h-8 flex items-center justify-center rounded-lg transition-all hover:scale-105"
                        style={{
                          background: user.blocked ? "var(--success-bg)" : "#FEF2F2",
                          color: user.blocked ? "var(--success)" : "var(--error)",
                        }}
                      >
                        {blockLoading
                          ? <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                          : user.blocked ? <CheckCircle2 size={14} /> : <Ban size={14} />
                        }
                      </button>

                      {/* Role change toggle */}
                      <button
                        onClick={() => { setExpandedId(expanded ? null : user.id); setPlanExpandedId(null); }}
                        title="Role o'zgartirish"
                        className="w-8 h-8 flex items-center justify-center rounded-lg transition-all hover:scale-105"
                        style={{ background: "#F5F3FF", color: "#8B5CF6" }}
                      >
                        <Crown size={14} />
                      </button>

                      {/* Plan berish */}
                      <button
                        onClick={() => { setPlanExpandedId(planExpandedId === user.id ? null : user.id); setExpandedId(null); }}
                        title="Plan berish"
                        className="w-8 h-8 flex items-center justify-center rounded-lg transition-all hover:scale-105"
                        style={{ background: "#EDE9FE", color: "#7C3AED" }}
                      >
                        <CreditCard size={14} />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => setDeleteConfirm(user)}
                        disabled={!!actionLoading}
                        title="O'chirish"
                        className="w-8 h-8 flex items-center justify-center rounded-lg transition-all hover:scale-105"
                        style={{ background: "#FEF2F2", color: "var(--error)" }}
                      >
                        {delLoading
                          ? <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                          : <Trash2 size={14} />
                        }
                      </button>
                    </div>
                  )}
                </div>

                {/* Role selector */}
                {expanded && !isMe && (
                  <div className="px-3 pb-3 flex gap-2">
                    {(["teacher", "student", "admin"] as const).map((r) => {
                      const c = roleColors[r];
                      return (
                        <button
                          key={r}
                          onClick={() => handleRole(user, r)}
                          disabled={user.role === r || !!actionLoading}
                          className="flex-1 py-2 text-xs font-bold rounded-lg transition-all"
                          style={{
                            background: user.role === r ? c.bg : "var(--bg-primary)",
                            color: user.role === r ? c.color : "var(--text-muted)",
                            border: user.role === r ? `1px solid ${c.color}` : "1px solid var(--border)",
                          }}
                        >
                          {roleLoading && user.role !== r ? "..." : c.label}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Plan selector */}
                {planExpandedId === user.id && !isMe && (
                  <div className="px-3 pb-3 flex flex-col gap-2">
                    <div className="flex flex-wrap gap-2">
                      {PLAN_OPTIONS.map((p) => (
                        <button
                          key={p.key}
                          onClick={() => handleGrantPlan(user.id, p.key)}
                          disabled={!!grantingPlan}
                          className="flex-1 py-2 text-xs font-bold rounded-lg transition-all"
                          style={{ background: p.bg, color: p.color, border: `1px solid ${p.color}`, minWidth: 80 }}
                        >
                          {grantingPlan === p.key ? "..." : p.label}
                        </button>
                      ))}
                    </div>
                    {/* Pay per use topup */}
                    {(user.planKey === "pay_per_use") && (
                      <div className="space-y-2 pt-1">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: "var(--bg-primary)", border: "1px solid #7C3AED" }}>
                            <input
                              type="number"
                              placeholder="Miqdor"
                              value={topupAmounts[user.id] ?? ""}
                              onChange={(e) => setTopupAmounts((prev) => ({ ...prev, [user.id]: e.target.value }))}
                              className="flex-1 bg-transparent outline-none text-sm"
                              style={{ color: "var(--text-primary)" }}
                            />
                            <span className="text-xs" style={{ color: "var(--text-muted)" }}>so'm</span>
                          </div>
                          <div className="flex items-center gap-1 px-3 py-2 rounded-lg w-20" style={{ background: "var(--bg-primary)", border: "1px solid var(--border)" }}>
                            <input
                              type="number"
                              placeholder="0"
                              min={0}
                              max={100}
                              value={topupBonuses[user.id] ?? ""}
                              onChange={(e) => setTopupBonuses((prev) => ({ ...prev, [user.id]: e.target.value }))}
                              className="w-full bg-transparent outline-none text-sm text-center"
                              style={{ color: "var(--text-primary)" }}
                            />
                            <span className="text-xs" style={{ color: "var(--text-muted)" }}>%</span>
                          </div>
                          <button
                            onClick={() => handleTopup(user.id)}
                            disabled={!!toppingUp || !topupAmounts[user.id]}
                            className="px-4 py-2 text-xs font-bold rounded-lg"
                            style={{ background: "#7C3AED", color: "#fff", opacity: toppingUp === user.id ? 0.7 : 1 }}
                          >
                            {toppingUp === user.id ? "..." : "Qo'shish"}
                          </button>
                        </div>
                        {topupAmounts[user.id] && Number(topupBonuses[user.id]) > 0 && (
                          <p className="text-[11px] px-1" style={{ color: "#7C3AED" }}>
                            {Number(topupAmounts[user.id]).toLocaleString()} + {Number(topupBonuses[user.id])}% bonus = {(Number(topupAmounts[user.id]) + Math.floor(Number(topupAmounts[user.id]) * Number(topupBonuses[user.id]) / 100)).toLocaleString()} so'm
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => load(pagination.page - 1)}
            disabled={pagination.page <= 1 || loading}
            className="w-9 h-9 flex items-center justify-center rounded-lg"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              color: pagination.page <= 1 ? "var(--text-muted)" : "var(--text-primary)",
            }}
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            {pagination.page} / {pagination.totalPages}
          </span>
          <button
            onClick={() => load(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages || loading}
            className="w-9 h-9 flex items-center justify-center rounded-lg"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              color: pagination.page >= pagination.totalPages ? "var(--text-muted)" : "var(--text-primary)",
            }}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Delete confirm modal */}
      {deleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setDeleteConfirm(null); }}
        >
          <div
            className="w-full max-w-sm p-6 flex flex-col gap-4"
            style={{ background: "var(--bg-card)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", boxShadow: "var(--shadow-clay)" }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 flex items-center justify-center rounded-xl" style={{ background: "#FEF2F2" }}>
                <Trash2 size={18} style={{ color: "var(--error)" }} />
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Foydalanuvchini o&apos;chirish</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{deleteConfirm.email}</p>
              </div>
            </div>
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
              <strong>{deleteConfirm.name}</strong> ning barcha ma&apos;lumotlari o&apos;chiriladi. Bu amalni ortga qaytarib bo&apos;lmaydi.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 text-sm font-semibold rounded-xl"
                style={{ background: "var(--bg-primary)", color: "var(--text-muted)", border: "1px solid var(--border)" }}
              >
                Bekor qilish
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                disabled={!!actionLoading}
                className="flex-1 py-2.5 text-sm font-bold rounded-xl"
                style={{ background: "var(--error)", color: "#fff" }}
              >
                O&apos;chirish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
