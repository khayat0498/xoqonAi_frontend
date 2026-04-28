import type { Metadata, Viewport } from "next";
import "./globals.css";
import { I18nProvider } from "@/lib/i18n-context";

export const metadata: Metadata = {
  metadataBase: new URL("https://xoqon.uz"),
  title: "SI baho — Sun'iy intellekt baholaydi",
  description: "Sun'iy intellekt baholaydi — siz dam olasiz",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="uz">
      <body>
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
