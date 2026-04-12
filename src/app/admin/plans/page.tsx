"use client";

import { useEffect, useState, useCallback } from "react";
import { getToken } from "@/lib/auth";
import {
  Package, Plus, Trash2, Edit3, Save, X, Tag,
  ToggleLeft, ToggleRight, ChevronUp, Gift
} from "lucide-react";
import { useAdminWS } from "@/lib/admin-ws";

const API = process.env.NEXT_PUBLIC_API_URL;
function authHeaders() {
  return { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` };
}
function apiFetch(path: string, init?: RequestInit) {
  return fetch(`${API}${path}`, { ...init, headers: { ...authHeaders(), ...(init?.headers ?? {}) } });
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
  isActive: boolean;
  createdAt: string;
};

function toLocalInput(iso: string | null) {
  if (!iso) return "";
  return iso.slice(0, 16); // "YYYY-MM-DDTHH:mm"
}

// ─── Plan Edit Card ───
function PlanCard({ plan, onSaved }: { plan: PlanConfig; onSaved: () => void }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<PlanConfig>(plan);
  const [saving, setSaving] = useState(false);
  const [featureInput, setFeatureInput] = useState("");

  useEffect(() => { setForm(plan); }, [plan]);

  const save = async () => {
    setSaving(true);
    try {
      await apiFetch(`/api/plans/admin/configs/${plan.key}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setEditing(false);
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  const addFeature = () => {
    const f = featureInput.trim();
    if (!f) return;
    setForm(p => ({ ...p, features: [...p.features, f] }));
    setFeatureInput("");
  };

  const removeFeature = (i: number) => {
    setForm(p => ({ ...p, features: p.features.filter((_, idx) => idx !== i) }));
  };

  const inp = (field: keyof PlanConfig, type: "text" | "number" = "text") => ({
    value: form[field] as string | number,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(p => ({ ...p, [field]: type === "number" ? Number(e.target.value) : e.target.value })),
  });

  const PLAN_COLORS: Record<string, string> = {
    free: "var(--text-muted)",
    pro: "var(--accent)",
    premium: "var(--warning)",
    enterprise: "#a78bfa",
  };
  const color = PLAN_COLORS[plan.key] ?? "var(--accent)";

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all"
      style={{
        background: "var(--bg-card)",
        border: `1px solid var(--border)`,
        boxShadow: editing ? `0 0 0 2px ${color}40` : undefined,
      }}
    >
      {/* Header */}
      <div
        className="px-5 py-3 flex items-center gap-3"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold"
          style={{ background: `${color}20`, color }}
        >
          {plan.name[0]}
        </div>
        <div className="flex-1">
          <p className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>{plan.name}</p>
          <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>key: {plan.key}</p>
        </div>
        <button
          onClick={() => {
            if (form.isActive !== plan.isActive || editing) {
              // toggle active inline
            }
            setForm(p => ({ ...p, isActive: !p.isActive }));
            apiFetch(`/api/plans/admin/configs/${plan.key}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ isActive: !plan.isActive }),
            }).then(onSaved);
          }}
          className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-all"
          style={{
            background: plan.isActive ? "rgba(74,222,128,0.1)" : "var(--bg-primary)",
            color: plan.isActive ? "#4ade80" : "var(--text-muted)",
          }}
        >
          {plan.isActive ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
          {plan.isActive ? "Faol" : "Nofaol"}
        </button>
        <button
          onClick={() => setEditing(v => !v)}
          className="p-1.5 rounded-lg transition-all hover:opacity-80"
          style={{ background: editing ? `${color}20` : "var(--bg-primary)", color: editing ? color : "var(--text-muted)" }}
        >
          {editing ? <ChevronUp size={15} /> : <Edit3 size={15} />}
        </button>
      </div>

      {/* Quick info */}
      {!editing && (
        <div className="px-5 py-3 grid grid-cols-2 gap-2 text-xs" style={{ color: "var(--text-secondary)" }}>
          <div>Oylik narx: <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{plan.priceMonthly.toLocaleString()} so'm</span></div>
          <div>Yillik narx: <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{plan.priceYearly.toLocaleString()} so'm</span></div>
          <div>Limit: <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{plan.limitMonthly}</span></div>
          <div>Asl limit: <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{plan.originalLimit}</span></div>
          <div>Max sinf: <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{plan.maxClasses || "∞"}</span></div>
          <div>Max o'quvchi: <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{plan.maxStudentsPerClass || "∞"}</span></div>
        </div>
      )}

      {/* Edit form */}
      {editing && (
        <div className="px-5 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Reja nomi", field: "name" as const, type: "text" as const },
              { label: "Sort tartib", field: "sortOrder" as const, type: "number" as const },
              { label: "Oylik narx (so'm)", field: "priceMonthly" as const, type: "number" as const },
              { label: "Yillik narx (so'm)", field: "priceYearly" as const, type: "number" as const },
              { label: "Oylik limit", field: "limitMonthly" as const, type: "number" as const },
              { label: "Asl limit (promo uchun)", field: "originalLimit" as const, type: "number" as const },
              { label: "Max sinflar", field: "maxClasses" as const, type: "number" as const },
              { label: "Max o'quvchi/sinf", field: "maxStudentsPerClass" as const, type: "number" as const },
            ].map(({ label, field, type }) => (
              <div key={field}>
                <label className="text-[10px] font-semibold mb-1 block" style={{ color: "var(--text-muted)" }}>{label}</label>
                <input
                  className="w-full rounded-xl px-3 py-2 text-xs font-semibold outline-none"
                  style={{ background: "var(--bg-primary)", color: "var(--text-primary)", border: "1px solid var(--border)" }}
                  type={type}
                  {...inp(field, type)}
                />
              </div>
            ))}
          </div>

          {/* Telegram toggle */}
          <button
            onClick={() => setForm(p => ({ ...p, hasTelegram: !p.hasTelegram }))}
            className="flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-xl transition-all"
            style={{
              background: form.hasTelegram ? "rgba(74,222,128,0.1)" : "var(--bg-primary)",
              color: form.hasTelegram ? "#4ade80" : "var(--text-muted)",
              border: "1px solid var(--border)",
            }}
          >
            {form.hasTelegram ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
            Telegram bot kirish
          </button>

          {/* Features */}
          <div>
            <label className="text-[10px] font-semibold mb-2 block" style={{ color: "var(--text-muted)" }}>Xususiyatlar</label>
            <div className="space-y-1 mb-2">
              {form.features.map((f, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="flex-1 text-xs px-3 py-1.5 rounded-lg" style={{ background: "var(--bg-primary)", color: "var(--text-secondary)" }}>{f}</span>
                  <button onClick={() => removeFeature(i)} className="p-1" style={{ color: "var(--text-muted)" }}>
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                className="flex-1 rounded-xl px-3 py-2 text-xs outline-none"
                style={{ background: "var(--bg-primary)", color: "var(--text-primary)", border: "1px solid var(--border)" }}
                placeholder="Yangi xususiyat qo'shish..."
                value={featureInput}
                onChange={e => setFeatureInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addFeature()}
              />
              <button
                onClick={addFeature}
                className="px-3 py-2 rounded-xl text-xs font-semibold"
                style={{ background: `${color}20`, color }}
              >
                <Plus size={13} />
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={save}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all"
              style={{ background: color, color: "#fff", opacity: saving ? 0.6 : 1 }}
            >
              <Save size={13} />
              {saving ? "Saqlanmoqda..." : "Saqlash"}
            </button>
            <button
              onClick={() => { setEditing(false); setForm(plan); }}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold"
              style={{ background: "var(--bg-primary)", color: "var(--text-muted)" }}
            >
              <X size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Promotion Form Modal ───
function PromoModal({
  promo,
  planKeys,
  onClose,
  onSaved,
}: {
  promo: Promotion | null;
  planKeys: string[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const isNew = !promo;
  const [form, setForm] = useState({
    title: promo?.title ?? "",
    description: promo?.description ?? "",
    planKey: promo?.planKey ?? "",
    limitMonthly: promo?.limitMonthly ?? 0,
    maxClasses: promo?.maxClasses ?? 0,
    maxStudentsPerClass: promo?.maxStudentsPerClass ?? 0,
    hasTelegram: promo?.hasTelegram ?? false,
    discountPercent: promo?.discountPercent ?? 0,
    startsAt: toLocalInput(promo?.startsAt ?? null),
    endsAt: toLocalInput(promo?.endsAt ?? null),
    isActive: promo?.isActive ?? true,
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const body = {
        ...form,
        planKey: form.planKey || null,
        startsAt: form.startsAt || null,
        endsAt: form.endsAt || null,
      };
      if (isNew) {
        await apiFetch("/api/plans/admin/promotions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } else {
        await apiFetch(`/api/plans/admin/promotions/${promo!.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      }
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const f = (field: keyof typeof form, type: "text" | "number" | "datetime-local" = "text") => ({
    value: form[field] as string | number,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(p => ({ ...p, [field]: type === "number" ? Number(e.target.value) : e.target.value })),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
      <div
        className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
      >
        <div className="px-5 py-4 flex items-center gap-3" style={{ borderBottom: "1px solid var(--border)" }}>
          <Gift size={16} style={{ color: "var(--accent)" }} />
          <p className="font-bold text-sm flex-1" style={{ color: "var(--text-primary)" }}>
            {isNew ? "Yangi aksiya" : "Aksiyani tahrirlash"}
          </p>
          <button onClick={onClose} style={{ color: "var(--text-muted)" }}><X size={16} /></button>
        </div>
        <div className="px-5 py-4 space-y-3 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="text-[10px] font-semibold mb-1 block" style={{ color: "var(--text-muted)" }}>Sarlavha *</label>
            <input className="w-full rounded-xl px-3 py-2 text-sm outline-none" style={{ background: "var(--bg-primary)", color: "var(--text-primary)", border: "1px solid var(--border)" }} placeholder="Yoz aksiyasi 2025" {...f("title")} />
          </div>
          <div>
            <label className="text-[10px] font-semibold mb-1 block" style={{ color: "var(--text-muted)" }}>Tavsif</label>
            <textarea
              className="w-full rounded-xl px-3 py-2 text-sm outline-none resize-none"
              style={{ background: "var(--bg-primary)", color: "var(--text-primary)", border: "1px solid var(--border)" }}
              rows={2}
              placeholder="Aksiya haqida qisqacha..."
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-[10px] font-semibold mb-1 block" style={{ color: "var(--text-muted)" }}>Plan (bo'sh = barchasi)</label>
            <select className="w-full rounded-xl px-3 py-2 text-sm outline-none" style={{ background: "var(--bg-primary)", color: "var(--text-primary)", border: "1px solid var(--border)" }} value={form.planKey} onChange={e => setForm(p => ({ ...p, planKey: e.target.value }))}>
              <option value="">— Barcha planlar —</option>
              {planKeys.map(k => <option key={k} value={k}>{k}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-semibold mb-1 block" style={{ color: "var(--text-muted)" }}>Chegirma (%)</label>
              <input type="number" min={0} max={100} className="w-full rounded-xl px-3 py-2 text-sm outline-none" style={{ background: "var(--bg-primary)", color: "var(--text-primary)", border: "1px solid var(--border)" }} {...f("discountPercent", "number")} />
            </div>
            <div>
              <label className="text-[10px] font-semibold mb-1 block" style={{ color: "var(--text-muted)" }}>Limit (tekshirishlar)</label>
              <input type="number" min={0} className="w-full rounded-xl px-3 py-2 text-sm outline-none" style={{ background: "var(--bg-primary)", color: "var(--text-primary)", border: "1px solid var(--border)" }} {...f("limitMonthly", "number")} />
            </div>
            <div>
              <label className="text-[10px] font-semibold mb-1 block" style={{ color: "var(--text-muted)" }}>Max sinflar</label>
              <input type="number" min={0} className="w-full rounded-xl px-3 py-2 text-sm outline-none" style={{ background: "var(--bg-primary)", color: "var(--text-primary)", border: "1px solid var(--border)" }} {...f("maxClasses", "number")} />
            </div>
            <div>
              <label className="text-[10px] font-semibold mb-1 block" style={{ color: "var(--text-muted)" }}>Max o'quvchi/sinf</label>
              <input type="number" min={0} className="w-full rounded-xl px-3 py-2 text-sm outline-none" style={{ background: "var(--bg-primary)", color: "var(--text-primary)", border: "1px solid var(--border)" }} {...f("maxStudentsPerClass", "number")} />
            </div>
            <div>
              <label className="text-[10px] font-semibold mb-1 block" style={{ color: "var(--text-muted)" }}>Boshlanish</label>
              <input type="datetime-local" className="w-full rounded-xl px-3 py-2 text-sm outline-none" style={{ background: "var(--bg-primary)", color: "var(--text-primary)", border: "1px solid var(--border)" }} {...f("startsAt", "datetime-local")} />
            </div>
            <div>
              <label className="text-[10px] font-semibold mb-1 block" style={{ color: "var(--text-muted)" }}>Tugash</label>
              <input type="datetime-local" className="w-full rounded-xl px-3 py-2 text-sm outline-none" style={{ background: "var(--bg-primary)", color: "var(--text-primary)", border: "1px solid var(--border)" }} {...f("endsAt", "datetime-local")} />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setForm(p => ({ ...p, hasTelegram: !p.hasTelegram }))}
              className="flex-1 flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-xl"
              style={{
                background: form.hasTelegram ? "rgba(74,222,128,0.1)" : "var(--bg-primary)",
                color: form.hasTelegram ? "#4ade80" : "var(--text-muted)",
                border: "1px solid var(--border)",
              }}
            >
              {form.hasTelegram ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
              Telegram bot
            </button>
            <button
              onClick={() => setForm(p => ({ ...p, isActive: !p.isActive }))}
              className="flex-1 flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-xl"
              style={{
                background: form.isActive ? "rgba(74,222,128,0.1)" : "var(--bg-primary)",
                color: form.isActive ? "#4ade80" : "var(--text-muted)",
                border: "1px solid var(--border)",
              }}
            >
              {form.isActive ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
              {form.isActive ? "Faol" : "Nofaol"}
            </button>
          </div>
        </div>
        <div className="px-5 py-4 flex gap-2" style={{ borderTop: "1px solid var(--border)" }}>
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-semibold" style={{ background: "var(--bg-primary)", color: "var(--text-muted)" }}>
            Bekor
          </button>
          <button
            onClick={save}
            disabled={saving || !form.title.trim()}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all"
            style={{ background: "var(--accent)", color: "#fff", opacity: saving || !form.title.trim() ? 0.6 : 1 }}
          >
            {saving ? "..." : isNew ? "Yaratish" : "Saqlash"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ───
export default function AdminPlansPage() {
  const [plans, setPlans] = useState<PlanConfig[]>([]);
  const [promos, setPromos] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [promoModal, setPromoModal] = useState<{ open: boolean; promo: Promotion | null }>({ open: false, promo: null });
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [tab, setTab] = useState<"plans" | "promos">("plans");
  const { lastEvent } = useAdminWS();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [configsRes, promosRes] = await Promise.all([
        apiFetch("/api/plans/admin/configs"),
        apiFetch("/api/plans/admin/promotions"),
      ]);
      const configs = await configsRes.json();
      const promosData = await promosRes.json();
      setPlans(Array.isArray(configs) ? configs : []);
      setPromos(Array.isArray(promosData) ? promosData : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (lastEvent?.type === "plans_updated") load();
  }, [lastEvent, load]);

  const deletePromo = async (id: string) => {
    await apiFetch(`/api/plans/admin/promotions/${id}`, { method: "DELETE" });
    setDeleteId(null);
    load();
  };

  const planKeys = plans.map(p => p.key);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: "var(--accent)20" }}>
          <Package size={18} style={{ color: "var(--accent)" }} />
        </div>
        <div>
          <h1 className="text-lg font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)" }}>Tariflar boshqaruvi</h1>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>Plan konfiguratsiyalari va aksiyalar</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 p-1 rounded-xl" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
        {[
          { key: "plans" as const, label: "Tariflar", icon: Package },
          { key: "promos" as const, label: "Aksiyalar", icon: Tag },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all"
            style={{
              background: tab === key ? "var(--accent)" : "transparent",
              color: tab === key ? "#fff" : "var(--text-muted)",
            }}
          >
            <Icon size={13} />
            {label}
            {key === "promos" && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold" style={{ background: tab === key ? "rgba(255,255,255,0.2)" : "var(--bg-primary)", color: tab === key ? "#fff" : "var(--text-muted)" }}>
                {promos.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-transparent rounded-full animate-spin" style={{ borderTopColor: "var(--accent)" }} />
        </div>
      ) : tab === "plans" ? (
        /* ── Plans tab ── */
        <div className="space-y-3">
          {plans.length === 0 && (
            <p className="text-center py-12 text-sm" style={{ color: "var(--text-muted)" }}>Hech qanday plan topilmadi</p>
          )}
          {plans.map(plan => (
            <PlanCard key={plan.key} plan={plan} onSaved={load} />
          ))}
        </div>
      ) : (
        /* ── Promos tab ── */
        <div className="space-y-3">
          <button
            onClick={() => setPromoModal({ open: true, promo: null })}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold border-dashed border-2 transition-all hover:opacity-80"
            style={{ borderColor: "var(--accent)", color: "var(--accent)", background: "var(--accent)08" }}
          >
            <Plus size={15} />
            Yangi aksiya yaratish
          </button>

          {promos.length === 0 && (
            <p className="text-center py-10 text-sm" style={{ color: "var(--text-muted)" }}>Hali aksiyalar yo'q</p>
          )}
          {promos.map(promo => (
            <div
              key={promo.id}
              className="rounded-2xl overflow-hidden"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
            >
              <div className="px-4 py-3 flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(251,191,36,0.15)" }}>
                  <Gift size={15} style={{ color: "var(--warning)" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>{promo.title}</p>
                    <span
                      className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{
                        background: promo.isActive ? "rgba(74,222,128,0.15)" : "var(--bg-primary)",
                        color: promo.isActive ? "#4ade80" : "var(--text-muted)",
                      }}
                    >
                      {promo.isActive ? "Faol" : "Nofaol"}
                    </span>
                    {promo.planKey && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "var(--accent)20", color: "var(--accent)" }}>
                        {promo.planKey}
                      </span>
                    )}
                  </div>
                  {promo.description && (
                    <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-muted)" }}>{promo.description}</p>
                  )}
                  <div className="flex flex-wrap gap-3 mt-1.5 text-[10px]" style={{ color: "var(--text-muted)" }}>
                    {promo.discountPercent > 0 && (
                      <span>Chegirma: <strong style={{ color: "#f87171" }}>-{promo.discountPercent}%</strong></span>
                    )}
                    {promo.limitMonthly > 0 && (
                      <span>Limit: <strong style={{ color: "#4ade80" }}>{promo.limitMonthly} ta</strong></span>
                    )}
                    {promo.maxClasses > 0 && (
                      <span>Sinflar: <strong style={{ color: "#4ade80" }}>{promo.maxClasses}</strong></span>
                    )}
                    {promo.maxStudentsPerClass > 0 && (
                      <span>O'quvchi/sinf: <strong style={{ color: "#4ade80" }}>{promo.maxStudentsPerClass}</strong></span>
                    )}
                    {promo.endsAt && (
                      <span>Tugaydi: <strong style={{ color: "var(--warning)" }}>{new Date(promo.endsAt).toLocaleDateString("uz-UZ")}</strong></span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => setPromoModal({ open: true, promo })}
                    className="p-1.5 rounded-lg transition-all hover:opacity-80"
                    style={{ background: "var(--bg-primary)", color: "var(--text-muted)" }}
                  >
                    <Edit3 size={13} />
                  </button>
                  <button
                    onClick={() => setDeleteId(promo.id)}
                    className="p-1.5 rounded-lg transition-all hover:opacity-80"
                    style={{ background: "rgba(248,113,113,0.1)", color: "#f87171" }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Promo modal */}
      {promoModal.open && (
        <PromoModal
          promo={promoModal.promo}
          planKeys={planKeys}
          onClose={() => setPromoModal({ open: false, promo: null })}
          onSaved={load}
        />
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
          <div className="w-full max-w-xs rounded-2xl p-5 text-center space-y-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
            <p className="font-bold" style={{ color: "var(--text-primary)" }}>Aksiyani o'chirish</p>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Bu amalni qaytarib bo'lmaydi</p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold" style={{ background: "var(--bg-primary)", color: "var(--text-muted)" }}>
                Bekor
              </button>
              <button onClick={() => deletePromo(deleteId)} className="flex-1 py-2.5 rounded-xl text-sm font-bold" style={{ background: "#f87171", color: "#fff" }}>
                O'chirish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
