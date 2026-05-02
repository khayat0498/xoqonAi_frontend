"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, ArrowLeft, Lock } from "lucide-react";
import { setToken, landingForRole } from "@/lib/auth";
import { useT } from "@/lib/i18n-context";

function validatePassword(pw: string, t: (k: string) => string): string | null {
  if (pw.length < 8) return t("auth.errors.passwordTooShort");
  if (!/[a-z]/.test(pw)) return t("auth.errors.passwordNoLower");
  if (!/[A-Z]/.test(pw)) return t("auth.errors.passwordNoUpper");
  if (!/\d/.test(pw)) return t("auth.errors.passwordNoDigit");
  return null;
}

function PasswordForm() {
  const router = useRouter();
  const { t } = useT();
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
    if (mode === "login") {
      if (!emailParam) {
        router.replace("/auth/login");
        return;
      }
      setEmail(emailParam);
      return;
    }

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

    if (mode === "login") {
      if (!password) {
        setError(t("auth.errors.passwordRequired"));
        return;
      }
    } else {
      const pwError = validatePassword(password, t);
      if (pwError) {
        setError(pwError);
        return;
      }
      if (password !== confirm) {
        setError(t("auth.errors.passwordMismatch"));
        return;
      }
    }

    setLoading(true);
    setError("");

    try {
      if (mode === "login") {
        const res = await fetch(`${apiUrl}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? t("auth.errors.wrongPassword"));
          return;
        }

        setToken(data.token);
        router.replace(landingForRole(data.user?.role));
      } else {
        const res = await fetch(`${apiUrl}/api/auth/complete`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tempToken, password, mode }),
        });

        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? t("auth.errors.generic"));
          return;
        }

        setToken(data.token);
        router.replace(landingForRole(data.user?.role));
      }
    } catch {
      setError(t("auth.errors.serverDown"));
    } finally {
      setLoading(false);
    }
  }

  const title = mode === "signup" ? t("auth.setPassword") : mode === "reset" ? t("auth.newPasswordTitle") : t("auth.enterPasswordTitle");
  const subtitle = mode === "signup" ? t("auth.setPasswordSub") : mode === "reset" ? t("auth.resetPasswordSub") : t("auth.loginPasswordSub");
  const btnLabel = mode === "signup" ? t("auth.register") : mode === "reset" ? t("auth.updatePassword") : t("auth.login");

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
          {t("common.back")}
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
                {t("auth.email")}
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
                {t("auth.password")}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  placeholder={mode === "login" ? t("auth.passwordPlaceholder") : t("auth.minCharsHint")}
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

            {/* Confirm password */}
            {(mode === "signup" || mode === "reset") && (
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide mb-1.5 block" style={{ color: "var(--text-muted)" }}>
                  {t("auth.confirmPassword")}
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={confirm}
                    onChange={(e) => { setConfirm(e.target.value); setError(""); }}
                    placeholder={t("auth.confirmPlaceholder")}
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
              {loading ? t("common.loading") : btnLabel}
            </button>

            {/* Forgot password — login mode only */}
            {mode === "login" && (
              <a
                href={`${apiUrl}/api/auth/google/reset`}
                className="text-sm text-center transition-opacity hover:opacity-70"
                style={{ color: "var(--text-muted)" }}
              >
                {t("auth.forgotPassword")}
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
