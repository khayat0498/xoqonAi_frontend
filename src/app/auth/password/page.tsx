"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, ArrowLeft, Lock } from "lucide-react";
import { setToken } from "@/lib/auth";

function PasswordForm() {
  const router = useRouter();
  const params = useSearchParams();

  const tempToken = params.get("temp") ?? "";
  const rawMode = params.get("mode");
  const mode: "login" | "signup" | "reset" =
    rawMode === "signup" ? "signup" : rawMode === "reset" ? "reset" : "login";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

  useEffect(() => {
    if (!tempToken) {
      router.replace("/auth/login");
      return;
    }
    try {
      const payload = JSON.parse(atob(tempToken.split(".")[1]));
      setEmail(payload.email ?? "");
    } catch {
      router.replace("/auth/login");
    }
  }, [tempToken, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!password || password.length < 6) {
      setError("Parol kamida 6 ta belgidan iborat bo'lishi kerak");
      return;
    }
    if ((mode === "signup" || mode === "reset") && password !== confirm) {
      setError("Parollar mos kelmadi");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${apiUrl}/api/auth/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tempToken, password, mode }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Xatolik yuz berdi");
        return;
      }

      setToken(data.token);
      router.replace("/home");
    } catch {
      setError("Server bilan aloqa yo'q");
    } finally {
      setLoading(false);
    }
  }

  const title = mode === "signup" ? "Parol o'rnating" : mode === "reset" ? "Yangi parol" : "Parolni kiriting";
  const subtitle =
    mode === "signup"
      ? "Hisobingiz uchun parol o'rnating"
      : mode === "reset"
      ? "Google orqali tasdiqlandingiz. Yangi parol o'rnating"
      : "Hisobingizga kirish uchun parolni kiriting";
  const btnLabel = mode === "signup" ? "Ro'yxatdan o'tish" : mode === "reset" ? "Parolni yangilash" : "Kirish";

  return (
    <div className="min-h-screen flex items-center justify-center bg-grid px-4">
      <div className="w-full max-w-sm">

        {/* Back */}
        <button
          onClick={() => router.replace("/auth/login")}
          className="flex items-center gap-1.5 text-sm mb-6 transition-opacity hover:opacity-70"
          style={{ color: "var(--text-muted)" }}
        >
          <ArrowLeft size={16} />
          Orqaga
        </button>

        {/* Card */}
        <div
          className="card-3d rounded-3xl p-6"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
        >
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: "var(--accent-light)" }}
          >
            <Lock size={20} style={{ color: "var(--accent)" }} />
          </div>

          <h2 className="text-lg font-bold mb-1" style={{ color: "var(--text-primary)" }}>{title}</h2>
          <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>{subtitle}</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            {/* Email */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide mb-1.5 block" style={{ color: "var(--text-muted)" }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                disabled
                className="w-full px-4 py-3 rounded-2xl text-sm font-medium"
                style={{
                  background: "var(--accent-light)",
                  border: "1px solid var(--border)",
                  color: "var(--text-secondary)",
                  cursor: "not-allowed",
                }}
              />
            </div>

            {/* Password */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide mb-1.5 block" style={{ color: "var(--text-muted)" }}>
                Parol
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Kamida 6 ta belgi"
                  autoFocus
                  className="w-full px-4 py-3 pr-12 rounded-2xl text-sm outline-none transition-all"
                  style={{
                    background: "var(--bg-primary)",
                    border: `1px solid ${error ? "var(--error)" : "var(--border)"}`,
                    color: "var(--text-primary)",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-70"
                  style={{ color: "var(--text-muted)" }}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {/* Confirm password — signup va reset uchun */}
            {(mode === "signup" || mode === "reset") && (
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide mb-1.5 block" style={{ color: "var(--text-muted)" }}>
                  Parolni tasdiqlang
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Parolni qayta kiriting"
                    className="w-full px-4 py-3 pr-12 rounded-2xl text-sm outline-none transition-all"
                    style={{
                      background: "var(--bg-primary)",
                      border: `1px solid ${error ? "var(--error)" : "var(--border)"}`,
                      color: "var(--text-primary)",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-70"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {showConfirm ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>
            )}

            {error && (
              <p className="text-xs -mt-2" style={{ color: "var(--error)" }}>{error}</p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-2xl font-semibold text-sm transition-all hover:opacity-90 active:scale-95"
              style={{
                background: loading ? "var(--border)" : "var(--text-primary)",
                color: loading ? "var(--text-muted)" : "var(--bg-card)",
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Yuklanmoqda..." : btnLabel}
            </button>

            {/* Parolni unutdim — faqat login modeda */}
            {mode === "login" && (
              <a
                href={`${apiUrl}/api/auth/google/reset`}
                className="text-sm text-center transition-opacity hover:opacity-70"
                style={{ color: "var(--text-muted)" }}
              >
                Parolni unutdingizmi?
              </a>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

export default function PasswordPage() {
  return (
    <Suspense>
      <PasswordForm />
    </Suspense>
  );
}
