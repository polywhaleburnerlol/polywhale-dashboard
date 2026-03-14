"use client";

/**
 * src/app/login/page.tsx
 *
 * Standalone login page — no dashboard layout wrapper.
 *
 * ── REDIRECT BUG FIXED ───────────────────────────────────────────────────────
 * The previous version had:
 *   const nextPath = searchParams.get("next") ?? "/dashboard";
 *
 * When /login was visited without a ?next= param (direct navigation, fresh
 * browser, bookmark), nextPath fell back to "/dashboard".  After login the
 * Server Action redirected to /dashboard, which then bounced to
 * /dashboard/clients/new.  That extra hop meant the middleware saw another
 * /dashboard/* request — and if session cookies had been dropped by the
 * missing cookie-forwarding bug in middleware (now fixed), the guard fired
 * again → /login → loop.
 *
 * Fix: default nextPath to /dashboard/clients/new so that after a successful
 * login we go DIRECTLY to the first real page with no intermediate bounce.
 *
 * ── Suspense architecture ─────────────────────────────────────────────────────
 * useSearchParams() must be inside a <Suspense> boundary at build time or
 * Next.js throws "useSearchParams() should be wrapped in a suspense boundary".
 * Solution: every hook lives in <LoginContent />, and the default export
 * <LoginPage /> is a pure Suspense shell with a matching dark fallback.
 */

import { Suspense, useActionState, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { signIn, type AuthResult } from "@/app/actions/auth";

/* ── Design tokens ──────────────────────────────────────────────────────────── */
const C = {
  bg:            "#060b18",
  bgCard:        "rgba(12,20,40,0.65)",
  accent:        "#00e5cc",
  accentAlt:     "#7c5cfc",
  textPrimary:   "#e2e8f0",
  textSecondary: "#8492a6",
};

/* ── Email input ────────────────────────────────────────────────────────────── */
function EmailField() {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
      <label htmlFor="email" style={{
        fontSize: 11, fontWeight: 700, letterSpacing: "0.09em",
        textTransform: "uppercase",
        color: focused ? C.accent : "#4a5a72", transition: "color 0.18s",
        fontFamily: "'Syne', sans-serif",
      }}>
        Email Address
      </label>
      <div style={{ position: "relative" }}>
        {focused && (
          <div style={{
            position: "absolute", inset: -1, borderRadius: 11,
            background: "linear-gradient(135deg, rgba(0,229,204,0.22), rgba(124,92,252,0.14))",
            pointerEvents: "none", zIndex: 0,
            boxShadow: "0 0 18px -4px rgba(0,229,204,0.28)",
          }} />
        )}
        <input
          id="email" name="email" type="email"
          autoComplete="email" required placeholder="you@example.com"
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={{
            position: "relative", zIndex: 1, width: "100%", display: "block",
            padding: "12px 14px", borderRadius: 10,
            background: focused ? "rgba(0,229,204,0.04)" : "rgba(6,11,24,0.7)",
            border: `1px solid ${focused ? "rgba(0,229,204,0.35)" : "rgba(0,229,204,0.10)"}`,
            color: C.textPrimary, fontSize: 14, fontFamily: "'DM Sans', sans-serif",
            outline: "none", transition: "all 0.2s cubic-bezier(0.16,1,0.3,1)",
          }}
        />
      </div>
    </div>
  );
}

/* ── Password input ─────────────────────────────────────────────────────────── */
function PasswordField() {
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(false);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
      <label htmlFor="password" style={{
        fontSize: 11, fontWeight: 700, letterSpacing: "0.09em",
        textTransform: "uppercase",
        color: focused ? C.accent : "#4a5a72", transition: "color 0.18s",
        fontFamily: "'Syne', sans-serif",
      }}>
        Password
      </label>
      <div style={{ position: "relative" }}>
        {focused && (
          <div style={{
            position: "absolute", inset: -1, borderRadius: 11,
            background: "linear-gradient(135deg, rgba(0,229,204,0.22), rgba(124,92,252,0.14))",
            pointerEvents: "none", zIndex: 0,
            boxShadow: "0 0 18px -4px rgba(0,229,204,0.28)",
          }} />
        )}
        <input
          id="password" name="password" type={visible ? "text" : "password"}
          autoComplete="current-password" required placeholder="••••••••••"
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={{
            position: "relative", zIndex: 1, width: "100%", display: "block",
            padding: "12px 42px 12px 14px", borderRadius: 10,
            background: focused ? "rgba(0,229,204,0.04)" : "rgba(6,11,24,0.7)",
            border: `1px solid ${focused ? "rgba(0,229,204,0.35)" : "rgba(0,229,204,0.10)"}`,
            color: C.textPrimary, fontSize: 14, fontFamily: "'DM Sans', sans-serif",
            outline: "none", transition: "all 0.2s cubic-bezier(0.16,1,0.3,1)",
          }}
        />
        <button type="button" onClick={() => setVisible(v => !v)}
          style={{
            position: "absolute", right: 12, top: "50%",
            transform: "translateY(-50%)", zIndex: 2,
            background: "none", border: "none", cursor: "pointer", padding: 2,
            color: visible ? C.accent : "#4a5a72", transition: "color 0.18s",
          }}
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
              <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
              <line x1="1" y1="1" x2="23" y2="23" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}

