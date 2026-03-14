"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Plus, Users, X, Pencil, Trash2, MoreVertical, Search, UserPlus, Send,
} from "lucide-react";
import {
  loadClasses, saveClasses, loadStudents, saveStudents, addStudentToClass,
} from "@/lib/store";
import type { ClassItem, Student } from "@/lib/store";

const avatarColors = ["#6366F1","#10B981","#F59E0B","#EF4444","#3B82F6","#8B5CF6","#EC4899","#14B8A6"];

const SUBJECTS = [
  { name: "Matematika", icon: "📐" },
  { name: "Ona tili", icon: "📖" },
  { name: "Fizika", icon: "🔬" },
  { name: "Ingliz tili", icon: "🌍" },
  { name: "Kimyo", icon: "⚗️" },
  { name: "Biologiya", icon: "🌱" },
  { name: "Tarix", icon: "📜" },
  { name: "Rus tili", icon: "🇷🇺" },
];

function clsBadge(cls: ClassItem) {
  const text = cls.icon?.trim() || cls.name.charAt(0);
  const len = text.length;
  const fontSize = len === 1 ? 20 : len === 2 ? 14 : len === 3 ? 11 : 9;
  const minWidth = len <= 2 ? 40 : len === 3 ? 48 : 56;
  return { text, fontSize, minWidth, height: 40 };
}

