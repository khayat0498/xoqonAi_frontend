"use client";

import { useState, useRef, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Send, ChevronDown, ChevronUp } from "lucide-react";
import clsx from "clsx";
import { getToken } from "@/lib/auth";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt?: string;
};

export default function ChatPage() {
  const { id: submissionId } = useParams<{ id: string }>();
  const [chatId, setChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [analysisOpen, setAnalysisOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Chat olish yoki yaratish
  useEffect(() => {
    const token = getToken();
    if (!token) return;
    fetch(`${API}/api/chats`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ submissionId }),
    })
      .then((r) => r.json())
      .then((data) => {
        setChatId(data.chat?.id ?? null);
        setMessages(data.messages ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [submissionId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (text?: string) => {
    const content = text ?? input.trim();
    if (!content || !chatId || sending) return;

    const userMsg: Message = {
      id: String(Date.now()),
      role: "user",
      content,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setSending(true);

    try {
      const token = getToken();
      const res = await fetch(`${API}/api/chats/${chatId}/messages`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token ?? ""}`, "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();
      if (data.aiMessage) {
        setMessages((prev) => [...prev, data.aiMessage]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: String(Date.now() + 1), role: "assistant", content: "Xatolik yuz berdi. Qaytadan urinib ko'ring." },
      ]);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ background: "var(--bg-primary)" }}>
        <p style={{ color: "var(--text-muted)" }}>Yuklanmoqda...</p>
      </div>
    );
  }

  return (
    <div className="bg-grid flex flex-col h-screen">
      {/* Header */}
      <div
        className="px-6 py-4 border-b flex items-center gap-4 shrink-0"
        style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
      >
        <Link
          href={`/submission/${submissionId}`}
          className="w-8 h-8 flex items-center justify-center transition-all hover:opacity-70"
          style={{ background: "var(--bg-primary)", color: "var(--text-secondary)", borderRadius: "var(--radius-sm)" }}
        >
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-base font-semibold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>
            Chat
          </h1>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            AI yordamchi
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3">
        {messages.length === 0 && (
          <p className="text-center text-sm py-8" style={{ color: "var(--text-muted)" }}>
            Savol yozing — AI javob beradi
          </p>
        )}
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
              className="max-w-[75%] px-4 py-3 text-sm leading-relaxed"
              style={
                msg.role === "user"
                  ? { background: "var(--accent)", color: "#fff", borderRadius: "var(--radius-md)", borderBottomRightRadius: "6px" }
                  : { background: "var(--bg-card)", color: "var(--text-primary)", border: "1px solid var(--border-light)", borderRadius: "var(--radius-md)", borderBottomLeftRadius: "6px", boxShadow: "var(--shadow-sm)" }
              }
            >
              {msg.content}
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex gap-2 justify-start animate-fade-in">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 mt-1" style={{ background: "var(--accent)" }}>X</div>
            <div className="px-4 py-3 text-sm" style={{ background: "var(--bg-card)", border: "1px solid var(--border-light)", borderRadius: "var(--radius-md)", color: "var(--text-muted)" }}>
              Yozmoqda...
            </div>
          </div>
        )}
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
          className="flex-1 resize-none outline-none text-sm px-4 py-2.5"
          style={{
            background: "var(--bg-primary)",
            border: "1px solid var(--border)",
            color: "var(--text-primary)",
            maxHeight: "120px",
            borderRadius: "var(--radius-sm)",
          }}
        />
        <button
          onClick={() => send()}
          disabled={!input.trim() || sending}
          className="w-10 h-10 flex items-center justify-center transition-all hover:opacity-80 disabled:opacity-30 shrink-0"
          style={{ background: "var(--cta)", color: "#fff", borderRadius: "var(--radius-sm)" }}
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
