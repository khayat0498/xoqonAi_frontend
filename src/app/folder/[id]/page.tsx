"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, BookOpen, ChevronRight, Pencil, Trash2, MoreVertical, X } from "lucide-react";
import { getToken } from "@/lib/auth";
import { useT } from "@/lib/i18n-context";

const API = process.env.NEXT_PUBLIC_API_URL ?? "";
function authHeaders() {
  return { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` };
}

type FolderInfo = { id: string; name: string; icon: string | null };
type Subject = { id: string; name: string; icon: string | null; prompt: string; assignmentCount: number; createdAt: string };

const SUBJECT_ICONS = ["📖","📐","🔬","⚗️","🌍","💻","🎨","🏃","🎵","📝","🔢","🧪","📚","🌱","⚽"];
export default function FolderPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { t } = useT();
  const [folder, setFolder] = useState<FolderInfo | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editIcon, setEditIcon] = useState("📖");

  async function load() {
    const [foldersRes, subsRes] = await Promise.all([
      fetch(`${API}/api/folders`, { headers: authHeaders() }),
      fetch(`${API}/api/subjects?folderId=${id}`, { headers: authHeaders() }),
    ]);
    if (foldersRes.ok) {
      const folders: FolderInfo[] = await foldersRes.json();
      setFolder(folders.find(f => f.id === id) ?? null);
    }
    if (subsRes.ok) setSubjects(await subsRes.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, [id]);

  async function saveEdit(subjectId: string) {
    const res = await fetch(`${API}/api/subjects/${subjectId}`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ name: editName.trim(), icon: editIcon }),
    });
    if (res.ok) {
      setSubjects(prev => prev.map(s => s.id === subjectId ? { ...s, name: editName.trim(), icon: editIcon } : s));
    }
    setEditingId(null);
  }

  async function deleteSubject(subjectId: string) {
    setMenuOpen(null);
    await fetch(`${API}/api/subjects/${subjectId}`, { method: "DELETE", headers: authHeaders() });
    setSubjects(prev => prev.filter(s => s.id !== subjectId));
  }

  if (loading) return (
    <div className="flex items-center justify-center h-screen" style={{ background: "var(--bg-primary)" }}>
      <p style={{ color: "var(--text-muted)" }}>{t("common.loading")}</p>
    </div>
  );

  if (!folder) return (
    <div className="flex flex-col items-center justify-center h-screen gap-3" style={{ background: "var(--bg-primary)" }}>
      <p style={{ color: "var(--text-muted)" }}>{t("folder.notFound")}</p>
      <Link href="/home" style={{ color: "var(--accent)" }} className="text-sm font-medium">{t("folder.back")}</Link>
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
        <span className="text-2xl">{folder.icon || "📁"}</span>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-bold truncate" style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)" }}>
            {folder.name}
          </h1>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>{subjects.length} {t("folder.subjectsCount")}</p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 pb-28">
        {subjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 opacity-60">
            <BookOpen size={48} style={{ color: "var(--text-muted)" }} />
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>{t("folder.noSubjectsYet")}</p>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto flex flex-col gap-2">
            {subjects.map(subject => (
              <div key={subject.id} className="relative">
                {editingId === subject.id ? (
                  <div className="p-4 flex flex-col gap-3"
                    style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", boxShadow: "var(--shadow-clay-sm)" }}>
                    <div className="flex gap-2 flex-wrap">
                      {SUBJECT_ICONS.map(ic => (
                        <button key={ic} onClick={() => setEditIcon(ic)}
                          className="text-xl w-9 h-9 flex items-center justify-center"
                          style={{ borderRadius: "var(--radius-sm)", background: editIcon === ic ? "var(--accent-light)" : "transparent", border: editIcon === ic ? "2px solid var(--accent)" : "2px solid transparent" }}>
                          {ic}
                        </button>
                      ))}
                    </div>
                    <input autoFocus value={editName} onChange={e => setEditName(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") saveEdit(subject.id); if (e.key === "Escape") setEditingId(null); }}
                      className="clay-input w-full px-3 py-2 text-sm outline-none"
                      style={{ color: "var(--text-primary)" }} />
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => setEditingId(null)} className="px-3 py-1.5 text-sm"
                        style={{ color: "var(--text-muted)", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)" }}>
                        {t("home.cancelShort")}
                      </button>
                      <button onClick={() => saveEdit(subject.id)} className="px-3 py-1.5 text-sm font-bold text-white"
                        style={{ background: "var(--cta)", borderRadius: "var(--radius-sm)" }}>
                        {t("common.save")}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 px-4 py-3"
                    style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", boxShadow: "var(--shadow-clay-sm)" }}>
                    <Link href={`/subject/${subject.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 flex items-center justify-center text-xl shrink-0"
                        style={{ background: "var(--accent-light)", borderRadius: "var(--radius-sm)" }}>
                        {subject.icon || "📖"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>{subject.name}</p>
                        <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                          {subject.assignmentCount} {t("folder.assignmentsCount")}
                          {subject.prompt ? "" : ` · ${t("folder.noPrompt")}`}
                        </p>
                      </div>
                      <ChevronRight size={16} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
                    </Link>
                    <button onClick={() => setMenuOpen(menuOpen === subject.id ? null : subject.id)}
                      className="w-8 h-8 flex items-center justify-center shrink-0"
                      style={{ color: "var(--text-muted)" }}>
                      <MoreVertical size={16} />
                    </button>
                    {menuOpen === subject.id && (
                      <>
                        <div className="fixed inset-0 z-[90]" onClick={() => setMenuOpen(null)} />
                        <div className="absolute right-4 top-full mt-1 z-[95] py-1 animate-fade-in"
                          style={{ background: "var(--bg-card-solid, var(--bg-card))", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", boxShadow: "var(--shadow-clay)", minWidth: 150 }}>
                          <button onClick={() => { setEditingId(subject.id); setEditName(subject.name); setEditIcon(subject.icon || "📖"); setMenuOpen(null); }}
                            className="w-full text-left px-4 py-2.5 flex items-center gap-2.5 text-sm hover:bg-[var(--surface-hover)]"
                            style={{ color: "var(--text-primary)" }}>
                            <Pencil size={14} /> {t("home.edit")}
                          </button>
                          <button onClick={() => deleteSubject(subject.id)}
                            className="w-full text-left px-4 py-2.5 flex items-center gap-2.5 text-sm hover:bg-[var(--surface-hover)]"
                            style={{ color: "var(--error)" }}>
                            <Trash2 size={14} /> {t("home.delete")}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
