"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, Building2, ArrowLeft, Loader2 } from "lucide-react";
import { getToken, removeToken } from "@/lib/auth";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

function authHeaders() {
  return { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` };
}

type Step = "pick" | "tenant-choice" | "tenant-create" | "tenant-join";

export default function OnboardingRolePage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("pick");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tenantName, setTenantName] = useState("");
  const [inviteCode, setInviteCode] = useState("");

  const chooseTeacher = async () => {
    setLoading(true); setError("");
    try {
      const res = await fetch(`${API}/api/users/me/onboard-teacher`, {
        method: "POST", headers: authHeaders(),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error ?? "Xato");
        setLoading(false);
        return;
      }
      router.replace("/home");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Tarmoq xatosi");
      setLoading(false);
    }
  };

  const createTenant = async () => {
    if (tenantName.trim().length < 3) return setError("Tashkilot nomi kamida 3 ta belgi");
    setLoading(true); setError("");
    try {
      const res = await fetch(`${API}/api/tenant/create`, {
        method: "POST", headers: authHeaders(),
        body: JSON.stringify({ tenantName: tenantName.trim() }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error ?? "Xato");
        setLoading(false);
        return;
      }
      router.replace("/direktor");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Tarmoq xatosi");
      setLoading(false);
    }
  };

  const joinTenant = async () => {
    if (!inviteCode.trim()) return setError("Kodni kiriting");
    setLoading(true); setError("");
    try {
      const res = await fetch(`${API}/api/tenant/join`, {
        method: "POST", headers: authHeaders(),
        body: JSON.stringify({ inviteCode: inviteCode.trim() }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error ?? "Xato");
        setLoading(false);
        return;
      }
      // Onboarding'ni ham tugatamiz (xodim sifatida)
      await fetch(`${API}/api/users/me/onboard-teacher`, {
        method: "POST", headers: authHeaders(),
      }).catch(() => {});
      router.replace("/home");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Tarmoq xatosi");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg-primary)" }}>
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md">

          {/* Back button (sub-steplar uchun) */}
          {step !== "pick" && (
            <button
              onClick={() => { setStep(step === "tenant-create" || step === "tenant-join" ? "tenant-choice" : "pick"); setError(""); }}
              className="mb-4 flex items-center gap-2 text-sm"
              style={{ color: "var(--text-muted)" }}
            >
              <ArrowLeft size={14} /> Orqaga
            </button>
          )}

          {/* PICK: O'qituvchi vs Tashkilot */}
          {step === "pick" && (
            <>
              <h1 className="text-2xl font-bold mb-2 text-center" style={{ color: "var(--text-primary)" }}>
                Xush kelibsiz!
              </h1>
              <p className="text-sm mb-8 text-center" style={{ color: "var(--text-muted)" }}>
                Saytdan qanday foydalanmoqchisiz?
              </p>

              <div className="flex flex-col gap-3">
                <button
                  onClick={chooseTeacher}
                  disabled={loading}
                  className="p-5 rounded-2xl flex items-center gap-4 transition-all hover:opacity-90 text-left"
                  style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
                >
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: "var(--accent-light)" }}>
                    <GraduationCap size={22} style={{ color: "var(--accent)" }} />
                  </div>
                  <div className="flex-1">
                    <p className="text-base font-bold" style={{ color: "var(--text-primary)" }}>O'qituvchi sifatida</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Sinflar yaratish, talabalarni boshqarish, ishlarni tekshirish</p>
                  </div>
                </button>

                <button
                  onClick={() => { setStep("tenant-choice"); setError(""); }}
                  disabled={loading}
                  className="p-5 rounded-2xl flex items-center gap-4 transition-all hover:opacity-90 text-left"
                  style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
                >
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(124,58,237,0.1)" }}>
                    <Building2 size={22} style={{ color: "#7C3AED" }} />
                  </div>
                  <div className="flex-1">
                    <p className="text-base font-bold" style={{ color: "var(--text-primary)" }}>Tashkilot</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>O'quv markazi, maktab, kurs — xodimlarni boshqarish</p>
                  </div>
                </button>
              </div>
            </>
          )}

          {/* TENANT CHOICE: yangi vs qo'shilish */}
          {step === "tenant-choice" && (
            <>
              <h2 className="text-xl font-bold mb-2 text-center" style={{ color: "var(--text-primary)" }}>Tashkilot</h2>
              <p className="text-sm mb-6 text-center" style={{ color: "var(--text-muted)" }}>Yangi tashkilot ochasizmi yoki mavjudga qo'shilasizmi?</p>

              <div className="flex flex-col gap-3">
                <button
                  onClick={() => { setStep("tenant-create"); setError(""); }}
                  className="p-4 rounded-2xl text-left transition-all hover:opacity-90"
                  style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
                >
                  <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>🏢 Yangi tashkilot ochish</p>
                  <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Direktor sifatida o'z tashkilotingizni yarating</p>
                </button>

                <button
                  onClick={() => { setStep("tenant-join"); setError(""); }}
                  className="p-4 rounded-2xl text-left transition-all hover:opacity-90"
                  style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
                >
                  <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>🔑 Mavjud tashkilotga qo'shilish</p>
                  <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Direktoringizdan olgan kod orqali</p>
                </button>
              </div>
            </>
          )}

          {/* TENANT CREATE */}
          {step === "tenant-create" && (
            <>
              <h2 className="text-xl font-bold mb-2 text-center" style={{ color: "var(--text-primary)" }}>Yangi tashkilot</h2>
              <p className="text-sm mb-6 text-center" style={{ color: "var(--text-muted)" }}>Tashkilotingiz nomini kiriting. So'rov adminga yuboriladi.</p>

              <input
                type="text"
                placeholder="Tashkilot nomi"
                value={tenantName}
                onChange={e => setTenantName(e.target.value)}
                className="w-full p-3 rounded-xl text-sm outline-none mb-3"
                style={{ background: "var(--bg-card)", color: "var(--text-primary)", border: "1px solid var(--border)" }}
              />
              <button
                onClick={createTenant}
                disabled={loading}
                className="w-full p-3 rounded-xl text-sm font-bold transition-all"
                style={{ background: "var(--accent)", color: "#fff", opacity: loading ? 0.6 : 1 }}
              >
                {loading ? "Yaratilmoqda..." : "Tashkilot yaratish"}
              </button>
            </>
          )}

          {/* TENANT JOIN */}
          {step === "tenant-join" && (
            <>
              <h2 className="text-xl font-bold mb-2 text-center" style={{ color: "var(--text-primary)" }}>Tashkilotga qo'shilish</h2>
              <p className="text-sm mb-6 text-center" style={{ color: "var(--text-muted)" }}>Direktoringizdan olgan invite kodni kiriting.</p>

              <input
                type="text"
                placeholder="INVITE-CODE"
                value={inviteCode}
                onChange={e => setInviteCode(e.target.value.toUpperCase())}
                className="w-full p-3 rounded-xl text-sm outline-none mb-3 font-mono"
                style={{ background: "var(--bg-card)", color: "var(--text-primary)", border: "1px solid var(--border)" }}
              />
              <button
                onClick={joinTenant}
                disabled={loading}
                className="w-full p-3 rounded-xl text-sm font-bold transition-all"
                style={{ background: "var(--accent)", color: "#fff", opacity: loading ? 0.6 : 1 }}
              >
                {loading ? "Tekshirilmoqda..." : "Qo'shilish"}
              </button>
            </>
          )}

          {error && (
            <p className="mt-4 text-sm text-center" style={{ color: "var(--error)" }}>{error}</p>
          )}

          {/* Logout link */}
          <button
            onClick={() => { removeToken(); router.replace("/auth/login"); }}
            className="mt-8 w-full text-xs text-center"
            style={{ color: "var(--text-muted)" }}
          >
            Boshqa hisob bilan kirish
          </button>
        </div>
      </div>
    </div>
  );
}
