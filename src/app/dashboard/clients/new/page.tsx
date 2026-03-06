"use client";

/**
 * app/dashboard/clients/new/page.tsx  (or drop anywhere as a component)
 *
 * Onboarding form for registering a new copy-trading client.
 * Submits to the registerClient Server Action — encryption happens server-side
 * before any DB write.
 */

import { useActionState } from "react";
import { registerClient, type ActionResult } from "@/app/actions/client";

// ---------------------------------------------------------------------------
// Small reusable field components
// ---------------------------------------------------------------------------

function FieldGroup({
  label,
  name,
  type = "text",
  placeholder,
  hint,
  required = true,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  hint?: string;
  required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={name}
        className="text-xs font-semibold uppercase tracking-widest text-zinc-400"
      >
        {label}
        {required && <span className="ml-1 text-amber-400">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        autoComplete="off"
        spellCheck={false}
        className={[
          "w-full rounded-lg border border-zinc-700 bg-zinc-900",
          "px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600",
          "font-mono leading-relaxed",
          "outline-none ring-0",
          "transition-all duration-150",
          "focus:border-amber-400/60 focus:ring-2 focus:ring-amber-400/20",
          "hover:border-zinc-600",
        ].join(" ")}
      />
      {hint && <p className="text-xs text-zinc-500">{hint}</p>}
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 pt-2">
      <span className="h-px flex-1 bg-zinc-800" />
      <span className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
        {children}
      </span>
      <span className="h-px flex-1 bg-zinc-800" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main form component
// ---------------------------------------------------------------------------

const initialState: ActionResult | null = null;

export default function NewClientPage() {
  const [result, formAction, isPending] = useActionState(
    async (_prev: ActionResult | null, formData: FormData) => {
      return await registerClient(formData);
    },
    initialState
  );

  return (
    <div className="min-h-screen bg-zinc-950 px-4 py-16 font-sans antialiased">
      {/* ── Page header ── */}
      <div className="mx-auto mb-10 max-w-xl text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/5 px-4 py-1.5">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
          <span className="text-xs font-semibold uppercase tracking-widest text-amber-400">
            New Client Setup
          </span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">
          Register a Copy-Trading Account
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-zinc-400">
          Connect a Polymarket wallet so the bot can mirror whale trades on its
          behalf.
        </p>
      </div>

      {/* ── Form card ── */}
      <div className="mx-auto max-w-xl">
        {/* Safety note */}
        <div className="mb-6 flex gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
          <div className="mt-0.5 shrink-0 text-emerald-400">
            {/* Shield icon */}
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <polyline points="9 12 11 14 15 10" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-emerald-400">
              Security Notice
            </p>
            <p className="mt-0.5 text-xs leading-relaxed text-emerald-300/70">
              Your private key, API key, secret, and passphrase are encrypted
              with{" "}
              <span className="font-mono font-semibold text-emerald-300">
                AES-256-GCM
              </span>{" "}
              on the server before being stored. The plaintext never touches the
              database. Decryption only occurs in-memory at trade execution time.
            </p>
          </div>
        </div>

        <form
          action={formAction}
          className="flex flex-col gap-5 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-8 shadow-2xl backdrop-blur"
        >
          {/* ── Identity ── */}
          <SectionHeading>Account Identity</SectionHeading>

          <FieldGroup
            label="Display Label"
            name="label"
            placeholder="e.g. Alice's Main Account"
            hint="A human-readable name — visible only in this dashboard."
          />

          <FieldGroup
            label="Funder Address (Proxy / Gnosis Safe)"
            name="funder_address"
            placeholder="0xF936..."
            hint="The Gnosis Safe that holds USDC and outcome tokens. Not a secret — stored plaintext."
          />

          <FieldGroup
            label="Trade Amount (USD)"
            name="trade_amount_usd"
            type="number"
            placeholder="1.00"
            hint="Fixed BUY size per copied trade in USD (e.g. 5.00)."
          />

          {/* ── Credentials ── */}
          <SectionHeading>Encrypted Credentials</SectionHeading>

          <FieldGroup
            label="Private Key"
            name="private_key"
            type="password"
            placeholder="EOA private key (0x...)"
            hint="Signs orders on behalf of the Gnosis Safe. Encrypted before storage."
          />

          <FieldGroup
            label="Polymarket API Key"
            name="poly_api_key"
            type="password"
            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            hint="From the Polymarket CLOB API dashboard. Encrypted before storage."
          />

          <FieldGroup
            label="Polymarket API Secret"
            name="poly_secret"
            type="password"
            placeholder="Your API secret"
            hint="Encrypted before storage."
          />

          <FieldGroup
            label="Polymarket API Passphrase"
            name="poly_passphrase"
            type="password"
            placeholder="Your API passphrase"
            hint="Encrypted before storage."
          />

          {/* ── Result feedback ── */}
          {result && !result.success && (
            <div className="flex items-start gap-3 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3">
              <span className="mt-px shrink-0 text-red-400">✕</span>
              <p className="text-sm text-red-300">{result.error}</p>
            </div>
          )}

          {result?.success && (
            <div className="flex items-start gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
              <span className="mt-px shrink-0 text-emerald-400">✓</span>
              <div>
                <p className="text-sm font-semibold text-emerald-300">
                  Client registered successfully
                </p>
                <p className="mt-0.5 font-mono text-xs text-emerald-400/60">
                  ID: {result.clientId}
                </p>
              </div>
            </div>
          )}

          {/* ── Submit ── */}
          <button
            type="submit"
            disabled={isPending}
            className={[
              "mt-2 w-full rounded-xl py-3.5 text-sm font-bold uppercase tracking-widest",
              "transition-all duration-150",
              isPending
                ? "cursor-not-allowed bg-zinc-700 text-zinc-500"
                : "bg-amber-400 text-zinc-950 hover:bg-amber-300 active:scale-[0.98]",
            ].join(" ")}
          >
            {isPending ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="h-4 w-4 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"
                  />
                </svg>
                Encrypting & Saving…
              </span>
            ) : (
              "Register Client"
            )}
          </button>

          <p className="text-center text-xs text-zinc-600">
            All fields marked{" "}
            <span className="text-amber-400">*</span> are required.
            Credentials are encrypted server-side before the request reaches
            the database.
          </p>
        </form>
      </div>
    </div>
  );
}