"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, TrendingUp, Star, Flame, Target, CheckCircle2, BookOpen, AlertCircle } from "lucide-react";
import { getToken } from "@/lib/auth";

const API = process.env.NEXT_PUBLIC_API_URL;
function authHeaders() {
  return { Authorization: `Bearer ${getToken()}` };
}

type StatsData = {
  total: number;
  avgScore: number;
  streak: number;
  accuracy: number;
  weeklyData: { day: string; checks: number }[];
  subjectStats: { name: string; icon: string; total: number; avg: number }[];
  commonErrors: { title: string; count: number }[];
};

const PAD_X = 16;
const CHART_W = 280;
const CHART_H = 80;

function buildChart(weeklyData: { day: string; checks: number }[]) {
  const maxChecks = Math.max(...weeklyData.map((d) => d.checks), 1);
  const pts = weeklyData.map((d, i) => ({
    x: PAD_X + (i / (weeklyData.length - 1)) * (CHART_W - PAD_X * 2),
    y: d.checks > 0 ? 8 + (1 - d.checks / maxChecks) * (CHART_H - 20) : CHART_H - 8,
    day: d.day,
    checks: d.checks,
  }));
  const smoothPath = pts
    .map((p, i, arr) => {
      if (i === 0) return `M${p.x},${p.y}`;
      const prev = arr[i - 1];
      const cpx = (prev.x + p.x) / 2;
      return `C${cpx},${prev.y} ${cpx},${p.y} ${p.x},${p.y}`;
    })
    .join(" ");
  const areaPath = `${smoothPath} L${pts[pts.length - 1].x},${CHART_H} L${pts[0].x},${CHART_H} Z`;
  return { pts, smoothPath, areaPath };
}

const EMPTY_WEEKLY = [
  { day: "Du", checks: 0 }, { day: "Se", checks: 0 }, { day: "Ch", checks: 0 },
  { day: "Pa", checks: 0 }, { day: "Ju", checks: 0 }, { day: "Sh", checks: 0 }, { day: "Ya", checks: 0 },
];

