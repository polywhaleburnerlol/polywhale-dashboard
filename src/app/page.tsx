"use client";

/**
 * app/dashboard/clients/new/page.tsx
 *
 * UI only — Server Action, encryption imports, and name attributes untouched.
 * Changes: de-jargonized labels, HowToGuide accordions, TradeSlider component.
 */

import { useActionState, useState } from "react";
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

/* ════════════════════════════════════════════════════════════════
   HOW-TO GUIDE — expandable inline helper accordion
   ════════════════════════════════════════════════════════════════ */
function HowToGuide({ steps }: { steps: string[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ marginTop: 2 }}>
      {/* Toggle trigger */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "inline-flex", alignItems: "center", gap: 5,
          background: "none", border: "none", cursor: "pointer", padding: 0,
          fontSize: 11.5, fontWeight: 600, letterSpacing: "0.01em",
          color: open ? C.accent : "#4a6080",
          transition: "color 0.18s",
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        {/* Animated chevron */}
        <svg
          width="12" height="12" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"
          style={{
            transform: open ? "rotate(90deg)" : "rotate(0deg)",
            transition: "transform 0.22s cubic-bezier(0.16,1,0.3,1)",
            color: open ? C.accent : "#4a6080",
          }}
        >
          <path d="M9 18l6-6-6-6" />
        </svg>
        Where do I find this?
      </button>

      {/* Expandable body */}
      <div style={{
        overflow: "hidden",
        maxHeight: open ? 200 : 0,
        opacity: open ? 1 : 0,
        transition: "max-height 0.32s cubic-bezier(0.16,1,0.3,1), opacity 0.22s ease",
      }}>
        <div style={{
          marginTop: 10,
          padding: "12px 14px",
          borderRadius: 10,
          background: "rgba(0,229,204,0.04)",
          border: "1px solid rgba(0,229,204,0.12)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
        }}>
          <p style={{
            fontSize: 11, fontWeight: 700, letterSpacing: "0.08em",
            textTransform: "uppercase", color: C.accent,
            marginBottom: 8, fontFamily: "'Syne', sans-serif",
          }}>
            Quick Guide
          </p>
          <ol style={{ paddingLeft: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
            {steps.map((step, i) => (
              <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 9 }}>
                {/* Step number badge */}
                <span style={{
                  flexShrink: 0, width: 18, height: 18, borderRadius: "50%",
                  background: "rgba(0,229,204,0.12)",
                  border: "1px solid rgba(0,229,204,0.22)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 9.5, fontWeight: 800, color: C.accent,
                  fontFamily: "'Syne', sans-serif", marginTop: 1,
                }}>
                  {i + 1}
                </span>
                <span style={{ fontSize: 12.5, lineHeight: 1.55, color: "#a0b4c8" }}
                  dangerouslySetInnerHTML={{ __html: step }}
                />
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   TRADE SLIDER — range input + quick-select pills
   name="trade_amount_usd" hidden input ensures backend compatibility
   ════════════════════════════════════════════════════════════════ */
const QUICK_AMOUNTS = [1, 5, 10, 25];

function TradeSlider() {
  const [amount, setAmount] = useState(5);

  const pct = ((amount - 1) / (100 - 1)) * 100;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
      {/* Label row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <label style={{
          fontSize: 11.5, fontWeight: 700, letterSpacing: "0.09em",
          textTransform: "uppercase", color: "#4a5a72",
          fontFamily: "'Syne', sans-serif",
        }}>
          Trade Size per Signal
          <span style={{ color: C.accent, marginLeft: 4, fontWeight: 800 }}>*</span>
        </label>
        {/* Live value display */}
        <div style={{
          display: "flex", alignItems: "baseline", gap: 3,
          padding: "3px 10px", borderRadius: 7,
          background: "rgba(0,229,204,0.08)",
          border: "1px solid rgba(0,229,204,0.20)",
        }}>
          <span style={{
            fontSize: 18, fontWeight: 800, color: C.accent,
            fontFamily: "'Syne', sans-serif", lineHeight: 1,
          }}>
            ${amount}
          </span>
          <span style={{ fontSize: 11, color: "#4a6080", fontWeight: 600 }}>USD</span>
        </div>
      </div>

      {/* ── Range slider ── */}
      <style>{`
        .pw-slider {
          -webkit-appearance: none; appearance: none;
          width: 100%; height: 4px; border-radius: 4px; outline: none; cursor: pointer;
          background: linear-gradient(
            90deg,
            #00e5cc 0%,
            #7c5cfc ${pct}%,
            rgba(255,255,255,0.07) ${pct}%,
            rgba(255,255,255,0.07) 100%
          );
          transition: background 0.12s;
        }
        .pw-slider::-webkit-slider-thumb {
          -webkit-appearance: none; appearance: none;
          width: 20px; height: 20px; border-radius: 50%;
          background: linear-gradient(135deg, #00e5cc, #7c5cfc);
          cursor: pointer;
          box-shadow: 0 0 0 3px rgba(0,229,204,0.15), 0 2px 8px rgba(0,0,0,0.5);
          transition: box-shadow 0.18s, transform 0.18s;
        }
        .pw-slider::-webkit-slider-thumb:hover {
          box-shadow: 0 0 0 5px rgba(0,229,204,0.22), 0 2px 12px rgba(0,229,204,0.35);
          transform: scale(1.12);
        }
        .pw-slider::-moz-range-thumb {
          width: 20px; height: 20px; border-radius: 50%; border: none;
          background: linear-gradient(135deg, #00e5cc, #7c5cfc);
          cursor: pointer;
          box-shadow: 0 0 0 3px rgba(0,229,204,0.15);
        }
        /* Quick-select pill buttons */
        .pw-pill {
          flex: 1; padding: 7px 4px; border-radius: 8px; cursor: pointer;
          font-size: 13px; font-weight: 700; font-family: 'DM Sans', sans-serif;
          border: 1px solid rgba(0,229,204,0.14);
          background: rgba(0,229,204,0.04);
          color: #8492a6;
          transition: all 0.18s cubic-bezier(0.16,1,0.3,1);
        }
        .pw-pill:hover {
          border-color: rgba(0,229,204,0.28);
          color: #00e5cc;
          background: rgba(0,229,204,0.08);
        }
        .pw-pill-active {
          border-color: rgba(0,229,204,0.40) !important;
          background: rgba(0,229,204,0.12) !important;
          color: #00e5cc !important;
          box-shadow: 0 0 14px -4px rgba(0,229,204,0.30);
        }
      `}</style>

      <input
        type="range"
        className="pw-slider"
        min={1}
        max={100}
        step={1}
        value={amount}
        onChange={(e) => setAmount(Number(e.target.value))}
      />

      {/* Min / max labels */}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: -4 }}>
        <span style={{ fontSize: 10.5, color: "#3d4d63" }}>$1</span>
        <span style={{ fontSize: 10.5, color: "#3d4d63" }}>$100</span>
      </div>

      {/* Quick-select pills */}
      <div style={{ display: "flex", gap: 8, marginTop: 2 }}>
        {QUICK_AMOUNTS.map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setAmount(v)}
            className={`pw-pill${amount === v ? " pw-pill-active" : ""}`}
          >
            ${v}
          </button>
        ))}
      </div>

      <p style={{ fontSize: 11.5, lineHeight: 1.5, color: "#3d4d63" }}>
        Amount of USDC placed on every copied trade. You can change this anytime.
      </p>

      {/* Hidden input — keeps name="trade_amount_usd" for the Server Action */}
      <input type="hidden" name="trade_amount_usd" value={amount} />
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   FIELD — standard text / password input (unchanged from v1)
   ════════════════════════════════════════════════════════════════ */
function Field({
  label, name, type = "text", placeholder, hint, required = true,
  guide,
}: {
  label: string; name: string; type?: string;
  placeholder?: string; hint?: string; required?: boolean;
  guide?: string[];
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
        {required && <span style={{ color: C.accent, marginLeft: 4, fontWeight: 800 }}>*</span>}
      </label>

      <div style={{ position: "relative" }}>
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
            padding: "11px 14px", borderRadius: 10,
            background: focused ? "rgba(0,229,204,0.04)" : "rgba(6,11,24,0.7)",
            border: `1px solid ${focused ? "rgba(0,229,204,0.35)" : "rgba(0,229,204,0.10)"}`,
            color: C.textPrimary, fontSize: 13.5,
            fontFamily: "'DM Sans', monospace",
            outline: "none",
            transition: "all 0.2s cubic-bezier(0.16,1,0.3,1)",
          }}
        />
      </div>

      {hint && <p style={{ fontSize: 11.5, lineHeight: 1.5, color: "#3d4d63" }}>{hint}</p>}
      {guide && <HowToGuide steps={guide} />}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   SECTION LABEL (unchanged)
   ════════════════════════════════════════════════════════════════ */
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

/* ════════════════════════════════════════════════════════════════
   SHIMMER BUTTON (unchanged)
   ════════════════════════════════════════════════════════════════ */
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
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
      <button
        type="submit"
        disabled={pending}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={pending ? "" : "pw-shimmer-btn"}
        style={{
          width: "100%", padding: "14px 20px",
          borderRadius: 12, border: "none",
          cursor: pending ? "not-allowed" : "pointer",
          background: pending ? "rgba(0,229,204,0.08)" : undefined,
          color: pending ? C.textSecondary : "#060b18",
          fontSize: 15, fontWeight: 800, letterSpacing: "0.04em",
          fontFamily: "'Syne', sans-serif",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          transform: hovered && !pending ? "translateY(-2px)" : "translateY(0)",
          boxShadow: hovered && !pending ? "0 8px 32px -4px rgba(0,229,204,0.45)" : "none",
          transition: "transform 0.2s cubic-bezier(0.16,1,0.3,1), box-shadow 0.2s ease",
        }}
      >
        {pending ? (
          <>
            <svg style={{ animation: "spin 0.8s linear infinite" }}
              width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path d="M21 12a9 9 0 11-6.219-8.56" strokeLinecap="round" />
            </svg>
            Encrypting & Saving…
          </>
        ) : (
          <>
            Connect Wallet & Start Copying
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </>
        )}
      </button>
    </>
  );
}

