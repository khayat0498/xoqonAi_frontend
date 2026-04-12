"use client";

import { useState, useEffect } from "react";
import { Plus, X, Clock, CheckCircle2, Circle, ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { getToken } from "@/lib/auth";

const API = process.env.NEXT_PUBLIC_API_URL;
function authHeaders() {
  return { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` };
}

type TodoItem = {
  id: string;
  date: string;
  time: string;
  classId: string | null;
  subject: string;
  note: string;
  done: boolean;
};
type ClassItem = { id: string; name: string };

const SUBJECTS = ["Matematika", "Fizika", "Kimyo", "Biologiya", "Ona tili", "Rus tili", "Ingliz tili", "Tarix", "Geografiya"];

function formatKey(date: Date) {
  return date.toISOString().split("T")[0];
}
function formatDay(date: Date) {
  return date.toLocaleDateString("uz-UZ", { weekday: "short" }).replace(".", "");
}
function isToday(date: Date) {
  return formatKey(date) === formatKey(new Date());
}
function getWeekDays(base: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(base);
    d.setDate(base.getDate() - 1 + i);
    return d;
  });
}
function weekRange(days: Date[]): { from: string; to: string } {
  return { from: formatKey(days[0]), to: formatKey(days[days.length - 1]) };
}

export default function SchedulePage() {
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [weekBase, setWeekBase] = useState<Date>(today);
  const [items, setItems] = useState<TodoItem[]>([]);
  const [classList, setClassList] = useState<ClassItem[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ time: "09:00", classId: "", subject: "Matematika", note: "" });

  const days = getWeekDays(weekBase);
  const selectedKey = formatKey(selectedDate);

  // Haftalik todos ni yuklash
  useEffect(() => {
    const { from, to } = weekRange(days);
    fetch(`${API}/api/todos?from=${from}&to=${to}`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((data: TodoItem[]) => setItems(Array.isArray(data) ? data : []))
      .catch(console.error);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekBase]);

  // Darslar ro'yxatini yuklash
  useEffect(() => {
    fetch(`${API}/api/classes`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((data: ClassItem[]) => {
        if (Array.isArray(data)) {
          setClassList(data);
          if (data.length > 0) setForm((f) => ({ ...f, classId: data[0].id }));
        }
      })
      .catch(console.error);
  }, []);

  const dayItems = items
    .filter((t) => t.date === selectedKey)
    .sort((a, b) => a.time.localeCompare(b.time));

  const hasDayContent = (key: string) => items.some((t) => t.date === key);

  const doneCount = dayItems.filter((t) => t.done).length;

  const toggleDone = async (id: string) => {
    const item = items.find((t) => t.id === id);
    if (!item) return;
    const res = await fetch(`${API}/api/todos/${id}`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ done: !item.done }),
    });
    if (res.ok) {
      setItems((prev) => prev.map((t) => t.id === id ? { ...t, done: !t.done } : t));
    }
  };

  const addItem = async () => {
    if (!form.time || !form.subject) return;
    const res = await fetch(`${API}/api/todos`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        date: selectedKey,
        time: form.time,
        classId: form.classId || null,
        subject: form.subject,
        note: form.note,
      }),
    });
    if (res.ok) {
      const created: TodoItem = await res.json();
      setItems((prev) => [...prev, created]);
    }
    setForm({ time: "09:00", classId: classList[0]?.id ?? "", subject: "Matematika", note: "" });
    setShowModal(false);
  };

  const deleteItem = async (id: string) => {
    const res = await fetch(`${API}/api/todos/${id}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    if (res.ok) setItems((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="flex flex-col h-screen" style={{ background: "var(--bg-primary)" }}>

      {/* Header */}
      <div className="px-5 pt-4 pb-8 relative overflow-hidden shrink-0"
        style={{ background: "linear-gradient(135deg, var(--accent-dark) 0%, var(--accent) 100%)", boxShadow: "var(--shadow-card)", zIndex: 10 }}>
        <div style={{ position: "absolute", right: -20, top: -30, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.07)" }} />
        <div style={{ position: "absolute", right: 50, bottom: -20, width: 70, height: 70, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />

        <div className="relative flex items-center justify-between mb-5">
          <div>
            <h1 className="text-base font-semibold text-white" style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>Jadval</h1>
            <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.6)" }}>
              {selectedDate.toLocaleDateString("uz-UZ", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all hover:opacity-80 relative"
            style={{ background: "rgba(255,255,255,0.18)", color: "#fff" }}
          >
            <Plus size={15} /> Reja qo&apos;shish
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
                    {day.getDate()}
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

      {/* Content */}
      <div className="bg-grid flex-1 mt-2 overflow-hidden flex flex-col" style={{ borderRadius: "var(--radius-lg) var(--radius-lg) 0 0" }}>

        {/* Progress bar */}
        {dayItems.length > 0 && (
          <div className="px-5 py-3 border-b flex items-center gap-3 shrink-0"
            style={{ borderColor: "var(--border)", background: "var(--bg-card)" }}>
            <div className="flex-1 h-1.5 rounded-full" style={{ background: "var(--bg-primary)" }}>
              <div className="h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${(doneCount / dayItems.length) * 100}%`, background: "var(--success)" }} />
            </div>
            <span className="text-xs font-medium shrink-0" style={{ color: "var(--text-muted)" }}>
              {doneCount}/{dayItems.length} bajarildi
            </span>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-4 py-4 pb-24 md:pb-6">
          {dayItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3">
              <CalendarDays size={32} style={{ color: "var(--border)" }} />
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>Bu kun uchun reja yo&apos;q</p>
              <button
                onClick={() => setShowModal(true)}
                className="text-sm px-4 py-2 font-medium"
                style={{ background: "var(--accent-light)", color: "var(--accent)", borderRadius: "var(--radius-sm)" }}
              >
                Reja qo&apos;shish
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2 max-w-lg mx-auto">
              {dayItems.map((item) => {
                const cls = classList.find((c) => c.id === item.classId);
                return (
                  <div key={item.id}
                    className="px-4 py-3.5 flex items-start gap-3 transition-all"
                    style={{
                      background: "var(--bg-card)",
                      border: "1px solid var(--border-light)",
                      opacity: item.done ? 0.6 : 1,
                      borderRadius: "var(--radius-sm)",
                      boxShadow: "var(--shadow-sm)",
                    }}>
                    <button onClick={() => void toggleDone(item.id)} className="mt-0.5 shrink-0 transition-all hover:scale-110">
                      {item.done
                        ? <CheckCircle2 size={18} style={{ color: "var(--success)" }} />
                        : <Circle size={18} style={{ color: "var(--border)" }} />}
                    </button>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {cls && (
                          <span className="text-xs font-bold px-2 py-0.5"
                            style={{ background: "var(--accent-light)", color: "var(--accent)", borderRadius: "var(--radius-sm)" }}>
                            {cls.name}
                          </span>
                        )}
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
                      <button onClick={() => void deleteItem(item.id)}
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
      </div>

      {/* Add modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: "#00000050" }}
          onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="w-full max-w-sm p-5 animate-fade-in"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>Yangi reja</h2>
              <button onClick={() => setShowModal(false)} style={{ color: "var(--text-muted)" }}>
                <X size={18} />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--text-muted)" }}>VAQT</label>
                <input type="time" value={form.time}
                  onChange={(e) => setForm({ ...form, time: e.target.value })}
                  className="w-full px-4 py-2.5 text-sm outline-none"
                  style={{ background: "var(--bg-primary)", border: "1px solid var(--border)", color: "var(--text-primary)", borderRadius: "var(--radius-sm)" }} />
              </div>

              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--text-muted)" }}>SINF</label>
                <div className="flex flex-wrap gap-2">
                  {classList.map((cls) => (
                    <button key={cls.id}
                      onClick={() => setForm({ ...form, classId: cls.id })}
                      className="px-3 py-1.5 text-sm font-medium transition-all"
                      style={{
                        borderRadius: "var(--radius-sm)",
                        background: form.classId === cls.id ? "var(--accent)" : "var(--bg-primary)",
                        color: form.classId === cls.id ? "#fff" : "var(--text-secondary)",
                        border: `1px solid ${form.classId === cls.id ? "transparent" : "var(--border)"}`,
                      }}>
                      {cls.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--text-muted)" }}>FAN</label>
                <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                  {SUBJECTS.map((s) => (
                    <button key={s}
                      onClick={() => setForm({ ...form, subject: s })}
                      className="px-3 py-1.5 text-sm transition-all"
                      style={{
                        borderRadius: "var(--radius-sm)",
                        background: form.subject === s ? "var(--accent-light)" : "var(--bg-primary)",
                        color: form.subject === s ? "var(--accent)" : "var(--text-secondary)",
                        border: `1px solid ${form.subject === s ? "var(--accent)" : "var(--border)"}`,
                      }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--text-muted)" }}>IZOH (ixtiyoriy)</label>
                <input value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                  placeholder="Masalan: 3-bob mashqlari"
                  className="w-full px-4 py-2.5 text-sm outline-none"
                  style={{ background: "var(--bg-primary)", border: "1px solid var(--border)", color: "var(--text-primary)", borderRadius: "var(--radius-sm)" }} />
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 text-sm"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-secondary)", borderRadius: "var(--radius-sm)" }}>
                Bekor
              </button>
              <button onClick={() => void addItem()} className="flex-1 py-2.5 text-sm font-medium transition-all hover:opacity-80"
                style={{ background: "var(--cta)", color: "#fff", borderRadius: "var(--radius-sm)" }}>
                Qo&apos;shish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
