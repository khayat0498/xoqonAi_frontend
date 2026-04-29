"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Folder, CheckCircle2, Clock, XCircle, Loader2, Database } from "lucide-react";
import { getToken } from "@/lib/auth";
import { useT } from "@/lib/i18n-context";

const API = process.env.NEXT_PUBLIC_API_URL;
function authHeaders() {
  return { Authorization: `Bearer ${getToken()}` };
}

type SubmissionItem = {
  id: string;
  imageUrl: string;
  subject: string | null;
  status: string;
  studentId: string | null;
  studentName: string | null;
  classId: string | null;
  className: string | null;
  folderId: string | null;
  folderName: string | null;
  createdAt: string;
  score: number | null;
  grade: string | null;
  costUzs: number | null;
  inputTokens: number | null;
  outputTokens: number | null;
  thinkingTokens: number | null;
  thinkingCostUzs: number | null;
};

type CacheLog = {
  id: string;
  amountUzs: number;
  inputTokens: number | null;
  note: string | null;
  createdAt: string;
};

type TimelineEntry =
  | { kind: "submission"; data: SubmissionItem }
  | { kind: "cache"; data: CacheLog };

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("uz-UZ", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" });
}

function StatusIcon({ status }: { status: string }) {
  if (status === "done") return <CheckCircle2 size={13} style={{ color: "var(--success)" }} />;
  if (status === "failed") return <XCircle size={13} style={{ color: "var(--error)" }} />;
  return <Loader2 size={13} className="animate-spin" style={{ color: "var(--text-muted)" }} />;
}

