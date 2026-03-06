import Link from "next/link";
import type { ReactNode } from "react";
import { ActiveNavLink } from "@/components/ActiveNavLink";

// ── Nav items ──────────────────────────────────────────────────────────────
// Add or remove routes here — the sidebar renders from this array.
const NAV_ITEMS = [
  {
    href: "/dashboard",
    label: "Overview",
    exact: true,
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth={2}
        strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <rect x="3"  y="3"  width="7" height="7" />
        <rect x="14" y="3"  width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3"  y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    href: "/dashboard/clients/new",
    label: "Add Client",
    exact: false,
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth={2}
        strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="8.5" cy="7" r="4" />
        <line x1="20" y1="8"  x2="20" y2="14" />
        <line x1="23" y1="11" x2="17" y2="11" />
      </svg>
    ),
  },
  {
    href: "/dashboard/trades",
    label: "Trade History",
    exact: false,
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth={2}
        strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
  },
  {
    href: "/dashboard/settings",
    label: "Settings",
    exact: false,
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth={2}
        strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83
                 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33
                 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09
                 A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06
                 a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15
                 a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09
                 A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06
                 a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68
                 a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09
                 a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06
                 a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9
                 a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09
                 a1.65 1.65 0 00-1.51 1z" />
      </svg>
    ),
  },
];

// ── Dashboard Layout ───────────────────────────────────────────────────────
// No <html> or <body> — those live exclusively in src/app/layout.tsx.
// This layout wraps every route under /dashboard/* with sidebar + top bar.
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-zinc-950">

      {/* ── Sidebar ── */}
      <aside className="flex w-64 shrink-0 flex-col border-r border-zinc-800/70 bg-zinc-950">

        {/* Logotype */}
        <div className="flex h-16 items-center gap-2.5 border-b border-zinc-800/70 px-5">
          <svg className="h-6 w-6 text-amber-400" viewBox="0 0 32 32"
            fill="currentColor" aria-hidden>
            <path d="M28 14c0-6.627-5.373-12-12-12C9.791 2 7 4 5 7
                     c-1 1.5-1.5 3-1.5 5 0 1.5.3 2.9.8 4.2
                     C3.1 17.5 2 19.6 2 22c0 4.4 3.6 8 8 8h14
                     c3.3 0 6-2.7 6-6 0-1.9-.9-3.6-2.2-4.7
                     .1-.4.2-.9.2-1.3zm-6 4a2 2 0 100-4 2 2 0 000 4z" />
          </svg>
          <span className="text-base font-black tracking-tight text-zinc-100">
            POLY<span className="text-amber-400">WHALE</span>
          </span>
        </div>

        {/* Engine status */}
        <div className="mx-4 mt-4 flex items-center gap-2.5 rounded-lg
                        border border-emerald-500/20 bg-emerald-500/5 px-3 py-2">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping
                             rounded-full bg-emerald-400 opacity-50" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          <span className="text-xs font-semibold text-emerald-400">Engine: Online</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4"
          aria-label="Dashboard navigation">
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase
                        tracking-widest text-zinc-600">
            Navigation
          </p>
          <ul className="flex flex-col gap-0.5" role="list">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <ActiveNavLink href={item.href} exact={item.exact}>
                  {item.icon}
                  {item.label}
                </ActiveNavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Sidebar footer */}
        <div className="border-t border-zinc-800/70 px-5 py-4">
          <Link
            href="/"
            className="mb-3 flex items-center gap-1.5 text-xs text-zinc-600
                       transition-colors hover:text-zinc-400"
          >
            ← Back to Home
          </Link>
          <p className="text-[10px] leading-relaxed text-zinc-700">
            AES-256-GCM · Polygon Mainnet
            <br />
            Not financial advice.
          </p>
        </div>
      </aside>

      {/* ── Main column ── */}
      <div className="flex flex-1 flex-col overflow-hidden">

        {/* Top bar */}
        <header className="flex h-16 shrink-0 items-center justify-between
                           border-b border-zinc-800/70 bg-zinc-950 px-8">
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <span className="text-zinc-700">/</span>
            <span>Dashboard</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Chain badge */}
            <div className="hidden items-center gap-2 rounded-full border
                            border-zinc-800 bg-zinc-900 px-3 py-1.5 md:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-violet-400" aria-hidden />
              <span className="text-xs font-semibold text-zinc-500">
                Polygon Mainnet
              </span>
            </div>

            {/* Notifications */}
            <button
              aria-label="Notifications"
              className="flex h-8 w-8 items-center justify-center rounded-lg
                         border border-zinc-800 bg-zinc-900 text-zinc-500
                         transition-colors hover:border-zinc-700 hover:text-zinc-300"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth={2}
                strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 01-3.46 0" />
              </svg>
            </button>
          </div>
        </header>

        {/* Scrollable page slot */}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}