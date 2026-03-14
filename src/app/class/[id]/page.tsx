"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft, Camera, FileText, Search, Plus, X,
  MoreVertical, Pencil, Trash2, Check, UserPlus, Send,
} from "lucide-react";
import {
  loadStudents, saveStudents, loadClasses, saveClasses,
  addStudentToClass, removeStudentFromClass,
} from "@/lib/store";
import type { Student, ClassItem } from "@/lib/store";

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

export default function ClassPage() {
  const { id } = useParams<{ id: string }>();

  const [cls, setCls]               = useState<ClassItem | null>(null);
  const [studentList, setStudentList] = useState<Student[]>([]);   // bu sinfdagi
  const [allStudents, setAllStudents] = useState<Student[]>([]);   // barcha o'quvchilar
  const [allClasses, setAllClasses]   = useState<ClassItem[]>([]);
  const [search, setSearch]           = useState("");
  const [activeStudent, setActiveStudent] = useState<Student | null>(null);

  // Add modal
  const [showAdd, setShowAdd]       = useState(false);
  const [addSearch, setAddSearch]   = useState("");
  const [newName, setNewName]       = useState("");
  const [newTgId, setNewTgId]       = useState("");
  const [showCreate, setShowCreate] = useState(false);

  // Edit / Delete
  const [editingId, setEditingId]   = useState<string | null>(null);
  const [editName, setEditName]     = useState("");
  const [deleteId, setDeleteId]     = useState<string | null>(null);

  const initialized = useRef(false);

  const [sendStudent, setSendStudent] = useState<Student | null>(null);
  const [selectedSubject, setSelectedSubject] = useState("");

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    const classes  = loadClasses();
    const students = loadStudents();
    const found    = classes.find((c) => c.id === id) ?? classes[0];
    setAllClasses(classes);
    setAllStudents(students);
    setCls(found);
    setStudentList(students.filter((s) => found?.studentIds?.includes(s.id)));
  }, [id]);

  /* ── Helpers ── */
  const refreshFromClasses = (updatedClasses: ClassItem[], updatedStudents?: Student[]) => {
    const students = updatedStudents ?? allStudents;
    const found    = updatedClasses.find((c) => c.id === id) ?? null;
    setAllClasses(updatedClasses);
    setCls(found);
    setStudentList(students.filter((s) => found?.studentIds?.includes(s.id)));
    if (updatedStudents) setAllStudents(updatedStudents);
  };

  /* ── Mavjud o'quvchini sinfga qo'shish ── */
  const addExisting = (studentId: string) => {
    const updated = addStudentToClass(allClasses, id, studentId);
    saveClasses(updated);
    refreshFromClasses(updated);
  };

  /* ── Yangi o'quvchi yaratib sinfga qo'shish ── */
  const createAndAdd = () => {
    const name = newName.trim();
    if (!name) return;
    const telegramId = newTgId.trim() || undefined;
    const newStudent: Student = { id: Date.now().toString(), name, submissionCount: 0, telegramId };
    const updatedStudents = [...allStudents, newStudent];
    saveStudents(updatedStudents);
    const updatedClasses = addStudentToClass(allClasses, id, newStudent.id);
    saveClasses(updatedClasses);
    refreshFromClasses(updatedClasses, updatedStudents);
    setNewName("");
    setNewTgId("");
    setShowCreate(false);
  };

  /* ── Sinfdan chiqarish ── */
  const removeFromClass = (studentId: string) => {
    const updated = removeStudentFromClass(allClasses, id, studentId);
    saveClasses(updated);
    refreshFromClasses(updated);
    setDeleteId(null);
    setActiveStudent(null);
  };

  /* ── Ismni tahrirlash ── */
  const saveEdit = (sid: string) => {
    const name = editName.trim();
    if (!name) return;
    const updated = allStudents.map((s) => (s.id === sid ? { ...s, name } : s));
    saveStudents(updated);
    refreshFromClasses(allClasses, updated);
    setEditingId(null);
  };

  const filtered = studentList.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  // Add modal: studentlar (bu sinfda yo'qlar)
  const classStudentIds = cls?.studentIds ?? [];
  const notInClass = allStudents.filter(
    (s) => !classStudentIds.includes(s.id) &&
      s.name.toLowerCase().includes(addSearch.toLowerCase())
  );

  return (
    <div className="flex flex-col h-screen" style={{ background: "var(--bg-primary)" }}>

      {/* Header */}
      <div className="px-5 pt-4 pb-8 flex items-center gap-3 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #111111 0%, #374151 100%)", boxShadow: "0 8px 32px rgba(0,0,0,0.32)", zIndex: 10 }}>
        <div style={{ position:"absolute", right:-20, top:-30, width:120, height:120, borderRadius:"50%", background:"rgba(255,255,255,0.07)" }} />
        <div style={{ position:"absolute", right:50, bottom:-20, width:70, height:70, borderRadius:"50%", background:"rgba(255,255,255,0.05)" }} />
        <Link href={`/class/${id}/profile`} className="w-8 h-8 rounded-xl flex items-center justify-center relative"
          style={{ background:"rgba(255,255,255,0.18)", color:"#fff" }}>
          <ArrowLeft size={16} />
        </Link>
        <div className="flex-1 relative">
          <h1 className="text-base font-semibold text-white">{cls?.name} sinfi</h1>
          <p className="text-xs" style={{ color:"rgba(255,255,255,0.7)" }}>{studentList.length} o'quvchi</p>
        </div>
        <button onClick={() => { setShowAdd(true); setAddSearch(""); setShowCreate(false); setNewName(""); }}
          className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-xl font-medium relative"
          style={{ background:"rgba(255,255,255,0.18)", color:"#fff" }}>
          <Plus size={14} /> Qo'shish
        </button>
      </div>

      {/* Content */}
      <div className="bg-grid flex-1 mt-2 rounded-t-2xl overflow-hidden flex flex-col">

        {/* Search */}
        <div className="px-5 pt-6 pb-2 shrink-0">
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
            style={{ background:"var(--bg-card)", border:"1px solid var(--border)" }}>
            <Search size={14} style={{ color:"var(--text-muted)" }} />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Qidirish..." className="flex-1 bg-transparent outline-none text-sm"
              style={{ color:"var(--text-primary)" }} />
          </div>
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
              const color    = avatarColors[(parseInt(student.id) - 1) % avatarColors.length];
              const initials = student.name.split(" ").map((n) => n[0]).join("").slice(0, 2);
              const isEditing = editingId === student.id;
              return (
                <div key={student.id} className="card-3d grid items-center px-4 py-3 rounded-xl animate-slide-in"
                  style={{ background:"var(--bg-card)", border:"1px solid var(--border)",
                    gridTemplateColumns:"1.5rem 1fr auto", animationDelay:`${i * 25}ms` }}>
                  <span className="text-sm" style={{ color:"var(--text-muted)" }}>{i + 1}</span>
                  {isEditing ? (
                    <input autoFocus value={editName} onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && saveEdit(student.id)}
                      className="px-3 py-1.5 rounded-lg text-sm outline-none"
                      style={{ background:"var(--bg-primary)", border:"1px solid var(--accent)", color:"var(--text-primary)" }} />
                  ) : (
                    <Link href={`/student/${student.id}`} className="flex items-center gap-2.5 hover:opacity-70 transition-all">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                        style={{ background: color }}>{initials}</div>
                      <div>
                        <p className="text-sm font-medium" style={{ color:"var(--text-primary)" }}>{student.name}</p>
                        <p className="text-xs mt-0.5 flex items-center gap-1.5" style={{ color:"var(--text-muted)" }}>
                          {student.submissionCount} ta tekshirish
                          {student.telegramId ? (
                            <Send size={10} style={{ color: "#229ED9", flexShrink: 0 }} />
                          ) : (
                            <span className="relative inline-flex items-center justify-center shrink-0" style={{ width: 13, height: 13 }}>
                              <Send size={10} style={{ color: "#374151" }} />
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
                        <button onClick={() => saveEdit(student.id)} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background:"#F0FDF4", color:"#10B981" }}><Check size={14} /></button>
                        <button onClick={() => setEditingId(null)} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background:"var(--bg-primary)", border:"1px solid var(--border)", color:"var(--text-muted)" }}><X size={14} /></button>
                      </>
                    ) : (
                      <button onClick={() => setActiveStudent(student)} className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ background:"var(--bg-primary)", border:"1px solid var(--border)", color:"var(--text-muted)" }}>
                        <MoreVertical size={15} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop card grid */}
          <div className="hidden md:grid md:grid-cols-3 lg:grid-cols-4 gap-4 pt-2">
            {filtered.map((student, i) => {
              const color    = avatarColors[(parseInt(student.id) - 1) % avatarColors.length];
              const initials = student.name.split(" ").map((n) => n[0]).join("").slice(0, 2);
              const isEditing = editingId === student.id;
              return (
                <div key={student.id} className="card-3d rounded-2xl animate-slide-in flex flex-col"
                  style={{ background:"var(--bg-card)", border:"1px solid var(--border)", animationDelay:`${i * 25}ms` }}>
                  {isEditing ? (
                    <div className="flex-1 flex flex-col items-center justify-center gap-3 p-5">
                      <input autoFocus value={editName} onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && saveEdit(student.id)}
                        className="w-full px-3 py-2 rounded-lg text-sm outline-none text-center"
                        style={{ background:"var(--bg-primary)", border:"1px solid var(--accent)", color:"var(--text-primary)" }} />
                      <div className="flex gap-2 w-full">
                        <button onClick={() => saveEdit(student.id)} className="flex-1 py-2 rounded-lg flex items-center justify-center" style={{ background:"#F0FDF4", color:"#10B981" }}><Check size={14} /></button>
                        <button onClick={() => setEditingId(null)} className="flex-1 py-2 rounded-lg flex items-center justify-center" style={{ background:"var(--bg-primary)", border:"1px solid var(--border)", color:"var(--text-muted)" }}><X size={14} /></button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Link href={`/student/${student.id}`} className="flex flex-col items-center text-center gap-2.5 p-5 pb-3 hover:opacity-80 transition-all">
                        <div className="w-14 h-14 rounded-full flex items-center justify-center text-white text-lg font-bold" style={{ background: color }}>{initials}</div>
                        <div>
                          <p className="text-sm font-semibold" style={{ color:"var(--text-primary)" }}>{student.name}</p>
                          <p className="text-xs mt-0.5 flex items-center justify-center gap-1.5" style={{ color:"var(--text-muted)" }}>
                            {student.submissionCount} ta tekshirish
                            {student.telegramId ? (
                              <Send size={10} style={{ color: "#229ED9", flexShrink: 0 }} />
                            ) : (
                              <span className="relative inline-flex items-center justify-center shrink-0" style={{ width: 13, height: 13 }}>
                                <Send size={10} style={{ color: "#374151" }} />
                                <span style={{ position: "absolute", top: "50%", left: "-1px", right: "-1px", height: "1.5px", background: "var(--text-muted)", transform: "rotate(-35deg)", opacity: 0.4 }} />
                              </span>
                            )}
                          </p>
                        </div>
                      </Link>
                      <div className="flex items-center gap-1.5 px-3 pb-3 mt-auto">
                        <button
                          onClick={() => { if (student.telegramId) { setSendStudent(student); setSelectedSubject(""); } }}
                          className="w-8 h-8 rounded-lg flex items-center justify-center relative"
                          title="Natijani yuborish"
                          style={{
                            background: student.telegramId ? "#E8F5FB" : "var(--bg-primary)",
                            border: "1px solid var(--border)",
                            cursor: student.telegramId ? "pointer" : "not-allowed",
                            opacity: student.telegramId ? 1 : 0.45,
                          }}>
                          <Send size={13} style={{ color: student.telegramId ? "#229ED9" : "#374151" }} />
                          {!student.telegramId && (
                            <span style={{ position: "absolute", top: "50%", left: "2px", right: "2px", height: "1.5px", background: "var(--text-muted)", transform: "rotate(-35deg)", opacity: 0.5 }} />
                          )}
                        </button>
                        <button className="flex-1 h-8 rounded-lg flex items-center justify-center hover:opacity-80" style={{ background:"var(--accent)", color:"#fff" }} title="Tekshirish">
                          <Camera size={14} />
                        </button>
                        <Link href="/submission/1" className="w-8 h-8 rounded-lg flex items-center justify-center hover:opacity-70"
                          style={{ background:"var(--bg-primary)", border:"1px solid var(--border)", color:"var(--text-secondary)" }}>
                          <FileText size={14} />
                        </Link>
                        <button onClick={() => { setEditingId(student.id); setEditName(student.name); }}
                          className="w-8 h-8 rounded-lg flex items-center justify-center hover:opacity-70"
                          style={{ background:"var(--bg-primary)", border:"1px solid var(--border)", color:"var(--text-muted)" }}>
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => setDeleteId(student.id)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center hover:opacity-70"
                          style={{ background:"#FFF1F2", color:"var(--error)" }}>
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
          <div className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl pb-8 md:hidden animate-fade-in"
            style={{ background:"var(--bg-card)", border:"1px solid var(--border)" }}>
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-8 h-1 rounded-full" style={{ background:"var(--border)" }} />
            </div>
            <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor:"var(--border)" }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                  style={{ background: avatarColors[(parseInt(activeStudent.id) - 1) % avatarColors.length] }}>
                  {activeStudent.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color:"var(--text-primary)" }}>{activeStudent.name}</p>
                  <p className="text-xs" style={{ color:"var(--text-muted)" }}>{activeStudent.submissionCount} ta tekshirish</p>
                </div>
              </div>
              <button onClick={() => setActiveStudent(null)} className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background:"var(--bg-primary)", border:"1px solid var(--border)", color:"var(--text-muted)" }}>
                <X size={15} />
              </button>
            </div>
            <div className="p-4 flex flex-col gap-2">
              <button className="flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium text-sm" style={{ background:"var(--accent)", color:"#fff" }}>
                <Camera size={18} /> Uy ishini tekshirish
              </button>
              <button
                onClick={() => { if (activeStudent.telegramId) { setActiveStudent(null); setSendStudent(activeStudent); setSelectedSubject(""); } }}
                className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm"
                style={{
                  background: "var(--bg-primary)",
                  border: "1px solid var(--border)",
                  color: activeStudent.telegramId ? "var(--text-primary)" : "var(--text-muted)",
                  opacity: activeStudent.telegramId ? 1 : 0.5,
                  cursor: activeStudent.telegramId ? "pointer" : "not-allowed",
                }}>
                <Send size={18} style={{ color: activeStudent.telegramId ? "#229ED9" : "#374151" }} />
                Natijani yuborish
              </button>
              <Link href="/submission/1" onClick={() => setActiveStudent(null)}
                className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm"
                style={{ background:"var(--bg-primary)", border:"1px solid var(--border)", color:"var(--text-primary)" }}>
                <FileText size={18} style={{ color:"var(--text-secondary)" }} /> Tekshirishlar tarixi
              </Link>
              <Link href={`/student/${activeStudent.id}`} onClick={() => setActiveStudent(null)}
                className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm"
                style={{ background:"var(--bg-primary)", border:"1px solid var(--border)", color:"var(--text-primary)" }}>
                Profilni ko'rish
              </Link>
              <button onClick={() => { setActiveStudent(null); setEditingId(activeStudent.id); setEditName(activeStudent.name); }}
                className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm"
                style={{ background:"var(--bg-primary)", border:"1px solid var(--border)", color:"var(--text-primary)" }}>
                <Pencil size={18} style={{ color:"var(--text-secondary)" }} /> Ismni tahrirlash
              </button>
              <button onClick={() => { setActiveStudent(null); setDeleteId(activeStudent.id); }}
                className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium"
                style={{ background:"#FFF1F2", color:"var(--error)" }}>
                <Trash2 size={18} /> Sinfdan chiqarish
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Add student modal ── */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background:"#00000060" }}
          onClick={(e) => e.target === e.currentTarget && setShowAdd(false)}>
          <div className="w-full max-w-sm rounded-2xl overflow-hidden animate-fade-in"
            style={{ background:"var(--bg-card)", border:"1px solid var(--border)" }}>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor:"var(--border)" }}>
              <p className="text-base font-semibold" style={{ color:"var(--text-primary)" }}>O'quvchi qo'shish</p>
              <button onClick={() => setShowAdd(false)} className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background:"var(--bg-primary)", border:"1px solid var(--border)", color:"var(--text-muted)" }}>
                <X size={15} />
              </button>
            </div>

            {/* Search */}
            <div className="px-4 pt-3 pb-2">
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
                style={{ background:"var(--bg-primary)", border:"1px solid var(--border)" }}>
                <Search size={13} style={{ color:"var(--text-muted)" }} />
                <input autoFocus value={addSearch} onChange={(e) => setAddSearch(e.target.value)}
                  placeholder="O'quvchi qidirish..." className="flex-1 bg-transparent outline-none text-sm"
                  style={{ color:"var(--text-primary)" }} />
              </div>
            </div>

            {/* List */}
            <div className="overflow-y-auto max-h-64 px-3 flex flex-col gap-1 pb-2">

              {/* Already in class */}
              {classStudentIds.length > 0 && allStudents
                .filter((s) => classStudentIds.includes(s.id) && s.name.toLowerCase().includes(addSearch.toLowerCase()))
                .map((s) => {
                  const color    = avatarColors[(parseInt(s.id) - 1) % avatarColors.length];
                  const initials = s.name.split(" ").map((n) => n[0]).join("").slice(0, 2);
                  return (
                    <div key={s.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl opacity-50"
                      style={{ background:"var(--bg-primary)" }}>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ background: color }}>{initials}</div>
                      <span className="flex-1 text-sm" style={{ color:"var(--text-primary)" }}>{s.name}</span>
                      <Check size={14} style={{ color:"var(--accent)" }} />
                    </div>
                  );
                })}

              {/* Not in class — clickable */}
              {notInClass.map((s) => {
                const color    = avatarColors[(parseInt(s.id) - 1) % avatarColors.length];
                const initials = s.name.split(" ").map((n) => n[0]).join("").slice(0, 2);
                return (
                  <button key={s.id} onClick={() => addExisting(s.id)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all hover:opacity-80 text-left"
                    style={{ background:"var(--bg-primary)" }}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ background: color }}>{initials}</div>
                    <span className="flex-1 text-sm" style={{ color:"var(--text-primary)" }}>{s.name}</span>
                    <Plus size={14} style={{ color:"var(--accent)" }} />
                  </button>
                );
              })}

              {notInClass.length === 0 && !addSearch && classStudentIds.length === allStudents.length && (
                <p className="text-xs text-center py-3" style={{ color:"var(--text-muted)" }}>Barcha o'quvchilar bu sinfda</p>
              )}
            </div>

            {/* Yangi o'quvchi yaratish */}
            <div className="px-4 pt-2 pb-4 border-t" style={{ borderColor:"var(--border)" }}>
              {showCreate ? (
                <div className="flex flex-col gap-2">
                  <input autoFocus value={newName} onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && createAndAdd()}
                    placeholder="Ism Familiya"
                    className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                    style={{ background:"var(--bg-primary)", border:"1px solid var(--border)", color:"var(--text-primary)" }} />
                  <input value={newTgId} onChange={(e) => setNewTgId(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && createAndAdd()}
                    placeholder="Telegram ID (ixtiyoriy)"
                    className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                    style={{ background:"var(--bg-primary)", border:"1px solid var(--border)", color:"var(--text-primary)" }} />
                  <div className="flex gap-2">
                    <button onClick={createAndAdd} className="flex-1 py-2 rounded-xl text-sm font-medium" style={{ background:"var(--accent)", color:"#fff" }}>Qo'shish</button>
                    <button onClick={() => { setShowCreate(false); setNewName(""); setNewTgId(""); }} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background:"var(--bg-primary)", border:"1px solid var(--border)", color:"var(--text-muted)" }}><X size={14} /></button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setShowCreate(true)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm transition-all hover:opacity-80"
                  style={{ border:"1px dashed var(--border)", color:"var(--text-muted)" }}>
                  <UserPlus size={15} /> Yangi o'quvchi yaratish
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete (remove from class) confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background:"#00000060" }}
          onClick={(e) => e.target === e.currentTarget && setDeleteId(null)}>
          <div className="w-full max-w-xs rounded-2xl p-5 animate-fade-in"
            style={{ background:"var(--bg-card)", border:"1px solid var(--border)" }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-base font-semibold" style={{ color:"var(--text-primary)" }}>Sinfdan chiqarish</p>
              <button onClick={() => setDeleteId(null)} className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background:"var(--bg-primary)", border:"1px solid var(--border)", color:"var(--text-muted)" }}>
                <X size={15} />
              </button>
            </div>
            <p className="text-sm mb-4" style={{ color:"var(--text-muted)" }}>
              <b>{studentList.find((s) => s.id === deleteId)?.name}</b> bu sinfdan chiqariladi.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 rounded-xl text-sm"
                style={{ background:"var(--bg-primary)", border:"1px solid var(--border)", color:"var(--text-secondary)" }}>
                Bekor
              </button>
              <button onClick={() => removeFromClass(deleteId)} className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                style={{ background:"var(--error)", color:"#fff" }}>
                Chiqarish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Natijani yuborish modal ── */}
      {sendStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "#00000060" }}
          onClick={(e) => e.target === e.currentTarget && setSendStudent(null)}>
          <div className="w-full max-w-sm rounded-2xl overflow-hidden animate-fade-in"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
              <div>
                <p className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>Natijani yuborish</p>
                <p className="text-xs mt-0.5 flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
                  <Send size={10} style={{ color: "#229ED9" }} /> {sendStudent.telegramId} · {sendStudent.name}
                </p>
              </div>
              <button onClick={() => setSendStudent(null)} className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: "var(--bg-primary)", border: "1px solid var(--border)", color: "var(--text-muted)" }}>
                <X size={15} />
              </button>
            </div>
            <div className="p-3 flex flex-col gap-1.5 max-h-72 overflow-y-auto">
              <p className="text-xs px-1 mb-0.5" style={{ color: "var(--text-muted)" }}>Mavzuni tanlang:</p>
              {SUBJECTS.map((sub) => {
                const active = selectedSubject === sub.name;
                return (
                  <button key={sub.name} onClick={() => setSelectedSubject(sub.name)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all w-full"
                    style={{
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
              <button onClick={() => setSendStudent(null)} className="flex-1 py-2.5 rounded-xl text-sm"
                style={{ background: "var(--bg-primary)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
                Bekor
              </button>
              <button
                onClick={() => { setSendStudent(null); setSelectedSubject(""); }}
                disabled={!selectedSubject}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2"
                style={{
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
