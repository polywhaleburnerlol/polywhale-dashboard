/**
 * src/app/dashboard/page.tsx — Overview (Server Component)
 *
 * ── Confirmed schema ─────────────────────────────────────────────────────────
 * clients:  id | created_at | funder_address | private_key | poly_api_key
 *           poly_secret | poly_passphrase | trade_amount_usd | is_active
 * trades:   id | created_at | client_id | asset_id | market_title | side
 *           price | shares | name | order_id | whale_address
 */

export const dynamic = "force-dynamic";

import { createSupabaseServerClient } from "../../utils/supabase/server";
import DashboardOverviewClient from "./DashboardOverviewClient";
import type { DashboardData } from "./DashboardOverviewClient";

function safeNum(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function safeStr(v: unknown, fallback = ""): string {
  return typeof v === "string" && v.length > 0 ? v : fallback;
}

export default async function DashboardOverviewPage() {
  const empty: DashboardData = {
    clients: [],
    recentTrades: [],
    totalTradeCount: 0,
    totalBalanceUsd: 0,
  };

  let supabase;
  try {
    supabase = await createSupabaseServerClient();
  } catch (err) {
    console.error("[dashboard] createSupabaseServerClient() threw:", err);
    return <DashboardOverviewClient data={empty} />;
  }

  /* ── 1. Active clients ──────────────────────────────────────────────────── */
  let rawClients: any[] = [];
  try {
    const { data, error } = await supabase
      .from("clients")
      .select("id, funder_address, trade_amount_usd, is_active")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[dashboard] clients query error:", error.message, error.details, error.hint);
    } else {
      rawClients = data ?? [];
    }
  } catch (err) {
    console.error("[dashboard] clients query threw:", err);
  }

  /* ── 2. Recent trades ───────────────────────────────────────────────────── */
  let rawTrades: any[] = [];
  try {
    const { data, error } = await supabase
      .from("trades")
      .select("id, created_at, client_id, market_title, side, price, shares")
      .order("created_at", { ascending: false })
      .limit(5);

    if (error) {
      console.error("[dashboard] trades query error:", error.message, error.details, error.hint);
    } else {
      rawTrades = data ?? [];
    }
  } catch (err) {
    console.error("[dashboard] trades query threw:", err);
  }

  /* ── 3. Trade count ─────────────────────────────────────────────────────── */
  let totalTradeCount = 0;
  try {
    const { count, error } = await supabase
      .from("trades")
      .select("id", { count: "exact", head: true });

    if (error) {
      console.error("[dashboard] trades count error:", error.message, error.details, error.hint);
    } else {
      totalTradeCount = safeNum(count);
    }
  } catch (err) {
    console.error("[dashboard] trades count threw:", err);
  }

  /* ── 4. Assemble safe payload ───────────────────────────────────────────── */
  const clients = rawClients.map((c, i) => ({
    id:               safeStr(c.id, `client-${i}`),
    label:            `Wallet ${i + 1}`,
    funder_address:   safeStr(c.funder_address),
    trade_amount_usd: safeNum(c.trade_amount_usd),
    is_active:        Boolean(c.is_active),
  }));

  const recentTrades = rawTrades.map((t, i) => ({
    id:           safeStr(t.id, `trade-${i}`),
    created_at:   safeStr(t.created_at, new Date().toISOString()),
    client_id:    safeStr(t.client_id),
    market_title: safeStr(t.market_title, "Untitled Market"),
    side:         safeStr(t.side, "BUY"),
    price:        safeNum(t.price),
    shares:       safeNum(t.shares),
  }));

  const totalBalanceUsd = clients.reduce((s, c) => s + c.trade_amount_usd, 0);

  const payload: DashboardData = {
    clients,
    recentTrades,
    totalTradeCount,
    totalBalanceUsd,
  };

  console.log(
    `[dashboard] OK — ${clients.length} clients, ${recentTrades.length} recent trades, ` +
    `${totalTradeCount} total, $${totalBalanceUsd.toFixed(2)} balance`
  );

  return <DashboardOverviewClient data={payload} />;
}