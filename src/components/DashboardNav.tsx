"use client";

/**
 * src/components/DashboardNav.tsx
 *
 * Client component — owns usePathname() directly so active-state detection
 * is always client-side. Eliminates the hydration mismatch that caused the
 * Overview link to be unclickable on first render.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  {
    href:  "/dashboard",
    label: "Overview",
    exact: true,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <rect x="3"  y="3"  width="7" height="7" />
        <rect x="14" y="3"  width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3"  y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    href:  "/dashboard/clients/new",
    label: "Add Client",
    exact: false,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="8.5" cy="7" r="4" />
        <line x1="20" y1="8" x2="20" y2="14" />
        <line x1="23" y1="11" x2="17" y2="11" />
      </svg>
    ),
  },
  {
    href:  "/dashboard/trades",
    label: "Trade History",
    exact: false,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
  },
  {
    href:  "/dashboard/settings",
    label: "Settings",
    exact: false,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
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

export default function DashboardNav() {
  const pathname = usePathname();

  return (
    <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 2 }}>
      {NAV_ITEMS.map((item) => {
        const isActive = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href);

        return (
          <li key={item.href}>
            <Link
              href={item.href}
              className="pw-nav-link"
              data-active={isActive ? "true" : "false"}
            >
              {item.icon}
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}