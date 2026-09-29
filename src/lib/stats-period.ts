// Kunlik / Haftalik / Oylik davr tanlagichi uchun umumiy yordamchilar (offline stats)

export type Period = "day" | "week" | "month";

const MONTHS_UZ = ["Yan", "Fev", "Mar", "Apr", "May", "Iyn", "Iyl", "Avg", "Sen", "Okt", "Noy", "Dek"];

const ymd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const ym = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

// Berilgan sana haftasining dushanbasi
function mondayOf(d: Date): Date {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7; // 0 = Dushanba
  x.setDate(x.getDate() - day);
  x.setHours(0, 0, 0, 0);
  return x;
}

// Tanlangan davr uchun standart qiymat
export function defaultValue(p: Period): string {
  const now = new Date();
  if (p === "day") return ymd(now);
  if (p === "week") return ymd(mondayOf(now));
  return ym(now);
}

// Har qanday davr qiymatidan oy (YYYY-MM) — insights uchun
export function monthOf(value: string): string {
  return value.slice(0, 7);
}

// Davr bo'yicha tanlanadigan variantlar ro'yxati (eng eski → eng yangi)
export function periodOptions(p: Period): { value: string; label: string }[] {
  const now = new Date();

  if (p === "day") {
    const opts = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      opts.push({ value: ymd(d), label: `${d.getDate()} ${MONTHS_UZ[d.getMonth()]}` });
    }
    return opts;
  }

  if (p === "week") {
    const opts = [];
    const mon0 = mondayOf(now);
    for (let i = 7; i >= 0; i--) {
      const d = new Date(mon0);
      d.setDate(mon0.getDate() - i * 7);
      const end = new Date(d);
      end.setDate(d.getDate() + 6);
      opts.push({ value: ymd(d), label: `${d.getDate()}–${end.getDate()} ${MONTHS_UZ[end.getMonth()]}` });
    }
    return opts;
  }

  // month
  const opts = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    opts.push({ value: ym(d), label: `${MONTHS_UZ[d.getMonth()]} ${d.getFullYear()}` });
  }
  return opts;
}

// Holat (status) uchun rang + emoji
export const INSIGHT_STYLE: Record<string, { emoji: string; color: string }> = {
  osish:     { emoji: "📈", color: "#3dbd7d" },
  faol:      { emoji: "🔥", color: "#6366f1" },
  barqaror:  { emoji: "✅", color: "#0ea5e9" },
  yangi:     { emoji: "🆕", color: "#f59e0b" },
  pasayish:  { emoji: "📉", color: "#f97316" },
  passiv:    { emoji: "😴", color: "#ef4444" },
};
