"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CreditCard, Receipt, Crown, Gem, Zap, Wifi } from "lucide-react";
import { useEffect, useState } from "react";
import { getToken } from "@/lib/auth";
import { useUserWS } from "@/lib/user-ws";

const API = process.env.NEXT_PUBLIC_API_URL;
function authHeaders() {
  return { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` };
}

const PLAN_META: Record<string, { name: string; price: string; icon: React.ElementType; color: string; bg: string }> = {
  free:    { name: "Free",    price: "Bepul",            icon: Zap,   color: "var(--text-muted)", bg: "var(--bg-primary)" },
  pro:     { name: "Pro",     price: "19 000 so'm / oy", icon: Crown, color: "var(--accent)",     bg: "var(--accent-light)" },
  premium: { name: "Premium", price: "49 000 so'm / oy", icon: Gem,   color: "var(--warning)",    bg: "var(--warning-bg)" },
};

export default function BillingPage() {
  const router = useRouter();
  const { lastEvent, connected } = useUserWS();
  const [used, setUsed] = useState(0);
  const [limit, setLimit] = useState(60);
  const [planKey, setPlanKey] = useState("free");
  const [loading, setLoading] = useState(true);
  const [justUpdated, setJustUpdated] = useState(false);

  useEffect(() => {
    fetch(`${API}/api/billing/my-plan`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((d) => setPlanKey(d.planKey ?? "free"))
      .catch(() => {});

    fetch(`${API}/api/submissions/usage/me`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((d) => { setUsed(d.used ?? 0); setLimit(d.limit ?? 60); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Real-time yangilanishlar
  useEffect(() => {
    if (!lastEvent) return;
    if (lastEvent.type === "plan_updated") {
      setPlanKey(lastEvent.data.planKey);
      setJustUpdated(true);
      setTimeout(() => setJustUpdated(false), 4000);
    }
    if (lastEvent.type === "usage_updated") {
      setUsed(lastEvent.data.used);
      setLimit(lastEvent.data.limit);
    }
  }, [lastEvent]);

  const plan = PLAN_META[planKey] ?? PLAN_META.free;
  const PlanIcon = plan.icon;
  const pct = limit > 0 && limit < 99999 ? Math.round((used / limit) * 100) : 0;
  const isUnlimited = limit >= 99999;

  return (
    <div className="flex flex-col h-screen" style={{ background: "var(--bg-primary)" }}>
      {/* Header */}
      <div
        className="shrink-0 px-5 py-4 flex items-center gap-3 relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, var(--accent-dark) 0%, var(--accent) 60%, var(--accent-hover) 100%)",
          boxShadow: "6px 6px 14px rgba(53,120,136,0.25), inset -2px -2px 6px rgba(0,0,0,0.08), inset 2px 2px 6px rgba(255,255,255,0.12)",
        }}
      >
        <div style={{ position: "absolute", right: -25, top: -30, width: 100, height: 100, borderRadius: "50%", background: "rgba(255,255,255,0.12)", pointerEvents: "none" }} />
        <button
          onClick={() => router.back()}
          className="w-9 h-9 flex items-center justify-center shrink-0"
          style={{ background: "rgba(255,255,255,0.18)", borderRadius: "var(--radius-sm)", color: "#fff" }}
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-lg font-bold text-white flex-1" style={{ fontFamily: "var(--font-display)" }}>Billing</h1>
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg" style={{ background: "rgba(255,255,255,0.15)" }}>
          <Wifi size={11} color={connected ? "#4ade80" : "rgba(255,255,255,0.4)"} />
          <span className="text-[10px] font-semibold" style={{ color: connected ? "#4ade80" : "rgba(255,255,255,0.4)" }}>
            {connected ? "Live" : "Offline"}
          </span>
        </div>
      </div>

      <div className="bg-grid flex-1 overflow-y-auto">
        <div className="px-4 py-6 pb-28 max-w-lg mx-auto w-full flex flex-col gap-4">

          {/* Plan updated toast */}
          {justUpdated && (
            <div
              className="p-3 flex items-center gap-3 rounded-xl"
              style={{ background: "var(--success-bg)", border: "1px solid var(--success)" }}
            >
              <span className="text-lg">🎉</span>
              <p className="text-sm font-semibold" style={{ color: "var(--success)" }}>
                Rejangiz <strong>{plan.name}</strong> ga yangilandi!
              </p>
            </div>
          )}

          {/* Current plan card */}
          <div
            className="p-5"
            style={{
              background: "var(--bg-card)",
              border: `2px solid ${plan.color}`,
              borderRadius: "var(--radius-lg)",
              boxShadow: "var(--shadow-clay)",
            }}
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Joriy reja</p>
                <h2 className="text-2xl font-bold mt-1" style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)" }}>
                  {loading ? "..." : plan.name}
                </h2>
                <p className="text-sm mt-0.5 font-semibold" style={{ color: plan.color }}>{loading ? "" : plan.price}</p>
              </div>
              <div
                className="w-16 h-16 flex items-center justify-center"
                style={{ background: plan.bg, borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-clay-sm)" }}
              >
                <PlanIcon size={28} style={{ color: plan.color }} />
              </div>
            </div>

            {/* Usage bar */}
            <div className="p-4 rounded-xl mb-4" style={{ background: "var(--bg-primary)" }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
                  Bu oy foydalanish
                </span>
                <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                  {loading ? "..." : isUnlimited ? `${used} / ∞` : `${used} / ${limit}`}
                </span>
              </div>
              {!isUnlimited && (
                <>
                  <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
                    <div
                      className="h-2.5 rounded-full transition-all duration-700"
                      style={{
                        width: `${Math.min(pct, 100)}%`,
                        background: pct >= 90 ? "var(--error)" : pct >= 70 ? "var(--warning)" : plan.color,
                      }}
                    />
                  </div>
                  <p className="text-xs mt-1.5 text-right" style={{ color: pct >= 90 ? "var(--error)" : "var(--text-muted)" }}>
                    {limit - used} ta qoldi ({100 - pct}%)
                  </p>
                </>
              )}
              {isUnlimited && (
                <p className="text-xs mt-1" style={{ color: "var(--success)" }}>Cheksiz foydalanish ✓</p>
              )}
            </div>

            <Link
              href="/plans"
              className="w-full py-2.5 text-sm font-semibold flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{ borderRadius: "var(--radius-sm)", background: plan.color, color: "#fff", boxShadow: "var(--shadow-clay-sm)", display: "flex" }}
            >
              Rejani yangilash →
            </Link>
          </div>

          {/* Payment method */}
          <div
            className="overflow-hidden"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-clay)" }}
          >
            <div className="flex items-center gap-3 px-4 py-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
              <CreditCard size={17} style={{ color: "var(--text-muted)" }} />
              <div className="flex-1">
                <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>To&apos;lov usuli</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Hali qo&apos;shilmagan</p>
              </div>
            </div>
            <div className="flex items-center gap-3 px-4 py-3.5">
              <Receipt size={17} style={{ color: "var(--text-muted)" }} />
              <div className="flex-1">
                <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>To&apos;lov tarixi</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>To&apos;lovlar yo&apos;q</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
