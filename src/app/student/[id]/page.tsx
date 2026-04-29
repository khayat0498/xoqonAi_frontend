"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Camera, CheckCircle2, TrendingUp, Pencil, X, Clock, BarChart2 } from "lucide-react";
import { getToken } from "@/lib/auth";
import { useT } from "@/lib/i18n-context";

const API = process.env.NEXT_PUBLIC_API_URL;
function authHeaders() {
  return { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` };
}

const avatarColors = ["#1a5c6b","#6366F1","#e8732a","#2a9d6a","#3B82F6","#8B5CF6","#EC4899","#d4a017"];

type Student = { id: string; name: string; telegramId: string | null; classCount: number; createdAt: string };
type Submission = { id: string; subject: string | null; status: string; score: number | null; createdAt: string };

export default function StudentProfilePage() {
  const { t } = useT();
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const backUrl = searchParams.get("from") ?? "/home";

  const [student, setStudent] = useState<Student | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [editName, setEditName] = useState("");
  const [editTgId, setEditTgId] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [sRes, subRes] = await Promise.all([
          fetch(`${API}/api/students/${id}`, { headers: authHeaders() }),
          fetch(`${API}/api/submissions?studentId=${id}&limit=20`, { headers: authHeaders() }),
        ]);
        if (sRes.ok) setStudent(await sRes.json());
        if (subRes.ok) {
          const data = await subRes.json();
          setSubmissions(data.data ?? []);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const saveEdit = async () => {
    if (!editName.trim() || !student) return;
    setSaving(true);
    const res = await fetch(`${API}/api/students/${id}`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ name: editName.trim(), telegramId: editTgId.trim() || null }),
    });
    if (res.ok) {
      const updated = await res.json();
      setStudent(updated);
      setShowEdit(false);
    }
    setSaving(false);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-screen" style={{ background: "var(--bg-primary)" }}>
      <div className="w-6 h-6 border-2 border-transparent rounded-full animate-spin" style={{ borderTopColor: "var(--accent)" }} />
    </div>
  );

  if (!student) return (
    <div className="flex flex-col items-center justify-center h-screen gap-4" style={{ background: "var(--bg-primary)" }}>
      <p style={{ color: "var(--text-muted)" }}>{t("student.notFound")}</p>
      <button onClick={() => router.push(backUrl)} className="text-sm" style={{ color: "var(--accent)" }}>{t("folder.back")}</button>
    </div>
  );

  const initials = student.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  const avatarColor = avatarColors[student.id.charCodeAt(0) % avatarColors.length];
  const doneSubmissions = submissions.filter(s => s.status === "done");
  const avgScore = doneSubmissions.length
    ? Math.round(doneSubmissions.reduce((s, sub) => s + (sub.score ?? 0), 0) / doneSubmissions.length)
    : 0;

  return (
    <div className="flex flex-col h-screen" style={{ background: "var(--bg-primary)" }}>

      {/* Header */}
      <div className="px-5 pt-4 pb-8 flex items-center gap-3 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, var(--accent-dark) 0%, var(--accent) 60%, var(--accent-hover) 100%)", boxShadow: "var(--shadow-clay)", zIndex: 10 }}>
        <div style={{ position: "absolute", right: -20, top: -30, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.07)" }} />
        <div style={{ position: "absolute", right: 50, bottom: -20, width: 70, height: 70, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
        <button onClick={() => router.push(backUrl)}
          className="w-8 h-8 rounded-xl flex items-center justify-center relative"
          style={{ background: "rgba(255,255,255,0.18)", color: "#fff" }}>
          <ArrowLeft size={16} />
        </button>
        <h1 className="flex-1 text-base font-semibold text-white relative" style={{ fontFamily: "var(--font-display)" }}>
          {t("student.profile")}
        </h1>
        <button
          onClick={() => { setShowEdit(true); setEditName(student.name); setEditTgId(student.telegramId ?? ""); }}
          className="w-8 h-8 rounded-xl flex items-center justify-center relative"
          style={{ background: "rgba(255,255,255,0.18)", color: "#fff" }}>
          <Pencil size={15} />
        </button>
        <button
          onClick={() => router.push(`/student/${student.id}/stats`)}
          className="w-8 h-8 rounded-xl flex items-center justify-center relative"
          style={{ background: "rgba(255,255,255,0.18)", color: "#fff" }}>
          <BarChart2 size={15} />
        </button>
        <button
          onClick={() => router.push(`/home?camera=1&studentId=${student.id}&studentName=${encodeURIComponent(student.name)}`)}
          className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-xl font-medium relative"
          style={{ background: "rgba(255,255,255,0.18)", color: "#fff" }}>
          <Camera size={14} />
          {t("student.check")}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-6 pb-8 max-w-lg mx-auto w-full flex flex-col gap-4">

        {/* Profile card */}
        <div className="p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-clay)" }}>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 flex items-center justify-center text-white text-xl font-bold shrink-0"
              style={{ background: avatarColor, borderRadius: "var(--radius-md)" }}>
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)" }}>
                {student.name}
              </h2>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                {student.classCount > 0 ? `${student.classCount} ${t("student.classesCount")}` : t("student.noClasses")}
              </p>
              {student.telegramId && (
                <p className="text-xs mt-1.5 flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
                  <span style={{ color: "#229ED9" }}>✈</span> {student.telegramId}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { label: t("student.analyses"), value: doneSubmissions.length, icon: CheckCircle2, color: "var(--accent)", bg: "var(--accent-light)" },
            { label: t("student.average"), value: `${avgScore}%`, icon: TrendingUp, color: "var(--success)", bg: "rgba(61,189,125,0.12)" },
            { label: t("student.total"), value: submissions.length, icon: Clock, color: "var(--text-secondary)", bg: "var(--bg-card)" },
          ].map(({ label, value, icon: Icon, color, bg }, i) => (
            <div key={i} className="p-3 text-center" style={{ background: bg, borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }}>
              <Icon size={16} className="mx-auto mb-1" style={{ color }} />
              <p className="text-base font-bold" style={{ color }}>{value}</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{label}</p>
            </div>
          ))}
        </div>

        {/* So'nggi tahlillar */}
        <div>
          <p className="text-sm font-semibold mb-2.5" style={{ color: "var(--text-primary)" }}>{t("student.recentAnalyses")}</p>
          {submissions.length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: "var(--text-muted)" }}>{t("student.noAnalysesYet")}</p>
          ) : (
            <div className="flex flex-col gap-2">
              {submissions.map(sub => (
                <Link key={sub.id} href={`/submission/${sub.id}?from=/student/${id}${backUrl !== "/home" ? `?from=${encodeURIComponent(backUrl)}` : ""}`}
                  className="px-4 py-3 flex items-center gap-3"
                  style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", boxShadow: "var(--shadow-clay-sm)" }}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                      {sub.subject ?? t("student.analysisDefault")}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                      {new Date(sub.createdAt).toLocaleDateString("uz-UZ")}
                    </p>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-lg shrink-0"
                    style={{
                      background: sub.status === "done" ? "rgba(61,189,125,0.12)" : sub.status === "failed" ? "rgba(224,92,92,0.1)" : "var(--bg-primary)",
                      color: sub.status === "done" ? "var(--success)" : sub.status === "failed" ? "var(--error)" : "var(--text-muted)",
                    }}>
                    {sub.status === "done" ? `${sub.score ?? 0}%` : sub.status === "failed" ? t("student.statusError") : t("student.statusWaiting")}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit modal */}
      {showEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.25)", backdropFilter: "blur(6px)" }}
          onClick={e => e.target === e.currentTarget && setShowEdit(false)}>
          <div className="w-full max-w-sm p-5"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-clay)" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)" }}>
                {t("student.editStudent")}
              </h2>
              <button onClick={() => setShowEdit(false)}
                className="w-8 h-8 flex items-center justify-center"
                style={{ borderRadius: "var(--radius-sm)", background: "var(--bg-primary)", border: "1px solid var(--border)", color: "var(--text-muted)" }}>
                <X size={15} />
              </button>
            </div>
            <div className="flex flex-col gap-3">
              <div>
                <p className="text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>{t("student.name")}</p>
                <input autoFocus value={editName} onChange={e => setEditName(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && saveEdit()}
                  placeholder={t("student.fullName")}
                  className="w-full px-3 py-2.5 text-sm outline-none"
                  style={{ borderRadius: "var(--radius-sm)", background: "var(--bg-primary)", border: "1px solid var(--border)", color: "var(--text-primary)" }} />
              </div>
              <div>
                <p className="text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>{t("student.telegramId")}</p>
                <input value={editTgId} onChange={e => setEditTgId(e.target.value)}
                  placeholder={t("student.telegramIdPlaceholder")}
                  className="w-full px-3 py-2.5 text-sm outline-none"
                  style={{ borderRadius: "var(--radius-sm)", background: "var(--bg-primary)", border: "1px solid var(--border)", color: "var(--text-primary)" }} />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setShowEdit(false)} className="flex-1 py-2.5 text-sm"
                style={{ borderRadius: "var(--radius-sm)", background: "var(--bg-primary)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
                {t("student.cancel")}
              </button>
              <button onClick={saveEdit} disabled={saving} className="flex-1 py-2.5 text-sm font-medium"
                style={{ borderRadius: "var(--radius-sm)", background: "var(--cta)", color: "#fff", opacity: saving ? 0.7 : 1 }}>
                {saving ? t("student.saving") : t("student.save")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
