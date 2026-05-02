"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, ArrowLeft, Building2, Mail, Lock, User, ShieldCheck } from "lucide-react";
import { setToken } from "@/lib/auth";

type Step = "info" | "verify" | "password" | "done";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export default function RegisterTenantPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("info");

  const [tenantName, setTenantName] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");

  const [tempToken, setTempToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ── Step 1: ma'lumotlar + email kod yuborish ──
  async function handleInfoSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const tn = tenantName.trim();
    const n = name.trim();
    const em = email.trim().toLowerCase();

    if (tn.length < 3) return setError("Tashkilot nomi kamida 3 ta belgi");
    if (n.length < 2) return setError("Ismingizni kiriting");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) return setError("Email noto'g'ri");

    setLoading(true);
    try {
      // Email allaqachon bormi
      const checkRes = await fetch(`${API}/api/auth/check-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: em }),
      });
      const checkData = await checkRes.json();
      if (!checkRes.ok) return setError(checkData.error ?? "Xatolik");
      if (checkData.exists) return setError("Bu email allaqachon ro'yxatdan o'tgan");

      // Kod yuborish
      const sendRes = await fetch(`${API}/api/auth/send-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: em }),
      });
      const sendData = await sendRes.json();
      if (!sendRes.ok) return setError(sendData.error ?? "Kod yuborib bo'lmadi");

      setStep("verify");
    } catch {
      setError("Server bilan bog'lanib bo'lmadi");
    } finally {
      setLoading(false);
    }
  }

  // ── Step 2: kod tasdiqlash ──
  async function handleVerifySubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (code.length !== 6) return setError("6 xonali kod kiriting");

    setLoading(true);
    try {
      const res = await fetch(`${API}/api/auth/verify-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), code }),
      });
      const data = await res.json();
      if (!res.ok || !data.verified) return setError(data.error ?? "Kod noto'g'ri");
      if (data.exists) return setError("Bu email allaqachon ro'yxatdan o'tgan");

      setTempToken(data.tempToken);
      setStep("password");
    } catch {
      setError("Server bilan bog'lanib bo'lmadi");
    } finally {
      setLoading(false);
    }
  }

  // ── Step 3: parol o'rnatish + tenant register ──
  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) return setError("Parol kamida 8 ta belgi");
    if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) {
      return setError("Parolda katta harf, kichik harf va raqam bo'lishi kerak");
    }
    if (password !== password2) return setError("Parollar mos emas");

    setLoading(true);
    try {
      const res = await fetch(`${API}/api/auth/register-tenant`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tempToken,
          password,
          name: name.trim(),
          tenantName: tenantName.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error ?? "Xatolik");

      setToken(data.token);
      setStep("done");
    } catch {
      setError("Server bilan bog'lanib bo'lmadi");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-grid px-4 py-8">
      <div
        className="w-full max-w-md p-8 rounded-3xl"
        style={{
          background: "var(--bg-card-solid)",
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow-clay)",
        }}
      >
        {/* Header */}
        <div className="text-center mb-7">
          <div
            className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: "var(--accent-light)", color: "var(--accent)" }}
          >
            <Building2 size={26} />
          </div>
          <h1 className="text-2xl font-bold mb-1.5" style={{ color: "var(--text-primary)" }}>
            Tashkilot uchun ro'yxat
          </h1>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            {step === "info" && "Tashkilot ma'lumotlarini to'ldiring"}
            {step === "verify" && `${email} ga kod yubordik`}
            {step === "password" && "Parol o'rnating"}
            {step === "done" && "Ro'yxatdan muvaffaqiyatli o'tdingiz"}
          </p>
        </div>

        {/* Stepper */}
        {step !== "done" && (
          <div className="flex items-center justify-center gap-2 mb-6">
            {(["info", "verify", "password"] as Step[]).map((s, i) => {
              const idx = ["info", "verify", "password"].indexOf(step);
              const active = i <= idx;
              return (
                <div
                  key={s}
                  className="h-1.5 flex-1 rounded-full transition-colors"
                  style={{ background: active ? "var(--accent)" : "var(--border)" }}
                />
              );
            })}
          </div>
        )}

        {/* Error */}
        {error && (
          <div
            className="mb-4 p-3 rounded-xl text-sm flex items-start gap-2"
            style={{ background: "var(--error-bg)", color: "var(--error)" }}
          >
            <span>{error}</span>
          </div>
        )}

        {/* Step 1: Info */}
        {step === "info" && (
          <form onSubmit={handleInfoSubmit} className="space-y-4">
            <Field label="Tashkilot nomi" icon={<Building2 size={16} />}>
              <input
                value={tenantName}
                onChange={(e) => setTenantName(e.target.value)}
                placeholder="Toshkent maktab №42"
                className="clay-input w-full px-4 py-3 text-sm outline-none"
                disabled={loading}
                autoFocus
              />
            </Field>
            <Field label="Ismingiz" icon={<User size={16} />}>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Aliya Karimova"
                className="clay-input w-full px-4 py-3 text-sm outline-none"
                disabled={loading}
              />
            </Field>
            <Field label="Email" icon={<Mail size={16} />}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="aliya@example.com"
                className="clay-input w-full px-4 py-3 text-sm outline-none"
                disabled={loading}
              />
            </Field>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50 transition-transform hover:-translate-y-0.5"
              style={{ background: "var(--accent)", boxShadow: "var(--shadow-clay-sm)" }}
            >
              {loading ? "Yuborilmoqda..." : <>Davom etish <ArrowRight size={16} /></>}
            </button>

            <p className="text-center text-sm" style={{ color: "var(--text-secondary)" }}>
              Mustaqil foydalanuvchimisiz?{" "}
              <Link href="/auth/login" className="font-semibold" style={{ color: "var(--accent)" }}>
                Oddiy hisob
              </Link>
            </p>
          </form>
        )}

        {/* Step 2: Verify */}
        {step === "verify" && (
          <form onSubmit={handleVerifySubmit} className="space-y-4">
            <Field label="Tasdiqlash kodi (6 raqam)" icon={<ShieldCheck size={16} />}>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="123456"
                className="clay-input w-full px-4 py-3 text-center text-2xl tracking-[0.4em] font-mono outline-none"
                disabled={loading}
                autoFocus
                maxLength={6}
              />
            </Field>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep("info")}
                className="px-4 py-3 rounded-xl font-medium flex items-center gap-1"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}
              >
                <ArrowLeft size={16} /> Orqaga
              </button>
              <button
                type="submit"
                disabled={loading || code.length !== 6}
                className="flex-1 py-3 rounded-xl font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ background: "var(--accent)" }}
              >
                {loading ? "Tasdiqlanmoqda..." : <>Tasdiqlash <ArrowRight size={16} /></>}
              </button>
            </div>
          </form>
        )}

        {/* Step 3: Password */}
        {step === "password" && (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <Field label="Parol" icon={<Lock size={16} />}>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Kamida 8 ta belgi"
                className="clay-input w-full px-4 py-3 text-sm outline-none"
                disabled={loading}
                autoFocus
              />
            </Field>
            <Field label="Parolni takrorlang" icon={<Lock size={16} />}>
              <input
                type="password"
                value={password2}
                onChange={(e) => setPassword2(e.target.value)}
                placeholder="Yana bir marta"
                className="clay-input w-full px-4 py-3 text-sm outline-none"
                disabled={loading}
              />
            </Field>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Katta harf, kichik harf va raqam bo'lishi shart.
            </p>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-white disabled:opacity-50"
              style={{ background: "var(--accent)", boxShadow: "var(--shadow-clay-sm)" }}
            >
              {loading ? "Yaratilmoqda..." : "Hisob yaratish"}
            </button>
          </form>
        )}

        {/* Step 4: Done — pending message */}
        {step === "done" && (
          <div className="text-center space-y-5">
            <div
              className="w-16 h-16 rounded-full mx-auto flex items-center justify-center"
              style={{ background: "var(--warning-bg)", color: "var(--warning)" }}
            >
              <ShieldCheck size={28} />
            </div>
            <div>
              <h2 className="text-lg font-bold mb-2" style={{ color: "var(--text-primary)" }}>
                Tasdiqlash kutilmoqda
              </h2>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                Tashkilotingiz admin tomonidan tekshirilmoqda. Tasdiqlangach panelga kira olasiz.
              </p>
            </div>
            <button
              onClick={() => router.push("/direktor")}
              className="w-full py-3 rounded-xl font-semibold text-white"
              style={{ background: "var(--accent)" }}
            >
              Panelga o'tish
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  icon,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span
        className="text-xs font-semibold uppercase tracking-wider mb-1.5 flex items-center gap-1.5"
        style={{ color: "var(--text-muted)" }}
      >
        {icon} {label}
      </span>
      {children}
    </label>
  );
}
