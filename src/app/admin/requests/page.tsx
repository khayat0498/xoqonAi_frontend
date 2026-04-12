"use client";

import { useEffect, useState, useCallback } from "react";
import { Check, X, Clock, User, Crown, Gem, ChevronDown, ChevronUp } from "lucide-react";
import { getToken } from "@/lib/auth";
import { useAdminWS } from "@/lib/admin-ws";

const API = process.env.NEXT_PUBLIC_API_URL;
function authHeaders() {
  return { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` };
}

type BillingRequest = {
  id: string;
  status: "pending" | "approved" | "rejected";
  planKey: string;
  period: string;
  adminNote: string | null;
  createdAt: string;
  updatedAt: string;
  userId: string;
  userName: string;
  userEmail: string;
};

const planColors: Record<string, string> = {
  pro: "var(--accent)",
  premium: "var(--warning)",
};

const planIcons: Record<string, React.ElementType> = {
  pro: Crown,
  premium: Gem,
};

const statusColors = {
  pending: { color: "var(--warning)", bg: "var(--warning-bg)", label: "Kutilmoqda" },
  approved: { color: "var(--success)", bg: "var(--success-bg)", label: "Tasdiqlandi" },
  rejected: { color: "var(--error)", bg: "var(--error-bg, #FEF2F2)", label: "Rad etildi" },
};

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState<BillingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [actionId, setActionId] = useState<string | null>(null);
  const [durationDays, setDurationDays] = useState(30);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { lastEvent } = useAdminWS();

  const load = useCallback(() => {
    setLoading(true);
    fetch(`${API}/api/billing/admin/requests`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((d) => setRequests(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  // Real-time: yangi so'rov kelsa ro'yxatga qo'sh, status o'zgarsa yangilar
  useEffect(() => {
    if (!lastEvent) return;
    if (lastEvent.type === "new_request") {
      const req = lastEvent.data as BillingRequest;
      setRequests((prev) => [req, ...prev]);
    } else if (lastEvent.type === "request_updated") {
      const { id, status } = lastEvent.data as { id: string; status: string };
      setRequests((prev) =>
        prev.map((r) => r.id === id ? { ...r, status: status as BillingRequest["status"] } : r)
      );
    }
  }, [lastEvent]);

  const handleApprove = async (id: string) => {
    const res = await fetch(`${API}/api/billing/admin/requests/${id}/approve`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ durationDays }),
    });
    if (res.ok) setActionId(null);
    // WS orqali request_updated keladi — load() shart emas
  };

  const handleReject = async (id: string) => {
    await fetch(`${API}/api/billing/admin/requests/${id}/reject`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({}),
    });
    // WS orqali request_updated keladi
  };

  const filtered = filter === "all" ? requests : requests.filter((r) => r.status === filter);
  const pendingCount = requests.filter((r) => r.status === "pending").length;

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-primary)" }}>
      {/* Header */}
      <div
        className="px-5 py-4 flex items-center justify-between sticky top-0 z-10"
        style={{ background: "var(--bg-card)", borderBottom: "1px solid var(--border)" }}
      >
        <div>
          <h1 className="text-base font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)" }}>
            Tarif so&apos;rovlari
          </h1>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            {pendingCount > 0 ? `${pendingCount} ta yangi so'rov` : "Barcha so'rovlar ko'rib chiqilgan"}
          </p>
        </div>
        {pendingCount > 0 && (
          <span
            className="w-6 h-6 flex items-center justify-center text-xs font-bold rounded-full"
            style={{ background: "var(--warning)", color: "#fff" }}
          >
            {pendingCount}
          </span>
        )}
      </div>

      <div className="px-4 py-5 max-w-2xl mx-auto flex flex-col gap-4">
        {/* Filter tabs */}
        <div className="flex gap-2">
          {(["pending", "approved", "rejected", "all"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg transition-all"
              style={{
                background: filter === f ? "var(--accent)" : "var(--bg-card)",
                color: filter === f ? "#fff" : "var(--text-muted)",
                border: filter === f ? "none" : "1px solid var(--border)",
              }}
            >
              {f === "pending" ? "Kutilmoqda" : f === "approved" ? "Tasdiqlangan" : f === "rejected" ? "Rad etilgan" : "Barchasi"}
              {f === "pending" && pendingCount > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold" style={{ background: "rgba(255,255,255,0.3)" }}>
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-transparent rounded-full animate-spin" style={{ borderTopColor: "var(--accent)" }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16">
            <Clock size={32} style={{ color: "var(--text-muted)" }} />
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>So&apos;rovlar yo&apos;q</p>
          </div>
        ) : (
          filtered.map((req) => {
            const PlanIcon = planIcons[req.planKey] ?? Crown;
            const planColor = planColors[req.planKey] ?? "var(--accent)";
            const st = statusColors[req.status];
            const isExpanded = expandedId === req.id;

            return (
              <div
                key={req.id}
                className="p-4 flex flex-col gap-3"
                style={{
                  background: "var(--bg-card)",
                  border: req.status === "pending" ? "1px solid var(--warning)" : "1px solid var(--border)",
                  borderRadius: "var(--radius-md)",
                  boxShadow: "var(--shadow-card)",
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 flex items-center justify-center shrink-0" style={{ background: `${planColor}15`, borderRadius: "var(--radius-sm)" }}>
                    <PlanIcon size={18} style={{ color: planColor }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                        {req.planKey.charAt(0).toUpperCase() + req.planKey.slice(1)} — {req.period === "monthly" ? "Oylik" : "Yillik"}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md" style={{ background: st.bg, color: st.color }}>
                        {st.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <User size={11} style={{ color: "var(--text-muted)" }} />
                      <span className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
                        {req.userName} · {req.userEmail}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : req.id)}
                    style={{ color: "var(--text-muted)" }}
                  >
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                </div>

                {isExpanded && (
                  <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                    <p>So&apos;rov sanasi: {new Date(req.createdAt).toLocaleString("uz-UZ")}</p>
                    {req.adminNote && <p className="mt-1">Admin izohi: {req.adminNote}</p>}
                  </div>
                )}

                {req.status === "pending" && (
                  <>
                    {actionId === req.id ? (
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="flex items-center gap-2 flex-1">
                          <label className="text-xs font-medium shrink-0" style={{ color: "var(--text-secondary)" }}>Muddat (kun):</label>
                          <input
                            type="number"
                            value={durationDays}
                            onChange={(e) => setDurationDays(Number(e.target.value))}
                            min={1}
                            className="w-20 px-2 py-1.5 text-sm text-center"
                            style={{
                              background: "var(--bg-primary)",
                              border: "1px solid var(--border)",
                              borderRadius: "var(--radius-sm)",
                              color: "var(--text-primary)",
                              outline: "none",
                            }}
                          />
                        </div>
                        <button
                          onClick={() => setActionId(null)}
                          className="px-3 py-1.5 text-xs font-semibold"
                          style={{ background: "var(--bg-primary)", color: "var(--text-muted)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)" }}
                        >
                          Bekor
                        </button>
                        <button
                          onClick={() => handleApprove(req.id)}
                          className="px-4 py-1.5 text-xs font-bold flex items-center gap-1.5"
                          style={{ background: "var(--success)", color: "#fff", borderRadius: "var(--radius-sm)" }}
                        >
                          <Check size={13} />
                          Tasdiqlash
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleReject(req.id)}
                          className="flex-1 py-2 text-xs font-semibold flex items-center justify-center gap-1.5"
                          style={{ background: "var(--bg-primary)", color: "var(--error)", border: "1px solid var(--error)", borderRadius: "var(--radius-sm)" }}
                        >
                          <X size={13} />
                          Rad etish
                        </button>
                        <button
                          onClick={() => { setDurationDays(req.period === "yearly" ? 365 : 30); setActionId(req.id); }}
                          className="flex-[2] py-2 text-xs font-bold flex items-center justify-center gap-1.5"
                          style={{ background: "var(--success)", color: "#fff", borderRadius: "var(--radius-sm)" }}
                        >
                          <Check size={13} />
                          Tasdiqlash
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
