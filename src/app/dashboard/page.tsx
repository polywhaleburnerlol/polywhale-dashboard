/**
 * src/app/dashboard/page.tsx — Overview (Server Component)
 *
 * Async Server Component. Fetches real data from Supabase, then passes
 * serialisable props to <DashboardOverviewClient />.
 *
 * ── Robustness contract ──────────────────────────────────────────────────────
 *   • Every Supabase query destructures its `error` and logs it explicitly
 *     so that column mismatches, RLS blocks, and env-var issues surface in
 *     the Vercel function logs instead of hiding behind a digest hash.
 *   • If ANY query fails, its result falls back to [] / 0 — the client
 *     component renders graceful empty states.
 *   • All values passed to the client are coerced to safe primitives
 *     (Number(), String()) so a surprise type from Supabase never crashes
 *     React serialisation.
 *
 * ── Schema assumption (clients table) ────────────────────────────────────────
 *   id  |  funder_address  |  trade_amount_usd  |  is_active
 *   (NO `label` column — we default that to "Wallet" on the client side.)
 *
 * ── Schema assumption (trades table) ─────────────────────────────────────────
 *   id  |  created_at  |  client_id  |  market_title  |  side  |  price  |  shares
 */

export const dynamic = "force-dynamic";

import { createSupabaseServerClient } from "../../utils/supabase/server";
import DashboardOverviewClient from "./DashboardOverviewClient";

import type {
  ClientRow,
  TradeRow,
  DashboardData,
} from "./DashboardOverviewClient";

/* ─── Safe numeric coercion ───────────────────────────────────────────────── */
function safeNum(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export default async function DashboardOverviewPage() {
  // Default empty payload — always serialisable, always renders.
  let data: DashboardData = {
    clients: [],
    recentTrades: [],
    totalTradeCount: 0,
    totalBalanceUsd: 0,
  };

  try {
    const supabase = await createSupabaseServerClient();

    // ── 1. Active clients ───────────────────────────────────────────────────
    // NO `label` column — only columns that actually exist in the table.
    const { data: clients, error: clientsErr } = await supabase
      .from("clients")
      .select("id, funder_address, trade_amount_usd, is_active")
      .eq("is_active", true)
      .order("funder_address", { ascending: true });

    if (clientsErr) {
      console.error(
        "[dashboard/page] clients query failed:",
        clientsErr.message,
        clientsErr.details ?? "",
        clientsErr.hint ?? ""
      );
    }

    // ── 2. Five most-recent trades ──────────────────────────────────────────
    const { data: trades, error: tradesErr } = await supabase
      .from("trades")
      .select("id, created_at, client_id, market_title, side, price, shares")
      .order("created_at", { ascending: false })
      .limit(5);

    if (tradesErr) {
      console.error(
        "[dashboard/page] trades query failed:",
        tradesErr.message,
        tradesErr.details ?? "",
        tradesErr.hint ?? ""
      );
    }

    // ── 3. Total trade count ────────────────────────────────────────────────
    const { count, error: countErr } = await supabase
      .from("trades")
      .select("id", { count: "exact", head: true });

    if (countErr) {
      console.error(
        "[dashboard/page] trades count failed:",
        countErr.message,
        countErr.details ?? "",
        countErr.hint ?? ""
      );
    }

    // ── Assemble: coerce every field to a safe, serialisable primitive ─────
    const safeClients: ClientRow[] = (clients ?? []).map((c) => ({
      id:               String(c.id ?? ""),
      label:            "Main Wallet",           // no label column in DB
      funder_address:   String(c.funder_address ?? ""),
      trade_amount_usd: safeNum(c.trade_amount_usd),
      is_active:        Boolean(c.is_active),
    }));

    const safeTrades: TradeRow[] = (trades ?? []).map((t) => ({
      id:           String(t.id ?? ""),
      created_at:   String(t.created_at ?? new Date().toISOString()),
      client_id:    String(t.client_id ?? ""),
      market_title: String(t.market_title ?? "Untitled Market"),
      side:         String(t.side ?? "BUY"),
      price:        safeNum(t.price),
      shares:       safeNum(t.shares),
    }));

    const totalBalance = safeClients.reduce(
      (sum, c) => sum + c.trade_amount_usd,
      0
    );

    data = {
      clients:         safeClients,
      recentTrades:    safeTrades,
      totalTradeCount: safeNum(count),
      totalBalanceUsd: totalBalance,
    };

    console.log(
      `[dashboard/page] OK — ${safeClients.length} clients, ` +
      `${safeTrades.length} recent trades, ${safeNum(count)} total trades, ` +
      `$${totalBalance.toFixed(2)} balance`
    );
  } catch (err) {
    // Network-level failure or env vars missing entirely.
    console.error(
      "[dashboard/page] FATAL — outer catch reached:",
      err instanceof Error ? err.message : String(err)
    );
    // `data` stays as the empty default → client renders empty states.
  }

  return <DashboardOverviewClient data={data} />;
}