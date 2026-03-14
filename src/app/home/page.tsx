"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { User } from "lucide-react";
import { Users, CheckCircle2, TrendingUp, BookOpen, Camera, FileText, Search, Folder, FolderOpen } from "lucide-react";
import { loadClasses, loadStudents } from "@/lib/store";
import type { ClassItem, Student } from "@/lib/store";
import { useUser } from "@/lib/user-context";


const avatarColors = ["#13bfa8","#6366F1","#F59E0B","#EF4444","#3B82F6","#8B5CF6","#EC4899","#f97316"];

const todayTasks = [
  { id: "1", cls: "9-A sinfi",  subject: "Matematika", icon: "📐", total: 28, done: 8  },
  { id: "2", cls: "10-B sinfi", subject: "Fizika",     icon: "🔬", total: 15, done: 3  },
  { id: "3", cls: "9-A sinfi",  subject: "Ona tili",   icon: "📖", total: 22, done: 0  },
];

const teacherStats = [
  { label: "Jami sinflar",  value: "4",   icon: BookOpen,     color: "#6b7280", bg: "#f3f4f6" },
  { label: "O'quvchilar",   value: "111", icon: Users,         color: "#f59e0b", bg: "#fef3c7" },
  { label: "Bu oy",         value: "87",  icon: CheckCircle2,  color: "#6b7280", bg: "#f3f4f6" },
  { label: "Bu hafta",      value: "+23", icon: TrendingUp,    color: "#ef4444", bg: "#fff1f2" },
];

