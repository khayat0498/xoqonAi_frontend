"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Camera, FileText, Search, Plus, X,
  MoreVertical, Pencil, Trash2, Check, UserPlus, Send, Timer, BookOpen, ChevronRight, Settings, BarChart2,
} from "lucide-react";
import { getToken } from "@/lib/auth";
import { useUserWS } from "@/lib/user-ws";

const API = process.env.NEXT_PUBLIC_API_URL;
function authHeaders() {
  return { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` };
}

type ClassStudent = { id: string; name: string; telegramId: string | null; createdAt: string };
type ClassInfo = { id: string; name: string; icon: string | null; studentCount: number; telegramGroupId: string | null };

const avatarColors = ["#1a5c6b","#6366F1","#e8732a","#2a9d6a","#3B82F6","#8B5CF6","#EC4899","#d4a017"];


export default function ClassPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [cls, setCls]               = useState<ClassInfo | null>(null);
  const [studentList, setStudentList] = useState<ClassStudent[]>([]);
  const [allStudents, setAllStudents] = useState<ClassStudent[]>([]);
  const [search, setSearch]           = useState("");
  const [activeStudent, setActiveStudent] = useState<ClassStudent | null>(null);

  // Add modal
  const [showAdd, setShowAdd]       = useState(false);
  const [addSearch, setAddSearch]   = useState("");
  const [newName, setNewName]       = useState("");
  const [newTgId, setNewTgId]       = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [savingStudent, setSavingStudent] = useState(false);

  // Edit / Delete
  const [editingId, setEditingId]   = useState<string | null>(null);
  const [editName, setEditName]     = useState("");
  const [deleteId, setDeleteId]     = useState<string | null>(null);

  const [sendStudent, setSendStudent] = useState<ClassStudent | null>(null);
  const [sendSubjects, setSendSubjects] = useState<SubjectItem[]>([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [pendingCounts, setPendingCounts] = useState<Record<string, number>>({});

  // Class settings modal
  const [showSettings, setShowSettings] = useState(false);
  const [settingsName, setSettingsName] = useState("");
  const [settingsTgGroup, setSettingsTgGroup] = useState("");
  const [settingsSaving, setSettingsSaving] = useState(false);

  // Class-level session (fan + masala sharti)
  type SubjectItem = { id: string; name: string; icon: string | null };
  const [sessionSubject, setSessionSubject] = useState<SubjectItem | null>(null);
  const [sessionCondition, setSessionCondition] = useState("");
  const [showSessionSetup, setShowSessionSetup] = useState(false);
  const [sessionStep, setSessionStep] = useState<"subject" | "condition">("subject");
  const [sessionSubjects, setSessionSubjects] = useState<SubjectItem[]>([]);
  const [pendingStudentForCamera, setPendingStudentForCamera] = useState<ClassStudent | null>(null);
  // Temp state while setting up session
  const [setupSubject, setSetupSubject] = useState<SubjectItem | null>(null);
  const [setupCondition, setSetupCondition] = useState("");
  // Kesh narxi (birinchi o'quvchi tekshirilganda ko'rinadi)
  const [cacheInfo, setCacheInfo] = useState<{ tokenCount: number; totalOverheadUzs: number; cacheStorageCostUzs: number } | null>(null);

  const { lastEvent } = useUserWS();

  useEffect(() => {
    async function load() {
      const [classRes, studentsRes, subsRes, subjectsRes] = await Promise.all([
        fetch(`${API}/api/classes/${id}`, { headers: authHeaders() }),
        fetch(`${API}/api/students`, { headers: authHeaders() }),
        fetch(`${API}/api/submissions?limit=200`, { headers: authHeaders() }),
        fetch(`${API}/api/subjects`, { headers: authHeaders() }),
      ]);
      if (classRes.ok) {
        const data = await classRes.json();
        setCls(data);
        setStudentList(data.students ?? []);
      }
      if (studentsRes.ok) {
        const data = await studentsRes.json();
        setAllStudents(data.students ?? []);
      }
      if (subsRes.ok) {
        const data = await subsRes.json();
        const counts: Record<string, number> = {};
        for (const sub of data.data ?? []) {
          if ((sub.status === "pending" || sub.status === "processing") && sub.studentId) {
            counts[sub.studentId] = (counts[sub.studentId] ?? 0) + 1;
          }
        }
        setPendingCounts(counts);
      }
      if (subjectsRes.ok) {
        const data = await subjectsRes.json();
        const withGeneral = [{ id: "__general__", name: "Umumiy", icon: "📚" }, ...data];
        setSessionSubjects(withGeneral);
        setSendSubjects(withGeneral);
      }
    }
    load().then(() => {
      // Sessiyani localStorage dan tiklash
      try {
        const saved = localStorage.getItem(`class_session_${id}`);
        if (saved) {
          const { subject, condition } = JSON.parse(saved);
          if (subject) setSessionSubject(subject);
          if (condition) setSessionCondition(condition);
        }
      } catch {}
    });
  }, [id]);

  useEffect(() => {
    if (!lastEvent) return;
    if (lastEvent.type === "submission_processing") {
      const { studentId } = lastEvent.data;
      if (studentId) {
        setPendingCounts((prev) => ({ ...prev, [studentId]: (prev[studentId] ?? 0) + 1 }));
      }
    } else if (lastEvent.type === "cache_created") {
      setCacheInfo({
        tokenCount: lastEvent.data.tokenCount,
        totalOverheadUzs: lastEvent.data.totalOverheadUzs,
        cacheStorageCostUzs: lastEvent.data.cacheStorageCostUzs,
      });
    } else if (lastEvent.type === "submission_done") {
      const { studentId } = lastEvent.data;
      if (studentId) {
        setPendingCounts((prev) => {
          const next = { ...prev };
          next[studentId] = Math.max(0, (next[studentId] ?? 0) - 1);
          if (next[studentId] === 0) delete next[studentId];
          return next;
        });
      }
    }
  }, [lastEvent]);

  /* ── Mavjud o'quvchini sinfga qo'shish ── */
  const addExisting = async (studentId: string) => {
    const res = await fetch(`${API}/api/classes/${id}/students`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ studentId }),
    });
    if (res.ok) {
      const added = allStudents.find((s) => s.id === studentId);
      if (added) setStudentList((prev) => [...prev, added]);
    }
  };

  /* ── Yangi o'quvchi yaratib sinfga qo'shish ── */
  const createAndAdd = async () => {
    const name = newName.trim();
    if (!name || savingStudent) return;
    setSavingStudent(true);
    const telegramId = newTgId.trim() || null;

    const createRes = await fetch(`${API}/api/students`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ name, telegramId }),
    });
    if (!createRes.ok) return;
    const newStudent: ClassStudent = await createRes.json();

    await fetch(`${API}/api/classes/${id}/students`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ studentId: newStudent.id }),
    });

    setStudentList((prev) => [...prev, newStudent]);
    setAllStudents((prev) => [...prev, newStudent]);
    setNewName("");
    setNewTgId("");
    setShowCreate(false);
    setSavingStudent(false);
  };

  /* ── Sinfdan chiqarish ── */
  const removeFromClass = async (studentId: string) => {
    const res = await fetch(`${API}/api/classes/${id}/students/${studentId}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    if (res.ok) {
      setStudentList((prev) => prev.filter((s) => s.id !== studentId));
    }
    setDeleteId(null);
    setActiveStudent(null);
  };

  /* ── Ismni tahrirlash ── */
  const saveEdit = async (sid: string) => {
    const name = editName.trim();
    if (!name) return;
    const res = await fetch(`${API}/api/students/${sid}`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ name }),
    });
    if (res.ok) {
      setStudentList((prev) => prev.map((s) => s.id === sid ? { ...s, name } : s));
      setAllStudents((prev) => prev.map((s) => s.id === sid ? { ...s, name } : s));
    }
    setEditingId(null);
  };

  const openSettings = () => {
    setSettingsName(cls?.name ?? "");
    setSettingsTgGroup(cls?.telegramGroupId ?? "");
    setShowSettings(true);
  };

  const saveSettings = async () => {
    if (!settingsName.trim()) return;
    setSettingsSaving(true);
    const res = await fetch(`${API}/api/classes/${id}`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ name: settingsName.trim(), telegramGroupId: settingsTgGroup.trim() || null }),
    });
    if (res.ok) {
      const updated = await res.json();
      setCls((prev) => prev ? { ...prev, name: updated.name, telegramGroupId: updated.telegramGroupId } : prev);
      setShowSettings(false);
    }
    setSettingsSaving(false);
  };

  const filtered = studentList.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  const openCameraForStudent = (student: ClassStudent) => {
    setActiveStudent(null);
    if (!sessionSubject) {
      // Need to set session first
      setPendingStudentForCamera(student);
      setSetupSubject(null);
      setSetupCondition("");
      setSessionStep("subject");
      setShowSessionSetup(true);
      return;
    }
    goDirectToCamera(student, sessionSubject, sessionCondition);
  };

  const goDirectToCamera = (student: ClassStudent, subject: SubjectItem | null, condition: string) => {
    // Sessiyani saqlash (camera qaytganda tiklash uchun)
    try {
      localStorage.setItem(`class_session_${id}`, JSON.stringify({ subject, condition }));
    } catch {}
    const params = new URLSearchParams({
      studentId: student.id,
      studentName: student.name,
      camera: "1",
    });
    if (cls?.id) params.set("classId", cls.id);
    if (subject) params.set("subject", subject.name);
    if (condition.trim()) params.set("condition", condition.trim());
    params.set("returnTo", `/class/${id}`);
    window.location.href = `/home?${params.toString()}`;
  };

  const openSessionSetup = () => {
    setSetupSubject(sessionSubject);
    setSetupCondition(sessionCondition);
    setSessionStep(sessionSubject ? "condition" : "subject");
    setPendingStudentForCamera(null);
    setShowSessionSetup(true);
  };

  const finishSessionSetup = (overrideSubject?: SubjectItem | null, overrideCondition?: string) => {
    const subject = overrideSubject !== undefined ? overrideSubject : setupSubject;
    const condition = overrideCondition !== undefined ? overrideCondition : setupCondition;
    setSessionSubject(subject);
    setSessionCondition(condition);
    setShowSessionSetup(false);
    setCacheInfo(null); // yangi session — eski kesh ma'lumotini tozala
    if (pendingStudentForCamera) {
      const student = pendingStudentForCamera;
      setPendingStudentForCamera(null);
      goDirectToCamera(student, subject, condition);
    }
  };

  const classStudentIds = studentList.map((s) => s.id);
  const notInClass = allStudents.filter(
    (s) => !classStudentIds.includes(s.id) &&
      s.name.toLowerCase().includes(addSearch.toLowerCase())
  );

  return (
    <div className="flex flex-col h-screen" style={{ background: "var(--bg-primary)" }}>

      {/* Header */}
      <div className="px-5 pt-4 pb-8 flex items-center gap-3 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, var(--accent-dark) 0%, var(--accent) 60%, var(--accent-hover) 100%)", boxShadow: "6px 6px 14px rgba(53,120,136,0.25), inset -2px -2px 6px rgba(0,0,0,0.08), inset 2px 2px 6px rgba(255,255,255,0.12)", zIndex: 10 }}>
        <div style={{ position:"absolute", right:-20, top:-30, width:120, height:120, borderRadius:"50%", background:"rgba(255,255,255,0.07)" }} />
        <div style={{ position:"absolute", right:50, bottom:-20, width:70, height:70, borderRadius:"50%", background:"rgba(255,255,255,0.05)" }} />
        <button onClick={() => router.push("/home")} className="w-8 h-8 rounded-xl flex items-center justify-center relative"
          style={{ background:"rgba(255,255,255,0.18)", color:"#fff" }}>
          <ArrowLeft size={16} />
        </button>
        <div className="flex-1 relative">
          <h1 className="text-base font-semibold text-white" style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>{cls?.name} sinfi</h1>
          <p className="text-xs flex items-center gap-1.5" style={{ color:"rgba(255,255,255,0.7)" }}>
            {studentList.length} o&apos;quvchi
            {cls?.telegramGroupId && (
              <span className="flex items-center gap-0.5" style={{ color: "#5af" }}>
                · <Send size={9} /> Guruh biriktirilgan
              </span>
            )}
          </p>
        </div>
        <button onClick={() => router.push(`/class/${id}/stats`)}
          className="w-9 h-9 flex items-center justify-center rounded-xl relative"
          style={{ background:"rgba(255,255,255,0.18)", color:"#fff" }}>
          <BarChart2 size={16} />
        </button>
        <button onClick={openSettings}
          className="w-9 h-9 flex items-center justify-center rounded-xl relative"
          style={{ background:"rgba(255,255,255,0.18)", color:"#fff" }}>
          <Settings size={16} />
        </button>
        <button onClick={() => { setShowAdd(true); setAddSearch(""); setShowCreate(false); setNewName(""); }}
          className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-xl font-medium relative"
          style={{ background:"rgba(255,255,255,0.18)", color:"#fff" }}>
          <Plus size={14} /> Qo&apos;shish
        </button>
      </div>

      {/* Content */}
      <div className="bg-grid flex-1 mt-2 overflow-hidden flex flex-col" style={{ borderRadius: "var(--radius-lg) var(--radius-lg) 0 0" }}>

        {/* Search */}
        <div className="px-5 pt-6 pb-2 shrink-0">
          <div className="flex items-center gap-2 px-3 py-2.5"
            style={{ background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius: "var(--radius-sm)" }}>
            <Search size={14} style={{ color:"var(--text-muted)" }} />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Qidirish..." className="flex-1 bg-transparent outline-none text-sm"
              style={{ color:"var(--text-primary)" }} />
          </div>
        </div>

        {/* Session bar */}
        <div className="px-5 pb-3 shrink-0">
          {sessionSubject ? (
            <div className="rounded-2xl overflow-hidden"
              style={{ background: "var(--accent-light)", border: "1px solid var(--accent)" }}>
              <div className="flex items-center gap-3 px-4 py-2.5">
                <span className="text-xl">{sessionSubject.icon || "📖"}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold" style={{ color: "var(--accent)" }}>{sessionSubject.name}</p>
                  {sessionCondition && (
                    <p className="text-xs truncate mt-0.5" style={{ color: "var(--text-secondary)" }}>{sessionCondition}</p>
                  )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button onClick={openSessionSetup}
                    className="text-xs px-3 py-1.5 rounded-xl font-medium"
                    style={{ background: "var(--accent)", color: "#fff" }}>
                    O&apos;zgartirish
                  </button>
                  <button onClick={() => { setSessionSubject(null); setSessionCondition(""); localStorage.removeItem(`class_session_${id}`); }}
                    className="text-xs px-3 py-1.5 rounded-xl font-medium"
                    style={{ background: "var(--bg-primary)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}>
                    Yangi
                  </button>
                </div>
              </div>
              {cacheInfo && (
                <div className="px-4 py-2 flex items-center gap-2 text-[11px]"
                  style={{ borderTop: "1px solid var(--accent)40", color: "var(--accent)" }}>
                  <span>⚡</span>
                  <span className="font-semibold">Kesh faol</span>
                  <span style={{ color: "var(--text-secondary)" }}>·</span>
                  <span style={{ color: "var(--text-secondary)" }}>{cacheInfo.tokenCount.toLocaleString()} token</span>
                  <span style={{ color: "var(--text-secondary)" }}>·</span>
                  <span style={{ color: "var(--text-secondary)" }}>
                    Yaratish+saqlash: <strong style={{ color: "var(--accent)" }}>{cacheInfo.totalOverheadUzs.toLocaleString()} so&apos;m</strong> / soat
                  </span>
                </div>
              )}
            </div>
          ) : (
            <button onClick={openSessionSetup}
              className="w-full flex items-center gap-3 px-4 py-3 text-left transition-all hover:opacity-80"
              style={{ border: "1px dashed var(--border)", borderRadius: "var(--radius-md)", color: "var(--text-muted)" }}>
              <Camera size={16} />
              <span className="text-sm flex-1">Fan va masala shartini tanlang</span>
              <ChevronRight size={14} />
            </button>
          )}
        </div>

        {/* Mobile: column headers */}
        <div className="md:hidden px-5 py-1.5 grid text-xs shrink-0"
          style={{ color:"var(--text-muted)", gridTemplateColumns:"1.5rem 1fr auto" }}>
          <span>#</span>
          <span>Ism Familiya</span>
          <span className="pr-1">Amallar</span>
        </div>

        {/* Students */}
        <div className="flex-1 overflow-y-auto px-5 pb-8">

          {/* Mobile list */}
          <div className="md:hidden flex flex-col gap-1.5">
            {filtered.map((student, i) => {
              const color    = avatarColors[i % avatarColors.length];
              const initials = student.name.split(" ").map((n) => n[0]).join("").slice(0, 2);
              const isEditing = editingId === student.id;
              return (
                <div key={student.id} className="grid items-center px-4 py-3 animate-slide-in"
                  style={{ background:"var(--bg-card)", backdropFilter:"blur(4px)", border:"1px solid var(--border)", borderRadius: "var(--radius-sm)",
                    gridTemplateColumns:"1.5rem 1fr auto", animationDelay:`${i * 25}ms`, boxShadow: "var(--shadow-sm)" }}>
                  <span className="text-sm" style={{ color:"var(--text-muted)" }}>{i + 1}</span>
                  {isEditing ? (
                    <input autoFocus value={editName} onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") void saveEdit(student.id); }}
                      className="px-3 py-1.5 text-sm outline-none"
                      style={{ background:"var(--bg-primary)", border:"1px solid var(--accent)", color:"var(--text-primary)", borderRadius: "var(--radius-sm)" }} />
                  ) : (
                    <Link href={`/student/${student.id}?from=/class/${id}`} className="flex items-center gap-2.5 hover:opacity-70 transition-all">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                        style={{ background: color }}>{initials}</div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-medium" style={{ color:"var(--text-primary)" }}>{student.name}</p>
                          {pendingCounts[student.id] ? (
                            <span className="flex items-center gap-0.5 px-1.5 py-0.5 text-xs font-bold rounded-full"
                              style={{ background: "var(--accent-light)", color: "var(--accent)" }}>
                              <Timer size={10} className="animate-pulse" />
                              {pendingCounts[student.id]}
                            </span>
                          ) : null}
                        </div>
                        <p className="text-xs mt-0.5 flex items-center gap-1.5" style={{ color:"var(--text-muted)" }}>
                          {student.telegramId ? (
                            <Send size={10} style={{ color: "#229ED9", flexShrink: 0 }} />
                          ) : (
                            <span className="relative inline-flex items-center justify-center shrink-0" style={{ width: 13, height: 13 }}>
                              <Send size={10} style={{ color: "var(--text-muted)" }} />
                              <span style={{ position: "absolute", top: "50%", left: "-1px", right: "-1px", height: "1.5px", background: "var(--text-muted)", transform: "rotate(-35deg)", opacity: 0.4 }} />
                            </span>
                          )}
                        </p>
                      </div>
                    </Link>
                  )}
                  <div className="flex items-center gap-1.5">
                    {isEditing ? (
                      <>
                        <button onClick={() => void saveEdit(student.id)} className="w-8 h-8 flex items-center justify-center" style={{ borderRadius: "var(--radius-sm)", background:"var(--success-bg)", color:"var(--success)" }}><Check size={14} /></button>
                        <button onClick={() => setEditingId(null)} className="w-8 h-8 flex items-center justify-center" style={{ borderRadius: "var(--radius-sm)", background:"var(--bg-primary)", border:"1px solid var(--border)", color:"var(--text-muted)" }}><X size={14} /></button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => openCameraForStudent(student)}
                          className="w-8 h-8 flex items-center justify-center"
                          style={{ borderRadius: "var(--radius-sm)", background:"var(--cta)", color:"#fff" }}>
                          <Camera size={14} />
                        </button>
                        <button onClick={() => setActiveStudent(student)} className="w-8 h-8 flex items-center justify-center"
                          style={{ borderRadius: "var(--radius-sm)", background:"var(--bg-primary)", border:"1px solid var(--border)", color:"var(--text-muted)" }}>
                          <MoreVertical size={15} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop card grid */}
          <div className="hidden md:grid md:grid-cols-3 lg:grid-cols-4 gap-4 pt-2">
            {filtered.map((student, i) => {
              const color    = avatarColors[i % avatarColors.length];
              const initials = student.name.split(" ").map((n) => n[0]).join("").slice(0, 2);
              const isEditing = editingId === student.id;
              return (
                <div key={student.id} className="animate-slide-in flex flex-col"
                  style={{ background:"var(--bg-card)", backdropFilter:"blur(4px)", border:"1px solid var(--border)", borderRadius: "var(--radius-md)", animationDelay:`${i * 25}ms`, boxShadow: "var(--shadow-clay-sm)" }}>
                  {isEditing ? (
                    <div className="flex-1 flex flex-col items-center justify-center gap-3 p-5">
                      <input autoFocus value={editName} onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") void saveEdit(student.id); }}
                        className="w-full px-3 py-2 text-sm outline-none text-center"
                        style={{ background:"var(--bg-primary)", border:"1px solid var(--accent)", color:"var(--text-primary)", borderRadius: "var(--radius-sm)" }} />
                      <div className="flex gap-2 w-full">
                        <button onClick={() => void saveEdit(student.id)} className="flex-1 py-2 flex items-center justify-center" style={{ borderRadius: "var(--radius-sm)", background:"var(--success-bg)", color:"var(--success)" }}><Check size={14} /></button>
                        <button onClick={() => setEditingId(null)} className="flex-1 py-2 flex items-center justify-center" style={{ borderRadius: "var(--radius-sm)", background:"var(--bg-primary)", border:"1px solid var(--border)", color:"var(--text-muted)" }}><X size={14} /></button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Link href={`/student/${student.id}?from=/class/${id}`} className="flex flex-col items-center text-center gap-2.5 p-5 pb-3 hover:opacity-80 transition-all">
                        <div className="relative">
                          <div className="w-14 h-14 rounded-full flex items-center justify-center text-white text-lg font-bold" style={{ background: color }}>{initials}</div>
                          {pendingCounts[student.id] ? (
                            <span className="absolute -top-1 -right-1 flex items-center gap-0.5 px-1.5 py-0.5 text-xs font-bold rounded-full"
                              style={{ background: "var(--accent)", color: "#fff", minWidth: 20, justifyContent: "center" }}>
                              <Timer size={9} className="animate-pulse" />
                              {pendingCounts[student.id]}
                            </span>
                          ) : null}
                        </div>
                        <div>
                          <p className="text-sm font-semibold" style={{ color:"var(--text-primary)" }}>{student.name}</p>
                          <p className="text-xs mt-0.5 flex items-center justify-center gap-1.5" style={{ color:"var(--text-muted)" }}>
                            {student.telegramId ? (
                              <Send size={10} style={{ color: "#229ED9", flexShrink: 0 }} />
                            ) : (
                              <span className="relative inline-flex items-center justify-center shrink-0" style={{ width: 13, height: 13 }}>
                                <Send size={10} style={{ color: "var(--text-muted)" }} />
                                <span style={{ position: "absolute", top: "50%", left: "-1px", right: "-1px", height: "1.5px", background: "var(--text-muted)", transform: "rotate(-35deg)", opacity: 0.4 }} />
                              </span>
                            )}
                          </p>
                        </div>
                      </Link>
                      <div className="flex items-center gap-1.5 px-3 pb-3 mt-auto">
                        <button
                          onClick={() => { if (student.telegramId) { setSendStudent(student); setSelectedSubject(""); } }}
                          className="w-8 h-8 flex items-center justify-center relative"
                          title="Natijani yuborish"
                          style={{
                            borderRadius: "var(--radius-sm)",
                            background: student.telegramId ? "#E8F5FB" : "var(--bg-primary)",
                            border: "1px solid var(--border)",
                            cursor: student.telegramId ? "pointer" : "not-allowed",
                            opacity: student.telegramId ? 1 : 0.45,
                          }}>
                          <Send size={13} style={{ color: student.telegramId ? "#229ED9" : "var(--text-muted)" }} />
                          {!student.telegramId && (
                            <span style={{ position: "absolute", top: "50%", left: "2px", right: "2px", height: "1.5px", background: "var(--text-muted)", transform: "rotate(-35deg)", opacity: 0.5 }} />
                          )}
                        </button>
                        <button
                          onClick={() => openCameraForStudent(student)}
                          className="flex-1 h-8 flex items-center justify-center hover:opacity-80" style={{ borderRadius: "var(--radius-sm)", background:"var(--cta)", color:"#fff" }} title="Tekshirish">
                          <Camera size={14} />
                        </button>
                        <Link href="/submission/1" className="w-8 h-8 flex items-center justify-center hover:opacity-70"
                          style={{ borderRadius: "var(--radius-sm)", background:"var(--bg-primary)", border:"1px solid var(--border)", color:"var(--text-secondary)" }}>
                          <FileText size={14} />
                        </Link>
                        <button onClick={() => { setEditingId(student.id); setEditName(student.name); }}
                          className="w-8 h-8 flex items-center justify-center hover:opacity-70"
                          style={{ borderRadius: "var(--radius-sm)", background:"var(--bg-primary)", border:"1px solid var(--border)", color:"var(--text-muted)" }}>
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => setDeleteId(student.id)}
                          className="w-8 h-8 flex items-center justify-center hover:opacity-70"
                          style={{ borderRadius: "var(--radius-sm)", background:"var(--error-bg)", color:"var(--error)" }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      </div>

      {/* Mobile bottom sheet */}
      {activeStudent && (
        <>
          <div className="fixed inset-0 z-40 md:hidden" style={{ background:"#00000040" }} onClick={() => setActiveStudent(null)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 pb-8 md:hidden animate-fade-in"
            style={{ background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius: "var(--radius-lg) var(--radius-lg) 0 0" }}>
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-8 h-1 rounded-full" style={{ background:"var(--border)" }} />
            </div>
            <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor:"var(--border)" }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                  style={{ background: avatarColors[studentList.findIndex(s => s.id === activeStudent.id) % avatarColors.length] }}>
                  {activeStudent.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color:"var(--text-primary)" }}>{activeStudent.name}</p>
                  {activeStudent.telegramId && (
                    <p className="text-xs flex items-center gap-1" style={{ color:"var(--text-muted)" }}>
                      <Send size={9} style={{ color: "#229ED9" }} /> {activeStudent.telegramId}
                    </p>
                  )}
                </div>
              </div>
              <button onClick={() => setActiveStudent(null)} className="w-8 h-8 flex items-center justify-center"
                style={{ borderRadius: "var(--radius-sm)", background:"var(--bg-primary)", border:"1px solid var(--border)", color:"var(--text-muted)" }}>
                <X size={15} />
              </button>
            </div>
            <div className="p-4 flex flex-col gap-2">
              <button
                onClick={() => openCameraForStudent(activeStudent)}
                className="flex items-center gap-3 px-4 py-3.5 font-medium text-sm" style={{ borderRadius: "var(--radius-sm)", background:"var(--cta)", color:"#fff" }}>
                <Camera size={18} /> Uy ishini tekshirish
              </button>
              <button
                onClick={() => { if (activeStudent.telegramId) { setActiveStudent(null); setSendStudent(activeStudent); setSelectedSubject(""); } }}
                className="flex items-center gap-3 px-4 py-3.5 text-sm"
                style={{
                  borderRadius: "var(--radius-sm)",
                  background: "var(--bg-primary)",
                  border: "1px solid var(--border)",
                  color: activeStudent.telegramId ? "var(--text-primary)" : "var(--text-muted)",
                  opacity: activeStudent.telegramId ? 1 : 0.5,
                  cursor: activeStudent.telegramId ? "pointer" : "not-allowed",
                }}>
                <Send size={18} style={{ color: activeStudent.telegramId ? "#229ED9" : "var(--text-muted)" }} />
                Natijani yuborish
              </button>
              <Link href="/submission/1" onClick={() => setActiveStudent(null)}
                className="flex items-center gap-3 px-4 py-3.5 text-sm"
                style={{ borderRadius: "var(--radius-sm)", background:"var(--bg-primary)", border:"1px solid var(--border)", color:"var(--text-primary)" }}>
                <FileText size={18} style={{ color:"var(--text-secondary)" }} /> Tekshirishlar tarixi
              </Link>
              <Link href={`/student/${activeStudent.id}`} onClick={() => setActiveStudent(null)}
                className="flex items-center gap-3 px-4 py-3.5 text-sm"
                style={{ borderRadius: "var(--radius-lg)", background:"var(--bg-primary)", border:"1px solid var(--border)", color:"var(--text-primary)" }}>
                Profilni ko&apos;rish
              </Link>
              <button onClick={() => { setActiveStudent(null); setEditingId(activeStudent.id); setEditName(activeStudent.name); }}
                className="flex items-center gap-3 px-4 py-3.5 text-sm"
                style={{ borderRadius: "var(--radius-sm)", background:"var(--bg-primary)", border:"1px solid var(--border)", color:"var(--text-primary)" }}>
                <Pencil size={18} style={{ color:"var(--text-secondary)" }} /> Ismni tahrirlash
              </button>
              <button onClick={() => { setActiveStudent(null); setDeleteId(activeStudent.id); }}
                className="flex items-center gap-3 px-4 py-3.5 text-sm font-medium"
                style={{ borderRadius: "var(--radius-sm)", background:"var(--error-bg)", color:"var(--error)" }}>
                <Trash2 size={18} /> Sinfdan chiqarish
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Add student modal ── */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background:"rgba(0,0,0,0.25)", backdropFilter:"blur(6px)" }}
          onClick={(e) => e.target === e.currentTarget && setShowAdd(false)}>
          <div className="w-full max-w-sm overflow-hidden animate-fade-in"
            style={{ background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius: "var(--radius-md)" }}>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor:"var(--border)" }}>
              <p className="text-base font-semibold" style={{ color:"var(--text-primary)", fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>O&apos;quvchi qo&apos;shish</p>
              <button onClick={() => setShowAdd(false)} className="w-8 h-8 flex items-center justify-center"
                style={{ borderRadius: "var(--radius-sm)", background:"var(--bg-primary)", border:"1px solid var(--border)", color:"var(--text-muted)" }}>
                <X size={15} />
              </button>
            </div>

            {/* Search */}
            <div className="px-4 pt-3 pb-2">
              <div className="flex items-center gap-2 px-3 py-2"
                style={{ background:"var(--bg-primary)", border:"1px solid var(--border)", borderRadius: "var(--radius-sm)" }}>
                <Search size={13} style={{ color:"var(--text-muted)" }} />
                <input autoFocus value={addSearch} onChange={(e) => setAddSearch(e.target.value)}
                  placeholder="O'quvchi qidirish..." className="flex-1 bg-transparent outline-none text-sm"
                  style={{ color:"var(--text-primary)" }} />
              </div>
            </div>

            {/* List */}
            <div className="overflow-y-auto max-h-64 px-3 flex flex-col gap-1 pb-2">

              {/* Already in class */}
              {allStudents
                .filter((s) => classStudentIds.includes(s.id) && s.name.toLowerCase().includes(addSearch.toLowerCase()))
                .map((s, si) => {
                  const color    = avatarColors[si % avatarColors.length];
                  const initials = s.name.split(" ").map((n) => n[0]).join("").slice(0, 2);
                  return (
                    <div key={s.id} className="flex items-center gap-3 px-3 py-2.5 opacity-50"
                      style={{ background:"var(--bg-primary)", borderRadius: "var(--radius-sm)" }}>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ background: color }}>{initials}</div>
                      <span className="flex-1 text-sm" style={{ color:"var(--text-primary)" }}>{s.name}</span>
                      <Check size={14} style={{ color:"var(--accent)" }} />
                    </div>
                  );
                })}

              {/* Not in class — clickable */}
              {notInClass.map((s, si) => {
                const color    = avatarColors[si % avatarColors.length];
                const initials = s.name.split(" ").map((n) => n[0]).join("").slice(0, 2);
                return (
                  <button key={s.id} onClick={() => void addExisting(s.id)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 transition-all hover:opacity-80 text-left"
                    style={{ background:"var(--bg-primary)", borderRadius: "var(--radius-sm)" }}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ background: color }}>{initials}</div>
                    <span className="flex-1 text-sm" style={{ color:"var(--text-primary)" }}>{s.name}</span>
                    <Plus size={14} style={{ color:"var(--accent)" }} />
                  </button>
                );
              })}

              {notInClass.length === 0 && !addSearch && classStudentIds.length === allStudents.length && (
                <p className="text-xs text-center py-3" style={{ color:"var(--text-muted)" }}>Barcha o&apos;quvchilar bu sinfda</p>
              )}
            </div>

            {/* Yangi o'quvchi yaratish */}
            <div className="px-4 pt-2 pb-4 border-t" style={{ borderColor:"var(--border)" }}>
              {showCreate ? (
                <div className="flex flex-col gap-2">
                  <input autoFocus value={newName} onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") void createAndAdd(); }}
                    placeholder="Ism Familiya"
                    className="w-full px-3 py-2 text-sm outline-none"
                    style={{ background:"var(--bg-primary)", border:"1px solid var(--border)", color:"var(--text-primary)", borderRadius: "var(--radius-sm)" }} />
                  <input value={newTgId} onChange={(e) => setNewTgId(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") void createAndAdd(); }}
                    placeholder="Telegram ID (ixtiyoriy)"
                    className="w-full px-3 py-2 text-sm outline-none"
                    style={{ background:"var(--bg-primary)", border:"1px solid var(--border)", color:"var(--text-primary)", borderRadius: "var(--radius-sm)" }} />
                  <div className="flex gap-2">
                    <button onClick={() => void createAndAdd()} disabled={savingStudent || !newName.trim()} className="flex-1 py-2 text-sm font-medium" style={{ borderRadius: "var(--radius-sm)", background:"var(--cta)", color:"#fff", opacity: savingStudent ? 0.6 : 1 }}>{savingStudent ? "..." : "Qo'shish"}</button>
                    <button onClick={() => { setShowCreate(false); setNewName(""); setNewTgId(""); }} className="w-9 h-9 flex items-center justify-center" style={{ borderRadius: "var(--radius-sm)", background:"var(--bg-primary)", border:"1px solid var(--border)", color:"var(--text-muted)" }}><X size={14} /></button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setShowCreate(true)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 text-sm transition-all hover:opacity-80"
                  style={{ border:"1px dashed var(--border)", color:"var(--text-muted)", borderRadius: "var(--radius-sm)" }}>
                  <UserPlus size={15} /> Yangi o&apos;quvchi yaratish
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete (remove from class) confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background:"rgba(0,0,0,0.25)", backdropFilter:"blur(6px)" }}
          onClick={(e) => e.target === e.currentTarget && setDeleteId(null)}>
          <div className="w-full max-w-xs p-5 animate-fade-in"
            style={{ background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius: "var(--radius-md)" }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-base font-semibold" style={{ color:"var(--text-primary)", fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>Sinfdan chiqarish</p>
              <button onClick={() => setDeleteId(null)} className="w-8 h-8 flex items-center justify-center"
                style={{ borderRadius: "var(--radius-sm)", background:"var(--bg-primary)", border:"1px solid var(--border)", color:"var(--text-muted)" }}>
                <X size={15} />
              </button>
            </div>
            <p className="text-sm mb-4" style={{ color:"var(--text-muted)" }}>
              <b>{studentList.find((s) => s.id === deleteId)?.name}</b> bu sinfdan chiqariladi.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 text-sm"
                style={{ borderRadius: "var(--radius-sm)", background:"var(--bg-card)", border:"1px solid var(--border)", color:"var(--text-secondary)" }}>
                Bekor
              </button>
              <button onClick={() => void removeFromClass(deleteId)} className="flex-1 py-2.5 text-sm font-medium"
                style={{ borderRadius: "var(--radius-sm)", background:"var(--error)", color:"#fff" }}>
                Chiqarish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Sessiya sozlash — FULL SCREEN ── */}
      {showSessionSetup && (
        <div className="fixed inset-0 z-50 flex flex-col animate-fade-in" style={{ background: "var(--bg-primary)" }}>

          {/* Header */}
          <div className="px-5 pb-4 flex items-center gap-3 shrink-0"
            style={{ background: "linear-gradient(135deg, var(--accent-dark) 0%, var(--accent) 100%)", paddingTop: "max(env(safe-area-inset-top), 16px)" }}>
            <button
              onClick={sessionStep === "condition" ? () => setSessionStep("subject") : () => { setShowSessionSetup(false); setPendingStudentForCamera(null); }}
              className="w-9 h-9 flex items-center justify-center rounded-xl"
              style={{ background: "rgba(255,255,255,0.18)", color: "#fff" }}>
              <ArrowLeft size={18} />
            </button>
            <div className="flex-1">
              <p className="text-base font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>
                {sessionStep === "subject" ? "Fan tanlang" : "Masala sharti"}
              </p>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.7)" }}>
                {sessionStep === "condition" && setupSubject
                  ? `${setupSubject.icon ?? "📖"} ${setupSubject.name} · `
                  : ""}
                {cls?.name} sinfi
              </p>
            </div>
            <button onClick={() => { setShowSessionSetup(false); setPendingStudentForCamera(null); }}
              className="w-9 h-9 flex items-center justify-center rounded-xl"
              style={{ background: "rgba(255,255,255,0.18)", color: "#fff" }}>
              <X size={18} />
            </button>
          </div>

          {sessionStep === "subject" ? (
            /* ── Fan tanlash ── */
            <div className="flex-1 overflow-y-auto">
              <div className="p-4 space-y-2">
                  {sessionSubjects.map((s) => (
                    <button key={s.id}
                      onClick={() => { setSetupSubject(s); setSetupCondition(""); setSessionStep("condition"); }}
                      className="w-full flex items-center gap-4 px-5 py-4 text-left transition-all hover:opacity-80 active:scale-[0.98]"
                      style={{ background: "var(--bg-card)", border: `1px solid ${setupSubject?.id === s.id ? "var(--accent)" : "var(--border)"}`, borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-clay-sm)" }}>
                      <span className="text-3xl">{s.icon || "📖"}</span>
                      <span className="flex-1 text-base font-semibold" style={{ color: "var(--text-primary)" }}>{s.name}</span>
                      <ChevronRight size={18} style={{ color: "var(--text-muted)" }} />
                    </button>
                  ))}
                  {sessionSubjects.length === 0 && (
                    <p className="text-center py-16 text-sm" style={{ color: "var(--text-muted)" }}>Fan topilmadi</p>
                  )}
                  {/* Fansiz tekshirish */}
                  <button
                    onClick={() => finishSessionSetup(null, "")}
                    className="w-full flex items-center gap-4 px-5 py-4 text-left transition-all hover:opacity-80"
                    style={{ background: "var(--bg-card)", border: "1px dashed var(--border)", borderRadius: "var(--radius-md)" }}>
                    <span className="text-3xl">📷</span>
                    <span className="flex-1 text-base font-medium" style={{ color: "var(--text-muted)" }}>Fansiz tekshirish</span>
                    <ChevronRight size={18} style={{ color: "var(--text-muted)" }} />
                  </button>
                </div>
            </div>
          ) : (
            /* ── Masala sharti ── */
            <div className="flex-1 flex flex-col p-5 gap-4">
              <div className="flex items-center gap-3 px-4 py-3 rounded-2xl"
                style={{ background: "var(--accent-light)" }}>
                <BookOpen size={18} style={{ color: "var(--accent)" }} />
                <span className="text-sm font-bold" style={{ color: "var(--accent)" }}>
                  {setupSubject?.icon} {setupSubject?.name}
                </span>
              </div>
              <div className="flex-1 flex flex-col">
                <label className="text-sm font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>
                  Masala sharti
                </label>
                <textarea
                  autoFocus
                  className="flex-1 w-full px-4 py-3 text-base outline-none resize-none"
                  style={{
                    background: "var(--bg-card)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-md)",
                    color: "var(--text-primary)",
                    minHeight: 180,
                  }}
                  placeholder="Masalan: Darslik 45-bet, 3-mashq. Barcha misollarni ishlang..."
                  value={setupCondition}
                  onChange={(e) => setSetupCondition(e.target.value)}
                />
                <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
                  Ixtiyoriy — bo&apos;sh qoldirishingiz ham mumkin
                </p>
              </div>
              <button
                onClick={() => finishSessionSetup()}
                className="w-full flex items-center justify-center gap-2 py-4 text-base font-bold rounded-2xl transition-all active:scale-[0.98]"
                style={{ background: "var(--cta)", color: "#fff", boxShadow: "0 4px 16px rgba(104,117,245,0.35)" }}>
                <Camera size={20} /> Saqlash va davom etish
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Sinf sozlamalari modal ── */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: "rgba(0,0,0,0.72)" }} onClick={() => setShowSettings(false)}>
          <div
            className="w-full max-w-lg p-5 pb-10 flex flex-col gap-4"
            style={{ background: "var(--bg-card)", borderRadius: "var(--radius-lg) var(--radius-lg) 0 0", boxShadow: "0 -8px 32px rgba(0,0,0,0.18)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 rounded-full mx-auto mb-1" style={{ background: "var(--border)" }} />
            <div className="flex items-center justify-between">
              <p className="text-base font-bold" style={{ color: "var(--text-primary)" }}>Sinf sozlamalari</p>
              <button onClick={() => setShowSettings(false)} className="w-7 h-7 flex items-center justify-center rounded-full" style={{ background: "var(--bg-primary)", color: "var(--text-muted)", fontSize: 16 }}>×</button>
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>Sinf nomi</label>
                <input
                  autoFocus
                  value={settingsName}
                  onChange={(e) => setSettingsName(e.target.value)}
                  placeholder="Masalan: 10-A"
                  className="w-full px-3 py-2.5 text-sm font-medium outline-none"
                  style={{ background: "var(--bg-primary)", border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)", color: "var(--text-primary)" }}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>Telegram guruh ID</label>
                <input
                  value={settingsTgGroup}
                  onChange={(e) => setSettingsTgGroup(e.target.value)}
                  placeholder="-100xxxxxxxxxx"
                  className="w-full px-3 py-2.5 text-sm font-medium outline-none"
                  style={{ background: "var(--bg-primary)", border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)", color: "var(--text-primary)", fontFamily: "monospace" }}
                />
                <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                  Guruh ID ni olish uchun @userinfobot ga guruhni forward qiling. Odatda -100 bilan boshlanadi.
                </p>
              </div>
            </div>
            <button
              onClick={saveSettings}
              disabled={settingsSaving || !settingsName.trim()}
              className="w-full py-3 text-sm font-bold rounded-xl transition-all"
              style={{ background: "var(--accent)", color: "#fff", opacity: settingsSaving || !settingsName.trim() ? 0.6 : 1 }}
            >
              {settingsSaving ? "Saqlanmoqda..." : "Saqlash"}
            </button>
          </div>
        </div>
      )}

      {/* ── Natijani yuborish modal ── */}
      {sendStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.25)", backdropFilter: "blur(6px)" }}
          onClick={(e) => e.target === e.currentTarget && setSendStudent(null)}>
          <div className="w-full max-w-sm overflow-hidden animate-fade-in"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)" }}>
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
              <div>
                <p className="text-base font-semibold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>Natijani yuborish</p>
                <p className="text-xs mt-0.5 flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
                  <Send size={10} style={{ color: "#229ED9" }} /> {sendStudent.telegramId} · {sendStudent.name}
                </p>
              </div>
              <button onClick={() => setSendStudent(null)} className="w-8 h-8 flex items-center justify-center"
                style={{ borderRadius: "var(--radius-sm)", background: "var(--bg-primary)", border: "1px solid var(--border)", color: "var(--text-muted)" }}>
                <X size={15} />
              </button>
            </div>
            <div className="p-3 flex flex-col gap-1.5 max-h-72 overflow-y-auto">
              <p className="text-xs px-1 mb-0.5" style={{ color: "var(--text-muted)" }}>Mavzuni tanlang:</p>
              {sendSubjects.map((sub) => {
                const active = selectedSubject === sub.name;
                return (
                  <button key={sub.name} onClick={() => setSelectedSubject(sub.name)}
                    className="flex items-center gap-3 px-4 py-3 text-left transition-all w-full"
                    style={{
                      borderRadius: "var(--radius-sm)",
                      background: active ? "var(--accent-light)" : "var(--bg-primary)",
                      border: `1px solid ${active ? "var(--accent)" : "var(--border)"}`,
                    }}>
                    <span className="text-base">{sub.icon}</span>
                    <span className="flex-1 text-sm font-medium" style={{ color: active ? "var(--accent)" : "var(--text-primary)" }}>
                      {sub.name}
                    </span>
                    {active && <span className="text-xs font-bold" style={{ color: "var(--accent)" }}>✓</span>}
                  </button>
                );
              })}
            </div>
            <div className="px-4 pb-4 pt-2 flex gap-2">
              <button onClick={() => setSendStudent(null)} className="flex-1 py-2.5 text-sm"
                style={{ borderRadius: "var(--radius-sm)", background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
                Bekor
              </button>
              <button
                onClick={() => { setSendStudent(null); setSelectedSubject(""); }}
                disabled={!selectedSubject}
                className="flex-1 py-2.5 text-sm font-medium flex items-center justify-center gap-2"
                style={{
                  borderRadius: "var(--radius-sm)",
                  background: selectedSubject ? "#229ED9" : "var(--border)",
                  color: "#fff",
                  cursor: selectedSubject ? "pointer" : "not-allowed",
                }}>
                <Send size={14} /> Yuborish
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
