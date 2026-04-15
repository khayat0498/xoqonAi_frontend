"use client";

import { Suspense } from "react";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { User, Bell } from "lucide-react";
import { Users, CheckCircle2, TrendingUp, BookOpen, Camera, Eye, Search, Folder, FolderOpen, FolderPlus, Trash2, Pencil, MoreVertical, ArrowUpDown, ChevronDown, ChevronLeft, Send, ListOrdered, FileText, FlaskConical, Plus, X } from "lucide-react";
import { useUser } from "@/lib/user-context";
import { useUserWS } from "@/lib/user-ws";
import { getToken } from "@/lib/auth";

const API = process.env.NEXT_PUBLIC_API_URL;
function authHeaders() {
  return { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` };
}

type ClassItem = { id: string; name: string; icon: string | null; telegramGroupId: string | null; studentCount: number; createdAt: string };
type Student = { id: string; name: string; telegramId: string | null; classCount: number; createdAt: string };
type FolderType = { id: string; name: string; icon: string | null; createdAt: string; submissionCount: number };
type Submission = { id: string; studentName: string | null; subject: string | null; status: string; grade: string | null; score: number | null; folderId: string | null; createdAt: string };
import ViewToggle from "@/components/ViewToggle";
import IconPicker from "@/components/IconPicker";

const avatarColors = ["#6875f5","#4a9aaa","#e5a832","#3dbd7d","#7c83f5","#a78bfa","#f472b6","#f59e42"];

const todayTasks: { id: string; cls: string; subject: string; icon: string; total: number; done: number }[] = [];

const teacherStats = [
  { label: "Jami sinflar",  value: "0",  icon: BookOpen,     color: "#4a9aaa", bg: "rgba(74, 154, 170, 0.12)" },
  { label: "O'quvchilar",   value: "0",  icon: Users,         color: "#6875f5", bg: "rgba(104, 117, 245, 0.1)" },
  { label: "Bu oy",         value: "0",  icon: CheckCircle2,  color: "#3dbd7d", bg: "rgba(61, 189, 125, 0.12)" },
  { label: "Bu hafta",      value: "0",  icon: TrendingUp,    color: "#e05c5c", bg: "rgba(224, 92, 92, 0.1)" },
];

const PLAN_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  free:    { label: "Free",    color: "var(--text-muted)",  bg: "var(--bg-primary)" },
  pro:     { label: "Pro",     color: "var(--accent)",      bg: "var(--accent-light)" },
  premium: { label: "Premium", color: "var(--warning)",     bg: "var(--warning-bg)" },
};

function HomePageInner() {
  const { user } = useUser();
  const { lastEvent } = useUserWS();
  const searchParams = useSearchParams();
  const [planKey, setPlanKey] = useState("free");
  const [used, setUsed] = useState(0);
  const [limit, setLimit] = useState(60);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    const h = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
    fetch(`${API}/api/billing/my-plan`, { headers: h })
      .then((r) => r.json()).then((d) => setPlanKey(d.planKey ?? "free")).catch(() => {});
    fetch(`${API}/api/submissions/usage/me`, { headers: h })
      .then((r) => r.json()).then((d) => { setUsed(d.used ?? 0); setLimit(d.limit ?? 60); }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!lastEvent) return;
    if (lastEvent.type === "plan_updated") setPlanKey(lastEvent.data.planKey);
    if (lastEvent.type === "usage_updated") { setUsed(lastEvent.data.used); setLimit(lastEvent.data.limit); }
    if (lastEvent.type === "submission_done") {
      setNotifications((prev) => [{ ...lastEvent.data }, ...prev]);
      setUnreadCount((n) => n + 1);
    }
  }, [lastEvent]);
  const [activeTab, setActiveTab] = useState<"papkalarim" | "sinflarim" | "oquvchilar">("papkalarim");
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [classList, setClassList] = useState<ClassItem[]>([]);
  const [studentList, setStudentList] = useState<Student[]>([]);
  const [folderList, setFolderList] = useState<FolderType[]>([]);
  const [editingFolder, setEditingFolder] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderIcon, setNewFolderIcon] = useState("📁");
  const [editIcon, setEditIcon] = useState("📁");
  const [nameError, setNameError] = useState("");
  const [menuOpenFolder, setMenuOpenFolder] = useState<string | null>(null);
  const [menuOpenClass, setMenuOpenClass] = useState<string | null>(null);
  const [editingClass, setEditingClass] = useState<string | null>(null);
  const [editClassName, setEditClassName] = useState("");
  const [sortBy, setSortBy] = useState<string>("name-asc");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showClassFilter, setShowClassFilter] = useState(false);
  const [jildlarSubTab, setJildlarSubTab] = useState<"folders" | "tahlillar">("folders");
  const [allFiles, setAllFiles] = useState<Submission[]>([]);
  const [classStudents, setClassStudents] = useState<Student[]>([]);
  const [menuOpenFile, setMenuOpenFile] = useState<string | null>(null);
  const [creatingClass, setCreatingClass] = useState(false);
  const [newClassName, setNewClassName] = useState("");
  const [planAlert, setPlanAlert] = useState<string | null>(null);
  const [deleteStudentId, setDeleteStudentId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<{ id: string; grade: string | null; score: number | null; subject: string | null; failed?: boolean }[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const notifRef = useRef<HTMLDivElement>(null);
  const notifRefDesktop = useRef<HTMLDivElement>(null);
  const fileMenuRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const classMenuRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  // Handle URL tab param (from sidebar/bottom nav "Jildlar" link)
  const isJildlarMode = searchParams.get("tab") === "jildlar";
  useEffect(() => {
    if (isJildlarMode) setActiveTab("papkalarim");
  }, [isJildlarMode]);


  const [taskSlide, setTaskSlide] = useState(0);
  const taskIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const touchStartX = useRef(0);

  const refreshFolders = async () => {
    const [foldersRes, filesRes] = await Promise.all([
      fetch(`${API}/api/folders`, { headers: authHeaders() }),
      fetch(`${API}/api/submissions`, { headers: authHeaders() }),
    ]);
    if (foldersRes.ok) setFolderList(await foldersRes.json());
    if (filesRes.ok) {
      const data = await filesRes.json();
      setAllFiles(data.data ?? []);
    }
  };

  useEffect(() => {
    async function load() {
      const [classRes, studentRes] = await Promise.all([
        fetch(`${API}/api/classes`, { headers: authHeaders() }),
        fetch(`${API}/api/students`, { headers: authHeaders() }),
      ]);
      if (classRes.ok) setClassList(await classRes.json());
      if (studentRes.ok) {
        const data = await studentRes.json();
        setStudentList(data.students ?? []);
      }
      await refreshFolders();
      // Initial notifications: recent done/failed submissions
      const notifRes = await fetch(`${API}/api/submissions?status=done&limit=10`, { headers: authHeaders() });
      if (notifRes.ok) {
        const notifData = await notifRes.json();
        setNotifications((notifData.data ?? []).map((s: Submission) => ({ id: s.id, grade: s.grade, score: s.score, subject: s.subject })));
      }
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const inMobile = notifRef.current?.contains(e.target as Node);
      const inDesktop = notifRefDesktop.current?.contains(e.target as Node);
      if (!inMobile && !inDesktop) setNotifOpen(false);
    }
    if (notifOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [notifOpen]);

  useEffect(() => {
    if (todayTasks.length === 0) return;
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

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuOpenFolder && menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpenFolder(null);
      if (menuOpenClass && classMenuRef.current && !classMenuRef.current.contains(e.target as Node)) setMenuOpenClass(null);
      if (menuOpenFile && fileMenuRef.current && !fileMenuRef.current.contains(e.target as Node)) setMenuOpenFile(null);
      if (showSortMenu && sortRef.current && !sortRef.current.contains(e.target as Node)) setShowSortMenu(false);
      if (showClassFilter && filterRef.current && !filterRef.current.contains(e.target as Node)) setShowClassFilter(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpenFolder, menuOpenClass, menuOpenFile, showSortMenu, showClassFilter]);

  useEffect(() => {
    if (!selectedClass) { setClassStudents([]); return; }
    fetch(`${API}/api/classes/${selectedClass}`, { headers: authHeaders() })
      .then(r => r.json())
      .then(data => setClassStudents(data.students ?? []));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClass]);

  const filteredStudents = (selectedClass ? classStudents : studentList)
    .filter((s) => s.name.toLowerCase().includes(search.toLowerCase()));

  // ── Folder handlers ──
  const localFolderNameExists = (name: string, excludeId?: string) =>
    folderList.some(f => f.id !== excludeId && f.name.toLowerCase().trim() === name.toLowerCase().trim());

  const handleCreateFolder = async (name: string, icon: string) => {
    const res = await fetch(`${API}/api/folders`, { method: "POST", headers: authHeaders(), body: JSON.stringify({ name, icon }) });
    if (res.ok) await refreshFolders();
  };
  const handleDeleteFolder = async (id: string) => {
    await fetch(`${API}/api/folders/${id}`, { method: "DELETE", headers: authHeaders() });
    await refreshFolders();
  };
  const handleRenameFolder = async (id: string, name: string, icon?: string) => {
    await fetch(`${API}/api/folders/${id}`, { method: "PATCH", headers: authHeaders(), body: JSON.stringify({ name, icon }) });
    await refreshFolders();
  };
  const handleUpdateFolderIcon = async (id: string, icon: string) => {
    await fetch(`${API}/api/folders/${id}`, { method: "PATCH", headers: authHeaders(), body: JSON.stringify({ icon }) });
    await refreshFolders();
  };

  // ── Class handlers ──
  const handleCreateClass = async (name: string): Promise<boolean> => {
    const duplicate = classList.some(c => c.name.toLowerCase().trim() === name.toLowerCase().trim());
    if (duplicate) return false;
    const res = await fetch(`${API}/api/classes`, { method: "POST", headers: authHeaders(), body: JSON.stringify({ name }) });
    if (res.ok) {
      const created = await res.json();
      setClassList(prev => [...prev, { ...created, studentCount: 0 }]);
      return true;
    }
    return false;
  };
  const handleDeleteClass = async (id: string) => {
    await fetch(`${API}/api/classes/${id}`, { method: "DELETE", headers: authHeaders() });
    setClassList(prev => prev.filter(c => c.id !== id));
  };
  const handleDeleteStudent = async (id: string) => {
    await fetch(`${API}/api/students/${id}`, { method: "DELETE", headers: authHeaders() });
    setStudentList(prev => prev.filter(s => s.id !== id));
    setDeleteStudentId(null);
  };
  const handleRenameClass = async (id: string, name: string): Promise<boolean> => {
    const duplicate = classList.some(c => c.id !== id && c.name.toLowerCase().trim() === name.toLowerCase().trim());
    if (duplicate) return false;
    const res = await fetch(`${API}/api/classes/${id}`, { method: "PATCH", headers: authHeaders(), body: JSON.stringify({ name }) });
    if (res.ok) {
      setClassList(prev => prev.map(c => c.id === id ? { ...c, name } : c));
      return true;
    }
    return false;
  };

  // ── File (Submission) handlers ──
  const handleDeleteFile = async (id: string) => {
    await fetch(`${API}/api/submissions/${id}`, { method: "DELETE", headers: authHeaders() });
    setAllFiles(prev => prev.filter(f => f.id !== id));
  };

  // Sort helper
  const sortItems = <T,>(items: T[], key: string, getters: Record<string, (a: T, b: T) => number>): T[] => {
    const fn = getters[key];
    return fn ? [...items].sort(fn) : items;
  };

  const q = search.toLowerCase();

  const sortedFolders = sortItems(
    folderList.filter((f) => f.name.toLowerCase().includes(q)),
    sortBy,
    {
      "name-asc": (a, b) => a.name.localeCompare(b.name),
      "name-desc": (a, b) => b.name.localeCompare(a.name),
      "date-new": (a, b) => b.createdAt.localeCompare(a.createdAt),
      "date-old": (a, b) => a.createdAt.localeCompare(b.createdAt),
      "files": (a, b) => (b.submissionCount ?? 0) - (a.submissionCount ?? 0),
    },
  );

  const sortedClasses = sortItems(
    classList.filter((c) => c.name.toLowerCase().includes(q)),
    sortBy,
    {
      "name-asc": (a, b) => a.name.localeCompare(b.name),
      "name-desc": (a, b) => b.name.localeCompare(a.name),
      "students": (a, b) => b.studentCount - a.studentCount,
    },
  );

  const sortedStudents = sortItems(
    filteredStudents,
    sortBy,
    {
      "name-asc": (a, b) => a.name.localeCompare(b.name),
      "name-desc": (a, b) => b.name.localeCompare(a.name),
    },
  );

  const sortedFiles = sortItems(
    allFiles.filter((f) =>
      (f.studentName ?? "").toLowerCase().includes(q) ||
      (f.subject ?? "").toLowerCase().includes(q)
    ),
    sortBy,
    {
      "name-asc": (a, b) => (a.studentName ?? "").localeCompare(b.studentName ?? ""),
      "name-desc": (a, b) => (b.studentName ?? "").localeCompare(a.studentName ?? ""),
      "date-new": (a, b) => b.createdAt.localeCompare(a.createdAt),
      "date-old": (a, b) => a.createdAt.localeCompare(b.createdAt),
      "subject": (a, b) => (a.subject ?? "").localeCompare(b.subject ?? ""),
    },
  );

  // Active sort key for the renderSortBtn — use jildlarSubTab when in jildlar mode
  const activeSortKey = isJildlarMode ? jildlarSubTab === "folders" ? "papkalarim" : "tahlillar" : activeTab;

  const SORT_OPTIONS: Record<string, { label: string; value: string }[]> = {
    papkalarim: [
      { label: "Nomi (A→Z)", value: "name-asc" },
      { label: "Nomi (Z→A)", value: "name-desc" },
      { label: "Yangi", value: "date-new" },
      { label: "Eski", value: "date-old" },
      { label: "Fayllar soni", value: "files" },
    ],
    tahlillar: [
      { label: "Ism (A→Z)", value: "name-asc" },
      { label: "Ism (Z→A)", value: "name-desc" },
      { label: "Yangi", value: "date-new" },
      { label: "Eski", value: "date-old" },
      { label: "Fan bo'yicha", value: "subject" },
    ],
    sinflarim: [
      { label: "Nomi (A→Z)", value: "name-asc" },
      { label: "Nomi (Z→A)", value: "name-desc" },
      { label: "O'quvchi soni", value: "students" },
    ],
    oquvchilar: [
      { label: "Nomi (A→Z)", value: "name-asc" },
      { label: "Nomi (Z→A)", value: "name-desc" },
      { label: "Ball (yuqori)", value: "grade-high" },
      { label: "Ball (past)", value: "grade-low" },
      { label: "Tekshirishlar", value: "submissions" },
    ],
  };

  const renderSortBtn = () => (
    <div className="relative shrink-0" ref={sortRef}>
      <button
        onClick={() => setShowSortMenu(!showSortMenu)}
        className="w-9 h-9 flex items-center justify-center transition-all"
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-sm)",
          boxShadow: "var(--shadow-clay-sm)",
          color: "var(--text-muted)",
        }}
        title="Saralash"
      >
        <ArrowUpDown size={14} />
      </button>
      {showSortMenu && (
        <div
          className="absolute right-0 top-11 z-50 animate-fade-in py-1"
          style={{
            background: "var(--bg-card-solid, var(--bg-card))",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-sm)",
            boxShadow: "var(--shadow-clay)",
            minWidth: 170,
          }}
        >
          {(SORT_OPTIONS[activeSortKey] ?? []).map((opt) => (
            <button
              key={opt.value}
              onClick={() => { setSortBy(opt.value); setShowSortMenu(false); }}
              className="w-full text-left px-4 py-2.5 text-sm transition-all hover:bg-[var(--surface-hover)]"
              style={{
                color: sortBy === opt.value ? "var(--accent)" : "var(--text-primary)",
                fontWeight: sortBy === opt.value ? 700 : 500,
              }}
            >
              {sortBy === opt.value && "✓ "}{opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="flex-1 overflow-hidden flex flex-col pb-28 md:pb-0 bg-grid">

      {isJildlarMode && (
        <div
          className="shrink-0 px-5 py-4 flex items-center gap-3 relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, var(--accent-dark) 0%, var(--accent) 60%, var(--accent-hover) 100%)",
            boxShadow: `
              6px 6px 14px rgba(53, 120, 136, 0.25),
              inset -2px -2px 6px rgba(0,0,0,0.08),
              inset 2px 2px 6px rgba(255,255,255,0.12)
            `,
          }}
        >
          <div style={{ position: "absolute", right: -25, top: -30, width: 100, height: 100, borderRadius: "50%", background: "rgba(255,255,255,0.12)", pointerEvents: "none" }} />
          <Link
            href="/home"
            className="w-9 h-9 flex items-center justify-center shrink-0 transition-all hover:scale-105"
            style={{
              background: "rgba(255,255,255,0.18)",
              borderRadius: "var(--radius-sm)",
              color: "#fff",
              backdropFilter: "blur(8px)",
            }}
          >
            <ChevronLeft size={20} />
          </Link>
          <h1 className="text-lg font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>
            Jildlar
          </h1>
        </div>
      )}

      {!isJildlarMode && (<>
      {/* Hero — clay style */}
      <div
        className="mx-4 md:mx-6 mt-4 px-6 pt-6 pb-7 shrink-0 relative"
        style={{
          background: "var(--bg-card)",
          backdropFilter: "blur(4px)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "var(--shadow-clay)",
          zIndex: 10,
        }}
      >
        {/* Dekor doiralar — yumshoq */}
        <div style={{ position: "absolute", inset: 0, overflow: "hidden", borderRadius: "var(--radius-lg)", pointerEvents: "none" }}>
          <div style={{ position: "absolute", right: -30, top: -40, width: 140, height: 140, borderRadius: "50%", background: "rgba(74, 154, 170, 0.06)" }} />
          <div style={{ position: "absolute", right: 50, bottom: -20, width: 80, height: 80, borderRadius: "50%", background: "rgba(104, 117, 245, 0.05)" }} />
        </div>

        <div className="relative flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium mb-0.5" style={{ color: "var(--text-muted)" }}>Xush kelibsiz,</p>
            {/* Desktop: ism + plan badge yonma-yon */}
            <div className="hidden md:flex items-center gap-2">
              <h1
                className="text-3xl font-bold"
                style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)", letterSpacing: "-0.025em" }}
              >
                {user?.name?.split(" ")[0] ?? ""}
              </h1>
              <span
                className="text-xs font-bold px-2.5 py-1 rounded-full self-end mb-1"
                style={{
                  background: PLAN_LABEL[planKey]?.bg ?? "var(--bg-primary)",
                  color: PLAN_LABEL[planKey]?.color ?? "var(--text-muted)",
                  border: `1px solid ${PLAN_LABEL[planKey]?.color ?? "var(--border)"}`,
                }}
              >
                {PLAN_LABEL[planKey]?.label ?? "Free"}
              </span>
            </div>
            {/* Mobile: faqat ism */}
            <h1
              className="md:hidden text-3xl font-bold"
              style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)", letterSpacing: "-0.025em" }}
            >
              {user?.name?.split(" ")[0] ?? ""}
            </h1>
            {/* Usage — desktop */}
            <p className="hidden md:block text-xs mt-1 font-semibold tabular-nums" style={{ color: "var(--text-muted)" }}>
              {used} / {limit >= 99999 ? "∞" : limit} ta tekshiruv
            </p>
            {/* Inline stats — mobile only */}
            <div className="flex items-center gap-3 mt-2 md:hidden flex-wrap">
              {teacherStats.map(({ label, value, color }, i) => (
                <span key={i} className="text-xs font-bold" style={{ color }}>
                  {value} <span className="font-medium" style={{ color: "var(--text-muted)" }}>{label.toLowerCase()}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Desktop o'ng: bell + avatar */}
          <div className="hidden md:flex items-center gap-2 shrink-0 ml-4">
            <div ref={notifRefDesktop} className="relative">
              <button
                onClick={() => { setNotifOpen((o) => !o); setUnreadCount(0); }}
                className="w-10 h-10 flex items-center justify-center relative"
                style={{ background: "var(--bg-primary)", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", color: "var(--text-muted)" }}
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold rounded-full px-0.5"
                    style={{ background: "var(--error, #e05c5c)", color: "#fff" }}>
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
              {notifOpen && (
                <div className="absolute right-0 top-12 w-72 rounded-xl shadow-xl z-50 overflow-hidden"
                  style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                  <div className="px-4 py-2.5 border-b" style={{ borderColor: "var(--border)" }}>
                    <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Natijalar</p>
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="px-4 py-6 text-center text-sm" style={{ color: "var(--text-muted)" }}>Hali natija yo'q</p>
                    ) : notifications.map((n) => (
                      <Link key={n.id} href={`/submission/${n.id}`}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--bg-primary)] transition-colors"
                        onClick={() => setNotifOpen(false)}>
                        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm font-bold"
                          style={{ background: n.failed ? "rgba(224,92,92,0.12)" : "rgba(61,189,125,0.12)", color: n.failed ? "#e05c5c" : "#3dbd7d" }}>
                          {n.failed ? "!" : n.grade ?? "?"}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                            {n.subject ?? "Tahlil"}{n.failed ? " — xatolik" : ""}
                          </p>
                          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                            {n.failed ? "AI tahlil muvaffaqiyatsiz" : `Ball: ${n.score ?? "—"}`}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <Link
              href="/settings"
              className="w-10 h-10 flex items-center justify-center shrink-0"
              style={{ background: "var(--accent-light)", borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-clay-sm)", color: "var(--accent)" }}
            >
              {user?.avatarUrl
                ? <img src={user.avatarUrl} alt={user.name} className="w-10 h-10 object-cover" style={{ borderRadius: "var(--radius-md)" }} />
                : <User size={20} />
              }
            </Link>
          </div>

          {/* Mobile o'ng: plan badge + bell + avatar */}
          <div className="md:hidden flex flex-col items-end gap-2 shrink-0 ml-3">
            <Link
              href="/billing"
              className="text-xs font-bold px-2.5 py-1 rounded-full"
              style={{
                background: PLAN_LABEL[planKey]?.bg ?? "var(--bg-primary)",
                color: PLAN_LABEL[planKey]?.color ?? "var(--text-muted)",
                border: `1px solid ${PLAN_LABEL[planKey]?.color ?? "var(--border)"}`,
              }}
            >
              {PLAN_LABEL[planKey]?.label ?? "Free"} · {used}/{limit >= 99999 ? "∞" : limit}
            </Link>
            <div className="flex items-center gap-2">
              {/* Bell */}
              <div ref={notifRef} className="relative">
                <button
                  onClick={() => { setNotifOpen((o) => !o); setUnreadCount(0); }}
                  className="w-9 h-9 flex items-center justify-center relative"
                  style={{ background: "var(--bg-primary)", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", color: "var(--text-muted)" }}
                >
                  <Bell size={18} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold rounded-full px-0.5"
                      style={{ background: "var(--error, #e05c5c)", color: "#fff" }}>
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>
                {notifOpen && (
                  <div className="absolute right-0 top-11 w-72 rounded-xl shadow-xl z-50 overflow-hidden"
                    style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                    <div className="px-4 py-2.5 border-b" style={{ borderColor: "var(--border)" }}>
                      <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Natijalar</p>
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className="px-4 py-6 text-center text-sm" style={{ color: "var(--text-muted)" }}>Hali natija yo'q</p>
                      ) : notifications.map((n) => (
                        <Link key={n.id} href={`/submission/${n.id}`}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--bg-primary)] transition-colors"
                          onClick={() => setNotifOpen(false)}>
                          <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm font-bold"
                            style={{ background: n.failed ? "rgba(224,92,92,0.12)" : "rgba(61,189,125,0.12)", color: n.failed ? "#e05c5c" : "#3dbd7d" }}>
                            {n.failed ? "!" : n.grade ?? "?"}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                              {n.subject ?? "Tahlil"}{n.failed ? " — xatolik" : ""}
                            </p>
                            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                              {n.failed ? "AI tahlil muvaffaqiyatsiz" : `Ball: ${n.score ?? "—"}`}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <Link
                href="/settings"
                className="w-9 h-9 flex items-center justify-center shrink-0"
                style={{
                  background: "var(--accent-light)",
                  borderRadius: "var(--radius-md)",
                  boxShadow: "var(--shadow-clay-sm)",
                  color: "var(--accent)",
                }}
              >
                {user?.avatarUrl
                  ? <img src={user.avatarUrl} alt={user.name} className="w-9 h-9 object-cover" style={{ borderRadius: "var(--radius-md)" }} />
                  : <User size={18} />
                }
              </Link>
            </div>
          </div>
        </div>
      </div>

        {/* Stats — clay cards (desktop only) */}
        <div className="hidden md:block px-4 md:px-6 pt-2 shrink-0">
          <div className="grid grid-cols-4 gap-3">
            {teacherStats.map(({ label, value, icon: Icon, color, bg }, i) => (
              <div
                key={i}
                className="clay-card p-4 flex items-center gap-3"
              >
                <div
                  className="w-[40px] h-[40px] flex items-center justify-center shrink-0 rounded-full"
                  style={{
                    background: bg,
                    boxShadow: `
                      inset -1px -1px 3px rgba(0,0,0,0.05),
                      inset 1px 1px 3px rgba(255,255,255,0.5)
                    `,
                  }}
                >
                  <Icon size={18} style={{ color }} />
                </div>
                <div>
                  <p
                    className="text-2xl leading-none"
                    style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)", fontWeight: 700, letterSpacing: "-0.03em" }}
                  >
                    {value}
                  </p>
                  <p className="text-[0.72rem] font-bold mt-1.5 uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                    {label}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Vazifalar karuseli — pastel clay */}
        <div className="px-4 md:px-6 pt-3 shrink-0">
          <div
            className="overflow-hidden relative"
            style={{
              background: "linear-gradient(135deg, var(--accent-dark) 0%, var(--accent) 60%, var(--accent-hover) 100%)",
              borderRadius: "var(--radius-lg)",
              boxShadow: `
                6px 6px 14px rgba(53, 120, 136, 0.25),
                inset -2px -2px 6px rgba(0,0,0,0.08),
                inset 2px 2px 6px rgba(255,255,255,0.12)
              `,
            }}
            onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
            onTouchEnd={(e) => {
              const diff = touchStartX.current - e.changedTouches[0].clientX;
              if (Math.abs(diff) > 40)
                goToTaskSlide((taskSlide + (diff > 0 ? 1 : -1) + todayTasks.length) % todayTasks.length);
            }}
          >
            <div style={{ position: "absolute", right: -25, top: -35, width: 110, height: 110, borderRadius: "50%", background: "rgba(255,255,255,0.2)", pointerEvents: "none" }} />
            <div style={{ position: "absolute", left: -18, bottom: -15, width: 85, height: 85, borderRadius: "50%", background: "rgba(255,255,255,0.15)", pointerEvents: "none" }} />

            <div
              className="flex transition-transform duration-500"
              style={{ transform: `translateX(-${taskSlide * 100}%)`, transitionTimingFunction: "var(--ease-out)" }}
            >
              {todayTasks.map((task) => {
                const remaining = task.total - task.done;
                const pct = Math.round((task.done / task.total) * 100);
                return (
                  <div key={task.id} className="min-w-full px-5 pt-4 pb-2 flex items-start gap-3 relative">
                    <span className="text-2xl shrink-0 mt-0.5">{task.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold tracking-widest uppercase" style={{ color: "rgba(255,255,255,0.7)" }}>
                        {task.cls} · {task.subject}
                      </p>
                      <p className="text-base font-semibold mt-0.5 text-white leading-snug">
                        {remaining > 0
                          ? `${remaining} ta tekshirilmagan`
                          : "Barchasi tekshirildi!"}
                      </p>
                      <div className="flex items-center gap-2 mt-2 mb-1">
                        <div className="h-1.5 rounded-full flex-1" style={{ background: "rgba(255,255,255,0.25)" }}>
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

            <div className="flex items-center justify-center gap-1.5 py-2.5">
              {todayTasks.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goToTaskSlide(i)}
                  className="rounded-full transition-all duration-300"
                  style={{
                    width: taskSlide === i ? 18 : 5,
                    height: 5,
                    background: taskSlide === i ? "#fff" : "rgba(255,255,255,0.35)",
                  }}
                />
              ))}
            </div>
          </div>
        </div>

      </>)}

      {/* Tab Navigator + Content */}
      <div className="px-4 md:px-6 pt-4 md:pt-5 pb-4 flex-1 overflow-hidden flex flex-col">

          {/* Tab bar — jildlar mode: 2 sub-tabs, normal mode: 3 tabs */}
          <div className="flex items-center justify-between mb-4 shrink-0">
            {isJildlarMode ? (
              <div
                className="flex items-center p-1 gap-0.5"
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-sm)",
                  boxShadow: "var(--shadow-clay-sm)",
                }}
              >
                {([
                  { key: "folders" as const, label: "Jildlar", icon: Folder },
                  { key: "tahlillar" as const, label: "Tahlillar", icon: FlaskConical },
                ]).map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setJildlarSubTab(key)}
                    className="flex items-center gap-1 px-3 py-2 text-[13px] font-semibold transition-all"
                    style={{
                      background: jildlarSubTab === key ? "var(--accent-light)" : "transparent",
                      color: jildlarSubTab === key ? "var(--accent)" : "var(--text-muted)",
                      borderRadius: 10,
                      boxShadow: jildlarSubTab === key ? "var(--shadow-clay-sm)" : "none",
                    }}
                  >
                    <Icon size={14} />
                    {label}
                  </button>
                ))}
              </div>
            ) : (
              <div
                className="flex items-center p-1 gap-0.5"
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-sm)",
                  boxShadow: "var(--shadow-clay-sm)",
                }}
              >
                {([
                  { key: "papkalarim" as const, label: "Jildlar", icon: Folder },
                  { key: "sinflarim" as const, label: "Sinflar", icon: BookOpen },
                  { key: "oquvchilar" as const, label: "O'quvchilar", icon: Users },
                ]).map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key)}
                    className="flex items-center gap-1 px-3 py-2 text-[13px] font-semibold transition-all"
                    style={{
                      background: activeTab === key ? "var(--accent-light)" : "transparent",
                      color: activeTab === key ? "var(--accent)" : "var(--text-muted)",
                      borderRadius: 10,
                      boxShadow: activeTab === key ? "var(--shadow-clay-sm)" : "none",
                    }}
                  >
                    <Icon size={14} />
                    {label}
                  </button>
                ))}
              </div>
            )}
            <ViewToggle view={viewMode} onChange={setViewMode} />
          </div>

          {/* ═══ Papkalarim / Jildlar-Folders Tab ═══ */}
          {((isJildlarMode && jildlarSubTab === "folders") || (!isJildlarMode && activeTab === "papkalarim")) && (
            <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
              <div className="flex items-center gap-2 mb-3 shrink-0">
                <div className="clay-input flex items-center gap-2 px-3 py-2 flex-1">
                  <Search size={14} style={{ color: "var(--text-muted)" }} />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Papka qidirish..."
                    className="bg-transparent outline-none text-sm flex-1"
                    style={{ color: "var(--text-primary)" }}
                  />
                </div>
                {renderSortBtn()}
              </div>
              <div className="flex-1 overflow-y-auto md:px-2">
              {viewMode === "grid" ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {/* Sinflar auto-folder — switches to Sinflar tab */}
                  <button
                    onClick={() => setActiveTab("sinflarim")}
                    className="flex flex-col items-center gap-2 p-4 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    style={{
                      background: "var(--bg-card)",
                      backdropFilter: "blur(8px)",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius-md)",
                      boxShadow: "var(--shadow-clay-sm)",
                    }}
                  >
                    <span className="text-3xl">🏫</span>
                    <span className="text-sm font-semibold text-center truncate w-full" style={{ color: "var(--text-primary)" }}>Sinflar</span>
                    <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>{classList.length} ta sinf</span>
                  </button>

                  {/* Custom folders */}
                  {sortedFolders.map((folder) => (
                    <div
                      key={folder.id}
                      className="relative flex flex-col items-center gap-2 p-4 transition-all hover:scale-[1.02] active:scale-[0.98] group"
                      style={{
                        background: "var(--bg-card)",
                        backdropFilter: "blur(8px)",
                        border: "1px solid var(--border)",
                        borderRadius: "var(--radius-md)",
                        boxShadow: "var(--shadow-clay-sm)",
                      }}
                    >
                      {/* ⋮ Context menu */}
                      <div className="absolute top-2 right-2" ref={menuOpenFolder === folder.id ? menuRef : undefined}>
                        <button
                          onClick={(e) => { e.stopPropagation(); setMenuOpenFolder(menuOpenFolder === folder.id ? null : folder.id); }}
                          className="w-7 h-7 flex items-center justify-center rounded-lg transition-all"
                          style={{ color: "var(--text-muted)", background: "var(--bg-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-clay-sm)" }}
                        >
                          <MoreVertical size={14} />
                        </button>
                        {menuOpenFolder === folder.id && (
                          <div
                            className="absolute right-0 top-9 z-50 animate-fade-in py-1"
                            style={{
                              background: "var(--bg-card-solid)",
                              border: "1px solid var(--border)",
                              borderRadius: "var(--radius-sm)",
                              boxShadow: "var(--shadow-clay)",
                              minWidth: 140,
                            }}
                          >
                            <button
                              onClick={() => { setEditingFolder(folder.id); setEditName(folder.name); setEditIcon(folder.icon ?? "📁"); setNameError(""); setMenuOpenFolder(null); }}
                              className="w-full text-left px-4 py-2.5 flex items-center gap-2.5 text-sm transition-all hover:bg-[var(--surface-hover)]"
                              style={{ color: "var(--text-primary)" }}
                            >
                              <Pencil size={13} /> Tahrirlash
                            </button>
                            <button
                              onClick={() => { handleDeleteFolder(folder.id); setMenuOpenFolder(null); }}
                              className="w-full text-left px-4 py-2.5 flex items-center gap-2.5 text-sm transition-all hover:bg-[var(--surface-hover)]"
                              style={{ color: "var(--error)" }}
                            >
                              <Trash2 size={13} /> O'chirish
                            </button>
                          </div>
                        )}
                      </div>

                      {editingFolder === folder.id ? (
                        <div className="flex flex-col items-center gap-2 w-full">
                          <IconPicker value={editIcon} onChange={(ic) => { setEditIcon(ic); handleUpdateFolderIcon(folder.id, ic); }} size={40} />
                          <input
                            autoFocus
                            value={editName}
                            onChange={(e) => { setEditName(e.target.value); setNameError(""); }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                if (localFolderNameExists(editName.trim(), folder.id)) { setNameError("Bu nom band!"); return; }
                                handleRenameFolder(folder.id, editName.trim(), editIcon); setEditingFolder(null); setNameError("");
                              }
                              if (e.key === "Escape") { setEditingFolder(null); setNameError(""); }
                            }}
                            onBlur={() => {
                              if (!localFolderNameExists(editName.trim(), folder.id)) {
                                handleRenameFolder(folder.id, editName.trim(), editIcon);
                              }
                              setEditingFolder(null); setNameError("");
                            }}
                            className="clay-input w-full px-2 py-1 text-sm text-center outline-none"
                            style={{ color: "var(--text-primary)" }}
                          />
                          {nameError && <p className="text-[11px] font-semibold" style={{ color: "var(--error)" }}>{nameError}</p>}
                        </div>
                      ) : (
                        <Link href={`/folder/${folder.id}`} className="flex flex-col items-center gap-2 w-full">
                          <span className="text-3xl">{folder.icon || "📁"}</span>
                          <span className="text-sm font-semibold text-center truncate w-full" style={{ color: "var(--text-primary)" }}>{folder.name}</span>
                          <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>{folder.submissionCount ?? 0} ta fayl</span>
                        </Link>
                      )}
                    </div>
                  ))}

                  {/* Yangi papka yaratish */}
                  {creatingFolder ? (
                    <div
                      className="flex flex-col items-center justify-center gap-2 p-4"
                      style={{
                        background: "var(--bg-card)",
                        border: "2px dashed var(--accent)",
                        borderRadius: "var(--radius-md)",
                        boxShadow: "var(--shadow-clay-sm)",
                      }}
                    >
                      <IconPicker value={newFolderIcon} onChange={setNewFolderIcon} size={40} />
                      <input
                        autoFocus
                        value={newFolderName}
                        onChange={(e) => { setNewFolderName(e.target.value); setNameError(""); }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && newFolderName.trim()) {
                            if (localFolderNameExists(newFolderName.trim())) { setNameError("Bu nom band!"); return; }
                            handleCreateFolder(newFolderName.trim(), newFolderIcon);
                            setCreatingFolder(false); setNewFolderName(""); setNewFolderIcon("📁"); setNameError("");
                          }
                          if (e.key === "Escape") { setCreatingFolder(false); setNewFolderName(""); setNewFolderIcon("📁"); setNameError(""); }
                        }}
                        placeholder="Papka nomi..."
                        className="clay-input w-full px-2 py-1 text-sm text-center outline-none"
                        style={{ color: "var(--text-primary)" }}
                      />
                      {nameError && <p className="text-[11px] font-semibold" style={{ color: "var(--error)" }}>{nameError}</p>}
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            if (!newFolderName.trim()) return;
                            if (localFolderNameExists(newFolderName.trim())) { setNameError("Bu nom band!"); return; }
                            handleCreateFolder(newFolderName.trim(), newFolderIcon);
                            setCreatingFolder(false); setNewFolderName(""); setNewFolderIcon("📁"); setNameError("");
                          }}
                          className="px-3 py-1 text-xs font-bold text-white"
                          style={{ background: "var(--cta)", borderRadius: 8 }}
                        >
                          OK
                        </button>
                        <button
                          onClick={() => { setCreatingFolder(false); setNewFolderName(""); setNewFolderIcon("📁"); setNameError(""); }}
                          className="px-3 py-1 text-xs font-bold"
                          style={{ color: "var(--text-muted)", background: "var(--bg-card)", borderRadius: 8, border: "1px solid var(--border)" }}
                        >
                          Bekor
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setCreatingFolder(true); setNewFolderIcon("📁"); setNameError(""); }}
                      className="flex flex-col items-center justify-center gap-2 p-4 transition-all hover:scale-[1.02] active:scale-[0.98]"
                      style={{
                        background: "transparent",
                        border: "2px dashed var(--border)",
                        borderRadius: "var(--radius-md)",
                      }}
                    >
                      <FolderPlus size={24} style={{ color: "var(--accent)" }} />
                      <span className="text-sm font-semibold" style={{ color: "var(--accent)" }}>Yangi papka</span>
                    </button>
                  )}
                </div>
              ) : (
                /* List view */
                <div className="flex flex-col gap-2">
                  {/* Sinflar auto-folder — switches to Sinflar tab */}
                  <button
                    onClick={() => setActiveTab("sinflarim")}
                    className="flex items-center gap-3 px-4 py-3 transition-all hover:scale-[1.01] text-left"
                    style={{
                      background: "var(--bg-card)",
                      backdropFilter: "blur(8px)",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius-sm)",
                      boxShadow: "var(--shadow-clay-sm)",
                    }}
                  >
                    <span className="text-xl">🏫</span>
                    <span className="text-sm font-semibold flex-1" style={{ color: "var(--text-primary)" }}>Sinflar</span>
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>{classList.length} ta sinf</span>
                  </button>

                  {/* Custom folders */}
                  {sortedFolders.map((folder) => (
                    <div
                      key={folder.id}
                      className="flex items-center gap-3 px-4 py-3 transition-all group"
                      style={{
                        background: "var(--bg-card)",
                        backdropFilter: "blur(8px)",
                        border: "1px solid var(--border)",
                        borderRadius: "var(--radius-sm)",
                        boxShadow: "var(--shadow-clay-sm)",
                      }}
                    >
                      {editingFolder === folder.id ? (
                        <>
                          <IconPicker value={editIcon} onChange={(ic) => { setEditIcon(ic); handleUpdateFolderIcon(folder.id, ic); }} size={32} />
                          <input
                            autoFocus
                            value={editName}
                            onChange={(e) => { setEditName(e.target.value); setNameError(""); }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                if (localFolderNameExists(editName.trim(), folder.id)) { setNameError("Bu nom band!"); return; }
                                handleRenameFolder(folder.id, editName.trim(), editIcon); setEditingFolder(null); setNameError("");
                              }
                              if (e.key === "Escape") { setEditingFolder(null); setNameError(""); }
                            }}
                            onBlur={() => {
                              if (!localFolderNameExists(editName.trim(), folder.id)) {
                                handleRenameFolder(folder.id, editName.trim(), editIcon);
                              }
                              setEditingFolder(null); setNameError("");
                            }}
                            className="clay-input flex-1 px-2 py-1 text-sm outline-none"
                            style={{ color: "var(--text-primary)" }}
                          />
                          {nameError && <span className="text-[11px] font-semibold shrink-0" style={{ color: "var(--error)" }}>{nameError}</span>}
                        </>
                      ) : (
                        <>
                        <span className="text-xl">{folder.icon || "📁"}</span>
                        <Link href={`/folder/${folder.id}`} className="flex-1 min-w-0">
                          <span className="text-sm font-semibold truncate block" style={{ color: "var(--text-primary)" }}>{folder.name}</span>
                        </Link>
                        </>
                      )}
                      <span className="text-xs shrink-0" style={{ color: "var(--text-muted)" }}>{folder.submissionCount ?? 0} ta fayl</span>
                      {/* ⋮ Actions */}
                      <div className="relative shrink-0" ref={menuOpenFolder === folder.id ? menuRef : undefined}>
                        <button
                          onClick={(e) => { e.stopPropagation(); setMenuOpenFolder(menuOpenFolder === folder.id ? null : folder.id); }}
                          className="w-8 h-8 flex items-center justify-center rounded-lg transition-all"
                          style={{ color: "var(--text-muted)" }}
                        >
                          <MoreVertical size={16} />
                        </button>
                        {menuOpenFolder === folder.id && (
                          <div
                            className="absolute right-0 top-9 z-50 animate-fade-in py-1"
                            style={{
                              background: "var(--bg-card-solid)",
                              border: "1px solid var(--border)",
                              borderRadius: "var(--radius-sm)",
                              boxShadow: "var(--shadow-clay)",
                              minWidth: 140,
                            }}
                          >
                            <button
                              onClick={() => { setEditingFolder(folder.id); setEditName(folder.name); setEditIcon(folder.icon ?? "📁"); setNameError(""); setMenuOpenFolder(null); }}
                              className="w-full text-left px-4 py-2.5 flex items-center gap-2.5 text-sm transition-all hover:bg-[var(--surface-hover)]"
                              style={{ color: "var(--text-primary)" }}
                            >
                              <Pencil size={13} /> Tahrirlash
                            </button>
                            <button
                              onClick={() => { handleDeleteFolder(folder.id); setMenuOpenFolder(null); }}
                              className="w-full text-left px-4 py-2.5 flex items-center gap-2.5 text-sm transition-all hover:bg-[var(--surface-hover)]"
                              style={{ color: "var(--error)" }}
                            >
                              <Trash2 size={13} /> O'chirish
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Yangi papka */}
                  {creatingFolder ? (
                    <div
                      className="flex items-center gap-3 px-4 py-3"
                      style={{
                        background: "var(--bg-card)",
                        border: "2px dashed var(--accent)",
                        borderRadius: "var(--radius-sm)",
                      }}
                    >
                      <IconPicker value={newFolderIcon} onChange={setNewFolderIcon} size={32} />
                      <input
                        autoFocus
                        value={newFolderName}
                        onChange={(e) => { setNewFolderName(e.target.value); setNameError(""); }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && newFolderName.trim()) {
                            if (localFolderNameExists(newFolderName.trim())) { setNameError("Bu nom band!"); return; }
                            handleCreateFolder(newFolderName.trim(), newFolderIcon);
                            setCreatingFolder(false); setNewFolderName(""); setNewFolderIcon("📁"); setNameError("");
                          }
                          if (e.key === "Escape") { setCreatingFolder(false); setNewFolderName(""); setNewFolderIcon("📁"); setNameError(""); }
                        }}
                        placeholder="Papka nomi..."
                        className="clay-input flex-1 px-2 py-1 text-sm outline-none"
                        style={{ color: "var(--text-primary)" }}
                      />
                      {nameError && <span className="text-[11px] font-semibold shrink-0" style={{ color: "var(--error)" }}>{nameError}</span>}
                      <button
                        onClick={() => {
                          if (!newFolderName.trim()) return;
                          if (localFolderNameExists(newFolderName.trim())) { setNameError("Bu nom band!"); return; }
                          handleCreateFolder(newFolderName.trim(), newFolderIcon);
                          setCreatingFolder(false); setNewFolderName(""); setNewFolderIcon("📁"); setNameError("");
                        }}
                        className="px-3 py-1.5 text-xs font-bold text-white"
                        style={{ background: "var(--cta)", borderRadius: 8 }}
                      >
                        OK
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setCreatingFolder(true); setNewFolderIcon("📁"); setNameError(""); }}
                      className="flex items-center gap-3 px-4 py-3 transition-all"
                      style={{
                        border: "2px dashed var(--border)",
                        borderRadius: "var(--radius-sm)",
                      }}
                    >
                      <FolderPlus size={18} style={{ color: "var(--accent)" }} />
                      <span className="text-sm font-semibold" style={{ color: "var(--accent)" }}>Yangi papka</span>
                    </button>
                  )}
                </div>
              )}
              </div>
            </div>
          )}

          {/* ═══ Tahlillar Tab (jildlar mode only) ═══ */}
          {isJildlarMode && jildlarSubTab === "tahlillar" && (
            <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
              <div className="flex items-center gap-2 mb-3 shrink-0">
                <div className="clay-input flex items-center gap-2 px-3 py-2 flex-1">
                  <Search size={14} style={{ color: "var(--text-muted)" }} />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Tahlil qidirish..."
                    className="bg-transparent outline-none text-sm flex-1"
                    style={{ color: "var(--text-primary)" }}
                  />
                </div>
                {renderSortBtn()}
              </div>
              <div className="flex-1 overflow-y-auto md:px-2">
                {viewMode === "grid" ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {sortedFiles.map((file) => {
                      const gradeNum = file.score ?? 0;
                      const pct = gradeNum / 5;
                      const gColor = pct >= 0.8 ? "var(--success)" : pct >= 0.6 ? "var(--warning)" : "var(--error)";
                      return (
                        <div
                          key={file.id}
                          className="relative flex flex-col gap-2.5 p-4 transition-all hover:scale-[1.02] active:scale-[0.98]"
                          style={{ background: "var(--bg-card)", backdropFilter: "blur(8px)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-clay-sm)" }}
                        >
                          {/* ⋮ menu */}
                          <div className="absolute top-2 right-2" ref={menuOpenFile === file.id ? fileMenuRef : undefined}>
                            <button onClick={(e) => { e.stopPropagation(); setMenuOpenFile(menuOpenFile === file.id ? null : file.id); }}
                              className="w-7 h-7 flex items-center justify-center rounded-lg transition-all"
                              style={{ color: "var(--text-muted)", background: "var(--bg-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-clay-sm)" }}>
                              <MoreVertical size={14} />
                            </button>
                            {menuOpenFile === file.id && (
                              <div className="absolute right-0 top-9 z-50 animate-fade-in py-1"
                                style={{ background: "var(--bg-card-solid, var(--bg-card))", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", boxShadow: "var(--shadow-clay)", minWidth: 140 }}>
                                <Link href={`/submission/${file.id}`} onClick={() => setMenuOpenFile(null)} className="w-full text-left px-4 py-2.5 flex items-center gap-2.5 text-sm transition-all hover:bg-[var(--surface-hover)]" style={{ color: "var(--text-primary)" }}>
                                    <Eye size={13} /> Ko&apos;rish
                                  </Link>
                                <button onClick={() => { handleDeleteFile(file.id); setMenuOpenFile(null); }}
                                  className="w-full text-left px-4 py-2.5 flex items-center gap-2.5 text-sm transition-all hover:bg-[var(--surface-hover)]" style={{ color: "var(--error)" }}>
                                  <Trash2 size={13} /> O&apos;chirish
                                </button>
                              </div>
                            )}
                          </div>
                          <Link href={`/submission/${file.id}`} className="flex flex-col gap-2.5">
                            <div className="flex items-center gap-2">
                              <div className="w-9 h-9 flex items-center justify-center shrink-0" style={{ background: `${gColor}15`, borderRadius: "var(--radius-sm)" }}>
                                <FileText size={16} style={{ color: gColor }} />
                              </div>
                              <span className="text-[11px] font-bold px-2 py-0.5" style={{ color: gColor, background: `${gColor}12`, borderRadius: 6 }}>{file.grade ?? "—"}</span>
                            </div>
                            <p className="text-sm font-bold truncate" style={{ color: "var(--text-primary)" }}>{file.studentName ?? "Nomalum"}</p>
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-medium" style={{ color: "var(--accent)" }}>{file.subject}</span>
                              <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>{file.createdAt?.slice(0, 10)}</span>
                            </div>
                            <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>{file.folderId ? (folderList.find(f => f.id === file.folderId)?.name ?? "—") : "—"}</span>
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {sortedFiles.map((file) => {
                      const gradeNum = file.score ?? 0;
                      const pct = gradeNum / 5;
                      const gColor = pct >= 0.8 ? "var(--success)" : pct >= 0.6 ? "var(--warning)" : "var(--error)";
                      return (
                        <div
                          key={file.id}
                          className="flex items-center gap-3 px-4 py-3 transition-all"
                          style={{ background: "var(--bg-card)", backdropFilter: "blur(8px)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", boxShadow: "var(--shadow-clay-sm)" }}
                        >
                          <Link href={`/submission/${file.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-10 h-10 flex items-center justify-center shrink-0" style={{ background: `${gColor}15`, borderRadius: "var(--radius-sm)" }}>
                              <FileText size={18} style={{ color: gColor }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold truncate" style={{ color: "var(--text-primary)" }}>{file.studentName ?? "Nomalum"}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[11px]" style={{ color: "var(--accent)" }}>{file.subject}</span>
                                <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>{file.folderId ? (folderList.find(f => f.id === file.folderId)?.name ?? "—") : "—"}</span>
                              </div>
                            </div>
                          </Link>
                          <div className="flex flex-col items-end gap-1 shrink-0 mr-1">
                            <span className="text-xs font-bold px-2 py-0.5" style={{ color: gColor, background: `${gColor}12`, borderRadius: 6 }}>{file.grade ?? "—"}</span>
                            <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>{file.createdAt?.slice(0, 10)}</span>
                          </div>
                          {/* ⋮ menu */}
                          <div className="relative shrink-0" ref={menuOpenFile === file.id ? fileMenuRef : undefined}>
                            <button onClick={(e) => { e.stopPropagation(); setMenuOpenFile(menuOpenFile === file.id ? null : file.id); }}
                              className="w-8 h-8 flex items-center justify-center rounded-lg transition-all" style={{ color: "var(--text-muted)" }}>
                              <MoreVertical size={16} />
                            </button>
                            {menuOpenFile === file.id && (
                              <div className="absolute right-0 top-9 z-50 animate-fade-in py-1"
                                style={{ background: "var(--bg-card-solid, var(--bg-card))", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", boxShadow: "var(--shadow-clay)", minWidth: 140 }}>
                                <Link href={`/submission/${file.id}`} onClick={() => setMenuOpenFile(null)} className="w-full text-left px-4 py-2.5 flex items-center gap-2.5 text-sm transition-all hover:bg-[var(--surface-hover)]" style={{ color: "var(--text-primary)" }}>
                                    <Eye size={13} /> Ko&apos;rish
                                  </Link>
                                <button onClick={() => { handleDeleteFile(file.id); setMenuOpenFile(null); }}
                                  className="w-full text-left px-4 py-2.5 flex items-center gap-2.5 text-sm transition-all hover:bg-[var(--surface-hover)]" style={{ color: "var(--error)" }}>
                                  <Trash2 size={13} /> O&apos;chirish
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                {sortedFiles.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <FlaskConical size={40} style={{ color: "var(--text-muted)", opacity: 0.4 }} />
                    <p className="text-sm font-semibold" style={{ color: "var(--text-muted)" }}>Tahlillar topilmadi</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═══ Sinflarim Tab — grid/list cards with context menu ═══ */}
          {!isJildlarMode && activeTab === "sinflarim" && (
            <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
              <div className="flex items-center gap-2 mb-3 shrink-0">
                <div className="clay-input flex items-center gap-2 px-3 py-2 flex-1">
                  <Search size={14} style={{ color: "var(--text-muted)" }} />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Sinf qidirish..."
                    className="bg-transparent outline-none text-sm flex-1"
                    style={{ color: "var(--text-primary)" }}
                  />
                </div>
                <button
                  onClick={() => { setCreatingClass(true); setNewClassName(""); setNameError(""); }}
                  className="w-9 h-9 flex items-center justify-center shrink-0 transition-all hover:scale-105"
                  style={{ background: "var(--cta)", borderRadius: "var(--radius-sm)", color: "#fff", boxShadow: "var(--shadow-clay-sm)" }}
                  title="Yangi sinf"
                >
                  <Plus size={16} />
                </button>
                {renderSortBtn()}
              </div>

              {/* Yangi sinf yaratish */}
              {creatingClass && (
                <div className="mb-3 p-3 flex items-center gap-2 animate-fade-in"
                  style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", boxShadow: "var(--shadow-clay-sm)" }}
                >
                  <span className="text-xl">🏫</span>
                  <input
                    autoFocus
                    value={newClassName}
                    onChange={(e) => { setNewClassName(e.target.value); setNameError(""); }}
                    onKeyDown={async (e) => {
                      if (e.key === "Enter" && newClassName.trim()) {
                        const ok = await handleCreateClass(newClassName.trim());
                        if (!ok) { setNameError("Bu nom band!"); return; }
                        setCreatingClass(false);
                      }
                      if (e.key === "Escape") setCreatingClass(false);
                    }}
                    placeholder="Sinf nomi..."
                    className="clay-input flex-1 px-3 py-2 text-sm outline-none"
                    style={{ color: "var(--text-primary)" }}
                  />
                  <button
                    onClick={async () => {
                      if (!newClassName.trim()) return;
                      const ok = await handleCreateClass(newClassName.trim());
                      if (!ok) { setNameError("Bu nom band!"); return; }
                      setCreatingClass(false);
                    }}
                    className="px-3 py-2 text-xs font-bold text-white"
                    style={{ background: "var(--cta)", borderRadius: 8, boxShadow: "var(--shadow-clay-sm)" }}
                  >
                    Yaratish
                  </button>
                  <button onClick={() => setCreatingClass(false)} style={{ color: "var(--text-muted)" }}>
                    <X size={16} />
                  </button>
                  {nameError && <p className="text-[11px] font-semibold" style={{ color: "var(--error)" }}>{nameError}</p>}
                </div>
              )}
              <div className="flex-1 overflow-y-auto md:px-2">
              {viewMode === "grid" ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {sortedClasses.map((cls) => (
                    <div
                      key={cls.id}
                      className="relative flex flex-col items-center gap-2.5 p-5 transition-all hover:scale-[1.02] active:scale-[0.98]"
                      style={{
                        background: "var(--bg-card)",
                        backdropFilter: "blur(4px)",
                        border: "1px solid var(--border)",
                        borderRadius: "var(--radius-md)",
                        boxShadow: "var(--shadow-clay-sm)",
                        zIndex: menuOpenClass === cls.id ? 40 : 1,
                        overflow: "visible",
                      }}
                    >
                      {/* ⋮ Context menu */}
                      <div className="absolute top-2 right-2" ref={menuOpenClass === cls.id ? classMenuRef : undefined}>
                        <button
                          onClick={(e) => { e.stopPropagation(); setMenuOpenClass(menuOpenClass === cls.id ? null : cls.id); }}
                          className="w-7 h-7 flex items-center justify-center rounded-lg transition-all"
                          style={{ color: "var(--text-muted)", background: "var(--bg-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-clay-sm)" }}
                        >
                          <MoreVertical size={14} />
                        </button>
                        {menuOpenClass === cls.id && (
                          <div
                            className="absolute right-0 top-9 z-50 animate-fade-in py-1"
                            style={{ background: "var(--bg-card-solid, var(--bg-card))", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", boxShadow: "var(--shadow-clay)", minWidth: 150, backdropFilter: "blur(16px)" }}
                          >
                            <Link href={`/class/${cls.id}`} onClick={() => setMenuOpenClass(null)} className="w-full text-left px-4 py-2.5 flex items-center gap-2.5 text-sm transition-all hover:bg-[var(--surface-hover)]" style={{ color: "var(--text-primary)" }}>
                              <Eye size={13} /> Ko&apos;rish
                            </Link>
                            <button onClick={() => { setEditingClass(cls.id); setEditClassName(cls.name); setNameError(""); setMenuOpenClass(null); }} className="w-full text-left px-4 py-2.5 flex items-center gap-2.5 text-sm transition-all hover:bg-[var(--surface-hover)]" style={{ color: "var(--text-primary)" }}>
                              <Pencil size={13} /> Tahrirlash
                            </button>
                            <Link href={`/class/${cls.id}`} onClick={() => setMenuOpenClass(null)} className="w-full text-left px-4 py-2.5 flex items-center gap-2.5 text-sm transition-all hover:bg-[var(--surface-hover)]" style={{ color: "var(--text-primary)" }}>
                              <ListOrdered size={13} /> Ro&apos;yxat
                            </Link>
                            <button onClick={() => { handleDeleteClass(cls.id); setMenuOpenClass(null); }} className="w-full text-left px-4 py-2.5 flex items-center gap-2.5 text-sm transition-all hover:bg-[var(--surface-hover)]" style={{ color: "var(--error)" }}>
                              <Trash2 size={13} /> O&apos;chirish
                            </button>
                          </div>
                        )}
                      </div>

                      {editingClass === cls.id ? (
                        <div className="flex flex-col items-center gap-2 w-full">
                          <div className="w-12 h-12 flex items-center justify-center text-xl" style={{ background: "var(--accent-light)", borderRadius: "var(--radius-sm)" }}>
                            {cls.icon || "🏫"}
                          </div>
                          <input
                            autoFocus
                            value={editClassName}
                            onChange={(e) => { setEditClassName(e.target.value); setNameError(""); }}
                            onKeyDown={async (e) => {
                              if (e.key === "Enter" && editClassName.trim()) {
                                const ok = await handleRenameClass(cls.id, editClassName.trim());
                                if (!ok) { setNameError("Bu nom band!"); return; }
                                setEditingClass(null); setNameError("");
                              }
                              if (e.key === "Escape") { setEditingClass(null); setNameError(""); }
                            }}
                            onBlur={async () => { if (editClassName.trim()) await handleRenameClass(cls.id, editClassName.trim()); setEditingClass(null); setNameError(""); }}
                            className="clay-input w-full px-2 py-1 text-sm text-center outline-none"
                            style={{ color: "var(--text-primary)" }}
                          />
                          {nameError && <p className="text-[11px] font-semibold" style={{ color: "var(--error)" }}>{nameError}</p>}
                        </div>
                      ) : (
                        <Link href={`/class/${cls.id}`} className="flex flex-col items-center gap-2.5 w-full">
                          <div
                            className="w-12 h-12 flex items-center justify-center text-xl"
                            style={{ background: "var(--accent-light)", borderRadius: "var(--radius-sm)", boxShadow: "inset -1px -1px 3px rgba(0,0,0,0.05), inset 1px 1px 3px rgba(255,255,255,0.5)" }}
                          >
                            {cls.icon || "🏫"}
                          </div>
                          <span className="text-sm font-bold text-center" style={{ color: "var(--text-primary)" }}>
                            {cls.name} sinfi
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-semibold px-2 py-0.5" style={{ color: "var(--accent)", background: "var(--accent-light)", borderRadius: 6 }}>
                              {cls.studentCount} o&apos;quvchi
                            </span>
                          </div>
                          <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>{cls.createdAt?.slice(0, 10)}</span>
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {sortedClasses.map((cls) => (
                    <div
                      key={cls.id}
                      className="flex items-center gap-3 px-4 py-3.5 transition-all"
                      style={{
                        background: "var(--bg-card)",
                        backdropFilter: "blur(8px)",
                        border: "1px solid var(--border)",
                        borderRadius: "var(--radius-sm)",
                        boxShadow: "var(--shadow-clay-sm)",
                      }}
                    >
                      {editingClass === cls.id ? (
                        <>
                          <div className="w-10 h-10 flex items-center justify-center text-lg shrink-0" style={{ background: "var(--accent-light)", borderRadius: "var(--radius-sm)" }}>
                            {cls.icon || "🏫"}
                          </div>
                          <input
                            autoFocus
                            value={editClassName}
                            onChange={(e) => { setEditClassName(e.target.value); setNameError(""); }}
                            onKeyDown={async (e) => {
                              if (e.key === "Enter" && editClassName.trim()) {
                                const ok = await handleRenameClass(cls.id, editClassName.trim());
                                if (!ok) { setNameError("Bu nom band!"); return; }
                                setEditingClass(null); setNameError("");
                              }
                              if (e.key === "Escape") { setEditingClass(null); setNameError(""); }
                            }}
                            onBlur={async () => { if (editClassName.trim()) await handleRenameClass(cls.id, editClassName.trim()); setEditingClass(null); setNameError(""); }}
                            className="clay-input flex-1 px-2 py-1 text-sm outline-none"
                            style={{ color: "var(--text-primary)" }}
                          />
                          {nameError && <span className="text-[11px] font-semibold shrink-0" style={{ color: "var(--error)" }}>{nameError}</span>}
                        </>
                      ) : (
                        <>
                          <Link href={`/class/${cls.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                            <div
                              className="w-10 h-10 flex items-center justify-center text-lg shrink-0"
                              style={{ background: "var(--accent-light)", borderRadius: "var(--radius-sm)", boxShadow: "inset -1px -1px 3px rgba(0,0,0,0.05), inset 1px 1px 3px rgba(255,255,255,0.5)" }}
                            >
                              {cls.icon || "🏫"}
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="text-sm font-bold block truncate" style={{ color: "var(--text-primary)" }}>{cls.name} sinfi</span>
                              <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>{cls.createdAt?.slice(0, 10)}</span>
                            </div>
                          </Link>
                          <span className="text-xs font-semibold px-2.5 py-1 shrink-0" style={{ color: "var(--accent)", background: "var(--accent-light)", borderRadius: 8 }}>
                            {cls.studentCount}
                          </span>
                        </>
                      )}
                      {/* ⋮ Actions */}
                      <div className="relative shrink-0" ref={menuOpenClass === cls.id ? classMenuRef : undefined}>
                        <button
                          onClick={(e) => { e.stopPropagation(); setMenuOpenClass(menuOpenClass === cls.id ? null : cls.id); }}
                          className="w-8 h-8 flex items-center justify-center rounded-lg transition-all"
                          style={{ color: "var(--text-muted)" }}
                        >
                          <MoreVertical size={16} />
                        </button>
                        {menuOpenClass === cls.id && (
                          <div
                            className="absolute right-0 top-9 z-50 animate-fade-in py-1"
                            style={{ background: "var(--bg-card-solid, var(--bg-card))", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", boxShadow: "var(--shadow-clay)", minWidth: 150 }}
                          >
                            <Link href={`/class/${cls.id}`} onClick={() => setMenuOpenClass(null)} className="w-full text-left px-4 py-2.5 flex items-center gap-2.5 text-sm transition-all hover:bg-[var(--surface-hover)]" style={{ color: "var(--text-primary)" }}>
                              <Eye size={13} /> Ko&apos;rish
                            </Link>
                            <button onClick={() => { setEditingClass(cls.id); setEditClassName(cls.name); setNameError(""); setMenuOpenClass(null); }} className="w-full text-left px-4 py-2.5 flex items-center gap-2.5 text-sm transition-all hover:bg-[var(--surface-hover)]" style={{ color: "var(--text-primary)" }}>
                              <Pencil size={13} /> Tahrirlash
                            </button>
                            <Link href={`/class/${cls.id}`} onClick={() => setMenuOpenClass(null)} className="w-full text-left px-4 py-2.5 flex items-center gap-2.5 text-sm transition-all hover:bg-[var(--surface-hover)]" style={{ color: "var(--text-primary)" }}>
                              <ListOrdered size={13} /> Ro&apos;yxat
                            </Link>
                            <button onClick={() => { handleDeleteClass(cls.id); setMenuOpenClass(null); }} className="w-full text-left px-4 py-2.5 flex items-center gap-2.5 text-sm transition-all hover:bg-[var(--surface-hover)]" style={{ color: "var(--error)" }}>
                              <Trash2 size={13} /> O&apos;chirish
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              </div>
            </div>
          )}

          {/* ═══ O'quvchilar Tab ═══ */}
          {!isJildlarMode && activeTab === "oquvchilar" && (
            <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
              {/* Search + class filter dropdown */}
              <div className="flex items-center gap-2 mb-3 shrink-0">
                <div className="clay-input flex items-center gap-2 px-3 py-2 flex-1">
                  <Search size={14} style={{ color: "var(--text-muted)" }} />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="O'quvchi qidirish..."
                    className="bg-transparent outline-none text-sm flex-1"
                    style={{ color: "var(--text-primary)" }}
                  />
                </div>
                {/* Class filter dropdown */}
                <div className="relative" ref={filterRef}>
                  <button
                    onClick={() => setShowClassFilter(!showClassFilter)}
                    className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold transition-all"
                    style={{
                      background: "var(--bg-card)",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius-sm)",
                      boxShadow: "var(--shadow-clay-sm)",
                      color: selectedClass ? "var(--accent)" : "var(--text-muted)",
                    }}
                  >
                    <BookOpen size={14} />
                    <span className="hidden sm:inline">{selectedClass ? classList.find((c) => c.id === selectedClass)?.name : "Hammasi"}</span>
                    <ChevronDown size={12} />
                  </button>
                  {showClassFilter && (
                    <div
                      className="absolute right-0 top-10 z-50 animate-fade-in py-1"
                      style={{
                        background: "var(--bg-card-solid, var(--bg-card))",
                        border: "1px solid var(--border)",
                        borderRadius: "var(--radius-sm)",
                        boxShadow: "var(--shadow-clay)",
                        minWidth: 150,
                      }}
                    >
                      <button
                        onClick={() => { setSelectedClass(null); setShowClassFilter(false); }}
                        className="w-full text-left px-4 py-2.5 text-sm transition-all hover:bg-[var(--surface-hover)]"
                        style={{
                          color: selectedClass === null ? "var(--accent)" : "var(--text-primary)",
                          fontWeight: selectedClass === null ? 700 : 500,
                        }}
                      >
                        {selectedClass === null && "✓ "}Hammasi
                      </button>
                      {classList.map((cls) => (
                        <button
                          key={cls.id}
                          onClick={() => { setSelectedClass(cls.id); setShowClassFilter(false); }}
                          className="w-full text-left px-4 py-2.5 text-sm transition-all hover:bg-[var(--surface-hover)]"
                          style={{
                            color: selectedClass === cls.id ? "var(--accent)" : "var(--text-primary)",
                            fontWeight: selectedClass === cls.id ? 700 : 500,
                          }}
                        >
                          {selectedClass === cls.id && "✓ "}{cls.name} sinfi
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {renderSortBtn()}
              </div>

              {/* Student grid/list */}
              <div className="flex-1 overflow-y-auto md:px-2">
                {viewMode === "grid" ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {sortedStudents.map((student, si) => {
                      const color = avatarColors[si % avatarColors.length];
                      const initials = student.name.split(" ").map((n) => n[0]).join("").slice(0, 2);
                      const hasTg = !!student.telegramId;

                      return (
                        <div
                          key={student.id}
                          className="flex flex-col items-center gap-2 p-4 transition-all hover:scale-[1.02] active:scale-[0.98]"
                          style={{
                            background: "var(--bg-card)",
                            backdropFilter: "blur(8px)",
                            border: "1px solid var(--border)",
                            borderRadius: "var(--radius-md)",
                            boxShadow: "var(--shadow-clay-sm)",
                          }}
                        >
                          <Link href={`/student/${student.id}`} className="flex flex-col items-center gap-2 w-full">
                            <div className="relative">
                              <div
                                className="w-14 h-14 rounded-full flex items-center justify-center text-white text-base font-bold"
                                style={{
                                  background: color,
                                  boxShadow: "4px 4px 10px rgba(0,0,0,0.12), inset -2px -2px 4px rgba(0,0,0,0.1), inset 2px 2px 4px rgba(255,255,255,0.25)",
                                }}
                              >
                                {initials}
                              </div>
                              {/* Telegram status */}
                              <div
                                className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center"
                                style={{
                                  background: hasTg ? "#29B6F6" : "var(--bg-card)",
                                  border: `2px solid ${hasTg ? "#29B6F6" : "var(--border)"}`,
                                  boxShadow: "var(--shadow-clay-sm)",
                                }}
                                title={hasTg ? (student.telegramId ?? "") : "Telegram ulanmagan"}
                              >
                                <Send size={9} style={{ color: hasTg ? "#fff" : "var(--text-muted)" }} />
                              </div>
                            </div>
                            <p className="text-sm font-bold text-center truncate w-full" style={{ color: "var(--text-primary)" }}>{student.name}</p>
                            <div className="flex items-center gap-2">
                              <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>{student.classCount} ta sinf</span>
                            </div>
                          </Link>
                          <div className="flex items-center gap-1.5">
                            <button
                              className="w-8 h-8 flex items-center justify-center transition-all hover:scale-110"
                              title="Tekshirish"
                              style={{
                                background: "var(--cta-ghost)",
                                color: "var(--cta)",
                                borderRadius: 8,
                                boxShadow: "var(--shadow-clay-sm)",
                                border: "1px solid var(--border)",
                              }}
                            >
                              <Camera size={14} />
                            </button>
                            <Link
                              href={`/student/${student.id}`}
                              className="w-8 h-8 flex items-center justify-center transition-all hover:scale-110"
                              title="Ko'rish"
                              style={{
                                background: "var(--accent-light)",
                                color: "var(--accent)",
                                borderRadius: 8,
                                boxShadow: "var(--shadow-clay-sm)",
                                border: "1px solid var(--border)",
                              }}
                            >
                              <Eye size={14} />
                            </Link>
                            <button
                              onClick={() => setDeleteStudentId(student.id)}
                              className="w-8 h-8 flex items-center justify-center transition-all hover:scale-110"
                              title="O'chirish"
                              style={{
                                background: "var(--error-bg)",
                                color: "var(--error)",
                                borderRadius: 8,
                                boxShadow: "var(--shadow-clay-sm)",
                                border: "1px solid var(--border)",
                              }}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {sortedStudents.map((student, si) => {
                      const color = avatarColors[si % avatarColors.length];
                      const initials = student.name.split(" ").map((n) => n[0]).join("").slice(0, 2);
                      const hasTg = !!student.telegramId;

                      return (
                        <div
                          key={student.id}
                          className="flex items-center gap-3 px-4 py-3 transition-all"
                          style={{
                            background: "var(--bg-card)",
                            backdropFilter: "blur(8px)",
                            border: "1px solid var(--border)",
                            borderRadius: "var(--radius-sm)",
                            boxShadow: "var(--shadow-clay-sm)",
                          }}
                        >
                          <Link href={`/student/${student.id}`} className="shrink-0">
                            <div className="relative">
                              <div
                                className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold"
                                style={{
                                  background: color,
                                  boxShadow: "3px 3px 8px rgba(0,0,0,0.12), inset -2px -2px 4px rgba(0,0,0,0.1), inset 2px 2px 4px rgba(255,255,255,0.25)",
                                }}
                              >
                                {initials}
                              </div>
                              <div
                                className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center"
                                style={{
                                  background: hasTg ? "#29B6F6" : "var(--bg-card)",
                                  border: `2px solid ${hasTg ? "#29B6F6" : "var(--border)"}`,
                                }}
                                title={hasTg ? (student.telegramId ?? "") : "Telegram ulanmagan"}
                              >
                                <Send size={7} style={{ color: hasTg ? "#fff" : "var(--text-muted)" }} />
                              </div>
                            </div>
                          </Link>
                          <Link href={`/student/${student.id}`} className="flex-1 min-w-0">
                            <p className="text-[0.95rem] font-semibold truncate" style={{ color: "var(--text-primary)" }}>{student.name}</p>
                            <div className="flex items-center gap-3 mt-0.5">
                              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                                {student.classCount} ta sinf
                              </span>
                            </div>
                          </Link>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              className="w-9 h-9 flex items-center justify-center transition-all hover:scale-105"
                              title="Tekshirish"
                              style={{
                                background: "var(--cta-ghost)",
                                color: "var(--cta)",
                                borderRadius: "var(--radius-sm)",
                                boxShadow: "var(--shadow-clay-sm)",
                                border: "1px solid var(--border)",
                              }}
                            >
                              <Camera size={16} />
                            </button>
                            <Link
                              href={`/student/${student.id}`}
                              className="w-9 h-9 flex items-center justify-center transition-all hover:scale-105"
                              title="Ko'rish"
                              style={{
                                background: "var(--accent-light)",
                                color: "var(--accent)",
                                borderRadius: "var(--radius-sm)",
                                boxShadow: "var(--shadow-clay-sm)",
                                border: "1px solid var(--border)",
                              }}
                            >
                              <Eye size={16} />
                            </Link>
                            <button
                              onClick={() => setDeleteStudentId(student.id)}
                              className="w-9 h-9 flex items-center justify-center transition-all hover:scale-105"
                              title="O'chirish"
                              style={{
                                background: "var(--error-bg)",
                                color: "var(--error)",
                                borderRadius: "var(--radius-sm)",
                                boxShadow: "var(--shadow-clay-sm)",
                                border: "1px solid var(--border)",
                              }}
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
      </div>

      {/* ── O'quvchini o'chirish confirm ── */}
      {deleteStudentId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.25)", backdropFilter: "blur(6px)" }}
          onClick={(e) => e.target === e.currentTarget && setDeleteStudentId(null)}>
          <div className="w-full max-w-xs p-5 animate-fade-in"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)" }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-base font-semibold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>O&apos;quvchini o&apos;chirish</p>
              <button onClick={() => setDeleteStudentId(null)} className="w-8 h-8 flex items-center justify-center"
                style={{ borderRadius: "var(--radius-sm)", background: "var(--bg-primary)", border: "1px solid var(--border)", color: "var(--text-muted)" }}>
                <X size={15} />
              </button>
            </div>
            <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
              <b>{studentList.find(s => s.id === deleteStudentId)?.name}</b> barcha sinflardan ham o&apos;chiriladi.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteStudentId(null)} className="flex-1 py-2.5 text-sm"
                style={{ borderRadius: "var(--radius-sm)", background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
                Bekor
              </button>
              <button onClick={() => void handleDeleteStudent(deleteStudentId)} className="flex-1 py-2.5 text-sm font-medium"
                style={{ borderRadius: "var(--radius-sm)", background: "var(--error)", color: "#fff" }}>
                O&apos;chirish
              </button>
            </div>
          </div>
        </div>
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
              <button onClick={() => setPlanAlert(null)} className="flex-1 py-2.5 text-sm font-semibold"
                style={{ borderRadius: "var(--radius-sm)", background: "var(--cta)", color: "#fff", boxShadow: "var(--shadow-clay-sm)" }}
              >
                <a href="/plans">Tarifni yangilash</a>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={null}>
      <HomePageInner />
    </Suspense>
  );
}
