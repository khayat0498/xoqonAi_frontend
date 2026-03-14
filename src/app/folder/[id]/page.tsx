"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Plus, Camera, Upload, X } from "lucide-react";
import { folders } from "@/lib/mock-data";

const mockSubmissions = [
  { id: "1", title: "3-variant", date: "24 Fevral 2026", grade: "4/5", errors: 3 },
  { id: "2", title: "2-variant", date: "21 Fevral 2026", grade: "5/5", errors: 0 },
  { id: "3", title: "1-variant", date: "18 Fevral 2026", grade: "3/5", errors: 5 },
];

export default function FolderPage() {
  const { id } = useParams();
  const folder = folders.find((f) => f.id === id) ?? folders[0];
  const [showUpload, setShowUpload] = useState(false);

  return (
    <div className="bg-grid flex flex-col h-screen">
      {/* Header */}
      <div
        className="px-6 py-4 border-b flex items-center gap-4"
        style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
      >
        <Link
          href="/dashboard"
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:opacity-70"
          style={{ background: "var(--bg-primary)", color: "var(--text-secondary)" }}
        >
          <ArrowLeft size={16} />
        </Link>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
          style={{ background: folder.color }}
        >
          {folder.icon}
        </div>
        <div className="flex-1">
          <h1 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
            {folder.name}
          </h1>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            {folder.count} ta tekshirish
          </p>
        </div>

        <button
          onClick={() => setShowUpload(true)}
          className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-xl font-medium transition-all hover:opacity-80"
          style={{ background: "var(--accent)", color: "#fff" }}
        >
          <Plus size={15} />
          Yangi tekshirish
        </button>
      </div>

      {/* Submissions list */}
      <div className="flex-1 overflow-y-auto p-6 pb-24 md:pb-6">
        <div className="max-w-2xl mx-auto flex flex-col gap-3">
          {mockSubmissions.map((sub, i) => (
            <Link
              key={sub.id}
              href={`/submission/${sub.id}`}
              className="card-3d rounded-2xl px-5 py-4 flex items-center gap-4 transition-all animate-fade-in"
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                animationDelay: `${i * 60}ms`,
              }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                style={{ background: folder.color }}
              >
                {folder.icon}
              </div>

              <div className="flex-1">
                <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                  {folder.name} — {sub.title}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                  {sub.date}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {sub.errors > 0 && (
                  <span
                    className="text-xs px-2 py-0.5 rounded-lg"
                    style={{ background: "#FFF1F2", color: "var(--error)" }}
                  >
                    {sub.errors} xato
                  </span>
                )}
                <span
                  className="text-xs font-semibold px-2.5 py-1 rounded-lg"
                  style={{
                    background: sub.grade === "5/5" ? "#F0FDF4" : "var(--accent-light)",
                    color: sub.grade === "5/5" ? "var(--success)" : "var(--accent)",
                  }}
                >
                  {sub.grade}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Upload modal */}
      {showUpload && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: "#00000060" }}>
          <div
            className="w-full max-w-sm rounded-2xl p-6 animate-fade-in"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
                Rasm yuklash
              </h2>
              <button onClick={() => setShowUpload(false)} style={{ color: "var(--text-muted)" }}>
                <X size={18} />
              </button>
            </div>

            {/* Upload options */}
            <div className="flex flex-col gap-2">
              <button
                className="flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all hover:opacity-80"
                style={{ background: "var(--accent)", color: "#fff" }}
              >
                <Camera size={18} />
                <span className="text-sm font-medium">Kamera bilan olish</span>
              </button>

              <button
                className="flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all hover:opacity-70"
                style={{
                  background: "var(--bg-primary)",
                  border: "1px solid var(--border)",
                  color: "var(--text-secondary)",
                }}
              >
                <Upload size={18} />
                <span className="text-sm">Fayldan tanlash</span>
              </button>
            </div>

            {/* Drag & Drop */}
            <div
              className="mt-3 rounded-xl p-6 flex flex-col items-center gap-2 transition-all"
              style={{
                border: "2px dashed var(--border)",
                color: "var(--text-muted)",
              }}
            >
              <Upload size={24} />
              <p className="text-xs text-center">
                Rasmni shu yerga tashlang
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
