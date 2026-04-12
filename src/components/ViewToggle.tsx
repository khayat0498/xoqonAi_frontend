"use client";

import { LayoutList, LayoutGrid } from "lucide-react";

interface ViewToggleProps {
  view: "list" | "grid";
  onChange: (v: "list" | "grid") => void;
}

export default function ViewToggle({ view, onChange }: ViewToggleProps) {
  return (
    <div
      className="flex items-center p-1 gap-0.5"
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-sm)",
        boxShadow: "var(--shadow-clay-sm)",
      }}
    >
      {(["list", "grid"] as const).map((v) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          className="w-8 h-8 flex items-center justify-center transition-all"
          style={{
            background: view === v ? "var(--accent-light)" : "transparent",
            color: view === v ? "var(--accent)" : "var(--text-muted)",
            borderRadius: 8,
            boxShadow: view === v ? "var(--shadow-clay-sm)" : "none",
          }}
        >
          {v === "list" ? <LayoutList size={15} /> : <LayoutGrid size={15} />}
        </button>
      ))}
    </div>
  );
}