/* ════════════════════════════════════════════════════════════════
   PAGE
   ════════════════════════════════════════════════════════════════ */
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
        .pw-form-page input::placeholder { color: #3d4d63; }
      `}</style>

      <div className="pw-form-page" style={{
        minHeight: "100vh", background: C.bg,
        padding: "48px 24px 80px", position: "relative",
      }}>
        <div className="pw-page-glow-tl" aria-hidden />
        <div className="pw-page-glow-br" aria-hidden />

        {/* ── Page header ── */}
        <div style={{
          maxWidth: 520, margin: "0 auto 32px",
          textAlign: "center", position: "relative", zIndex: 1,
        }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "6px 16px", borderRadius: 100,
            background: "rgba(0,229,204,0.07)",
            border: "1px solid rgba(0,229,204,0.18)", marginBottom: 20,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.accent, flexShrink: 0 }} />
            <span style={{
              fontSize: 11.5, fontWeight: 700, letterSpacing: "0.09em",
              textTransform: "uppercase", color: C.accent,
              fontFamily: "'Syne', sans-serif",
            }}>
              New Account Setup
            </span>
          </div>

          <h1 style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: "clamp(24px, 4vw, 32px)",
            fontWeight: 800, letterSpacing: "-0.025em",
            color: "#fff", marginBottom: 12, lineHeight: 1.1,
          }}>
            Start Copying{" "}
            <span style={{
              background: "linear-gradient(135deg, #00e5cc, #7c5cfc)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              Whale Trades
            </span>
            {" "}Today
          </h1>
          <p style={{ fontSize: 14, lineHeight: 1.7, color: C.textSecondary, maxWidth: 400, margin: "0 auto" }}>
            Connect your Polymarket wallet and the bot will automatically mirror top whale trades into your account.
          </p>
        </div>

        {/* ── Form card ── */}
        <div style={{ maxWidth: 520, margin: "0 auto", position: "relative", zIndex: 1 }}>

          {/* Security notice */}
          <div style={{
            display: "flex", gap: 13,
            padding: "14px 16px", borderRadius: 12, marginBottom: 20,
            background: "rgba(0,229,204,0.04)",
            border: "1px solid rgba(0,229,204,0.15)",
            boxShadow: "0 0 40px -16px rgba(0,229,204,0.15)",
          }}>
            <div style={{
              width: 34, height: 34, borderRadius: 9, flexShrink: 0,
              background: "linear-gradient(135deg, rgba(0,229,204,0.2), rgba(124,92,252,0.15))",
              border: "1px solid rgba(0,229,204,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center", color: C.accent,
            }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <polyline points="9 12 11 14 15 10" />
              </svg>
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: C.accent, marginBottom: 3 }}>
                Your Keys Stay Private
              </p>
              <p style={{ fontSize: 12, lineHeight: 1.6, color: "rgba(0,229,204,0.6)" }}>
                Everything you enter is encrypted with{" "}
                <code style={{ fontFamily: "monospace", fontWeight: 700, color: C.accent, fontSize: 11.5 }}>
                  AES-256-GCM
                </code>{" "}
                on our server before being stored. Your plaintext credentials never touch the database.
              </p>
            </div>
          </div>

          {/* Form */}
          <form
            action={formAction}
            style={{
              background: C.bgCard,
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "1px solid rgba(0,229,204,0.10)",
              borderRadius: 18, padding: "28px 28px 24px",
              boxShadow: "0 0 60px -16px rgba(0,229,204,0.12), inset 0 1px 0 rgba(255,255,255,0.04)",
              display: "flex", flexDirection: "column", gap: 18,
            }}
          >

            {/* ── Section 1: Account ── */}
            <SectionLabel>Your Account</SectionLabel>

            <Field
              label="Account Nickname"
              name="label"
              placeholder="e.g. My Main Wallet"
              hint="Just a name to identify this account in your dashboard."
            />

            <Field
              label="Polymarket Wallet Address"
              name="funder_address"
              placeholder="0xF936..."
              hint="Your Gnosis Safe address on Polygon — this is where your USDC and winnings live."
              guide={[
                'Go to <strong>polymarket.com</strong> and click your avatar in the top-right.',
                'Select <strong>Profile</strong> — your wallet address is shown at the top. Copy it.',
              ]}
            />

            {/* ── Trade size slider ── */}
            <TradeSlider />

            {/* ── Section 2: API Access ── */}
            <SectionLabel>API Access</SectionLabel>

            <Field
              label="Wallet Private Key"
              name="private_key"
              type="password"
              placeholder="0x..."
              hint="Used to sign orders on your behalf. Never shared or stored in plaintext."
              guide={[
                'This is the private key for the <strong>EOA wallet</strong> that controls your Gnosis Safe.',
                'Export it from MetaMask via <strong>Account Details → Export Private Key</strong>.',
              ]}
            />

            <Field
              label="Polymarket API Key"
              name="poly_api_key"
              type="password"
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              hint="Grants the bot permission to trade on your account. Encrypted before storage."
              guide={[
                'Log in to <strong>polymarket.com</strong>, open your profile menu, and go to <strong>Settings</strong>.',
                'Click <strong>API Keys → Create New Key</strong>. Copy the API Key shown.',
              ]}
            />

            <Field
              label="API Secret"
              name="poly_secret"
              type="password"
              placeholder="Your API secret"
              hint="Shown once when you create your API Key — copy it immediately."
              guide={[
                'Created alongside your API Key in <strong>Polymarket Settings → API Keys</strong>.',
                'If you lost it, delete the old key and create a new one.',
              ]}
            />

            <Field
              label="API Passphrase"
              name="poly_passphrase"
              type="password"
              placeholder="Your API passphrase"
              hint="The passphrase you chose when creating your Polymarket API key."
              guide={[
                'This is the custom passphrase <strong>you set</strong> when creating the API key.',
                "If you forgot it, go to <strong>Settings → API Keys</strong>, delete the key, and create a fresh one.",
              ]}
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
                    Account connected! The bot is now live.
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

            <p style={{ textAlign: "center", fontSize: 11.5, lineHeight: 1.5, color: "#3d4d63" }}>
              Fields marked <span style={{ color: C.accent }}>*</span> are required.
              Everything is encrypted before it leaves your browser session.
            </p>
          </form>
        </div>
      </div>
    </>
  );
}