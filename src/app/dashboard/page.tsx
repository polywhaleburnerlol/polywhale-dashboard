/**
 * src/app/dashboard/page.tsx — Overview (Server Component)
 *
 * ── Schema ───────────────────────────────────────────────────────────────────
 * clients:  id | created_at | funder_address | private_key | poly_api_key
 *           poly_secret | poly_passphrase | trade_amount_usd | is_active | label
 * trades:   id | created_at | client_id | asset_id | market_title | side
 *           price | shares | name | order_id | whale_address
 *
 * ── USDC balance ─────────────────────────────────────────────────────────────
 * Fetched live from Polygon via public RPC for each active wallet.
 * Both native USDC (0x3c499c...) and bridged USDC.e (0x2791Bc...) are summed.
 * Falls back to 0 gracefully if the RPC is unreachable.
 */

export const dynamic = "force-dynamic";

import { createSupabaseServerClient } from "../../utils/supabase/server";
import DashboardOverviewClient from "./DashboardOverviewClient";
import type { DashboardData } from "./DashboardOverviewClient";

// ── Polygon USDC contract addresses ─────────────────────────────────────────
const USDC_NATIVE  = "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359"; // native USDC (6 decimals)
const USDC_BRIDGED = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174"; // USDC.e      (6 decimals)

// Multiple public RPCs — tried in order until one succeeds
const POLYGON_RPCS = [
  "https://rpc.ankr.com/polygon",
  "https://polygon.llamarpc.com",
  "https://polygon-bor-rpc.publicnode.com",
  "https://polygon-rpc.com",
];

/**
 * Call ERC-20 balanceOf(address) on Polygon via eth_call.
 * Tries each RPC in POLYGON_RPCS until one returns a valid result.
 * Returns human-readable USD (divided by 1e6). Returns 0 on all failures.
 */
async function fetchUsdcBalance(
  tokenAddress: string,
  walletAddress: string
): Promise<number> {
  // ABI-encode balanceOf(address): 4-byte selector + 32-byte padded address
  const data =
    "0x70a08231" +
    "000000000000000000000000" +
    walletAddress.toLowerCase().replace("0x", "");

  for (const rpc of POLYGON_RPCS) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 6000);

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

      if (json.error) {
        console.warn(`[usdc] RPC ${rpc} returned error:`, json.error.message);
        continue;
      }
      if (!json.result || json.result === "0x" || json.result === "0x0") {
        // Valid response but zero balance — stop trying other RPCs
        return 0;
      }

      const raw = BigInt(json.result);
      const balance = Number(raw) / 1_000_000;
      console.log(`[usdc] ${tokenAddress.slice(0, 8)}… wallet ${walletAddress.slice(0, 8)}… = $${balance.toFixed(2)} via ${rpc}`);
      return balance;
    } catch (err) {
      console.warn(`[usdc] RPC ${rpc} failed:`, err instanceof Error ? err.message : err);
      // Try next RPC
    }
  }

  console.error(`[usdc] All RPCs failed for token ${tokenAddress} wallet ${walletAddress}`);
  return 0;
}

/**
 * Fetch total USDC balance for a wallet (native USDC + USDC.e combined).
 */
async function fetchTotalUsdcForWallet(address: string): Promise<number> {
  if (!address || address.length !== 42) return 0;
  const [native, bridged] = await Promise.all([
    fetchUsdcBalance(USDC_NATIVE, address),
    fetchUsdcBalance(USDC_BRIDGED, address),
  ]);
  console.log(`[usdc] wallet ${address.slice(0, 8)}… total = $${(native + bridged).toFixed(2)} (native=$${native.toFixed(2)} bridged=$${bridged.toFixed(2)})`);
  return native + bridged;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function safeNum(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function safeStr(v: unknown, fallback = ""): string {
  return typeof v === "string" && v.length > 0 ? v : fallback;
}

// ── Page ─────────────────────────────────────────────────────────────────────

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
      .select("id, label, funder_address, trade_amount_usd, is_active")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[dashboard] clients query error:", error.message);
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
      console.error("[dashboard] trades query error:", error.message);
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
      console.error("[dashboard] trades count error:", error.message);
    } else {
      totalTradeCount = safeNum(count);
    }
  } catch (err) {
    console.error("[dashboard] trades count threw:", err);
  }

  /* ── 4. Live USDC balances from Polygon ─────────────────────────────────── */
  // Fetch all wallets in parallel — max 5s each, fail gracefully.
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

  const recentTrades = rawTrades.map((t, i) => ({
    id:           safeStr(t.id, `trade-${i}`),
    created_at:   safeStr(t.created_at, new Date().toISOString()),
    client_id:    safeStr(t.client_id),
    market_title: safeStr(t.market_title, "Untitled Market"),
    side:         safeStr(t.side, "BUY"),
    price:        safeNum(t.price),
    shares:       safeNum(t.shares),
  }));

  // totalBalanceUsd = sum of REAL on-chain USDC across all active wallets
  const totalBalanceUsd = clients.reduce((s, c) => s + c.usdc_balance, 0);

  const payload: DashboardData = {
    clients,
    recentTrades,
    totalTradeCount,
    totalBalanceUsd,
  };

  console.log(
    `[dashboard] OK — ${clients.length} clients, ${recentTrades.length} recent trades, ` +
    `${totalTradeCount} total, $${totalBalanceUsd.toFixed(2)} real USDC balance`
  );

  return <DashboardOverviewClient data={payload} />;
}