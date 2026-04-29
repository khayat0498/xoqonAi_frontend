"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Check, Zap, Crown, Gem, Building2,
  Sparkles, X, Clock, Loader2, Tag, Timer,
} from "lucide-react";
import { getToken } from "@/lib/auth";
import { useUserWS } from "@/lib/user-ws";
import { useT } from "@/lib/i18n-context";

const API = process.env.NEXT_PUBLIC_API_URL;
function authHeaders() {
  return { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` };
}

type PlanConfig = {
  key: string;
  name: string;
  priceMonthly: number;
  priceYearly: number;
  limitMonthly: number;
  originalLimit: number;
  maxStudentsPerClass: number;
  maxClasses: number;
  hasTelegram: boolean;
  features: string[];
  isActive: boolean;
  sortOrder: number;
};

type Promotion = {
  id: string;
  title: string;
  description: string | null;
  planKey: string | null;
  limitMonthly: number;
  maxClasses: number;
  maxStudentsPerClass: number;
  hasTelegram: boolean;
  discountPercent: number;
  startsAt: string | null;
  endsAt: string | null;
};

type PendingRequest = { id: string; planKey: string; period: string; createdAt: string };

const PLAN_ICONS: Record<string, React.ElementType> = {
  free: Zap, pro: Crown, premium: Gem, enterprise: Building2,
};
const PLAN_COLORS: Record<string, string> = {
  free: "var(--text-muted)", pro: "var(--accent)", premium: "var(--warning)", enterprise: "#8B5CF6",
};

function useFmtPrice() {
  const { t } = useT();
  const fmtPrice = (amount: number): string => {
    if (amount === 0) return t("plans.free_word");
    return amount.toLocaleString("uz-UZ") + " " + t("plans.perMonthSum");
  };
  const fmtPriceYear = (amount: number): string => {
    if (amount === 0) return t("plans.free_word");
    return amount.toLocaleString("uz-UZ") + " " + t("plans.perYearSum");
  };
  return { fmtPrice, fmtPriceYear };
}

function useCountdown(endsAt: string | null) {
  const { t } = useT();
  const [left, setLeft] = useState("");
  useEffect(() => {
    if (!endsAt) return;
    const tick = () => {
      const diff = new Date(endsAt).getTime() - Date.now();
      if (diff <= 0) { setLeft(t("plans.ended")); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setLeft(h > 24
        ? `${Math.floor(h / 24)} ${t("plans.day")} ${h % 24} ${t("plans.hour")}`
        : `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endsAt, t]);
  return left;
}

