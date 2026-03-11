/**
 * src/app/dashboard/page.tsx — Overview (Server Component)
 */

export const dynamic = "force-dynamic";

import { createSupabaseServerClient } from "../../utils/supabase/server";
import DashboardOverviewClient from "./DashboardOverviewClient";
import type { DashboardData } from "./DashboardOverviewClient";

const USDC_NATIVE  = "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359";
const USDC_BRIDGED = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174";

const POLYGON_RPCS = [
  "https://rpc.ankr.com/polygon",
  "https://polygon.llamarpc.com",
  "https://polygon-bor-rpc.publicnode.com",
  "https://polygon-rpc.com",
];

async function fetchUsdcBalance(tokenAddress: string, walletAddress: string): Promise<number> {
  const data =
    "0x70a08231" +
    "000000000000000000000000" +
    walletAddress.toLowerCase().replace("0x", "");

  for (const rpc of POLYGON_RPCS) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 2500);
      const res = await fetch(rpc, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "eth_call",
          params: [{ to: tokenAddress, data }, "latest"],
          id: 1,
        }),
        signal: controller.signal,
      });
      clearTimeout(timer);
      const json = await res.json();
      if (json.error) { console.warn(`[usdc] RPC ${rpc} error:`, json.error.message); continue; }
      if (!json.result || json.result === "0x" || json.result === "0x0") return 0;
      return Number(BigInt(json.result)) / 1_000_000;
    } catch (err) {
      console.warn(`[usdc] RPC ${rpc} failed:`, err instanceof Error ? err.message : err);
    }
  }
  return 0;
}

async function fetchTotalUsdcForWallet(address: string): Promise<number> {
  if (!address || address.length !== 42) return 0;
  const [native, bridged] = await Promise.all([
    fetchUsdcBalance(USDC_NATIVE, address),
    fetchUsdcBalance(USDC_BRIDGED, address),
  ]);
  return native + bridged;
}

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
    totalInvestedUsd: 0,
    chartPoints: [],
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
      .select("id, label, funder_address, trade_amount_usd, is_active")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) console.error("[dashboard] clients query error:", error.message);
    else rawClients = data ?? [];
  } catch (err) {
    console.error("[dashboard] clients query threw:", err);
  }

  // Build a map of client_id → trade_amount_usd for enriching BUY trade rows
  const clientTradeAmount: Record<string, number> = {};
  for (const c of rawClients) {
    clientTradeAmount[c.id] = safeNum(c.trade_amount_usd);
  }

  /* ── 2. Recent trades (display) + all trades (chart) ───────────────────── */
  let rawTrades: any[] = [];
  let allTrades: any[] = [];
  try {
    // Last 5 for the recent activity table
    const { data: recent, error: e1 } = await supabase
      .from("trades")
      .select("id, created_at, client_id, market_title, side, price, shares, outcome")
      .order("created_at", { ascending: false })
      .limit(5);
    if (e1) console.error("[dashboard] trades query error:", e1.message);
    else rawTrades = recent ?? [];

    // All BUY trades in last 30 days for the investment chart
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: all, error: e2 } = await supabase
      .from("trades")
      .select("created_at, side, client_id")
      .eq("side", "BUY")
      .gte("created_at", since)
      .order("created_at", { ascending: true });
    if (e2) console.error("[dashboard] chart trades query error:", e2.message);
    else allTrades = all ?? [];
  } catch (err) {
    console.error("[dashboard] trades query threw:", err);
  }

  /* ── 3. Trade count ─────────────────────────────────────────────────────── */
  let totalTradeCount = 0;
  try {
    const { count, error } = await supabase
      .from("trades")
      .select("id", { count: "exact", head: true });

    if (error) console.error("[dashboard] trades count error:", error.message);
    else totalTradeCount = safeNum(count);
  } catch (err) {
    console.error("[dashboard] trades count threw:", err);
  }

  /* ── 4. Live USDC balances ──────────────────────────────────────────────── */
  const balances = await Promise.all(
    rawClients.map((c) => fetchTotalUsdcForWallet(safeStr(c.funder_address)))
  );

  /* ── 5. Assemble payload ────────────────────────────────────────────────── */
  const clients = rawClients.map((c, i) => ({
    id:               safeStr(c.id, `client-${i}`),
    label:            safeStr(c.label) || `Wallet ${i + 1}`,
    funder_address:   safeStr(c.funder_address),
    trade_amount_usd: safeNum(c.trade_amount_usd),
    is_active:        Boolean(c.is_active),
    usdc_balance:     balances[i] ?? 0,
  }));

  const recentTrades = rawTrades.map((t, i) => {
    const isBuy = (t.side ?? "").toUpperCase() === "BUY";
    // For BUY orders, bot stores shares=null — fall back to client's trade_amount_usd
    const tradeAmountUsd = isBuy
      ? (clientTradeAmount[t.client_id] ?? 0)
      : 0;

    return {
      id:               safeStr(t.id, `trade-${i}`),
      created_at:       safeStr(t.created_at, new Date().toISOString()),
      client_id:        safeStr(t.client_id),
      market_title:     safeStr(t.market_title, "Untitled Market"),
      outcome:          safeStr(t.outcome, "?"),   // ← new: "Yes" or "No"
      side:             safeStr(t.side, "BUY"),
      price:            safeNum(t.price),
      shares:           t.shares != null ? safeNum(t.shares) : null,
      trade_amount_usd: tradeAmountUsd,             // ← new: USD spent on BUY
    };
  });

  const totalBalanceUsd = clients.reduce((s, c) => s + c.usdc_balance, 0);

  /* ── 6. Compute chart points + total invested ───────────────────────────── */
  // Group BUY trades by calendar date, using each client's trade_amount_usd
  const dailySpend: Record<string, number> = {};
  for (const t of allTrades) {
    const day = t.created_at.slice(0, 10); // "YYYY-MM-DD"
    const amt = clientTradeAmount[t.client_id] ?? safeNum(null);
    dailySpend[day] = (dailySpend[day] ?? 0) + amt;
  }

  const sortedDays = Object.keys(dailySpend).sort();
  let cum = 0;
  const chartPoints = sortedDays.map((day) => {
    cum += dailySpend[day];
    const d = new Date(day + "T12:00:00Z");
    const date = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return { date, cumulative: cum, daily: dailySpend[day] };
  });

  const totalInvestedUsd = cum; // final cumulative value

  return (
    <DashboardOverviewClient
      data={{ clients, recentTrades, totalTradeCount, totalBalanceUsd, totalInvestedUsd, chartPoints }}
    />
  );
}