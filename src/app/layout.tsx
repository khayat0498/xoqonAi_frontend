import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Xoqon AI — Uy ishi tekshiruvchisi",
  description: "AI yordamida uy ishlarini tekshiring",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="uz">
      <body>{children}</body>
    </html>
  );
}
