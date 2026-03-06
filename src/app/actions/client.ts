"use server";

/**
 * app/actions/client.ts
 *
 * Server Actions for client (tenant) management.
 *
 * All actions run exclusively on the server — raw credentials submitted from
 * the onboarding form are encrypted here, in memory, before any Supabase write.
 * Plaintext secrets never leave this function scope.
 */

import { createClient } from "@supabase/supabase-js";
import { encryptCredentials } from "@/lib/encryption";
import { revalidatePath } from "next/cache";

// ---------------------------------------------------------------------------
// Supabase admin client (service-role key — server-only)
// ---------------------------------------------------------------------------

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_KEY;

  if (!url || !key) {
    throw new Error(
      "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in environment variables."
    );
  }

  return createClient(url, key);
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type RegisterClientInput = {
  /** Display name for this tenant (e.g. "Alice's account") */
  label: string;
  /** Gnosis Safe / proxy wallet that holds USDC — NOT encrypted (not a secret) */
  funder_address: string;
  /** EOA private key — will be encrypted before storage */
  private_key: string;
  /** Polymarket CLOB API key — will be encrypted before storage */
  poly_api_key: string;
  /** Polymarket CLOB API secret — will be encrypted before storage */
  poly_secret: string;
  /** Polymarket CLOB API passphrase — will be encrypted before storage */
  poly_passphrase: string;
  /** Per-trade BUY size in USD (e.g. 5.00) */
  trade_amount_usd: number;
};

export type ActionResult =
  | { success: true; clientId: string }
  | { success: false; error: string };

// ---------------------------------------------------------------------------
// registerClient — called directly from the onboarding form's action prop
// ---------------------------------------------------------------------------

/**
 * Validates, encrypts, and inserts a new bot client into the Supabase
 * `clients` table.
 *
 * Encryption contract (matches bot's EncryptionService):
 *   - AES-256-GCM, 12-byte IV, format: iv:tag:encrypted (all hex, colon-delimited)
 *   - Key: ENCRYPTION_SECRET (must be exactly 32 UTF-8 bytes)
 *
 * Fields encrypted: private_key, poly_api_key, poly_secret, poly_passphrase
 * Fields stored plaintext: label, funder_address, trade_amount_usd, is_active
 */
export async function registerClient(
  formData: FormData
): Promise<ActionResult> {
  // ── 1. Parse & basic validation ──────────────────────────────────────────
  const raw: RegisterClientInput = {
    label: (formData.get("label") as string)?.trim(),
    funder_address: (formData.get("funder_address") as string)?.trim().toLowerCase(),
    private_key: (formData.get("private_key") as string)?.trim(),
    poly_api_key: (formData.get("poly_api_key") as string)?.trim(),
    poly_secret: (formData.get("poly_secret") as string)?.trim(),
    poly_passphrase: (formData.get("poly_passphrase") as string)?.trim(),
    trade_amount_usd: parseFloat(formData.get("trade_amount_usd") as string),
  };

  const requiredFields: (keyof RegisterClientInput)[] = [
    "label",
    "funder_address",
    "private_key",
    "poly_api_key",
    "poly_secret",
    "poly_passphrase",
  ];

  for (const field of requiredFields) {
    if (!raw[field]) {
      return { success: false, error: `Missing required field: ${field}` };
    }
  }

  if (!raw.funder_address.startsWith("0x") || raw.funder_address.length !== 42) {
    return {
      success: false,
      error: "Funder address must be a valid 42-character Ethereum address (0x…).",
    };
  }

  if (isNaN(raw.trade_amount_usd) || raw.trade_amount_usd <= 0) {
    return {
      success: false,
      error: "Trade amount must be a positive number.",
    };
  }

  // ── 2. Encrypt sensitive credentials ─────────────────────────────────────
  // encryptCredentials() throws if ENCRYPTION_SECRET is missing or wrong length.
  let encrypted: ReturnType<typeof encryptCredentials>;
  try {
    encrypted = encryptCredentials({
      private_key: raw.private_key,
      poly_api_key: raw.poly_api_key,
      poly_secret: raw.poly_secret,
      poly_passphrase: raw.poly_passphrase,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: `Encryption failed: ${message}` };
  }

  // ── 3. Insert into Supabase ───────────────────────────────────────────────
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("clients")
    .insert({
      label:           raw.label,
      funder_address:  raw.funder_address,
      trade_amount_usd: raw.trade_amount_usd,
      is_active:       true,
      // Encrypted credential columns:
      private_key:     encrypted.private_key,
      poly_api_key:    encrypted.poly_api_key,
      poly_secret:     encrypted.poly_secret,
      poly_passphrase: encrypted.poly_passphrase,
    })
    .select("id")
    .single();

  if (error) {
    return { success: false, error: `Database error: ${error.message}` };
  }

  // Revalidate the clients list page (adjust path to match your routing)
  revalidatePath("/dashboard/clients");

  return { success: true, clientId: data.id };
}