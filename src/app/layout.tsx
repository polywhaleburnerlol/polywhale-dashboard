import type { Metadata } from "next";
import { Geist, Geist_Mono, Syne } from "next/font/google";
import "@/app/globals.css";

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

/**
 * Root layout — single responsibility.
 *
 * This file ONLY emits <html>, <body>, and {children}.
 *
 * It contains:  fonts  |  metadata  |  globals.css
 * It must NEVER contain: sidebar, nav, aside, backgrounds, PolygonMeshBackground,
 *   ActiveNavLink, or any other UI component.
 *
 * The sidebar lives exclusively in src/app/dashboard/layout.tsx and is
 * therefore only rendered for /dashboard/* routes.  Any UI placed here
 * would render on EVERY route including /login, producing duplicates.
 */
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