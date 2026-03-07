import Link from "next/link";
import type { ReactNode } from "react";
import { ActiveNavLink } from "@/components/ActiveNavLink";
import { PolygonMeshBackground } from "@/components/PolygonMeshBackground";

/**
 * src/app/dashboard/layout.tsx — persistent shell for all /dashboard/* routes
 *
 * ── What this file does ───────────────────────────────────────────────────────
 * Provides the visual container every /dashboard/* page renders inside:
 *   <PolygonMeshBackground />   animated SVG mesh (position:fixed, z-index:0)
 *   <aside>                     glass sidebar     (z-index:10)
 *   <header>                    sticky top bar    (z-index:5)
 *   <main>                      scrollable page slot for {children}
 *
 * ── What this file DOES NOT do ────────────────────────────────────────────────
 * Zero redirect() calls. Zero Supabase imports. Zero auth logic.
 * Auth is handled exclusively by middleware.ts (Edge layer guard) and
 * src/app/page.tsx (entry-point routing).
 *
 * ── Background architecture ───────────────────────────────────────────────────
 * PolygonMeshBackground is position:fixed so it fills the entire viewport and
 * persists across client-side navigations without re-mounting.
 * Outer wrapper: position:relative (stacking context for z-indexes) but
 * NO overflow:hidden — a fixed child escapes it and it creates a stacking
 * context that can break future dropdown/modal UIs.
 * overflow:hidden lives only on the main column to prevent horizontal bleed.
 */

