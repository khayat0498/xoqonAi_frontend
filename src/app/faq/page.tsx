"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronDown } from "lucide-react";
import { useState } from "react";
import { useT } from "@/lib/i18n-context";

const FAQ_COUNT = 12;

export default function FaqPage() {
  const router = useRouter();
  const { t } = useT();
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const faqs = Array.from({ length: FAQ_COUNT }, (_, i) => ({
    q: t(`faq.items.${i}.q`),
    a: t(`faq.items.${i}.a`),
  }));

  return (
    <div className="flex flex-col h-screen" style={{ background: "var(--bg-primary)" }}>
      {/* Header */}
      <div
        className="shrink-0 px-5 py-4 flex items-center gap-3 relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, var(--accent-dark) 0%, var(--accent) 60%, var(--accent-hover) 100%)",
          boxShadow: "6px 6px 14px rgba(53,120,136,0.25), inset -2px -2px 6px rgba(0,0,0,0.08), inset 2px 2px 6px rgba(255,255,255,0.12)",
        }}
      >
        <div style={{ position: "absolute", right: -25, top: -30, width: 100, height: 100, borderRadius: "50%", background: "rgba(255,255,255,0.12)", pointerEvents: "none" }} />
        <button
          onClick={() => router.back()}
          className="w-9 h-9 flex items-center justify-center shrink-0 transition-all hover:scale-105"
          style={{ background: "rgba(255,255,255,0.18)", borderRadius: "var(--radius-sm)", color: "#fff", backdropFilter: "blur(8px)" }}
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-lg font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>
          {t("faq.title")}
        </h1>
      </div>

      <div className="bg-grid flex-1 overflow-y-auto">
        <div className="px-4 py-6 pb-28 max-w-lg mx-auto w-full flex flex-col gap-3">

          {faqs.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <div
                key={i}
                className="overflow-hidden transition-all"
                style={{
                  background: "var(--bg-card)",
                  backdropFilter: "blur(12px)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-md)",
                  boxShadow: isOpen ? "var(--shadow-clay)" : "var(--shadow-clay-sm)",
                }}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="w-full flex items-center gap-3 px-4 py-4 text-left transition-all"
                >
                  <span className="flex-1 text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                    {faq.q}
                  </span>
                  <ChevronDown
                    size={16}
                    className="shrink-0 transition-transform duration-200"
                    style={{
                      color: "var(--text-muted)",
                      transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                    }}
                  />
                </button>
                {isOpen && (
                  <div
                    className="px-4 pb-4 animate-fade-in"
                    style={{ borderTop: "1px solid var(--border)" }}
                  >
                    <p className="text-sm pt-3 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                      {faq.a}
                    </p>
                  </div>
                )}
              </div>
            );
          })}

        </div>
      </div>
    </div>
  );
}
