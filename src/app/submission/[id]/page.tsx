"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MessageCircle, Download, Send, RotateCcw, Check } from "lucide-react";
import { getToken } from "@/lib/auth";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

type Analysis = {
  grade: string;
  score: number;
  feedback: string;
  errors: string[];
  suggestions: string[];
};

type Submission = {
  id: string;
  imageUrl: string;
  subject: string | null;
  status: string;
  createdAt: string;
  student: { name: string; telegramId: string | null } | null;
  analysis: Analysis | null;
};

export default function SubmissionPage() {
  const { id } = useParams<{ id: string }>();
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);
  const [grade, setGrade] = useState("");
  const [gradeSaved, setGradeSaved] = useState(false);
  const [sending, setSending] = useState(false);
  const gradeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    fetch(`${API}/api/submissions/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => { setSubmission(data); setGrade(data.analysis?.grade ?? ""); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  async function saveGrade(value: string) {
    if (!value.trim()) return;
    const token = getToken();
    const res = await fetch(`${API}/api/submissions/${id}/grade`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ grade: value.trim() }),
    });
    if (res.ok) {
      setGradeSaved(true);
      setTimeout(() => setGradeSaved(false), 2000);
    }
  }

  async function sendToStudent() {
    if (!grade.trim()) return;
    setSending(true);
    await saveGrade(grade);
    // Telegram bot integratsiyasi keyinroq
    setSending(false);
  }

  async function retry() {
    if (!submission || retrying) return;
    setRetrying(true);
    const token = getToken();
    const res = await fetch(`${API}/api/submissions/${id}/retry`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) setSubmission((s) => s ? { ...s, status: "processing", analysis: null } : s);
    setRetrying(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ background: "var(--bg-primary)" }}>
        <p style={{ color: "var(--text-muted)" }}>Yuklanmoqda...</p>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-3" style={{ background: "var(--bg-primary)" }}>
        <p style={{ color: "var(--text-muted)" }}>Topilmadi</p>
        <Link href="/home" className="text-sm font-medium" style={{ color: "var(--accent)" }}>Bosh sahifaga</Link>
      </div>
    );
  }

  const analysis = submission.analysis;

  return (
    <div className="bg-grid flex flex-col h-screen">
      {/* Header */}
      <div
        className="px-5 py-4 border-b flex items-center gap-3 shrink-0"
        style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
      >
        <Link
          href="/home"
          className="w-8 h-8 flex items-center justify-center"
          style={{ background: "var(--bg-primary)", color: "var(--text-secondary)", borderRadius: "var(--radius-sm)" }}
        >
          <ArrowLeft size={16} />
        </Link>
        <div className="flex-1">
          <h1 className="text-base font-semibold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>
            {submission.student?.name ?? "Noma'lum"}
          </h1>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            {submission.subject ?? ""} · {new Date(submission.createdAt).toLocaleDateString("uz")}
          </p>
        </div>
        <button
          onClick={retry}
          disabled={retrying || submission.status === "processing"}
          className="w-8 h-8 flex items-center justify-center"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-secondary)", borderRadius: "var(--radius-sm)", opacity: retrying ? 0.5 : 1 }}
        >
          <RotateCcw size={15} className={retrying ? "animate-spin" : ""} />
        </button>
        <button
          className="w-8 h-8 flex items-center justify-center"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-secondary)", borderRadius: "var(--radius-sm)" }}
        >
          <Download size={15} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 pb-8">
        <div className="max-w-xl mx-auto flex flex-col gap-3">

          {/* Rasm */}
          <div
            className="card-3d aspect-[4/3] flex items-center justify-center overflow-hidden"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border-light)", borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-card)" }}
          >
            {submission.imageUrl ? (
              <img src={`${API}${submission.imageUrl}`} alt="Submission" className="w-full h-full object-contain" />
            ) : (
              <div className="text-center" style={{ color: "var(--text-muted)" }}>
                <span className="text-4xl">📄</span>
                <p className="text-sm mt-2">Daftar rasmi</p>
              </div>
            )}
          </div>

          {/* Status */}
          {submission.status !== "done" && (
            <div className="p-4 text-center" style={{ background: "var(--bg-card)", borderRadius: "var(--radius-md)", border: "1px solid var(--border)" }}>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                {submission.status === "pending" && "Tahlil kutilmoqda..."}
                {submission.status === "processing" && "AI tahlil qilmoqda..."}
                {submission.status === "failed" && "Tahlil xatolik bilan tugadi"}
              </p>
            </div>
          )}

          {/* AI Tahlili */}
          {analysis && (
            <div
              className="card-3d notebook overflow-hidden relative"
              style={{ border: "1px solid var(--border-light)", borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-card)" }}
            >
              <div className="absolute left-11 top-0 bottom-0 w-[2px]" style={{ background: "rgba(239,68,68,0.25)" }} />
              <div className="relative" style={{ marginLeft: "3rem" }}>
                <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: "var(--notebook-line)" }}>
                  <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>AI Tahlili</span>
                  <span className="text-xs font-bold px-2 py-0.5" style={{ background: "var(--accent-light)", color: "var(--accent)", borderRadius: "var(--radius-sm)" }}>
                    {analysis.errors?.length ?? 0} xato
                  </span>
                </div>
                <div className="px-4 py-5 flex flex-col gap-4">
                  <div>
                    <div className="flex items-end gap-2">
                      <input
                        ref={gradeInputRef}
                        value={grade}
                        onChange={(e) => setGrade(e.target.value)}
                        onBlur={(e) => saveGrade(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") { e.currentTarget.blur(); } }}
                        placeholder="—"
                        maxLength={10}
                        className="text-5xl font-bold leading-none bg-transparent outline-none border-b-2 w-24 text-center"
                        style={{
                          color: "var(--grade-color)",
                          borderColor: "rgba(74,154,170,0.4)",
                          caretColor: "var(--grade-color)",
                        }}
                      />
                      <span className="text-5xl font-bold leading-none pb-0.5" style={{ color: "var(--grade-color)", opacity: 0.4 }}>/</span>
                      <span className="text-5xl font-bold leading-none pb-0.5" style={{ color: "var(--grade-color)", opacity: 0.4 }}>5</span>
                      {gradeSaved && (
                        <span className="flex items-center gap-1 text-xs pb-1" style={{ color: "var(--success)" }}>
                          <Check size={12} /> Saqlandi
                        </span>
                      )}
                    </div>
                    <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Umumiy baho ({analysis.score}/100) · tahrirlash mumkin</p>
                  </div>
                  {analysis.errors && analysis.errors.length > 0 && (
                    <div className="flex flex-col gap-3">
                      {analysis.errors.map((error, i) => (
                        <p key={i} className="text-sm leading-snug" style={{ color: "var(--error)" }}>
                          {i + 1}. {error}
                        </p>
                      ))}
                    </div>
                  )}
                  <div className="pt-4 border-t" style={{ borderColor: "var(--notebook-line)" }}>
                    <p className="text-sm italic leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                      → {analysis.feedback}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Chat tugmasi */}
          <Link
            href={`/chat/${submission.id}`}
            className="flex items-center justify-center gap-2 py-3.5 font-medium text-sm transition-all hover:opacity-80"
            style={{ background: "var(--accent)", color: "#fff", borderRadius: "var(--radius-sm)" }}
          >
            <MessageCircle size={16} />
            Batafsil tushuntirish — Chat
          </Link>

          {/* Telegram tugmasi */}
          <button
            onClick={sendToStudent}
            disabled={sending || !grade.trim() || !analysis}
            className="flex items-center justify-center gap-2 py-3.5 font-medium text-sm transition-all hover:opacity-80"
            style={{ background: "#229ED9", color: "#fff", borderRadius: "var(--radius-sm)", opacity: (sending || !grade.trim() || !analysis) ? 0.6 : 1 }}
          >
            <Send size={16} />
            {sending ? "Yuborilmoqda..." : `${grade.trim() || "—"} baho bilan yuborish`}
          </button>
        </div>
      </div>
    </div>
  );
}
