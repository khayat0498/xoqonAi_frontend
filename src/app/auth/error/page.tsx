"use client";

import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { useT } from "@/lib/i18n-context";

export default function AuthErrorPage() {
  const router = useRouter();
  const { t } = useT();

  return (
    <div className="min-h-screen flex items-center justify-center bg-grid px-4">
      <div className="w-full max-w-sm">
        <div
          className="card-3d p-6 text-center"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border-light)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-card)" }}
        >
          <div
            className="w-12 h-12 flex items-center justify-center mx-auto mb-4"
            style={{ background: "var(--error-bg)", borderRadius: "var(--radius-md)" }}
          >
            <AlertCircle size={22} style={{ color: "var(--error)" }} />
          </div>

          <h2 className="text-lg font-bold mb-2" style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>
            {t("auth.errorTitle")}
          </h2>
          <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
            {t("auth.googleFailed")}
          </p>

          <button
            onClick={() => router.replace("/auth/login")}
            className="w-full py-3 font-semibold text-sm transition-all hover:opacity-90 active:scale-95"
            style={{ background: "var(--cta)", color: "#fff", borderRadius: "var(--radius-md)" }}
          >
            {t("auth.loginAgain")}
          </button>
        </div>
      </div>
    </div>
  );
}
