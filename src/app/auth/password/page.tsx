"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, ArrowLeft, Lock } from "lucide-react";
import { setToken } from "@/lib/auth";

function validatePassword(pw: string): string | null {
  if (pw.length < 8) return "Parol kamida 8 ta belgidan iborat bo'lishi kerak";
  if (!/[a-z]/.test(pw)) return "Parolda kichik harf bo'lishi kerak";
  if (!/[A-Z]/.test(pw)) return "Parolda katta harf bo'lishi kerak";
  if (!/\d/.test(pw)) return "Parolda raqam bo'lishi kerak";
  return null;
}

function PasswordForm() {
  const router = useRouter();
  const params = useSearchParams();

  const tempToken = params.get("temp") ?? "";
  const rawMode = params.get("mode");
  const emailParam = params.get("email") ?? "";
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
    // Login mode uses email from query param
    if (mode === "login") {
      if (!emailParam) {
        router.replace("/auth/login");
        return;
      }
      setEmail(emailParam);
      return;
    }

    // Signup/reset mode uses temp token
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
  }, [tempToken, emailParam, mode, router]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    // Login mode — only check non-empty
    if (mode === "login") {
      if (!password) {
        setError("Parolni kiriting");
        return;
      }
    } else {
      // Signup/reset — strong password validation
      const pwError = validatePassword(password);
      if (pwError) {
        setError(pwError);
        return;
      }
      if (password !== confirm) {
        setError("Parollar mos kelmadi");
        return;
      }
    }

    setLoading(true);
    setError("");

    try {
      if (mode === "login") {
        // Direct login with email + password
        const res = await fetch(`${apiUrl}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Parol noto'g'ri");
          return;
        }

        setToken(data.token);
        router.replace("/home");
      } else {
        // Signup or reset — use temp token
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
      }
    } catch {
      setError("Server bilan aloqa yo'q");
    } finally {
      setLoading(false);
    }
  }

  const title = mode === "signup" ? "Parol o'rnating" : mode === "reset" ? "Yangi parol" : "Parolni kiriting";
  const subtitle =
    mode === "signup"
      ? "Hisobingiz uchun parol o'rnating (kamida 8 ta belgi, katta-kichik harf va raqam)"
      : mode === "reset"
      ? "Yangi parol o'rnating (kamida 8 ta belgi, katta-kichik harf va raqam)"
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
          className="card-3d p-6"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border-light)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-card)" }}
        >
          <div
            className="w-12 h-12 flex items-center justify-center mb-4"
            style={{ background: "var(--accent-light)", borderRadius: "var(--radius-md)" }}
          >
            <Lock size={20} style={{ color: "var(--accent)" }} />
          </div>

          <h2 className="text-lg font-bold mb-1" style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>{title}</h2>
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
                className="w-full px-4 py-3 text-sm font-medium"
                style={{
                  background: "var(--accent-light)",
                  border: "1px solid var(--border)",
                  color: "var(--text-secondary)",
                  cursor: "not-allowed",
                  borderRadius: "var(--radius-md)",
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
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  placeholder={mode === "login" ? "Parolni kiriting" : "Kamida 8 ta belgi"}
                  autoFocus
                  className="w-full px-4 py-3 pr-12 text-sm outline-none transition-all"
                  style={{
                    background: "var(--bg-primary)",
                    border: `1px solid ${error ? "var(--error)" : "var(--border)"}`,
                    color: "var(--text-primary)",
                    borderRadius: "var(--radius-md)",
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
                    onChange={(e) => { setConfirm(e.target.value); setError(""); }}
                    placeholder="Parolni qayta kiriting"
                    className="w-full px-4 py-3 pr-12 text-sm outline-none transition-all"
                    style={{
                      background: "var(--bg-primary)",
                      border: `1px solid ${error ? "var(--error)" : "var(--border)"}`,
                      color: "var(--text-primary)",
                      borderRadius: "var(--radius-md)",
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
              className="w-full py-3 font-semibold text-sm transition-all hover:opacity-90 active:scale-95"
              style={{
                background: loading ? "var(--border)" : "var(--cta)",
                color: loading ? "var(--text-muted)" : "#fff",
                cursor: loading ? "not-allowed" : "pointer",
                borderRadius: "var(--radius-md)",
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
