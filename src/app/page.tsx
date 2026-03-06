"use client";

/**
 * app/dashboard/clients/new/page.tsx
 *
 * UI only — all backend logic (Server Action, encryption, Supabase insert)
 * is unchanged.  Only JSX structure and styles have been updated to match
 * the polywhale-main design system.
 */

import { useActionState } from "react";
import { useState } from "react";
import { registerClient, type ActionResult } from "@/app/actions/client";

/* ── Design tokens ──────────────────────────────────────────────────────── */
const C = {
  bg:            "#060b18",
  bgCard:        "rgba(12,20,40,0.65)",
  accent:        "#00e5cc",
  accentAlt:     "#7c5cfc",
  textPrimary:   "#e2e8f0",
  textSecondary: "#8492a6",
  border:        "rgba(0,229,204,0.12)",
};

/* ── Field group ────────────────────────────────────────────────────────── */
function Field({
  label, name, type = "text", placeholder, hint, required = true,
}: {
  label: string; name: string; type?: string;
  placeholder?: string; hint?: string; required?: boolean;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
      <label
        htmlFor={name}
        style={{
          fontSize: 11.5, fontWeight: 700, letterSpacing: "0.09em",
          textTransform: "uppercase",
          color: focused ? C.accent : "#4a5a72",
          transition: "color 0.18s",
          fontFamily: "'Syne', sans-serif",
        }}
      >
        {label}
        {required && (
          <span style={{ color: C.accent, marginLeft: 4, fontWeight: 800 }}>*</span>
        )}
      </label>

      <div style={{ position: "relative" }}>
        {/* Glow ring shown on focus */}
        {focused && (
          <div style={{
            position: "absolute", inset: -1, borderRadius: 11,
            background: "linear-gradient(135deg, rgba(0,229,204,0.25), rgba(124,92,252,0.15))",
            pointerEvents: "none", zIndex: 0,
            boxShadow: "0 0 20px -4px rgba(0,229,204,0.3)",
          }} />
        )}
        <input
          id={name}
          name={name}
          type={type}
          placeholder={placeholder}
          required={required}
          autoComplete="off"
          spellCheck={false}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            position: "relative", zIndex: 1,
            width: "100%", display: "block",
            padding: "11px 14px",
            borderRadius: 10,
            background: focused ? "rgba(0,229,204,0.04)" : "rgba(6,11,24,0.7)",
            border: `1px solid ${focused ? "rgba(0,229,204,0.35)" : "rgba(0,229,204,0.10)"}`,
            color: C.textPrimary,
            fontSize: 13.5,
            fontFamily: "'DM Sans', monospace",
            outline: "none",
            transition: "all 0.2s cubic-bezier(0.16,1,0.3,1)",
          }}
        />
      </div>

      {hint && (
        <p style={{ fontSize: 11.5, lineHeight: 1.5, color: "#3d4d63" }}>{hint}</p>
      )}
    </div>
  );
}

/* ── Section divider ────────────────────────────────────────────────────── */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "4px 0" }}>
      <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, rgba(0,229,204,0.15), transparent)" }} />
      <span style={{
        fontSize: 10.5, fontWeight: 700, letterSpacing: "0.12em",
        textTransform: "uppercase", color: "#4a5a72",
        fontFamily: "'Syne', sans-serif",
      }}>
        {children}
      </span>
      <div style={{ flex: 1, height: 1, background: "linear-gradient(270deg, rgba(0,229,204,0.15), transparent)" }} />
    </div>
  );
}