/* ── Submit button ──────────────────────────────────────────────────────────── */
function SignInButton({ pending }: { pending: boolean }) {
  const [hovered, setHovered] = useState(false);
  return (
    <>
      <style>{`
        @keyframes pw-shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }
        .pw-shimmer-btn {
          background: linear-gradient(110deg,
            #00e5cc 0%, #00e5cc 40%, #7dfff0 50%, #00e5cc 60%, #00e5cc 100%);
          background-size: 200% 100%;
          animation: pw-shimmer 3s ease-in-out infinite;
        }
        @keyframes pw-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
      <button
        type="submit" disabled={pending}
        onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
        className={pending ? "" : "pw-shimmer-btn"}
        style={{
          width: "100%", padding: "13px 20px", borderRadius: 12, border: "none",
          cursor: pending ? "not-allowed" : "pointer",
          background: pending ? "rgba(0,229,204,0.07)" : undefined,
          color: pending ? C.textSecondary : "#060b18",
          fontSize: 14, fontWeight: 800, letterSpacing: "0.05em",
          fontFamily: "'Syne', sans-serif",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          transform: hovered && !pending ? "translateY(-2px)" : "translateY(0)",
          boxShadow: hovered && !pending ? "0 8px 28px -4px rgba(0,229,204,0.42)" : "none",
          transition: "transform 0.2s cubic-bezier(0.16,1,0.3,1), box-shadow 0.2s ease",
        }}
      >
        {pending ? (
          <>
            <svg style={{ animation: "pw-spin 0.8s linear infinite" }}
              width="15" height="15" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path d="M21 12a9 9 0 11-6.219-8.56" strokeLinecap="round" />
            </svg>
            Signing In…
          </>
        ) : (
          <>
            Sign In
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </>
        )}
      </button>
    </>
  );
}

/* ── CSS-only ambient background ────────────────────────────────────────────── */
function AmbientBackground() {
  return (
    <>
      <style>{`
        @keyframes pw-grid-drift {
          0%   { transform: translate(0, 0); }
          100% { transform: translate(40px, 40px); }
        }
        .pw-login-grid {
          position: fixed; inset: 0; z-index: 0; pointer-events: none;
          background-image:
            linear-gradient(rgba(0,229,204,0.022) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,229,204,0.022) 1px, transparent 1px);
          background-size: 60px 60px;
          animation: pw-grid-drift 24s linear infinite;
        }
      `}</style>
      <div className="pw-login-grid" aria-hidden />
      <div aria-hidden style={{
        position: "fixed", top: -180, left: "50%", transform: "translateX(-50%)",
        width: 700, height: 700, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(0,229,204,0.10) 0%, transparent 65%)",
        pointerEvents: "none", zIndex: 0,
      }} />
      <div aria-hidden style={{
        position: "fixed", bottom: -220, right: -180,
        width: 650, height: 650, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(124,92,252,0.09) 0%, transparent 65%)",
        pointerEvents: "none", zIndex: 0,
      }} />
      <div aria-hidden style={{
        position: "fixed", top: -250, left: -200,
        width: 550, height: 550, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(124,92,252,0.07) 0%, transparent 65%)",
        pointerEvents: "none", zIndex: 0,
      }} />
    </>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   LOGIN CONTENT
   Every hook lives here, inside the <Suspense> boundary.
   ══════════════════════════════════════════════════════════════════════════════ */
const initialState: AuthResult | null = null;

function LoginContent() {
  const searchParams = useSearchParams();

  /**
   * DEFAULT IS /dashboard/clients/new — NOT /dashboard
   *
   * The previous default was "/dashboard".  After a successful login the
   * Server Action would redirect to /dashboard, which has a redirect stub to
   * /dashboard/clients/new.  That extra hop meant the browser made another
   * request to a /dashboard/* path.  If session cookies were not forwarded on
   * the middleware's redirect responses (the other bug, now fixed), the
   * middleware guard would fire again and send the user back to /login.
   *
   * Going directly to /dashboard/clients/new removes the extra hop entirely.
   */
  const nextPath = searchParams.get("next") ?? "/dashboard/clients/new";

  const [result, formAction, isPending] = useActionState(
    async (_prev: AuthResult | null, formData: FormData) => {
      formData.set("next", nextPath);
      return await signIn(formData);
    },
    initialState
  );

  const [showSuccess, setShowSuccess] = useState(false);
  useEffect(() => {
    if (result?.success) setShowSuccess(true);
  }, [result]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600;700&display=swap');
        .pw-login-page { font-family: 'DM Sans', sans-serif; }
        .pw-login-page input::placeholder { color: #3d4d63; }
      `}</style>

      <div
        className="pw-login-page"
        style={{
          minHeight: "100vh", background: C.bg,
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "24px", position: "relative",
        }}
      >
        <AmbientBackground />

        <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 420 }}>

          {/* Logotype */}
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <img src="/whale-logo.png" alt="PolyWhale" style={{ height: 38, width: "auto", objectFit: "contain", display: "block", flexShrink: 0 }} />
              <span style={{
                fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800,
                letterSpacing: "-0.02em", color: "#fff",
              }}>
                Poly<span style={{ color: C.accent }}>Whale</span>
              </span>
            </div>
            <p style={{ fontSize: 13, color: C.textSecondary, marginTop: 6 }}>
              Dashboard — Restricted Access
            </p>
          </div>

          {/* Glass card */}
          <div style={{
            background: C.bgCard,
            backdropFilter: "blur(22px)", WebkitBackdropFilter: "blur(22px)",
            border: "1px solid rgba(0,229,204,0.10)", borderRadius: 20,
            padding: "32px 30px 28px",
            boxShadow: "0 0 60px -16px rgba(0,229,204,0.14), inset 0 1px 0 rgba(255,255,255,0.04)",
          }}>
            <div style={{ marginBottom: 26 }}>
              <h1 style={{
                fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800,
                letterSpacing: "-0.02em", color: "#fff", marginBottom: 6,
              }}>
                Sign In
              </h1>
              <p style={{ fontSize: 13, color: C.textSecondary, lineHeight: 1.6 }}>
                Enter your credentials to access the whale copy-trading dashboard.
              </p>
            </div>

            <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <EmailField />
              <PasswordField />

              {result && !result.success && (
                <div style={{
                  display: "flex", alignItems: "flex-start", gap: 9,
                  padding: "11px 13px", borderRadius: 10,
                  background: "rgba(244,114,182,0.06)", border: "1px solid rgba(244,114,182,0.22)",
                }}>
                  <svg style={{ flexShrink: 0, marginTop: 1, color: "#f472b6" }}
                    width="14" height="14" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <p style={{ fontSize: 13, color: "#f472b6", lineHeight: 1.5 }}>{result.error}</p>
                </div>
              )}

              {showSuccess && (
                <div style={{
                  display: "flex", alignItems: "center", gap: 9,
                  padding: "11px 13px", borderRadius: 10,
                  background: "rgba(0,229,204,0.06)", border: "1px solid rgba(0,229,204,0.22)",
                }}>
                  <svg style={{ flexShrink: 0, color: C.accent }}
                    width="14" height="14" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <p style={{ fontSize: 13, color: C.accent }}>Authenticated — redirecting…</p>
                </div>
              )}

              <div style={{ paddingTop: 4 }}>
                <SignInButton pending={isPending} />
              </div>
            </form>
          </div>

          <p style={{
            textAlign: "center", marginTop: 20,
            fontSize: 12, color: "#3d4d63", lineHeight: 1.6,
          }}>
            Access is restricted to authorised operators only.<br />
            <span style={{ color: "#2a3a50" }}>AES-256-GCM encrypted · Polygon Mainnet</span>
          </p>
        </div>
      </div>
    </>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   PAGE — default export: thin Suspense shell
   The fallback matches the page background exactly — no flash of white.
   ══════════════════════════════════════════════════════════════════════════════ */
export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div style={{
          minHeight: "100vh", background: "#060b18",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg style={{ animation: "pw-spin 0.9s linear infinite", opacity: 0.35 }}
            width="28" height="28" viewBox="0 0 24 24"
            fill="none" stroke="#00e5cc" strokeWidth={2}>
            <path d="M21 12a9 9 0 11-6.219-8.56" strokeLinecap="round" />
          </svg>
          <style>{`
            @keyframes pw-spin {
              from { transform: rotate(0deg); }
              to   { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}