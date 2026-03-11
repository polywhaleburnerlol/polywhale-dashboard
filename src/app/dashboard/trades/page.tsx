/**
 * src/app/dashboard/trades/page.tsx — Trade History (Server Component)
 *
 * Fetches all trades + client labels from Supabase, passes to client component.
 * Follows the same defensive patterns as the Overview page.tsx:
 *   - try/catch every query
 *   - safeNum / safeStr for unknown data
 *   - empty-state fallback on any failure
 */

export const dynamic = "force-dynamic";

import { createSupabaseServerClient } from "../../../utils/supabase/server";
import TradeHistoryClient from "./TradeHistoryClient";
import type { TradeHistoryData } from "./TradeHistoryClient";

function safeNum(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function safeStr(v: unknown, fallback = ""): string {
  return typeof v === "string" && v.length > 0 ? v : fallback;
}

export default async function TradeHistoryPage() {
  const empty: TradeHistoryData = { trades: [], clients: [] };

  let supabase;
  try {
    supabase = await createSupabaseServerClient();
  } catch (err) {
    console.error("[trades] createSupabaseServerClient() threw:", err);
    return <TradeHistoryClient data={empty} />;
  }

  /* ── 1. Active clients (for filter dropdown + label mapping) ────────── */
  let rawClients: any[] = [];
  try {
    const { data, error } = await supabase
      .from("clients")
      .select("id, label, funder_address, trade_amount_usd, is_active")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) console.error("[trades] clients query error:", error.message);
    else rawClients = data ?? [];
  } catch (err) {
    console.error("[trades] clients query threw:", err);
  }

  // Build a map of client_id → trade_amount_usd for enriching BUY trade rows
  const clientTradeAmount: Record<string, number> = {};
  for (const c of rawClients) {
    clientTradeAmount[c.id] = safeNum(c.trade_amount_usd);
  }

  /* ── 2. All trades ──────────────────────────────────────────────────── */
  let rawTrades: any[] = [];
  try {
    const { data, error } = await supabase
      .from("trades")
      .select(
        "id, created_at, client_id, market_title, side, price, shares, outcome, order_id, whale_address, asset_id"
      )
      .order("created_at", { ascending: false });

    if (error) console.error("[trades] trades query error:", error.message);
    else rawTrades = data ?? [];
  } catch (err) {
    console.error("[trades] trades query threw:", err);
  }

  /* ── 3. Assemble payload ────────────────────────────────────────────── */
  const clients = rawClients.map((c, i) => ({
    id:             safeStr(c.id, `client-${i}`),
    label:          safeStr(c.label) || `Wallet ${i + 1}`,
    funder_address: safeStr(c.funder_address),
  }));

  const trades = rawTrades.map((t, i) => {
    const isBuy = (t.side ?? "").toUpperCase() === "BUY";
    const tradeAmountUsd = isBuy ? (clientTradeAmount[t.client_id] ?? 0) : 0;

    return {
      id:               safeStr(t.id, `trade-${i}`),
      created_at:       safeStr(t.created_at, new Date().toISOString()),
      client_id:        safeStr(t.client_id),
      market_title:     safeStr(t.market_title, "Untitled Market"),
      outcome:          safeStr(t.outcome, "?"),
      side:             safeStr(t.side, "BUY"),
      price:            safeNum(t.price),
      shares:           t.shares != null ? safeNum(t.shares) : null,
      trade_amount_usd: tradeAmountUsd,
      order_id:         safeStr(t.order_id),
      whale_address:    safeStr(t.whale_address),
      asset_id:         safeStr(t.asset_id),
    };
  });

  return <TradeHistoryClient data={{ trades, clients }} />;
}