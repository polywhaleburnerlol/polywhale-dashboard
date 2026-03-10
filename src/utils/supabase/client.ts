"use server";

import { createClient } from "@supabase/supabase-js";
import { encryptCredentials } from "@/lib/encryption";
import { revalidatePath } from "next/cache";

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.");
  }
  return createClient(url, key);
}

export type RegisterClientInput = {
  label: string;
  funder_address: string;
  private_key: string;
  poly_api_key: string;
  poly_secret: string;
  poly_passphrase: string;
  trade_amount_usd: number;
};

export type ActionResult =
  | { success: true; clientId: string }
  | { success: false; error: string };

export type RemoveResult =
  | { success: true }
  | { success: false; error: string };

export async function registerClient(formData: FormData): Promise<ActionResult> {
  const raw: RegisterClientInput = {
    label:            (formData.get("label") as string)?.trim(),
    funder_address:   (formData.get("funder_address") as string)?.trim().toLowerCase(),
    private_key:      (formData.get("private_key") as string)?.trim(),
    poly_api_key:     (formData.get("poly_api_key") as string)?.trim(),
    poly_secret:      (formData.get("poly_secret") as string)?.trim(),
    poly_passphrase:  (formData.get("poly_passphrase") as string)?.trim(),
    trade_amount_usd: parseFloat(formData.get("trade_amount_usd") as string),
  };

  const requiredFields: (keyof RegisterClientInput)[] = [
    "funder_address", "private_key", "poly_api_key", "poly_secret", "poly_passphrase",
  ];

  for (const field of requiredFields) {
    if (!raw[field]) {
      return { success: false, error: `Missing required field: ${field}` };
    }
  }

  if (!raw.funder_address.startsWith("0x") || raw.funder_address.length !== 42) {
    return { success: false, error: "Funder address must be a valid 42-character Ethereum address (0x...)." };
  }

  if (isNaN(raw.trade_amount_usd) || raw.trade_amount_usd <= 0) {
    return { success: false, error: "Trade amount must be a positive number." };
  }

  let encrypted: ReturnType<typeof encryptCredentials>;
  try {
    encrypted = encryptCredentials({
      private_key:     raw.private_key,
      poly_api_key:    raw.poly_api_key,
      poly_secret:     raw.poly_secret,
      poly_passphrase: raw.poly_passphrase,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: `Encryption failed: ${message}` };
  }

  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("clients")
    .insert({
      funder_address:   raw.funder_address,
      trade_amount_usd: raw.trade_amount_usd,
      is_active:        true,
      private_key:      encrypted.private_key,
      poly_api_key:     encrypted.poly_api_key,
      poly_secret:      encrypted.poly_secret,
      poly_passphrase:  encrypted.poly_passphrase,
    })
    .select("id")
    .single();

  if (error) {
    return { success: false, error: `Database error: ${error.message}` };
  }

  revalidatePath("/dashboard/clients");
  revalidatePath("/dashboard");

  return { success: true, clientId: data.id };
}

export async function removeClient(clientId: string): Promise<RemoveResult> {
  if (!clientId) return { success: false, error: "Missing client ID." };

  const supabase = getSupabaseAdmin();

  const { error } = await supabase
    .from("clients")
    .update({ is_active: false })
    .eq("id", clientId);

  if (error) {
    return { success: false, error: `Database error: ${error.message}` };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/clients");

  return { success: true };
}