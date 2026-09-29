"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, TrendingUp, Star, Flame, CheckCircle2, BookOpen, AlertCircle, UserCheck, BarChart2 } from "lucide-react";
import { getToken } from "@/lib/auth";
import { useT } from "@/lib/i18n-context";
import { type Period, periodOptions, defaultValue } from "@/lib/stats-period";

const API = process.env.NEXT_PUBLIC_API_URL;
function authHeaders() {
  return { Authorization: `Bearer ${getToken()}` };
}

// All-time (streak + ko'p xatolar) — /api/stats/me
type MeData = {
  streak: number;
  commonErrors: { title: string; count: number }[];
};

// Davr bo'yicha — /api/stats/overview
type Overview = {
  total: number;
  avgScore: number;
  activeStudents: number;
  gradeDistribution: Record<string, number>;
  timeline: { label: string; count: number; avgScore: number }[];
  subjects: { name: string; count: number; avgScore: number }[];
};

const SUBJECT_ICONS: Record<string, string> = {
  Matematika: "📐", Fizika: "🔬", Kimyo: "⚗️", Biologiya: "🌱",
  "Ona tili": "📖", "Ingliz tili": "🌍", Tarix: "📜", "Rus tili": "🇷🇺", Geografiya: "🗺️",
};

export default function StatsPage() {
  const { t } = useT();
  const [period, setPeriod] = useState<Period>("month");
  const [value, setValue] = useState(() => defaultValue("month"));
  const [me, setMe] = useState<MeData>({ streak: 0, commonErrors: [] });
  const [ov, setOv] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/api/stats/me`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((d: MeData) => setMe(d))
      .catch(() => {});
  }, []);

  const load = useCallback(async (p: Period, v: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/stats/overview?period=${p}&value=${v}`, { headers: authHeaders() });
      if (res.ok) setOv(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(period, value); }, [load, period, value]);

  const switchPeriod = (p: Period) => {
    setPeriod(p);
    setValue(defaultValue(p));
  };

  const periodOpts = periodOptions(period);
  const maxTimeline = Math.max(...(ov?.timeline.map((v) => v.count) ?? [1]), 1);
  const maxSubject = Math.max(...(ov?.subjects.map((s) => s.count) ?? [1]), 1);
  const maxErrors = Math.max(...me.commonErrors.map((e) => e.count), 1);
  const maxGrade = Math.max(...Object.values(ov?.gradeDistribution ?? {}), 1);
  const totalGrades = Object.values(ov?.gradeDistribution ?? {}).reduce((a, b) => a + b, 0);

  const topStats = [
    { label: t("dashboardStats.totalChecks"), value: String(ov?.total ?? 0),          icon: CheckCircle2, color: "var(--success)", bg: "var(--success-bg)" },
    { label: t("dashboardStats.avgScore"),    value: String(ov?.avgScore ?? 0),        icon: Star,         color: "var(--warning)", bg: "var(--warning-bg)" },
    { label: t("studentStats.activeStudents"), value: String(ov?.activeStudents ?? 0), icon: UserCheck,    color: "#6366F1",         bg: "#EEF2FF" },
    { label: t("dashboardStats.streak"),      value: `${me.streak} ${t("dashboardStats.streakUnit")}`, icon: Flame, color: "#EA580C", bg: "#FFF7ED" },
  ];

  return (
    <div className="bg-grid flex flex-col min-h-screen">

      {/* Header */}
      <div className="px-6 py-4 border-b flex items-center gap-4 sticky top-0 z-10"
        style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
        <Link href="/dashboard"
          className="w-8 h-8 flex items-center justify-center transition-all hover:opacity-70"
          style={{ background: "var(--bg-primary)", color: "var(--text-secondary)", borderRadius: "var(--radius-sm)" }}>
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-base font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>{t("dashboardStats.title")}</h1>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            {new Date().toLocaleDateString("uz-UZ", { month: "long", year: "numeric" })}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5 pb-28 md:pb-6 max-w-2xl mx-auto w-full flex flex-col gap-4">

        {/* Period toggle */}
        <div className="flex gap-2 p-1 rounded-xl" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          {(["day", "week", "month"] as const).map((p) => (
            <button key={p} onClick={() => switchPeriod(p)}
              className="flex-1 py-2 text-sm font-semibold rounded-lg transition-all"
              style={{ background: period === p ? "var(--accent)" : "transparent", color: period === p ? "#fff" : "var(--text-muted)" }}>
              {t(`studentStats.${p === "day" ? "daily" : p === "week" ? "weekly" : "monthly"}`)}
            </button>
          ))}
        </div>

        {/* Period selector */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
          {periodOpts.map((opt) => (
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

        {/* Top stats */}
        <div className="grid grid-cols-2 gap-3">
          {topStats.map(({ label, value: v, icon: Icon, color, bg }, i) => (
            <div key={i} className="card-3d p-4 flex items-center gap-3"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border-light)", borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-card)" }}>
              <div className="w-10 h-10 flex items-center justify-center shrink-0" style={{ background: bg, borderRadius: "var(--radius-sm)" }}>
                <Icon size={18} style={{ color }} />
              </div>
              <div>
                <p className="text-2xl font-bold leading-none" style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>{loading ? "..." : v}</p>
                <p className="text-xs font-bold mt-1 uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>{label}</p>
              </div>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-transparent rounded-full animate-spin" style={{ borderTopColor: "var(--accent)" }} />
          </div>
        ) : !ov || ov.total === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <BarChart2 size={32} style={{ color: "var(--text-muted)" }} />
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>{t("studentStats.noData")}</p>
          </div>
        ) : (
          <>
            {/* Timeline (bars) */}
            {ov.timeline.length > 0 && (
              <div className="card-3d p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border-light)", borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-card)" }}>
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp size={15} style={{ color: "var(--text-secondary)" }} />
                  <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                    {t(`studentStats.${period === "day" ? "hourlyActivity" : period === "week" ? "weeklyActivity" : "dailyActivity"}`)}
                  </span>
                </div>
                <div className="flex items-end gap-1.5 h-24">
                  {ov.timeline.map((v, i) => (
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

            {/* Grade distribution */}
            {totalGrades > 0 && (
              <div className="card-3d p-5 flex flex-col gap-3" style={{ background: "var(--bg-card)", border: "1px solid var(--border-light)", borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-card)" }}>
                <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{t("studentStats.gradeDistribution")}</span>
                {["5", "4", "3", "2", "1"].map((g) => {
                  const count = ov.gradeDistribution[g] ?? 0;
                  const pct = totalGrades ? Math.round((count / totalGrades) * 100) : 0;
                  const colors: Record<string, string> = { "5": "#3dbd7d", "4": "#6366f1", "3": "#f59e0b", "2": "#f97316", "1": "#ef4444" };
                  return (
                    <div key={g} className="flex items-center gap-3">
                      <span className="text-sm font-bold w-4 shrink-0" style={{ color: colors[g] }}>{g}</span>
                      <div className="flex-1 rounded-full overflow-hidden" style={{ background: "var(--bg-primary)", height: 10 }}>
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(count / maxGrade) * 100}%`, background: colors[g] }} />
                      </div>
                      <span className="text-xs font-semibold w-8 text-right shrink-0" style={{ color: "var(--text-muted)" }}>{count > 0 ? `${pct}%` : "—"}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* By subjects (period) */}
            {ov.subjects.length > 0 && (
              <div className="card-3d p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border-light)", borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-card)" }}>
                <div className="flex items-center gap-2 mb-4">
                  <BookOpen size={15} style={{ color: "var(--text-secondary)" }} />
                  <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{t("dashboardStats.bySubjects")}</span>
                </div>
                <div className="flex flex-col gap-4">
                  {ov.subjects.map((s, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-8 h-8 flex items-center justify-center shrink-0 text-sm" style={{ background: "var(--accent-light)", borderRadius: "var(--radius-sm)" }}>
                        {SUBJECT_ICONS[s.name] ?? "📝"}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{s.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs" style={{ color: "var(--text-muted)" }}>{s.count} {t("dashboardStats.subjectUnit")}</span>
                            <span className="text-xs font-bold px-2 py-0.5" style={{ background: "var(--warning-bg)", color: "var(--warning)", borderRadius: "var(--radius-sm)" }}>{s.avgScore}</span>
                          </div>
                        </div>
                        <div className="h-1.5 rounded-full w-full" style={{ background: "var(--border)" }}>
                          <div className="h-1.5 rounded-full transition-all duration-700" style={{ width: `${(s.count / maxSubject) * 100}%`, background: "var(--accent)" }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Common errors (all-time) */}
        {me.commonErrors.length > 0 && (
          <div className="card-3d p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border-light)", borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-card)" }}>
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle size={15} style={{ color: "var(--error)" }} />
              <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{t("dashboardStats.commonErrors")}</span>
            </div>
            <div className="flex flex-col gap-3.5">
              {me.commonErrors.map((e, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-5 h-5 flex items-center justify-center text-[10px] font-bold shrink-0" style={{ background: "var(--accent-light)", color: "var(--text-secondary)", borderRadius: "4px" }}>{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{e.title}</span>
                      <span className="text-xs font-bold" style={{ color: "var(--text-secondary)" }}>{e.count}</span>
                    </div>
                    <div className="h-1.5 rounded-full" style={{ background: "var(--border)" }}>
                      <div className="h-1.5 rounded-full transition-all duration-700" style={{ width: `${(e.count / maxErrors) * 100}%`, background: "var(--accent)" }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