/* ── Submit button with shimmer ─────────────────────────────────────────── */
function ShimmerButton({ pending }: { pending: boolean }) {
  const [hovered, setHovered] = useState(false);

  return (
    <>
      <style>{`
        @keyframes pw-shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }
        .pw-shimmer-btn {
          background: linear-gradient(110deg, #00e5cc 0%, #00e5cc 40%, #7dfff0 50%, #00e5cc 60%, #00e5cc 100%);
          background-size: 200% 100%;
          animation: pw-shimmer 3s ease-in-out infinite;
        }
      `}</style>

      <button
        type="submit"
        disabled={pending}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={pending ? "" : "pw-shimmer-btn"}
        style={{
          width: "100%",
          padding: "14px 20px",
          borderRadius: 12, border: "none",
          cursor: pending ? "not-allowed" : "pointer",
          background: pending
            ? "rgba(0,229,204,0.08)"
            : undefined,           /* shimmer class handles it when not pending */
          color: pending ? C.textSecondary : "#060b18",
          fontSize: 15,
          fontWeight: 800,
          letterSpacing: "0.04em",
          fontFamily: "'Syne', sans-serif",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          transform: hovered && !pending ? "translateY(-2px)" : "translateY(0)",
          boxShadow: hovered && !pending
            ? "0 8px 32px -4px rgba(0,229,204,0.45)"
            : "none",
          transition: "transform 0.2s cubic-bezier(0.16,1,0.3,1), box-shadow 0.2s ease",
        }}
      >
        {pending ? (
          <>
            <svg
              style={{ animation: "spin 0.8s linear infinite" }}
              width="16" height="16" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth={2.5}
            >
              <path d="M21 12a9 9 0 11-6.219-8.56" strokeLinecap="round" />
            </svg>
            Encrypting & Saving…
          </>
        ) : (
          <>
            Register Client
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </>
        )}
      </button>

      {/* spin keyframe */}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </>
  );
}

/* ── Page ───────────────────────────────────────────────────────────────── */
const initialState: ActionResult | null = null;