export default function HomePage() {
  const { user } = useUser();
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [classList, setClassList] = useState<ClassItem[]>([]);
  const [studentList, setStudentList] = useState<Student[]>([]);
  const initialized = useRef(false);

  // Carousel
  const [taskSlide, setTaskSlide] = useState(0);
  const taskIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const touchStartX = useRef(0);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    const allStudents = loadStudents();
    const classes = loadClasses();
    setClassList(classes);
    setStudentList(allStudents);
  }, []);

  useEffect(() => {
    taskIntervalRef.current = setInterval(() => {
      setTaskSlide((prev) => (prev + 1) % todayTasks.length);
    }, 30000);
    return () => { if (taskIntervalRef.current) clearInterval(taskIntervalRef.current); };
  }, []);

  const goToTaskSlide = (i: number) => {
    setTaskSlide(i);
    if (taskIntervalRef.current) clearInterval(taskIntervalRef.current);
    taskIntervalRef.current = setInterval(() => {
      setTaskSlide((prev) => (prev + 1) % todayTasks.length);
    }, 30000);
  };

  const filteredStudents = (selectedClass
    ? studentList.filter((s) =>
        classList.find((c) => c.id === selectedClass)?.studentIds?.includes(s.id)
      )
    : studentList
  ).filter((s) => s.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex-1 overflow-hidden flex flex-col pb-28 md:pb-0">

      {/* Hero */}
      <div
        className="px-5 pt-6 pb-8 shrink-0 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #111111 0%, #374151 100%)", boxShadow: "0 8px 32px rgba(0,0,0,0.32)", zIndex: 10 }}
      >
        {/* Dekorativ doiralar */}
        <div style={{
          position: "absolute", right: -30, top: -40,
          width: 160, height: 160, borderRadius: "50%",
          background: "rgba(255,255,255,0.08)",
        }} />
        <div style={{
          position: "absolute", right: 60, top: 30,
          width: 90, height: 90, borderRadius: "50%",
          background: "rgba(255,255,255,0.06)",
        }} />
        <div style={{
          position: "absolute", left: -20, bottom: -30,
          width: 110, height: 110, borderRadius: "50%",
          background: "rgba(255,255,255,0.05)",
        }} />

        {/* Content */}
        <div className="relative flex items-center justify-between">
          <div>
            <p className="text-sm font-medium mb-0.5" style={{ color: "rgba(255,255,255,0.75)" }}>Xush kelibsiz,</p>
            <h1 className="text-3xl font-bold text-white">{user?.name?.split(" ")[0] ?? ""} 👋</h1>
            <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.7)" }}>
              {user?.role === "student" ? "Bugun ham zo'r o'quvchisiz!" : "Bugun ham ajoyib o'qituvchisiz!"}
            </p>
          </div>
          {/* Mobile-da avatar (desktop-da sidebar bor) */}
          <Link
            href="/settings"
            className="md:hidden w-12 h-12 rounded-2xl overflow-hidden flex items-center justify-center text-white shrink-0"
            style={{ background: "rgba(255,255,255,0.18)", backdropFilter: "blur(8px)" }}
          >
            {user?.avatarUrl
              ? <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
              : <User size={22} color="white" />
            }
          </Link>
        </div>
      </div>

      <div className="bg-grid flex-1 mt-2 rounded-t-2xl overflow-hidden flex flex-col">

        {/* Stats */}
        <div className="px-4 pt-8 shrink-0">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
            {teacherStats.map(({ label, value, icon: Icon, color, bg }, i) => (
              <div
                key={i}
                className="card-3d rounded-2xl p-4 flex items-center gap-3"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
              >
                <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: bg }}>
                  <Icon size={19} style={{ color }} />
                </div>
                <div>
                  <p className="text-2xl font-bold leading-none" style={{ color: "var(--text-primary)" }}>{value}</p>
                  <p className="text-xs font-bold mt-1.5 uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>{label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Kunlik vazifa — Carousel */}
        <div className="px-4 pt-3 shrink-0">
          <div
            className="rounded-2xl overflow-hidden relative"
            style={{
              background: "linear-gradient(135deg, #F5A623 0%, #F97316 100%)",
              boxShadow: "0 4px 20px rgba(245,166,35,0.30)",
            }}
            onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
            onTouchEnd={(e) => {
              const diff = touchStartX.current - e.changedTouches[0].clientX;
              if (Math.abs(diff) > 40)
                goToTaskSlide((taskSlide + (diff > 0 ? 1 : -1) + todayTasks.length) % todayTasks.length);
            }}
          >
            {/* Dekorativ doiralar */}
            <div style={{ position: "absolute", right: -25, top: -35, width: 110, height: 110, borderRadius: "50%", background: "rgba(255,255,255,0.13)", pointerEvents: "none" }} />
            <div style={{ position: "absolute", right: 55, bottom: -20, width: 65, height: 65, borderRadius: "50%", background: "rgba(255,255,255,0.09)", pointerEvents: "none" }} />
            <div style={{ position: "absolute", left: -18, top: -22, width: 85, height: 85, borderRadius: "50%", background: "rgba(255,255,255,0.07)", pointerEvents: "none" }} />
            <div style={{ position: "absolute", left: 30, bottom: -30, width: 70, height: 70, borderRadius: "50%", background: "rgba(255,255,255,0.06)", pointerEvents: "none" }} />

            {/* Slides */}
            <div
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${taskSlide * 100}%)` }}
            >
              {todayTasks.map((task) => {
                const remaining = task.total - task.done;
                const pct = Math.round((task.done / task.total) * 100);
                return (
                  <div key={task.id} className="min-w-full px-4 pt-4 pb-2 flex items-start gap-3 relative">
                    <span className="text-2xl shrink-0 mt-0.5">{task.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold tracking-widest uppercase" style={{ color: "rgba(255,255,255,0.7)" }}>
                        {task.cls} · {task.subject}
                      </p>
                      <p className="text-base font-semibold mt-0.5 text-white leading-snug">
                        {remaining > 0
                          ? `${remaining} ta uy ishi tekshirilmagan`
                          : "Hammasi tekshirildi! 🎉"}
                      </p>
                      <div className="flex items-center gap-2 mt-2 mb-1">
                        <div className="h-1.5 rounded-full flex-1" style={{ background: "rgba(255,255,255,0.28)" }}>
                          <div
                            className="h-1.5 rounded-full transition-all duration-700"
                            style={{ width: `${pct}%`, background: "#fff" }}
                          />
                        </div>
                        <span className="text-xs font-bold text-white shrink-0">{task.done}/{task.total}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Dots */}
            <div className="flex items-center justify-center gap-1.5 py-2.5">
              {todayTasks.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goToTaskSlide(i)}
                  className="rounded-full transition-all duration-300"
                  style={{
                    width: taskSlide === i ? 18 : 5,
                    height: 5,
                    background: taskSlide === i ? "#fff" : "rgba(255,255,255,0.38)",
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Sinflarim */}
        <div className="px-4 pt-3 pb-4 flex-1 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between mb-3 shrink-0">
            <p className="text-base font-bold" style={{ color: "var(--text-primary)" }}>Sinflarim</p>
            <Link href="/dashboard" className="text-sm font-semibold" style={{ color: "var(--accent)" }}>
              Batafsil →
            </Link>
          </div>

          {/* Mobile: accordion */}
          <div className="flex-1 min-h-0 flex flex-col gap-1.5 md:hidden overflow-y-auto">
            {classList.map((cls) => {
              const isOpen = selectedClass === cls.id;
              return (
                <div key={cls.id}>
                  <button
                    onClick={() => setSelectedClass(isOpen ? null : cls.id)}
                    className="w-full rounded-2xl px-4 py-3 flex items-center gap-3 transition-all card-hover-bottom"
                    style={{
                      background: isOpen ? "var(--accent)" : "var(--bg-card)",
                      border: `1px solid ${isOpen ? "transparent" : "var(--border)"}`,
                      boxShadow: isOpen ? "0 4px 16px rgba(19,191,168,0.25)" : "none",
                    }}
                  >
                    <div
                      className="shrink-0 flex items-center justify-center"
                      style={{ color: isOpen ? "#fff" : "var(--accent)" }}
                    >
                      {isOpen ? <FolderOpen size={18} /> : <Folder size={18} />}
                    </div>
                    <span className="flex-1 text-sm font-medium text-left"
                      style={{ color: isOpen ? "#fff" : "var(--text-primary)" }}>
                      {cls.name} sinfi
                    </span>
                    <span className="text-xs" style={{ color: isOpen ? "rgba(255,255,255,0.7)" : "var(--text-muted)" }}>
                      {cls.studentCount} o'q
                    </span>
                    <span
                      className="text-xs transition-transform duration-200"
                      style={{
                        color: isOpen ? "rgba(255,255,255,0.7)" : "var(--text-muted)",
                        transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                        display: "inline-block",
                      }}
                    >
                      ▾
                    </span>
                  </button>

                  {isOpen && (
                    <div className="ml-4 mt-1 flex flex-col gap-1 border-l-2 pl-3"
                      style={{ borderColor: "var(--accent)" + "44" }}>
                      {studentList.filter((s) => cls.studentIds.includes(s.id)).map((student) => {
                        const color = avatarColors[(parseInt(student.id) - 1) % avatarColors.length];
                        const initials = student.name.split(" ").map((n) => n[0]).join("").slice(0, 2);
                        return (
                          <Link
                            key={student.id}
                            href={`/student/${student.id}`}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all hover:opacity-80"
                            style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
                          >
                            <div
                              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                              style={{ background: color }}
                            >
                              {initials}
                            </div>
                            <span className="flex-1 text-sm" style={{ color: "var(--text-primary)" }}>
                              {student.name}
                            </span>
                            <Camera size={14} style={{ color: "var(--text-muted)" }} />
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Desktop: VS Code explorer style */}
          <div className="card-3d hidden md:flex flex-1 overflow-hidden rounded-2xl" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>

            {/* Chap — sinflar (explorer panel) */}
            <div
              className="w-48 shrink-0 flex flex-col border-r"
              style={{ borderColor: "var(--border)" }}
            >
              <div className="px-3 py-2 border-b shrink-0" style={{ borderColor: "var(--border)" }}>
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                  SINFLAR
                </p>
              </div>
              <div className="bg-grid flex-1 overflow-y-auto py-1">
                <button
                  onClick={() => setSelectedClass(null)}
                  className="w-full text-left px-3 py-1.5 flex items-center gap-2 transition-all"
                  style={{
                    background: selectedClass === null ? "var(--accent-light)" : "transparent",
                    color: selectedClass === null ? "var(--accent)" : "var(--text-secondary)",
                  }}
                >
                  <Users size={14} className="shrink-0" />
                  <span className="text-sm truncate">Hammasi</span>
                </button>

                {classList.map((cls) => {
                  const isActive = selectedClass === cls.id;
                  return (
                    <button
                      key={cls.id}
                      onClick={() => setSelectedClass(cls.id)}
                      className="w-full text-left px-3 py-1.5 flex items-center gap-2 transition-all card-hover-bottom"
                      style={{
                        background: isActive ? "var(--accent-light)" : "transparent",
                        color: isActive ? "var(--accent)" : "var(--text-secondary)",
                      }}
                    >
                      {isActive
                        ? <FolderOpen size={14} className="shrink-0" style={{ color: "var(--accent)" }} />
                        : <Folder size={14} className="shrink-0" style={{ color: "var(--text-muted)" }} />
                      }
                      <span className="text-sm flex-1 text-left truncate">{cls.name} sinfi</span>
                      <span className="text-[10px] shrink-0" style={{ color: "var(--text-muted)" }}>
                        {cls.studentCount}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* O'ng — o'quvchilar */}
            <div className="flex-1 overflow-hidden flex flex-col">
              <div className="px-4 py-2 border-b shrink-0 flex items-center gap-3" style={{ borderColor: "var(--border)" }}>
                <p className="text-[10px] font-bold uppercase tracking-widest flex-1" style={{ color: "var(--text-muted)" }}>
                  {selectedClass
                    ? classList.find((c) => c.id === selectedClass)?.name
                    : "BARCHA O'QUVCHILAR"}
                </p>
                <div
                  className="flex items-center gap-1.5 px-2 py-1 rounded-lg"
                  style={{ background: "var(--bg-primary)", border: "1px solid var(--border)" }}
                >
                  <Search size={11} style={{ color: "var(--text-muted)" }} />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Qidirish..."
                    className="bg-transparent outline-none text-xs w-24"
                    style={{ color: "var(--text-primary)" }}
                  />
                </div>
              </div>

              <div className="bg-grid flex-1 overflow-y-auto py-1">
                {filteredStudents.map((student) => {
                  const color = avatarColors[(parseInt(student.id) - 1) % avatarColors.length];
                  const initials = student.name.split(" ").map((n) => n[0]).join("").slice(0, 2);
                  return (
                    <div
                      key={student.id}
                      className="flex items-center gap-2.5 px-3 py-1.5 group transition-all hover:opacity-80 card-hover-bottom"
                      style={{ cursor: "default" }}
                    >
                      <Link href={`/student/${student.id}`}>
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                          style={{ background: color }}
                        >
                          {initials}
                        </div>
                      </Link>
                      <Link href={`/student/${student.id}`} className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>{student.name}</p>
                      </Link>
                      <span className="text-xs font-medium shrink-0" style={{ color: "var(--text-muted)" }}>
                        {student.submissionCount} ta
                      </span>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                        <button
                          className="w-6 h-6 rounded-lg flex items-center justify-center"
                          style={{ background: "var(--accent)", color: "#fff" }}
                          title="Tekshirish"
                        >
                          <Camera size={11} />
                        </button>
                        <Link
                          href="/submission/1"
                          className="w-6 h-6 rounded-lg flex items-center justify-center"
                          style={{ background: "var(--bg-primary)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}
                          title="Tarix"
                        >
                          <FileText size={11} />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
