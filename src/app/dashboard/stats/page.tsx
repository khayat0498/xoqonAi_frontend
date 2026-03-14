"use client";

import Link from "next/link";
import { ArrowLeft, TrendingUp, Star, Flame, Target, CheckCircle2, BookOpen, AlertCircle } from "lucide-react";

const weeklyData = [
  { day: "Du", checks: 3 },
  { day: "Se", checks: 5 },
  { day: "Ch", checks: 2 },
  { day: "Pa", checks: 7 },
  { day: "Ju", checks: 4 },
  { day: "Sh", checks: 0 },
  { day: "Ya", checks: 0 },
];

const maxChecks = Math.max(...weeklyData.map((d) => d.checks), 1);

const subjectStats = [
  { name: "Matematika", icon: "📐", total: 12, avg: 4.3 },
  { name: "Ona tili",   icon: "📖", total: 8,  avg: 4.6 },
  { name: "Fizika",     icon: "🔬", total: 5,  avg: 3.9 },
  { name: "IELTS",      icon: "🌍", total: 3,  avg: 4.0 },
];

const maxTotal = Math.max(...subjectStats.map((s) => s.total));

const commonErrors = [
  { title: "Hisoblash xatolari",    count: 14 },
  { title: "Birlik ko'rsatilmagan", count: 9  },
  { title: "Masala to'liq emas",    count: 7  },
  { title: "Yozuv xatolari",        count: 5  },
];

const maxErrors = Math.max(...commonErrors.map((e) => e.count));

const topStats = [
  { label: "Jami tekshirish", value: "28",    icon: CheckCircle2, color: "#10B981", bg: "#F0FDF4" },
  { label: "O'rtacha baho",   value: "4.2",   icon: Star,         color: "#F59E0B", bg: "#FFFBEB" },
  { label: "Streak",          value: "5 kun", icon: Flame,        color: "#EA580C", bg: "#FFF7ED" },
  { label: "Aniqlik",         value: "87%",   icon: Target,       color: "#6366F1", bg: "#EEF2FF" },
];

// SVG line chart hisoblash
const PAD_X = 16;
const CHART_W = 280;
const CHART_H = 80;

const svgPts = weeklyData.map((d, i) => ({
  x: PAD_X + (i / (weeklyData.length - 1)) * (CHART_W - PAD_X * 2),
  y: d.checks > 0
    ? 8 + (1 - d.checks / maxChecks) * (CHART_H - 20)
    : CHART_H - 8,
  day: d.day,
  checks: d.checks,
}));

// Silliq egri chiziq (cubic bezier)
const smoothPath = svgPts
  .map((p, i, arr) => {
    if (i === 0) return `M${p.x},${p.y}`;
    const prev = arr[i - 1];
    const cpx = (prev.x + p.x) / 2;
    return `C${cpx},${prev.y} ${cpx},${p.y} ${p.x},${p.y}`;
  })
  .join(" ");

const areaPath = `${smoothPath} L${svgPts[svgPts.length - 1].x},${CHART_H} L${svgPts[0].x},${CHART_H} Z`;