const C = {
  bg:            "#060b18",
  accent:        "#00e5cc",
  accentAlt:     "#7c5cfc",
  textSecondary: "#8492a6",
};

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

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600;700&display=swap');

        .pw-layout       { font-family: 'DM Sans', sans-serif; }
        .pw-font-display { font-family: 'Syne', sans-serif; }

        /* Glass sidebar */
        .pw-sidebar {
          position: relative; z-index: 10;
          background: rgba(10,16,32,0.88);
          backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
          border-right: 1px solid rgba(0,229,204,0.10);
        }
        .pw-sidebar ::-webkit-scrollbar       { width: 4px; }
        .pw-sidebar ::-webkit-scrollbar-track { background: transparent; }
        .pw-sidebar ::-webkit-scrollbar-thumb { background: rgba(0,229,204,0.15); border-radius: 4px; }

        /* Sticky top bar */
        .pw-topbar {
          position: sticky; top: 0; z-index: 5;
          background: rgba(6,11,24,0.92);
          backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
          border-bottom: 1px solid rgba(0,229,204,0.08);
        }

        /* Nav links */
        .pw-nav-link {
          display: flex; align-items: center; gap: 11px;
          padding: 10px 12px; border-radius: 10px;
          font-size: 13.5px; font-weight: 600; color: #8492a6;
          border: 1px solid transparent;
          transition: all 0.2s cubic-bezier(0.16,1,0.3,1);
          text-decoration: none; position: relative; overflow: hidden;
        }
        .pw-nav-link:hover {
          color: #00e5cc; background: rgba(0,229,204,0.06);
          border-color: rgba(0,229,204,0.12);
        }
        .pw-nav-link[data-active="true"] {
          color: #00e5cc; background: rgba(0,229,204,0.08);
          border-color: rgba(0,229,204,0.20);
          box-shadow: 0 0 20px -6px rgba(0,229,204,0.25);
        }
        .pw-nav-link[data-active="true"]::before {
          content: ''; position: absolute; left: 0; top: 20%; bottom: 20%;
          width: 2px; border-radius: 2px;
          background: linear-gradient(180deg, #00e5cc, #7c5cfc);
        }

        /* Engine pulse */
        @keyframes pw-ping {
          0%   { transform: scale(1);   opacity: 0.6; }
          70%  { transform: scale(2.2); opacity: 0;   }
          100% { transform: scale(2.2); opacity: 0;   }
        }
        .pw-ping { animation: pw-ping 2s cubic-bezier(0,0,0.2,1) infinite; }

        /* Chain badge */
        .pw-chain-badge {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 5px 12px; border-radius: 100px;
          background: rgba(124,92,252,0.08); border: 1px solid rgba(124,92,252,0.18);
          font-size: 11.5px; font-weight: 600; color: #a78bfa; letter-spacing: 0.01em;
        }

        /* Gradient separator */
        .pw-sep {
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(0,229,204,0.12), transparent);
          margin: 8px 12px;
        }

        /* Back link */
        .pw-back {
          display: flex; align-items: center; gap: 6px;
          font-size: 12px; font-weight: 500; color: #8492a6;
          text-decoration: none; transition: color 0.18s;
        }
        .pw-back:hover { color: #00e5cc; }
      `}</style>

      {/*
        LAYER 0 — PolygonMeshBackground (position:fixed, z-index:0)
        Placed BEFORE the flex wrapper so it's outside normal flex flow.
        Fills the entire viewport; persists across client-side navigations.
      */}
      <PolygonMeshBackground />

      {/*
        Outer flex shell.
        position:relative → stacking context for sidebar/main z-indexes.
        background:transparent → fixed mesh shows through.
        NO overflow:hidden → fixed children escape it; would create unwanted stacking context.
      */}
      <div
        className="pw-layout"
        style={{ display: "flex", minHeight: "100vh", position: "relative", background: "transparent" }}
      >

        {/* ═══ SIDEBAR  z-index:10 ════════════════════════════════════════════ */}
        <aside
          className="pw-sidebar"
          style={{ width: 236, flexShrink: 0, display: "flex", flexDirection: "column" }}
        >
          {/* Logotype */}
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "20px 20px 18px", borderBottom: "1px solid rgba(0,229,204,0.08)",
          }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10, flexShrink: 0,
              background: "linear-gradient(135deg, #00e5cc, #7c5cfc)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="18" height="18" viewBox="0 0 32 32" fill={C.bg}>
                <path d="M28 14c0-6.627-5.373-12-12-12C9.791 2 7 4 5 7c-1 1.5-1.5 3-1.5 5 0 1.5.3 2.9.8 4.2C3.1 17.5 2 19.6 2 22c0 4.4 3.6 8 8 8h14c3.3 0 6-2.7 6-6 0-1.9-.9-3.6-2.2-4.7.1-.4.2-.9.2-1.3zm-6 4a2 2 0 100-4 2 2 0 000 4z" />
              </svg>
            </div>
            <span className="pw-font-display" style={{
              fontSize: 19, fontWeight: 800, letterSpacing: "-0.02em", color: "#fff",
            }}>
              Poly<span style={{ color: C.accent }}>Whale</span>
            </span>
          </div>

          {/* Engine status */}
          <div style={{ padding: "14px 14px 0" }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 9,
              padding: "9px 13px", borderRadius: 10,
              background: "rgba(0,229,204,0.05)", border: "1px solid rgba(0,229,204,0.15)",
            }}>
              <span style={{ position: "relative", display: "flex", width: 9, height: 9, flexShrink: 0 }}>
                <span className="pw-ping" style={{
                  position: "absolute", inset: 0, borderRadius: "50%",
                  background: C.accent, opacity: 0.5,
                }} />
                <span style={{
                  position: "relative", display: "inline-flex",
                  width: 9, height: 9, borderRadius: "50%", background: C.accent,
                }} />
              </span>
              <span className="pw-font-display" style={{
                fontSize: 11.5, fontWeight: 700, letterSpacing: "0.04em",
                color: C.accent, textTransform: "uppercase",
              }}>
                Engine: Online
              </span>
            </div>
          </div>

          {/* Navigation */}
          <nav style={{ flex: 1, overflowY: "auto", padding: "16px 10px 8px" }}>
            <p style={{
              fontSize: 10, fontWeight: 700, letterSpacing: "0.10em",
              textTransform: "uppercase", color: "#3d4d63", padding: "0 8px 8px",
            }}>
              Navigation
            </p>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 2 }}>
              {NAV_ITEMS.map(item => (
                <li key={item.href}>
                  <ActiveNavLink href={item.href} exact={item.exact} className="pw-nav-link">
                    {item.icon}
                    {item.label}
                  </ActiveNavLink>
                </li>
              ))}
            </ul>
            <div className="pw-sep" style={{ marginTop: 16 }} />
          </nav>

          {/* Footer */}
          <div style={{ padding: "14px 18px 20px", borderTop: "1px solid rgba(0,229,204,0.07)" }}>
            <Link href="/" className="pw-back" style={{ marginBottom: 12 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
                <path d="M19 12H5M5 12l7 7M5 12l7-7" />
              </svg>
              Back to Site
            </Link>
            <p style={{ fontSize: 10.5, lineHeight: 1.6, color: "#3d4d63" }}>
              AES-256-GCM · Polygon Mainnet<br />Not financial advice.
            </p>
          </div>
        </aside>

        {/* ═══ MAIN COLUMN  z-index:1 ══════════════════════════════════════════
            overflow:hidden on THIS div only (not outer wrapper) — prevents
            horizontal bleed without fighting the fixed mesh background.
            Only <main> scrolls; topbar stays sticky at top:0.
        */}
        <div style={{
          flex: 1, minWidth: 0,
          display: "flex", flexDirection: "column",
          position: "relative", zIndex: 1,
          overflow: "hidden",
        }}>
          {/* Sticky top bar */}
          <header className="pw-topbar" style={{
            height: 60, flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "0 28px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ color: "#3d4d63", fontSize: 14 }}>/</span>
              <span className="pw-font-display" style={{
                fontSize: 13.5, fontWeight: 700,
                color: C.textSecondary, letterSpacing: "0.01em",
              }}>
                Dashboard
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span className="pw-chain-badge">
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.accentAlt, flexShrink: 0 }} />
                Polygon Mainnet
              </span>
              <button
                aria-label="Notifications"
                style={{
                  width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: "rgba(0,229,204,0.04)", border: "1px solid rgba(0,229,204,0.10)",
                  color: C.textSecondary, cursor: "pointer", transition: "all 0.18s",
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 01-3.46 0" />
                </svg>
              </button>
            </div>
          </header>

          {/* Scrollable page slot — every /dashboard/* page renders here */}
          <main style={{ flex: 1, overflowY: "auto" }}>
            {children}
          </main>
        </div>

      </div>
    </>
  );
}