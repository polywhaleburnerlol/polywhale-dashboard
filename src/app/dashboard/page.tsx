/**
 * src/app/dashboard/page.tsx — Overview (Server Component)
 *
 * Async Server Component. Fetches real data from Supabase, then hands it
 * to <DashboardOverviewClient /> which owns all interactive / recharts UI.
 *
 * ── Data flow ────────────────────────────────────────────────────────────────
 *   1. Fetch active clients  → wallets panel
 *   2. Fetch 5 most-recent trades → activity feed
 *   3. Count total trades    → KPI card
 *   4. Sum trade_amount_usd across active clients → total-balance KPI
 *
 * Win Rate and the portfolio chart remain mock — the database doesn't track
 * resolved PnL yet.  When you add an `outcome` / `pnl` column to `trades`,
 * swap those sections for a real query.
 */

import { createSupabaseServerClient } from "../../utils/supabase/server";
import DashboardOverviewClient from "./DashboardOverviewClient";

import type {
  ClientRow,
  TradeRow,
  DashboardData,
} from "./DashboardOverviewClient";

export default async function DashboardOverviewPage() {
  let data: DashboardData = {
    clients: [],
    recentTrades: [],
    totalTradeCount: 0,
    totalBalanceUsd: 0,
  };

  try {
    const supabase = await createSupabaseServerClient();

    // ── 1. Active clients (wallets panel + balance KPI) ─────────────────────
    const { data: clients } = await supabase
      .from("clients")
      .select("id, label, funder_address, trade_amount_usd, is_active")
      .eq("is_active", true)
      .order("label", { ascending: true });

    // ── 2. Five most-recent trades (activity feed) ──────────────────────────
    const { data: trades } = await supabase
      .from("trades")
      .select("id, created_at, client_id, market_title, side, price, shares")
      .order("created_at", { ascending: false })
      .limit(5);

    // ── 3. Total trade count (KPI) ──────────────────────────────────────────
    const { count } = await supabase
      .from("trades")
      .select("id", { count: "exact", head: true });

    // ── Assemble ────────────────────────────────────────────────────────────
    const safeClients: ClientRow[] = (clients ?? []).map((c) => ({
      id: c.id,
      label: c.label ?? "",
      funder_address: c.funder_address ?? "",
      trade_amount_usd: c.trade_amount_usd ?? 0,
      is_active: c.is_active ?? true,
    }));

    const safeTrades: TradeRow[] = (trades ?? []).map((t) => ({
      id: t.id,
      created_at: t.created_at,
      client_id: t.client_id,
      market_title: t.market_title ?? "Untitled Market",
      side: t.side ?? "BUY",
      price: t.price ?? 0,
      shares: t.shares ?? 0,
    }));

    const totalBalance = safeClients.reduce(
      (sum, c) => sum + (c.trade_amount_usd ?? 0),
      0
    );

    data = {
      clients: safeClients,
      recentTrades: safeTrades,
      totalTradeCount: count ?? 0,
      totalBalanceUsd: totalBalance,
    };
  } catch (err) {
    // Supabase unreachable or env vars missing — render with empty data.
    // The client component handles the empty state gracefully.
    console.error("[dashboard/page] Supabase fetch failed:", err);
  }

  return <DashboardOverviewClient data={data} />;
}