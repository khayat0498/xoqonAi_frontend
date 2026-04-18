"use client";

import { useState, useEffect, useCallback } from "react";
import { getToken } from "@/lib/auth";
import { DollarSign, Coins, Search, X } from "lucide-react";
import { useDebounce } from "@/lib/hooks/useDebounce"; // Assuming a debounce hook exists

const API = process.env.NEXT_PUBLIC_API_URL;

// A new component for user search
function UserSearch({ onSelectUser }: { onSelectUser: (user: { id: string; name: string; email: string }) => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    fetch(`${API}/api/users/search?q=${debouncedQuery}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then(res => res.json())
      .then(data => setResults(data))
      .finally(() => setLoading(false));
  }, [debouncedQuery]);

  const handleSelect = (user: any) => {
    onSelectUser(user);
    setQuery("");
    setResults([]);
  };

  return (
    <div className="relative">
      <Input
        type="text"
        placeholder="Ism yoki email bo'yicha qidirish..."
        value={query}
        onChange={e => setQuery(e.target.value)}
      />
      {results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 p-2 rounded-lg z-10" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          {results.map(user => (
            <div
              key={user.id}
              onClick={() => handleSelect(user)}
              className="p-2 text-sm hover:bg-[var(--bg-primary)] rounded-md cursor-pointer"
            >
              <p className="font-medium" style={{ color: "var(--text-primary)" }}>{user.name}</p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>{user.email}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


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
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [amountUzs, setAmountUzs] = useState("");
  const [bonusPercent, setBonusPercent] = useState("");
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
    if (!selectedUser) return;
    setTopupStatus("loading");
    try {
      const res = await fetch(`${API}/api/balance/topup`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ 
          userId: selectedUser.id,
          amountUzs: Number(amountUzs),
          bonusPercent: Number(bonusPercent) || 0,
          note 
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Server error");
      }
      setTopupStatus(`${amountUzs} so'm muvaffaqiyatli o'tkazildi!`);
      setSelectedUser(null);
      setAmountUzs("");
      setBonusPercent("");
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
            <Label>Foydalanuvchi</Label>
            {!selectedUser ? (
              <UserSearch onSelectUser={setSelectedUser} />
            ) : (
              <div className="flex items-center justify-between p-2" style={{ background: "var(--bg-primary)", borderRadius: "var(--radius-sm)" }}>
                <div>
                  <p className="text-sm font-medium">{selectedUser.name}</p>
                  <p className="text-xs text-slate-500">{selectedUser.email}</p>
                </div>
                <button onClick={() => setSelectedUser(null)}><X size={16} /></button>
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label>Miqdor (so'mda)</Label>
              <Input type="number" placeholder="50000" value={amountUzs} onChange={e => setAmountUzs(e.target.value)} required />
            </div>
            <div>
              <Label>Bonus (%)</Label>
              <Input type="number" placeholder="0" value={bonusPercent} onChange={e => setBonusPercent(e.target.value)} />
            </div>
            <div className="sm:col-span-1">
              <Label>Izoh (ixtiyoriy)</Label>
              <Input type="text" placeholder="Bonus, to'lov..." value={note} onChange={e => setNote(e.target.value)} />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs h-4" style={{ color: topupStatus.startsWith("Xato") ? "var(--error)" : "var(--success)" }}>
              {topupStatus === "loading" ? "O'tkazilmoqda..." : topupStatus}
            </p>
            <Button type="submit" disabled={!selectedUser || !amountUzs || topupStatus === "loading"}>To'ldirish</Button>
          </div>
        </form>
      </Section>
    </div>
  );
}
