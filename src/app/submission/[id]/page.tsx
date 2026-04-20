"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MessageCircle, Download, Send, RotateCcw, Check, X, ZoomIn, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { getToken } from "@/lib/auth";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

function scoreToGrade(score: number): string {
  if (score >= 86) return "5";
  if (score >= 71) return "4";
  if (score >= 56) return "3";
  if (score >= 41) return "2";
  return "1";
}

type Question = { text: string; options: string[] };

type Analysis = {
  grade: string;
  score: number;
  feedback: string;
  errors: string[];
  suggestions: string[];
  questions: Question[];
};

type Submission = {
  id: string;
  imageUrl: string;
  filePaths: string[] | null;
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
  const [planKey, setPlanKey] = useState("free");
  const [grade, setGrade] = useState("");
  const [gradeSaved, setGradeSaved] = useState(false);
  const [sending, setSending] = useState(false);
  const [fullscreenIndex, setFullscreenIndex] = useState<number | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Savollar uchun
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [clarifying, setClarifying] = useState(false);

  const gradeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    Promise.all([
      fetch(`${API}/api/submissions/${id}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch(`${API}/api/billing/my-plan`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.ok ? r.json() : { planKey: "free" }),
    ]).then(([data, plan]) => {
      setSubmission(data);
      const aiGrade = data.analysis?.grade || (data.analysis?.score != null ? scoreToGrade(data.analysis.score) : "");
      setGrade(aiGrade);
      setPlanKey(plan.planKey ?? "free");
    }).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  // Rasmlar ro'yxati: filePaths bo'lsa ulardan, yo'q bo'lsa imageUrl dan
  function getImageUrls(sub: Submission): string[] {
    if (sub.filePaths && sub.filePaths.length > 0) {
      return sub.filePaths.map(fp => `${API}/${fp.replace(/\\/g, "/")}`);
    }
    return sub.imageUrl ? [`${API}${sub.imageUrl}`] : [];
  }

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
    if (res.ok) {
      setSubmission((s) => s ? { ...s, status: "processing", analysis: null } : s);
      setSelectedAnswers({});
    }
    setRetrying(false);
  }

  async function clarify() {
    if (!submission) return;
    const questions = submission.analysis?.questions ?? [];
    const answers = questions.map((q, i) => ({ text: q.text, answer: selectedAnswers[i] ?? "" })).filter(a => a.answer);
    if (answers.length === 0) return;

    setClarifying(true);
    const token = getToken();
    const res = await fetch(`${API}/api/submissions/${id}/clarify`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ answers }),
    });
    if (res.ok) {
      setSubmission((s) => s ? { ...s, status: "processing", analysis: null } : s);
      setSelectedAnswers({});
    }
    setClarifying(false);
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
  const imageUrls = getImageUrls(submission);
  const questions = analysis?.questions ?? [];
  const allAnswered = questions.length > 0 && questions.every((_, i) => !!selectedAnswers[i]);

  return (
    <div className="bg-grid flex flex-col h-screen">
      {/* Header */}
      <div className="px-5 py-4 border-b flex items-center gap-3 shrink-0"
        style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
        <Link href="/home" className="w-8 h-8 flex items-center justify-center"
          style={{ background: "var(--bg-primary)", color: "var(--text-secondary)", borderRadius: "var(--radius-sm)" }}>
          <ArrowLeft size={16} />
        </Link>
        <div className="flex-1">
          <h1 className="text-base font-semibold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>
            {submission.student?.name ?? "Noma'lum"}
          </h1>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            {submission.subject ?? ""} · {new Date(submission.createdAt).toLocaleDateString("uz")}
            {imageUrls.length > 1 && ` · ${imageUrls.length} ta rasm`}
          </p>
        </div>
        <button onClick={retry} disabled={retrying || submission.status === "processing"}
          className="w-8 h-8 flex items-center justify-center"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-secondary)", borderRadius: "var(--radius-sm)", opacity: retrying ? 0.5 : 1 }}>
          <RotateCcw size={15} className={retrying ? "animate-spin" : ""} />
        </button>
        <button className="w-8 h-8 flex items-center justify-center"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-secondary)", borderRadius: "var(--radius-sm)" }}>
          <Download size={15} />
        </button>
      </div>

      {/* Fullscreen rasm */}
      {fullscreenIndex !== null && imageUrls[fullscreenIndex] && (
        <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "rgba(0,0,0,0.95)" }}>
          <div className="flex items-center justify-between px-4 py-3 shrink-0">
            <p className="text-white text-sm">{fullscreenIndex + 1} / {imageUrls.length}</p>
            <button className="w-10 h-10 flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.15)", borderRadius: "50%", color: "#fff" }}
              onClick={() => setFullscreenIndex(null)}>
              <X size={20} />
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center p-4 relative">
            {imageUrls.length > 1 && fullscreenIndex > 0 && (
              <button onClick={() => setFullscreenIndex(i => i! - 1)}
                className="absolute left-2 w-10 h-10 flex items-center justify-center rounded-full"
                style={{ background: "rgba(255,255,255,0.15)", color: "#fff" }}>
                <ChevronLeft size={20} />
              </button>
            )}
            <img src={imageUrls[fullscreenIndex]} alt="Fullscreen"
              className="max-w-full max-h-full object-contain rounded-xl" style={{ touchAction: "pinch-zoom" }} />
            {imageUrls.length > 1 && fullscreenIndex < imageUrls.length - 1 && (
              <button onClick={() => setFullscreenIndex(i => i! + 1)}
                className="absolute right-2 w-10 h-10 flex items-center justify-center rounded-full"
                style={{ background: "rgba(255,255,255,0.15)", color: "#fff" }}>
                <ChevronRight size={20} />
              </button>
            )}
          </div>
          {imageUrls.length > 1 && (
            <div className="shrink-0 flex gap-2 px-4 py-3 overflow-x-auto justify-center">
              {imageUrls.map((url, i) => (
                <button key={i} onClick={() => setFullscreenIndex(i)}
                  className="shrink-0 w-12 h-12 rounded-lg overflow-hidden"
                  style={{ border: `2px solid ${i === fullscreenIndex ? "var(--cta)" : "rgba(255,255,255,0.2)"}` }}>
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 pb-8">
        <div className="max-w-xl mx-auto flex flex-col gap-3">

          {/* Rasm(lar) */}
          {imageUrls.length > 0 && (
            <div>
              {/* Asosiy rasm */}
              <div className="card-3d aspect-[4/3] flex items-center justify-center overflow-hidden relative group cursor-zoom-in"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border-light)", borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-card)" }}
                onClick={() => setFullscreenIndex(activeImageIndex)}>
                <img src={imageUrls[activeImageIndex]} alt="Submission" className="w-full h-full object-contain" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: "rgba(0,0,0,0.15)" }}>
                  <ZoomIn size={28} color="#fff" />
                </div>
              </div>
              {/* Thumbnail strip (bir nechta rasm bo'lsa) */}
              {imageUrls.length > 1 && (
                <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
                  {imageUrls.map((url, i) => (
                    <button key={i} onClick={() => setActiveImageIndex(i)}
                      className="shrink-0 w-14 h-14 rounded-lg overflow-hidden"
                      style={{ border: `2px solid ${i === activeImageIndex ? "var(--cta)" : "var(--border)"}` }}>
                      <img src={url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

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
            <div className="card-3d notebook overflow-hidden relative"
              style={{ border: "1px solid var(--border-light)", borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-card)" }}>
              <div className="absolute left-11 top-0 bottom-0 w-[2px]" style={{ background: "rgba(239,68,68,0.25)" }} />
              <div className="relative" style={{ marginLeft: "3rem" }}>
                <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: "var(--notebook-line)" }}>
                  <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>AI Tahlili</span>
                  <span className="text-xs font-bold px-2 py-0.5" style={{ background: "var(--accent-light)", color: "var(--accent)", borderRadius: "var(--radius-sm)" }}>
                    {analysis.errors?.length ?? 0} xato
                  </span>
                </div>
                <div className="px-4 py-5 flex flex-col gap-4">
                  {/* Baho */}
                  <div>
                    <div className="flex items-end gap-2">
                      <input
                        ref={gradeInputRef}
                        value={grade}
                        onChange={(e) => setGrade(e.target.value)}
                        onBlur={(e) => saveGrade(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
                        placeholder="—"
                        maxLength={10}
                        className="text-5xl font-bold leading-none bg-transparent outline-none border-b-2 w-24 text-center"
                        style={{ color: "var(--grade-color)", borderColor: "rgba(74,154,170,0.4)", caretColor: "var(--grade-color)" }}
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

                  {/* Xatolar */}
                  {analysis.errors && analysis.errors.length > 0 && (
                    <div className="flex flex-col gap-3">
                      {analysis.errors.map((error, i) => (
                        <p key={i} className="text-sm leading-snug" style={{ color: "var(--error)" }}>
                          {i + 1}. {error}
                        </p>
                      ))}
                    </div>
                  )}

                  {/* Feedback */}
                  <div className="pt-4 border-t" style={{ borderColor: "var(--notebook-line)" }}>
                    <p className="text-sm italic leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                      → {analysis.feedback}
                    </p>
                  </div>

                  {/* Savollar — aniqlashtirish */}
                  {questions.length > 0 && (
                    <div className="pt-4 border-t flex flex-col gap-4" style={{ borderColor: "var(--notebook-line)" }}>
                      <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                        AI aniqlashtirish so'ramoqda
                      </p>
                      {questions.map((q, qi) => (
                        <div key={qi} className="flex flex-col gap-2">
                          <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{q.text}</p>
                          <div className="flex flex-wrap gap-2">
                            {q.options.map((opt, oi) => {
                              const isSelected = selectedAnswers[qi] === opt;
                              return (
                                <button key={oi}
                                  onClick={() => setSelectedAnswers(prev => ({ ...prev, [qi]: opt }))}
                                  className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                                  style={{
                                    background: isSelected ? "var(--cta)" : "var(--bg-primary)",
                                    color: isSelected ? "#fff" : "var(--text-primary)",
                                    border: `1px solid ${isSelected ? "var(--cta)" : "var(--border)"}`,
                                  }}>
                                  {opt}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}

                      {/* Qayta tahlil tugmasi */}
                      <button onClick={clarify} disabled={!allAnswered || clarifying}
                        className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all"
                        style={{
                          background: allAnswered ? "var(--cta)" : "var(--bg-primary)",
                          color: allAnswered ? "#fff" : "var(--text-muted)",
                          border: `1px solid ${allAnswered ? "var(--cta)" : "var(--border)"}`,
                          opacity: clarifying ? 0.7 : 1,
                        }}>
                        {clarifying
                          ? <><RefreshCw size={15} className="animate-spin" /> Qayta tahlil...</>
                          : <><RefreshCw size={15} /> Javoblar bilan qayta tahlil</>
                        }
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Chat tugmasi — faqat premium / pay_per_use */}
          {(planKey === "premium" || planKey === "pay_per_use") && (
            <Link href={`/chat/${submission.id}`}
              className="flex items-center justify-center gap-2 py-3.5 font-medium text-sm transition-all hover:opacity-80"
              style={{ background: "var(--accent)", color: "#fff", borderRadius: "var(--radius-sm)" }}>
              <MessageCircle size={16} />
              Batafsil tushuntirish — Chat
            </Link>
          )}

          {/* Telegram tugmasi */}
          <button onClick={sendToStudent} disabled={sending || !grade.trim() || !analysis}
            className="flex items-center justify-center gap-2 py-3.5 font-medium text-sm transition-all hover:opacity-80"
            style={{ background: "#229ED9", color: "#fff", borderRadius: "var(--radius-sm)", opacity: (sending || !grade.trim() || !analysis) ? 0.6 : 1 }}>
            <Send size={16} />
            {sending ? "Yuborilmoqda..." : `${grade.trim() || "—"} baho bilan yuborish`}
          </button>
        </div>
      </div>
    </div>
  );
}
