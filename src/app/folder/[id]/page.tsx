"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, FileText, MoreVertical, Trash2, FolderInput, X, Clock } from "lucide-react";
import { getToken } from "@/lib/auth";
import ViewToggle from "@/components/ViewToggle";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
function authHeaders() {
  return { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` };
}

type FolderInfo = { id: string; name: string; icon: string | null; submissionCount: number };
type Submission = {
  id: string;
  studentName: string | null;
  subject: string | null;
  status: string;
  grade: string | null;
  score: number | null;
  createdAt: string;
};

export default function FolderPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [folder, setFolder] = useState<FolderInfo | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [foldersRes, subsRes] = await Promise.all([
        fetch(`${API}/api/folders`, { headers: authHeaders() }),
        fetch(`${API}/api/submissions?folderId=${id}&limit=100`, { headers: authHeaders() }),
      ]);

      if (foldersRes.ok) {
        const folders: FolderInfo[] = await foldersRes.json();
        const found = folders.find((f) => f.id === id) ?? null;
        setFolder(found);
      }

      if (subsRes.ok) {
        const data = await subsRes.json();
        setSubmissions(data.data ?? []);
      }

      setLoading(false);
    }
    load();
  }, [id]);

  async function handleDelete(subId: string) {
    setMenuOpen(null);
    setDeletingId(subId);
    await fetch(`${API}/api/submissions/${subId}`, { method: "DELETE", headers: authHeaders() });
    setSubmissions((prev) => prev.filter((s) => s.id !== subId));
    setDeletingId(null);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ background: "var(--bg-primary)" }}>
        <p style={{ color: "var(--text-muted)" }}>Yuklanmoqda...</p>
      </div>
    );
  }

  if (!folder) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-3" style={{ background: "var(--bg-primary)" }}>
        <p style={{ color: "var(--text-muted)" }}>Papka topilmadi</p>
        <Link href="/home?tab=jildlar" className="text-sm font-medium" style={{ color: "var(--accent)" }}>Orqaga</Link>
      </div>
    );
  }

  function scoreColor(s: Submission) {
    if (s.status === "failed") return { color: "var(--error)", bg: "rgba(224,92,92,0.12)" };
    if (s.status !== "done") return { color: "#ca8a04", bg: "rgba(234,179,8,0.12)" };
    const n = s.score ?? 0;
    if (n >= 80) return { color: "var(--success)", bg: "rgba(61,189,125,0.12)" };
    if (n >= 60) return { color: "var(--accent)", bg: "var(--accent-light)" };
    if (n >= 40) return { color: "var(--warning)", bg: "rgba(229,168,50,0.12)" };
    return { color: "var(--error)", bg: "rgba(224,92,92,0.12)" };
  }

  function scoreLabel(s: Submission) {
    if (s.status === "failed") return "!";
    if (s.status === "pending" || s.status === "processing") return "⏱";
    return s.score != null ? String(s.score) : "—";
  }

  return (
    <div className="bg-grid flex flex-col h-screen">
      {/* Header */}
      <div
        className="px-4 py-3.5 flex items-center gap-3 shrink-0"
        style={{
          background: "var(--bg-card)",
          borderBottom: "1px solid var(--border)",
          boxShadow: "var(--shadow-clay-sm)",
        }}
      >
        <button
          onClick={() => router.back()}
          className="w-9 h-9 flex items-center justify-center"
          style={{
            background: "var(--bg-card)",
            color: "var(--text-secondary)",
            borderRadius: "var(--radius-sm)",
            boxShadow: "var(--shadow-clay-sm)",
            border: "1px solid var(--border)",
          }}
        >
          <ArrowLeft size={16} />
        </button>
        <span className="text-2xl">{folder.icon || "📁"}</span>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-bold truncate" style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)" }}>
            {folder.name}
          </h1>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            {submissions.length} ta tahlil
          </p>
        </div>
        <ViewToggle view={viewMode} onChange={setViewMode} />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 pb-28">
        {submissions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 opacity-60">
            <FileText size={48} style={{ color: "var(--text-muted)" }} />
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Hozircha tahlillar yo'q</p>
          </div>
        ) : viewMode === "list" ? (
          <div className="max-w-2xl mx-auto flex flex-col gap-2">
            {submissions.map((sub) => {
              const { color, bg } = scoreColor(sub);
              return (
                <div
                  key={sub.id}
                  className="flex items-center gap-3 px-4 py-3"
                  style={{
                    background: "var(--bg-card)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-sm)",
                    boxShadow: "var(--shadow-clay-sm)",
                    opacity: deletingId === sub.id ? 0.4 : 1,
                  }}
                >
                  <div
                    className="w-10 h-10 flex items-center justify-center shrink-0 text-sm font-bold"
                    style={{ background: bg, color, borderRadius: "var(--radius-sm)" }}
                  >
                    {sub.status === "pending" || sub.status === "processing"
                      ? <Clock size={16} />
                      : scoreLabel(sub)}
                  </div>
                  <Link href={`/submission/${sub.id}`} className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                      {sub.studentName ?? "O'quvchi"}
                    </p>
                    <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                      {sub.subject ?? "Tahlil"} · {new Date(sub.createdAt).toLocaleDateString("uz")}
                    </p>
                  </Link>
                  <button
                    onClick={() => setMenuOpen(menuOpen === sub.id ? null : sub.id)}
                    className="w-8 h-8 flex items-center justify-center shrink-0"
                    style={{ color: "var(--text-muted)" }}
                  >
                    <MoreVertical size={16} />
                  </button>
                  {menuOpen === sub.id && (
                    <>
                      <div className="fixed inset-0 z-[90]" onClick={() => setMenuOpen(null)} />
                      <div
                        className="absolute right-4 z-[95] py-1 animate-fade-in"
                        style={{
                          background: "var(--bg-card-solid, var(--bg-card))",
                          border: "1px solid var(--border)",
                          borderRadius: "var(--radius-sm)",
                          boxShadow: "var(--shadow-clay)",
                          minWidth: 150,
                          top: "100%",
                          marginTop: 4,
                        }}
                      >
                        <Link
                          href={`/submission/${sub.id}`}
                          className="w-full text-left px-4 py-2.5 flex items-center gap-2.5 text-sm hover:bg-[var(--surface-hover)]"
                          style={{ color: "var(--text-primary)" }}
                          onClick={() => setMenuOpen(null)}
                        >
                          <FileText size={14} /> Ko'rish
                        </Link>
                        <button
                          onClick={() => handleDelete(sub.id)}
                          className="w-full text-left px-4 py-2.5 flex items-center gap-2.5 text-sm hover:bg-[var(--surface-hover)]"
                          style={{ color: "var(--error)" }}
                        >
                          <Trash2 size={14} /> O'chirish
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="max-w-2xl mx-auto grid grid-cols-2 md:grid-cols-3 gap-3">
            {submissions.map((sub) => {
              const { color, bg } = scoreColor(sub);
              return (
                <Link
                  key={sub.id}
                  href={`/submission/${sub.id}`}
                  className="flex flex-col items-center gap-2 p-4"
                  style={{
                    background: "var(--bg-card)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-md)",
                    boxShadow: "var(--shadow-clay-sm)",
                  }}
                >
                  <div
                    className="w-12 h-12 flex items-center justify-center text-base font-bold"
                    style={{ background: bg, color, borderRadius: "var(--radius-sm)" }}
                  >
                    {sub.status === "pending" || sub.status === "processing"
                      ? <Clock size={18} />
                      : scoreLabel(sub)}
                  </div>
                  <p className="text-sm font-semibold text-center truncate w-full" style={{ color: "var(--text-primary)" }}>
                    {sub.studentName ?? "O'quvchi"}
                  </p>
                  <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                    {sub.subject ?? "Tahlil"}
                  </p>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
