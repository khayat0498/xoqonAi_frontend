"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronDown } from "lucide-react";
import { useState } from "react";

const faqs = [
  // Umumiy
  {
    q: "Xoqon AI nima?",
    a: "Xoqon AI — o'qituvchilar uchun sun'iy intellektga asoslangan avtomatik baholash tizimi. O'quvchilarning yozma ishlarini rasmga olib, AI yordamida tahlil qilish mumkin.",
  },
  {
    q: "Qanday qilib rasm tekshiraman?",
    a: "Ekranning pastki qismidagi kamera (📷) tugmasini bosing, papkani tanlang va o'quvchining ishini rasmga oling. AI bir necha soniya ichida tahlil va baho beradi.",
  },
  {
    q: "Qaysi fanlar qo'llab-quvvatlanadi?",
    a: "Hozirda Matematika, Ona tili, Fizika, Kimyo, Biologiya, Ingliz tili, Tarix va Rus tili fanlari qo'llab-quvvatlanadi. Yangi fanlar qo'shilmoqda.",
  },
  {
    q: "Mobil qurilmada ishlaydi mi?",
    a: "Ha, Xoqon AI to'liq mobil qurilmalarga moslashgan. Istalgan brauzer orqali foydalanishingiz mumkin.",
  },
  // Tarif va to'lov
  {
    q: "Bepul rejada nima bor?",
    a: "Bepul rejada hozirda x2 bonus bilan oyiga 60 ta rasmgacha tekshirish, 1 ta sinf va sinfga 10 tagacha o'quvchi qo'shish mumkin. Ko'proq kerak bo'lsa Pro yoki Premium rejaga o'ting.",
  },
  {
    q: "x2 Bonus nima?",
    a: "Hozirda barcha tarif rejalarda x2 bonus amal qilmoqda. Bu degani rasm limiti ikki baravar ko'p — masalan Free rejada 30 o'rniga 60 ta, Pro da 200 o'rniga 400 ta rasm tekshirish mumkin.",
  },
  {
    q: "Yillik to'lovda qancha tejash mumkin?",
    a: "Yillik to'lov tanlasangiz 10 oylik narx to'laysiz — ya'ni 2 oy bepul! Bu 17% gacha tejash imkonini beradi.",
  },
  {
    q: "Tarif rejani qanday o'zgartiraman?",
    a: "Sozlamalar > Billing > Tarif rejalar bo'limiga o'ting va o'zingizga mos rejani tanlang. Yoki Sidebar dagi 'Tarif rejalar' havolasini bosing.",
  },
  // Texnik
  {
    q: "Telegram bot qanday ishlaydi?",
    a: "Pro va undan yuqori rejalarda Telegram bot orqali o'quvchilar bevosita botga rasm yuborishi va natijani olishi mumkin. Free rejada Telegram integratsiyasi mavjud emas.",
  },
  {
    q: "AI qanchalik aniq baholaydi?",
    a: "AI tahlil 85-95% aniqlikda ishlaydi. Har bir tahlildan keyin o'qituvchi natijani ko'rib chiqishi va kerak bo'lsa tuzatishi mumkin.",
  },
  {
    q: "Ma'lumotlarim xavfsizmi?",
    a: "Ha, barcha ma'lumotlar shifrlangan holda saqlanadi. To'lov tizimi Click/Payme orqali amalga oshiriladi — karta ma'lumotlaringiz bizga uzatilmaydi.",
  },
  {
    q: "Qo'llab-quvvatlash bilan qanday bog'lanaman?",
    a: "Bog'lanish sahifasidagi forma orqali yoki support@xoqon.ai emailiga yozishingiz mumkin. Telegram: @xoqon_support",
  },
];

export default function FaqPage() {
  const router = useRouter();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="flex flex-col h-screen" style={{ background: "var(--bg-primary)" }}>
      {/* Header */}
      <div
        className="shrink-0 px-5 py-4 flex items-center gap-3 relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, var(--accent-dark) 0%, var(--accent) 60%, var(--accent-hover) 100%)",
          boxShadow: "6px 6px 14px rgba(53,120,136,0.25), inset -2px -2px 6px rgba(0,0,0,0.08), inset 2px 2px 6px rgba(255,255,255,0.12)",
        }}
      >
        <div style={{ position: "absolute", right: -25, top: -30, width: 100, height: 100, borderRadius: "50%", background: "rgba(255,255,255,0.12)", pointerEvents: "none" }} />
        <button
          onClick={() => router.back()}
          className="w-9 h-9 flex items-center justify-center shrink-0 transition-all hover:scale-105"
          style={{ background: "rgba(255,255,255,0.18)", borderRadius: "var(--radius-sm)", color: "#fff", backdropFilter: "blur(8px)" }}
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-lg font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>
          Ko&apos;p so&apos;raladigan savollar
        </h1>
      </div>

      <div className="bg-grid flex-1 overflow-y-auto">
        <div className="px-4 py-6 pb-28 max-w-lg mx-auto w-full flex flex-col gap-3">

          {faqs.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <div
                key={i}
                className="overflow-hidden transition-all"
                style={{
                  background: "var(--bg-card)",
                  backdropFilter: "blur(12px)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-md)",
                  boxShadow: isOpen ? "var(--shadow-clay)" : "var(--shadow-clay-sm)",
                }}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="w-full flex items-center gap-3 px-4 py-4 text-left transition-all"
                >
                  <span className="flex-1 text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                    {faq.q}
                  </span>
                  <ChevronDown
                    size={16}
                    className="shrink-0 transition-transform duration-200"
                    style={{
                      color: "var(--text-muted)",
                      transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                    }}
                  />
                </button>
                {isOpen && (
                  <div
                    className="px-4 pb-4 animate-fade-in"
                    style={{ borderTop: "1px solid var(--border)" }}
                  >
                    <p className="text-sm pt-3 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                      {faq.a}
                    </p>
                  </div>
                )}
              </div>
            );
          })}

        </div>
      </div>
    </div>
  );
}
