"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Users, CheckCircle2, TrendingUp, Pencil, Trash2, X, Plus, Circle, CalendarDays, Send } from "lucide-react";
import { loadClasses, saveClasses, loadStudents, loadTodos, saveTodos } from "@/lib/store";
import type { ClassItem, Student, Todo } from "@/lib/store";
import { useT } from "@/lib/i18n-context";

const avatarColors = ["#1a5c6b","#6366F1","#e8732a","#2a9d6a","#3B82F6","#8B5CF6","#EC4899","#d4a017"];

function badgeFontSize(text: string) {
  const len = text.length;
  return len === 1 ? 28 : len === 2 ? 20 : len === 3 ? 15 : 12;
}

export default function ClassProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { t } = useT();

  const [cls, setCls] = useState<ClassItem | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editIcon, setEditIcon] = useState("");
  const [editTgGroup, setEditTgGroup] = useState("");
  const [showDelete, setShowDelete] = useState(false);

  // Todos
  const [todos, setTodos] = useState<Todo[]>([]);
  const [showTodo, setShowTodo] = useState(false);
  const [todoText, setTodoText] = useState("");
  const [todoDate, setTodoDate] = useState(() => new Date().toISOString().split("T")[0]);

  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    const classes = loadClasses();
    const allStudents = loadStudents();
    const found = classes.find((c) => c.id === id) ?? classes[0];
    setCls(found);
    setStudents(allStudents.filter((s) => found.studentIds.includes(s.id)));
    setTodos(loadTodos().filter((v) => v.classId === id));
  }, [id]);

  function formatDate(dateStr: string) {
    const [y, m, d] = dateStr.split("-");
    const month = t(`studentStats.monthsShort.${parseInt(m) - 1}`);
    return `${parseInt(d)} ${month} ${y}`;
  }

  const saveEdit = () => {
    const name = editName.trim();
    if (!name || !cls) return;
    const telegramGroupId = editTgGroup.trim() || undefined;
    const classes = loadClasses();
    const updated = classes.map((c) =>
      c.id === id ? { ...c, name, icon: editIcon.trim() || undefined, telegramGroupId } : c
    );
    saveClasses(updated);
    setCls({ ...cls, name, icon: editIcon.trim() || undefined, telegramGroupId });
    setEditing(false);
  };

  const deleteClass = () => {
    const classes = loadClasses();
    saveClasses(classes.filter((c) => c.id !== id));
    router.push("/dashboard");
  };

  const addTodo = () => {
    const text = todoText.trim();
    if (!text || !todoDate) return;
    const newTodo: Todo = { id: Date.now().toString(), classId: id, text, date: todoDate, done: false };
    const all = loadTodos();
    saveTodos([...all, newTodo]);
    setTodos((prev) => [...prev, newTodo]);
    setTodoText("");
    setTodoDate(new Date().toISOString().split("T")[0]);
    setShowTodo(false);
  };

  const toggleTodo = (todoId: string) => {
    const all = loadTodos();
    const updated = all.map((v) => v.id === todoId ? { ...v, done: !v.done } : v);
    saveTodos(updated);
    setTodos(updated.filter((v) => v.classId === id));
  };

  const deleteTodo = (todoId: string) => {
    const all = loadTodos();
    const updated = all.filter((v) => v.id !== todoId);
    saveTodos(updated);
    setTodos(updated.filter((v) => v.classId === id));
  };

  if (!cls) return null;

  const badgeText = cls.icon?.trim() || cls.name.charAt(0);
  const totalSubmissions = students.reduce((sum, s) => sum + s.submissionCount, 0);
  const activityPct = Math.min(100, students.length > 0
    ? Math.round((totalSubmissions / (students.length * 5)) * 100)
    : 0);

  const sortedTodos = [...todos].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="flex flex-col h-screen" style={{ background: "var(--bg-primary)" }}>

      {/* Header */}
      <div className="px-5 pt-4 pb-8 flex items-center gap-3 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, var(--accent-dark) 0%, var(--accent) 60%, var(--accent-hover) 100%)", boxShadow: "6px 6px 14px rgba(53,120,136,0.25), inset -2px -2px 6px rgba(0,0,0,0.08), inset 2px 2px 6px rgba(255,255,255,0.12)", zIndex: 10 }}>
        <div style={{ position: "absolute", right: -20, top: -30, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.07)" }} />
        <div style={{ position: "absolute", right: 50, bottom: -20, width: 70, height: 70, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
        <Link href="/dashboard"
          className="w-8 h-8 rounded-xl flex items-center justify-center relative"
          style={{ background: "rgba(255,255,255,0.18)", color: "#fff" }}>
          <ArrowLeft size={16} />
        </Link>
        <h1 className="flex-1 text-base font-semibold text-white relative" style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>{t("classProfile.title")}</h1>
        <button
          onClick={() => { setEditing(true); setEditName(cls.name); setEditIcon(cls.icon ?? ""); setEditTgGroup(cls.telegramGroupId ?? ""); }}
          className="w-8 h-8 rounded-xl flex items-center justify-center relative"
          style={{ background: "rgba(255,255,255,0.18)", color: "#fff" }}>
          <Pencil size={15} />
        </button>
      </div>

      <div className="bg-grid flex-1 mt-2 overflow-hidden" style={{ borderRadius: "var(--radius-lg) var(--radius-lg) 0 0" }}>
        <div className="h-full overflow-y-auto px-4 pt-8 pb-8 max-w-lg mx-auto w-full flex flex-col gap-4">

          {/* Profile card */}
          <div className="p-5" style={{ background: "var(--bg-card)", backdropFilter: "blur(4px)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-clay)" }}>
            <div className="flex items-center gap-4">
              <div
                className="w-16 h-16 flex items-center justify-center font-bold shrink-0"
                style={{
                  borderRadius: "var(--radius-md)",
                  background: "var(--accent-light)",
                  color: "var(--accent)",
                  fontSize: badgeFontSize(badgeText),
                }}>
                {badgeText}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>
                  {cls.name} {t("home.classSuffix")}
                </h2>
                <p className="text-xs mt-0.5 flex items-center gap-1.5" style={{ color: "var(--text-muted)" }}>
                  {students.length} {t("home.studentsUnit")} · {cls.lastActivity}
                  <span style={{ color: "var(--border)" }}>·</span>
                  {cls.telegramGroupId ? (
                    <span className="flex items-center gap-1" style={{ color: "#229ED9" }}>
                      <Send size={11} style={{ color: "#229ED9" }} />
                      {cls.telegramGroupId}
                    </span>
                  ) : (
                    <span className="relative inline-flex items-center justify-center shrink-0" style={{ width: 14, height: 14 }}>
                      <Send size={11} style={{ color: "var(--text-muted)" }} />
                      <span style={{ position: "absolute", top: "50%", left: "-1px", right: "-1px", height: "2px", background: "var(--text-muted)", transform: "rotate(-35deg)", opacity: 0.45 }} />
                    </span>
                  )}
                </p>
                <div className="flex items-center gap-2 mt-2.5">
                  <div className="h-1.5 rounded-full flex-1" style={{ background: "var(--bg-primary)" }}>
                    <div className="h-1.5 rounded-full transition-all"
                      style={{ width: `${activityPct}%`, background: "var(--accent)" }} />
                  </div>
                  <span className="text-xs shrink-0" style={{ color: "var(--text-muted)" }}>
                    {activityPct}% {t("classProfile.activitySuffix")}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowDelete(true)}
                className="w-8 h-8 flex items-center justify-center shrink-0 self-start hover:opacity-80 transition-all"
                style={{ borderRadius: "var(--radius-sm)", background: "var(--error-bg)", color: "var(--error)" }}>
                <Trash2 size={15} />
              </button>
            </div>

            <Link href={`/class/${id}`} prefetch={false}
              className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-all hover:opacity-80"
              style={{ borderRadius: "var(--radius-sm)", background: "var(--accent)", color: "#fff" }}>
              <Users size={15} /> {t("classProfile.studentsList")}
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2.5">
            {[
              { label: t("home.students"), value: students.length, icon: Users, color: "var(--text-secondary)", bg: "var(--accent-light)" },
              { label: t("studentStats.checks"), value: totalSubmissions, icon: CheckCircle2, color: "var(--text-secondary)", bg: "var(--accent-light)" },
              { label: t("classProfile.activityLabel"), value: `${activityPct}%`, icon: TrendingUp, color: "var(--warning)", bg: "var(--warning-bg)" },
            ].map(({ label, value, icon: Icon, color, bg }, i) => (
              <div key={i} className="p-3 text-center" style={{ background: bg, borderRadius: "var(--radius-sm)" }}>
                <Icon size={16} className="mx-auto mb-1" style={{ color }} />
                <p className="text-base font-bold" style={{ color }}>{value}</p>
                <p className="text-xs mt-0.5" style={{ color: color + "99" }}>{label}</p>
              </div>
            ))}
          </div>

          {/* Todos */}
          <div className="overflow-hidden" style={{ background: "var(--bg-card)", backdropFilter: "blur(4px)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-clay)" }}>
            <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
              <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{t("classProfile.todos")}</span>
              <button
                onClick={() => setShowTodo(true)}
                className="w-7 h-7 flex items-center justify-center transition-all hover:opacity-80"
                style={{ borderRadius: "var(--radius-sm)", background: "var(--accent-light)", color: "var(--accent)" }}>
                <Plus size={14} />
              </button>
            </div>

            {sortedTodos.length === 0 ? (
              <div className="px-4 py-6 flex flex-col items-center gap-2">
                <CalendarDays size={24} style={{ color: "var(--border)" }} />
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>{t("classProfile.noTodos")}</p>
              </div>
            ) : (
              <div className="p-2 flex flex-col gap-1">
                {sortedTodos.map((todo) => (
                  <div key={todo.id}
                    className="flex items-center gap-2.5 px-3 py-2.5"
                    style={{ background: "var(--bg-primary)", opacity: todo.done ? 0.55 : 1, borderRadius: "var(--radius-sm)" }}>
                    <button onClick={() => toggleTodo(todo.id)} className="shrink-0 transition-all hover:scale-110">
                      {todo.done
                        ? <CheckCircle2 size={17} style={{ color: "var(--success)" }} />
                        : <Circle size={17} style={{ color: "var(--border)" }} />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm" style={{
                        color: "var(--text-primary)",
                        textDecoration: todo.done ? "line-through" : "none",
                      }}>{todo.text}</p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                        {formatDate(todo.date)}
                      </p>
                    </div>
                    <button onClick={() => deleteTodo(todo.id)}
                      className="shrink-0 hover:opacity-70 transition-all"
                      style={{ color: "var(--text-muted)" }}>
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Students preview */}
          {students.length > 0 && (
            <div className="overflow-hidden" style={{ background: "var(--bg-card)", backdropFilter: "blur(4px)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-clay)" }}>
              <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
                <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{t("home.students")}</span>
                <Link href={`/class/${id}`} prefetch={false} className="text-xs font-medium" style={{ color: "var(--accent)" }}>
                  {t("classProfile.seeAll")}
                </Link>
              </div>
              <div className="p-2 flex flex-col gap-1">
                {students.slice(0, 5).map((s) => {
                  const color = avatarColors[(parseInt(s.id) - 1) % avatarColors.length];
                  const initials = s.name.split(" ").map((n) => n[0]).join("").slice(0, 2);
                  return (
                    <Link key={s.id} href={`/student/${s.id}`} prefetch={false}
                      className="flex items-center gap-3 px-3 py-2.5 transition-all hover:opacity-80"
                      style={{ background: "var(--bg-primary)", borderRadius: "var(--radius-sm)" }}>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                        style={{ background: color }}>
                        {initials}
                      </div>
                      <span className="flex-1 text-sm" style={{ color: "var(--text-primary)" }}>{s.name}</span>
                      {s.telegramId ? (
                        <span className="text-xs flex items-center gap-1 shrink-0" style={{ color: "var(--text-muted)" }}>
                          <Send size={10} style={{ color: "#229ED9" }} />
                          {s.telegramId}
                        </span>
                      ) : (
                        <span className="relative inline-flex items-center justify-center shrink-0" style={{ width: 13, height: 13 }}>
                          <Send size={10} style={{ color: "var(--text-muted)" }} />
                          <span style={{ position: "absolute", top: "50%", left: "-1px", right: "-1px", height: "1.5px", background: "var(--text-muted)", transform: "rotate(-35deg)", opacity: 0.4 }} />
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.25)", backdropFilter: "blur(6px)" }}
          onClick={(e) => e.target === e.currentTarget && setEditing(false)}>
          <div className="w-full max-w-sm p-5 animate-fade-in"
            style={{ background: "var(--bg-card-solid, var(--bg-card))", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-clay)" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>{t("classProfile.editClass")}</h2>
              <button onClick={() => setEditing(false)}
                className="w-8 h-8 flex items-center justify-center"
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
                    fontSize: badgeFontSize(editIcon.trim() || editName.charAt(0) || "A"),
                  }}>
                  {editIcon.trim() || editName.charAt(0) || "A"}
                </div>
              </div>
              <div className="flex-1 flex flex-col gap-2">
                <div>
                  <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>{t("dashboard.iconLabel")}</p>
                  <input value={editIcon} onChange={(e) => setEditIcon(e.target.value.slice(0, 4))}
                    maxLength={4} placeholder={editName.charAt(0) || "9A"}
                    className="w-full px-3 py-2 text-sm outline-none font-bold text-center"
                    style={{ borderRadius: "var(--radius-sm)", background: "var(--accent-light)", border: "1px solid var(--accent)", color: "var(--accent)" }} />
                </div>
                <div>
                  <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>{t("class.className")}</p>
                  <input autoFocus value={editName} onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && saveEdit()}
                    placeholder={t("dashboard.classNameExample")}
                    className="w-full px-3 py-2 text-sm outline-none"
                    style={{ borderRadius: "var(--radius-sm)", background: "var(--bg-primary)", border: "1px solid var(--border)", color: "var(--text-primary)" }} />
                </div>
              </div>
            </div>

            <div className="mt-3">
              <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>{t("dashboard.telegramGroupIdLabel")}</p>
              <input value={editTgGroup} onChange={(e) => setEditTgGroup(e.target.value)}
                placeholder="-100xxxxxxxxxx yoki @groupname"
                className="w-full px-3 py-2 text-sm outline-none"
                style={{ borderRadius: "var(--radius-sm)", background: "var(--bg-primary)", border: "1px solid var(--border)", color: "var(--text-primary)" }} />
            </div>

            <div className="flex gap-2 mt-4">
              <button onClick={() => setEditing(false)} className="flex-1 py-2.5 text-sm"
                style={{ borderRadius: "var(--radius-sm)", background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
                {t("class.cancel")}
              </button>
              <button onClick={saveEdit} className="flex-1 py-2.5 text-sm font-medium"
                style={{ borderRadius: "var(--radius-sm)", background: "var(--cta)", color: "#fff" }}>
                {t("common.save")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Todo add modal */}
      {showTodo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.25)", backdropFilter: "blur(6px)" }}
          onClick={(e) => e.target === e.currentTarget && setShowTodo(false)}>
          <div className="w-full max-w-sm p-5 animate-fade-in"
            style={{ background: "var(--bg-card-solid, var(--bg-card))", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-clay)" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>{t("classProfile.newTodo")}</h2>
              <button onClick={() => setShowTodo(false)}
                className="w-8 h-8 flex items-center justify-center"
                style={{ borderRadius: "var(--radius-sm)", background: "var(--bg-primary)", border: "1px solid var(--border)", color: "var(--text-muted)" }}>
                <X size={15} />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <p className="text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>{t("classProfile.todoText")}</p>
                <input
                  autoFocus
                  value={todoText}
                  onChange={(e) => setTodoText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addTodo()}
                  placeholder={t("classProfile.todoPlaceholder")}
                  className="w-full px-3 py-2.5 text-sm outline-none"
                  style={{ borderRadius: "var(--radius-sm)", background: "var(--bg-primary)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
                />
              </div>
              <div>
                <p className="text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>{t("classProfile.date")}</p>
                <input
                  type="date"
                  value={todoDate}
                  onChange={(e) => setTodoDate(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm outline-none"
                  style={{ borderRadius: "var(--radius-sm)", background: "var(--bg-primary)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
                />
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button onClick={() => setShowTodo(false)} className="flex-1 py-2.5 text-sm"
                style={{ borderRadius: "var(--radius-sm)", background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
                {t("class.cancel")}
              </button>
              <button onClick={addTodo} className="flex-1 py-2.5 text-sm font-medium"
                style={{ borderRadius: "var(--radius-sm)", background: "var(--cta)", color: "#fff" }}>
                {t("schedule.add")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.25)", backdropFilter: "blur(6px)" }}
          onClick={(e) => e.target === e.currentTarget && setShowDelete(false)}>
          <div className="w-full max-w-xs p-5 animate-fade-in"
            style={{ background: "var(--bg-card-solid, var(--bg-card))", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-clay)" }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-base font-semibold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>{t("dashboard.deleteClassTitle")}</p>
              <button onClick={() => setShowDelete(false)}
                className="w-8 h-8 flex items-center justify-center"
                style={{ borderRadius: "var(--radius-sm)", background: "var(--bg-primary)", border: "1px solid var(--border)", color: "var(--text-muted)" }}>
                <X size={15} />
              </button>
            </div>
            <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}
              dangerouslySetInnerHTML={{ __html: t("dashboard.deleteClassMsg").replace("{name}", `<b>${cls.name}</b>`) }} />
            <div className="flex gap-2">
              <button onClick={() => setShowDelete(false)} className="flex-1 py-2.5 text-sm"
                style={{ borderRadius: "var(--radius-sm)", background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
                {t("class.cancel")}
              </button>
              <button onClick={deleteClass} className="flex-1 py-2.5 text-sm font-medium"
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