export default function HistoryPage() {
  const { t } = useT();
  const [items, setItems] = useState<SubmissionItem[]>([]);
  const [cacheLogs, setCacheLogs] = useState<CacheLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 30;

  const load = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const [subRes, balRes] = await Promise.all([
        fetch(`${API}/api/submissions?page=${p}&limit=${limit}`, { headers: authHeaders() }),
        p === 1 ? fetch(`${API}/api/balance/me`, { headers: authHeaders() }) : Promise.resolve(null),
      ]);
      if (subRes.ok) {
        const data = await subRes.json();
        setItems(p === 1 ? data.data : (prev) => [...prev, ...data.data]);
        setTotal(data.total);
      }
      if (balRes?.ok) {
        const balData = await balRes.json();
        const caches = (balData.logs ?? []).filter((l: any) => l.type === "cache");
        setCacheLogs(caches);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(1); }, [load]);

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    load(next);
  };

  const hasMore = items.length < total;

  // Submissions + cache loglarni vaqt bo'yicha birlashtirish
  const allEntries: TimelineEntry[] = [
    ...items.map(d => ({ kind: "submission" as const, data: d })),
    ...cacheLogs.map(d => ({ kind: "cache" as const, data: d })),
  ].sort((a, b) => new Date(b.data.createdAt).getTime() - new Date(a.data.createdAt).getTime());

  // Kunlar bo'yicha guruhlash
  const grouped: { date: string; entries: TimelineEntry[] }[] = [];
  for (const entry of allEntries) {
    const date = formatDate(entry.data.createdAt);
    const last = grouped[grouped.length - 1];
    if (last && last.date === date) {
      last.entries.push(entry);
    } else {
      grouped.push({ date, entries: [entry] });
    }
  }

  return (
    <div className="flex flex-col h-screen" style={{ background: "var(--bg-primary)" }}>

      {/* Header */}
      <div
        className="px-5 pt-4 pb-8 flex items-center gap-3 relative overflow-hidden shrink-0"
        style={{
          background: "linear-gradient(135deg, var(--accent-dark) 0%, var(--accent) 60%, var(--accent-hover) 100%)",
          boxShadow: "6px 6px 14px rgba(53,120,136,0.25), inset -2px -2px 6px rgba(0,0,0,0.08), inset 2px 2px 6px rgba(255,255,255,0.12)",
          zIndex: 10,
        }}
      >
        <div style={{ position: "absolute", right: -20, top: -30, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.07)" }} />
        <Link href="/home" className="w-8 h-8 rounded-xl flex items-center justify-center relative"
          style={{ background: "rgba(255,255,255,0.18)", color: "#fff" }}>
          <ArrowLeft size={16} />
        </Link>
        <div className="flex-1 relative">
          <h1 className="text-base font-semibold text-white" style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>{t("history.title")}</h1>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.7)" }}>{t("history.checksCount").replace("{total}", String(total))}</p>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto" style={{ marginTop: -8 }}>
        <div style={{ background: "var(--bg-primary)", borderRadius: "var(--radius-lg) var(--radius-lg) 0 0", minHeight: "100%" }}>

          {loading && items.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={24} className="animate-spin" style={{ color: "var(--text-muted)" }} />
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-2">
              <Clock size={32} style={{ color: "var(--text-muted)" }} />
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>{t("history.noChecksYet")}</p>
            </div>
          ) : (
            <div className="px-4 pt-5 pb-8 flex flex-col gap-5">
              {grouped.map(({ date, entries }) => (
                <div key={date} className="flex flex-col gap-1.5">
                  <p className="text-xs font-semibold px-1 pb-1" style={{ color: "var(--text-muted)", letterSpacing: "0.04em" }}>{date}</p>

                  {entries.map((entry) => {
                    if (entry.kind === "cache") {
                      const log = entry.data;
                      return (
                        <div
                          key={`cache-${log.id}`}
                          className="flex items-center gap-3 px-4 py-2.5"
                          style={{
                            background: "var(--bg-primary)",
                            border: "1px dashed var(--border)",
                            borderRadius: "var(--radius-sm)",
                          }}
                        >
                          <div className="w-11 h-11 shrink-0 flex items-center justify-center"
                            style={{ borderRadius: "var(--radius-sm)", background: "rgba(99,102,241,0.08)" }}>
                            <Database size={16} style={{ color: "#6366f1" }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>{t("history.cacheCreation")}</p>
                            <p className="text-[11px] truncate mt-0.5" style={{ color: "var(--text-muted)" }}>
                              {log.inputTokens ? `${log.inputTokens.toLocaleString()} token · ` : ""}{log.note ?? t("history.promptCache")}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <span className="text-xs font-semibold" style={{ color: "#6366f1" }}>
                              -{Math.abs(log.amountUzs).toLocaleString()}uzs
                            </span>
                            <span className="text-xs" style={{ color: "var(--text-muted)" }}>{formatTime(log.createdAt)}</span>
                          </div>
                        </div>
                      );
                    }

                    const item = entry.data;
                    return (
                      <Link
                        key={item.id}
                        href={`/submission/${item.id}`}
                        className="flex items-center gap-3 px-4 py-3 transition-all hover:opacity-80 animate-slide-in"
                        style={{
                          background: "var(--bg-card)",
                          border: "1px solid var(--border)",
                          borderRadius: "var(--radius-sm)",
                          boxShadow: "var(--shadow-sm)",
                        }}
                      >
                        <div
                          className="w-11 h-11 shrink-0 overflow-hidden"
                          style={{ borderRadius: "var(--radius-sm)", background: "var(--bg-primary)", border: "1px solid var(--border-light)" }}
                        >
                          {item.imageUrl ? (
                            <img src={item.imageUrl.startsWith("http") ? item.imageUrl : `${API}${item.imageUrl}`} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-lg">📄</div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {item.studentName ? (
                              <>
                                <span className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{item.studentName}</span>
                                {item.className && (
                                  <span className="text-xs px-1.5 py-0.5 rounded-full shrink-0" style={{ background: "var(--accent-light)", color: "var(--accent)" }}>
                                    {item.className}
                                  </span>
                                )}
                              </>
                            ) : (
                              <>
                                <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{formatTime(item.createdAt)}</span>
                                {item.folderName && (
                                  <span className="flex items-center gap-0.5 text-xs shrink-0" style={{ color: "var(--text-muted)" }}>
                                    <Folder size={10} />{item.folderName}
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <StatusIcon status={item.status} />
                            <span className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
                              {item.subject ?? t("history.noSubject")}
                            </span>
                            {item.grade && item.grade !== "-" && (
                              <span className="text-xs font-bold" style={{ color: "var(--accent)" }}>· {item.grade}</span>
                            )}
                          </div>
                          {(item.inputTokens || item.outputTokens) ? (
                            <p className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)", opacity: 0.7 }}>
                              {(item.inputTokens ?? 0).toLocaleString()}in / {(item.outputTokens ?? 0).toLocaleString()}out{item.thinkingTokens ? ` / ${item.thinkingTokens.toLocaleString()}think` : ""}
                            </p>
                          ) : null}
                        </div>

                        <div className="flex flex-col items-end gap-1 shrink-0">
                          {item.costUzs ? (
                            <>
                              <span className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
                                {item.costUzs.toLocaleString()}uzs
                              </span>
                              {item.thinkingCostUzs ? (
                                <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                                  {item.thinkingCostUzs.toLocaleString()}uzs think
                                </span>
                              ) : null}
                            </>
                          ) : (
                            <span className="text-xs" style={{ color: "var(--text-muted)" }}>—</span>
                          )}
                          {item.studentName && (
                            <span className="text-xs" style={{ color: "var(--text-muted)" }}>{formatTime(item.createdAt)}</span>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ))}

              {/* Ko'proq yuklash */}
              {hasMore && (
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="w-full py-3 text-sm flex items-center justify-center gap-2"
                  style={{ border: "1px dashed var(--border)", borderRadius: "var(--radius-sm)", color: "var(--text-muted)" }}
                >
                  {loading ? <Loader2 size={14} className="animate-spin" /> : null}
                  {t("history.loadMore")}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
