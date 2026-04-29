"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Plus, X, ChevronRight, Check, Pencil, Trash2, MoreVertical, ClipboardList } from "lucide-react";
import { getToken } from "@/lib/auth";
import { useT } from "@/lib/i18n-context";

const API = process.env.NEXT_PUBLIC_API_URL ?? "";
function authHeaders() {
  return { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` };
}

type Subject = { id: string; name: string; icon: string | null; prompt: string; folderId: string | null };
type Assignment = { id: string; name: string; condition: string; submissionCount: number; createdAt: string };

export default function SubjectPage() {
  const { t } = useT();
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [subject, setSubject] = useState<Subject | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  // Prompt editing
  const [editingPrompt, setEditingPrompt] = useState(false);
  const [promptText, setPromptText] = useState("");
  const [savingPrompt, setSavingPrompt] = useState(false);
  const [promptSaved, setPromptSaved] = useState(false);

  // Assignment creating
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCondition, setNewCondition] = useState("");
  const [saving, setSaving] = useState(false);

  // Menu
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  async function load() {
    const [subRes, asgRes] = await Promise.all([
      fetch(`${API}/api/subjects/${id}`, { headers: authHeaders() }),
      fetch(`${API}/api/assignments?subjectId=${id}`, { headers: authHeaders() }),
    ]);
    if (subRes.ok) {
      const s = await subRes.json();
      setSubject(s);
      setPromptText(s.prompt ?? "");
    }
    if (asgRes.ok) setAssignments(await asgRes.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, [id]);

  async function savePrompt() {
    setSavingPrompt(true);
    const res = await fetch(`${API}/api/subjects/${id}`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ prompt: promptText }),
    });
    if (res.ok) {
      setSubject(prev => prev ? { ...prev, prompt: promptText } : prev);
      setPromptSaved(true);
      setTimeout(() => { setPromptSaved(false); setEditingPrompt(false); }, 1500);
    }
    setSavingPrompt(false);
  }

  async function createAssignment() {
    if (!newName.trim()) return;
    setSaving(true);
    const res = await fetch(`${API}/api/assignments`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ name: newName.trim(), condition: newCondition.trim(), subjectId: id }),
    });
    if (res.ok) {
      const asg = await res.json();
      setAssignments(prev => [...prev, { ...asg, submissionCount: 0 }]);
      setCreating(false);
      setNewName("");
      setNewCondition("");
    }
    setSaving(false);
  }

  async function deleteAssignment(asgId: string) {
    setMenuOpen(null);
    await fetch(`${API}/api/assignments/${asgId}`, { method: "DELETE", headers: authHeaders() });
    setAssignments(prev => prev.filter(a => a.id !== asgId));
  }

  if (loading) return (
    <div className="flex items-center justify-center h-screen" style={{ background: "var(--bg-primary)" }}>
      <p style={{ color: "var(--text-muted)" }}>{t("common.loading")}</p>
    </div>
  );

  if (!subject) return (
    <div className="flex flex-col items-center justify-center h-screen gap-3" style={{ background: "var(--bg-primary)" }}>
      <p style={{ color: "var(--text-muted)" }}>{t("subject.notFound")}</p>
      <button onClick={() => router.back()} style={{ color: "var(--accent)" }} className="text-sm font-medium">{t("folder.back")}</button>
    </div>
  );

  return (
    <div className="flex flex-col h-screen" style={{ background: "var(--bg-primary)" }}>
      {/* Header */}
      <div className="px-4 py-3.5 flex items-center gap-3 shrink-0"
        style={{ background: "var(--bg-card)", borderBottom: "1px solid var(--border)", boxShadow: "var(--shadow-clay-sm)" }}>
        <button onClick={() => router.back()}
          className="w-9 h-9 flex items-center justify-center"
          style={{ background: "var(--bg-card)", color: "var(--text-secondary)", borderRadius: "var(--radius-sm)", boxShadow: "var(--shadow-clay-sm)", border: "1px solid var(--border)" }}>
          <ArrowLeft size={16} />
        </button>
        <span className="text-2xl">{subject.icon || "📖"}</span>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-bold truncate" style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)" }}>
            {subject.name}
          </h1>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>{assignments.length} {t("subject.assignmentsCount")}</p>
        </div>
        <button onClick={() => setCreating(true)}
          className="flex items-center gap-1.5 text-sm px-3 py-2 font-bold text-white"
          style={{ background: "var(--cta)", borderRadius: "var(--radius-sm)", boxShadow: "var(--shadow-clay-sm)" }}>
          <Plus size={15} /> {t("subject.newAssignment")}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pb-28">
        {/* Prompt kartasi */}
        <div className="p-4 max-w-2xl mx-auto">
          <div className="p-4 flex flex-col gap-3"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-clay-sm)" }}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                {t("subject.subjectPrompt")}
              </span>
              {!editingPrompt && (
                <button onClick={() => setEditingPrompt(true)}
                  className="flex items-center gap-1 text-xs font-medium"
                  style={{ color: "var(--accent)" }}>
                  <Pencil size={12} /> {t("subject.edit")}
                </button>
              )}
            </div>

            {editingPrompt ? (
              <>
                <textarea
                  autoFocus
                  value={promptText}
                  onChange={e => setPromptText(e.target.value)}
                  rows={8}
                  placeholder={t("subject.promptPlaceholder")}
                  className="w-full px-3 py-2.5 text-sm outline-none resize-none"
                  style={{
                    background: "var(--bg-primary)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-sm)",
                    color: "var(--text-primary)",
                    fontFamily: "var(--font-body)",
                    lineHeight: 1.6,
                  }}
                />
                <div className="flex gap-2 justify-end">
                  <button onClick={() => { setEditingPrompt(false); setPromptText(subject.prompt ?? ""); }}
                    className="px-3 py-1.5 text-sm"
                    style={{ color: "var(--text-muted)", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)" }}>
                    {t("subject.cancel")}
                  </button>
                  <button onClick={savePrompt} disabled={savingPrompt}
                    className="px-3 py-1.5 text-sm font-bold flex items-center gap-1.5"
                    style={{ background: promptSaved ? "var(--success)" : "var(--cta)", color: "#fff", borderRadius: "var(--radius-sm)", opacity: savingPrompt ? 0.7 : 1 }}>
                    {promptSaved ? <><Check size={14} /> {t("subject.saved")}</> : t("subject.save")}
                  </button>
                </div>
              </>
            ) : (
              <p className="text-sm leading-relaxed" style={{ color: subject.prompt ? "var(--text-secondary)" : "var(--text-muted)", fontStyle: subject.prompt ? "normal" : "italic" }}>
                {subject.prompt || t("subject.noPromptHint")}
              </p>
            )}
          </div>
        </div>

        {/* Topshiriqlar */}
        <div className="px-4 max-w-2xl mx-auto flex flex-col gap-2">
          {assignments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 opacity-60">
              <ClipboardList size={40} style={{ color: "var(--text-muted)" }} />
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>{t("subject.noAssignmentsYet")}</p>
              <button onClick={() => setCreating(true)} className="text-sm font-medium" style={{ color: "var(--accent)" }}>
                {t("subject.addAssignment")}
              </button>
            </div>
          ) : assignments.map(asg => (
            <div key={asg.id} className="relative flex items-center gap-3 px-4 py-3"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", boxShadow: "var(--shadow-clay-sm)" }}>
              <Link href={`/assignment/${asg.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 flex items-center justify-center shrink-0"
                  style={{ background: "rgba(104,117,245,0.1)", borderRadius: "var(--radius-sm)" }}>
                  <ClipboardList size={18} style={{ color: "var(--cta)" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>{asg.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                    {asg.submissionCount} {t("subject.studentsCount")}
                    {asg.condition ? ` · ${t("subject.hasProblem")}` : ""}
                  </p>
                </div>
                <ChevronRight size={16} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
              </Link>
              <button onClick={() => setMenuOpen(menuOpen === asg.id ? null : asg.id)}
                className="w-8 h-8 flex items-center justify-center shrink-0"
                style={{ color: "var(--text-muted)" }}>
                <MoreVertical size={16} />
              </button>
              {menuOpen === asg.id && (
                <>
                  <div className="fixed inset-0 z-[90]" onClick={() => setMenuOpen(null)} />
                  <div className="absolute right-4 top-full mt-1 z-[95] py-1 animate-fade-in"
                    style={{ background: "var(--bg-card-solid, var(--bg-card))", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", boxShadow: "var(--shadow-clay)", minWidth: 150 }}>
                    <button onClick={() => deleteAssignment(asg.id)}
                      className="w-full text-left px-4 py-2.5 flex items-center gap-2.5 text-sm hover:bg-[var(--surface-hover)]"
                      style={{ color: "var(--error)" }}>
                      <Trash2 size={14} /> {t("subject.delete")}
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Topshiriq yaratish modal */}
      {creating && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
          onClick={e => { if (e.target === e.currentTarget) setCreating(false); }}>
          <div className="w-full max-w-sm animate-fade-in"
            style={{ background: "var(--bg-card-solid, var(--bg-card))", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-clay)", overflow: "hidden" }}>
            <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border)" }}>
              <span className="text-base font-bold" style={{ color: "var(--text-primary)" }}>{t("subject.newAssignmentTitle")}</span>
              <button onClick={() => setCreating(false)} className="w-8 h-8 flex items-center justify-center"
                style={{ color: "var(--text-muted)", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)" }}>
                <X size={16} />
              </button>
            </div>
            <div className="px-5 py-4 flex flex-col gap-3">
              <input autoFocus value={newName} onChange={e => setNewName(e.target.value)}
                placeholder={t("subject.namePlaceholder")}
                className="clay-input w-full px-4 py-3 text-sm outline-none"
                style={{ color: "var(--text-primary)" }} />
              <textarea value={newCondition} onChange={e => setNewCondition(e.target.value)}
                placeholder={t("subject.conditionPlaceholder")}
                rows={4}
                className="w-full px-3 py-2.5 text-sm outline-none resize-none"
                style={{ background: "var(--bg-primary)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", color: "var(--text-primary)", lineHeight: 1.6 }} />
              <button onClick={createAssignment} disabled={saving || !newName.trim()}
                className="w-full py-3 text-sm font-bold text-white"
                style={{ background: "var(--cta)", borderRadius: "var(--radius-sm)", opacity: saving || !newName.trim() ? 0.6 : 1 }}>
                {saving ? t("subject.saving") : t("subject.create")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