export default function DashboardPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"classes" | "students">("classes");

  // Classes
  const [classList, setClassList] = useState<ClassItem[]>([]);
  const [showNewClass, setShowNewClass] = useState(false);
  const [newClassName, setNewClassName] = useState("");
  const [newClassIcon, setNewClassIcon] = useState("");
  const [newClassTgGroup, setNewClassTgGroup] = useState("");
  const [deleteClassId, setDeleteClassId] = useState<string | null>(null);
  const [classMenuState, setClassMenuState] = useState<{ id: string; x: number; y: number } | null>(null);

  // Students
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState("");
  const [showNewStudent, setShowNewStudent] = useState(false);
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentTgId, setNewStudentTgId] = useState("");
  const [newStudentClassIds, setNewStudentClassIds] = useState<string[]>([]);
  const [studentMenuState, setStudentMenuState] = useState<{ id: string; x: number; y: number } | null>(null);
  const [deleteStudentId, setDeleteStudentId] = useState<string | null>(null);

  // Send to Telegram
  const [sendClassId, setSendClassId] = useState<string | null>(null);
  const [sendStudentId, setSendStudentId] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState("");

  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    setClassList(loadClasses());
    setAllStudents(loadStudents());
  }, []);

  /* ── Classes ── */
  const persistClasses = (updated: ClassItem[]) => {
    setClassList(updated);
    saveClasses(updated);
  };

  const openClassMenu = useCallback((e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setClassMenuState({ id, x: rect.right, y: rect.bottom + 6 });
  }, []);

  const addClass = () => {
    const name = newClassName.trim();
    if (!name) return;
    const icon = newClassIcon.trim() || undefined;
    const telegramGroupId = newClassTgGroup.trim() || undefined;
    persistClasses([...classList, { id: Date.now().toString(), name, icon, telegramGroupId, studentIds: [], studentCount: 0, lastActivity: "Hozir" }]);
    setNewClassName(""); setNewClassIcon(""); setNewClassTgGroup(""); setShowNewClass(false);
  };

  const deleteClass = (id: string) => {
    persistClasses(classList.filter((c) => c.id !== id));
    setDeleteClassId(null);
  };

  /* ── Students ── */
  const openStudentMenu = useCallback((e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setStudentMenuState({ id, x: rect.right, y: rect.bottom + 6 });
  }, []);

  const toggleNewStudentClass = (classId: string) => {
    setNewStudentClassIds((prev) =>
      prev.includes(classId) ? prev.filter((id) => id !== classId) : [...prev, classId]
    );
  };

  const createStudent = () => {
    const name = newStudentName.trim();
    if (!name) return;
    const telegramId = newStudentTgId.trim() || undefined;
    const newStudent: Student = { id: Date.now().toString(), name, submissionCount: 0, telegramId };
    const updatedStudents = [...allStudents, newStudent];
    setAllStudents(updatedStudents);
    saveStudents(updatedStudents);

    if (newStudentClassIds.length > 0) {
      let updatedClasses = classList;
      for (const cid of newStudentClassIds) {
        updatedClasses = addStudentToClass(updatedClasses, cid, newStudent.id);
      }
      setClassList(updatedClasses);
      saveClasses(updatedClasses);
    }

    setNewStudentName(""); setNewStudentTgId(""); setNewStudentClassIds([]);
    setShowNewStudent(false);
  };

  const deleteStudent = (id: string) => {
    const updatedStudents = allStudents.filter((s) => s.id !== id);
    setAllStudents(updatedStudents);
    saveStudents(updatedStudents);

    const updatedClasses = classList.map((c) => {
      const studentIds = c.studentIds.filter((sid) => sid !== id);
      return { ...c, studentIds, studentCount: studentIds.length };
    });
    setClassList(updatedClasses);
    saveClasses(updatedClasses);
    setDeleteStudentId(null);
  };

  const filteredStudents = allStudents.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-screen" style={{ background: "var(--bg-primary)" }}>

      {/* Header */}
      <div className="px-5 pt-4 pb-8 flex items-center gap-3 relative overflow-hidden shrink-0"
        style={{ background: "linear-gradient(135deg, #111111 0%, #374151 100%)", boxShadow: "0 8px 32px rgba(0,0,0,0.32)", zIndex: 10 }}>
        <div style={{ position: "absolute", right: -20, top: -30, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.07)" }} />
        <div style={{ position: "absolute", right: 50, bottom: -20, width: 70, height: 70, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
        <Link href="/home" className="w-8 h-8 rounded-xl flex items-center justify-center relative z-10"
          style={{ background: "rgba(255,255,255,0.18)", color: "#fff" }}>
          <ArrowLeft size={16} />
        </Link>
        <h1 className="flex-1 text-base font-semibold text-white relative z-10">
          {tab === "classes" ? "Sinflar" : "O'quvchilar"}
        </h1>
        {tab === "classes" ? (
          <button onClick={() => setShowNewClass(true)}
            className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-xl font-medium relative z-10"
            style={{ background: "rgba(255,255,255,0.18)", color: "#fff" }}>
            <Plus size={14} /> Yangi sinf
          </button>
        ) : (
          <button onClick={() => setShowNewStudent(true)}
            className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-xl font-medium relative z-10"
            style={{ background: "rgba(255,255,255,0.18)", color: "#fff" }}>
            <Plus size={14} /> Yangi
          </button>
        )}
      </div>

      {/* Content */}
      <div className="bg-grid flex-1 mt-2 rounded-t-2xl overflow-hidden flex flex-col">

        {/* Tab bar */}
        <div className="px-5 pt-5 shrink-0">
          <div className="flex rounded-xl p-1 gap-1"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
            {(["classes", "students"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
                style={{
                  background: tab === t ? "var(--accent)" : "transparent",
                  color: tab === t ? "#fff" : "var(--text-muted)",
                }}>
                {t === "classes" ? "Sinflar" : "O'quvchilar"}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 pb-8">

          {/* ── SINFLAR ── */}
          {tab === "classes" && (
            <div className="flex flex-col gap-2 md:grid md:grid-cols-3 md:gap-4 md:auto-rows-min">
              {classList.map((cls, i) => {
                const badge = clsBadge(cls);
                return (
                  <div key={cls.id} className="card-3d rounded-2xl animate-slide-in"
                    style={{ background: "var(--bg-card)", border: "1px solid var(--border)", animationDelay: `${i * 40}ms` }}>
                    {/* Mobile */}
                    <div className="md:hidden px-4 py-3.5 flex items-center gap-3">
                      <Link href={`/class/${cls.id}/profile`} className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="rounded-xl flex items-center justify-center font-bold shrink-0"
                          style={{ background: "var(--accent-light)", color: "var(--accent)", minWidth: badge.minWidth, height: badge.height, fontSize: badge.fontSize, padding: "0 8px" }}>
                          {badge.text}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{cls.name} sinfi</p>
                          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                            {cls.studentCount} o'quvchi
                          </p>
                        </div>
                      </Link>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => { if (cls.telegramGroupId) { setSendClassId(cls.id); setSelectedSubject(""); } }}
                          className="w-8 h-8 rounded-lg flex items-center justify-center relative"
                          style={{
                            background: cls.telegramGroupId ? "#E8F5FB" : "var(--bg-primary)",
                            border: "1px solid var(--border)",
                            cursor: cls.telegramGroupId ? "pointer" : "not-allowed",
                            opacity: cls.telegramGroupId ? 1 : 0.45,
                          }}>
                          <Send size={14} style={{ color: cls.telegramGroupId ? "#229ED9" : "#374151" }} />
                          {!cls.telegramGroupId && (
                            <span style={{ position: "absolute", top: "50%", left: "3px", right: "3px", height: "2px", background: "var(--text-muted)", transform: "rotate(-35deg)", opacity: 0.5 }} />
                          )}
                        </button>
                        <Link href={`/class/${cls.id}`} className="px-3 py-2 rounded-lg text-xs font-medium"
                          style={{ background: "var(--bg-primary)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
                          Ro'yxat
                        </Link>
                        <button onClick={(e) => openClassMenu(e, cls.id)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{ background: "var(--bg-primary)", border: "1px solid var(--border)", color: "var(--text-muted)" }}>
                          <MoreVertical size={15} />
                        </button>
                      </div>
                    </div>
                    {/* Desktop */}
                    <div className="hidden md:flex flex-col p-5">
                      <Link href={`/class/${cls.id}/profile`} className="flex flex-col items-center text-center gap-3 flex-1 mb-4">
                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center font-bold"
                          style={{ background: "var(--accent-light)", color: "var(--accent)", fontSize: badge.fontSize * 1.6 }}>
                          {badge.text}
                        </div>
                        <div>
                          <p className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>{cls.name} sinfi</p>
                          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                            {cls.studentCount} o'quvchi
                          </p>
                        </div>
                      </Link>
                      <div className="flex items-center gap-2 mt-auto">
                        <Link href={`/class/${cls.id}`}
                          className="flex-1 py-2 rounded-xl text-xs font-medium text-center transition-all hover:opacity-80"
                          style={{ background: "var(--accent)", color: "#fff" }}>
                          Ro'yxat
                        </Link>
                        <button
                          onClick={() => { if (cls.telegramGroupId) { setSendClassId(cls.id); setSelectedSubject(""); } }}
                          className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 relative"
                          style={{
                            background: cls.telegramGroupId ? "#E8F5FB" : "var(--bg-primary)",
                            border: "1px solid var(--border)",
                            cursor: cls.telegramGroupId ? "pointer" : "not-allowed",
                            opacity: cls.telegramGroupId ? 1 : 0.45,
                          }}>
                          <Send size={14} style={{ color: cls.telegramGroupId ? "#229ED9" : "#374151" }} />
                          {!cls.telegramGroupId && (
                            <span style={{ position: "absolute", top: "50%", left: "3px", right: "3px", height: "2px", background: "var(--text-muted)", transform: "rotate(-35deg)", opacity: 0.5 }} />
                          )}
                        </button>
                        <button onClick={(e) => openClassMenu(e, cls.id)}
                          className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                          style={{ background: "var(--bg-primary)", border: "1px solid var(--border)", color: "var(--text-muted)" }}>
                          <MoreVertical size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              <button onClick={() => setShowNewClass(true)}
                className="rounded-2xl px-4 py-3.5 flex items-center justify-center gap-2 transition-all hover:opacity-60 md:min-h-36"
                style={{ border: "2px dashed var(--border)", color: "var(--text-muted)" }}>
                <Plus size={16} />
                <span className="text-sm">Yangi sinf qo'shish</span>
              </button>
            </div>
          )}

          {/* ── O'QUVCHILAR ── */}
          {tab === "students" && (
            <div className="flex flex-col gap-2">
              {/* Search */}
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                <Search size={14} style={{ color: "var(--text-muted)" }} />
                <input value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="Qidirish..."
                  className="flex-1 bg-transparent outline-none text-sm"
                  style={{ color: "var(--text-primary)" }} />
              </div>

              {/* Mobile list / Desktop card grid */}
              <div className="flex flex-col gap-2 md:grid md:grid-cols-3 md:gap-4 md:auto-rows-min">
                {filteredStudents.map((s, i) => {
                  const color = avatarColors[(parseInt(s.id) - 1) % avatarColors.length];
                  const initials = s.name.split(" ").map((n) => n[0]).join("").slice(0, 2);
                  return (
                    <div key={s.id} className="card-3d rounded-2xl animate-slide-in"
                      style={{ background: "var(--bg-card)", border: "1px solid var(--border)", animationDelay: `${i * 25}ms` }}>

                      {/* Mobile: list row */}
                      <div className="md:hidden px-4 py-3 flex items-center gap-3">
                        <Link href={`/student/${s.id}`} className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80 transition-all">
                          <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                            style={{ background: color }}>
                            {initials}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{s.name}</p>
                            <p className="text-xs mt-0.5 flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
                              {s.telegramId ? (
                                <>
                                  <Send size={13} style={{ color: "#229ED9", flexShrink: 0 }} />
                                  {s.telegramId}
                                </>
                              ) : (
                                <>
                                  <span className="relative inline-flex items-center justify-center shrink-0" style={{ width: 15, height: 15 }}>
                                    <Send size={12} style={{ color: "#374151" }} />
                                    <span style={{ position: "absolute", top: "50%", left: "-1px", right: "-1px", height: "2px", background: "var(--text-muted)", transform: "rotate(-35deg)", opacity: 0.45 }} />
                                  </span>
                                  {s.submissionCount} ta
                                </>
                              )}
                            </p>
                          </div>
                        </Link>
                        <button
                          onClick={() => { if (s.telegramId) { setSendStudentId(s.id); setSelectedSubject(""); } }}
                          className="w-8 h-8 rounded-lg flex items-center justify-center relative shrink-0"
                          style={{
                            background: s.telegramId ? "#E8F5FB" : "var(--bg-primary)",
                            border: "1px solid var(--border)",
                            cursor: s.telegramId ? "pointer" : "not-allowed",
                            opacity: s.telegramId ? 1 : 0.45,
                          }}>
                          <Send size={14} style={{ color: s.telegramId ? "#229ED9" : "#374151" }} />
                          {!s.telegramId && (
                            <span style={{ position: "absolute", top: "50%", left: "3px", right: "3px", height: "2px", background: "var(--text-muted)", transform: "rotate(-35deg)", opacity: 0.5 }} />
                          )}
                        </button>
                        <button onClick={(e) => openStudentMenu(e, s.id)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                          style={{ background: "var(--bg-primary)", border: "1px solid var(--border)", color: "var(--text-muted)" }}>
                          <MoreVertical size={15} />
                        </button>
                      </div>

                      {/* Desktop: card */}
                      <div className="hidden md:flex flex-col p-5">
                        <Link href={`/student/${s.id}`} className="flex flex-col items-center text-center gap-2.5 flex-1 mb-4 hover:opacity-80 transition-all">
                          <div className="w-14 h-14 rounded-full flex items-center justify-center text-white text-lg font-bold"
                            style={{ background: color }}>
                            {initials}
                          </div>
                          <div>
                            <p className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>{s.name}</p>
                            <p className="text-xs mt-0.5 flex items-center justify-center gap-1" style={{ color: "var(--text-muted)" }}>
                              {s.telegramId ? (
                                <>
                                  <Send size={13} style={{ color: "#229ED9", flexShrink: 0 }} />
                                  {s.telegramId}
                                </>
                              ) : (
                                <>
                                  <span className="relative inline-flex items-center justify-center shrink-0" style={{ width: 15, height: 15 }}>
                                    <Send size={12} style={{ color: "#374151" }} />
                                    <span style={{ position: "absolute", top: "50%", left: "-1px", right: "-1px", height: "2px", background: "var(--text-muted)", transform: "rotate(-35deg)", opacity: 0.45 }} />
                                  </span>
                                  {s.submissionCount} ta
                                </>
                              )}
                            </p>
                          </div>
                        </Link>
                        <div className="flex items-center gap-2 mt-auto">
                          <Link href={`/student/${s.id}`}
                            className="flex-1 py-2 rounded-xl text-xs font-medium text-center transition-all hover:opacity-80"
                            style={{ background: "var(--accent)", color: "#fff" }}>
                            Profil
                          </Link>
                          <button
                            onClick={() => { if (s.telegramId) { setSendStudentId(s.id); setSelectedSubject(""); } }}
                            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 relative"
                            style={{
                              background: s.telegramId ? "#E8F5FB" : "var(--bg-primary)",
                              border: "1px solid var(--border)",
                              cursor: s.telegramId ? "pointer" : "not-allowed",
                              opacity: s.telegramId ? 1 : 0.45,
                            }}>
                            <Send size={14} style={{ color: s.telegramId ? "#229ED9" : "#374151" }} />
                            {!s.telegramId && (
                              <span style={{ position: "absolute", top: "50%", left: "3px", right: "3px", height: "2px", background: "var(--text-muted)", transform: "rotate(-35deg)", opacity: 0.5 }} />
                            )}
                          </button>
                          <button onClick={(e) => openStudentMenu(e, s.id)}
                            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                            style={{ background: "var(--bg-primary)", border: "1px solid var(--border)", color: "var(--text-muted)" }}>
                            <MoreVertical size={15} />
                          </button>
                        </div>
                      </div>

                    </div>
                  );
                })}

                {/* Add dashed button */}
                <button onClick={() => setShowNewStudent(true)}
                  className="rounded-2xl px-4 py-3.5 flex items-center justify-center gap-2 transition-all hover:opacity-60 md:min-h-36"
                  style={{ border: "2px dashed var(--border)", color: "var(--text-muted)" }}>
                  <UserPlus size={15} />
                  <span className="text-sm">Yangi o'quvchi qo'shish</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Class dropdown menu ── */}
      {classMenuState && (
        <>
          <div className="fixed inset-0 z-998" onClick={() => setClassMenuState(null)} />
          <div className="fixed z-999 rounded-xl overflow-hidden shadow-xl animate-fade-in"
            style={{ top: classMenuState.y, right: `calc(100vw - ${classMenuState.x}px)`, background: "var(--bg-card)", border: "1px solid var(--border)", minWidth: 150 }}>
            <button onClick={() => { router.push(`/class/${classMenuState.id}/profile`); setClassMenuState(null); }}
              className="w-full flex items-center gap-2.5 px-4 py-3 text-sm hover:opacity-70 transition-all">
              <Pencil size={14} style={{ color: "var(--text-muted)" }} />
              <span style={{ color: "var(--text-primary)" }}>Tahrirlash</span>
            </button>
            <div style={{ height: 1, background: "var(--border)" }} />
            <button onClick={() => { setDeleteClassId(classMenuState.id); setClassMenuState(null); }}
              className="w-full flex items-center gap-2.5 px-4 py-3 text-sm hover:opacity-70 transition-all">
              <Trash2 size={14} style={{ color: "var(--error)" }} />
              <span style={{ color: "var(--error)" }}>O'chirish</span>
            </button>
          </div>
        </>
      )}

      {/* ── Student dropdown menu ── */}
      {studentMenuState && (
        <>
          <div className="fixed inset-0 z-998" onClick={() => setStudentMenuState(null)} />
          <div className="fixed z-999 rounded-xl overflow-hidden shadow-xl animate-fade-in"
            style={{ top: studentMenuState.y, right: `calc(100vw - ${studentMenuState.x}px)`, background: "var(--bg-card)", border: "1px solid var(--border)", minWidth: 160 }}>
            <button onClick={() => { router.push(`/student/${studentMenuState.id}`); setStudentMenuState(null); }}
              className="w-full flex items-center gap-2.5 px-4 py-3 text-sm hover:opacity-70 transition-all">
              <Users size={14} style={{ color: "var(--text-muted)" }} />
              <span style={{ color: "var(--text-primary)" }}>Profilni ko'rish</span>
            </button>
            <div style={{ height: 1, background: "var(--border)" }} />
            <button onClick={() => { setDeleteStudentId(studentMenuState.id); setStudentMenuState(null); }}
              className="w-full flex items-center gap-2.5 px-4 py-3 text-sm hover:opacity-70 transition-all">
              <Trash2 size={14} style={{ color: "var(--error)" }} />
              <span style={{ color: "var(--error)" }}>O'chirish</span>
            </button>
          </div>
        </>
      )}

      {/* ── Yangi sinf modal ── */}
      {showNewClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "#00000060" }}
          onClick={(e) => e.target === e.currentTarget && setShowNewClass(false)}>
          <div className="w-full max-w-sm rounded-2xl p-5 animate-fade-in"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>Yangi sinf</h2>
              <button onClick={() => { setShowNewClass(false); setNewClassIcon(""); setNewClassName(""); setNewClassTgGroup(""); }}
                className="w-8 h-8 rounded-xl flex items-center justify-center hover:opacity-70"
                style={{ background: "var(--bg-primary)", border: "1px solid var(--border)", color: "var(--text-muted)" }}>
                <X size={15} />
              </button>
            </div>
            <div className="flex items-end gap-3 mb-3">
              <div className="shrink-0 flex flex-col items-center gap-1.5">
                <p className="text-[10px] font-medium" style={{ color: "var(--text-muted)" }}>KO'RINISH</p>
                <div className="rounded-xl flex items-center justify-center font-bold"
                  style={{
                    background: "var(--accent-light)", color: "var(--accent)",
                    minWidth: 44, height: 44, padding: "0 8px",
                    fontSize: (newClassIcon || newClassName.charAt(0)).length <= 1 ? 20
                      : (newClassIcon || newClassName.charAt(0)).length === 2 ? 14
                      : (newClassIcon || newClassName.charAt(0)).length === 3 ? 11 : 9,
                  }}>
                  {newClassIcon.trim() || newClassName.charAt(0) || "A"}
                </div>
              </div>
              <div className="flex-1 flex flex-col gap-2">
                <div>
                  <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>Belgi (max 4 ta, ixtiyoriy)</p>
                  <input value={newClassIcon} onChange={(e) => setNewClassIcon(e.target.value.slice(0, 4))}
                    placeholder={newClassName.charAt(0) || "9A"} maxLength={4}
                    className="w-full px-3 py-2 rounded-xl text-sm outline-none font-bold text-center"
                    style={{ background: "var(--accent-light)", border: "1px solid var(--accent)", color: "var(--accent)" }} />
                </div>
                <div>
                  <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>Sinf nomi</p>
                  <input autoFocus value={newClassName} onChange={(e) => setNewClassName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addClass()}
                    placeholder="Masalan: 9-A"
                    className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                    style={{ background: "var(--bg-primary)", border: "1px solid var(--border)", color: "var(--text-primary)" }} />
                </div>
              </div>
            </div>
            <div className="mb-3">
              <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>
                Telegram guruh ID (ixtiyoriy)
              </p>
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
                style={{ background: "var(--bg-primary)", border: "1px solid var(--border)" }}>
                <Send size={13} style={{ color: newClassTgGroup ? "#229ED9" : "var(--border)", flexShrink: 0 }} />
                <input value={newClassTgGroup} onChange={(e) => setNewClassTgGroup(e.target.value)}
                  placeholder="-100xxxxxxxxxx yoki @groupname"
                  className="flex-1 bg-transparent outline-none text-sm"
                  style={{ color: "var(--text-primary)" }} />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => { setShowNewClass(false); setNewClassIcon(""); setNewClassName(""); setNewClassTgGroup(""); }}
                className="flex-1 py-2.5 rounded-xl text-sm"
                style={{ background: "var(--bg-primary)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
                Bekor
              </button>
              <button onClick={addClass} className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                style={{ background: "var(--accent)", color: "#fff" }}>
                Yaratish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Yangi o'quvchi modal ── */}
      {showNewStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "#00000060" }}
          onClick={(e) => e.target === e.currentTarget && setShowNewStudent(false)}>
          <div className="w-full max-w-sm rounded-2xl p-5 animate-fade-in"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>Yangi o'quvchi</h2>
              <button onClick={() => { setShowNewStudent(false); setNewStudentName(""); setNewStudentTgId(""); setNewStudentClassIds([]); }}
                className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: "var(--bg-primary)", border: "1px solid var(--border)", color: "var(--text-muted)" }}>
                <X size={15} />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <p className="text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>Ism Familiya</p>
                <input autoFocus value={newStudentName} onChange={(e) => setNewStudentName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && createStudent()}
                  placeholder="Ali Valiyev"
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: "var(--bg-primary)", border: "1px solid var(--border)", color: "var(--text-primary)" }} />
              </div>
              <div>
                <p className="text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>Telegram ID (ixtiyoriy)</p>
                <input value={newStudentTgId} onChange={(e) => setNewStudentTgId(e.target.value)}
                  placeholder="@username yoki raqam"
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: "var(--bg-primary)", border: "1px solid var(--border)", color: "var(--text-primary)" }} />
              </div>

              {/* Guruh tanlash */}
              {classList.length > 0 && (
                <div>
                  <p className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>Guruhga biriktirish (ixtiyoriy)</p>
                  <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto">
                    {classList.map((cls) => {
                      const badge = clsBadge(cls);
                      const selected = newStudentClassIds.includes(cls.id);
                      return (
                        <button key={cls.id} onClick={() => toggleNewStudentClass(cls.id)}
                          className="flex items-center gap-3 px-3 py-2 rounded-xl transition-all text-left"
                          style={{
                            background: selected ? "var(--accent-light)" : "var(--bg-primary)",
                            border: `1px solid ${selected ? "var(--accent)" : "var(--border)"}`,
                          }}>
                          <div className="rounded-lg flex items-center justify-center font-bold shrink-0 text-xs"
                            style={{ background: selected ? "var(--accent)" : "var(--border)", color: selected ? "#fff" : "var(--text-muted)", width: 28, height: 28, fontSize: badge.fontSize * 0.8 }}>
                            {badge.text}
                          </div>
                          <span className="flex-1 text-sm font-medium" style={{ color: selected ? "var(--accent)" : "var(--text-primary)" }}>
                            {cls.name} sinfi
                          </span>
                          <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0"
                            style={{ borderColor: selected ? "var(--accent)" : "var(--border)", background: selected ? "var(--accent)" : "transparent" }}>
                            {selected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2 mt-4">
              <button onClick={() => { setShowNewStudent(false); setNewStudentName(""); setNewStudentTgId(""); setNewStudentClassIds([]); }}
                className="flex-1 py-2.5 rounded-xl text-sm"
                style={{ background: "var(--bg-primary)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
                Bekor
              </button>
              <button onClick={createStudent} className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                style={{ background: "var(--accent)", color: "#fff" }}>
                Qo'shish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Sinf Telegram send modal ── */}
      {sendClassId && (() => {
        const cls = classList.find((c) => c.id === sendClassId);
        if (!cls) return null;
        const classStudents = allStudents.filter((s) => cls.studentIds.includes(s.id));
        return (
          <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4"
            style={{ background: "#00000060" }}
            onClick={(e) => e.target === e.currentTarget && setSendClassId(null)}>
            <div className="w-full max-w-sm rounded-t-2xl sm:rounded-2xl p-5 animate-slide-in sm:animate-fade-in"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex flex-col gap-0.5">
                  <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
                    Telegram guruhga yuborish
                  </h2>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {cls.name} · {cls.telegramGroupId} · {classStudents.length} o'quvchi
                  </p>
                </div>
                <button onClick={() => setSendClassId(null)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: "var(--bg-primary)", border: "1px solid var(--border)", color: "var(--text-muted)" }}>
                  <X size={15} />
                </button>
              </div>

              <p className="text-xs mb-2.5 font-medium" style={{ color: "var(--text-muted)" }}>Fan tanlang</p>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {SUBJECTS.map((sub) => {
                  const active = selectedSubject === sub.name;
                  return (
                    <button key={sub.name} onClick={() => setSelectedSubject(active ? "" : sub.name)}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all text-left"
                      style={{
                        background: active ? "var(--accent-light)" : "var(--bg-primary)",
                        border: `1.5px solid ${active ? "var(--accent)" : "var(--border)"}`,
                      }}>
                      <span className="text-base">{sub.icon}</span>
                      <span className="text-sm font-medium" style={{ color: active ? "var(--accent)" : "var(--text-primary)" }}>
                        {sub.name}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-2">
                <button onClick={() => setSendClassId(null)} className="flex-1 py-2.5 rounded-xl text-sm"
                  style={{ background: "var(--bg-primary)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
                  Bekor
                </button>
                <button
                  disabled={!selectedSubject}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all"
                  style={{
                    background: selectedSubject ? "var(--accent)" : "var(--bg-primary)",
                    border: selectedSubject ? "none" : "1px solid var(--border)",
                    color: selectedSubject ? "#fff" : "var(--text-muted)",
                    cursor: selectedSubject ? "pointer" : "not-allowed",
                    opacity: selectedSubject ? 1 : 0.6,
                  }}>
                  <Send size={14} />
                  Yuborish
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── O'quvchi Telegram send modal ── */}
      {sendStudentId && (() => {
        const s = allStudents.find((st) => st.id === sendStudentId);
        if (!s) return null;
        return (
          <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4"
            style={{ background: "#00000060" }}
            onClick={(e) => e.target === e.currentTarget && setSendStudentId(null)}>
            <div className="w-full max-w-sm rounded-t-2xl sm:rounded-2xl p-5 animate-slide-in sm:animate-fade-in"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex flex-col gap-0.5">
                  <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
                    Natijani yuborish
                  </h2>
                  <p className="text-xs flex items-center gap-1" style={{ color: "#229ED9" }}>
                    <Send size={11} style={{ color: "#229ED9" }} />
                    {s.telegramId}
                  </p>
                </div>
                <button onClick={() => setSendStudentId(null)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: "var(--bg-primary)", border: "1px solid var(--border)", color: "var(--text-muted)" }}>
                  <X size={15} />
                </button>
              </div>

              <p className="text-xs mb-2.5 font-medium" style={{ color: "var(--text-muted)" }}>Fan tanlang</p>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {SUBJECTS.map((sub) => {
                  const active = selectedSubject === sub.name;
                  return (
                    <button key={sub.name} onClick={() => setSelectedSubject(active ? "" : sub.name)}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all text-left"
                      style={{
                        background: active ? "var(--accent-light)" : "var(--bg-primary)",
                        border: `1.5px solid ${active ? "var(--accent)" : "var(--border)"}`,
                      }}>
                      <span className="text-base">{sub.icon}</span>
                      <span className="text-sm font-medium" style={{ color: active ? "var(--accent)" : "var(--text-primary)" }}>
                        {sub.name}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-2">
                <button onClick={() => setSendStudentId(null)} className="flex-1 py-2.5 rounded-xl text-sm"
                  style={{ background: "var(--bg-primary)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
                  Bekor
                </button>
                <button
                  disabled={!selectedSubject}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all"
                  style={{
                    background: selectedSubject ? "#229ED9" : "var(--bg-primary)",
                    border: selectedSubject ? "none" : "1px solid var(--border)",
                    color: selectedSubject ? "#fff" : "var(--text-muted)",
                    cursor: selectedSubject ? "pointer" : "not-allowed",
                    opacity: selectedSubject ? 1 : 0.6,
                  }}>
                  <Send size={14} />
                  Yuborish
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Sinfni o'chirish ── */}
      {deleteClassId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "#00000060" }}
          onClick={(e) => e.target === e.currentTarget && setDeleteClassId(null)}>
          <div className="w-full max-w-xs rounded-2xl p-5 animate-fade-in"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>Sinfni o'chirish</p>
              <button onClick={() => setDeleteClassId(null)}
                className="w-8 h-8 rounded-xl flex items-center justify-center hover:opacity-70"
                style={{ background: "var(--bg-primary)", border: "1px solid var(--border)", color: "var(--text-muted)" }}>
                <X size={15} />
              </button>
            </div>
            <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
              <b>{classList.find((c) => c.id === deleteClassId)?.name}</b> sinfi va barcha ma'lumotlari o'chadi.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteClassId(null)} className="flex-1 py-2.5 rounded-xl text-sm"
                style={{ background: "var(--bg-primary)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
                Bekor
              </button>
              <button onClick={() => deleteClass(deleteClassId)} className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                style={{ background: "var(--error)", color: "#fff" }}>
                O'chirish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── O'quvchini o'chirish ── */}
      {deleteStudentId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "#00000060" }}
          onClick={(e) => e.target === e.currentTarget && setDeleteStudentId(null)}>
          <div className="w-full max-w-xs rounded-2xl p-5 animate-fade-in"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>O'quvchini o'chirish</p>
              <button onClick={() => setDeleteStudentId(null)}
                className="w-8 h-8 rounded-xl flex items-center justify-center hover:opacity-70"
                style={{ background: "var(--bg-primary)", border: "1px solid var(--border)", color: "var(--text-muted)" }}>
                <X size={15} />
              </button>
            </div>
            <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
              <b>{allStudents.find((s) => s.id === deleteStudentId)?.name}</b> barcha sinflardan ham o'chiriladi.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteStudentId(null)} className="flex-1 py-2.5 rounded-xl text-sm"
                style={{ background: "var(--bg-primary)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
                Bekor
              </button>
              <button onClick={() => deleteStudent(deleteStudentId)} className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                style={{ background: "var(--error)", color: "#fff" }}>
                O'chirish
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