export default function NewClientPage() {
  const [result, formAction, isPending] = useActionState(
    async (_prev: ActionResult | null, formData: FormData) => {
      return await registerClient(formData);
    },
    initialState
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600;700&display=swap');
        .pw-form-page { font-family: 'DM Sans', sans-serif; }

        /* Ambient page glow */
        .pw-page-glow-tl {
          position: fixed; top: -200px; left: -200px;
          width: 600px; height: 600px; border-radius: 50%;
          background: radial-gradient(circle, rgba(124,92,252,0.07), transparent 65%);
          pointer-events: none; z-index: 0;
        }
        .pw-page-glow-br {
          position: fixed; bottom: -200px; right: -100px;
          width: 500px; height: 500px; border-radius: 50%;
          background: radial-gradient(circle, rgba(0,229,204,0.06), transparent 65%);
          pointer-events: none; z-index: 0;
        }

        /* Input placeholder color */
        .pw-form-page input::placeholder { color: #3d4d63; }
      `}</style>

      <div className="pw-form-page" style={{
        minHeight: "100vh",
        background: C.bg,
        padding: "48px 24px 80px",
        position: "relative",
      }}>
        {/* Ambient glows */}
        <div className="pw-page-glow-tl" aria-hidden />
        <div className="pw-page-glow-br" aria-hidden />

        {/* ── Page header ── */}
        <div style={{
          maxWidth: 520, margin: "0 auto 32px",
          textAlign: "center", position: "relative", zIndex: 1,
        }}>
          {/* Badge */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "6px 16px", borderRadius: 100,
            background: "rgba(0,229,204,0.07)",
            border: "1px solid rgba(0,229,204,0.18)",
            marginBottom: 20,
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: "50%",
              background: C.accent, flexShrink: 0,
            }} />
            <span style={{
              fontSize: 11.5, fontWeight: 700, letterSpacing: "0.09em",
              textTransform: "uppercase", color: C.accent,
              fontFamily: "'Syne', sans-serif",
            }}>
              New Client Setup
            </span>
          </div>

          <h1 style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: "clamp(24px, 4vw, 32px)",
            fontWeight: 800, letterSpacing: "-0.025em",
            color: "#fff", marginBottom: 12, lineHeight: 1.1,
          }}>
            Register a{" "}
            <span style={{
              background: "linear-gradient(135deg, #00e5cc, #7c5cfc)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              Copy-Trading
            </span>{" "}
            Account
          </h1>
          <p style={{ fontSize: 14, lineHeight: 1.7, color: C.textSecondary, maxWidth: 400, margin: "0 auto" }}>
            Connect a Polymarket wallet so the bot can mirror whale trades on its behalf.
          </p>
        </div>

        {/* ── Form card ── */}
        <div style={{
          maxWidth: 520, margin: "0 auto",
          position: "relative", zIndex: 1,
        }}>

          {/* Security notice */}
          <div style={{
            display: "flex", gap: 13,
            padding: "14px 16px", borderRadius: 12, marginBottom: 20,
            background: "rgba(0,229,204,0.04)",
            border: "1px solid rgba(0,229,204,0.15)",
            boxShadow: "0 0 40px -16px rgba(0,229,204,0.15)",
          }}>
            {/* Shield icon */}
            <div style={{
              width: 34, height: 34, borderRadius: 9, flexShrink: 0,
              background: "linear-gradient(135deg, rgba(0,229,204,0.2), rgba(124,92,252,0.15))",
              border: "1px solid rgba(0,229,204,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: C.accent,
            }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <polyline points="9 12 11 14 15 10" />
              </svg>
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: C.accent, marginBottom: 3 }}>
                Security Notice
              </p>
              <p style={{ fontSize: 12, lineHeight: 1.6, color: "rgba(0,229,204,0.6)" }}>
                Your private key, API key, secret, and passphrase are encrypted with{" "}
                <code style={{
                  fontFamily: "monospace", fontWeight: 700,
                  color: C.accent, fontSize: 11.5,
                }}>
                  AES-256-GCM
                </code>{" "}
                server-side before storage. Plaintext never touches the database.
              </p>
            </div>
          </div>

          {/* The form */}
          <form
            action={formAction}
            style={{
              background: C.bgCard,
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "1px solid rgba(0,229,204,0.10)",
              borderRadius: 18,
              padding: "28px 28px 24px",
              boxShadow: "0 0 60px -16px rgba(0,229,204,0.12), inset 0 1px 0 rgba(255,255,255,0.04)",
              display: "flex", flexDirection: "column", gap: 18,
            }}
          >

            {/* ── Identity ── */}
            <SectionLabel>Account Identity</SectionLabel>

            <Field
              label="Display Label"
              name="label"
              placeholder="e.g. Alice's Main Account"
              hint="A human-readable name — visible only in this dashboard."
            />
            <Field
              label="Funder Address (Gnosis Safe)"
              name="funder_address"
              placeholder="0xF936..."
              hint="The Gnosis Safe holding USDC and outcome tokens. Not a secret — stored plaintext."
            />
            <Field
              label="Trade Amount (USD)"
              name="trade_amount_usd"
              type="number"
              placeholder="1.00"
              hint="Fixed BUY size per copied trade (e.g. 5.00)."
            />

            {/* ── Credentials ── */}
            <SectionLabel>Encrypted Credentials</SectionLabel>

            <Field
              label="Private Key"
              name="private_key"
              type="password"
              placeholder="EOA private key (0x...)"
              hint="Signs orders on behalf of the Gnosis Safe. Encrypted before storage."
            />
            <Field
              label="Polymarket API Key"
              name="poly_api_key"
              type="password"
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              hint="From the Polymarket CLOB API dashboard. Encrypted before storage."
            />
            <Field
              label="Polymarket API Secret"
              name="poly_secret"
              type="password"
              placeholder="Your API secret"
              hint="Encrypted before storage."
            />
            <Field
              label="Polymarket API Passphrase"
              name="poly_passphrase"
              type="password"
              placeholder="Your API passphrase"
              hint="Encrypted before storage."
            />

            {/* ── Error ── */}
            {result && !result.success && (
              <div style={{
                display: "flex", alignItems: "flex-start", gap: 10,
                padding: "12px 14px", borderRadius: 10,
                background: "rgba(244,114,182,0.06)",
                border: "1px solid rgba(244,114,182,0.20)",
              }}>
                <span style={{ color: "#f472b6", marginTop: 1, fontSize: 15 }}>✕</span>
                <p style={{ fontSize: 13, color: "#f472b6", lineHeight: 1.5 }}>{result.error}</p>
              </div>
            )}

            {/* ── Success ── */}
            {result?.success && (
              <div style={{
                display: "flex", alignItems: "flex-start", gap: 10,
                padding: "12px 14px", borderRadius: 10,
                background: "rgba(0,229,204,0.06)",
                border: "1px solid rgba(0,229,204,0.20)",
              }}>
                <span style={{ color: C.accent, marginTop: 1, fontSize: 15 }}>✓</span>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: C.accent }}>
                    Client registered successfully
                  </p>
                  <p style={{ fontFamily: "monospace", fontSize: 11, color: "rgba(0,229,204,0.5)", marginTop: 2 }}>
                    ID: {result.clientId}
                  </p>
                </div>
              </div>
            )}

            {/* ── Submit ── */}
            <div style={{ paddingTop: 4 }}>
              <ShimmerButton pending={isPending} />
            </div>

            <p style={{
              textAlign: "center", fontSize: 11.5, lineHeight: 1.5,
              color: "#3d4d63",
            }}>
              Fields marked <span style={{ color: C.accent }}>*</span> are required.
              Credentials are encrypted server-side before reaching the database.
            </p>
          </form>
        </div>
      </div>
    </>
  );
}