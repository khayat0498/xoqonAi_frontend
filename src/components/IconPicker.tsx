"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

const ICON_CATEGORIES: { label: string; icons: string[] }[] = [
  {
    label: "Ta'lim",
    icons: ["📁","📂","📐","📖","📚","📝","📒","📓","📕","📗","📘","📙","✏️","🖊️","🎓","🏫","📎","📌","🔖","📋","🗂️","🗃️","🗄️","🧑‍🏫","👨‍🎓","📑","🏅"],
  },
  {
    label: "Fan",
    icons: ["🔬","🧪","🧬","🔭","💻","🧮","🌡️","⚗️","🧲","💡","⚡","🔋","📡","🛰️","🤖","🧠","🔧","⚙️","🖥️","📱"],
  },
  {
    label: "Sport & Hobbi",
    icons: ["⚽","🏀","🎾","🏐","🎵","🎨","🎭","🎬","🎮","♟️","🎯","🏆","🥇","🎪","🎸","🎹","🎤","🏊","🚴","🧘"],
  },
  {
    label: "Tabiat",
    icons: ["🌍","🌸","🌻","🍀","🌈","⭐","🌙","☀️","🔥","💧","❄️","🌊","🍎","🍊","🌲","🦋","🐝","🌺","🍃","🌵"],
  },
  {
    label: "Belgilar",
    icons: ["❤️","💜","💙","💚","💛","🧡","🤍","🖤","🔴","🟠","🟡","🟢","🔵","🟣","⬛","⬜","🔶","🔷","💎","🏷️","🔑","🛡️","🎀","🪄","✨","🌟","💫","🎗️"],
  },
  {
    label: "Bayroqlar & Boshqa",
    icons: ["🇺🇿","🏳️","🚩","📍","🗺️","🧭","⏰","📅","💼","🎒","🧳","📦","🗑️","🔒","🔓","💰","🎁","🧩","🃏","🪁"],
  },
];

interface IconPickerProps {
  value: string;
  onChange: (icon: string) => void;
  size?: number;
}

export default function IconPicker({ value, onChange, size = 36 }: IconPickerProps) {
  const [open, setOpen] = useState(false);

  // Lock body scroll when modal open
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center justify-center transition-all hover:scale-110 active:scale-95"
        style={{
          width: size,
          height: size,
          fontSize: size * 0.65,
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-sm)",
          boxShadow: "var(--shadow-clay-sm)",
          cursor: "pointer",
        }}
        title="Icon tanlash"
      >
        {value || "📁"}
      </button>

      {/* Full-screen modal */}
      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div
            className="w-full max-w-md animate-fade-in flex flex-col"
            style={{
              background: "var(--bg-card-solid, var(--bg-card))",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-lg)",
              boxShadow: "var(--shadow-clay)",
              maxHeight: "80vh",
              overflow: "hidden",
            }}
          >
            {/* Header */}
            <div
              className="px-5 py-4 flex items-center justify-between shrink-0"
              style={{ borderBottom: "1px solid var(--border)" }}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{value || "📁"}</span>
                <span className="text-base font-bold" style={{ color: "var(--text-primary)" }}>
                  Icon tanlang
                </span>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 flex items-center justify-center transition-all hover:scale-110"
                style={{
                  color: "var(--text-muted)",
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-sm)",
                  boxShadow: "var(--shadow-clay-sm)",
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Icons grid by category — scrollable */}
            <div className="flex-1 overflow-y-auto px-4 py-3">
              {ICON_CATEGORIES.map((cat) => (
                <div key={cat.label} className="mb-4">
                  <p
                    className="text-[11px] font-bold uppercase tracking-widest mb-2"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {cat.label}
                  </p>
                  <div className="grid grid-cols-7 sm:grid-cols-9 gap-1">
                    {cat.icons.map((icon) => (
                      <button
                        key={icon}
                        onClick={() => { onChange(icon); setOpen(false); }}
                        className="aspect-square flex items-center justify-center text-2xl rounded-xl transition-all hover:scale-115 active:scale-90"
                        style={{
                          background: value === icon ? "var(--accent-light)" : "transparent",
                          boxShadow: value === icon ? "var(--shadow-clay-sm)" : "none",
                          border: value === icon ? "2px solid var(--accent)" : "2px solid transparent",
                        }}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
