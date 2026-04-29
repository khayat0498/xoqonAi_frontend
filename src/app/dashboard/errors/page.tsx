"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { useT } from "@/lib/i18n-context";

export default function ErrorBankPage() {
  const router = useRouter();
  const { t } = useT();

  return (
    <div className="flex flex-col h-screen" style={{ background: "var(--bg-primary)" }}>
      <div
        className="shrink-0 px-5 py-4 flex items-center gap-3 relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, var(--accent-dark) 0%, var(--accent) 60%, var(--accent-hover) 100%)",
          boxShadow: "6px 6px 14px rgba(53,120,136,0.25), inset -2px -2px 6px rgba(0,0,0,0.08), inset 2px 2px 6px rgba(255,255,255,0.12)",
        }}
      >
        <div style={{ position: "absolute", right: -25, top: -30, width: 100, height: 100, borderRadius: "50%", background: "rgba(255,255,255,0.12)", pointerEvents: "none" }} />
        <button onClick={() => router.back()}
          className="w-9 h-9 flex items-center justify-center shrink-0 transition-all hover:scale-105"
          style={{ background: "rgba(255,255,255,0.18)", borderRadius: "var(--radius-sm)", color: "#fff", backdropFilter: "blur(8px)" }}>
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-lg font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>{t("errorBank.title")}</h1>
      </div>

      <div className="bg-grid flex-1 overflow-y-auto flex items-center justify-center">
        <div className="text-center px-6">
          <div className="w-20 h-20 mx-auto mb-4 flex items-center justify-center rounded-full"
            style={{ background: "var(--accent-light)", boxShadow: "var(--shadow-clay-sm)" }}>
            <AlertCircle size={36} style={{ color: "var(--accent)" }} />
          </div>
          <h2 className="text-lg font-bold mb-2" style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)" }}>
            {t("errorBank.heading")}
          </h2>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            {t("errorBank.empty")}
          </p>
        </div>
      </div>
    </div>
  );
}
