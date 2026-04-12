"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, User, Bell, Globe, Moon, Sun, Shield, LogOut, Trash2, Lock, ChevronRight, Pencil, CreditCard, Layers, MessageSquare, HelpCircle } from "lucide-react";
import { removeToken, getToken } from "@/lib/auth";
import { useUser } from "@/lib/user-context";
import { useUserWS } from "@/lib/user-ws";

function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className="w-11 h-6 rounded-full relative transition-all duration-200 shrink-0"
      style={{ background: on ? "var(--accent)" : "var(--border)" }}
    >
      <span
        className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-200"
        style={{ left: on ? "calc(100% - 22px)" : "2px" }}
      />
    </button>
  );
}

function Row({
  icon: Icon,
  label,
  sub,
  right,
  danger,
  last,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  sub?: string;
  right?: React.ReactNode;
  danger?: boolean;
  last?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3.5 transition-all text-left"
      style={{
        borderBottom: last ? "none" : "1px solid var(--border)",
        cursor: onClick ? "pointer" : "default",
      }}
    >
      <Icon
        size={17}
        className="shrink-0"
        style={{ color: danger ? "var(--error)" : "var(--text-muted)" }}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium" style={{ color: danger ? "var(--error)" : "var(--text-primary)" }}>
          {label}
        </p>
        {sub && (
          <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-muted)" }}>
            {sub}
          </p>
        )}
      </div>
      {right ?? <ChevronRight size={14} style={{ color: "var(--border)" }} />}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-widest px-1 mb-2" style={{ color: "var(--text-muted)" }}>
        {title}
      </p>
      <div
        className="card-3d overflow-hidden"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border-light)", borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-card)" }}
      >
        {children}
      </div>
    </div>
  );
}

const PLAN_META: Record<string, { label: string; color: string }> = {
  free:    { label: "Free",    color: "var(--text-muted)" },
  pro:     { label: "Pro",     color: "var(--accent)" },
  premium: { label: "Premium", color: "var(--warning)" },
};

const API = process.env.NEXT_PUBLIC_API_URL;

