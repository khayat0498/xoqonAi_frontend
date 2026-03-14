"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, X, Clock, CheckCircle2, Circle, ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { loadClasses, loadTodos, saveTodos } from "@/lib/store";
import type { ClassItem, Todo } from "@/lib/store";

type ScheduleItem = {
  id: string;
  time: string;
  classId: string;
  subject: string;
  note: string;
  done: boolean;
};

type DaySchedule = Record<string, ScheduleItem[]>;

const SUBJECTS = ["Matematika", "Fizika", "Kimyo", "Biologiya", "Ona tili", "Rus tili", "Ingliz tili", "Tarix", "Geografiya"];

function getWeekDays(baseDate: Date): Date[] {
  const days: Date[] = [];
  for (let i = -1; i <= 5; i++) {
    const d = new Date(baseDate);
    d.setDate(baseDate.getDate() + i);
    days.push(d);
  }
  return days;
}

function formatKey(date: Date) {
  return date.toISOString().split("T")[0];
}

function formatDay(date: Date) {
  return date.toLocaleDateString("uz-UZ", { weekday: "short" }).replace(".", "");
}

function formatDate(date: Date) {
  return date.getDate();
}

function isToday(date: Date) {
  const today = new Date();
  return formatKey(date) === formatKey(today);
}

const initialSchedule: DaySchedule = {
  [formatKey(new Date())]: [
    { id: "1", time: "09:00", classId: "1", subject: "Matematika", note: "2-bob mashqlari", done: true },
    { id: "2", time: "11:00", classId: "2", subject: "Fizika", note: "Laboratoriya ishi", done: false },
    { id: "3", time: "14:00", classId: "3", subject: "Matematika", note: "Nazorat ishi", done: false },
  ],
  [formatKey(new Date(Date.now() + 86400000))]: [
    { id: "4", time: "10:00", classId: "1", subject: "Kimyo", note: "", done: false },
    { id: "5", time: "13:30", classId: "4", subject: "Matematika", note: "Imtihonga tayyorgarlik", done: false },
  ],
};

