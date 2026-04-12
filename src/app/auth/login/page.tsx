"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Mail, Phone } from "lucide-react";

type Tab = "gmail" | "phone";

export default function LoginPage() {
  const router = useRouter();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

  const [tab, setTab] = useState<Tab>("gmail");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ─── Email / Gmail flow ───
  async function handleEmailSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();

    if (!trimmed) {
      setError("Emailni kiriting");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("Email formati noto'g'ri");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${apiUrl}/api/auth/check-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Xatolik yuz berdi");
        return;
      }

      if (data.exists) {
        router.push(`/auth/password?mode=login&email=${encodeURIComponent(trimmed)}`);
      } else {
        setError("Bu email ro'yxatdan o'tmagan. Google orqali ro'yxatdan o'ting");
      }
    } catch {
      setError("Server bilan aloqa yo'q");
    } finally {
      setLoading(false);
    }
  }

  // ─── Phone flow (hozircha placeholder) ───
  async function handlePhoneSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = phone.trim();

    if (!trimmed) {
      setError("Telefon raqamini kiriting");
      return;
    }

    // TODO: SMS OTP implementatsiya
    setError("SMS OTP hali tayyor emas. Gmail orqali kiring");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-grid px-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div
            className="w-16 h-16 flex items-center justify-center mx-auto mb-4"
            style={{ background: "linear-gradient(135deg, var(--accent-dark) 0%, var(--accent) 100%)", boxShadow: "var(--shadow-card)", borderRadius: "var(--radius-md)" }}
          >
            <span className="text-white text-2xl font-bold">X</span>
          </div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>
            Xoqon AI
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            Uy ishlarini AI bilan tekshiring
          </p>
        </div>

        {/* Card */}
        <div
          className="card-3d p-6"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border-light)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-card)" }}
        >
          <h2 className="text-lg font-bold mb-1" style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>
            Kirish
          </h2>
          <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
            Hisobingizga kiring yoki ro'yxatdan o'ting
          </p>

          {/* Tab Menu */}
          <div
            className="flex mb-5 p-1"
            style={{ background: "var(--bg-primary)", borderRadius: "var(--radius-md)", border: "1px solid var(--border)" }}
          >
            <button
              onClick={() => { setTab("gmail"); setError(""); }}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold transition-all"
              style={{
                background: tab === "gmail" ? "var(--bg-card)" : "transparent",
                color: tab === "gmail" ? "var(--text-primary)" : "var(--text-muted)",
                borderRadius: "var(--radius-sm)",
                boxShadow: tab === "gmail" ? "var(--shadow-card)" : "none",
              }}
            >
              <Mail size={15} />
              Gmail
            </button>
            <button
              onClick={() => { setTab("phone"); setError(""); }}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold transition-all"
              style={{
                background: tab === "phone" ? "var(--bg-card)" : "transparent",
                color: tab === "phone" ? "var(--text-primary)" : "var(--text-muted)",
                borderRadius: "var(--radius-sm)",
                boxShadow: tab === "phone" ? "var(--shadow-card)" : "none",
              }}
            >
              <Phone size={15} />
              Telefon
            </button>
          </div>

          {/* Gmail Tab */}
          {tab === "gmail" && (
            <>
              <form onSubmit={handleEmailSubmit} className="flex flex-col gap-4 mb-4">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide mb-1.5 block" style={{ color: "var(--text-muted)" }}>
                    Email
                  </label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError(""); }}
                      placeholder="email@gmail.com"
                      autoFocus
                      className="w-full pl-10 pr-4 py-3 text-sm outline-none transition-all"
                      style={{
                        background: "var(--bg-primary)",
                        border: `1px solid ${error ? "var(--error)" : "var(--border)"}`,
                        color: "var(--text-primary)",
                        borderRadius: "var(--radius-md)",
                      }}
                    />
                  </div>
                </div>

                {error && (
                  <p className="text-xs -mt-2" style={{ color: "var(--error)" }}>{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 font-semibold text-sm transition-all hover:opacity-90 active:scale-95 flex items-center justify-center gap-2"
                  style={{
                    background: loading ? "var(--border)" : "var(--cta)",
                    color: loading ? "var(--text-muted)" : "#fff",
                    cursor: loading ? "not-allowed" : "pointer",
                    borderRadius: "var(--radius-md)",
                  }}
                >
                  {loading ? "Tekshirilmoqda..." : (
                    <>
                      Davom etish
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>yoki</span>
                <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
              </div>

              {/* Google OAuth */}
              <a
                href={`${apiUrl}/api/auth/google`}
                className="flex items-center justify-center gap-3 w-full py-3 px-4 font-semibold text-sm transition-all hover:opacity-90 active:scale-95"
                style={{
                  background: "var(--bg-primary)",
                  color: "var(--text-primary)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-md)",
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google bilan ro'yxatdan o'tish
              </a>
            </>
          )}

          {/* Phone Tab */}
          {tab === "phone" && (
            <form onSubmit={handlePhoneSubmit} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide mb-1.5 block" style={{ color: "var(--text-muted)" }}>
                  Telefon raqam
                </label>
                <div className="relative">
                  <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => { setPhone(e.target.value); setError(""); }}
                    placeholder="+998 90 123 45 67"
                    autoFocus
                    className="w-full pl-10 pr-4 py-3 text-sm outline-none transition-all"
                    style={{
                      background: "var(--bg-primary)",
                      border: `1px solid ${error ? "var(--error)" : "var(--border)"}`,
                      color: "var(--text-primary)",
                      borderRadius: "var(--radius-md)",
                    }}
                  />
                </div>
              </div>

              {error && (
                <p className="text-xs -mt-2" style={{ color: "var(--error)" }}>{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 font-semibold text-sm transition-all hover:opacity-90 active:scale-95 flex items-center justify-center gap-2"
                style={{
                  background: loading ? "var(--border)" : "var(--cta)",
                  color: loading ? "var(--text-muted)" : "#fff",
                  cursor: loading ? "not-allowed" : "pointer",
                  borderRadius: "var(--radius-md)",
                }}
              >
                {loading ? "Yuborilmoqda..." : (
                  <>
                    Kod yuborish
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          )}

          <p className="text-xs text-center mt-4" style={{ color: "var(--text-muted)" }}>
            Kirish orqali{" "}
            <span className="underline cursor-pointer">foydalanish shartlari</span>
            {" "}ga rozilik bildirasiz
          </p>
        </div>
      </div>
    </div>
  );
}
