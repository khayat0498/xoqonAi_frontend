"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2, Info, Save, Edit3, BookOpen } from "lucide-react";
import { getToken } from "@/lib/auth";
import { useUserWS } from "@/lib/user-ws";

const API = process.env.NEXT_PUBLIC_API_URL;
const SUBJECTS = ["Kimyo", "Fizika", "Matematika", "Biologiya", "Informatika"];

type CustomPrompt = {
  id: string;
  title: string;
  subject: string;
  prompt: string;
  createdAt: string;
  updatedAt: string;
};

function authHeaders() {
  return { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` };
}

export default function ShaxsiyPromptPage() {
  const router = useRouter();
  const { lastEvent } = useUserWS();

  const [planKey, setPlanKey] = useState<string>("free");
  const [planLoading, setPlanLoading] = useState(true);
  const [list, setList] = useState<CustomPrompt[]>([]);
  const [listLoading, setListLoading] = useState(true);

  // Form holati
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState(SUBJECTS[0]!);
  const [prompt, setPrompt] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  // Plan tekshirish
  useEffect(() => {
    fetch(`${API}/api/billing/my-plan`, { headers: authHeaders() })
      .then(r => r.json())
      .then(d => setPlanKey(d.planKey ?? "free"))
      .catch(() => {})
      .finally(() => setPlanLoading(false));
  }, []);

  useEffect(() => {
    if (lastEvent?.type === "plan_updated") setPlanKey(lastEvent.data.planKey);
  }, [lastEvent]);

  // List yuklash
  useEffect(() => {
    if (planKey !== "pay_per_use") { setListLoading(false); return; }
    fetch(`${API}/api/custom-prompts`, { headers: authHeaders() })
      .then(r => r.ok ? r.json() : [])
      .then((rows: CustomPrompt[]) => setList(Array.isArray(rows) ? rows : []))
      .catch(() => {})
      .finally(() => setListLoading(false));
  }, [planKey]);

  const resetForm = () => {
    setEditingId(null); setTitle(""); setSubject(SUBJECTS[0]!); setPrompt(""); setErr(""); setFormOpen(false);
  };

  const openNew = () => {
    resetForm(); setFormOpen(true);
  };

  const openEdit = (p: CustomPrompt) => {
    setEditingId(p.id); setTitle(p.title); setSubject(p.subject); setPrompt(p.prompt); setErr(""); setFormOpen(true);
  };

  const save = async () => {
    if (title.trim().length < 2) return setErr("Nom kamida 2 ta belgi");
    if (title.trim().length > 100) return setErr("Nom 100 ta belgidan oshmasin");
    if (prompt.trim().length < 10) return setErr("Prompt kamida 10 ta belgi");
    if (prompt.trim().length > 5000) return setErr("Prompt 5000 ta belgidan oshmasin");

    setSaving(true); setErr("");
    try {
      const url = editingId ? `${API}/api/custom-prompts/${editingId}` : `${API}/api/custom-prompts`;
      const method = editingId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: authHeaders(),
        body: JSON.stringify({ title: title.trim(), subject: subject.trim(), prompt: prompt.trim() }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setErr(d.error ?? "Xato"); return;
      }
      const saved: CustomPrompt = await res.json();
      setList(prev => {
        if (editingId) return prev.map(p => p.id === saved.id ? saved : p);
        return [saved, ...prev];
      });
      resetForm();
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm("Promptni o'chirasizmi?")) return;
    const res = await fetch(`${API}/api/custom-prompts/${id}`, { method: "DELETE", headers: authHeaders() });
    if (res.ok) setList(prev => prev.filter(p => p.id !== id));
  };

  // Real-time length signal
  const len = prompt.trim().length;
  const lenSignal = useMemo(() => {
    if (len === 0) return null;
    if (len < 100) return { color: "var(--error)", bg: "var(--error-bg, #FEE2E2)", text: "🔴 Juda qisqa — narx oshadi, sifat tushadi" };
    if (len < 300) return { color: "var(--warning, #B45309)", bg: "var(--warning-bg, #FEF3C7)", text: "🟡 Yaxshi, lekin batafsilroq bersangiz aniqroq" };
    return { color: "var(--success, #047857)", bg: "var(--success-bg, #D1FAE5)", text: "🟢 A'lo tafsilot — sifat yuqori" };
  }, [len]);

  // Sub: groupped by subject
  const grouped = useMemo(() => {
    const out: Record<string, CustomPrompt[]> = {};
    for (const p of list) (out[p.subject] ??= []).push(p);
    return out;
  }, [list]);

  if (planLoading) {
    return <div className="flex-1 flex items-center justify-center" style={{ color: "var(--text-muted)" }}>Yuklanmoqda...</div>;
  }

  if (planKey !== "pay_per_use") {
    return (
      <div className="flex flex-col h-screen" style={{ background: "var(--bg-primary)" }}>
        <Header onBack={() => router.back()} />
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="text-center max-w-sm">
            <div className="text-5xl mb-4">🔒</div>
            <h2 className="text-lg font-bold mb-2" style={{ color: "var(--text-primary)" }}>Faqat Hamyon tarifida</h2>
            <p className="text-sm mb-5" style={{ color: "var(--text-muted)" }}>
              Shaxsiy promptlar pay-per-use (Hamyon) tarifida foydalanuvchilar uchun mavjud. Tarifni yangilang.
            </p>
            <button
              onClick={() => router.push("/plans")}
              className="px-5 py-2.5 rounded-lg text-sm font-bold"
              style={{ background: "var(--accent)", color: "#fff" }}
            >
              Tarif rejalari
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen" style={{ background: "var(--bg-primary)" }}>
      <Header onBack={() => router.back()} />

      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-5 pb-28 max-w-2xl mx-auto w-full flex flex-col gap-4">

          {/* Yangi qo'shish tugmasi */}
          {!formOpen && (
            <button
              onClick={openNew}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold"
              style={{ background: "var(--accent)", color: "#fff", boxShadow: "var(--shadow-clay-sm)" }}
            >
              <Plus size={16} />
              Yangi prompt qo'shish
            </button>
          )}

          {/* Form */}
          {formOpen && (
            <div
              className="p-4 flex flex-col gap-3 rounded-xl"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-clay-sm)" }}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                  {editingId ? "Promptni tahrirlash" : "Yangi prompt"}
                </h3>
                <button onClick={resetForm} className="text-xs" style={{ color: "var(--text-muted)" }}>Bekor</button>
              </div>

              {/* Title */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>Nom</label>
                <input
                  type="text"
                  placeholder="Masalan: 10-sinf test qoidasi"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  maxLength={100}
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ background: "var(--bg-primary)", color: "var(--text-primary)", border: "1px solid var(--border)" }}
                />
              </div>

              {/* Subject */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>Fan</label>
                <select
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ background: "var(--bg-primary)", color: "var(--text-primary)", border: "1px solid var(--border)" }}
                >
                  {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {/* Prompt label + (i) ikona */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>Prompt matni</label>
                  <button
                    type="button"
                    onClick={() => setShowInfo(s => !s)}
                    className="w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ background: showInfo ? "var(--accent-light)" : "var(--bg-primary)", border: "1px solid var(--border)" }}
                    title="Ma'lumot"
                  >
                    <Info size={11} style={{ color: showInfo ? "var(--accent)" : "var(--text-muted)" }} />
                  </button>
                </div>
                {showInfo && (
                  <div className="p-3 rounded-lg text-xs leading-relaxed" style={{ background: "var(--accent-light)", border: "1px solid var(--accent)", color: "var(--text-primary)" }}>
                    <p className="font-semibold mb-1">Aniqroq yozsangiz — sifat oshadi, narx kamayadi.</p>
                    <p style={{ color: "var(--text-muted)" }}>
                      Noaniq prompt → AI ko'p ehtimollarni hisoblashga majbur → token sarfi 3-5 baravar oshadi va xato ko'payadi.
                      <br/><br/>
                      Yozing: <b>mavzu</b>, <b>savol turlari</b> (variantli/yozma), <b>ball taqsimoti</b>, <b>hisoblash usuli</b>.
                    </p>
                  </div>
                )}
                <textarea
                  placeholder={`Misol:\n\n1-12 savollar — variantli test, har biri 2 ball.\n13-16 savollar — yozma yechim, har biri 3 ball.\nJami 32 ball.\n\nYozma savollarni qadam-baqadam tekshiring, yechim ko'rsatilmasa 0 ball.\nVariantlilarda faqat harf solishtiring.`}
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  rows={12}
                  maxLength={5000}
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-y font-mono"
                  style={{ background: "var(--bg-primary)", color: "var(--text-primary)", border: "1px solid var(--border)" }}
                />
                {/* Real-time length chip */}
                <div className="flex items-center justify-between">
                  {lenSignal ? (
                    <span
                      className="text-[11px] font-semibold px-2 py-1 rounded-full"
                      style={{ background: lenSignal.bg, color: lenSignal.color }}
                    >
                      {lenSignal.text}
                    </span>
                  ) : <span/>}
                  <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>{len} / 5000</span>
                </div>
              </div>

              {err && <p className="text-xs" style={{ color: "var(--error)" }}>{err}</p>}

              <div className="flex gap-2">
                <button
                  onClick={save}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold"
                  style={{ background: "var(--accent)", color: "#fff", opacity: saving ? 0.6 : 1 }}
                >
                  <Save size={14} />
                  {saving ? "Saqlanmoqda..." : (editingId ? "Yangilash" : "Saqlash")}
                </button>
              </div>
            </div>
          )}

          {/* Ro'yxat — fan bo'yicha guruhlangan */}
          {listLoading ? (
            <p className="text-center text-xs py-6" style={{ color: "var(--text-muted)" }}>Yuklanmoqda...</p>
          ) : list.length === 0 ? (
            <div className="text-center py-10">
              <div className="text-4xl mb-2">📝</div>
              <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Hali shaxsiy prompt yo'q</p>
              <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                Yuqoridagi tugma orqali birinchi promptni qo'shing
              </p>
            </div>
          ) : (
            Object.entries(grouped).map(([subj, items]) => (
              <div key={subj} className="flex flex-col gap-2">
                <div className="flex items-center gap-2 px-1">
                  <BookOpen size={12} style={{ color: "var(--text-muted)" }} />
                  <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>{subj}</h4>
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>· {items.length}</span>
                </div>
                <div className="flex flex-col gap-2">
                  {items.map(p => (
                    <div
                      key={p.id}
                      className="p-3 flex items-start gap-3 rounded-xl"
                      style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{p.title}</p>
                        <p className="text-xs mt-1 line-clamp-2" style={{ color: "var(--text-muted)" }}>{p.prompt}</p>
                        <p className="text-[10px] mt-1.5" style={{ color: "var(--text-muted)" }}>
                          {new Date(p.updatedAt).toLocaleDateString("uz-UZ")} · {p.prompt.length} belgi
                        </p>
                      </div>
                      <div className="flex flex-col gap-1.5 shrink-0">
                        <button
                          onClick={() => openEdit(p)}
                          className="p-1.5 rounded-lg"
                          style={{ background: "var(--bg-primary)", color: "var(--text-muted)" }}
                          title="Tahrirlash"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          onClick={() => remove(p.id)}
                          className="p-1.5 rounded-lg"
                          style={{ background: "rgba(248,113,113,0.1)", color: "#f87171" }}
                          title="O'chirish"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}

        </div>
      </div>
    </div>
  );
}

function Header({ onBack }: { onBack: () => void }) {
  return (
    <div
      className="shrink-0 px-5 py-4 flex items-center gap-3 relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, var(--accent-dark) 0%, var(--accent) 60%, var(--accent-hover) 100%)",
        boxShadow: "6px 6px 14px rgba(53,120,136,0.25), inset -2px -2px 6px rgba(0,0,0,0.08), inset 2px 2px 6px rgba(255,255,255,0.12)",
      }}
    >
      <div style={{ position: "absolute", right: -25, top: -30, width: 100, height: 100, borderRadius: "50%", background: "rgba(255,255,255,0.12)", pointerEvents: "none" }} />
      <button
        onClick={onBack}
        className="w-9 h-9 flex items-center justify-center shrink-0"
        style={{ background: "rgba(255,255,255,0.18)", borderRadius: "var(--radius-sm)", color: "#fff" }}
      >
        <ArrowLeft size={18} />
      </button>
      <div className="flex-1 min-w-0">
        <h1 className="text-lg font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>Shaxsiy promptlar</h1>
        <p className="text-[11px] text-white/80">Sizning AI tekshirish qoidalaringiz</p>
      </div>
    </div>
  );
}