export default function StatsPage() {
  return (
    <div className="bg-grid flex flex-col min-h-screen">

      {/* Header */}
      <div
        className="px-6 py-4 border-b flex items-center gap-4 sticky top-0 z-10"
        style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
      >
        <Link
          href="/dashboard"
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:opacity-70"
          style={{ background: "var(--bg-primary)", color: "var(--text-secondary)" }}
        >
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>Statistika</h1>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>Fevral 2026</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5 pb-28 md:pb-6 max-w-2xl mx-auto w-full flex flex-col gap-4">

        {/* Top stats */}
        <div className="grid grid-cols-2 gap-3">
          {topStats.map(({ label, value, icon: Icon, color, bg }, i) => (
            <div
              key={i}
              className="card-3d rounded-2xl p-4 flex items-center gap-3"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: bg }}>
                <Icon size={18} style={{ color }} />
              </div>
              <div>
                <p className="text-2xl font-bold leading-none" style={{ color: "var(--text-primary)" }}>{value}</p>
                <p className="text-xs font-bold mt-1 uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* SVG Line chart */}
        <div
          className="card-3d rounded-2xl p-5"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp size={15} style={{ color: "var(--text-secondary)" }} />
              <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                Bu haftaki tekshirishlar
              </span>
            </div>
            <span
              className="text-xs font-semibold px-2.5 py-1 rounded-lg"
              style={{ background: "var(--accent-light)", color: "var(--text-secondary)" }}
            >
              21 ta jami
            </span>
          </div>

          {/* SVG */}
          <svg
            viewBox={`0 0 ${CHART_W} ${CHART_H}`}
            width="100%"
            preserveAspectRatio="none"
            style={{ height: 100, overflow: "visible" }}
          >
            <defs>
              <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="currentColor" stopOpacity="0.12" />
                <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Area fill */}
            <path
              d={areaPath}
              fill="url(#areaGrad)"
              style={{ color: "var(--text-primary)" }}
            />

            {/* Line */}
            <path
              d={smoothPath}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ color: "var(--text-primary)" }}
            />

            {/* Dots + labels */}
            {svgPts.map((p) => (
              <g key={p.day}>
                {/* Count label */}
                {p.checks > 0 && (
                  <text
                    x={p.x}
                    y={p.y - 6}
                    textAnchor="middle"
                    fontSize="7"
                    fontWeight="700"
                    fill="currentColor"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {p.checks}
                  </text>
                )}
                {/* Dot */}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={p.checks > 0 ? 3.5 : 2}
                  fill="white"
                  stroke="currentColor"
                  strokeWidth={p.checks > 0 ? 2 : 1}
                  style={{ color: p.checks > 0 ? "var(--text-primary)" : "var(--border)" }}
                />
                {/* Day label */}
                <text
                  x={p.x}
                  y={CHART_H + 2}
                  textAnchor="middle"
                  fontSize="7"
                  fill="currentColor"
                  style={{ color: "var(--text-muted)" }}
                >
                  {p.day}
                </text>
              </g>
            ))}
          </svg>
        </div>

        {/* Fanlar bo'yicha */}
        <div
          className="card-3d rounded-2xl p-5"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
        >
          <div className="flex items-center gap-2 mb-4">
            <BookOpen size={15} style={{ color: "var(--text-secondary)" }} />
            <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Fanlar bo'yicha</span>
          </div>

          <div className="flex flex-col gap-4">
            {subjectStats.map((s, i) => (
              <div key={i} className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-sm"
                  style={{ background: "var(--accent-light)" }}
                >
                  {s.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{s.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>{s.total} ta</span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-lg" style={{ background: "#fef3c7", color: "#f59e0b" }}>
                        {s.avg}⭐
                      </span>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full w-full" style={{ background: "var(--border)" }}>
                    <div
                      className="h-1.5 rounded-full transition-all duration-700"
                      style={{ width: `${(s.total / maxTotal) * 100}%`, background: "var(--text-primary)" }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Eng ko'p xatolar */}
        <div
          className="card-3d rounded-2xl p-5"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
        >
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle size={15} style={{ color: "var(--error)" }} />
            <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
              Eng ko'p uchraydigan xatolar
            </span>
          </div>

          <div className="flex flex-col gap-3.5">
            {commonErrors.map((e, i) => (
              <div key={i} className="flex items-center gap-3">
                <span
                  className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0"
                  style={{ background: "var(--accent-light)", color: "var(--text-secondary)" }}
                >
                  {i + 1}
                </span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{e.title}</span>
                    <span className="text-xs font-bold" style={{ color: "var(--text-secondary)" }}>{e.count}</span>
                  </div>
                  <div className="h-1.5 rounded-full" style={{ background: "var(--border)" }}>
                    <div
                      className="h-1.5 rounded-full transition-all duration-700"
                      style={{ width: `${(e.count / maxErrors) * 100}%`, background: "var(--text-primary)" }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div
          className="card-3d rounded-2xl p-5 flex items-center gap-4"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
        >
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0"
            style={{ background: "#fef3c7" }}
          >
            🏆
          </div>
          <div>
            <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Ajoyib natijalar!</p>
            <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "var(--text-muted)" }}>
              Bu oy 28 ta uy ishi tekshirildi, 87% aniqlikka erishildi.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
