"use client";

import { useEffect, useState, useCallback } from "react";
import { getToken } from "@/lib/auth";
import {
  Package, Plus, Trash2, Edit3, Save, X, Tag,
  ToggleLeft, ToggleRight, ChevronUp, Gift, Settings, FileText, BookOpen, Link2
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
  const [tab, setTab] = useState<"plans" | "promos" | "settings" | "prompts" | "subjects">("plans");
  const [sysSettings, setSysSettings] = useState<Record<string, string>>({});
  const [promptsList, setPromptsList] = useState<Array<{ id: string; key: string; name: string; description: string | null; content: string; language: string }>>([]);
  const [editingPrompt, setEditingPrompt] = useState<string | null>(null);
  const [promptDrafts, setPromptDrafts] = useState<Record<string, string>>({});
  const [promptSaving, setPromptSaving] = useState<string | null>(null);
  const [newPromptModal, setNewPromptModal] = useState(false);
  const [newPrompt, setNewPrompt] = useState({ key: "", name: "", description: "", content: "", language: "uz" });
  const [newPromptSaving, setNewPromptSaving] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  // ─── Subjects state ───
  type GlobalSubject = { id: string; name: string; icon: string; promptKey: string | null; createdAt: string };
  const [subjectsList, setSubjectsList] = useState<GlobalSubject[]>([]);
  const [newSubjectModal, setNewSubjectModal] = useState(false);
  const [newSubject, setNewSubject] = useState({ name: "", icon: "📖", promptKey: "" });
  const [newSubjectSaving, setNewSubjectSaving] = useState(false);
  const [editingSubject, setEditingSubject] = useState<GlobalSubject | null>(null);
  const [deletingSubjectId, setDeletingSubjectId] = useState<string | null>(null);
  const { lastEvent } = useAdminWS();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [configsRes, promosRes, settingsRes, promptsRes, subjectsRes] = await Promise.all([
        apiFetch("/api/plans/admin/configs"),
        apiFetch("/api/plans/admin/promotions"),
        apiFetch("/api/plans/admin/settings"),
        apiFetch("/api/admin/prompts"),
        apiFetch("/api/admin/subjects"),
      ]);
      const configs = await configsRes.json();
      const promosData = await promosRes.json();
      const settingsData = await settingsRes.json();
      const promptsData = await promptsRes.json();
      const subjectsData = await subjectsRes.json();
      setPlans(Array.isArray(configs) ? configs : []);
      setPromos(Array.isArray(promosData) ? promosData : []);
      setSysSettings(settingsData ?? {});
      setPromptsList(Array.isArray(promptsData) ? promptsData : []);
      setSubjectsList(Array.isArray(subjectsData) ? subjectsData : []);
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
          { key: "prompts" as const, label: "Promptlar", icon: FileText },
          { key: "subjects" as const, label: "Fanlar", icon: BookOpen },
          { key: "settings" as const, label: "Sozlamalar", icon: Settings },
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
      ) : tab === "prompts" ? (
        /* ── Prompts tab ── */
        <div className="space-y-3">
          <button
            onClick={() => {
              setNewPrompt({ key: "", name: "", description: "", content: "", language: "uz" });
              setNewPromptModal(true);
            }}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold border-dashed border-2 transition-all hover:opacity-80"
            style={{ borderColor: "var(--accent)", color: "var(--accent)", background: "var(--accent)08" }}
          >
            <Plus size={15} />
            Yangi prompt yaratish
          </button>
          {promptsList.length === 0 && (
            <p className="text-center py-8 text-sm" style={{ color: "var(--text-muted)" }}>Hech qanday prompt topilmadi</p>
          )}
          {promptsList.map(p => {
            const isOpen = editingPrompt === p.id;
            const draft = promptDrafts[p.id] ?? p.content;
            return (
              <div
                key={p.id}
                className="rounded-2xl overflow-hidden transition-all"
                style={{ background: "var(--bg-card)", border: `1px solid ${isOpen ? "var(--accent)" : "var(--border)"}` }}
              >
                <div
                  className="px-5 py-3 flex items-center gap-3 cursor-pointer"
                  style={{ borderBottom: isOpen ? "1px solid var(--border)" : "none" }}
                  onClick={() => {
                    if (isOpen) {
                      setEditingPrompt(null);
                    } else {
                      setEditingPrompt(p.id);
                      setPromptDrafts(d => ({ ...d, [p.id]: p.content }));
                    }
                  }}
                >
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "var(--accent)20" }}>
                    <FileText size={14} style={{ color: "var(--accent)" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>{p.name}</p>
                    <p className="text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>key: {p.key}</p>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "var(--bg-primary)", color: "var(--text-muted)" }}>
                    {p.content.length} belgi
                  </span>
                  <ChevronUp size={14} style={{ color: "var(--text-muted)", transform: isOpen ? "rotate(0deg)" : "rotate(180deg)", transition: "transform 0.2s" }} />
                </div>
                {isOpen && (
                  <div className="px-5 py-4 space-y-3">
                    {p.description && (
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>{p.description}</p>
                    )}
                    <textarea
                      className="w-full rounded-xl px-3 py-2.5 text-xs font-mono outline-none resize-y"
                      style={{
                        background: "var(--bg-primary)",
                        color: "var(--text-primary)",
                        border: "1px solid var(--border)",
                        minHeight: "320px",
                        lineHeight: "1.6",
                      }}
                      value={draft}
                      onChange={e => setPromptDrafts(d => ({ ...d, [p.id]: e.target.value }))}
                      spellCheck={false}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={async () => {
                          setPromptSaving(p.id);
                          try {
                            await apiFetch(`/api/admin/prompts/${p.id}`, {
                              method: "PATCH",
                              body: JSON.stringify({ content: draft }),
                            });
                            setPromptsList(list => list.map(item => item.id === p.id ? { ...item, content: draft } : item));
                            setEditingPrompt(null);
                          } finally {
                            setPromptSaving(null);
                          }
                        }}
                        disabled={promptSaving === p.id || draft === p.content}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all"
                        style={{
                          background: "var(--accent)",
                          color: "#fff",
                          opacity: promptSaving === p.id || draft === p.content ? 0.5 : 1,
                        }}
                      >
                        <Save size={13} />
                        {promptSaving === p.id ? "Saqlanmoqda..." : "Saqlash"}
                      </button>
                      <button
                        onClick={() => {
                          setPromptDrafts(d => ({ ...d, [p.id]: p.content }));
                          setEditingPrompt(null);
                        }}
                        className="px-4 py-2.5 rounded-xl text-sm font-semibold"
                        style={{ background: "var(--bg-primary)", color: "var(--text-muted)" }}
                      >
                        Bekor
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : tab === "subjects" ? (
        /* ── Subjects tab ── */
        <div className="space-y-3">
          <button
            onClick={() => { setNewSubject({ name: "", icon: "📖", promptKey: "" }); setNewSubjectModal(true); }}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold border-dashed border-2 transition-all hover:opacity-80"
            style={{ borderColor: "var(--accent)", color: "var(--accent)", background: "var(--accent)08" }}
          >
            <Plus size={15} />
            Yangi fan yaratish
          </button>
          {subjectsList.length === 0 && (
            <p className="text-center py-8 text-sm" style={{ color: "var(--text-muted)" }}>Hech qanday global fan topilmadi</p>
          )}
          {subjectsList.map(subj => (
            <div
              key={subj.id}
              className="rounded-2xl overflow-hidden"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
            >
              <div className="px-4 py-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: "var(--bg-primary)" }}>
                  {subj.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>{subj.name}</p>
                  {subj.promptKey ? (
                    <div className="flex items-center gap-1 mt-0.5">
                      <Link2 size={10} style={{ color: "var(--accent)" }} />
                      <span className="text-[10px] font-mono" style={{ color: "var(--accent)" }}>{subj.promptKey}</span>
                    </div>
                  ) : (
                    <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>Prompt bog'lanmagan (avtomatik qidiriladi)</p>
                  )}
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => setEditingSubject(subj)}
                    className="p-1.5 rounded-lg transition-all hover:opacity-80"
                    style={{ background: "var(--bg-primary)", color: "var(--text-muted)" }}
                  >
                    <Edit3 size={13} />
                  </button>
                  <button
                    onClick={() => setDeletingSubjectId(subj.id)}
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
      ) : tab === "settings" ? (
        /* ── Settings tab ── */
        <div className="space-y-4">
          {/* AI Model */}
          <div className="rounded-2xl p-5 space-y-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
            <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>AI Model sozlamalari</p>
            <div>
              <label className="text-xs font-semibold mb-1.5 block" style={{ color: "var(--text-muted)" }}>Gemini model nomi</label>
              <input
                className="w-full rounded-xl px-3 py-2.5 text-sm outline-none font-mono"
                style={{ background: "var(--bg-primary)", color: "var(--text-primary)", border: "1px solid var(--border)" }}
                value={sysSettings.gemini_model ?? "gemini-3-flash-preview"}
                onChange={e => setSysSettings(s => ({ ...s, gemini_model: e.target.value }))}
                placeholder="gemini-3-flash-preview"
              />
              <p className="text-[11px] mt-1.5" style={{ color: "var(--text-muted)" }}>
                Mavjud modellar: gemini-3-flash-preview, gemini-1.5-flash, gemini-2.0-flash
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold mb-1.5 block" style={{ color: "var(--text-muted)" }}>Etalon temperature</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="2"
                  className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                  style={{ background: "var(--bg-primary)", color: "var(--text-primary)", border: "1px solid var(--border)" }}
                  value={sysSettings.etalon_temperature ?? ""}
                  onChange={e => setSysSettings(s => ({ ...s, etalon_temperature: e.target.value }))}
                  placeholder="0"
                />
                <p className="text-[10px] mt-1" style={{ color: "var(--text-muted)" }}>0 = deterministic, 1 = ijodiy</p>
              </div>
              <div>
                <label className="text-xs font-semibold mb-1.5 block" style={{ color: "var(--text-muted)" }}>Etalon max output</label>
                <input
                  type="number"
                  step="1024"
                  min="1024"
                  className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                  style={{ background: "var(--bg-primary)", color: "var(--text-primary)", border: "1px solid var(--border)" }}
                  value={sysSettings.etalon_max_output_tokens ?? ""}
                  onChange={e => setSysSettings(s => ({ ...s, etalon_max_output_tokens: e.target.value }))}
                  placeholder="32768"
                />
                <p className="text-[10px] mt-1" style={{ color: "var(--text-muted)" }}>JSON kesilmasligi uchun</p>
              </div>
              <div>
                <label className="text-xs font-semibold mb-1.5 block" style={{ color: "var(--text-muted)" }}>Etalon thinking</label>
                <input
                  type="number"
                  step="512"
                  min="0"
                  max="32768"
                  className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                  style={{ background: "var(--bg-primary)", color: "var(--text-primary)", border: "1px solid var(--border)" }}
                  value={sysSettings.etalon_thinking_budget ?? ""}
                  onChange={e => setSysSettings(s => ({ ...s, etalon_thinking_budget: e.target.value }))}
                  placeholder="0"
                />
                <p className="text-[10px] mt-1" style={{ color: "var(--text-muted)" }}>0 = o'chiq, 2048+ sifat oshiradi (qimmat)</p>
              </div>
            </div>
            <button
              onClick={async () => {
                setSettingsSaving(true);
                await apiFetch("/api/plans/admin/settings", {
                  method: "PATCH",
                  body: JSON.stringify({
                    gemini_model: sysSettings.gemini_model,
                    etalon_temperature: sysSettings.etalon_temperature ?? "0",
                    etalon_max_output_tokens: sysSettings.etalon_max_output_tokens ?? "32768",
                    etalon_thinking_budget: sysSettings.etalon_thinking_budget ?? "0",
                  }),
                });
                setSettingsSaving(false);
              }}
              disabled={settingsSaving}
              className="px-5 py-2.5 rounded-xl text-sm font-bold transition-all"
              style={{ background: "var(--accent)", color: "#fff", opacity: settingsSaving ? 0.7 : 1 }}
            >
              {settingsSaving ? "Saqlanmoqda..." : "Saqlash"}
            </button>
          </div>

          {/* Pay per use narxlar */}
          <div className="rounded-2xl p-5 space-y-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
            <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Pay per use narxlar</p>
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="text-xs font-semibold mb-1.5 block" style={{ color: "var(--text-muted)" }}>Dollar kursi (1$ = ? so'm)</label>
                <input
                  type="number"
                  className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                  style={{ background: "var(--bg-primary)", color: "var(--text-primary)", border: "1px solid var(--border)" }}
                  value={sysSettings.usd_rate_uzs ?? ""}
                  onChange={e => setSysSettings(s => ({ ...s, usd_rate_uzs: e.target.value }))}
                  placeholder="12800"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold mb-1.5 block" style={{ color: "var(--text-muted)" }}>Input narx ($ / 1M token)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                    style={{ background: "var(--bg-primary)", color: "var(--text-primary)", border: "1px solid var(--border)" }}
                    value={sysSettings.gemini_input_price_usd ?? ""}
                    onChange={e => setSysSettings(s => ({ ...s, gemini_input_price_usd: e.target.value }))}
                    placeholder="0.10"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1.5 block" style={{ color: "var(--text-muted)" }}>Output narx ($ / 1M token)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                    style={{ background: "var(--bg-primary)", color: "var(--text-primary)", border: "1px solid var(--border)" }}
                    value={sysSettings.gemini_output_price_usd ?? ""}
                    onChange={e => setSysSettings(s => ({ ...s, gemini_output_price_usd: e.target.value }))}
                    placeholder="0.40"
                  />
                </div>
              </div>
            </div>
            <button
              onClick={async () => {
                setSettingsSaving(true);
                await fetch(`${API}/api/balance/pricing`, {
                  method: "POST",
                  headers: authHeaders(),
                  body: JSON.stringify({
                    usdRateUzs: Number(sysSettings.usd_rate_uzs),
                    inputPriceUsd: Number(sysSettings.gemini_input_price_usd),
                    outputPriceUsd: Number(sysSettings.gemini_output_price_usd),
                  }),
                });
                setSettingsSaving(false);
              }}
              disabled={settingsSaving}
              className="px-5 py-2.5 rounded-xl text-sm font-bold transition-all"
              style={{ background: "#7C3AED", color: "#fff", opacity: settingsSaving ? 0.7 : 1 }}
            >
              {settingsSaving ? "Saqlanmoqda..." : "Narxlarni saqlash"}
            </button>
          </div>
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

      {/* New Subject modal */}
      {newSubjectModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
          <div className="w-full max-w-sm rounded-2xl overflow-hidden" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
            <div className="px-5 py-4 flex items-center gap-3" style={{ borderBottom: "1px solid var(--border)" }}>
              <BookOpen size={16} style={{ color: "var(--accent)" }} />
              <p className="font-bold text-sm flex-1" style={{ color: "var(--text-primary)" }}>Yangi global fan</p>
              <button onClick={() => setNewSubjectModal(false)} style={{ color: "var(--text-muted)" }}><X size={16} /></button>
            </div>
            <div className="px-5 py-4 space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="text-[10px] font-semibold mb-1 block" style={{ color: "var(--text-muted)" }}>Fan nomi *</label>
                  <input
                    className="w-full rounded-xl px-3 py-2 text-sm outline-none"
                    style={{ background: "var(--bg-primary)", color: "var(--text-primary)", border: "1px solid var(--border)" }}
                    placeholder="Kimyo"
                    value={newSubject.name}
                    onChange={e => setNewSubject(p => ({ ...p, name: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold mb-1 block" style={{ color: "var(--text-muted)" }}>Emoji</label>
                  <input
                    className="w-full rounded-xl px-3 py-2 text-sm outline-none text-center"
                    style={{ background: "var(--bg-primary)", color: "var(--text-primary)", border: "1px solid var(--border)" }}
                    placeholder="📖"
                    value={newSubject.icon}
                    onChange={e => setNewSubject(p => ({ ...p, icon: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-semibold mb-1 block" style={{ color: "var(--text-muted)" }}>Prompt kalit (promptKey)</label>
                <select
                  className="w-full rounded-xl px-3 py-2 text-sm outline-none"
                  style={{ background: "var(--bg-primary)", color: "var(--text-primary)", border: "1px solid var(--border)" }}
                  value={newSubject.promptKey}
                  onChange={e => setNewSubject(p => ({ ...p, promptKey: e.target.value }))}
                >
                  <option value="">— Avtomatik (fan nomi bo'yicha) —</option>
                  {promptsList.map(p => (
                    <option key={p.key} value={p.key}>{p.name} ({p.key})</option>
                  ))}
                </select>
                <p className="text-[10px] mt-1" style={{ color: "var(--text-muted)" }}>
                  Bo'sh qoldirilsa "kimyo" → "kimyo_analysis" avtomatik qidiriladi
                </p>
              </div>
            </div>
            <div className="px-5 py-4 flex gap-2" style={{ borderTop: "1px solid var(--border)" }}>
              <button onClick={() => setNewSubjectModal(false)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold" style={{ background: "var(--bg-primary)", color: "var(--text-muted)" }}>
                Bekor
              </button>
              <button
                disabled={newSubjectSaving || !newSubject.name.trim()}
                onClick={async () => {
                  setNewSubjectSaving(true);
                  try {
                    const res = await apiFetch("/api/admin/subjects", {
                      method: "POST",
                      body: JSON.stringify({ name: newSubject.name, icon: newSubject.icon, promptKey: newSubject.promptKey || null }),
                    });
                    if (res.ok) {
                      const created = await res.json();
                      setSubjectsList(list => [...list, created]);
                      setNewSubjectModal(false);
                    }
                  } finally {
                    setNewSubjectSaving(false);
                  }
                }}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all"
                style={{ background: "var(--accent)", color: "#fff", opacity: newSubjectSaving || !newSubject.name.trim() ? 0.5 : 1 }}
              >
                {newSubjectSaving ? "..." : "Yaratish"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Subject modal */}
      {editingSubject && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
          <div className="w-full max-w-sm rounded-2xl overflow-hidden" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
            <div className="px-5 py-4 flex items-center gap-3" style={{ borderBottom: "1px solid var(--border)" }}>
              <BookOpen size={16} style={{ color: "var(--accent)" }} />
              <p className="font-bold text-sm flex-1" style={{ color: "var(--text-primary)" }}>Fanni tahrirlash</p>
              <button onClick={() => setEditingSubject(null)} style={{ color: "var(--text-muted)" }}><X size={16} /></button>
            </div>
            <div className="px-5 py-4 space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="text-[10px] font-semibold mb-1 block" style={{ color: "var(--text-muted)" }}>Fan nomi</label>
                  <input
                    className="w-full rounded-xl px-3 py-2 text-sm outline-none"
                    style={{ background: "var(--bg-primary)", color: "var(--text-primary)", border: "1px solid var(--border)" }}
                    value={editingSubject.name}
                    onChange={e => setEditingSubject(p => p ? { ...p, name: e.target.value } : p)}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold mb-1 block" style={{ color: "var(--text-muted)" }}>Emoji</label>
                  <input
                    className="w-full rounded-xl px-3 py-2 text-sm outline-none text-center"
                    style={{ background: "var(--bg-primary)", color: "var(--text-primary)", border: "1px solid var(--border)" }}
                    value={editingSubject.icon}
                    onChange={e => setEditingSubject(p => p ? { ...p, icon: e.target.value } : p)}
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-semibold mb-1 block" style={{ color: "var(--text-muted)" }}>Prompt kalit</label>
                <select
                  className="w-full rounded-xl px-3 py-2 text-sm outline-none"
                  style={{ background: "var(--bg-primary)", color: "var(--text-primary)", border: "1px solid var(--border)" }}
                  value={editingSubject.promptKey ?? ""}
                  onChange={e => setEditingSubject(p => p ? { ...p, promptKey: e.target.value || null } : p)}
                >
                  <option value="">— Avtomatik —</option>
                  {promptsList.map(p => (
                    <option key={p.key} value={p.key}>{p.name} ({p.key})</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="px-5 py-4 flex gap-2" style={{ borderTop: "1px solid var(--border)" }}>
              <button onClick={() => setEditingSubject(null)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold" style={{ background: "var(--bg-primary)", color: "var(--text-muted)" }}>
                Bekor
              </button>
              <button
                onClick={async () => {
                  const res = await apiFetch(`/api/admin/subjects/${editingSubject.id}`, {
                    method: "PATCH",
                    body: JSON.stringify({ name: editingSubject.name, icon: editingSubject.icon, promptKey: editingSubject.promptKey }),
                  });
                  if (res.ok) {
                    const updated = await res.json();
                    setSubjectsList(list => list.map(s => s.id === updated.id ? updated : s));
                    setEditingSubject(null);
                  }
                }}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold"
                style={{ background: "var(--accent)", color: "#fff" }}
              >
                Saqlash
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Subject confirm */}
      {deletingSubjectId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
          <div className="w-full max-w-xs rounded-2xl p-5 text-center space-y-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
            <p className="font-bold" style={{ color: "var(--text-primary)" }}>Fanni o'chirish</p>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Bu amalni qaytarib bo'lmaydi</p>
            <div className="flex gap-2">
              <button onClick={() => setDeletingSubjectId(null)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold" style={{ background: "var(--bg-primary)", color: "var(--text-muted)" }}>
                Bekor
              </button>
              <button
                onClick={async () => {
                  await apiFetch(`/api/admin/subjects/${deletingSubjectId}`, { method: "DELETE" });
                  setSubjectsList(list => list.filter(s => s.id !== deletingSubjectId));
                  setDeletingSubjectId(null);
                }}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold"
                style={{ background: "#f87171", color: "#fff" }}
              >
                O'chirish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Prompt modal */}
      {newPromptModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
          <div className="w-full max-w-lg rounded-2xl overflow-hidden" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
            <div className="px-5 py-4 flex items-center gap-3" style={{ borderBottom: "1px solid var(--border)" }}>
              <FileText size={16} style={{ color: "var(--accent)" }} />
              <p className="font-bold text-sm flex-1" style={{ color: "var(--text-primary)" }}>Yangi prompt</p>
              <button onClick={() => setNewPromptModal(false)} style={{ color: "var(--text-muted)" }}><X size={16} /></button>
            </div>
            <div className="px-5 py-4 space-y-3 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-semibold mb-1 block" style={{ color: "var(--text-muted)" }}>Kalit (key) *</label>
                  <input
                    className="w-full rounded-xl px-3 py-2 text-xs font-mono outline-none"
                    style={{ background: "var(--bg-primary)", color: "var(--text-primary)", border: "1px solid var(--border)" }}
                    placeholder="kimyo_analysis"
                    value={newPrompt.key}
                    onChange={e => setNewPrompt(p => ({ ...p, key: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold mb-1 block" style={{ color: "var(--text-muted)" }}>Nomi *</label>
                  <input
                    className="w-full rounded-xl px-3 py-2 text-xs outline-none"
                    style={{ background: "var(--bg-primary)", color: "var(--text-primary)", border: "1px solid var(--border)" }}
                    placeholder="Kimyo tahlili"
                    value={newPrompt.name}
                    onChange={e => setNewPrompt(p => ({ ...p, name: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-semibold mb-1 block" style={{ color: "var(--text-muted)" }}>Tavsif</label>
                <input
                  className="w-full rounded-xl px-3 py-2 text-xs outline-none"
                  style={{ background: "var(--bg-primary)", color: "var(--text-primary)", border: "1px solid var(--border)" }}
                  placeholder="Bu prompt nima uchun ishlatiladi..."
                  value={newPrompt.description}
                  onChange={e => setNewPrompt(p => ({ ...p, description: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold mb-1 block" style={{ color: "var(--text-muted)" }}>Kontent *</label>
                <textarea
                  className="w-full rounded-xl px-3 py-2.5 text-xs font-mono outline-none resize-y"
                  style={{ background: "var(--bg-primary)", color: "var(--text-primary)", border: "1px solid var(--border)", minHeight: "280px", lineHeight: "1.6" }}
                  placeholder="Prompt matnini yozing..."
                  value={newPrompt.content}
                  onChange={e => setNewPrompt(p => ({ ...p, content: e.target.value }))}
                  spellCheck={false}
                />
              </div>
            </div>
            <div className="px-5 py-4 flex gap-2" style={{ borderTop: "1px solid var(--border)" }}>
              <button onClick={() => setNewPromptModal(false)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold" style={{ background: "var(--bg-primary)", color: "var(--text-muted)" }}>
                Bekor
              </button>
              <button
                disabled={newPromptSaving || !newPrompt.key.trim() || !newPrompt.name.trim() || !newPrompt.content.trim()}
                onClick={async () => {
                  setNewPromptSaving(true);
                  try {
                    const res = await apiFetch("/api/admin/prompts", {
                      method: "POST",
                      body: JSON.stringify(newPrompt),
                    });
                    if (res.ok) {
                      const created = await res.json();
                      setPromptsList(list => [...list, created]);
                      setNewPromptModal(false);
                    }
                  } finally {
                    setNewPromptSaving(false);
                  }
                }}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all"
                style={{ background: "var(--accent)", color: "#fff", opacity: newPromptSaving || !newPrompt.key.trim() || !newPrompt.name.trim() || !newPrompt.content.trim() ? 0.5 : 1 }}
              >
                {newPromptSaving ? "Saqlanmoqda..." : "Yaratish"}
              </button>
            </div>
          </div>
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
