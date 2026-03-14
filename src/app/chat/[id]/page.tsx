"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Send, ChevronDown, ChevronUp } from "lucide-react";
import clsx from "clsx";
import { chatMessages, submissions } from "@/lib/mock-data";

export default function ChatPage() {
  const submission = submissions[0];
  const { analysis } = submission;

  const [messages, setMessages] = useState(chatMessages);
  const [input, setInput] = useState("");
  const [analysisOpen, setAnalysisOpen] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = (text?: string) => {
    const content = text ?? input.trim();
    if (!content) return;

    setMessages((prev) => [
      ...prev,
      { id: String(Date.now()), role: "user", content, time: new Date().toLocaleTimeString("uz", { hour: "2-digit", minute: "2-digit" }) },
    ]);
    setInput("");

    // Mock AI response
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: String(Date.now() + 1),
          role: "assistant",
          content: "Tushunaman! Bu haqida batafsil tushuntiraman...",
          time: new Date().toLocaleTimeString("uz", { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    }, 800);
  };

  return (
    <div className="bg-grid flex flex-col h-screen">
      {/* Header */}
      <div
        className="px-6 py-4 border-b flex items-center gap-4 shrink-0"
        style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
      >
        <Link
          href={`/submission/1`}
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:opacity-70"
          style={{ background: "var(--bg-primary)", color: "var(--text-secondary)" }}
        >
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
            Chat
          </h1>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            {submission.studentName} · {submission.subject}
          </p>
        </div>
      </div>

      {/* Mini analysis card */}
      <div
        className="shrink-0 mx-4 mt-3 rounded-2xl overflow-hidden transition-all"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
      >
        <button
          onClick={() => setAnalysisOpen(!analysisOpen)}
          className="w-full flex items-center justify-between px-4 py-3"
        >
          <div className="flex items-center gap-3">
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-lg"
              style={{ background: "var(--accent-light)", color: "var(--accent)" }}
            >
              {analysis.grade}/{analysis.maxGrade}
            </span>
            <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
              {analysis.errors.length} ta xato topildi
            </span>
          </div>
          <div style={{ color: "var(--text-muted)" }}>
            {analysisOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </div>
        </button>

        {analysisOpen && (
          <div className="px-4 pb-3 flex flex-col gap-1.5 border-t" style={{ borderColor: "var(--border)" }}>
            <p className="text-xs pt-2" style={{ color: "var(--text-muted)" }}>Xatolar:</p>
            {analysis.errors.map((e, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-xs mt-0.5" style={{ color: "var(--error)" }}>•</span>
                <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{e.title}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={clsx("flex gap-2 animate-fade-in", msg.role === "user" ? "justify-end" : "justify-start")}
          >
            {msg.role === "assistant" && (
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 mt-1"
                style={{ background: "var(--accent)" }}
              >
                X
              </div>
            )}

            <div
              className={clsx(
                "max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed"
              )}
              style={
                msg.role === "user"
                  ? { background: "var(--accent)", color: "#fff", borderBottomRightRadius: "6px" }
                  : { background: "var(--bg-card)", color: "var(--text-primary)", border: "1px solid var(--border)", borderBottomLeftRadius: "6px" }
              }
            >
              {msg.content}
              <p
                className="text-xs mt-1 opacity-60"
                style={{ textAlign: msg.role === "user" ? "right" : "left" }}
              >
                {msg.time}
              </p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Quick actions */}
      <div className="px-4 pb-2 flex gap-2 overflow-x-auto shrink-0">
        {["Osonroq tushuntir", "Batafsil tushuntir", "Misol keltir"].map((action) => (
          <button
            key={action}
            onClick={() => send(action)}
            className="shrink-0 text-xs px-3 py-1.5 rounded-full transition-all hover:opacity-70"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              color: "var(--text-secondary)",
            }}
          >
            {action}
          </button>
        ))}
      </div>

      {/* Input */}
      <div
        className="px-4 py-3 border-t shrink-0 flex items-end gap-2"
        style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="Savol yozing..."
          rows={1}
          className="flex-1 resize-none outline-none text-sm rounded-xl px-4 py-2.5"
          style={{
            background: "var(--bg-primary)",
            border: "1px solid var(--border)",
            color: "var(--text-primary)",
            maxHeight: "120px",
          }}
        />
        <button
          onClick={() => send()}
          disabled={!input.trim()}
          className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:opacity-80 disabled:opacity-30 shrink-0"
          style={{ background: "var(--accent)", color: "#fff" }}
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