export default function StatsPage() {
  const [stats, setStats] = useState<StatsData>({
    total: 0, avgScore: 0, streak: 0, accuracy: 0,
    weeklyData: EMPTY_WEEKLY, subjectStats: [], commonErrors: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/api/stats/me`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((data: StatsData) => setStats(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const { pts, smoothPath, areaPath } = buildChart(stats.weeklyData);
  const maxTotal = Math.max(...stats.subjectStats.map((s) => s.total), 1);
  const maxErrors = Math.max(...stats.commonErrors.map((e) => e.count), 1);
  const weekTotal = stats.weeklyData.reduce((s, d) => s + d.checks, 0);

  const topStats = [
    { label: "Jami tekshirish", value: loading ? "..." : String(stats.total),     icon: CheckCircle2, color: "var(--success)", bg: "var(--success-bg)" },
    { label: "O'rtacha baho",   value: loading ? "..." : String(stats.avgScore),  icon: Star,         color: "var(--warning)", bg: "var(--warning-bg)" },
    { label: "Streak",          value: loading ? "..." : `${stats.streak} kun`,   icon: Flame,        color: "#EA580C", bg: "#FFF7ED" },
    { label: "Aniqlik",         value: loading ? "..." : `${stats.accuracy}%`,    icon: Target,       color: "#6366F1", bg: "#EEF2FF" },
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
          <h1 className="text-base font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>Statistika</h1>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            {new Date().toLocaleDateString("uz-UZ", { month: "long", year: "numeric" })}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5 pb-28 md:pb-6 max-w-2xl mx-auto w-full flex flex-col gap-4">

        {/* Top stats */}
        <div className="grid grid-cols-2 gap-3">
          {topStats.map(({ label, value, icon: Icon, color, bg }, i) => (
            <div key={i} className="card-3d p-4 flex items-center gap-3"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border-light)", borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-card)" }}>
              <div className="w-10 h-10 flex items-center justify-center shrink-0" style={{ background: bg, borderRadius: "var(--radius-sm)" }}>
                <Icon size={18} style={{ color }} />
              </div>
              <div>
                <p className="text-2xl font-bold leading-none" style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>{value}</p>
                <p className="text-xs font-bold mt-1 uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* SVG Line chart */}
        <div className="card-3d p-5"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border-light)", borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-card)" }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp size={15} style={{ color: "var(--text-secondary)" }} />
              <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Bu haftaki tekshirishlar</span>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1"
              style={{ background: "var(--accent-light)", color: "var(--text-secondary)", borderRadius: "var(--radius-sm)" }}>
              {weekTotal} ta jami
            </span>
          </div>

          <svg viewBox={`0 0 ${CHART_W} ${CHART_H}`} width="100%" preserveAspectRatio="none" style={{ height: 100, overflow: "visible" }}>
            <defs>
              <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="currentColor" stopOpacity="0.12" />
                <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={areaPath} fill="url(#areaGrad)" style={{ color: "var(--accent)" }} />
            <path d={smoothPath} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--accent)" }} />
            {pts.map((p) => (
              <g key={p.day}>
                {p.checks > 0 && (
                  <text x={p.x} y={p.y - 6} textAnchor="middle" fontSize="7" fontWeight="700" fill="currentColor" style={{ color: "var(--text-secondary)" }}>
                    {p.checks}
                  </text>
                )}
                <circle cx={p.x} cy={p.y} r={p.checks > 0 ? 3.5 : 2} fill="white" stroke="currentColor" strokeWidth={p.checks > 0 ? 2 : 1}
                  style={{ color: p.checks > 0 ? "var(--accent)" : "var(--border)" }} />
                <text x={p.x} y={CHART_H + 2} textAnchor="middle" fontSize="7" fill="currentColor" style={{ color: "var(--text-muted)" }}>
                  {p.day}
                </text>
              </g>
            ))}
          </svg>
        </div>

        {/* Fanlar bo'yicha */}
        {stats.subjectStats.length > 0 && (
          <div className="card-3d p-5"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border-light)", borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-card)" }}>
            <div className="flex items-center gap-2 mb-4">
              <BookOpen size={15} style={{ color: "var(--text-secondary)" }} />
              <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Fanlar bo&apos;yicha</span>
            </div>
            <div className="flex flex-col gap-4">
              {stats.subjectStats.map((s, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 flex items-center justify-center shrink-0 text-sm"
                    style={{ background: "var(--accent-light)", borderRadius: "var(--radius-sm)" }}>
                    {s.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{s.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs" style={{ color: "var(--text-muted)" }}>{s.total} ta</span>
                        <span className="text-xs font-bold px-2 py-0.5" style={{ background: "var(--warning-bg)", color: "var(--warning)", borderRadius: "var(--radius-sm)" }}>
                          {s.avg}
                        </span>
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full w-full" style={{ background: "var(--border)" }}>
                      <div className="h-1.5 rounded-full transition-all duration-700"
                        style={{ width: `${(s.total / maxTotal) * 100}%`, background: "var(--accent)" }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Eng ko'p xatolar */}
        {stats.commonErrors.length > 0 && (
          <div className="card-3d p-5"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border-light)", borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-card)" }}>
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle size={15} style={{ color: "var(--error)" }} />
              <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Eng ko&apos;p uchraydigan xatolar</span>
            </div>
            <div className="flex flex-col gap-3.5">
              {stats.commonErrors.map((e, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-5 h-5 flex items-center justify-center text-[10px] font-bold shrink-0"
                    style={{ background: "var(--accent-light)", color: "var(--text-secondary)", borderRadius: "4px" }}>
                    {i + 1}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{e.title}</span>
                      <span className="text-xs font-bold" style={{ color: "var(--text-secondary)" }}>{e.count}</span>
                    </div>
                    <div className="h-1.5 rounded-full" style={{ background: "var(--border)" }}>
                      <div className="h-1.5 rounded-full transition-all duration-700"
                        style={{ width: `${(e.count / maxErrors) * 100}%`, background: "var(--accent)" }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Summary */}
        <div className="card-3d p-5 flex items-center gap-4"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border-light)", borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-card)" }}>
          <div className="w-12 h-12 flex items-center justify-center text-xl shrink-0"
            style={{ background: "var(--warning-bg)", borderRadius: "var(--radius-sm)" }}>
            🏆
          </div>
          <div>
            <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
              {stats.total > 0 ? "Ajoyib natijalar!" : "Hali tekshirishlar yo'q"}
            </p>
            <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "var(--text-muted)" }}>
              {stats.total > 0
                ? `Jami ${stats.total} ta uy ishi tekshirildi, ${stats.accuracy}% aniqlikka erishildi.`
                : "Birinchi uy ishini tekshirishdan boshlang!"}
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
