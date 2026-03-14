"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Camera, Star, AlertCircle, CheckCircle2, TrendingUp, Pencil, X } from "lucide-react";
import {
  loadStudents, loadClasses, saveStudents, saveClasses,
  addStudentToClass, removeStudentFromClass, getStudentClasses,
} from "@/lib/store";
import type { Student, ClassItem } from "@/lib/store";
import TransferStudentModal from "@/components/TransferStudentModal";

const studentDetails: Record<string, {
  avgGrade: number;
  accuracy: number;
  totalErrors: number;
  subjects: { name: string; icon: string; count: number; avg: number; color: string; bg: string }[];
  recentSubmissions: { id: string; subject: string; icon: string; date: string; grade: string; errors: number }[];
}> = {
  "1": {
    avgGrade: 4.2,
    accuracy: 85,
    totalErrors: 12,
    subjects: [
      { name: "Matematika", icon: "📐", count: 3, avg: 4.0, color: "var(--text-secondary)", bg: "var(--accent-light)" },
      { name: "Fizika", icon: "🔬", count: 2, avg: 4.5, color: "var(--text-secondary)", bg: "var(--accent-light)" },
    ],
    recentSubmissions: [
      { id: "1", subject: "Matematika", icon: "📐", date: "24 Fevral", grade: "4/5", errors: 3 },
      { id: "1", subject: "Fizika", icon: "🔬", date: "22 Fevral", grade: "5/5", errors: 0 },
      { id: "1", subject: "Matematika", icon: "📐", date: "20 Fevral", grade: "4/5", errors: 2 },
    ],
  },
};

const avatarColors = [
  "#6366F1", "#10B981", "#F59E0B", "#EF4444",
  "#3B82F6", "#8B5CF6", "#EC4899", "#14B8A6",
];

export default function StudentProfilePage() {
  const { id } = useParams<{ id: string }>();

  const [student, setStudent] = useState<Student | null>(null);
  const [allClasses, setAllClasses] = useState<ClassItem[]>([]);
  const [myClasses, setMyClasses] = useState<ClassItem[]>([]);
  const [showManage, setShowManage] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editName, setEditName] = useState("");
  const [editTgId, setEditTgId] = useState("");
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

  const details = studentDetails[student.id] ?? studentDetails["1"];
  const avatarColor = avatarColors[(parseInt(student.id) - 1) % avatarColors.length];
  const initials = student.name.split(" ").map((n) => n[0]).join("").slice(0, 2);
  const backHref = myClasses.length > 0 ? `/class/${myClasses[0].id}` : "/dashboard";

  return (
    <div className="flex flex-col h-screen" style={{ background: "var(--bg-primary)" }}>

      {/* Header */}
      <div className="px-5 pt-4 pb-8 flex items-center gap-3 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #111111 0%, #374151 100%)", boxShadow: "0 8px 32px rgba(0,0,0,0.32)", zIndex: 10 }}>
        <div style={{ position: "absolute", right: -20, top: -30, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.07)" }} />
        <div style={{ position: "absolute", right: 50, bottom: -20, width: 70, height: 70, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
        <Link href={backHref}
          className="w-8 h-8 rounded-xl flex items-center justify-center relative"
          style={{ background: "rgba(255,255,255,0.18)", color: "#fff" }}>
          <ArrowLeft size={16} />
        </Link>
        <h1 className="flex-1 text-base font-semibold text-white relative">O&apos;quvchi profili</h1>
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

      <div className="bg-grid flex-1 mt-2 rounded-t-2xl overflow-hidden">
      <div className="h-full overflow-y-auto px-4 pt-8 pb-8 max-w-lg mx-auto w-full flex flex-col gap-4">

        {/* Profile card */}
        <div className="card-3d rounded-xl p-5"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-xl font-bold shrink-0"
              style={{ background: avatarColor }}>
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
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
            { label: "O'rtacha", value: `${details.avgGrade}⭐`, icon: Star, color: "#F5A623", bg: "#FEF3DC" },
            { label: "Xatolar", value: details.totalErrors, icon: AlertCircle, color: "#EF4444", bg: "#FFF1F2" },
          ].map(({ label, value, icon: Icon, color, bg }, i) => (
            <div key={i} className="rounded-xl p-3 text-center" style={{ background: bg }}>
              <Icon size={16} className="mx-auto mb-1" style={{ color }} />
              <p className="text-base font-bold" style={{ color }}>{value}</p>
              <p className="text-xs mt-0.5" style={{ color: color + "99" }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Fanlar */}
        <div className="card-3d rounded-xl p-4"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={15} style={{ color: "var(--text-secondary)" }} />
            <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Fanlar bo&apos;yicha</span>
          </div>
          <div className="flex flex-col gap-3">
            {details.subjects.map((s, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: s.bg }}>
                  {s.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm" style={{ color: "var(--text-primary)" }}>{s.name}</span>
                    <span className="text-xs font-medium" style={{ color: s.color }}>{s.avg}⭐</span>
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
                className="card-3d rounded-xl px-4 py-3 flex items-center gap-3 transition-all hover:opacity-80"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0"
                  style={{ background: "var(--accent-light)" }}>
                  {sub.icon}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{sub.subject}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{sub.date}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  {sub.errors > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-lg" style={{ background: "#FFF1F2", color: "#EF4444" }}>
                      {sub.errors} xato
                    </span>
                  )}
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-lg"
                    style={{
                      background: sub.grade === "5/5" ? "#F0FDF4" : "var(--accent-light)",
                      color: sub.grade === "5/5" ? "#10B981" : "var(--accent)",
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
          style={{ background: "#00000060" }}
          onClick={(e) => e.target === e.currentTarget && setShowEdit(false)}>
          <div className="w-full max-w-sm rounded-2xl p-5 animate-fade-in"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>O'quvchini tahrirlash</h2>
              <button onClick={() => setShowEdit(false)}
                className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: "var(--bg-primary)", border: "1px solid var(--border)", color: "var(--text-muted)" }}>
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
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: "var(--bg-primary)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
                />
              </div>

              <div>
                <p className="text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>Telegram ID</p>
                <input
                  value={editTgId}
                  onChange={(e) => setEditTgId(e.target.value)}
                  placeholder="@username yoki ID raqam"
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: "var(--bg-primary)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
                />
              </div>

              <div>
                <p className="text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>Guruh</p>
                <div className="px-3 py-2.5 rounded-xl flex items-center justify-between"
                  style={{ background: "var(--bg-primary)", border: "1px solid var(--border)" }}>
                  <span className="text-sm" style={{ color: myClasses.length > 0 ? "var(--text-primary)" : "var(--text-muted)" }}>
                    {myClasses.length > 0 ? myClasses.map((c) => c.name).join(", ") : "Sinfsiz"}
                  </span>
                  <button
                    onClick={() => { setShowEdit(false); setShowManage(true); }}
                    className="text-xs font-medium px-2.5 py-1 rounded-lg transition-all hover:opacity-80"
                    style={{ background: "var(--accent-light)", color: "var(--accent)" }}>
                    O'zgartirish
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button onClick={() => setShowEdit(false)} className="flex-1 py-2.5 rounded-xl text-sm"
                style={{ background: "var(--bg-primary)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
                Bekor
              </button>
              <button onClick={saveName} className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                style={{ background: "var(--accent)", color: "#fff" }}>
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
    </div>
  );
}
