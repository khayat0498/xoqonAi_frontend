"use client";

import Link from "next/link";
import { ArrowLeft, MessageCircle, Download, Send } from "lucide-react";
import { submissions } from "@/lib/mock-data";

export default function SubmissionPage() {
  const submission = submissions[0];
  const { analysis } = submission;

  return (
    <div className="bg-grid flex flex-col h-screen">
      {/* Header */}
      <div
        className="px-5 py-4 border-b flex items-center gap-3 shrink-0"
        style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
      >
        <Link
          href="/dashboard"
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: "var(--bg-primary)", color: "var(--text-secondary)" }}
        >
          <ArrowLeft size={16} />
        </Link>
        <div className="flex-1">
          <h1 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
            {submission.studentName}
          </h1>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            {submission.subject} · {submission.date}
          </p>
        </div>
        <button
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: "var(--bg-primary)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}
        >
          <Download size={15} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 pb-8">
        <div className="max-w-xl mx-auto flex flex-col gap-3">

          {/* Rasm */}
          <div
            className="card-3d rounded-xl aspect-[4/3] flex items-center justify-center"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
          >
            <div className="text-center" style={{ color: "var(--text-muted)" }}>
              <span className="text-4xl">📄</span>
              <p className="text-sm mt-2">Daftar rasmi</p>
            </div>
          </div>

          {/* AI Tahlili — Notebook card */}
          <div
            className="card-3d notebook rounded-xl overflow-hidden relative"
            style={{ border: "1px solid var(--border)" }}
          >
            {/* Qizil margin chizig'i */}
            <div
              className="absolute left-11 top-0 bottom-0 w-[2px]"
              style={{ background: "rgba(239,68,68,0.25)" }}
            />

            <div className="relative" style={{ marginLeft: "3rem" }}>
              {/* Sarlavha */}
              <div
                className="px-4 py-3 border-b flex items-center justify-between"
                style={{ borderColor: "var(--notebook-line)" }}
              >
                <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                  AI Tahlili
                </span>
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-lg"
                  style={{ background: "var(--accent-light)", color: "var(--accent)" }}
                >
                  {analysis.errors.length} xato
                </span>
              </div>

              <div className="px-4 py-5 flex flex-col gap-4">
                {/* Baho — handwriting */}
                <div>
                  <p className="handwriting text-5xl leading-none" style={{ color: "var(--accent)" }}>
                    {analysis.grade} / {analysis.maxGrade} ⭐
                  </p>
                  <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Umumiy baho</p>
                </div>

                {/* Xatolar — handwriting */}
                <div className="flex flex-col gap-3">
                  {analysis.errors.map((error, i) => (
                    <div key={i}>
                      <p className="handwriting text-2xl leading-snug" style={{ color: "var(--error)" }}>
                        {i + 1}. {error.title}
                      </p>
                      <p className="text-sm mt-0.5 ml-4 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                        {error.description}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Umumiy izoh — handwriting */}
                <div
                  className="pt-4 border-t"
                  style={{ borderColor: "var(--notebook-line)" }}
                >
                  <p className="handwriting text-2xl italic leading-snug" style={{ color: "var(--text-secondary)" }}>
                    → {analysis.comment}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Chat tugmasi */}
          <Link
            href="/chat/1"
            className="flex items-center justify-center gap-2 py-3.5 rounded-xl font-medium text-sm transition-all hover:opacity-80"
            style={{ background: "var(--accent)", color: "#fff" }}
          >
            <MessageCircle size={16} />
            Batafsil tushuntirish — Chat
          </Link>

          {/* Telegram tugmasi */}
          <button
            className="flex items-center justify-center gap-2 py-3.5 rounded-xl font-medium text-sm transition-all hover:opacity-80"
            style={{ background: "#229ED9", color: "#fff" }}
          >
            <Send size={16} />
            Telegramga yuborish
          </button>

        </div>
      </div>
    </div>
  );
}
