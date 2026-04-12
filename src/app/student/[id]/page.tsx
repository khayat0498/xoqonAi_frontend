"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Camera, Star, AlertCircle, CheckCircle2, TrendingUp, Pencil, X } from "lucide-react";
import {
  loadStudents, loadClasses, saveStudents, saveClasses,
  addStudentToClass, removeStudentFromClass, getStudentClasses,
} from "@/lib/store";
import type { Student, ClassItem } from "@/lib/store";
import { canUseTelegram } from "@/lib/plan-limits";
import TransferStudentModal from "@/components/TransferStudentModal";

const defaultDetails = {
  avgGrade: 0,
  accuracy: 0,
  totalErrors: 0,
  subjects: [] as { name: string; icon: string; count: number; avg: number; color: string; bg: string }[],
  recentSubmissions: [] as { id: string; subject: string; icon: string; date: string; grade: string; errors: number }[],
};

const avatarColors = ["#1a5c6b","#6366F1","#e8732a","#2a9d6a","#3B82F6","#8B5CF6","#EC4899","#d4a017"];

export default function StudentProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [student, setStudent] = useState<Student | null>(null);
  const [allClasses, setAllClasses] = useState<ClassItem[]>([]);
  const [myClasses, setMyClasses] = useState<ClassItem[]>([]);
  const [showManage, setShowManage] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editName, setEditName] = useState("");
  const [editTgId, setEditTgId] = useState("");
  const [planAlert, setPlanAlert] = useState<string | null>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    const studentList = loadStudents();
    const classes = loadClasses();
    const found = studentList.find((s) => s.id === id) ?? studentList[0];
    setStudent(found);
    setAllClasses(classes);
    setMyClasses(getStudentClasses(classes, found?.id ?? id));
  }, [id]);

  const saveName = () => {
    const name = editName.trim();
    if (!name || !student) return;
    const telegramId = editTgId.trim() || undefined;
    if (telegramId && !student.telegramId) {
      const tgCheck = canUseTelegram();
      if (!tgCheck.allowed) { setPlanAlert(tgCheck.message); return; }
    }
    const updated = loadStudents().map((s) => s.id === student.id ? { ...s, name, telegramId } : s);
    saveStudents(updated);
    setStudent({ ...student, name, telegramId });
    setShowEdit(false);
  };

  const handleSave = (toAdd: string[], toRemove: string[]) => {
    if (!student) return;
    let classes = loadClasses();
    for (const cid of toAdd) classes = addStudentToClass(classes, cid, student.id);
    for (const cid of toRemove) classes = removeStudentFromClass(classes, cid, student.id);
    saveClasses(classes);
    saveStudents(loadStudents());
    setAllClasses(classes);
    setMyClasses(getStudentClasses(classes, student.id));
    setShowManage(false);
  };

  if (!student) return null;

  const details = defaultDetails; // TODO: API dan o'quvchi statistikasini olish
  const avatarColor = avatarColors[(parseInt(student.id) - 1) % avatarColors.length];
  const initials = student.name.split(" ").map((n) => n[0]).join("").slice(0, 2);


  return (
    <div className="flex flex-col h-screen" style={{ background: "var(--bg-primary)" }}>

      {/* Header */}
      <div className="px-5 pt-4 pb-8 flex items-center gap-3 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, var(--accent-dark) 0%, var(--accent) 60%, var(--accent-hover) 100%)", boxShadow: "6px 6px 14px rgba(53,120,136,0.25), inset -2px -2px 6px rgba(0,0,0,0.08), inset 2px 2px 6px rgba(255,255,255,0.12)", zIndex: 10 }}>
        <div style={{ position: "absolute", right: -20, top: -30, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.07)" }} />
        <div style={{ position: "absolute", right: 50, bottom: -20, width: 70, height: 70, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
        <button onClick={() => router.back()}
          className="w-8 h-8 rounded-xl flex items-center justify-center relative"
          style={{ background: "rgba(255,255,255,0.18)", color: "#fff" }}>
          <ArrowLeft size={16} />
        </button>
        <h1 className="flex-1 text-base font-semibold text-white relative" style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>O&apos;quvchi profili</h1>
        <button
          onClick={() => { setShowEdit(true); setEditName(student.name); setEditTgId(student.telegramId ?? ""); }}
          className="w-8 h-8 rounded-xl flex items-center justify-center relative"
          style={{ background: "rgba(255,255,255,0.18)", color: "#fff" }}>
          <Pencil size={15} />
        </button>
        <button
          className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-xl font-medium relative"
          style={{ background: "rgba(255,255,255,0.18)", color: "#fff" }}>
          <Camera size={14} />
          Tekshirish
        </button>
      </div>

      <div className="bg-grid flex-1 mt-2 overflow-hidden" style={{ borderRadius: "var(--radius-lg) var(--radius-lg) 0 0" }}>
      <div className="h-full overflow-y-auto px-4 pt-8 pb-8 max-w-lg mx-auto w-full flex flex-col gap-4">

        {/* Profile card */}
        <div className="p-5"
          style={{ background: "var(--bg-card)", backdropFilter: "blur(4px)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-clay)" }}>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 flex items-center justify-center text-white text-xl font-bold shrink-0"
              style={{ background: avatarColor, borderRadius: "var(--radius-md)" }}>
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>
                {student.name}
              </h2>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                {myClasses.length > 0
                  ? myClasses.map((c) => c.name).join(", ") + " sinfi"
                  : "Sinfsiz"}
              </p>
              <div className="flex items-center gap-1.5 mt-2">
                <div className="h-1.5 rounded-full flex-1 max-w-24"
                  style={{ background: "var(--bg-primary)" }}>
                  <div className="h-1.5 rounded-full"
                    style={{ width: `${details.accuracy}%`, background: avatarColor }} />
                </div>
                <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                  {details.accuracy}% aniqlik
                </span>
              </div>
              {student.telegramId && (
                <p className="text-xs mt-1.5 flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
                  <span style={{ color: "#229ED9" }}>✈</span>
                  {student.telegramId}
                </p>
              )}
            </div>
          </div>

        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { label: "Tekshirish", value: student.submissionCount, icon: CheckCircle2, color: "var(--text-secondary)", bg: "var(--accent-light)" },
            { label: "O'rtacha", value: `${details.avgGrade}`, icon: Star, color: "var(--warning)", bg: "var(--warning-bg)" },
            { label: "Xatolar", value: details.totalErrors, icon: AlertCircle, color: "var(--error)", bg: "var(--error-bg)" },
          ].map(({ label, value, icon: Icon, color, bg }, i) => (
            <div key={i} className="p-3 text-center" style={{ background: bg, borderRadius: "var(--radius-sm)" }}>
              <Icon size={16} className="mx-auto mb-1" style={{ color }} />
              <p className="text-base font-bold" style={{ color }}>{value}</p>
              <p className="text-xs mt-0.5" style={{ color: color + "99" }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Fanlar */}
        <div className="p-4"
          style={{ background: "var(--bg-card)", backdropFilter: "blur(4px)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-clay)" }}>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={15} style={{ color: "var(--text-secondary)" }} />
            <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Fanlar bo&apos;yicha</span>
          </div>
          <div className="flex flex-col gap-3">
            {details.subjects.map((s, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 flex items-center justify-center shrink-0" style={{ background: s.bg, borderRadius: "var(--radius-sm)" }}>
                  {s.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm" style={{ color: "var(--text-primary)" }}>{s.name}</span>
                    <span className="text-xs font-medium" style={{ color: s.color }}>{s.avg}</span>
                  </div>
                  <div className="h-1.5 rounded-full" style={{ background: "var(--bg-primary)" }}>
                    <div className="h-1.5 rounded-full"
                      style={{ width: `${(s.count / student.submissionCount) * 100}%`, background: s.color }} />
                  </div>
                </div>
                <span className="text-xs shrink-0" style={{ color: "var(--text-muted)" }}>{s.count} ta</span>
              </div>
            ))}
          </div>
        </div>

        {/* So'nggi tekshirishlar */}
        <div>
          <p className="text-sm font-semibold mb-2.5" style={{ color: "var(--text-primary)" }}>
            So&apos;nggi tekshirishlar
          </p>
          <div className="flex flex-col gap-2">
            {details.recentSubmissions.map((sub, i) => (
              <Link key={i} href={`/submission/${sub.id}`}
                className="px-4 py-3 flex items-center gap-3 transition-all hover:scale-[1.01] active:scale-[0.99]"
                style={{ background: "var(--bg-card)", backdropFilter: "blur(4px)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", boxShadow: "var(--shadow-clay-sm)" }}>
                <div className="w-8 h-8 flex items-center justify-center text-sm shrink-0"
                  style={{ background: "var(--accent-light)", borderRadius: "var(--radius-sm)" }}>
                  {sub.icon}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{sub.subject}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{sub.date}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  {sub.errors > 0 && (
                    <span className="text-xs px-2 py-0.5" style={{ background: "var(--error-bg)", color: "var(--error)", borderRadius: "var(--radius-sm)" }}>
                      {sub.errors} xato
                    </span>
                  )}
                  <span className="text-xs font-semibold px-2 py-0.5"
                    style={{
                      borderRadius: "var(--radius-sm)",
                      background: sub.grade === "5/5" ? "var(--success-bg)" : "var(--accent-light)",
                      color: sub.grade === "5/5" ? "var(--success)" : "var(--accent)",
                    }}>
                    {sub.grade}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

      </div>
      </div>

      {/* Edit modal */}
      {showEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.25)", backdropFilter: "blur(6px)" }}
          onClick={(e) => e.target === e.currentTarget && setShowEdit(false)}>
          <div className="w-full max-w-sm p-5 animate-fade-in"
            style={{ background: "var(--bg-card-solid, var(--bg-card))", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-clay)" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>O'quvchini tahrirlash</h2>
              <button onClick={() => setShowEdit(false)}
                className="w-8 h-8 flex items-center justify-center"
                style={{ borderRadius: "var(--radius-sm)", background: "var(--bg-primary)", border: "1px solid var(--border)", color: "var(--text-muted)" }}>
                <X size={15} />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <p className="text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>Ism</p>
                <input
                  autoFocus
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && saveName()}
                  placeholder="To'liq ism"
                  className="w-full px-3 py-2.5 text-sm outline-none"
                  style={{ borderRadius: "var(--radius-sm)", background: "var(--bg-primary)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
                />
              </div>

              <div>
                <p className="text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>Telegram ID</p>
                <input
                  value={editTgId}
                  onChange={(e) => setEditTgId(e.target.value)}
                  placeholder="@username yoki ID raqam"
                  className="w-full px-3 py-2.5 text-sm outline-none"
                  style={{ borderRadius: "var(--radius-sm)", background: "var(--bg-primary)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
                />
              </div>

              <div>
                <p className="text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>Guruh</p>
                <div className="px-3 py-2.5 flex items-center justify-between"
                  style={{ borderRadius: "var(--radius-sm)", background: "var(--bg-primary)", border: "1px solid var(--border)" }}>
                  <span className="text-sm" style={{ color: myClasses.length > 0 ? "var(--text-primary)" : "var(--text-muted)" }}>
                    {myClasses.length > 0 ? myClasses.map((c) => c.name).join(", ") : "Sinfsiz"}
                  </span>
                  <button
                    onClick={() => { setShowEdit(false); setShowManage(true); }}
                    className="text-xs font-medium px-2.5 py-1 transition-all hover:opacity-80"
                    style={{ borderRadius: "var(--radius-sm)", background: "var(--accent-light)", color: "var(--accent)" }}>
                    O'zgartirish
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button onClick={() => setShowEdit(false)} className="flex-1 py-2.5 text-sm"
                style={{ borderRadius: "var(--radius-sm)", background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
                Bekor
              </button>
              <button onClick={saveName} className="flex-1 py-2.5 text-sm font-medium"
                style={{ borderRadius: "var(--radius-sm)", background: "var(--cta)", color: "#fff" }}>
                Saqlash
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manage classes modal */}
      {showManage && (
        <TransferStudentModal
          student={student}
          classes={allClasses}
          onSave={handleSave}
          onClose={() => setShowManage(false)}
        />
      )}

      {/* Plan limit alert */}
      {planAlert && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-6"
          style={{ background: "rgba(0,0,0,0.25)", backdropFilter: "blur(6px)" }}
          onClick={() => setPlanAlert(null)}
        >
          <div className="w-full max-w-sm animate-fade-in p-6 flex flex-col items-center gap-4 text-center"
            onClick={(e) => e.stopPropagation()}
            style={{ background: "var(--bg-card-solid, var(--bg-card))", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-clay)" }}
          >
            <div className="w-14 h-14 flex items-center justify-center rounded-full" style={{ background: "rgba(224,92,92,0.1)" }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--error)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-bold mb-1" style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)" }}>Tarif limiti</h3>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{planAlert}</p>
            </div>
            <div className="flex gap-2 w-full">
              <button onClick={() => setPlanAlert(null)} className="flex-1 py-2.5 text-sm font-medium"
                style={{ borderRadius: "var(--radius-sm)", background: "var(--bg-primary)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
                Yopish
              </button>
              <button onClick={() => { setPlanAlert(null); router.push("/plans"); }} className="flex-1 py-2.5 text-sm font-semibold"
                style={{ borderRadius: "var(--radius-sm)", background: "var(--cta)", color: "#fff", boxShadow: "var(--shadow-clay-sm)" }}>
                Tarifni yangilash
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