export default function PlansPage() {
  const router = useRouter();
  const { lastEvent } = useUserWS();
  const { t } = useT();
  const { fmtPrice, fmtPriceYear } = useFmtPrice();
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const [plans, setPlans] = useState<PlanConfig[]>([]);
  const [promos, setPromos] = useState<Promotion[]>([]);
  const [currentPlan, setCurrentPlan] = useState("free");
  const [pendingRequest, setPendingRequest] = useState<PendingRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmPlan, setConfirmPlan] = useState<{ key: string; name: string } | null>(null);
  const [sending, setSending] = useState(false);
  const [sentOk, setSentOk] = useState(false);

  const loadPlans = useCallback(async () => {
    const [plansRes, billingRes] = await Promise.all([
      fetch(`${API}/api/plans`, { headers: authHeaders() }),
      fetch(`${API}/api/billing/my-plan`, { headers: authHeaders() }),
    ]);
    const plansData = await plansRes.json();
    const billingData = await billingRes.json();
    setPlans(plansData.plans ?? []);
    setPromos(plansData.promotions ?? []);
    setCurrentPlan(billingData.planKey ?? "free");
    setPendingRequest(billingData.pendingRequest ?? null);
    setLoading(false);
  }, []);

  useEffect(() => { loadPlans(); }, [loadPlans]);

  // Real-time: admin plan o'zgartirsa darhol yangilanadi
  useEffect(() => {
    if (lastEvent?.type === "plans_updated") loadPlans();
    if (lastEvent?.type === "plan_updated") setCurrentPlan(lastEvent.data.planKey);
  }, [lastEvent, loadPlans]);

  const handleSendRequest = async () => {
    if (!confirmPlan) return;
    setSending(true);
    try {
      const res = await fetch(`${API}/api/billing/request`, {
        method: "POST", headers: authHeaders(),
        body: JSON.stringify({ planKey: confirmPlan.key, period: billing }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error ?? t("plans.errorGeneric")); }
      else { setSentOk(true); setPendingRequest(data.request); setTimeout(() => setConfirmPlan(null), 1800); }
    } catch { alert(t("plans.errorServer")); }
    finally { setSending(false); }
  };

  // Plan uchun faol aksiyani topish
  const getPlanPromo = (key: string) =>
    promos.find((p) => p.planKey === key || p.planKey === null);

  // Aksiyadan hisoblangan narx
  const getDiscountedPrice = (plan: PlanConfig, promo: Promotion | undefined) => {
    if (!promo || promo.discountPercent === 0) return null;
    const base = billing === "monthly" ? plan.priceMonthly : Math.round(plan.priceYearly / 12);
    return Math.round(base * (1 - promo.discountPercent / 100));
  };

  // Aksiyadan effektiv limit
  const getEffectiveLimit = (plan: PlanConfig, promo: Promotion | undefined) => {
    if (!promo || promo.limitMonthly === 0) return null;
    return promo.limitMonthly;
  };

  // Global aksiya banneri (planKey=null bo'lsa barcha planlarga tegishli)
  const globalPromo = promos.find((p) => p.planKey === null);

  return (
    <div className="flex flex-col h-screen" style={{ background: "var(--bg-primary)" }}>
      {/* Header */}
      <div
        className="shrink-0 px-5 py-4 flex items-center gap-3 relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, var(--accent-dark) 0%, var(--accent) 60%, var(--accent-hover) 100%)",
          boxShadow: "6px 6px 14px rgba(53,120,136,0.25)",
        }}
      >
        <div style={{ position: "absolute", right: -25, top: -30, width: 100, height: 100, borderRadius: "50%", background: "rgba(255,255,255,0.12)", pointerEvents: "none" }} />
        <button onClick={() => router.back()} className="w-9 h-9 flex items-center justify-center shrink-0"
          style={{ background: "rgba(255,255,255,0.18)", borderRadius: "var(--radius-sm)", color: "#fff" }}>
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-lg font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>{t("plans.title")}</h1>
      </div>

      <div className="bg-grid flex-1 overflow-y-auto">
        <div className="px-4 py-6 pb-28 max-w-2xl mx-auto w-full">

          {/* Global promo banner */}
          {globalPromo && (
            <GlobalPromoBanner promo={globalPromo} />
          )}

          <p className="text-center text-sm mb-5" style={{ color: "var(--text-secondary)" }}>
            {t("plans.chooseYourPlan")}
          </p>

          {/* Pending banner */}
          {pendingRequest && (
            <div className="flex items-center gap-3 p-4 mb-5 rounded-xl"
              style={{ background: "var(--warning-bg)", border: "1px solid var(--warning)", borderRadius: "var(--radius-md)" }}>
              <Clock size={16} style={{ color: "var(--warning)", flexShrink: 0 }} />
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  {pendingRequest.planKey.charAt(0).toUpperCase() + pendingRequest.planKey.slice(1)} {t("plans.requestSent")}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                  {t("plans.adminReviewing")}
                </p>
              </div>
            </div>
          )}

          {/* Billing toggle */}
          <div className="flex items-center justify-center mb-6">
            <div className="flex items-center p-1"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-clay-sm)" }}>
              {(["monthly", "yearly"] as const).map((b) => (
                <button key={b} onClick={() => setBilling(b)}
                  className="px-4 py-2 text-sm font-semibold transition-all flex items-center gap-1.5"
                  style={{
                    borderRadius: "var(--radius-sm)",
                    background: billing === b ? "var(--accent)" : "transparent",
                    color: billing === b ? "#fff" : "var(--text-muted)",
                    boxShadow: billing === b ? "var(--shadow-clay-sm)" : "none",
                  }}>
                  {b === "monthly" ? t("plans.monthly") : t("plans.yearly")}
                  {b === "yearly" && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                      style={{ background: billing === "yearly" ? "rgba(255,255,255,0.25)" : "var(--success)", color: "#fff" }}>
                      -17%
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Plan cards */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-64 rounded-2xl animate-pulse" style={{ background: "var(--border)" }} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {plans.map((plan) => {
                const Icon = PLAN_ICONS[plan.key] ?? Zap;
                const color = PLAN_COLORS[plan.key] ?? "var(--text-muted)";
                const isCurrent = currentPlan === plan.key;
                const isPending = pendingRequest?.planKey === plan.key;
                const isFree = plan.key === "free";
                const isEnterprise = plan.key === "enterprise";
                const isActionable = !isCurrent && !isFree && !isEnterprise && !pendingRequest;

                const promo = getPlanPromo(plan.key);
                const effectiveLimit = getEffectiveLimit(plan, promo);
                const discountedMonthly = getDiscountedPrice(plan, promo);

                const displayPrice = isEnterprise ? t("plans.negotiable")
                  : isFree ? t("plans.free_word")
                  : billing === "monthly"
                    ? discountedMonthly ? `${discountedMonthly.toLocaleString("uz-UZ")} ${t("plans.perMonthSum")}` : fmtPrice(plan.priceMonthly)
                    : fmtPriceYear(plan.priceYearly);

                const savedAmount = plan.priceMonthly > 0 ? (plan.priceMonthly * 12) - plan.priceYearly : 0;

                return (
                  <div key={plan.key}
                    className="p-5 flex flex-col gap-4 relative overflow-hidden transition-all"
                    style={{
                      background: "var(--bg-card)",
                      border: isCurrent ? `2px solid ${color}` : isPending ? "2px solid var(--warning)" : "1px solid var(--border)",
                      borderRadius: "var(--radius-lg)",
                      boxShadow: isCurrent || isPending ? "var(--shadow-clay)" : "var(--shadow-clay-sm)",
                    }}>

                    {/* Aksiya badge */}
                    {promo && (
                      <div className="absolute -right-8 top-5 px-10 py-1 text-[10px] font-bold uppercase tracking-wider"
                        style={{
                          background: "linear-gradient(135deg, #f97316, #ef4444)",
                          color: "#fff",
                          transform: "rotate(35deg)",
                          boxShadow: "0 2px 8px rgba(239,68,68,0.35)",
                        }}>
                        {t("plans.promoBadge")}
                      </div>
                    )}

                    {/* Yillik tejash */}
                    {billing === "yearly" && savedAmount > 0 && !promo && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 self-start"
                        style={{ background: "rgba(45,212,160,0.1)", borderRadius: "var(--radius-sm)", border: "1px solid rgba(45,212,160,0.2)" }}>
                        <Sparkles size={12} style={{ color: "var(--success)" }} />
                        <span className="text-[11px] font-bold" style={{ color: "var(--success)" }}>
                          {savedAmount.toLocaleString("uz-UZ")} {t("plans.youSave")}
                        </span>
                      </div>
                    )}

                    {/* Plan header */}
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 flex items-center justify-center shrink-0"
                        style={{ background: `${color}15`, borderRadius: "var(--radius-sm)", boxShadow: "inset -1px -1px 3px rgba(0,0,0,0.05)" }}>
                        <Icon size={20} style={{ color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>{plan.name}</h3>
                        <div className="flex items-center gap-2 flex-wrap">
                          {promo && promo.discountPercent > 0 && billing === "monthly" && (
                            <span className="text-xs line-through" style={{ color: "var(--text-muted)" }}>
                              {fmtPrice(plan.priceMonthly)}
                            </span>
                          )}
                          <p className="text-xs font-semibold" style={{ color: promo ? "#ef4444" : color }}>
                            {displayPrice}
                          </p>
                        </div>
                      </div>
                      {isCurrent && (
                        <span className="text-[10px] font-bold uppercase px-2.5 py-1" style={{ color, background: `${color}15`, borderRadius: 8 }}>
                          {t("plans.current")}
                        </span>
                      )}
                      {isPending && !isCurrent && (
                        <span className="text-[10px] font-bold uppercase px-2.5 py-1 flex items-center gap-1" style={{ color: "var(--warning)", background: "var(--warning-bg)", borderRadius: 8 }}>
                          <Clock size={10} /> {t("plans.pending")}
                        </span>
                      )}
                    </div>

                    {/* Aksiya info */}
                    {promo && (
                      <PromoInfo promo={promo} effectiveLimit={effectiveLimit} originalLimit={plan.limitMonthly} />
                    )}

                    {/* Features — auto DB dan */}
                    <div className="flex flex-col gap-2">
                      {/* Tekshirishlar limiti */}
                      <AutoRow color={color}
                        original={plan.limitMonthly === 0 ? t("plans.unlimited") : `${plan.limitMonthly} ${t("plans.perMonthShort2")}`}
                        promo={effectiveLimit ? `${effectiveLimit} ${t("plans.perMonthShort2")}` : null}
                        strike={effectiveLimit !== null}
                      />
                      {/* Sinflar */}
                      {(plan.maxClasses > 0 || (promo && promo.maxClasses > 0)) && (
                        <AutoRow color={color}
                          original={plan.maxClasses === 0 ? t("plans.unlimitedClasses") : `${plan.maxClasses} ${t("plans.classes")}`}
                          promo={promo && promo.maxClasses > 0 && promo.maxClasses !== plan.maxClasses
                            ? (promo.maxClasses === 0 ? t("plans.unlimitedClasses") : `${promo.maxClasses} ${t("plans.classes")}`)
                            : null}
                          strike={!!(promo && promo.maxClasses > 0 && promo.maxClasses !== plan.maxClasses)}
                        />
                      )}
                      {/* O'quvchilar */}
                      {(plan.maxStudentsPerClass > 0 || (promo && promo.maxStudentsPerClass > 0)) && (
                        <AutoRow color={color}
                          original={plan.maxStudentsPerClass === 0 ? t("plans.unlimitedStudents") : t("plans.studentsPerClass").replace("{n}", String(plan.maxStudentsPerClass))}
                          promo={promo && promo.maxStudentsPerClass > 0 && promo.maxStudentsPerClass !== plan.maxStudentsPerClass
                            ? t("plans.studentsPerClass").replace("{n}", String(promo.maxStudentsPerClass))
                            : null}
                          strike={!!(promo && promo.maxStudentsPerClass > 0 && promo.maxStudentsPerClass !== plan.maxStudentsPerClass)}
                        />
                      )}
                      {/* Telegram */}
                      {(plan.hasTelegram || (promo && promo.hasTelegram)) && (
                        <AutoRow color={color} original="Telegram bot" promo={null} strike={false} />
                      )}
                      {/* Qo'lda yozilgan features */}
                      {plan.features.map((f, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <Check size={14} className="shrink-0" style={{ color }} />
                          <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{f}</span>
                        </div>
                      ))}
                    </div>

                    {/* Action button */}
                    <button
                      onClick={isActionable ? () => { setSentOk(false); setConfirmPlan({ key: plan.key, name: plan.name }); } : undefined}
                      disabled={!isActionable}
                      className="w-full py-2.5 text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
                      style={{
                        borderRadius: "var(--radius-sm)",
                        background: isCurrent || isPending || !isActionable ? "var(--bg-primary)" : color,
                        color: isCurrent || isPending || !isActionable ? "var(--text-muted)" : "#fff",
                        border: !isActionable || isCurrent || isPending ? "1px solid var(--border)" : "none",
                        boxShadow: isActionable && !isCurrent && !isPending ? "var(--shadow-clay-sm)" : "none",
                        cursor: isActionable ? "pointer" : "default",
                      }}>
                      {isCurrent ? t("plans.currentPlanBtn")
                        : isPending ? t("plans.requestSentBtn")
                        : isFree ? t("plans.freeBtn")
                        : isEnterprise ? t("plans.contactBtn")
                        : pendingRequest ? t("plans.requestPending")
                        : t("plans.requestPlan")}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Confirm modal */}
      {confirmPlan && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget && !sending) setConfirmPlan(null); }}>
          <div className="w-full max-w-sm p-6 flex flex-col gap-5"
            style={{ background: "var(--bg-card)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-clay)", border: "1px solid var(--border)" }}>
            {sentOk ? (
              <div className="flex flex-col items-center gap-3 py-4">
                <div className="w-14 h-14 flex items-center justify-center rounded-full" style={{ background: "var(--success-bg)" }}>
                  <Check size={28} style={{ color: "var(--success)" }} />
                </div>
                <p className="text-base font-bold text-center" style={{ color: "var(--text-primary)" }}>{t("plans.successTitle")}</p>
                <p className="text-sm text-center" style={{ color: "var(--text-muted)" }}>
                  {t("plans.successMessage").replace("{plan}", confirmPlan.name)}
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-base font-bold" style={{ color: "var(--text-primary)" }}>
                      {t("plans.requestPlanTitle").replace("{plan}", confirmPlan.name)}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                      {billing === "monthly" ? t("plans.monthly") : t("plans.yearly")} · {t("plans.modalSub")}
                    </p>
                  </div>
                  <button onClick={() => setConfirmPlan(null)} className="w-8 h-8 flex items-center justify-center"
                    style={{ background: "var(--bg-primary)", borderRadius: "var(--radius-sm)", color: "var(--text-muted)" }}>
                    <X size={16} />
                  </button>
                </div>
                <div className="p-4 rounded-xl flex items-start gap-3" style={{ background: "var(--bg-primary)", border: "1px solid var(--border)" }}>
                  <Clock size={16} style={{ color: "var(--warning)", marginTop: 1, flexShrink: 0 }} />
                  <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                    {t("plans.modalNote")}
                  </p>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setConfirmPlan(null)} className="flex-1 py-3 text-sm font-semibold"
                    style={{ borderRadius: "var(--radius-sm)", background: "var(--bg-primary)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
                    {t("plans.cancel")}
                  </button>
                  <button onClick={handleSendRequest} disabled={sending}
                    className="flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
                    style={{ borderRadius: "var(--radius-sm)", background: "var(--accent)", color: "#fff", boxShadow: "var(--shadow-clay-sm)" }}>
                    {sending && <Loader2 size={15} className="animate-spin" />}
                    {sending ? t("plans.sending") : t("plans.send")}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Aksiya banner komponenti ───
function GlobalPromoBanner({ promo }: { promo: Promotion }) {
  const countdown = useCountdown(promo.endsAt);
  return (
    <div className="mb-5 p-4 flex items-center gap-3 rounded-xl"
      style={{ background: "linear-gradient(135deg, #fef3c7, #fde68a)", border: "1px solid #f59e0b", borderRadius: "var(--radius-md)" }}>
      <div className="w-10 h-10 flex items-center justify-center rounded-xl shrink-0" style={{ background: "#f59e0b" }}>
        <Tag size={18} color="#fff" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold" style={{ color: "#92400e" }}>{promo.title}</p>
        {promo.description && <p className="text-xs mt-0.5" style={{ color: "#b45309" }}>{promo.description}</p>}
      </div>
      {countdown && (
        <div className="flex items-center gap-1 shrink-0" style={{ color: "#dc2626" }}>
          <Timer size={13} />
          <span className="text-xs font-bold tabular-nums">{countdown}</span>
        </div>
      )}
    </div>
  );
}

// ─── Auto row (DB dan) ───
function AutoRow({ color, original, promo, strike }: {
  color: string;
  original: string;
  promo: string | null;
  strike: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <Check size={14} className="shrink-0" style={{ color }} />
      {strike && promo ? (
        <span className="text-sm flex items-center gap-1.5" style={{ color: "var(--text-secondary)" }}>
          <span style={{ textDecoration: "line-through", color: "var(--text-muted)" }}>{original}</span>
          <span className="font-bold" style={{ color: "var(--success)" }}>{promo}</span>
        </span>
      ) : (
        <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{original}</span>
      )}
    </div>
  );
}

// ─── Plan aksiya info ───
function PromoInfo({ promo, effectiveLimit, originalLimit }: { promo: Promotion; effectiveLimit: number | null; originalLimit: number }) {
  const { t } = useT();
  const countdown = useCountdown(promo.endsAt);
  return (
    <div className="px-3 py-2 rounded-xl flex items-center gap-2"
      style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
      <Sparkles size={13} style={{ color: "#ef4444", flexShrink: 0 }} />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold" style={{ color: "#ef4444" }}>{promo.title}</p>
        {effectiveLimit && (
          <p className="text-[11px] mt-0.5 flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
            <span style={{ textDecoration: "line-through" }}>{originalLimit}</span>
            <strong style={{ color: "var(--success)" }}>{effectiveLimit}</strong> {t("plans.imagesPerMonth")}
          </p>
        )}
      </div>
      {countdown && (
        <div className="flex items-center gap-1 shrink-0" style={{ color: "#ef4444" }}>
          <Timer size={11} />
          <span className="text-[11px] font-bold tabular-nums">{countdown}</span>
        </div>
      )}
    </div>
  );
}
