"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bell, Trash2, Calendar } from "lucide-react";
import Link from "next/link";
import { getToken } from "@/lib/auth";
import { useUserWS } from "@/lib/user-ws";

const API = process.env.NEXT_PUBLIC_API_URL;
function authHeaders() {
  return { Authorization: `Bearer ${getToken()}` };
}

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  sourceUrl: string | null;
  readAt: string | null;
  createdAt: string;
};

function formatTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "hozir";
  if (diffMin < 60) return `${diffMin} daqiqa oldin`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} soat oldin`;
  return d.toLocaleDateString("uz-UZ", { day: "2-digit", month: "2-digit", year: "numeric" }) +
    " " + d.toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" });
}

function iconForType(type: string) {
  if (type === "todo_due") return <Calendar size={16} style={{ color: "#f59e0b" }} />;
  return <Bell size={16} style={{ color: "var(--accent)" }} />;
}

export default function NotificationsPage() {
  const router = useRouter();
  const { lastEvent } = useUserWS();
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/notifications`, { headers: authHeaders() });
      if (res.ok) setItems(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Sahifa ochilganda — hammasini avtomatik o'qilgan deb belgilash
  useEffect(() => {
    if (loading || items.length === 0) return;
    const hasUnread = items.some(i => !i.readAt);
    if (!hasUnread) return;
    fetch(`${API}/api/notifications/read-all`, {
      method: "PATCH",
      headers: authHeaders(),
    }).then(() => {
      setItems(prev => prev.map(i => i.readAt ? i : { ...i, readAt: new Date().toISOString() }));
    }).catch(() => {});
  }, [loading, items]);

  // WS event'da yangi notification kelsa — qo'shamiz
  useEffect(() => {
    if (lastEvent?.type !== "notification_new") return;
    const d = lastEvent.data;
    setItems(prev => [{
      id: d.id,
      type: d.type,
      title: d.title,
      body: d.body,
      sourceUrl: d.sourceUrl,
      readAt: null,
      createdAt: d.createdAt,
    }, ...prev]);
  }, [lastEvent]);

  const handleClick = async (n: Notification) => {
    if (!n.readAt) {
      fetch(`${API}/api/notifications/${n.id}/read`, {
        method: "PATCH",
        headers: authHeaders(),
      }).catch(() => {});
    }
    if (n.sourceUrl) router.push(n.sourceUrl);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setItems(prev => prev.filter(i => i.id !== id));
    fetch(`${API}/api/notifications/${id}`, {
      method: "DELETE",
      headers: authHeaders(),
    }).catch(() => {});
  };

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
          <h1 className="text-base font-semibold text-white" style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>Bildirishnomalar</h1>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.7)" }}>{items.length} ta xabar</p>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto" style={{ marginTop: -8 }}>
        <div style={{ background: "var(--bg-primary)", borderRadius: "var(--radius-lg) var(--radius-lg) 0 0", minHeight: "100%" }}>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-6 h-6 border-2 border-transparent rounded-full animate-spin" style={{ borderTopColor: "var(--accent)" }} />
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Bell size={32} style={{ color: "var(--text-muted)" }} />
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>Hozircha bildirishnoma yo'q</p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Reja muddati kelganda bu yerda ko'rinadi</p>
            </div>
          ) : (
            <div className="px-4 pt-5 pb-8 flex flex-col gap-2">
              {items.map(n => (
                <div
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className="flex items-start gap-3 px-4 py-3 cursor-pointer transition-all hover:opacity-90"
                  style={{
                    background: "var(--bg-card)",
                    border: `1px solid ${n.readAt ? "var(--border)" : "var(--accent)"}`,
                    borderRadius: "var(--radius-sm)",
                    opacity: n.readAt ? 0.75 : 1,
                  }}
                >
                  <div className="w-9 h-9 shrink-0 flex items-center justify-center"
                    style={{ borderRadius: "var(--radius-sm)", background: n.readAt ? "var(--bg-primary)" : "rgba(245,158,11,0.10)" }}>
                    {iconForType(n.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>{n.title}</p>
                      {!n.readAt && (
                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "var(--accent)" }} />
                      )}
                    </div>
                    {n.body && (
                      <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{n.body}</p>
                    )}
                    <p className="text-[10px] mt-1" style={{ color: "var(--text-muted)" }}>{formatTime(n.createdAt)}</p>
                  </div>
                  <button
                    onClick={(e) => handleDelete(n.id, e)}
                    className="p-1.5 rounded-lg transition-all hover:opacity-70"
                    style={{ background: "var(--bg-primary)", color: "var(--text-muted)" }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
