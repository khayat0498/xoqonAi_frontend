"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Plus, Users, X, Pencil, Trash2, MoreVertical, Search, UserPlus, Send,
} from "lucide-react";
import { getToken } from "@/lib/auth";
import { useT } from "@/lib/i18n-context";

const API = process.env.NEXT_PUBLIC_API_URL;

function authHeaders() {
  return { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` };
}

type ClassItem = {
  id: string;
  name: string;
  icon: string | null;
  telegramGroupId: string | null;
  studentCount: number;
  createdAt: string;
};

type Student = {
  id: string;
  name: string;
  telegramId: string | null;
  classCount: number;
  createdAt: string;
};

const avatarColors = ["#1a5c6b","#6366F1","#e8732a","#2a9d6a","#3B82F6","#8B5CF6","#EC4899","#d4a017"];

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
  const { t } = useT();
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

  useEffect(() => {
    async function load() {
      const [classRes, studentRes] = await Promise.all([
        fetch(`${API}/api/classes`, { headers: authHeaders() }),
        fetch(`${API}/api/students`, { headers: authHeaders() }),
      ]);
      if (classRes.ok) setClassList(await classRes.json());
      if (studentRes.ok) {
        const data = await studentRes.json();
        setAllStudents(data.students);
      }
    }
    load();
  }, []);

  const openClassMenu = useCallback((e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setClassMenuState({ id, x: rect.right, y: rect.bottom + 6 });
  }, []);

  const addClass = async () => {
    const name = newClassName.trim();
    if (!name) return;
    const res = await fetch(`${API}/api/classes`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        name,
        icon: newClassIcon.trim() || undefined,
        telegramGroupId: newClassTgGroup.trim() || undefined,
      }),
    });
    if (res.ok) {
      const created = await res.json();
      setClassList((prev) => [...prev, { ...created, studentCount: 0 }]);
    }
    setNewClassName(""); setNewClassIcon(""); setNewClassTgGroup(""); setShowNewClass(false);
  };

  const deleteClass = async (id: string) => {
    const res = await fetch(`${API}/api/classes/${id}`, { method: "DELETE", headers: authHeaders() });
    if (res.ok) setClassList((prev) => prev.filter((c) => c.id !== id));
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

  const createStudent = async () => {
    const name = newStudentName.trim();
    if (!name) return;
    const res = await fetch(`${API}/api/students`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        name,
        telegramId: newStudentTgId.trim() || undefined,
        classId: newStudentClassIds[0],
      }),
    });
    if (res.ok) {
      const created = await res.json();
      // Qolgan sinflar uchun alohida qo'shish
      for (const cid of newStudentClassIds.slice(1)) {
        await fetch(`${API}/api/classes/${cid}/students`, {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({ studentId: created.id }),
        });
      }
      setAllStudents((prev) => [...prev, { ...created, classCount: newStudentClassIds.length }]);
      setClassList((prev) => prev.map((c) =>
        newStudentClassIds.includes(c.id) ? { ...c, studentCount: c.studentCount + 1 } : c
      ));
    }
    setNewStudentName(""); setNewStudentTgId(""); setNewStudentClassIds([]);
    setShowNewStudent(false);
  };

  const deleteStudent = async (id: string) => {
    const res = await fetch(`${API}/api/students/${id}`, { method: "DELETE", headers: authHeaders() });
    if (res.ok) setAllStudents((prev) => prev.filter((s) => s.id !== id));
    setDeleteStudentId(null);
  };

  const filteredStudents = allStudents.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-screen" style={{ background: "var(--bg-primary)" }}>

      {/* Header */}
      <div className="px-5 pt-4 pb-8 flex items-center gap-3 relative overflow-hidden shrink-0"
        style={{ background: "linear-gradient(135deg, var(--accent-dark) 0%, var(--accent) 100%)", boxShadow: "var(--shadow-card)", zIndex: 10 }}>
        <div style={{ position: "absolute", right: -20, top: -30, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.07)" }} />
        <div style={{ position: "absolute", right: 50, bottom: -20, width: 70, height: 70, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
        <Link href="/home" className="w-8 h-8 rounded-xl flex items-center justify-center relative z-10"
          style={{ background: "rgba(255,255,255,0.18)", color: "#fff" }}>
          <ArrowLeft size={16} />
        </Link>
        <h1 className="flex-1 text-base font-semibold text-white relative z-10" style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>
          {tab === "classes" ? t("dashboard.tabs.classes") : t("dashboard.tabs.students")}
        </h1>
        {tab === "classes" ? (
          <button onClick={() => setShowNewClass(true)}
            className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-xl font-medium relative z-10"
            style={{ background: "rgba(255,255,255,0.18)", color: "#fff" }}>
            <Plus size={14} /> {t("home.newClass")}
          </button>
        ) : (
          <button onClick={() => setShowNewStudent(true)}
            className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-xl font-medium relative z-10"
            style={{ background: "rgba(255,255,255,0.18)", color: "#fff" }}>
            <Plus size={14} /> {t("dashboard.newStudentBtn")}
          </button>
        )}
      </div>

      {/* Content */}
      <div className="bg-grid flex-1 mt-2 overflow-hidden flex flex-col" style={{ borderRadius: "var(--radius-lg) var(--radius-lg) 0 0" }}>

        {/* Tab bar */}
        <div className="px-5 pt-5 shrink-0">
          <div className="flex p-1 gap-1"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)" }}>
            {(["classes", "students"] as const).map((tabKey) => (
              <button key={tabKey} onClick={() => setTab(tabKey)}
                className="flex-1 py-2 text-sm font-medium transition-all"
                style={{
                  borderRadius: "var(--radius-sm)",
                  background: tab === tabKey ? "var(--accent)" : "transparent",
                  color: tab === tabKey ? "#fff" : "var(--text-muted)",
                }}>
                {tabKey === "classes" ? t("dashboard.tabs.classes") : t("dashboard.tabs.students")}
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
                  <div key={cls.id} className="card-3d animate-slide-in"
                    style={{ background: "var(--bg-card)", border: "1px solid var(--border-light)", borderRadius: "var(--radius-md)", animationDelay: `${i * 40}ms`, boxShadow: "var(--shadow-card)" }}>
                    {/* Mobile */}
                    <div className="md:hidden px-4 py-3.5 flex items-center gap-3">
                      <Link href={`/class/${cls.id}/profile`} prefetch={false} className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="flex items-center justify-center font-bold shrink-0"
                          style={{ background: "var(--accent-light)", color: "var(--accent)", minWidth: badge.minWidth, height: badge.height, fontSize: badge.fontSize, padding: "0 8px", borderRadius: "var(--radius-sm)" }}>
                          {badge.text}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{cls.name} {t("home.classSuffix")}</p>
                          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                            {cls.studentCount} {t("home.studentsUnit")}
                          </p>
                        </div>
                      </Link>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => { if (cls.telegramGroupId) { setSendClassId(cls.id); setSelectedSubject(""); } }}
                          className="w-8 h-8 flex items-center justify-center relative"
                          style={{
                            borderRadius: "var(--radius-sm)",
                            background: cls.telegramGroupId ? "#E8F5FB" : "var(--bg-primary)",
                            border: "1px solid var(--border)",
                            cursor: cls.telegramGroupId ? "pointer" : "not-allowed",
                            opacity: cls.telegramGroupId ? 1 : 0.45,
                          }}>
                          <Send size={14} style={{ color: cls.telegramGroupId ? "#229ED9" : "var(--text-muted)" }} />
                          {!cls.telegramGroupId && (
                            <span style={{ position: "absolute", top: "50%", left: "3px", right: "3px", height: "2px", background: "var(--text-muted)", transform: "rotate(-35deg)", opacity: 0.5 }} />
                          )}
                        </button>
                        <Link href={`/class/${cls.id}`} prefetch={false} className="px-3 py-2 text-xs font-medium"
                          style={{ borderRadius: "var(--radius-sm)", background: "var(--bg-primary)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
                          {t("home.list")}
                        </Link>
                        <button onClick={(e) => openClassMenu(e, cls.id)}
                          className="w-8 h-8 flex items-center justify-center"
                          style={{ borderRadius: "var(--radius-sm)", background: "var(--bg-primary)", border: "1px solid var(--border)", color: "var(--text-muted)" }}>
                          <MoreVertical size={15} />
                        </button>
                      </div>
                    </div>
                    {/* Desktop */}
                    <div className="hidden md:flex flex-col p-5">
                      <Link href={`/class/${cls.id}/profile`} prefetch={false} className="flex flex-col items-center text-center gap-3 flex-1 mb-4">
                        <div className="w-16 h-16 flex items-center justify-center font-bold"
                          style={{ background: "var(--accent-light)", color: "var(--accent)", fontSize: badge.fontSize * 1.6, borderRadius: "var(--radius-md)" }}>
                          {badge.text}
                        </div>
                        <div>
                          <p className="text-base font-semibold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>{cls.name} {t("home.classSuffix")}</p>
                          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                            {cls.studentCount} {t("home.studentsUnit")}
                          </p>
                        </div>
                      </Link>
                      <div className="flex items-center gap-2 mt-auto">
                        <Link href={`/class/${cls.id}`} prefetch={false}
                          className="flex-1 py-2 text-xs font-medium text-center transition-all hover:opacity-80"
                          style={{ background: "var(--accent)", color: "#fff", borderRadius: "var(--radius-sm)" }}>
                          {t("home.list")}
                        </Link>
                        <button
                          onClick={() => { if (cls.telegramGroupId) { setSendClassId(cls.id); setSelectedSubject(""); } }}
                          className="w-8 h-8 flex items-center justify-center shrink-0 relative"
                          style={{
                            borderRadius: "var(--radius-sm)",
                            background: cls.telegramGroupId ? "#E8F5FB" : "var(--bg-primary)",
                            border: "1px solid var(--border)",
                            cursor: cls.telegramGroupId ? "pointer" : "not-allowed",
                            opacity: cls.telegramGroupId ? 1 : 0.45,
                          }}>
                          <Send size={14} style={{ color: cls.telegramGroupId ? "#229ED9" : "var(--text-muted)" }} />
                          {!cls.telegramGroupId && (
                            <span style={{ position: "absolute", top: "50%", left: "3px", right: "3px", height: "2px", background: "var(--text-muted)", transform: "rotate(-35deg)", opacity: 0.5 }} />
                          )}
                        </button>
                        <button onClick={(e) => openClassMenu(e, cls.id)}
                          className="w-8 h-8 flex items-center justify-center shrink-0"
                          style={{ borderRadius: "var(--radius-sm)", background: "var(--bg-primary)", border: "1px solid var(--border)", color: "var(--text-muted)" }}>
                          <MoreVertical size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              <button onClick={() => setShowNewClass(true)}
                className="px-4 py-3.5 flex items-center justify-center gap-2 transition-all hover:opacity-60 md:min-h-36"
                style={{ border: "2px dashed var(--border)", color: "var(--text-muted)", borderRadius: "var(--radius-md)" }}>
                <Plus size={16} />
                <span className="text-sm">{t("dashboard.addNewClass")}</span>
              </button>
            </div>
          )}

          {/* ── O'QUVCHILAR ── */}
          {tab === "students" && (
            <div className="flex flex-col gap-2">
              {/* Search */}
              <div className="flex items-center gap-2 px-3 py-2.5"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)" }}>
                <Search size={14} style={{ color: "var(--text-muted)" }} />
                <input value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder={t("dashboard.searchPlaceholder")}
                  className="flex-1 bg-transparent outline-none text-sm"
                  style={{ color: "var(--text-primary)" }} />
              </div>

              {/* Mobile list / Desktop card grid */}
              <div className="flex flex-col gap-2 md:grid md:grid-cols-3 md:gap-4 md:auto-rows-min">
                {filteredStudents.map((s, i) => {
                  const color = avatarColors[i % avatarColors.length];
                  const initials = s.name.split(" ").map((n) => n[0]).join("").slice(0, 2);
                  return (
                    <div key={s.id} className="card-3d animate-slide-in"
                      style={{ background: "var(--bg-card)", border: "1px solid var(--border-light)", borderRadius: "var(--radius-md)", animationDelay: `${i * 25}ms`, boxShadow: "var(--shadow-card)" }}>

                      {/* Mobile: list row */}
                      <div className="md:hidden px-4 py-3 flex items-center gap-3">
                        <Link href={`/student/${s.id}`} prefetch={false} className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80 transition-all">
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
                                    <Send size={12} style={{ color: "var(--text-muted)" }} />
                                    <span style={{ position: "absolute", top: "50%", left: "-1px", right: "-1px", height: "2px", background: "var(--text-muted)", transform: "rotate(-35deg)", opacity: 0.45 }} />
                                  </span>
                                  {s.classCount} {t("home.classesUnit")}
                                </>
                              )}
                            </p>
                          </div>
                        </Link>
                        <button
                          onClick={() => { if (s.telegramId) { setSendStudentId(s.id); setSelectedSubject(""); } }}
                          className="w-8 h-8 flex items-center justify-center relative shrink-0"
                          style={{
                            borderRadius: "var(--radius-sm)",
                            background: s.telegramId ? "#E8F5FB" : "var(--bg-primary)",
                            border: "1px solid var(--border)",
                            cursor: s.telegramId ? "pointer" : "not-allowed",
                            opacity: s.telegramId ? 1 : 0.45,
                          }}>
                          <Send size={14} style={{ color: s.telegramId ? "#229ED9" : "var(--text-muted)" }} />
                          {!s.telegramId && (
                            <span style={{ position: "absolute", top: "50%", left: "3px", right: "3px", height: "2px", background: "var(--text-muted)", transform: "rotate(-35deg)", opacity: 0.5 }} />
                          )}
                        </button>
                        <button onClick={(e) => openStudentMenu(e, s.id)}
                          className="w-8 h-8 flex items-center justify-center shrink-0"
                          style={{ borderRadius: "var(--radius-sm)", background: "var(--bg-primary)", border: "1px solid var(--border)", color: "var(--text-muted)" }}>
                          <MoreVertical size={15} />
                        </button>
                      </div>

                      {/* Desktop: card */}
                      <div className="hidden md:flex flex-col p-5">
                        <Link href={`/student/${s.id}`} prefetch={false} className="flex flex-col items-center text-center gap-2.5 flex-1 mb-4 hover:opacity-80 transition-all">
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
                                    <Send size={12} style={{ color: "var(--text-muted)" }} />
                                    <span style={{ position: "absolute", top: "50%", left: "-1px", right: "-1px", height: "2px", background: "var(--text-muted)", transform: "rotate(-35deg)", opacity: 0.45 }} />
                                  </span>
                                  {s.classCount} {t("home.classesUnit")}
                                </>
                              )}
                            </p>
                          </div>
                        </Link>
                        <div className="flex items-center gap-2 mt-auto">
                          <Link href={`/student/${s.id}`} prefetch={false}
                            className="flex-1 py-2 text-xs font-medium text-center transition-all hover:opacity-80"
                            style={{ background: "var(--accent)", color: "#fff", borderRadius: "var(--radius-sm)" }}>
                            {t("dashboard.profileBtn")}
                          </Link>
                          <button
                            onClick={() => { if (s.telegramId) { setSendStudentId(s.id); setSelectedSubject(""); } }}
                            className="w-8 h-8 flex items-center justify-center shrink-0 relative"
                            style={{
                              borderRadius: "var(--radius-sm)",
                              background: s.telegramId ? "#E8F5FB" : "var(--bg-primary)",
                              border: "1px solid var(--border)",
                              cursor: s.telegramId ? "pointer" : "not-allowed",
                              opacity: s.telegramId ? 1 : 0.45,
                            }}>
                            <Send size={14} style={{ color: s.telegramId ? "#229ED9" : "var(--text-muted)" }} />
                            {!s.telegramId && (
                              <span style={{ position: "absolute", top: "50%", left: "3px", right: "3px", height: "2px", background: "var(--text-muted)", transform: "rotate(-35deg)", opacity: 0.5 }} />
                            )}
                          </button>
                          <button onClick={(e) => openStudentMenu(e, s.id)}
                            className="w-8 h-8 flex items-center justify-center shrink-0"
                            style={{ borderRadius: "var(--radius-sm)", background: "var(--bg-primary)", border: "1px solid var(--border)", color: "var(--text-muted)" }}>
                            <MoreVertical size={15} />
                          </button>
                        </div>
                      </div>

                    </div>
                  );
                })}

                {/* Add dashed button */}
                <button onClick={() => setShowNewStudent(true)}
                  className="px-4 py-3.5 flex items-center justify-center gap-2 transition-all hover:opacity-60 md:min-h-36"
                  style={{ border: "2px dashed var(--border)", color: "var(--text-muted)", borderRadius: "var(--radius-md)" }}>
                  <UserPlus size={15} />
                  <span className="text-sm">{t("dashboard.addNewStudent")}</span>
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
          <div className="fixed z-999 overflow-hidden shadow-xl animate-fade-in"
            style={{ top: classMenuState.y, right: `calc(100vw - ${classMenuState.x}px)`, background: "var(--bg-card)", border: "1px solid var(--border)", minWidth: 150, borderRadius: "var(--radius-sm)" }}>
            <button onClick={() => { router.push(`/class/${classMenuState.id}/profile`); setClassMenuState(null); }}
              className="w-full flex items-center gap-2.5 px-4 py-3 text-sm hover:opacity-70 transition-all">
              <Pencil size={14} style={{ color: "var(--text-muted)" }} />
              <span style={{ color: "var(--text-primary)" }}>{t("common.edit")}</span>
            </button>
            <div style={{ height: 1, background: "var(--border)" }} />
            <button onClick={() => { setDeleteClassId(classMenuState.id); setClassMenuState(null); }}
              className="w-full flex items-center gap-2.5 px-4 py-3 text-sm hover:opacity-70 transition-all">
              <Trash2 size={14} style={{ color: "var(--error)" }} />
              <span style={{ color: "var(--error)" }}>{t("common.delete")}</span>
            </button>
          </div>
        </>
      )}

      {/* ── Student dropdown menu ── */}
      {studentMenuState && (
        <>
          <div className="fixed inset-0 z-998" onClick={() => setStudentMenuState(null)} />
          <div className="fixed z-999 overflow-hidden shadow-xl animate-fade-in"
            style={{ top: studentMenuState.y, right: `calc(100vw - ${studentMenuState.x}px)`, background: "var(--bg-card)", border: "1px solid var(--border)", minWidth: 160, borderRadius: "var(--radius-sm)" }}>
            <button onClick={() => { router.push(`/student/${studentMenuState.id}`); setStudentMenuState(null); }}
              className="w-full flex items-center gap-2.5 px-4 py-3 text-sm hover:opacity-70 transition-all">
              <Users size={14} style={{ color: "var(--text-muted)" }} />
              <span style={{ color: "var(--text-primary)" }}>{t("class.viewProfile")}</span>
            </button>
            <div style={{ height: 1, background: "var(--border)" }} />
            <button onClick={() => { setDeleteStudentId(studentMenuState.id); setStudentMenuState(null); }}
              className="w-full flex items-center gap-2.5 px-4 py-3 text-sm hover:opacity-70 transition-all">
              <Trash2 size={14} style={{ color: "var(--error)" }} />
              <span style={{ color: "var(--error)" }}>{t("common.delete")}</span>
            </button>
          </div>
        </>
      )}

      {/* ── Yangi sinf modal ── */}
      {showNewClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "#00000060" }}
          onClick={(e) => e.target === e.currentTarget && setShowNewClass(false)}>
          <div className="w-full max-w-sm p-5 animate-fade-in"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>{t("dashboard.newClassTitle")}</h2>
              <button onClick={() => { setShowNewClass(false); setNewClassIcon(""); setNewClassName(""); setNewClassTgGroup(""); }}
                className="w-8 h-8 flex items-center justify-center hover:opacity-70"
                style={{ borderRadius: "var(--radius-sm)", background: "var(--bg-primary)", border: "1px solid var(--border)", color: "var(--text-muted)" }}>
                <X size={15} />
              </button>
            </div>
            <div className="flex items-end gap-3 mb-3">
              <div className="shrink-0 flex flex-col items-center gap-1.5">
                <p className="text-[10px] font-medium" style={{ color: "var(--text-muted)" }}>{t("dashboard.appearance")}</p>
                <div className="flex items-center justify-center font-bold"
                  style={{
                    borderRadius: "var(--radius-sm)",
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
                  <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>{t("dashboard.iconLabel")}</p>
                  <input value={newClassIcon} onChange={(e) => setNewClassIcon(e.target.value.slice(0, 4))}
                    placeholder={newClassName.charAt(0) || "9A"} maxLength={4}
                    className="w-full px-3 py-2 text-sm outline-none font-bold text-center"
                    style={{ borderRadius: "var(--radius-sm)", background: "var(--accent-light)", border: "1px solid var(--accent)", color: "var(--accent)" }} />
                </div>
                <div>
                  <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>{t("dashboard.classNameLabel")}</p>
                  <input autoFocus value={newClassName} onChange={(e) => setNewClassName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addClass()}
                    placeholder={t("dashboard.classNameExample")}
                    className="w-full px-3 py-2 text-sm outline-none"
                    style={{ borderRadius: "var(--radius-sm)", background: "var(--bg-primary)", border: "1px solid var(--border)", color: "var(--text-primary)" }} />
                </div>
              </div>
            </div>
            <div className="mb-3">
              <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>
                {t("dashboard.telegramGroupIdLabel")}
              </p>
              <div className="flex items-center gap-2 px-3 py-2"
                style={{ borderRadius: "var(--radius-sm)", background: "var(--bg-primary)", border: "1px solid var(--border)" }}>
                <Send size={13} style={{ color: newClassTgGroup ? "#229ED9" : "var(--border)", flexShrink: 0 }} />
                <input value={newClassTgGroup} onChange={(e) => setNewClassTgGroup(e.target.value)}
                  placeholder="-100xxxxxxxxxx yoki @groupname"
                  className="flex-1 bg-transparent outline-none text-sm"
                  style={{ color: "var(--text-primary)" }} />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => { setShowNewClass(false); setNewClassIcon(""); setNewClassName(""); setNewClassTgGroup(""); }}
                className="flex-1 py-2.5 text-sm"
                style={{ borderRadius: "var(--radius-sm)", background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
                {t("common.cancel")}
              </button>
              <button onClick={addClass} className="flex-1 py-2.5 text-sm font-medium"
                style={{ borderRadius: "var(--radius-sm)", background: "var(--cta)", color: "#fff" }}>
                {t("dashboard.create")}
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
          <div className="w-full max-w-sm p-5 animate-fade-in"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>{t("dashboard.newStudentTitle")}</h2>
              <button onClick={() => { setShowNewStudent(false); setNewStudentName(""); setNewStudentTgId(""); setNewStudentClassIds([]); }}
                className="w-8 h-8 flex items-center justify-center"
                style={{ borderRadius: "var(--radius-sm)", background: "var(--bg-primary)", border: "1px solid var(--border)", color: "var(--text-muted)" }}>
                <X size={15} />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <p className="text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>{t("dashboard.fullName")}</p>
                <input autoFocus value={newStudentName} onChange={(e) => setNewStudentName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && createStudent()}
                  placeholder="Ali Valiyev"
                  className="w-full px-3 py-2.5 text-sm outline-none"
                  style={{ borderRadius: "var(--radius-sm)", background: "var(--bg-primary)", border: "1px solid var(--border)", color: "var(--text-primary)" }} />
              </div>
              <div>
                <p className="text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>{t("dashboard.telegramIdOptional")}</p>
                <input value={newStudentTgId} onChange={(e) => setNewStudentTgId(e.target.value)}
                  placeholder="@username yoki raqam"
                  className="w-full px-3 py-2.5 text-sm outline-none"
                  style={{ borderRadius: "var(--radius-sm)", background: "var(--bg-primary)", border: "1px solid var(--border)", color: "var(--text-primary)" }} />
              </div>

              {/* Guruh tanlash */}
              {classList.length > 0 && (
                <div>
                  <p className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>{t("dashboard.assignGroup")}</p>
                  <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto">
                    {classList.map((cls) => {
                      const badge = clsBadge(cls);
                      const selected = newStudentClassIds.includes(cls.id);
                      return (
                        <button key={cls.id} onClick={() => toggleNewStudentClass(cls.id)}
                          className="flex items-center gap-3 px-3 py-2 transition-all text-left"
                          style={{
                            borderRadius: "var(--radius-sm)",
                            background: selected ? "var(--accent-light)" : "var(--bg-primary)",
                            border: `1px solid ${selected ? "var(--accent)" : "var(--border)"}`,
                          }}>
                          <div className="flex items-center justify-center font-bold shrink-0 text-xs"
                            style={{ borderRadius: "var(--radius-sm)", background: selected ? "var(--accent)" : "var(--border)", color: selected ? "#fff" : "var(--text-muted)", width: 28, height: 28, fontSize: badge.fontSize * 0.8 }}>
                            {badge.text}
                          </div>
                          <span className="flex-1 text-sm font-medium" style={{ color: selected ? "var(--accent)" : "var(--text-primary)" }}>
                            {cls.name} {t("home.classSuffix")}
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
                className="flex-1 py-2.5 text-sm"
                style={{ borderRadius: "var(--radius-sm)", background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
                {t("common.cancel")}
              </button>
              <button onClick={createStudent} className="flex-1 py-2.5 text-sm font-medium"
                style={{ borderRadius: "var(--radius-sm)", background: "var(--cta)", color: "#fff" }}>
                {t("dashboard.addBtn")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Sinf Telegram send modal ── */}
      {sendClassId && (() => {
        const cls = classList.find((c) => c.id === sendClassId);
        if (!cls) return null;
        return (
          <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4"
            style={{ background: "#00000060" }}
            onClick={(e) => e.target === e.currentTarget && setSendClassId(null)}>
            <div className="w-full max-w-sm p-5 animate-slide-in sm:animate-fade-in"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-md) var(--radius-md) 0 0" }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex flex-col gap-0.5">
                  <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>
                    {t("dashboard.sendToGroup")}
                  </h2>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {t("dashboard.groupInfo").replace("{name}", cls.name).replace("{groupId}", cls.telegramGroupId ?? "").replace("{count}", String(cls.studentCount))}
                  </p>
                </div>
                <button onClick={() => setSendClassId(null)}
                  className="w-8 h-8 flex items-center justify-center shrink-0"
                  style={{ borderRadius: "var(--radius-sm)", background: "var(--bg-primary)", border: "1px solid var(--border)", color: "var(--text-muted)" }}>
                  <X size={15} />
                </button>
              </div>

              <p className="text-xs mb-2.5 font-medium" style={{ color: "var(--text-muted)" }}>{t("class.selectSubject")}</p>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {SUBJECTS.map((sub) => {
                  const active = selectedSubject === sub.name;
                  return (
                    <button key={sub.name} onClick={() => setSelectedSubject(active ? "" : sub.name)}
                      className="flex items-center gap-2.5 px-3 py-2.5 transition-all text-left"
                      style={{
                        borderRadius: "var(--radius-sm)",
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
                <button onClick={() => setSendClassId(null)} className="flex-1 py-2.5 text-sm"
                  style={{ borderRadius: "var(--radius-sm)", background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
                  {t("common.cancel")}
                </button>
                <button
                  disabled={!selectedSubject}
                  className="flex-1 py-2.5 text-sm font-medium flex items-center justify-center gap-2 transition-all"
                  style={{
                    borderRadius: "var(--radius-sm)",
                    background: selectedSubject ? "var(--accent)" : "var(--bg-primary)",
                    border: selectedSubject ? "none" : "1px solid var(--border)",
                    color: selectedSubject ? "#fff" : "var(--text-muted)",
                    cursor: selectedSubject ? "pointer" : "not-allowed",
                    opacity: selectedSubject ? 1 : 0.6,
                  }}>
                  <Send size={14} />
                  {t("common.send")}
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
            <div className="w-full max-w-sm p-5 animate-slide-in sm:animate-fade-in"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-md) var(--radius-md) 0 0" }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex flex-col gap-0.5">
                  <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>
                    {t("dashboard.sendResult")}
                  </h2>
                  <p className="text-xs flex items-center gap-1" style={{ color: "#229ED9" }}>
                    <Send size={11} style={{ color: "#229ED9" }} />
                    {s.telegramId}
                  </p>
                </div>
                <button onClick={() => setSendStudentId(null)}
                  className="w-8 h-8 flex items-center justify-center shrink-0"
                  style={{ borderRadius: "var(--radius-sm)", background: "var(--bg-primary)", border: "1px solid var(--border)", color: "var(--text-muted)" }}>
                  <X size={15} />
                </button>
              </div>

              <p className="text-xs mb-2.5 font-medium" style={{ color: "var(--text-muted)" }}>{t("class.selectSubject")}</p>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {SUBJECTS.map((sub) => {
                  const active = selectedSubject === sub.name;
                  return (
                    <button key={sub.name} onClick={() => setSelectedSubject(active ? "" : sub.name)}
                      className="flex items-center gap-2.5 px-3 py-2.5 transition-all text-left"
                      style={{
                        borderRadius: "var(--radius-sm)",
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
                <button onClick={() => setSendStudentId(null)} className="flex-1 py-2.5 text-sm"
                  style={{ borderRadius: "var(--radius-sm)", background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
                  {t("common.cancel")}
                </button>
                <button
                  disabled={!selectedSubject}
                  className="flex-1 py-2.5 text-sm font-medium flex items-center justify-center gap-2 transition-all"
                  style={{
                    borderRadius: "var(--radius-sm)",
                    background: selectedSubject ? "#229ED9" : "var(--bg-primary)",
                    border: selectedSubject ? "none" : "1px solid var(--border)",
                    color: selectedSubject ? "#fff" : "var(--text-muted)",
                    cursor: selectedSubject ? "pointer" : "not-allowed",
                    opacity: selectedSubject ? 1 : 0.6,
                  }}>
                  <Send size={14} />
                  {t("common.send")}
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
          <div className="w-full max-w-xs p-5 animate-fade-in"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)" }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-base font-semibold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>{t("dashboard.deleteClassTitle")}</p>
              <button onClick={() => setDeleteClassId(null)}
                className="w-8 h-8 flex items-center justify-center hover:opacity-70"
                style={{ borderRadius: "var(--radius-sm)", background: "var(--bg-primary)", border: "1px solid var(--border)", color: "var(--text-muted)" }}>
                <X size={15} />
              </button>
            </div>
            <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}
              dangerouslySetInnerHTML={{ __html: t("dashboard.deleteClassMsg").replace("{name}", `<b>${classList.find((c) => c.id === deleteClassId)?.name ?? ""}</b>`) }} />
            <div className="flex gap-2">
              <button onClick={() => setDeleteClassId(null)} className="flex-1 py-2.5 text-sm"
                style={{ borderRadius: "var(--radius-sm)", background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
                {t("common.cancel")}
              </button>
              <button onClick={() => deleteClass(deleteClassId)} className="flex-1 py-2.5 text-sm font-medium"
                style={{ borderRadius: "var(--radius-sm)", background: "var(--error)", color: "#fff" }}>
                {t("common.delete")}
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
          <div className="w-full max-w-xs p-5 animate-fade-in"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)" }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-base font-semibold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>{t("dashboard.deleteStudentTitle")}</p>
              <button onClick={() => setDeleteStudentId(null)}
                className="w-8 h-8 flex items-center justify-center hover:opacity-70"
                style={{ borderRadius: "var(--radius-sm)", background: "var(--bg-primary)", border: "1px solid var(--border)", color: "var(--text-muted)" }}>
                <X size={15} />
              </button>
            </div>
            <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}
              dangerouslySetInnerHTML={{ __html: t("dashboard.deleteStudentMsg").replace("{name}", `<b>${allStudents.find((s) => s.id === deleteStudentId)?.name ?? ""}</b>`) }} />
            <div className="flex gap-2">
              <button onClick={() => setDeleteStudentId(null)} className="flex-1 py-2.5 text-sm"
                style={{ borderRadius: "var(--radius-sm)", background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
                {t("common.cancel")}
              </button>
              <button onClick={() => deleteStudent(deleteStudentId)} className="flex-1 py-2.5 text-sm font-medium"
                style={{ borderRadius: "var(--radius-sm)", background: "var(--error)", color: "#fff" }}>
                {t("common.delete")}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