export default function SettingsPage() {
  const router = useRouter();
  const { user, uploadAvatar } = useUser();
  const { lastEvent } = useUserWS();
  const fileRef = useRef<HTMLInputElement>(null);
  const [dark, setDark] = useState(false);
  const [notif, setNotif] = useState(true);
  const [lang, setLang] = useState<"uz" | "ru" | "en">("uz");
  const [planKey, setPlanKey] = useState("free");

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    fetch(`${API}/api/billing/my-plan`, {
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => setPlanKey(d.planKey ?? "free"))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (lastEvent?.type === "plan_updated") setPlanKey(lastEvent.data.planKey);
  }, [lastEvent]);

  // Sync dark mode from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("xoqon_theme");
    if (saved === "dark") setDark(true);
  }, []);

  const toggleDark = () => {
    setDark((prev) => {
      const next = !prev;
      document.documentElement.setAttribute("data-theme", next ? "dark" : "");
      localStorage.setItem("xoqon_theme", next ? "dark" : "light");
      return next;
    });
  };

  const handleLogout = async () => {
    const token = getToken();
    if (token) {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"}/api/auth/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
    removeToken();
    router.replace("/auth/login");
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadAvatar(file);
    e.target.value = "";
  };

  return (
    <div className="flex flex-col h-screen" style={{ background: "var(--bg-primary)" }}>

      {/* Header */}
      <div
        className="px-5 pt-4 pb-8 flex items-center gap-3 relative overflow-hidden shrink-0"
        style={{ background: "linear-gradient(135deg, var(--accent-dark) 0%, var(--accent) 100%)", boxShadow: "var(--shadow-card)", zIndex: 10 }}
      >
        <div style={{ position: "absolute", right: -20, top: -30, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.07)" }} />
        <div style={{ position: "absolute", right: 50, bottom: -20, width: 70, height: 70, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
        <Link
          href="/home"
          className="w-8 h-8 rounded-xl flex items-center justify-center relative"
          style={{ background: "rgba(255,255,255,0.18)", color: "#fff" }}
        >
          <ArrowLeft size={16} />
        </Link>
        <h1 className="text-base font-semibold text-white relative" style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>Sozlamalar</h1>
      </div>

      {/* Content */}
      <div className="bg-grid flex-1 mt-2 overflow-y-auto" style={{ borderRadius: "var(--radius-lg) var(--radius-lg) 0 0" }}>
        <div className="px-4 pt-10 pb-28 max-w-lg mx-auto w-full">

          <div className="p-4 flex flex-col gap-5"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)", borderRadius: "var(--radius-lg)" }}>

            {/* Profile */}
            <div
              className="card-3d p-4 flex items-center gap-3"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border-light)", borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-card)" }}
            >
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              <div className="relative shrink-0 group cursor-pointer" onClick={() => fileRef.current?.click()}>
                <div
                  className="overflow-hidden flex items-center justify-center text-white"
                  style={{ width: 64, height: 64, minWidth: 64, minHeight: 64, background: "linear-gradient(135deg, var(--accent-dark) 0%, var(--accent) 100%)", borderRadius: "var(--radius-md)" }}
                >
                  {user?.avatarUrl
                    ? <img src={user.avatarUrl} alt={user.name} style={{ width: 64, height: 64, objectFit: "cover" }} />
                    : <User size={28} color="white" />
                  }
                </div>
                <div
                  className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: "var(--text-primary)", color: "var(--bg-card)" }}
                >
                  <Pencil size={10} />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                  {user?.name ?? ""}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                  {user?.role === "student" ? "Student" : "O'qituvchi"}
                </p>
                <p className="text-[10px] font-bold mt-0.5" style={{ color: PLAN_META[planKey]?.color ?? "var(--text-muted)" }}>
                  {PLAN_META[planKey]?.label ?? "Free"}
                </p>
              </div>
              <ChevronRight size={15} style={{ color: "var(--border)" }} />
            </div>

            {/* Billing & Support */}
            <Section title="Billing & Yordam">
              <Row icon={CreditCard} label="Billing" sub="Joriy reja va to'lov" onClick={() => router.push("/billing")} />
              <Row icon={Layers} label="Tarif rejalar" sub="Rejangizni o'zgartiring" onClick={() => router.push("/plans")} />
              <Row icon={MessageSquare} label="Bog'lanish" sub="Yordam markazi" onClick={() => router.push("/contact")} />
              <Row icon={HelpCircle} label="Ko'p so'raladigan savollar" sub="FAQ" last onClick={() => router.push("/faq")} />
            </Section>

            {/* Asosiy */}
            <Section title="Asosiy">
              <Row icon={User} label="Profil ma'lumotlari" sub="Ism, rasm, bio" />
              <Row icon={Lock} label="Parol o'zgartirish" last />
            </Section>

            {/* Ko'rinish */}
            <Section title="Ko'rinish">
              <Row
                icon={dark ? Sun : Moon}
                label={dark ? "Yorug' rejim" : "Qorong'u rejim"}
                right={<Toggle on={dark} onChange={toggleDark} />}
              />
              <div
                className="flex items-center gap-3 px-4 py-3.5"
              >
                <Globe size={17} className="shrink-0" style={{ color: "var(--text-muted)" }} />
                <span className="flex-1 text-sm font-medium" style={{ color: "var(--text-primary)" }}>Til</span>
                <div className="flex gap-1">
                  {(["uz", "ru", "en"] as const).map((l) => (
                    <button
                      key={l}
                      onClick={() => setLang(l)}
                      className="text-xs px-2.5 py-1 font-medium transition-all"
                      style={{
                        borderRadius: "var(--radius-sm)",
                        background: lang === l ? "var(--accent)" : "var(--bg-primary)",
                        color: lang === l ? "#fff" : "var(--text-muted)",
                      }}
                    >
                      {l.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            </Section>

            {/* Bildirishnomalar */}
            <Section title="Bildirishnomalar">
              <Row
                icon={Bell}
                label="Push bildirishnomalar"
                sub="Tekshirish tayyor bo'lganda"
                right={<Toggle on={notif} onChange={() => setNotif(!notif)} />}
              />
              <Row icon={Shield} label="Ikki bosqichli himoya" sub="Hozircha o'chiq" last />
            </Section>

            {/* Hisob */}
            <Section title="Hisob">
              <Row icon={LogOut} label="Chiqish" danger onClick={handleLogout} />
              <Row icon={Trash2} label="Hisobni o'chirish" sub="Barcha ma'lumotlar o'chiriladi" danger last />
            </Section>

            <p className="text-center text-xs" style={{ color: "var(--border)" }}>
              Xoqon AI · v1.0.0
            </p>

          </div>
        </div>
      </div>
    </div>
  );
}
