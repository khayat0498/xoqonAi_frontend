"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Clock, CheckCircle2, AlertCircle, ChevronRight, FileText, Pencil, X, Check, RefreshCw, Sparkles } from "lucide-react";
import { getToken } from "@/lib/auth";
import { useT } from "@/lib/i18n-context";
import { useUserWS } from "@/lib/user-ws";

const API = process.env.NEXT_PUBLIC_API_URL ?? "";
function authHeaders() {
  return { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` };
}

type EtalonStatus = "pending" | "ready" | "failed" | null;
type Assignment = {
  id: string;
  name: string;
  condition: string;
  subjectId: string;
  etalonStatus?: EtalonStatus;
  etalonGeneratedAt?: string | null;
  etalonError?: string | null;
};
type Submission = {
  id: string;
  studentName: string | null;
  subject: string | null;
  status: string;
  score: number | null;
  grade: string | null;
  createdAt: string;
};

export default function AssignmentPage() {
  const { t } = useT();
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  // Condition editing
  const [editingCondition, setEditingCondition] = useState(false);
  const [conditionText, setConditionText] = useState("");
  const [savingCondition, setSavingCondition] = useState(false);
  const [conditionSaved, setConditionSaved] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const { lastEvent } = useUserWS();

  useEffect(() => {
    async function load() {
      const [asgRes, subsRes] = await Promise.all([
        fetch(`${API}/api/assignments/${id}`, { headers: authHeaders() }),
        fetch(`${API}/api/submissions?assignmentId=${id}&limit=100`, { headers: authHeaders() }),
      ]);
      if (asgRes.ok) {
        const a = await asgRes.json();
        setAssignment(a);
        setConditionText(a.condition ?? "");
      }
      if (subsRes.ok) {
        const data = await subsRes.json();
        setSubmissions(data.data ?? []);
      }
      setLoading(false);
    }
    load();
  }, [id]);

  // WebSocket: etalon hodisalari
  useEffect(() => {
    if (!lastEvent || !assignment) return;
    if (lastEvent.type === "etalon_generating" && lastEvent.data.assignmentId === id) {
      setAssignment(prev => prev ? { ...prev, etalonStatus: "pending", etalonError: null } : prev);
    } else if (lastEvent.type === "etalon_ready" && lastEvent.data.assignmentId === id) {
      setAssignment(prev => prev ? { ...prev, etalonStatus: "ready", etalonGeneratedAt: new Date().toISOString(), etalonError: null } : prev);
    } else if (lastEvent.type === "etalon_failed" && lastEvent.data.assignmentId === id) {
      setAssignment(prev => prev ? { ...prev, etalonStatus: "failed", etalonError: lastEvent.data.error } : prev);
    }
  }, [lastEvent, id, assignment]);

  async function regenerateEtalon() {
    setRegenerating(true);
    const res = await fetch(`${API}/api/assignments/${id}/regenerate-etalon`, {
      method: "POST",
      headers: authHeaders(),
    });
    if (res.ok) {
      setAssignment(prev => prev ? { ...prev, etalonStatus: "pending", etalonError: null } : prev);
    }
    setRegenerating(false);
  }

  async function saveCondition() {
    setSavingCondition(true);
    const res = await fetch(`${API}/api/assignments/${id}`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ condition: conditionText }),
    });
    if (res.ok) {
      const updated = await res.json();
      setAssignment(prev => prev ? { ...prev, condition: conditionText, etalonStatus: updated.etalonStatus ?? prev.etalonStatus, etalonError: null } : prev);
      setConditionSaved(true);
      setTimeout(() => { setConditionSaved(false); setEditingCondition(false); }, 1500);
    }
    setSavingCondition(false);
  }

  function statusIcon(s: Submission) {
    if (s.status === "failed") return <AlertCircle size={16} style={{ color: "var(--error)" }} />;
    if (s.status === "done") return <CheckCircle2 size={16} style={{ color: "var(--success)" }} />;
    return <Clock size={16} style={{ color: "#ca8a04" }} />;
  }

  function scoreColor(s: Submission) {
    if (s.status !== "done") return { color: "#ca8a04", bg: "rgba(234,179,8,0.12)" };
    const n = s.score ?? 0;
    if (n >= 80) return { color: "var(--success)", bg: "rgba(61,189,125,0.12)" };
    if (n >= 60) return { color: "var(--accent)", bg: "var(--accent-light)" };
    if (n >= 40) return { color: "var(--warning)", bg: "rgba(229,168,50,0.12)" };
    return { color: "var(--error)", bg: "rgba(224,92,92,0.12)" };
  }

  const done = submissions.filter(s => s.status === "done").length;
  const pending = submissions.filter(s => s.status === "pending" || s.status === "processing").length;

  if (loading) return (
    <div className="flex items-center justify-center h-screen" style={{ background: "var(--bg-primary)" }}>
      <p style={{ color: "var(--text-muted)" }}>{t("common.loading")}</p>
    </div>
  );

  if (!assignment) return (
    <div className="flex flex-col items-center justify-center h-screen gap-3" style={{ background: "var(--bg-primary)" }}>
      <p style={{ color: "var(--text-muted)" }}>{t("assignment.notFound")}</p>
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
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-bold truncate" style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)" }}>
            {assignment.name}
          </h1>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            {t("assignment.summary").replace("{total}", String(submissions.length)).replace("{done}", String(done)).replace("{pending}", String(pending))}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-28">
        {/* Masala sharti */}
        <div className="p-4 max-w-2xl mx-auto">
          <div className="p-4 flex flex-col gap-3"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-clay-sm)" }}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                {t("assignment.problemCondition")}
              </span>
              {!editingCondition && (
                <button onClick={() => setEditingCondition(true)}
                  className="flex items-center gap-1 text-xs font-medium"
                  style={{ color: "var(--accent)" }}>
                  <Pencil size={12} /> {t("assignment.edit")}
                </button>
              )}
            </div>

            {editingCondition ? (
              <>
                <textarea autoFocus value={conditionText} onChange={e => setConditionText(e.target.value)}
                  rows={5}
                  placeholder={t("assignment.conditionPlaceholder")}
                  className="w-full px-3 py-2.5 text-sm outline-none resize-none"
                  style={{ background: "var(--bg-primary)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", color: "var(--text-primary)", lineHeight: 1.6 }} />
                <div className="flex gap-2 justify-end">
                  <button onClick={() => { setEditingCondition(false); setConditionText(assignment.condition ?? ""); }}
                    className="px-3 py-1.5 text-sm"
                    style={{ color: "var(--text-muted)", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)" }}>
                    {t("assignment.cancel")}
                  </button>
                  <button onClick={saveCondition} disabled={savingCondition}
                    className="px-3 py-1.5 text-sm font-bold flex items-center gap-1.5"
                    style={{ background: conditionSaved ? "var(--success)" : "var(--cta)", color: "#fff", borderRadius: "var(--radius-sm)" }}>
                    {conditionSaved ? <><Check size={14} /> {t("assignment.saved")}</> : t("assignment.save")}
                  </button>
                </div>
              </>
            ) : (
              <p className="text-sm leading-relaxed whitespace-pre-wrap"
                style={{ color: assignment.condition ? "var(--text-secondary)" : "var(--text-muted)", fontStyle: assignment.condition ? "normal" : "italic" }}>
                {assignment.condition || t("assignment.noConditionHint")}
              </p>
            )}

            {/* Etalon (AI javoblar kaliti) status */}
            {assignment.etalonStatus && (
              <div className="flex items-center justify-between gap-2 pt-3" style={{ borderTop: "1px dashed var(--border)" }}>
                <div className="flex items-center gap-2 text-xs">
                  {assignment.etalonStatus === "pending" && (
                    <>
                      <RefreshCw size={14} className="animate-spin" style={{ color: "#ca8a04" }} />
                      <span style={{ color: "#ca8a04" }}>AI etalon yaratmoqda...</span>
                    </>
                  )}
                  {assignment.etalonStatus === "ready" && (
                    <>
                      <Sparkles size={14} style={{ color: "var(--success)" }} />
                      <span style={{ color: "var(--success)" }}>Etalon tayyor — tezroq tahlil</span>
                    </>
                  )}
                  {assignment.etalonStatus === "failed" && (
                    <>
                      <AlertCircle size={14} style={{ color: "var(--error)" }} />
                      <span style={{ color: "var(--error)" }} title={assignment.etalonError ?? ""}>Etalon xato — qayta urining</span>
                    </>
                  )}
                </div>
                {(assignment.etalonStatus === "ready" || assignment.etalonStatus === "failed") && (
                  <button onClick={regenerateEtalon} disabled={regenerating}
                    className="flex items-center gap-1 text-xs"
                    style={{ color: "var(--accent)", opacity: regenerating ? 0.5 : 1 }}>
                    <RefreshCw size={12} className={regenerating ? "animate-spin" : ""} />
                    Qayta yaratish
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* O'quvchilar */}
        <div className="px-4 max-w-2xl mx-auto flex flex-col gap-2">
          {submissions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 opacity-60">
              <FileText size={40} style={{ color: "var(--text-muted)" }} />
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>{t("assignment.noWorksYet")}</p>
              <p className="text-xs text-center" style={{ color: "var(--text-muted)" }}>
                {t("assignment.uploadFromCamera")}
              </p>
            </div>
          ) : submissions.map(sub => {
            const { color, bg } = scoreColor(sub);
            return (
              <Link key={sub.id} href={`/submission/${sub.id}`} prefetch={false}
                className="flex items-center gap-3 px-4 py-3"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", boxShadow: "var(--shadow-clay-sm)" }}>
                <div className="w-10 h-10 flex items-center justify-center shrink-0 text-sm font-bold"
                  style={{ background: bg, color, borderRadius: "var(--radius-sm)" }}>
                  {sub.status === "done" ? (sub.score ?? "—") : statusIcon(sub)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                    {sub.studentName ?? t("assignment.studentDefault")}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                    {sub.status === "done"
                      ? t("assignment.scoreLabel").replace("{score}", String(sub.score ?? "—"))
                      : sub.status === "failed"
                      ? t("assignment.errorShort")
                      : t("assignment.analyzing")}
                  </p>
                </div>
                <ChevronRight size={16} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
