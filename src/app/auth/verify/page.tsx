"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ShieldCheck } from "lucide-react";

function VerifyForm() {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get("email") ?? "";
  const purpose = params.get("purpose") ?? "signup"; // signup | restore

  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendTimer, setResendTimer] = useState(60);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

  useEffect(() => {
    if (!email) {
      router.replace("/auth/login");
    }
  }, [email, router]);

  // Countdown timer
  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => setResendTimer((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  function handleChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);
    setError("");

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all filled
    if (newCode.every((d) => d !== "")) {
      handleVerify(newCode.join(""));
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      const newCode = pasted.split("");
      setCode(newCode);
      inputRefs.current[5]?.focus();
      handleVerify(pasted);
    }
  }

  async function handleVerify(fullCode: string) {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${apiUrl}/api/auth/verify-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: fullCode }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Kod noto'g'ri");
        setCode(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
        return;
      }

      if (data.exists) {
        // User exists — go to password (login or reset)
        router.push(`/auth/password?mode=${purpose === "restore" ? "reset" : "login"}&email=${encodeURIComponent(email)}`);
      } else {
        // New user — go to set password (signup)
        router.push(`/auth/password?mode=signup&temp=${data.tempToken}`);
      }
    } catch {
      setError("Server bilan aloqa yo'q");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (resendTimer > 0) return;

    try {
      const res = await fetch(`${apiUrl}/api/auth/send-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setResendTimer(60);
        setError("");
      } else {
        const data = await res.json();
        setError(data.error ?? "Xatolik yuz berdi");
      }
    } catch {
      setError("Server bilan aloqa yo'q");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-grid px-4">
      <div className="w-full max-w-sm">

        {/* Back */}
        <button
          onClick={() => router.back()}
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
            <ShieldCheck size={20} style={{ color: "var(--accent)" }} />
          </div>

          <h2 className="text-lg font-bold mb-1" style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>
            Kodni kiriting
          </h2>
          <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
            <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{email}</span> ga 6 xonali kod yuborildi
          </p>

          {/* Code inputs */}
          <div className="flex gap-2 justify-center mb-4" onPaste={handlePaste}>
            {code.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { inputRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                autoFocus={i === 0}
                className="w-12 h-14 text-center text-xl font-bold outline-none transition-all"
                style={{
                  background: "var(--bg-primary)",
                  border: `2px solid ${error ? "var(--error)" : digit ? "var(--accent)" : "var(--border)"}`,
                  color: "var(--text-primary)",
                  borderRadius: "var(--radius-md)",
                }}
              />
            ))}
          </div>

          {error && (
            <p className="text-xs text-center mb-4" style={{ color: "var(--error)" }}>{error}</p>
          )}

          {loading && (
            <p className="text-xs text-center mb-4" style={{ color: "var(--text-muted)" }}>Tekshirilmoqda...</p>
          )}

          {/* Resend */}
          <div className="text-center">
            {resendTimer > 0 ? (
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Qayta yuborish: {resendTimer}s
              </p>
            ) : (
              <button
                onClick={handleResend}
                className="text-xs font-semibold transition-opacity hover:opacity-70"
                style={{ color: "var(--accent)" }}
              >
                Kodni qayta yuborish
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense>
      <VerifyForm />
    </Suspense>
  );
}
