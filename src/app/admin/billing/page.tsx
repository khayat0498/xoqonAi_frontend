"use client";

import { useState } from "react";
import { getToken } from "@/lib/auth";
import { DollarSign, User, Coins } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL;

function Section({ title, icon, children }: { title: string, icon: React.ReactNode, children: React.ReactNode }) {
  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)" }}>
      <div className="flex items-center gap-3 p-4 border-b" style={{ borderColor: "var(--border)" }}>
        {icon}
        <h2 className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{title}</h2>
      </div>
      <div className="p-4">
        {children}
      </div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>{children}</label>;
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full text-sm px-3 py-2 bg-transparent transition-all"
      style={{
        color: "var(--text-primary)",
        background: "var(--bg-primary)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-sm)",
      }}
    />
  );
}

function Button({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className="px-4 py-2 text-xs font-semibold text-white transition-all hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
      style={{ background: "var(--accent)", borderRadius: "var(--radius-sm)" }}
    >
      {children}
    </button>
  );
}

export default function AdminBillingPage() {
  // Pricing state
  const [usdRateUzs, setUsdRateUzs] = useState("");
  const [inputPriceUsd, setInputPriceUsd] = useState("");
  const [outputPriceUsd, setOutputPriceUsd] = useState("");
  const [pricingStatus, setPricingStatus] = useState("");

  // Top-up state
  const [userId, setUserId] = useState("");
  const [amountUzs, setAmountUzs] = useState("");
  const [note, setNote] = useState("");
  const [topupStatus, setTopupStatus] = useState("");

  const handleUpdatePricing = async (e: React.FormEvent) => {
    e.preventDefault();
    setPricingStatus("loading");
    const body = {
      ...(usdRateUzs && { usdRateUzs: Number(usdRateUzs) }),
      ...(inputPriceUsd && { inputPriceUsd: Number(inputPriceUsd) }),
      ...(outputPriceUsd && { outputPriceUsd: Number(outputPriceUsd) }),
    };

    try {
      const res = await fetch(`${API}/api/balance/pricing`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Server error");
      setPricingStatus("Sozlamalar saqlandi!");
      setTimeout(() => setPricingStatus(""), 3000);
    } catch {
      setPricingStatus("Xatolik yuz berdi");
      setTimeout(() => setPricingStatus(""), 3000);
    }
  };

  const handleTopUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setTopupStatus("loading");
    try {
      const res = await fetch(`${API}/api/balance/topup`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ userId, amountUzs: Number(amountUzs), note }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Server error");
      }
      setTopupStatus(`${amountUzs} so'm muvaffaqiyatli o'tkazildi!`);
      setUserId("");
      setAmountUzs("");
      setNote("");
      setTimeout(() => setTopupStatus(""), 4000);
    } catch (err: any) {
      setTopupStatus(`Xatolik: ${err.message}`);
      setTimeout(() => setTopupStatus(""), 4000);
    }
  };

  return (
    <div className="p-5 max-w-2xl mx-auto flex flex-col gap-6">
      <Section title="Narx sozlamalari" icon={<DollarSign size={16} />}>
        <form onSubmit={handleUpdatePricing} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label>1 USD kursi (so'mda)</Label>
              <Input type="number" placeholder="12500" value={usdRateUzs} onChange={e => setUsdRateUzs(e.target.value)} />
            </div>
            <div>
              <Label>1M Input Token narxi ($)</Label>
              <Input type="number" step="0.01" placeholder="0.10" value={inputPriceUsd} onChange={e => setInputPriceUsd(e.target.value)} />
            </div>
            <div>
              <Label>1M Output Token narxi ($)</Label>
              <Input type="number" step="0.01" placeholder="0.40" value={outputPriceUsd} onChange={e => setOutputPriceUsd(e.target.value)} />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs h-4" style={{ color: pricingStatus.startsWith("Xato") ? "var(--error)" : "var(--success)" }}>
              {pricingStatus === "loading" ? "Saqlanmoqda..." : pricingStatus}
            </p>
            <Button type="submit" disabled={pricingStatus === "loading"}>Saqlash</Button>
          </div>
        </form>
      </Section>

      <Section title="Foydalanuvchi balansini to'ldirish" icon={<Coins size={16} />}>
        <form onSubmit={handleTopUp} className="flex flex-col gap-4">
          <div>
            <Label>Foydalanuvchi ID</Label>
            <Input type="text" placeholder="UUID..." value={userId} onChange={e => setUserId(e.target.value)} required />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Miqdor (so'mda)</Label>
              <Input type="number" placeholder="50000" value={amountUzs} onChange={e => setAmountUzs(e.target.value)} required />
            </div>
            <div>
              <Label>Izoh (ixtiyoriy)</Label>
              <Input type="text" placeholder="Bonus, to'lov..." value={note} onChange={e => setNote(e.target.value)} />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs h-4" style={{ color: topupStatus.startsWith("Xato") ? "var(--error)" : "var(--success)" }}>
              {topupStatus === "loading" ? "O'tkazilmoqda..." : topupStatus}
            </p>
            <Button type="submit" disabled={!userId || !amountUzs || topupStatus === "loading"}>To'ldirish</Button>
          </div>
        </form>
      </Section>
    </div>
  );
}
