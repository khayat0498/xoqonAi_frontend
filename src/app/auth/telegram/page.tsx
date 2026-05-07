"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { Loader2 } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData: string;
        ready: () => void;
        expand: () => void;
        close: () => void;
        themeParams?: { bg_color?: string };
      };
    };
  }
}

export default function TelegramAuthPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const tryAuth = async () => {
      const tg = window.Telegram?.WebApp;
      if (!tg) {
        setErrorMsg("Telegram Mini App muhitida ochilmagan");
        setStatus("error");
        return;
      }

      tg.ready();
      tg.expand();

      const initData = tg.initData;
      if (!initData) {
        setErrorMsg("Telegram ma'lumotlari topilmadi");
        setStatus("error");
        return;
      }

      try {
        const res = await fetch(`${API}/api/auth/telegram`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ initData }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setErrorMsg(data.error ?? "Login muvaffaqiyatsiz");
          setStatus("error");
          return;
        }
        const data = await res.json();
        if (typeof window !== "undefined") {
          localStorage.setItem("xoqon_token", data.token);
        }
        // Onboarding holatini tekshirish
        const roleRes = await fetch(`${API}/api/users/me/role-info`, {
          headers: { Authorization: `Bearer ${data.token}` },
        });
        if (roleRes.ok) {
          const info = await roleRes.json();
          if (!info.onboarded) {
            router.replace("/onboarding/role");
            return;
          }
        }
        // Role bo'yicha redirect
        const role = data.user?.role ?? "teacher";
        const home = role === "admin" ? "/admin" : role === "direktor" ? "/direktor" : "/home";
        router.replace(home);
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : "Tarmoq xatosi");
        setStatus("error");
      }
    };

    // Wait briefly for Telegram script to load
    const t = setTimeout(tryAuth, 200);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <>
      <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
      <div className="flex flex-col items-center justify-center min-h-screen p-6 gap-4" style={{ background: "var(--bg-primary)" }}>
        {status === "loading" ? (
          <>
            <Loader2 size={32} className="animate-spin" style={{ color: "var(--accent)" }} />
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Telegram orqali kirilmoqda...</p>
          </>
        ) : (
          <>
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "rgba(248,113,113,0.1)" }}>
              <span style={{ color: "var(--error)", fontSize: 24 }}>⚠️</span>
            </div>
            <p className="text-sm font-semibold text-center" style={{ color: "var(--error)" }}>{errorMsg}</p>
            <p className="text-xs text-center" style={{ color: "var(--text-muted)" }}>Botda /start ni qaytadan bosing</p>
          </>
        )}
      </div>
    </>
  );
}
