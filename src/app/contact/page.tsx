"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Send, MessageSquare, Mail, Phone, MapPin } from "lucide-react";
import { useState } from "react";
import { useT } from "@/lib/i18n-context";

export default function ContactPage() {
  const router = useRouter();
  const { t } = useT();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

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
          {t("contact.title")}
        </h1>
      </div>

      <div className="bg-grid flex-1 overflow-y-auto">
        <div className="px-4 py-6 pb-28 max-w-lg mx-auto w-full flex flex-col gap-4">

          {/* Contact info */}
          <div
            className="overflow-hidden"
            style={{ background: "var(--bg-card)", backdropFilter: "blur(4px)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-clay)" }}
          >
            <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
              <div className="flex items-center gap-3 mb-1">
                <MessageSquare size={18} style={{ color: "var(--accent)" }} />
                <h2 className="text-base font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)" }}>{t("contact.headline")}</h2>
              </div>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                {t("contact.sub")}
              </p>
            </div>
            <div className="flex flex-col">
              {[
                { icon: Mail, label: t("contact.email"), value: t("contact.emailValue") },
                { icon: Phone, label: t("contact.phone"), value: t("contact.phoneValue") },
                { icon: MapPin, label: t("contact.address"), value: t("contact.addressValue") },
              ].map(({ icon: Icon, label, value }, i, arr) => (
                <div
                  key={label}
                  className="flex items-center gap-3 px-4 py-3.5"
                  style={{ borderBottom: i < arr.length - 1 ? "1px solid var(--border)" : "none" }}
                >
                  <Icon size={17} style={{ color: "var(--text-muted)" }} />
                  <div className="flex-1">
                    <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{label}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Contact form */}
          <div
            className="p-5"
            style={{ background: "var(--bg-card)", backdropFilter: "blur(4px)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-clay)" }}
          >
            <h3 className="text-sm font-bold mb-4" style={{ color: "var(--text-primary)" }}>{t("contact.sendMessage")}</h3>
            <div className="flex flex-col gap-3">
              <input
                type="text"
                placeholder={t("contact.yourName")}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 text-sm outline-none transition-all"
                style={{
                  background: "var(--bg-primary)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-sm)",
                  color: "var(--text-primary)",
                  boxShadow: "inset 1px 1px 3px rgba(0,0,0,0.04)",
                }}
              />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 text-sm outline-none transition-all"
                style={{
                  background: "var(--bg-primary)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-sm)",
                  color: "var(--text-primary)",
                  boxShadow: "inset 1px 1px 3px rgba(0,0,0,0.04)",
                }}
              />
              <textarea
                placeholder={t("contact.yourMessage")}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 text-sm outline-none transition-all resize-none"
                style={{
                  background: "var(--bg-primary)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-sm)",
                  color: "var(--text-primary)",
                  boxShadow: "inset 1px 1px 3px rgba(0,0,0,0.04)",
                }}
              />
              <button
                className="w-full py-3 text-sm font-semibold flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{ borderRadius: "var(--radius-sm)", background: "var(--cta)", color: "#fff", boxShadow: "var(--shadow-clay-sm)" }}
              >
                <Send size={15} />
                {t("contact.send")}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
