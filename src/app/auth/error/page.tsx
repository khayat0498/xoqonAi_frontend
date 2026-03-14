"use client";

import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";

export default function AuthErrorPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-grid px-4">
      <div className="w-full max-w-sm">
        <div
          className="card-3d rounded-3xl p-6 text-center"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
        >
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: "#fff1f2" }}
          >
            <AlertCircle size={22} style={{ color: "var(--error)" }} />
          </div>

          <h2 className="text-lg font-bold mb-2" style={{ color: "var(--text-primary)" }}>
            Xatolik yuz berdi
          </h2>
          <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
            Google orqali kirish muvaffaqiyatsiz tugadi. Qaytadan urinib ko'ring.
          </p>

          <button
            onClick={() => router.replace("/auth/login")}
            className="w-full py-3 rounded-2xl font-semibold text-sm transition-all hover:opacity-90 active:scale-95"
            style={{ background: "var(--text-primary)", color: "var(--bg-card)" }}
          >
            Qaytadan kirish
          </button>
        </div>
      </div>
    </div>
  );
}