export default function SchedulePage() {
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [weekBase, setWeekBase] = useState<Date>(today);
  const [schedule, setSchedule] = useState<DaySchedule>(initialSchedule);
  const [showModal, setShowModal] = useState(false);
  const [classList, setClassList] = useState<ClassItem[]>([]);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [form, setForm] = useState({ time: "09:00", classId: "", subject: "Matematika", note: "" });
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    const classes = loadClasses();
    setClassList(classes);
    setTodos(loadTodos());
    if (classes.length > 0) setForm((f) => ({ ...f, classId: classes[0].id }));
  }, []);

  const days = getWeekDays(weekBase);
  const selectedKey = formatKey(selectedDate);
  const dayItems = (schedule[selectedKey] ?? []).sort((a, b) => a.time.localeCompare(b.time));
  const dayTodos = todos.filter((t) => t.date === selectedKey);

  const toggleDone = (id: string) => {
    setSchedule((prev) => ({
      ...prev,
      [selectedKey]: (prev[selectedKey] ?? []).map((item) =>
        item.id === id ? { ...item, done: !item.done } : item
      ),
    }));
  };

  const toggleTodoDone = (id: string) => {
    const updated = todos.map((t) => t.id === id ? { ...t, done: !t.done } : t);
    saveTodos(updated);
    setTodos(updated);
  };

  const addItem = () => {
    if (!form.time || !form.classId) return;
    const newItem: ScheduleItem = { id: Date.now().toString(), ...form, done: false };
    setSchedule((prev) => ({
      ...prev,
      [selectedKey]: [...(prev[selectedKey] ?? []), newItem],
    }));
    setForm({ time: "09:00", classId: classList[0]?.id ?? "", subject: "Matematika", note: "" });
    setShowModal(false);
  };

  const deleteItem = (id: string) => {
    setSchedule((prev) => ({
      ...prev,
      [selectedKey]: (prev[selectedKey] ?? []).filter((item) => item.id !== id),
    }));
  };

  const doneCount = dayItems.filter((i) => i.done).length + dayTodos.filter((t) => t.done).length;
  const totalCount = dayItems.length + dayTodos.length;

  const hasDayContent = (key: string) =>
    (schedule[key] ?? []).length > 0 || todos.some((t) => t.date === key);

  return (
    <div className="flex flex-col h-screen" style={{ background: "var(--bg-primary)" }}>

      {/* Header */}
      <div className="px-5 pt-4 pb-8 relative overflow-hidden shrink-0"
        style={{ background: "linear-gradient(135deg, #111111 0%, #374151 100%)", boxShadow: "0 8px 32px rgba(0,0,0,0.32)", zIndex: 10 }}>
        {/* Dekorativ doiralar */}
        <div style={{ position: "absolute", right: -20, top: -30, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.07)" }} />
        <div style={{ position: "absolute", right: 50, bottom: -20, width: 70, height: 70, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />

        <div className="relative flex items-center justify-between mb-5">
          <div>
            <h1 className="text-base font-semibold text-white">Jadval</h1>
            <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.6)" }}>
              {selectedDate.toLocaleDateString("uz-UZ", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all hover:opacity-80 relative"
            style={{ background: "rgba(255,255,255,0.18)", color: "#fff" }}
          >
            <Plus size={15} /> Reja qo'shish
          </button>
        </div>

        {/* Week strip */}
        <div className="relative flex items-center gap-1">
          <button
            onClick={() => { const d = new Date(weekBase); d.setDate(d.getDate() - 7); setWeekBase(d); }}
            className="p-1 rounded-lg shrink-0"
            style={{ color: "rgba(255,255,255,0.5)" }}
          >
            <ChevronLeft size={16} />
          </button>

          <div className="flex gap-1 flex-1 overflow-x-auto">
            {days.map((day) => {
              const key = formatKey(day);
              const active = key === selectedKey;
              const hasItems = hasDayContent(key);
              return (
                <button
                  key={key}
                  onClick={() => setSelectedDate(day)}
                  className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all shrink-0 min-w-[44px]"
                  style={{ background: active ? "rgba(255,255,255,0.22)" : "transparent" }}
                >
                  <span className="text-[10px] font-medium"
                    style={{ color: active ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.45)" }}>
                    {isToday(day) ? "Bugun" : formatDay(day)}
                  </span>
                  <span className="text-sm font-bold"
                    style={{ color: active ? "#fff" : "rgba(255,255,255,0.8)" }}>
                    {formatDate(day)}
                  </span>
                  {hasItems && !active
                    ? <div className="w-1 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.5)" }} />
                    : <div className="w-1 h-1" />}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => { const d = new Date(weekBase); d.setDate(d.getDate() + 7); setWeekBase(d); }}
            className="p-1 rounded-lg shrink-0"
            style={{ color: "rgba(255,255,255,0.5)" }}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Content — bg-grid */}
      <div className="bg-grid flex-1 mt-2 rounded-t-2xl overflow-hidden flex flex-col">

        {/* Progress bar */}
        {totalCount > 0 && (
          <div className="px-5 py-3 border-b flex items-center gap-3 shrink-0"
            style={{ borderColor: "var(--border)", background: "var(--bg-card)" }}>
            <div className="flex-1 h-1.5 rounded-full" style={{ background: "var(--bg-primary)" }}>
              <div className="h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${(doneCount / totalCount) * 100}%`, background: "#10B981" }} />
            </div>
            <span className="text-xs font-medium shrink-0" style={{ color: "var(--text-muted)" }}>
              {doneCount}/{totalCount} bajarildi
            </span>
          </div>
        )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-24 md:pb-6">
        {totalCount === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <span className="text-4xl">📅</span>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Bu kun uchun reja yo'q</p>
            <button
              onClick={() => setShowModal(true)}
              className="text-sm px-4 py-2 rounded-xl font-medium"
              style={{ background: "var(--accent-light)", color: "var(--accent)" }}
            >
              Reja qo'shish
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2 max-w-lg mx-auto">

            {/* Vazifalar (todos) */}
            {dayTodos.length > 0 && (
              <div className="flex flex-col gap-1.5 mb-1">
                <p className="text-xs font-semibold px-1" style={{ color: "var(--text-muted)" }}>VAZIFALAR</p>
                {dayTodos.map((todo) => {
                  const cls = classList.find((c) => c.id === todo.classId);
                  return (
                    <div key={todo.id}
                      className="rounded-xl px-4 py-3 flex items-center gap-3 transition-all"
                      style={{
                        background: "var(--bg-card)",
                        border: "1px solid var(--border)",
                        opacity: todo.done ? 0.6 : 1,
                      }}>
                      <button onClick={() => toggleTodoDone(todo.id)}
                        className="shrink-0 transition-all hover:scale-110">
                        {todo.done
                          ? <CheckCircle2 size={18} style={{ color: "#10B981" }} />
                          : <Circle size={18} style={{ color: "var(--border)" }} />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          {cls && (
                            <span className="text-xs font-bold px-2 py-0.5 rounded-lg"
                              style={{ background: "var(--accent-light)", color: "var(--accent)" }}>
                              {cls.name}
                            </span>
                          )}
                          <span className="text-sm" style={{
                            color: "var(--text-primary)",
                            textDecoration: todo.done ? "line-through" : "none",
                          }}>
                            {todo.text}
                          </span>
                        </div>
                      </div>
                      <CalendarDays size={13} style={{ color: "var(--text-muted)" }} />
                    </div>
                  );
                })}
              </div>
            )}

            {/* Jadval items */}
            {dayItems.length > 0 && (
              <div className="flex flex-col gap-1.5">
                {dayTodos.length > 0 && (
                  <p className="text-xs font-semibold px-1" style={{ color: "var(--text-muted)" }}>DARSLAR</p>
                )}
                {dayItems.map((item) => {
                  const cls = classList.find((c) => c.id === item.classId);
                  return (
                    <div key={item.id}
                      className="rounded-xl px-4 py-3.5 flex items-start gap-3 transition-all"
                      style={{
                        background: "var(--bg-card)",
                        border: "1px solid var(--border)",
                        opacity: item.done ? 0.6 : 1,
                      }}>
                      <button onClick={() => toggleDone(item.id)} className="mt-0.5 shrink-0 transition-all hover:scale-110">
                        {item.done
                          ? <CheckCircle2 size={18} style={{ color: "#10B981" }} />
                          : <Circle size={18} style={{ color: "var(--border)" }} />}
                      </button>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold px-2 py-0.5 rounded-lg"
                            style={{ background: "var(--accent-light)", color: "var(--accent)" }}>
                            {cls?.name}
                          </span>
                          <span className="text-sm font-medium" style={{
                            color: "var(--text-primary)",
                            textDecoration: item.done ? "line-through" : "none",
                          }}>
                            {item.subject}
                          </span>
                        </div>
                        {item.note && (
                          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{item.note}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
                          <Clock size={12} />
                          <span className="text-xs font-medium">{item.time}</span>
                        </div>
                        <button onClick={() => deleteItem(item.id)}
                          className="hover:opacity-70 transition-all"
                          style={{ color: "var(--text-muted)" }}>
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>
        )}
      </div>
      </div>

      {/* Add modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: "#00000050" }}
          onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="w-full max-w-sm rounded-2xl p-5 animate-fade-in"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>Yangi reja</h2>
              <button onClick={() => setShowModal(false)} style={{ color: "var(--text-muted)" }}>
                <X size={18} />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {/* Time */}
              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--text-muted)" }}>VAQT</label>
                <input type="time" value={form.time}
                  onChange={(e) => setForm({ ...form, time: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: "var(--bg-primary)", border: "1px solid var(--border)", color: "var(--text-primary)" }} />
              </div>

              {/* Class */}
              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--text-muted)" }}>SINF</label>
                <div className="flex flex-wrap gap-2">
                  {classList.map((cls) => (
                    <button key={cls.id}
                      onClick={() => setForm({ ...form, classId: cls.id })}
                      className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                      style={{
                        background: form.classId === cls.id ? "var(--accent)" : "var(--bg-primary)",
                        color: form.classId === cls.id ? "#fff" : "var(--text-secondary)",
                        border: `1px solid ${form.classId === cls.id ? "transparent" : "var(--border)"}`,
                      }}>
                      {cls.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--text-muted)" }}>FAN</label>
                <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                  {SUBJECTS.map((s) => (
                    <button key={s}
                      onClick={() => setForm({ ...form, subject: s })}
                      className="px-3 py-1.5 rounded-lg text-sm transition-all"
                      style={{
                        background: form.subject === s ? "var(--accent-light)" : "var(--bg-primary)",
                        color: form.subject === s ? "var(--accent)" : "var(--text-secondary)",
                        border: `1px solid ${form.subject === s ? "var(--accent)" : "var(--border)"}`,
                      }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Note */}
              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--text-muted)" }}>IZOH (ixtiyoriy)</label>
                <input value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                  placeholder="Masalan: 3-bob mashqlari"
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: "var(--bg-primary)", border: "1px solid var(--border)", color: "var(--text-primary)" }} />
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl text-sm"
                style={{ background: "var(--bg-primary)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
                Bekor
              </button>
              <button onClick={addItem} className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all hover:opacity-80"
                style={{ background: "var(--accent)", color: "#fff" }}>
                Qo'shish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
