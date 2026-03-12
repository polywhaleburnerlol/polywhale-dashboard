/**
 * src/app/dashboard/settings/page.tsx — Settings (Server Component)
 *
 * Fetches clients, bot_heartbeat, whale_watchlist, and env-based bot config.
 * Same defensive try/catch + safeNum/safeStr pattern as other pages.
 */

export const dynamic = "force-dynamic";

import { createSupabaseServerClient } from "../../../utils/supabase/server";
import SettingsClient from "./SettingsClient";
import type { SettingsData } from "./SettingsClient";

function safeNum(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function safeStr(v: unknown, fallback = ""): string {
  return typeof v === "string" && v.length > 0 ? v : fallback;
}

export default async function SettingsPage() {
  const empty: SettingsData = {
    clients: [],
    whaleAddresses: [],
    envWhaleAddresses: [],
    lastHeartbeatIso: null,
    botConfig: {
      dedupWindowMs: 10000,
      maxSlippagePct: 0.02,
      polygonWssUrl: "",
      heartbeatPort: 3001,
    },
  };

  let supabase;
  try {
    supabase = await createSupabaseServerClient();
  } catch (err) {
    console.error("[settings] createSupabaseServerClient() threw:", err);
    return <SettingsClient data={empty} />;
  }

  /* ── 1. Active clients ──────────────────────────────────────────────── */
  let rawClients: any[] = [];
  try {
    const { data, error } = await supabase
      .from("clients")
      .select("id, label, funder_address, trade_amount_usd, is_active")
      .order("created_at", { ascending: false });

    if (error) console.error("[settings] clients query error:", error.message);
    else rawClients = data ?? [];
  } catch (err) {
    console.error("[settings] clients query threw:", err);
  }

  /* ── 2. Whale watchlist ─────────────────────────────────────────────── */
  let rawWhales: any[] = [];
  try {
    const { data, error } = await supabase
      .from("whale_watchlist")
      .select("id, address, label, added_at")
      .order("added_at", { ascending: true });

    if (error) {
      // Table may not exist yet — that's fine
      console.warn("[settings] whale_watchlist query error:", error.message);
    } else {
      rawWhales = data ?? [];
    }
  } catch (err) {
    console.warn("[settings] whale_watchlist query threw:", err);
  }

  /* ── 3. Bot heartbeat ───────────────────────────────────────────────── */
  let lastHeartbeatIso: string | null = null;
  try {
    const { data: hb } = await supabase
      .from("bot_heartbeat")
      .select("updated_at")
      .eq("id", 1)
      .single();
    lastHeartbeatIso = hb?.updated_at ?? null;
  } catch {
    // table may not exist yet
  }

  /* ── 4. Bot config from env vars ────────────────────────────────────── */
  /* ── 5. Parse WHALE_ADDRESSES env var ──────────────────────────────── */
  const envWhaleAddresses: string[] = (process.env.WHALE_ADDRESSES ?? "")
    .split(",")
    .map(a => a.trim().toLowerCase())
    .filter(a => a.startsWith("0x") && a.length === 42);

  const botConfig = {
    dedupWindowMs:  safeNum(process.env.DEDUP_WINDOW_MS)  || 10000,
    maxSlippagePct: parseFloat(process.env.MAX_SLIPPAGE_PCT ?? "") || 0.02,
    polygonWssUrl:  safeStr(process.env.POLYGON_WSS_URL),
    heartbeatPort:  safeNum(process.env.HEARTBEAT_PORT) || 3001,
  };

  /* ── 5. Assemble payload ────────────────────────────────────────────── */
  const clients = rawClients.map((c, i) => ({
    id:               safeStr(c.id, `client-${i}`),
    label:            safeStr(c.label) || `Wallet ${i + 1}`,
    funder_address:   safeStr(c.funder_address),
    trade_amount_usd: safeNum(c.trade_amount_usd),
    is_active:        Boolean(c.is_active),
  }));

  const whaleAddresses = rawWhales.map((w, i) => ({
    id:       safeStr(w.id, `whale-${i}`),
    address:  safeStr(w.address),
    label:    safeStr(w.label),
    added_at: safeStr(w.added_at),
  }));

  return (
    <SettingsClient
      data={{ clients, whaleAddresses, envWhaleAddresses, lastHeartbeatIso, botConfig }}
    />
  );
}