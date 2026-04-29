"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, TrendingUp, CheckCircle2, BarChart2, Users } from "lucide-react";
import { getToken } from "@/lib/auth";
import { useT } from "@/lib/i18n-context";

const API = process.env.NEXT_PUBLIC_API_URL;
function authHeaders() {
  return { Authorization: `Bearer ${getToken()}` };
}

type Stats = {
  total: number;
  avgScore: number;
  gradeDistribution: Record<string, number>;
  timeline: { label: string; count: number; avgScore: number }[];
  subjects: { name: string; count: number; avgScore: number }[];
  students: { name: string; count: number; avgScore: number }[];
};

export default function ClassStatsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { t } = useT();

  const [className, setClassName] = useState("");
  const [period, setPeriod] = useState<"month" | "year">("month");
  const [value, setValue] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);

  function getPeriodOptions(p: "month" | "year") {
    const now = new Date();
    if (p === "month") {
      const opts = [];
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const v = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        const label = `${t(`studentStats.monthsShort.${d.getMonth()}`)} ${d.getFullYear()}`;
        opts.push({ value: v, label });
      }
      return opts;
    }
    const year = now.getFullYear();
    return [year - 2, year - 1, year].map(y => ({ value: String(y), label: String(y) }));
  }

  useEffect(() => {
    fetch(`${API}/api/classes/${id}`, { headers: authHeaders() })
      .then(r => r.json()).then(d => setClassName(d.name ?? ""));
  }, [id]);

  const load = useCallback(async (p: "month" | "year", v: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/stats/class/${id}?period=${p}&value=${v}`, { headers: authHeaders() });
      if (res.ok) setStats(await res.json());
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(period, value); }, [load, period, value]);

  const switchPeriod = (p: "month" | "year") => {
    setPeriod(p);
    const now = new Date();
    if (p === "month") {
      setValue(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`);
    } else {
      setValue(String(now.getFullYear()));
    }
  };

  const periodOpts = getPeriodOptions(period);
  const maxTimeline = Math.max(...(stats?.timeline.map(v => v.count) ?? [1]), 1);
  const maxGrade = Math.max(...Object.values(stats?.gradeDistribution ?? {}), 1);
  const totalGrades = Object.values(stats?.gradeDistribution ?? {}).reduce((a, b) => a + b, 0);

  return (
    <div className="flex flex-col h-screen" style={{ background: "var(--bg-primary)" }}>
      {/* Header */}
      <div className="px-5 pt-4 pb-8 flex items-center gap-3 relative overflow-hidden shrink-0"
        style={{ background: "linear-gradient(135deg, var(--accent-dark) 0%, var(--accent) 60%, var(--accent-hover) 100%)", zIndex: 10 }}>
        <div style={{ position: "absolute", right: -20, top: -30, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.07)" }} />
        <button onClick={() => router.back()} className="w-8 h-8 rounded-xl flex items-center justify-center relative"
          style={{ background: "rgba(255,255,255,0.18)", color: "#fff" }}>
          <ArrowLeft size={16} />
        </button>
        <div className="flex-1 relative">
          <h1 className="text-base font-semibold text-white" style={{ fontFamily: "var(--font-display)" }}>{t("classProfile.statsTitle")}</h1>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.7)" }}>{className} {t("home.classSuffix")}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto" style={{ marginTop: -8 }}>
        <div style={{ background: "var(--bg-primary)", borderRadius: "var(--radius-lg) var(--radius-lg) 0 0", minHeight: "100%" }}>
          <div className="px-4 pt-5 pb-10 flex flex-col gap-4 max-w-lg mx-auto">

            {/* Period toggle */}
            <div className="flex gap-2 p-1 rounded-xl" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
              {(["month", "year"] as const).map(p => (
                <button key={p} onClick={() => switchPeriod(p)}
                  className="flex-1 py-2 text-sm font-semibold rounded-lg transition-all"
                  style={{
                    background: period === p ? "var(--accent)" : "transparent",
                    color: period === p ? "#fff" : "var(--text-muted)",
                  }}>
                  {p === "month" ? t("studentStats.monthly") : t("studentStats.yearly")}
                </button>
              ))}
            </div>

            {/* Period selector */}
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
              {periodOpts.map(opt => (
                <button key={opt.value} onClick={() => setValue(opt.value)}
                  className="shrink-0 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all"
                  style={{
                    background: value === opt.value ? "var(--accent)" : "var(--bg-card)",
                    color: value === opt.value ? "#fff" : "var(--text-muted)",
                    border: `1px solid ${value === opt.value ? "var(--accent)" : "var(--border)"}`,
                  }}>
                  {opt.label}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-6 h-6 border-2 border-transparent rounded-full animate-spin" style={{ borderTopColor: "var(--accent)" }} />
              </div>
            ) : !stats || stats.total === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-2">
                <BarChart2 size={32} style={{ color: "var(--text-muted)" }} />
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>{t("studentStats.noData")}</p>
              </div>
            ) : (
              <>
                {/* Summary cards */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 flex flex-col gap-1" style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)" }}>
                    <CheckCircle2 size={16} style={{ color: "var(--accent)" }} />
                    <p className="text-2xl font-bold mt-1" style={{ color: "var(--text-primary)" }}>{stats.total}</p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>{t("studentStats.checks")}</p>
                  </div>
                  <div className="p-4 flex flex-col gap-1" style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)" }}>
                    <TrendingUp size={16} style={{ color: "var(--success)" }} />
                    <p className="text-2xl font-bold mt-1" style={{ color: "var(--text-primary)" }}>{stats.avgScore}%</p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>{t("studentStats.averageScore")}</p>
                  </div>
                </div>

                {/* Grade distribution */}
                {totalGrades > 0 && (
                  <div className="p-4 flex flex-col gap-3" style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)" }}>
                    <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>{t("studentStats.gradeDistribution")}</p>
                    {["5","4","3","2","1"].map(g => {
                      const count = stats.gradeDistribution[g] ?? 0;
                      const pct = totalGrades ? Math.round((count / totalGrades) * 100) : 0;
                      const colors: Record<string, string> = { "5": "#3dbd7d", "4": "#6366f1", "3": "#f59e0b", "2": "#f97316", "1": "#ef4444" };
                      return (
                        <div key={g} className="flex items-center gap-3">
                          <span className="text-sm font-bold w-4 shrink-0" style={{ color: colors[g] }}>{g}</span>
                          <div className="flex-1 rounded-full overflow-hidden" style={{ background: "var(--bg-primary)", height: 10 }}>
                            <div className="h-full rounded-full transition-all duration-500"
                              style={{ width: `${(count / maxGrade) * 100}%`, background: colors[g] }} />
                          </div>
                          <span className="text-xs font-semibold w-8 text-right shrink-0" style={{ color: "var(--text-muted)" }}>
                            {count > 0 ? `${pct}%` : "—"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Timeline chart */}
                {stats.timeline.length > 0 && (
                  <div className="p-4 flex flex-col gap-3" style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)" }}>
                    <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                      {period === "month" ? t("studentStats.dailyActivity") : t("studentStats.monthlyActivity")}
                    </p>
                    <div className="flex items-end gap-1.5 h-24">
                      {stats.timeline.map((v, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                          <div className="w-full rounded-t-sm transition-all duration-500"
                            style={{
                              height: `${Math.max((v.count / maxTimeline) * 80, v.count > 0 ? 8 : 2)}px`,
                              background: v.count > 0 ? "var(--accent)" : "var(--bg-primary)",
                              border: v.count === 0 ? "1px solid var(--border)" : "none",
                            }} />
                          <span className="text-[9px]" style={{ color: "var(--text-muted)" }}>{v.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Top students */}
                {stats.students?.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <p className="text-xs font-semibold uppercase tracking-widest px-1 flex items-center gap-1.5" style={{ color: "var(--text-muted)" }}>
                      <Users size={11} /> {t("classProfile.studentsRating")}
                    </p>
                    {stats.students.map((s, i) => (
                      <div key={i} className="flex items-center gap-3 px-4 py-3"
                        style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)" }}>
                        <span className="text-sm font-bold w-5 shrink-0" style={{ color: i < 3 ? "var(--accent)" : "var(--text-muted)" }}>
                          {i + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{s.name}</p>
                          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{s.count} {t("classProfile.checksUnit")}</p>
                        </div>
                        <span className="text-sm font-bold shrink-0" style={{ color: "var(--accent)" }}>{s.avgScore}%</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Subjects */}
                {stats.subjects.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <p className="text-xs font-semibold uppercase tracking-widest px-1" style={{ color: "var(--text-muted)" }}>{t("studentStats.bySubjects")}</p>
                    {stats.subjects.map((s, i) => (
                      <div key={i} className="flex items-center gap-3 px-4 py-3"
                        style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)" }}>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{s.name}</p>
                          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{s.count} {t("classProfile.checksUnit")}</p>
                        </div>
                        <span className="text-sm font-bold shrink-0" style={{ color: "var(--accent)" }}>{s.avgScore}%</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
