import type { Metadata } from "next";
import { Geist, Geist_Mono, Syne } from "next/font/google";
import "@/app/globals.css";

// ── Fonts ──────────────────────────────────────────────────────────────────
const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  display: "swap",
});

// ── Metadata ───────────────────────────────────────────────────────────────
export const metadata: Metadata = {
  title: {
    default: "POLYWHALE — Real-Time Whale Tracking",
    template: "%s · POLYWHALE",
  },
  description:
    "Mirror large Polymarket trades in real-time. On-chain whale detection " +
    "via Polygon WebSocket, multi-tenant execution, AES-256-GCM encrypted credentials.",
  robots: { index: false, follow: false },
};

// ── Root Layout ────────────────────────────────────────────────────────────
// Single responsibility: emit <html> + <body>, register fonts, import global
// CSS. Nothing else belongs here — no sidebar, no nav, no providers.
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geist.variable} ${geistMono.variable} ${syne.variable}`}
      suppressHydrationWarning
    >
      <body className="bg-zinc-950 text-zinc-100 antialiased">
        {children}
      </body>
    </html>
  );
}